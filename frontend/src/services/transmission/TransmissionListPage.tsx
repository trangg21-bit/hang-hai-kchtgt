import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fmtNum } from "../../utils/numFmt";
import { parseWktToCoordinates, ddToDms } from "../../utils/gisGeometry";
import { usePermissionStore } from "../../store/permissionStore";
import {
  Alert,
  Button,
  DatePicker,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Typography,
} from "antd";
import { OrgUnitTreeSelect } from "../../components/org-unit";
import { organizationService } from "../organizationService";
import {
  PlusOutlined,
  SearchOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Tabs } from "antd";
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from "../../components/shared/InfrastructureAttachmentTab";
import GisLocationSelector from "../../components/gis/GisLocationSelector";
import { DetailTable } from "../../components/shared/DetailTable";
import { useSearchParams } from "react-router-dom";
import {
  fetchTransmissionList,
  fetchTransmissionById,
  deleteTransmission,
  submitTransmission,
  approveTransmissionC1,
  approveTransmissionC2,
  fetchTransmissionHistory,
  fetchTransmissionAttachments,
  downloadTransmissionAttachment,
  generateTransmissionCode,
} from "./api";
import TransmissionForm, { type TransmissionFormRef } from "./TransmissionForm";
import {
  OPERATIONAL_STATUS_OPTIONS,
} from "./schema";
import type { TransmissionResponse, ApprovalRequest } from "./types";
import toast from "../../components/ToastNotification";
import ApprovalModal from "../../components/shared/ApprovalModal";
import { AppDrawer } from "../../components/shared/AppDrawer";
import { canEditApprovalRecord, canDeleteApprovalRecord } from "../../utils/approvalEditPolicy";
import { cellTitleStyle, cellSubtitleStyle } from "../../themetokenchk";
import * as themeTokenChk from "../../themetokenchk";
import { ThemeTokenProvider } from "../../context/ThemeTokenContext";
import { useAuthStore } from "../../store/authStore";
import { deduplicateAttachmentHistoryChanges } from "../../utils/historyAttachmentDedup";
import { gisCoordinatesToLines, gisGeometryTypeLabel, isGisHistoryField } from "../../utils/historyGisFormat";
import EmptyState from "../../components/EmptyState";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { VIETNAM_PROVINCES } from "../../types/common";
import api from "../api";
import { userService } from "../userService";
import type { Symbol as MapSymbolType } from "../symbolService";
import {
  ScreenHeader,
  DataTable,
  Pagination,
  FilterTableLayout,
  SidebarFilterField,
} from "../../components/list-view";

/** Map unitOfMeasure code (Integer) → label cho hiển thị */
const UOM_LABELS: Record<number, string> = {
  1: 'Bộ',
  2: 'Bến',
  3: 'Bản quyền',
  4: 'Chiếc',
  5: 'Cổng',
  6: 'Cái',
  7: 'Cột',
  8: 'Cầu',
  9: 'Đường truyền',
  10: 'Héc-ta',
  11: 'Hạng mục',
  12: 'Hệ thống',
  13: 'Kho',
  14: 'Khu',
  15: 'Ki-lô-mét',
  16: 'Mét',
  17: 'Mét vuông',
  18: 'Nhà',
  19: 'Phòng',
  20: 'Phân hệ',
  21: 'Quả',
  22: 'Tuyến',
  23: 'Tấn',
  24: 'Trạm',
  25: 'Tháp',
  26: 'Trụ',
  27: 'VNĐ',
};

function formatUnitOfMeasure(code: number | null | undefined): string {
  return code != null && UOM_LABELS[code] ? UOM_LABELS[code] : null;
}

import {
  colors,
  fontSizeMd,
  fontSizeLg,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  textPrimary,
  textSecondary,
  textTertiary,
  statusCritical,
  statusAttention,
  statusDraft,
  statusOperational,
  actionPrimary,
  borderDefault,
  surfaceCard,
  radiusPill,
  fontSizeCellTitle,
  fontSans,
  spaceMd,
  spaceFormField,
  spaceSm,
  spaceXs,
  spaceXl,
  DRAWER_TABLE_SCROLL_Y,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  statusBadgeStyle,
  getSidebarDatePickerProps,
  icons,
  statusInfo,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyInfoTitleStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
} from "../../themetokenchk";
import dayjs from "dayjs";


// ── Trạng thái phê duyệt 2 cấp (C1 Cảng vụ → C2 Cục) — đồng bộ /vts-system ──
export function isTransmissionDeleted(record?: Partial<TransmissionResponse> | null): boolean {
  if (!record) return false;
  const anyRec = record as any;
  return Boolean(
    record.deletedAt ||
    record.deletedBy ||
    anyRec.deleted_at ||
    anyRec.deleted_by ||
    record.approvalStatus === 'DELETED' ||
    record.approvalStatus === 'ARCHIVED'
  );
}

const APPROVAL_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
  APPROVED: 'Đã phê duyệt',
  REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
  REJECTED_LEVEL2: 'Từ chối cấp cục',
  DELETED: 'Đã xóa',
  ARCHIVED: 'Đã xóa',
};

const APPROVAL_COLOR: Record<string, string> = {
  DRAFT: statusDraft,
  PENDING_APPROVAL: statusAttention,
  APPROVED_LEVEL1: statusInfo,
  APPROVED: statusOperational,
  REJECTED_LEVEL1: statusCritical,
  REJECTED_LEVEL2: statusCritical,
  DELETED: statusCritical,
  ARCHIVED: statusCritical,
};

/* ── Shared list/detail UI tokens — aligned with Port list-view ───────── */
const pillStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  fontFamily: fontSans,
};

// ── Detail-page helpers (aligned with PortDetailPage) ────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch { return dateStr; }
}

/** Badge hiển thị giống chuẩn bến cảng: span pill + semantic token */
function renderTransmissionStatusBadge(b: { color: string; label: string }) {
  let c = textTertiary;
  if (b.color === 'green') c = statusOperational;
  else if (b.color === 'red') c = statusCritical;
  else if (b.color === 'orange') c = statusAttention;
  return <span className="kcht-cell-badge" style={statusBadgeStyle(c)}>{b.label}</span>;
}

/** Badge trạng thái phê duyệt 2 cấp — dùng APPROVAL_STATUS_MAP + APPROVAL_COLOR (quy chuẩn AGENTS.md) */
function renderApprovalBadge(status: string | null | undefined, record?: Partial<TransmissionResponse> | null) {
  if (isTransmissionDeleted(record) || status === 'DELETED' || status === 'ARCHIVED') {
    return <span className="kcht-cell-badge" style={statusBadgeStyle(statusCritical)}>Đã xóa</span>;
  }
  if (!status) return <span style={{ color: textTertiary, fontSize: fontSizeMd }}>—</span>;
  const display = APPROVAL_STATUS_MAP[status] || status;
  const color = APPROVAL_COLOR[status] || textTertiary;
  return <span className="kcht-cell-badge" style={statusBadgeStyle(color)}>{display}</span>;
}


const tableValueStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
};

const tableMetaStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
};

// ── Card/section trong Drawer Xem chi tiết — đồng bộ chuẩn /berth (BerthDetailContent) ──
const transmissionDetailSectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '12px 18px 8px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const transmissionDetailSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const transmissionDetailSectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeCellTitle,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

/** Suy luận loại hình học từ WKT khi response không trả geometryType chuẩn */
const inferGeometryTypeFromWkt = (wkt?: string | null): 'POINT' | 'LINE' | 'POLYGON' => {
  if (!wkt) return 'POINT';
  const u = String(wkt).toUpperCase().trim();
  if (u.startsWith('LINESTRING') || u.startsWith('LINE ')) return 'LINE';
  // MULTIPOINT dữ liệu legacy chứa các đỉnh vùng → hiển thị như POLYGON (chuẩn gisGeometry)
  if (u.startsWith('POLYGON') || u.startsWith('MULTIPOINT') || u.startsWith('MULTIPOLYGON') || u.startsWith('MULTILINESTRING')) return 'POLYGON';
  return 'POINT';
};


const TransmissionListPage = () => {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get("action");
  const linkedRecordId = searchParams.get("id");
  const isIframeModal = window.parent !== window.self;
  const isMapLinkedView = isIframeModal && (linkedAction === "edit" || linkedAction === "detail");
  const handledLinkedRecordRef = useRef<string | null>(null);

  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [data, setData] = useState<TransmissionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "0", 10);
    return isNaN(p) || p < 0 ? 0 : p;
  });
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [inputDeviceName, setInputDeviceName] = useState("");
  const [inputDeviceCode, setInputDeviceCode] = useState("");
  const [filterDeviceName, setFilterDeviceName] = useState("");
  const [filterDeviceCode, setFilterDeviceCode] = useState("");
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState({
    orgUnitId: "" as string,
    operationalStatus: undefined as number | undefined,
    approvalStatus: "" as string,
    province: "" as string,
    vtsSystemId: "" as string,
    attachedInfraType: undefined as number | undefined,
    attachedInfraId: "" as string | undefined,
    yearOfUse: undefined as number | undefined,
    updatedFrom: "" as string | undefined,
    updatedTo: "" as string | undefined,
  });

  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);

  // Tab counts for approval status filter
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [totalAll, setTotalAll] = useState(0);
  const fetchTabCounts = useCallback(async () => {
    const statuses = [
      { key: "DRAFT", status: "DRAFT" },
      { key: "PENDING_APPROVAL", status: "PENDING_APPROVAL" },
      { key: "APPROVED_LEVEL1", status: "APPROVED_LEVEL1" },
      { key: "APPROVED", status: "APPROVED" },
      { key: "REJECTED_LEVEL1", status: "REJECTED_LEVEL1" },
      { key: "REJECTED_LEVEL2", status: "REJECTED_LEVEL2" },
      { key: "DELETED", status: "DELETED" },
    ];
    const results = await Promise.allSettled(
      statuses.map((s) =>
        fetchTransmissionList({
          page: 0,
          size: 1,
          orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__'
                          ? filterValues.orgUnitId
                          : undefined),
          deviceName: filterDeviceName.trim() || undefined,
          approvalStatus: s.status,
        })
      )
    );
    const counts: Record<string, number> = {};
    results.forEach((r, i) => {
      counts[statuses[i].key] = r.status === "fulfilled" ? (r.value?.totalElements ?? 0) : 0;
    });
    setTabCounts(counts);
    // Tất cả = Lưu tạm + Chờ Cảng vụ + Chờ Cục + Đã phê duyệt + Từ chối + Đã xóa
    setTotalAll(
      (counts.DRAFT ?? 0) +
        (counts.PENDING_APPROVAL ?? 0) +
        (counts.APPROVED_LEVEL1 ?? 0) +
        (counts.APPROVED ?? 0) +
        (counts.REJECTED_LEVEL1 ?? 0) +
        (counts.REJECTED_LEVEL2 ?? 0) +
        (counts.DELETED ?? 0)
    );
  }, [filterValues.orgUnitId, filterDeviceName]);

  // Org units — đồng bộ 100% chuẩn /radar-station (load tree từ organizationService)
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const orgUnitOptions = orgUnits;
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Symbols
  const [symbols, setSymbols] = useState<MapSymbolType[]>([]);
  const [, setLoadingSymbols] = useState(false);


  // Attached infrastructure type options
  const attachedInfraTypeOptions = [
    { label: 'Trung Tâm Điều Hành VTS', value: 1 },
    { label: 'Trạm Radar', value: 2 },
  ];

  // Radar station options for dependent dropdown
  const [radarStationOptions, setRadarStationOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingRadars, setLoadingRadars] = useState(false);

  const fetchRadarStations = useCallback(async () => {
    setLoadingRadars(true);
    try {
      const res = await api.get("/common/options/radar-stations");
      const items = res.data?.data;
      setRadarStationOptions(
        (Array.isArray(items) ? items : []).map((s: { id: string; stationName?: string; code?: string }) => ({
          label: s.stationName || s.code || s.id,
          value: s.id,
        }))
      );
    } catch (error) {
      console.error("Lỗi tải danh sách trạm Radar:", error);
      setRadarStationOptions([]);
    } finally {
      setLoadingRadars(false);
    }
  }, []);

  useEffect(() => {
    fetchRadarStations();
  }, [fetchRadarStations]);

  // VTS Operation Center options for dependent dropdown (Thuộc TTDH VTS — loại 1)
  const [vtsOperationCenterOptions, setVtsOperationCenterOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingVtsCenters, setLoadingVtsCenters] = useState(false);

  const fetchVtsOperationCenters = useCallback(async () => {
    setLoadingVtsCenters(true);
    try {
      const res = await api.get("/common/options/vts-operation-centers");
      const items = res.data?.data;
      setVtsOperationCenterOptions(
        (Array.isArray(items) ? items : []).map((s: { id: string; name?: string; code?: string }) => ({
          label: s.name || s.code || s.id,
          value: s.id,
        }))
      );
    } catch (error) {
      console.error("Lỗi tải danh sách Trung tâm điều hành VTS:", error);
      setVtsOperationCenterOptions([]);
    } finally {
      setLoadingVtsCenters(false);
    }
  }, []);

  useEffect(() => {
    fetchVtsOperationCenters();
  }, [fetchVtsOperationCenters]);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailFiles, setDetailFiles] = useState<InfrastructureAttachmentItem[]>([]);
  const [detailFilesLoading, setDetailFilesLoading] = useState(false);

  // ── Danh bạ người dùng → map UUID sang tên cho cột "Người tải lên" (chuẩn /berth, /beacon-stations) ──
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        if (disposed) return;
        const next = new Map<string, string>();
        users.forEach((u: any) => next.set(u.id, u.fullName || u.username || u.id));
        setUserMap(next);
      } catch {
        /* giữ map rỗng nếu không lấy được danh bạ */
      }
    })();
    return () => { disposed = true; };
  }, []);

  const [selectedRecord, setSelectedRecord] = useState<TransmissionResponse | null>(
    null
  );

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<TransmissionResponse | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TransmissionResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<TransmissionResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Create drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const createFormRef = useRef<TransmissionFormRef>(null);

  // Update drawer
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<TransmissionResponse | null>(null);
  const [updateForm] = Form.useForm();
  const editFormRef = useRef<TransmissionFormRef>(null);

  const handleOpenCreate = useCallback(() => {
    if (!hasPerm?.("transmission:create")) {
      toast.warning("Bạn không có quyền thêm mới hệ thống truyền dẫn");
      return;
    }
    createForm.resetFields();
    createForm.setFieldsValue({
      operationalStatus: 0,
      orgUnitId: currentUser?.orgUnitId || defaultOrgUnitId.current,
    });
    setCreateModalOpen(true);
    void generateTransmissionCode()
      .then((code) => {
        if (code) {
          createForm.setFieldsValue({ deviceCode: code });
        }
      })
      .catch(() => {});
  }, [createForm, hasPerm]);

  // Submit action & loading
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve'>('draft');
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const [submitting, setSubmitting] = useState(false);

  // "Lưu và phê duyệt" chỉ dành cho tài khoản có quyền duyệt cấp Cục (chuẩn VTS).
  const canSaveAndApprove = !!hasPerm?.("transmission:approvec2");

  // Modal bản đồ GIS xem chi tiết
  const [mapScope, setMapScope] = useState<'detail' | null>(null);

  const handleDownloadAttachmentItem = useCallback(async (attId: string, fileName?: string) => {
    const downloadName = fileName || 'file';
    const targetId = selectedRecord?.id;
    if (!targetId) {
      toast.error('Không thể tải xuống tệp đính kèm');
      return;
    }
    try {
      await downloadTransmissionAttachment(targetId, attId, downloadName);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  }, [selectedRecord?.id]);

  // ── Map modal GIS chi tiết (chuẩn /berth: 90vw GisLocationSelector) ──
  const mapGeometryType = selectedRecord
    ? (selectedRecord.geometryType && ['POINT', 'LINE', 'POLYGON'].includes(selectedRecord.geometryType)
      ? selectedRecord.geometryType
      : inferGeometryTypeFromWkt(selectedRecord.coordinates))
    : 'POINT';
  const mapWkt = selectedRecord?.coordinates || '';

  // Submissions
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<TransmissionResponse | null>(
    null
  );
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── History modal (chuẩn /berth) ──────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<TransmissionResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyReloadToken, setHistoryReloadToken] = useState(0);

  const historyFieldCount = useMemo(
    () => (Array.isArray(historyRecords) ? historyRecords : []).length,
    [historyRecords]
  );

  const openHistory = useCallback((r: TransmissionResponse) => {
    if (!hasPerm?.("transmission:history") && !hasPerm?.("transmission:read") && !hasPerm?.("data:read")) {
      toast.warning("Bạn không có quyền xem lịch sử hệ thống truyền dẫn");
      return;
    }
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryRecords([]);
    setHistorySearchInput('');
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    setHistoryReloadToken((t) => t + 1);
  }, [hasPerm]);

  // Load history khi mở Drawer hoặc thay đổi bộ lọc tìm kiếm/ngày
  useEffect(() => {
    if (!historyOpen || !historyTarget) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setHistoryLoading(true);
      try {
        const list = await fetchTransmissionHistory(historyTarget.id, undefined, undefined, {
          keyword: historySearch,
          fromDate: historyFrom,
          toDate: historyTo,
        });
        if (cancelled) return;
        setHistoryRecords(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }, historySearch.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [historyOpen, historyTarget, historySearch, historyFrom, historyTo, historyReloadToken]);

  const [detailsSpecsOpen, setDetailsSpecsOpen] = useState(true);
  const [detailApprovalOpen, setDetailApprovalOpen] = useState(true);
  const [operationCardOpen, setOperationCardOpen] = useState(true);
  const [maintenanceCardOpen, setMaintenanceCardOpen] = useState(true);
  const [incidentCardOpen, setIncidentCardOpen] = useState(true);

  // ── History map helpers ────────────────────────────────────────
  const symbolMap = useMemo(() => {
    const m = new Map<string, string>();
    (symbols || []).forEach((s) => m.set(s.id, s.name || s.id));
    return m;
  }, [symbols]);

  const symbolImageMap = useMemo(() => {
    const m = new Map<string, string>();
    (symbols || []).forEach((s) => {
      if (s.image) m.set(s.id, s.image);
    });
    return m;
  }, [symbols]);

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    const build = (items: Array<{ id: string; name: string; parentId?: string; children?: Array<{ id: string; name: string }> }>) => {
      for (const item of items) {
        m.set(item.id, item.name || item.id);
        if (item.children) build(item.children);
      }
    };
    build(orgUnits || []);
    return m;
  }, [orgUnits]);

  // Danh mục VTS & Trạm radar cho historyFieldValue
  const [vtsOperationCenters, setVtsOperationCenters] = useState<Array<{ id: string; name?: string }>>([]);
  const [radarStations, setRadarStations] = useState<Array<{ id: string; stationName?: string; name?: string }>>([]);

  useEffect(() => {
    let disposed = false;
    api.get('/common/options/vts-operation-centers')
      .then((r) => {
        if (disposed) return;
        const items = r.data?.data;
        setVtsOperationCenters(Array.isArray(items) ? items : []);
      })
      .catch(() => {});

    api.get('/common/options/radar-stations')
      .then((r) => {
        if (disposed) return;
        const items = r.data?.data;
        setRadarStations(Array.isArray(items) ? items : []);
      })
      .catch(() => {});

    return () => {
      disposed = true;
    };
  }, []);

  const vtsCenterMap = useMemo(() => {
    const m = new Map<string, string>();
    vtsOperationCenters.forEach((v) => {
      if (v.id) m.set(v.id, v.name || v.id);
    });
    return m;
  }, [vtsOperationCenters]);

  const radarStationMap = useMemo(() => {
    const m = new Map<string, string>();
    radarStations.forEach((r) => {
      if (r.id) m.set(r.id, r.stationName || r.name || r.id);
    });
    return m;
  }, [radarStations]);

  // Sorting
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const handleSort = useCallback((field: string, order: "asc" | "desc") => {
    setSortField(field);
    setSortOrder(order === "asc" ? "ascend" : "descend");
    setPage(0);
  }, []);

  const columns = useMemo(
    () => {
      // Cột dạng "Cán bộ/Ngày": dòng 1 = tên (đậm), dòng 2 = ngày (màu phụ)
      const renderInfoStack = (name: string | null | undefined, date: string | null | undefined) => (
        <div style={{ lineHeight: "1.35", overflow: "hidden" }}>
          <div
            title={name || null}
            style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {name || null}
          </div>
          <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: "nowrap" }}>
            {date ? dayjs(date).format("DD/MM/YYYY HH:mm:ss") : "—"}
          </div>
        </div>
      );
      return [
      {
        key: "index",
        label: "STT",
        width: 60,
        type: "mono" as const,
        align: "center" as const,
        fixed: "left" as const,
        render: (_: unknown, __: TransmissionResponse, index: number) => (
          <span style={{ ...tableMetaStyle, fontWeight: fontWeightMedium }}>
            {page * pageSize + index + 1}
          </span>
        ),
      },
      {
        key: "deviceName",
        label: "Tên / Mã thiết bị",
        dataIndex: "deviceName",
        width: 300,
        fixed: "left" as const,
        sortable: true,
        sortOrder: sortField === "deviceName" ? sortOrder : null,
        ellipsis: false,
        render: (val: string, record: TransmissionResponse) => (
          <div style={{ minWidth: 0 }}>
            {hasPerm?.("transmission:read") ? (
              <button
                type="button"
                className="kcht-cell-title"
                onClick={() => {
                  setSelectedRecord(record);
                  setDetailDrawerOpen(true);
                }}
                style={{ ...cellTitleStyle, background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: "inherit", width: "100%" }}
                title={val || null}
              >
                {val || null}
              </button>
            ) : (
              <span
                className="kcht-cell-title"
                style={{ ...cellTitleStyle, cursor: "default", width: "100%", display: "inline-block" }}
                title={val || null}
              >
                {val || null}
              </span>
            )}
            <span className="kcht-cell-code" style={{ ...cellSubtitleStyle }}>{record.deviceCode || null}</span>
          </div>
        ),
      },
      {
        key: "orgUnitName",
        label: "Đơn vị quản lý",
        dataIndex: "orgUnitName",
        width: 260,
        render: (val: string) => (
          <span style={{ ...tableMetaStyle, fontWeight: fontWeightBold }}>{val || null}</span>
        ),
      },
      {
        key: "vtsSystemName",
        label: "Thuộc TTDH VTS/Trạm Radar",
        dataIndex: "attachedInfrastructureName",
        width: 280,
        render: (val: string) => (
          <span style={tableMetaStyle}>{val || null}</span>
        ),
      },
      {
        key: "operatingUnitName",
        label: "Đơn vị khai thác",
        dataIndex: "operatingUnitName",
        width: 260,
        render: (val: string) => (
          <span style={tableMetaStyle}>{val || null}</span>
        ),
      },
      {
        key: "provinceName",
        label: "Địa điểm\n(Tỉnh/Thành phố)",
        dataIndex: "provinceName",
        width: 220,
        ellipsis: false,
        render: (val: string) => (
          <span style={tableMetaStyle}>{val || null}</span>
        ),
      },
      {
        key: "unitOfMeasure",
        label: "Đơn vị tính",
        dataIndex: "unitOfMeasure",
        width: 130,
        render: (val: number) => (
          <span style={tableMetaStyle}>{formatUnitOfMeasure(val)}</span>
        ),
      },
      {
        key: "quantity",
        label: "Số lượng",
        dataIndex: "quantity",
        width: 140,
        type: "number" as const,
        align: "center" as const,
        render: (val: number) => (
          <span style={{ ...tableValueStyle, fontWeight: fontWeightMedium }}>
            {fmtNum(val)}
          </span>
        ),
      },
      {
        key: "yearOfUse",
        label: "Năm đưa vào sử dụng",
        dataIndex: "yearOfUse",
        width: 220,
        type: "mono" as const,
        align: "center" as const,
        ellipsis: false,
        render: (val: number) => (
          <span style={tableMetaStyle}>{val || null}</span>
        ),
      },
      {
        key: "updatedByName",
        label: "Cán bộ cập nhật",
        dataIndex: "updatedByName",
        width: 200,
        sortable: true,
        sortOrder: sortField === "updatedAt" || sortField === "updatedByName" ? sortOrder : null,
        render: (_: unknown, record: TransmissionResponse) => renderInfoStack(record.updatedByName, record.updatedAt),
      },
      {
        key: "submittedInfo",
        label: "Cán bộ gửi phê duyệt",
        dataIndex: "submittedByName",
        width: 230,
        render: (_: unknown, record: TransmissionResponse) => renderInfoStack(record.submittedByName, record.submittedDate),
      },
      {
        key: "approvedLevel1Info",
        label: "Cán bộ phê duyệt cấp Cảng vụ/Chi cục",
        dataIndex: "approverLevel1Name",
        width: 380,
        render: (_: unknown, record: TransmissionResponse) => renderInfoStack(record.approverLevel1Name, record.approvedDateLevel1),
      },
      {
        key: "approvedLevel2Info",
        label: "Cán bộ phê duyệt cấp Cục",
        dataIndex: "approverLevel2Name",
        width: 270,
        render: (_: unknown, record: TransmissionResponse) => renderInfoStack(record.approverLevel2Name, record.approvedDateLevel2),
      },
      {
        key: "operationalStatus",
        label: "Tình trạng",
        dataIndex: "operationalStatus",
        width: 270,
        type: "status" as const,
        render: (val: number | string) => {
          const map: Record<string, { color: string; label: string }> = {
            "NOT_YET_OPERATIONAL": { color: statusAttention, label: "Chưa khai thác/vận hành" },
            "OPERATIONAL": { color: statusOperational, label: "Đang khai thác/vận hành" },
            "SUSPENDED": { color: statusCritical, label: "Dừng khai thác/vận hành" },
          };
          const s = map[String(val || "").toUpperCase()] || {
            color: textTertiary,
            label: String(val || "—"),
          };
          return (<span style={statusBadgeStyle(s.color)}>{s.label}</span>);
        },
      },
      {
        key: "approvalStatus",
        label: "Trạng thái",
        dataIndex: "approvalStatus",
        width: 180,
        type: "status" as const,
        render: (val: string, record: TransmissionResponse) => {
          const isDeleted = isTransmissionDeleted(record);
          return renderApprovalBadge(val, isDeleted);
        },
      },
    ];
    },
    [page, pageSize, sortField, sortOrder, hasPerm]
  );

  // ── History helpers ────────────────────────────────────────────────
  const historyFieldLabels: Record<string, string> = {
    deviceCode: 'Mã thiết bị',
    deviceName: 'Tên thiết bị',
    manufacturer: 'Hãng sản xuất',
    model: 'Model',
    quantity: 'Số lượng',
    orgUnitId: 'Đơn vị quản lý',
    operatingUnitId: 'Đơn vị khai thác',
    provinceName: 'Tỉnh/Thành phố',
    detailedLocation: 'Địa điểm chi tiết',
    attachedInfrastructureType: 'Loại hạ tầng',
    attachedInfrastructureId: 'Thuộc hạ tầng',
    unitOfMeasure: 'Đơn vị tính',
    yearOfUse: 'Năm đưa vào sử dụng',
    operationalStatus: 'Trạng thái hoạt động',
    approvalStatus: 'Trạng thái phê duyệt',
    specifications: 'Thông số kỹ thuật',
    maintenanceInformation: 'Thông tin bảo trì',
    note: 'Ghi chú',
    objectType: 'Loại đối tượng',
    mapSymbolId: 'Biểu tượng',
    coordinateSystem: 'Hệ quy chiếu',
    displayRule: 'Quy tắc hiển thị',
    'Lý do từ chối': 'Lý do từ chối',
    'Trạng thái': 'Hành động',
  };

  function historyFieldName(fn: string): string {
    return historyFieldLabels[fn] || fn;
  }
  function historyFieldValue(
    fn: string,
    val: string | null,
    orgMap?: Map<string, string>,
    symbolMap?: Map<string, string>,
    vtsMap?: Map<string, string>,
    radarMap?: Map<string, string>
  ): string {
    if (!val || val === '(null)' || val === 'null') return '(trống)';
    if ((fn === 'orgUnitId' || fn === 'Đơn vị quản lý') && orgMap) {
      const full = orgMap.get(val);
      return full ? full.split(' - ').pop() || full : val;
    }
    if ((fn === 'operatingUnitId' || fn === 'Đơn vị khai thác') && orgMap) {
      const full = orgMap.get(val);
      return full ? full.split(' - ').pop() || full : val;
    }
    if ((fn === 'mapSymbolId' || fn === 'Biểu tượng' || fn === 'Biểu tượng bản đồ') && symbolMap) {
      return symbolMap.get(val) || val;
    }
    if (fn === 'attachedInfrastructureType' || fn === 'Loại hạ tầng' || fn === 'Thuộc loại hạ tầng') {
      if (val === '1' || val === 'TTDH VTS') return 'TTDH VTS';
      if (val === '2' || val === 'Trạm Radar') return 'Trạm Radar';
      return val;
    }
    if (fn === 'attachedInfrastructureId' || fn === 'Thuộc hạ tầng' || fn === 'Hạ tầng phụ thuộc') {
      if (vtsMap?.has(val)) return vtsMap.get(val)!;
      if (radarMap?.has(val)) return radarMap.get(val)!;
      return val;
    }
    if (fn === 'approvalStatus' || fn === 'Trạng thái phê duyệt') {
      // Mã legacy (dữ liệu cũ) quy đổi về mã chuẩn 7 trạng thái rồi tra nhãn dùng chung.
      const ALIAS: Record<string, string> = {
        NHAP: 'DRAFT',
        PROPOSED: 'PENDING_APPROVAL',
        PENDING: 'PENDING_APPROVAL',
        CHO_PHE_DUYET: 'PENDING_APPROVAL',
        CHO_PD_CAP_CUC: 'APPROVED_LEVEL1',
        APPROVED_L1: 'APPROVED_LEVEL1',
        APPROVED_LEVEL2: 'APPROVED',
        APPROVED_L2: 'APPROVED',
        DA_PHE_DUYET: 'APPROVED',
        DUC_PHI_DUYET: 'APPROVED',
        REJECTED: 'REJECTED_LEVEL1',
        TU_CHOI: 'REJECTED_LEVEL1',
      };
      const m: Record<string, string> = {
        DRAFT: 'Lưu tạm',
        PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
        APPROVED_LEVEL1: 'Chờ Cục duyệt',
        APPROVED: 'Đã duyệt',
        REJECTED_LEVEL1: 'Bị Cảng vụ trả về',
        REJECTED_LEVEL2: 'Bị Cục trả về',
      };
      const norm = ALIAS[String(val || '').trim().toUpperCase()] || String(val || '').trim().toUpperCase();
      return m[norm] || val;
    }
    if (fn === 'operationalStatus' || fn === 'Trạng thái hoạt động' || fn === 'Tình trạng hoạt động') {
      const m: Record<string, string> = {
        '0': 'Chưa khai thác/vận hành',
        '1': 'Đang khai thác/vận hành',
        '2': 'Dừng khai thác/vận hành',
        NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
        OPERATIONAL: 'Đang khai thác/vận hành',
        SUSPENDED: 'Dừng khai thác/vận hành',
      };
      return m[val] || val;
    }
    if (fn === 'unitOfMeasure' || fn === 'Đơn vị tính') {
      return formatUnitOfMeasure(Number(val));
    }
    if (fn === 'coordinateSystem' || fn === 'Hệ quy chiếu') {
      const m: Record<string, string> = { '1': 'WGS 84', '2': 'VN-2000', '4326': 'WGS 84' };
      return m[String(val)] || val;
    }
    if (fn === 'objectType' || fn === 'geometryType' || fn === 'Loại đối tượng' || fn === 'Loại đối tượng GIS') {
      if (val === 'POINT' || val === '1') return 'Đối tượng điểm';
      if (val === 'LINE' || val === 'LINESTRING' || val === '2') return 'Đối tượng đường';
      if (val === 'POLYGON' || val === '3') return 'Đối tượng vùng';
      return val;
    }
    if (fn === 'changedAt' || fn === 'createdAt') {
      try { return dayjs(val).format('DD/MM/YYYY HH:mm:ss'); } catch { return val; }
    }
    return val;
  }

  const resolveHistoryActionMeta = (group: any, changes: any[]): { label: string; color: string; bg: string } => {
    const item = group.items?.[0] || {};
    const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
    const rawReason = String(item?.reason ?? item?.ghiChu ?? item?.note ?? '').toLowerCase();
    const level = Number(item?.approvalLevel || 0);

    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
      return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
    }

    if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len')) {
      return { label: 'Tải lên tệp', color: statusInfo, bg: `${statusInfo}18` };
    }
    if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xoa tai lieu') || rawReason.includes('xóa tệp')) {
      return { label: 'Xóa tệp', color: statusAttention, bg: `${statusAttention}18` };
    }

    if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa') || rawReason.includes('cap nhat')) {
      return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
    }

    // Ưu tiên lý do ghi sẵn cho hành động duyệt/từ chối (chuẩn VTS CHK)
    if (rawReason.includes('phê duyệt cấp cảng vụ') || rawReason.includes('phe duyet cap cang vu')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (rawReason.includes('phê duyệt cấp cục') || rawReason.includes('phe duyet cap cuc') || rawReason.includes('cục phê duyệt') || rawReason.includes('cuc phe duyet')) {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (rawReason.includes('từ chối cấp cảng vụ') || rawReason.includes('tu choi cap cang vu')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (rawReason.includes('từ chối cấp cục') || rawReason.includes('tu choi cap cuc') || rawReason.includes('cục từ chối') || rawReason.includes('cuc tu choi')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }

    const stChange = changes.find((c: any) => c.field === 'Trạng thái' || c.field === 'approvalStatus');
    if (stChange) {
      const nv = String(stChange.newValue || '').toLowerCase();
      if (nv.includes('approved_level1') || nv.includes('cuc duyet') || nv === 'cho cuc duyet') {
        return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
      }
      if (nv === 'da duyet' || nv.includes('approved')) {
        return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
      }
      if (nv.includes('tu choi') || nv.includes('rejected')) {
        return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
      }
      if (nv.includes('cho cang vu duyet') || nv.includes('pending') || nv.includes('proposed') || nv.includes('luu tam') || nv.includes('nhap')) {
        return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
      }
    }

    if (level === 1 || String(item?.approvalLevel).includes('LEVEL_1') || String(item?.approvalLevel).includes('C1')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (level === 2 || String(item?.approvalLevel).includes('LEVEL_2') || String(item?.approvalLevel).includes('C2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (rawStatus === 'SUBMITTED' || rawStatus === 'PENDING' || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet') || rawReason.includes('gửi phê duyệt')) {
      return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
    }
    if (rawStatus === 'DELETED' || rawStatus === 'DELETE' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
      return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
    }

    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  };

  const renderTransmissionHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort(
      (a: any, b: any) =>
        new Date(historyTimestamp(b) || 0).getTime() -
        new Date(historyTimestamp(a) || 0).getTime()
    );
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];

    for (const r of sorted) {
      if (q) {
        const fn = (historyField(r) || '').toLowerCase();
        const ov = (historyOldValue(r) || '').toLowerCase();
        const nv = (historyNewValue(r) || '').toLowerCase();
        const lb = historyFieldName(historyField(r) || '').toLowerCase();
        const od = historyFieldValue(historyField(r), historyOldValue(r), orgMap, symbolMap, vtsCenterMap, radarStationMap).toLowerCase();
        const nd = historyFieldValue(historyField(r), historyNewValue(r), orgMap, symbolMap, vtsCenterMap, radarStationMap).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue;
      }
      if (historyFrom || historyTo) {
        const cd = historyTimestamp(r);
        if (historyFrom && cd.substring(0, 10) < historyFrom) continue;
        if (historyTo && cd.substring(0, 10) > historyTo) continue;
      }
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      if (prev && prev.tsSec === sec && prev.actor === actor) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, items: [r] });
      }
    }

    if (groups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
            {q || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
          </div>
        </div>
      );
    }

    const fmtTime = (ts: string) => {
      const d = new Date(ts);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };

    return (
      <div>
        {groups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const orgId = rec0.orgUnitId || selectedRecord?.orgUnitId;
          const orgName = orgId ? orgMap.get(orgId) : undefined;
          const unitName =
            (rec0.orgUnitName || rec0.unitName) ||
            (orgName ? (orgName.split(' - ').pop() || orgName) : undefined) ||
            selectedRecord?.orgUnitName ||
            'Cục Hàng hải Việt Nam';
          const changes = deduplicateAttachmentHistoryChanges(
            g.items.flatMap((item: any) => {
              const fn = historyField(item);
              return fn ? [{ field: fn, oldValue: historyOldValue(item), newValue: historyNewValue(item) }] : [];
            })
          );
          const isCreate = changes.every(
            (c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === ''
          );
          const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
          const orderedChanges = [...changes]
            .sort((a: any, b: any) => {
              const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
              const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
              return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
            })
            .filter(
              (c: any) => c.field !== 'infrastructureList' && c.field !== 'attachments' && c.field !== 'spatialId'
            );

          const formatHistoryValue = (fn: string, raw: string | null) => {
            if (raw === null || raw === '(null)' || raw === '') return null;
            // GIS: nhãn loại đối tượng + tọa độ DMS nhiều dòng (chuẩn /cctv)
            const gisKey = String(fn || '').toLowerCase();
            if (gisKey.includes('loai doi tuong') || gisKey.includes('loại đối tượng') || gisKey.includes('geometrytype')) {
              return gisGeometryTypeLabel(raw);
            }
            if (gisKey.includes('toa do') || gisKey.includes('tọa độ') || gisKey.includes('coordinates')) {
              const coords = gisCoordinatesToLines(raw);
              if (coords != null) return coords;
            }
            const t = raw.trim();
            if (t.startsWith('[') && t.endsWith(']')) {
              if (t === '[]') return 'Không có';
              const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
              return `${parts.length} công trình hạ tầng`;
            }
            if (/^-?\d+(\.\d+)?$/.test(t)) {
              return fmtNum(t);
            }
            return historyFieldValue(fn, raw, orgMap, symbolMap, vtsCenterMap, radarStationMap);
          };

          if (orderedChanges.length === 0) return null;
          const am = resolveHistoryActionMeta(g, changes);
          const barColor = am.color;

          return (
            <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                  <Typography.Text style={historyTimeStyle}>
                    {g.ts ? fmtTime(g.ts) : null}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: fontSizeSm + 1,
                        fontWeight: fontWeightMedium,
                        background: am.bg,
                        color: am.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {am.label}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                  <Typography.Text style={historyMetaRowStyle}>
                    Người cập nhật: {g.actor || null}
                  </Typography.Text>
                  <Typography.Text style={historyMetaRowStyle}>
                    Đơn vị: {unitName}
                  </Typography.Text>
                </div>
              </div>
              <div style={historyInfoCardStyle}>
                <div style={historyAccentBarStyle(barColor)} />
                <Typography.Text style={historyInfoTitleStyle}>
                  {informationTitle}
                </Typography.Text>
                {orderedChanges.length > 0 ? (
                  <div>
                    {orderedChanges.map((change, ri: number) => {
                      const fn = change.field;
                      const ov = formatHistoryValue(fn, change.oldValue);
                      const nv = formatHistoryValue(fn, change.newValue);
                      const renderCell = (rawVal: string | null) => {
                        if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                          const img = symbolImageMap.get(rawVal);
                          const name = symbolMap.get(rawVal) || rawVal;
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
                              {name}
                            </span>
                          );
                        }
                        return null;
                      };
                      return isCreate ? (
                        <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                          <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : null}</div>
                          <span title={nv ?? null} style={{ ...historyNewValueStyle, ...(isGisHistoryField(fn) ? { whiteSpace: 'pre-line', lineHeight: 1.5 } : {}) }}>
                            {renderCell(change.newValue) ?? (nv ?? null)}
                          </span>
                        </div>
                      ) : (
                        <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                          <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : null}</div>
                          <span title={ov ?? null} style={{ ...historyOldValueStyle, ...(isGisHistoryField(fn) ? { whiteSpace: 'pre-line', lineHeight: 1.5 } : {}) }}>
                            {renderCell(change.oldValue) ?? (ov ?? null)}
                          </span>
                          <span style={historyArrowStyle}>→</span>
                          <span title={nv ?? null} style={{ ...historyNewValueStyle, ...(isGisHistoryField(fn) ? { whiteSpace: 'pre-line', lineHeight: 1.5 } : {}) }}>
                            {renderCell(change.newValue) ?? (nv ?? null)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>
                    Không có thông tin chi tiết
                  </Typography.Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const openUpdateDrawer = useCallback((record: TransmissionResponse) => {
    if (!canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: "transmission" })) {
      toast.warning("Bạn không có quyền chỉnh sửa hệ thống truyền dẫn này");
      return;
    }
    setUpdateTarget(record);
    setUpdateModalOpen(true);
  }, [hasPerm]);

  useEffect(() => {
    if (!isMapLinkedView || !linkedRecordId || !linkedAction) return;

    const requestKey = `${linkedAction}:${linkedRecordId}`;
    if (handledLinkedRecordRef.current === requestKey) return;
    handledLinkedRecordRef.current = requestKey;

    let active = true;
    void fetchTransmissionById(linkedRecordId)
      .then((record) => {
        if (!active) return;
        if (linkedAction === "edit") {
          openUpdateDrawer(record);
        } else {
          if (!hasPerm?.("transmission:read")) {
            toast.warning("Bạn không có quyền xem chi tiết hệ thống truyền dẫn");
            return;
          }
          setSelectedRecord(record);
          setDetailDrawerOpen(true);
        }
      })
      .catch(() => {
        if (!active) return;
        handledLinkedRecordRef.current = null;
        toast.error("Không thể tải hồ sơ truyền dẫn");
      });

    return () => {
      active = false;
    };
  }, [isMapLinkedView, linkedAction, linkedRecordId, openUpdateDrawer]);

  // ── rowActions callback ──────────────────────────────────────────
  const rowActions = useCallback(
    (record: TransmissionResponse) => {
      const actions: Array<{ key: string; label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }> = [];

      // Nếu bản ghi đã xóa, chỉ còn Xem chi tiết và Lịch sử
      if (isTransmissionDeleted(record)) {
        if (hasPerm?.("transmission:read")) {
          actions.push({
            key: "view",
            label: "Xem chi tiết",
            icon: icons.view,
            onClick: () => {
              setSelectedRecord(record);
              setDetailDrawerOpen(true);
            },
          });
        }
        if (hasPerm?.("transmission:history") || hasPerm?.("transmission:read") || hasPerm?.("data:read")) {
          actions.push({
            key: "history",
            label: "Lịch sử",
            icon: icons.history,
            onClick: () => openHistory(record),
          });
        }
        return actions;
      }

      if (hasPerm?.("transmission:read")) {
        actions.push({
          key: "view",
          label: "Xem chi tiết",
          icon: icons.view,
          onClick: () => {
            setSelectedRecord(record);
            setDetailDrawerOpen(true);
          },
        });
      }

      // Chỉnh sửa theo policy chuẩn KCHT (approvalEditPolicy): Lưu tạm / Bị trả về / Đã phê duyệt
      if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: "transmission" })) {
        actions.push({
          key: "edit",
          label: "Chỉnh sửa",
          icon: icons.edit,
          onClick: () => openUpdateDrawer(record),
        });
      }

      // Lịch sử thay đổi (mở từ menu hành động dòng)
      if (hasPerm?.("transmission:history")) {
        actions.push({
          key: "history",
          label: "Lịch sử",
          icon: icons.history,
          onClick: () => openHistory(record),
        });
      }

      // DRAFT / REJECTED_LEVEL1 / REJECTED_LEVEL2 + transmission:update → Gửi phê duyệt (submitTransmission)
      if (
        hasPerm?.("transmission:update") &&
        (record.approvalStatus === "DRAFT" ||
          record.approvalStatus === "REJECTED_LEVEL1" ||
          record.approvalStatus === "REJECTED_LEVEL2")
      ) {
        actions.push({
          key: "submit",
          label: "Gửi phê duyệt",
          icon: icons.submit,
          onClick: () => {
            setSubmittingRecord(record);
            setSubmitModalOpen(true);
          },
        });
      }

      // PENDING_APPROVAL + transmission:approvec1 → Phê duyệt / Từ chối cấp Cảng vụ (C1)
      // Nguyên tắc 4 mắt: người tạo không được tự duyệt hồ sơ do mình tạo (back-end chặn, FE disable).
      if (hasPerm?.("transmission:approvec1") && record.approvalStatus === "PENDING_APPROVAL") {
        const isCreatorSelfApprove = Boolean(currentUser?.userId && record.createdBy === currentUser.userId);
        actions.push({
          key: "approveC1",
          label: isCreatorSelfApprove ? "Phê duyệt cấp Cảng vụ (không thể tự duyệt)" : "Phê duyệt cấp Cảng vụ",
          icon: icons.approve,
          disabled: isCreatorSelfApprove,
          onClick: () => {
            setApproveTarget(record);
            setApproveLevel("c1");
            setApproveModalOpen(true);
          },
        });
        actions.push({
          key: "rejectC1",
          label: isCreatorSelfApprove ? "Từ chối cấp Cảng vụ (không thể tự duyệt)" : "Từ chối cấp Cảng vụ",
          icon: icons.reject,
          danger: true,
          disabled: isCreatorSelfApprove,
          onClick: () => {
            setRejectTarget(record);
            setRejectLevel("c1");
            setRejectReason("");
            setRejectModalOpen(true);
          },
        });
      }

      // APPROVED_LEVEL1 + transmission:approvec2 → Phê duyệt / Từ chối cấp Cục (C2)
      // Nguyên tắc 4 mắt: người đã phê duyệt C1 không được tự duyệt tiếp ở C2.
      if (hasPerm?.("transmission:approvec2") && record.approvalStatus === "APPROVED_LEVEL1") {
        const isSelfApproval = Boolean(currentUser?.userId && record.approverLevel1 === currentUser.userId);
        actions.push({
          key: "approveC2",
          label: isSelfApproval ? "Phê duyệt cấp Cục (không thể tự duyệt)" : "Phê duyệt cấp Cục",
          icon: icons.approve,
          disabled: isSelfApproval,
          onClick: () => {
            setApproveTarget(record);
            setApproveLevel("c2");
            setApproveModalOpen(true);
          },
        });
        actions.push({
          key: "rejectC2",
          label: isSelfApproval ? "Từ chối cấp Cục (không thể tự duyệt)" : "Từ chối cấp Cục",
          icon: icons.reject,
          danger: true,
          disabled: isSelfApproval,
          onClick: () => {
            setRejectTarget(record);
            setRejectLevel("c2");
            setRejectReason("");
            setRejectModalOpen(true);
          },
        });
      }

      // Chỉ hồ sơ "Lưu tạm" mới được xóa (policy chuẩn KCHT)
      if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: "transmission" })) {
        actions.push({
          key: "delete",
          label: "Xóa",
          icon: icons.delete,
          danger: true,
          onClick: () => {
            setDeleteConfirmText("");
            setDeleteTarget(record);
          },
        });
      }

      return actions;
    },
    [updateForm, hasPerm, currentUser, openHistory]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const safePage = Math.max(page, 0);
      const safeSize = Math.max(1, Math.min(pageSize, 100));
      const result = await fetchTransmissionList({
        page: safePage,
        size: safeSize,
        orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__'
                          ? filterValues.orgUnitId
                          : undefined),
        deviceCode: filterDeviceCode.trim() || undefined,
        deviceName: filterDeviceName.trim() || undefined,
        operationalStatus: filterValues.operationalStatus != null ? filterValues.operationalStatus : undefined,
        approvalStatus: filterValues.approvalStatus || undefined,
        province: filterValues.province || undefined,
        vtsSystemId: filterValues.vtsSystemId || undefined,
        attachedInfraType: filterValues.attachedInfraType,
        attachedInfraId: filterValues.attachedInfraId || undefined,
        yearOfUse: filterValues.yearOfUse,
        updatedFrom: filterValues.updatedFrom || undefined,
        updatedTo: filterValues.updatedTo || undefined,
        sortBy: sortField || "updatedAt",
        sortOrder: sortOrder === "ascend" ? "asc" : "desc",
      });
      setData(result.content);
      setTotal(result.totalElements);
      setPage(result.number);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setIsError(message || "Lỗi khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterDeviceName, filterDeviceCode, filterValues, sortField, sortOrder]);

  // ── Load đơn vị quản lý mặc định — đồng bộ 100% chuẩn /radar-station ──
  useEffect(() => {
    const loadOrgDefault = async () => {
      setLoadingOrgs(true);
      const isIframe = window.self !== window.top;
      const data = isIframe ? (window.parent as any)?.kchtOrgUnits : undefined;
      const orgs: any[] = data && data.length > 0
        ? data
        : ((await organizationService.getTree()) || []);
      setOrgUnits(orgs);
      if (orgs.length > 0 && !defaultOrgApplied.current) {
        defaultOrgApplied.current = true;
        const found = data && data.length > 0
          ? data[0]
          : null;
        if (found) {
          defaultOrgUnitId.current = found.id;
          setFilterValues((prev) => ({ ...prev, orgUnitId: found.id }));
        } else {
          // lấy đơn vị của user đang đăng nhập
          try {
            const profileRes = await api.get('/users/me');
            const profile = (profileRes as any)?.data?.data ?? (profileRes as any)?.data;
            const userOrgId = profile?.orgUnitId;
            const match = userOrgId && orgs.find((o: any) => o.id === userOrgId);
            const defaultId = userOrgId ? (match ? userOrgId : orgs[0].id) : '__all__';
            defaultOrgUnitId.current = defaultId;
            setFilterValues((prev) => ({ ...prev, orgUnitId: defaultId === '__all__' ? "" : defaultId }));
          } catch {
            defaultOrgUnitId.current = orgs[0].id;
            setFilterValues((prev) => ({ ...prev, orgUnitId: orgs[0].id }));
          }
        }
      }
      setOrgUnitReady(true);
      setLoadingOrgs(false);
    };
    loadOrgDefault().catch(() => {
      console.error('Không tải được cây đơn vị quản lý', 'Failed to load organizations');
      setOrgUnitReady(true);
      setLoadingOrgs(false);
    });
  }, []);

  const fetchSymbols = useCallback(async () => {
    setLoadingSymbols(true);
    try {
      const res = await api.get("/common/options/symbols");
      const items = res.data?.data;
      setSymbols((Array.isArray(items) ? items : []) as MapSymbolType[]);
    } catch (error) {
      console.error("Lỗi tải biểu tượng:", error);
    } finally {
      setLoadingSymbols(false);
    }
  }, []);

  useEffect(() => {
    fetchSymbols();
  }, [fetchSymbols]);

  useEffect(() => {
    if (!orgUnitReady) return;
    fetchData();
    fetchTabCounts();
  }, [orgUnitReady, fetchData, fetchTabCounts]);

  const handleFilterApply = useCallback(() => {
    // Validate khoảng ngày: Từ ngày không được lớn hơn Đến ngày (so sánh chuỗi ISO "YYYY-MM-DD HH:mm:ss")
    if (filterValues.updatedFrom && filterValues.updatedTo && filterValues.updatedFrom > filterValues.updatedTo) {
      toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }
    setFilterDeviceName(inputDeviceName);
    setFilterDeviceCode(inputDeviceCode);
    setPage(0);
  }, [inputDeviceName, inputDeviceCode, filterValues.updatedFrom, filterValues.updatedTo]);

  const handleFilterReset = useCallback(() => {
    setInputDeviceName("");
    setInputDeviceCode("");
    setFilterDeviceName("");
    setFilterDeviceCode("");
    const defaultOrg = defaultOrgUnitId.current;
    setFilterValues({
      orgUnitId: defaultOrg === '__all__' ? "" : (defaultOrg || ""),
      operationalStatus: undefined,
      approvalStatus: "",
      province: "",
      vtsSystemId: "",
      attachedInfraType: undefined,
      attachedInfraId: "",
      yearOfUse: undefined,
      updatedFrom: "",
      updatedTo: "",
    });
    setPage(0);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    if (
      deleteConfirmText !== "XÓA" &&
      deleteConfirmText !== deleteTarget.deviceName
    ) {
      toast.error('Vui lòng nhập đúng tên thiết bị hoặc "XÓA" để xác nhận');
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteTransmission(deleteTarget.id);
      toast.success("Xóa hệ thống truyền dẫn thành công");
      setDeleteTarget(null);
      setDeleteConfirmText("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[transmission] delete error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, deleteConfirmText, fetchData, fetchTabCounts]);

  const handleApprove = useCallback(
    async (content?: string) => {
      if (!approveTarget) return;
      setApproveLoading(true);
      try {
        const payload: ApprovalRequest = { decision: "APPROVED", reason: content?.trim() || undefined };
        if (approveLevel === "c1") {
          await approveTransmissionC1(approveTarget.id, payload);
          toast.success("Phê duyệt cấp Cảng vụ thành công");
        } else {
          await approveTransmissionC2(approveTarget.id, payload);
          toast.success("Phê duyệt cấp Cục thành công");
        }
        setApproveTarget(null);
        setApproveModalOpen(false);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[transmission] approve error", error); // toast toàn cục đã xử lý ở interceptor api.ts
      } finally {
        setApproveLoading(false);
      }
    },
    [approveTarget, approveLevel, fetchData, fetchTabCounts]
  );

  const handleReject = useCallback(async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    if (reason.length < 10) {
      toast.error("Lý do từ chối tối thiểu 10 ký tự");
      return;
    }
    if (reason.length > 500) {
      toast.error("Lý do từ chối tối đa 500 ký tự");
      return;
    }
    setRejectLoading(true);
    try {
      const payload: ApprovalRequest = { decision: "REJECTED", reason };
      if (rejectLevel === "c1") await approveTransmissionC1(rejectTarget.id, payload);
      else await approveTransmissionC2(rejectTarget.id, payload);
      toast.success("Từ chối phê duyệt thành công");
      setRejectTarget(null);
      setRejectModalOpen(false);
      setRejectReason("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[transmission] reject error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setRejectLoading(false);
    }
  }, [rejectTarget, rejectLevel, rejectReason, fetchData, fetchTabCounts]);

  useEffect(() => {
    if (!selectedRecord?.id) {
      setDetailFiles([]);
      return;
    }
    setDetailFilesLoading(true);
    fetchTransmissionAttachments(selectedRecord.id)
      .then((list) => {
        setDetailFiles(
          Array.isArray(list)
            ? list.map((a: any) => ({
                id: String(a.id),
                fileName: a.fileName || a.name || null,
                fileSize: a.fileSize,
                uploadedByName: a.uploadedByName || a.uploadedBy,
                uploadedDate: a.uploadedDate || a.createdAt,
              }))
            : [],
        );
      })
      .catch(() => setDetailFiles([]))
      .finally(() => setDetailFilesLoading(false));
  }, [selectedRecord?.id]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    setSubmitLoading(true);
    try {
      await submitTransmission(submittingRecord.id);
      toast.success("Gửi phê duyệt thành công");
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[transmission] submit error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setSubmitLoading(false);
    }
  }, [submittingRecord, fetchData, fetchTabCounts]);

  const CHK_FILTER_LABEL = { ...themeTokenChk.filterLabelStyle, fontSize: 13.5 };

  return (
    <>
      <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5, filterLabelStyle: CHK_FILTER_LABEL }}>
      <div className="transmission-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .transmission-page-wrapper div:has(> button[aria-pressed]) {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: safe center !important;
          align-items: center !important;
          gap: 20px !important;
          padding: 2px 16px 6px 16px !important;
          gap: 20px !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .transmission-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar { height: 6px !important; display: block !important; }
        .transmission-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track { background: #f1f5f9 !important; border-radius: 999px !important; }
        .transmission-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb { background: #cbd5e1 !important; border-radius: 999px !important; }
        .transmission-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover { background: #94a3b8 !important; }
        .transmission-page-wrapper div:has(> button[aria-pressed]) > button { white-space: nowrap !important; flex-shrink: 0 !important; cursor: pointer !important; flex: 0 0 auto; }

        /* ── Cỡ chữ 13.5px chuẩn: bảng + popup/drawer con (port đầy đủ từ /cctv ≡ /berth) ── */
        /* ── Breadcrumb title (màn /transmission): "Trang chủ" 14px, "Quản lý hệ thống truyền dẫn" 16px —
           khóa cỡ 14/16 trên span tiêu đề, thắng cả ép 13.5px của font trang bên dưới ── */
        .transmission-page-wrapper .ant-breadcrumb .ant-breadcrumb-item:not(:last-child) > .ant-breadcrumb-link > span { font-size: 14px !important; }
        .transmission-page-wrapper .ant-breadcrumb .ant-breadcrumb-item:last-child > .ant-breadcrumb-link > span { font-size: 16px !important; }
        .transmission-page-wrapper .ant-table,
        .transmission-page-wrapper .ant-table-cell,
        .transmission-page-wrapper .ant-table-thead > tr > th,
        .transmission-page-wrapper .ant-table-tbody > tr > td,
        .transmission-page-wrapper .ant-pagination-item,
        .transmission-page-wrapper .ant-pagination-total-text,
        .transmission-page-wrapper .ant-breadcrumb,
        .transmission-page-wrapper .list-view-table .ant-table-cell,
        .transmission-drawer-scope,
        .transmission-drawer-scope .ant-drawer-content,
        .transmission-drawer-scope .ant-tabs-tab,
        .transmission-drawer-scope .chk-detail-label,
        .transmission-drawer-scope .chk-detail-value,
        .transmission-drawer-scope .ant-table,
        .transmission-drawer-scope .ant-table-cell,
        .transmission-drawer-scope .list-view-table .ant-table-cell,
        .transmission-drawer-scope .ant-table-thead > tr > th,
        .transmission-drawer-scope .ant-btn,
        .transmission-drawer-scope .ant-select,
        .transmission-drawer-scope .ant-select .ant-select-selection-item,
        .transmission-drawer-scope .ant-input,
        .transmission-drawer-scope .ant-picker,
        .transmission-drawer-scope .ant-form-item-label > label,
        .transmission-modal-scope,
        .transmission-modal-scope .ant-modal-content,
        .transmission-modal-scope .ant-modal-title,
        .transmission-modal-scope .ant-btn,
        .transmission-modal-scope .ant-input,
        .transmission-modal-scope .ant-modal-body p,
        .transmission-modal-scope .ant-modal-body > p,
        .transmission-modal-scope .chk-detail-label,
        .transmission-modal-scope .chk-detail-value {
          font-size: 13.5px !important;
        }
        .transmission-drawer-scope .chk-detail-label,
        .transmission-modal-scope .chk-detail-label,
        .transmission-drawer-scope .chk-detail-value,
        .transmission-modal-scope .chk-detail-value {
          font-size: 13.5px !important;
        }


        /* ── KẸP CỨNG 13.5px (port chuẩn /cctv) — nâng MỌI text/label còn để 13px trong phạm vi /transmission ── */
        .transmission-page-wrapper.transmission-page-wrapper,
        .transmission-page-wrapper.transmission-page-wrapper div,
        .transmission-page-wrapper.transmission-page-wrapper span,
        .transmission-page-wrapper.transmission-page-wrapper p,
        .transmission-page-wrapper.transmission-page-wrapper label,
        .transmission-page-wrapper.transmission-page-wrapper li,
        .transmission-page-wrapper.transmission-page-wrapper a,
        .transmission-page-wrapper.transmission-page-wrapper button:not(.anticon),
        .transmission-page-wrapper.transmission-page-wrapper .ant-table-cell,
        .transmission-page-wrapper.transmission-page-wrapper .ant-table-thead > tr > th,
        .transmission-page-wrapper.transmission-page-wrapper .ant-table-tbody > tr > td,
        .transmission-drawer-scope.transmission-drawer-scope .chk-detail-row .chk-detail-label,
        .transmission-drawer-scope.transmission-drawer-scope .chk-detail-row .chk-detail-value,
        .transmission-modal-scope.transmission-modal-scope .chk-detail-row .chk-detail-label,
        .transmission-modal-scope.transmission-modal-scope .chk-detail-row .chk-detail-value {
          font-size: 13.5px !important;
        }
        /* ── Thu nhỏ icon DropdownList (mũi tên xổ + nút xóa) về kích thước compact chuẩn ── */
        .transmission-page-wrapper .ant-select .ant-select-suffix,
        .transmission-page-wrapper .ant-select .ant-select-clear {
          font-size: 10px !important;
          line-height: 1 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .transmission-page-wrapper .ant-select .ant-select-suffix .anticon,
        .transmission-page-wrapper .ant-select .ant-select-clear .anticon {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
        }
        .transmission-page-wrapper .ant-select .ant-select-suffix svg,
        .transmission-page-wrapper .ant-select .ant-select-clear svg {
          font-size: 10px !important;
          width: 10px !important;
          height: 10px !important;
          display: block !important;
        }
        /* Chuẩn cỡ chữ giá trị trong bảng: tên 14 / mã 12 / badge 13 / còn lại 13.5 (+StatusTab text 13) */
        .transmission-page-wrapper.transmission-page-wrapper .ant-table-row .kcht-cell-title.kcht-cell-title { font-size: 14px !important; }
        .transmission-page-wrapper.transmission-page-wrapper .kcht-cell-code { font-size: 12px !important; }
        .transmission-page-wrapper.transmission-page-wrapper .kcht-cell-badge { font-size: 13px !important; }
        .transmission-page-wrapper.transmission-page-wrapper button[aria-pressed] span { font-size: 13px !important; }
        /* Tiêu đề card (Section header) trong Drawer Xem chi tiết — 14px như /cctv */
        .transmission-drawer-scope.transmission-drawer-scope .transmission-section-card-title { font-size: 14px !important; }
        /* Mũi tên đóng/mở (chevron) trong Drawer Xem chi tiết — cố định 12px như /berth và /cctv */
        .transmission-drawer-scope .anticon-down,
        .transmission-drawer-scope .anticon-right {
          font-size: 12px !important;
        }
        .transmission-drawer-scope .anticon-down svg,
        .transmission-drawer-scope .anticon-right svg {
          width: 12px !important;
          height: 12px !important;
        }

        /* ── Grid 2 cột & nhãn đồng bộ chuẩn /berth (BerthDetailContent) ── */
        .transmission-drawer-scope .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }
        .transmission-drawer-scope .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }
        .transmission-drawer-scope .chk-detail-row:last-child {
          border-bottom: none !important;
        }
        .transmission-drawer-scope .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }
        .transmission-drawer-scope .chk-detail-row .chk-detail-label,
        .transmission-drawer-scope .chk-detail-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
          color: ${colors.sidebarBg} !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
        }
        .transmission-drawer-scope .chk-detail-row .sec-col1-label,
        .transmission-drawer-scope .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .transmission-drawer-scope .chk-detail-row .sec-col2-label,
        .transmission-drawer-scope .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }
        .transmission-drawer-scope .chk-detail-row .sec-full-label,
        .transmission-drawer-scope .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .transmission-drawer-scope .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }
        .transmission-drawer-scope .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }
        @media (max-width: 960px) {
          .transmission-drawer-scope .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .transmission-drawer-scope .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .transmission-drawer-scope .chk-detail-row .chk-detail-label,
          .transmission-drawer-scope .chk-detail-label,
          .transmission-drawer-scope .sec-col1-label,
          .transmission-drawer-scope .sec-col2-label,
          .transmission-drawer-scope .sec-full-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }
        @media (max-width: 640px) {
          .transmission-drawer-scope .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .transmission-drawer-scope .chk-detail-row .chk-detail-label,
          .transmission-drawer-scope .chk-detail-label,
          .transmission-drawer-scope .sec-col1-label,
          .transmission-drawer-scope .sec-col2-label,
          .transmission-drawer-scope .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .transmission-drawer-scope .chk-detail-value {
            width: 100% !important;
          }
        }
        /* ── Bảng tọa độ GPS: giữ nguyên style ghép viên thuốc (Độ 999px 0 0 999px, Phút/Giây 0) ── */
        .transmission-drawer-scope .ant-table .ant-input-number,
        .theme-token-scope .ant-table .ant-input-number {
          border-radius: inherit;
        }
      `}</style>
      <ScreenHeader
        breadcrumb={[
          { label: "Trang chủ", path: "/" },
          { label: "Quản lý hệ thống truyền dẫn", path: "/transmission" },
        ]}
        actions={[
          hasPerm?.("transmission:create")
            ? {
                key: "create",
                label: "Thêm mới",
                icon: <PlusOutlined />,
                variant: "primary" as const,
                onClick: handleOpenCreate,
              }
            : null,
        ].filter(Boolean) as Array<{ key: string; label: string; icon?: React.ReactNode; variant?: 'primary' | 'outline' | 'subtle' | 'default'; onClick: () => void }>}
      />

      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={!!isError}
        errorMessage={isError ?? undefined}
        onRetry={fetchData}
        filterContent={
          <>
            <SidebarFilterField
              style={{ marginTop: 12 }}
              labelGap={spaceSm}
              label={<span>Đơn vị quản lý <span style={{ color: statusCritical }}>*</span></span>}
            >
              <OrgUnitTreeSelect
                organizations={orgUnitOptions}
                placeholder="Chọn đơn vị..."
                allowClear
                showPath
                allLabel="Tất cả"
                treeDefaultExpandAll={false}
                showSearch
                value={filterValues.orgUnitId || undefined}
                onChange={(val) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    orgUnitId: (val as string) || "",
                  }))
                }
                loading={loadingOrgs}
                style={{ borderRadius: radiusPill, height: 40, width: '100%' }}
              />
            </SidebarFilterField>

            <SidebarFilterField label="Tên thiết bị" labelGap={spaceSm}>
              <Input placeholder="Tìm theo tên thiết bị..." allowClear
                value={inputDeviceName}
                onChange={(e) => setInputDeviceName(e.target.value)}
                onPressEnter={handleFilterApply}
                style={{ borderRadius: radiusPill, height: 40 }} />
            </SidebarFilterField>

            {filterCollapsed && (
              <>
                <SidebarFilterField label="Mã thiết bị" labelGap={spaceSm}>
                  <Input placeholder="Tìm theo mã thiết bị..." allowClear
                    value={inputDeviceCode}
                    onChange={(e) => setInputDeviceCode(e.target.value)}
                    onPressEnter={handleFilterApply}
                    style={{ borderRadius: radiusPill, height: 40 }} />
                </SidebarFilterField>

                <SidebarFilterField label="Tình trạng" labelGap={spaceSm}>
                  <Select placeholder="Chọn tình trạng" allowClear
                    value={filterValues.operationalStatus || undefined}
                    onChange={(val) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        operationalStatus: val as number | undefined,
                      }))
                    }
                    options={OPERATIONAL_STATUS_OPTIONS}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </SidebarFilterField>

                <SidebarFilterField label="Thuộc loại hạ tầng" labelGap={spaceSm}>
                  <Select placeholder="Chọn loại hạ tầng" allowClear
                    value={filterValues.attachedInfraType || undefined}
                    onChange={(val) => {
                      setFilterValues((prev) => ({
                        ...prev,
                        attachedInfraType: val as number | undefined,
                        // Reset attachedInfraId khi đổi loại
                        attachedInfraId: undefined,
                      }));
                    }}
                    options={attachedInfraTypeOptions}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </SidebarFilterField>

                <SidebarFilterField label="Thuộc hạ tầng" labelGap={spaceSm}>
                  <Select placeholder={
                    filterValues.attachedInfraType === 2
                        ? "Chọn trạm Radar"
                        : filterValues.attachedInfraType === 1
                          ? "Chọn Trung Tâm Điều Hành VTS"
                          : "Chọn loại hạ tầng trước"
                  } allowClear
                    value={filterValues.attachedInfraId || undefined}
                    onChange={(val) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        attachedInfraId: val as string | undefined,
                      }))
                    }
                    options={filterValues.attachedInfraType === 1 ? vtsOperationCenterOptions : filterValues.attachedInfraType === 2 ? radarStationOptions : []}
                    loading={filterValues.attachedInfraType === 1 ? loadingVtsCenters : filterValues.attachedInfraType === 2 ? loadingRadars : false}
                    disabled={filterValues.attachedInfraType !== 1 && filterValues.attachedInfraType !== 2}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </SidebarFilterField>

                <SidebarFilterField label="Năm đưa vào sử dụng" labelGap={spaceSm}>
                  <DatePicker
                    picker="year"
                    {...getSidebarDatePickerProps({
                      picker: 'year',
                      placeholder: 'Chọn năm',
                      format: 'YYYY',
                      allowClear: true,
                      value: filterValues.yearOfUse ? dayjs(String(filterValues.yearOfUse), 'YYYY') : null,
                      onChange: (d: any) => setFilterValues((prev) => ({ ...prev, yearOfUse: d ? d.year() : undefined })),
                    })}
                  />
                </SidebarFilterField>

                <SidebarFilterField label="Ngày cập nhật" labelGap={spaceSm}>
                  <DatePicker.RangePicker
                    format="DD/MM/YYYY"
                    placeholder={["Từ ngày", "Đến ngày"]}
                    allowClear
                    popupClassName="chk-range-datepicker-popup"
                    value={
                      filterValues.updatedFrom && filterValues.updatedTo
                        ? [
                            dayjs(filterValues.updatedFrom),
                            dayjs(filterValues.updatedTo),
                          ]
                        : null
                    }
                    onChange={(dates) => {
                      setFilterValues((prev) => ({
                        ...prev,
                        updatedFrom: dates?.[0] ? dates[0].format("YYYY-MM-DD 00:00:00") : undefined,
                        updatedTo: dates?.[1] ? dates[1].format("YYYY-MM-DD 23:59:59") : undefined,
                      }));
                    }}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </SidebarFilterField>

                <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)" labelGap={spaceSm}>
                  <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    value={filterValues.province || undefined}
                    onChange={(val) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        province: val as string,
                      }))
                    }
                    options={VIETNAM_PROVINCES.map(p => ({ label: p, value: p }))}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </SidebarFilterField>
              </>
            )}
          </>
        }
        statusTabs={[
          {
            key: "all",
            label: "Tất cả",
            count: totalAll || 0,
            color: actionPrimary,
            active: !filterValues.approvalStatus,
          },
          {
            key: "DRAFT",
            label: "Lưu tạm",
            count: tabCounts["DRAFT"] ?? 0,
            color: statusDraft,
            active: filterValues.approvalStatus === "DRAFT",
          },
          {
            key: "PENDING_APPROVAL",
            label: "Chờ phê duyệt cấp Cảng vụ/Chi cục",
            count: tabCounts["PENDING_APPROVAL"] ?? 0,
            color: statusAttention,
            active: filterValues.approvalStatus === "PENDING_APPROVAL",
          },
          {
            key: "APPROVED_LEVEL1",
            label: "Chờ phê duyệt cấp cục",
            count: tabCounts["APPROVED_LEVEL1"] ?? 0,
            color: statusInfo,
            active: filterValues.approvalStatus === "APPROVED_LEVEL1",
          },
          {
            key: "APPROVED",
            label: "Đã phê duyệt",
            count: tabCounts["APPROVED"] ?? 0,
            color: statusOperational,
            active: filterValues.approvalStatus === "APPROVED",
          },
          {
            key: "REJECTED_LEVEL1",
            label: "Từ chối cấp Cảng vụ/Chi cục",
            count: tabCounts["REJECTED_LEVEL1"] ?? 0,
            color: statusCritical,
            active: filterValues.approvalStatus === "REJECTED_LEVEL1",
          },
          {
            key: "REJECTED_LEVEL2",
            label: "Từ chối cấp cục",
            count: tabCounts["REJECTED_LEVEL2"] ?? 0,
            color: statusCritical,
            active: filterValues.approvalStatus === "REJECTED_LEVEL2",
          },
          {
            key: "DELETED",
            label: "Đã xóa",
            count: tabCounts["DELETED"] ?? 0,
            color: statusCritical,
            active: filterValues.approvalStatus === "DELETED",
          },
        ]}
        onStatusTabChange={(key) => {
          // Mỗi tab trạng thái lọc đúng 1 mã (từ chối tách 2 tab theo cấp); "Tất cả" bỏ lọc.
          const approvalStatus = key === "all" ? "" : key;
          setFilterValues((prev) => ({
            ...prev,
            approvalStatus,
          }));
          setPage(0);
          fetchData();
        }}
      >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <DataTable
              fill
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 'max-content' }}
              onSort={handleSort}
              rowActions={rowActions}
              locale={{
                emptyText: (
                  <EmptyState description="Chưa có dữ liệu hệ thống truyền dẫn" />
                ),
              }}
            />
            <div style={{ height: 6, flexShrink: 0 }} />
            <Pagination
              current={page + 1}
              total={total}
              pageSize={pageSize}
              onChange={(p, ps) => {
                setPageSize(ps);
                setPage(Math.max(p - 1, 0));
              }}
            />
          </div>
      </FilterTableLayout>
      </div>

      {/* Detail Drawer */}
      <AppDrawer
        {...drawerProps}
        size={undefined}
        width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
        style={{ maxWidth: '96vw' }}
        rootClassName="transmission-drawer-scope"
        className="transmission-drawer-scope"
        title={<span style={drawerTitleStyle}>Chi tiết hệ thống truyền dẫn{selectedRecord ? ` - ${selectedRecord.deviceName || selectedRecord.deviceCode || ''}` : ''}</span>}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        extra={<Button type="text" onClick={() => setDetailDrawerOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        footer={null}
      >
        {selectedRecord && (
          <Tabs
            defaultActiveKey="general"
            className="port-detail-tabs"
            tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 100, background: surfaceCard }}
            items={[
              {
                key: "general",
                label: "Thông tin chung",
                children: (
                  <div style={{ paddingTop: 6, paddingRight: 4, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                    {/* ── Section 1: Thông tin cơ bản & Quản lý vận hành (card chuẩn /berth, header cố định — không đóng/mở) ── */}
                    <div style={transmissionDetailSectionBoxStyle}>
                      <div style={{ ...transmissionDetailSectionHeaderStyle, borderBottom: '1px solid #f1f5f9' }}>
                        <div style={transmissionDetailSectionTitleStyle}>
                          <BankOutlined style={{ color: actionPrimary }} />
                          <span className="transmission-section-card-title">Thông tin cơ bản & Quản lý vận hành</span>
                        </div>
                      </div>
                      <div className="chk-detail-grid">
                        {(() => {
                          let colIndex = 0;
                          return ([
                            { label: 'Mã thiết bị', value: selectedRecord.deviceCode || null, badge: true },
                            { label: 'Tên thiết bị', value: selectedRecord.deviceName || null, bold: true },
                            { label: 'Đơn vị quản lý', value: selectedRecord.orgUnitName || null, bold: true },
                            { label: 'Thuộc TTDH VTS / Trạm Radar', value: selectedRecord.attachedInfrastructureName || null },
                            { label: 'Đơn vị khai thác', value: selectedRecord.operatingUnitName || null },
                            { label: 'Tỉnh / Thành phố', value: selectedRecord.provinceName || null },
                            { label: 'Tình trạng', value: (() => { if (!selectedRecord.operationalStatus) return null; const stMap: Record<string, { color: string; label: string }> = { 'NOT_YET_OPERATIONAL': { color: 'orange', label: 'Chưa khai thác/vận hành' }, 'OPERATIONAL': { color: 'green', label: 'Đang khai thác/vận hành' }, 'SUSPENDED': { color: 'red', label: 'Dừng khai thác/vận hành' } }; const st = stMap[String(selectedRecord.operationalStatus).toUpperCase()]; return st ? renderTransmissionStatusBadge(st) : null; })() },
                            { label: 'Địa điểm chi tiết', value: selectedRecord.detailedLocation || null },
                          ] as Array<{ label: string; value: React.ReactNode; badge?: boolean; bold?: boolean; fullWidth?: boolean }>).map((row) => {
                            let labelCls = 'sec-col1-label';
                            if (row.fullWidth) {
                              labelCls = 'sec-full-label';
                              colIndex = 0;
                            } else {
                              labelCls = colIndex % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label';
                              colIndex += 1;
                            }
                            return (
                              <div key={row.label} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                                <span className={`chk-detail-label ${labelCls}`}>{row.label}</span>
                                <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap', ...(row.bold ? { fontWeight: fontWeightBold } : undefined) }}>
                                  {row.badge && row.value ? (
                                    <span style={statusBadgeStyle(actionPrimary)}>{row.value}</span>
                                  ) : row.value}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* ── Section 2: Thông số kỹ thuật (card chuẩn /berth, header bấm để đóng/mở) ── */}
                    <div style={{ ...transmissionDetailSectionBoxStyle, padding: detailsSpecsOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                      <div
                        onClick={() => setDetailsSpecsOpen(o => !o)}
                        style={{
                          ...transmissionDetailSectionHeaderStyle,
                          marginBottom: detailsSpecsOpen ? 10 : 0,
                          paddingBottom: detailsSpecsOpen ? 8 : 0,
                          borderBottom: detailsSpecsOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={transmissionDetailSectionTitleStyle}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span className="transmission-section-card-title">Thông số kỹ thuật</span>
                        </div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                          {detailsSpecsOpen ? <DownOutlined /> : <RightOutlined />}
                        </span>
                      </div>
                      {detailsSpecsOpen && (
                        <div className="chk-detail-grid">
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col1-label">Model</span>
                            <span className="chk-detail-value">{selectedRecord.model || ''}</span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col2-label">Hãng sản xuất</span>
                            <span className="chk-detail-value">{selectedRecord.manufacturer || ''}</span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col1-label">Đơn vị tính</span>
                            <span className="chk-detail-value">
                              {selectedRecord.unitOfMeasure != null && UOM_LABELS[selectedRecord.unitOfMeasure] ? UOM_LABELS[selectedRecord.unitOfMeasure] : ''}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col2-label">Số lượng</span>
                            <span className="chk-detail-value">
                              {selectedRecord.quantity != null ? <span style={{ color: textPrimary, fontSize: fontSizeMd }}>{fmtNum(selectedRecord.quantity)}</span> : ''}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col1-label">Năm đưa vào sử dụng</span>
                            <span className="chk-detail-value">{selectedRecord.yearOfUse ? String(selectedRecord.yearOfUse) : ''}</span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col2-label" style={{ visibility: 'hidden' }}>Trống</span>
                            <span className="chk-detail-value" />
                          </div>
                          <div className="chk-detail-row chk-detail-row--full">
                            <span className="chk-detail-label sec-col1-label">Thông số kỹ thuật</span>
                            <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedRecord.specifications || ''}</span>
                          </div>
                          <div className="chk-detail-row chk-detail-row--full">
                            <span className="chk-detail-label sec-col1-label">Thông tin bảo trì</span>
                            <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedRecord.maintenanceInformation || ''}</span>
                          </div>
                          <div className="chk-detail-row chk-detail-row--full">
                            <span className="chk-detail-label sec-col1-label">Ghi chú</span>
                            <span className="chk-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedRecord.note || ''}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Section 3: Thông tin phê duyệt (card chuẩn /berth, header bấm để đóng/mở) ── */}
                    <div style={{ ...transmissionDetailSectionBoxStyle, padding: detailApprovalOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                      <div
                        onClick={() => setDetailApprovalOpen(o => !o)}
                        style={{
                          ...transmissionDetailSectionHeaderStyle,
                          marginBottom: detailApprovalOpen ? 10 : 0,
                          paddingBottom: detailApprovalOpen ? 8 : 0,
                          borderBottom: detailApprovalOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={transmissionDetailSectionTitleStyle}>
                          <AuditOutlined style={{ color: actionPrimary }} />
                          <span className="transmission-section-card-title">Thông tin phê duyệt</span>
                        </div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                          {detailApprovalOpen ? <DownOutlined /> : <RightOutlined />}
                        </span>
                      </div>
                      {detailApprovalOpen && (
                        <div className="chk-detail-grid">
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col1-label">Trạng thái phê duyệt</span>
                            <span className="chk-detail-value">
                              {renderApprovalBadge(selectedRecord.approvalStatus, selectedRecord)}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col2-label">Cán bộ cập nhật</span>
                            <span className="chk-detail-value">
                              {selectedRecord.updatedByName ? (
                                <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.updatedByName}</span>
                              ) : ''}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
                            <span className="chk-detail-value">
                              {selectedRecord.submittedByName ? (
                                <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.submittedByName}</span>
                              ) : ''}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col2-label">Ngày gửi phê duyệt</span>
                            <span className="chk-detail-value">{selectedRecord.submittedDate ? formatDate(selectedRecord.submittedDate) : ''}</span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
                            <span className="chk-detail-value">
                              {selectedRecord.approverLevel1Name ? (
                                <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.approverLevel1Name}</span>
                              ) : ''}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
                            <span className="chk-detail-value">{selectedRecord.approvedDateLevel1 ? formatDate(selectedRecord.approvedDateLevel1) : ''}</span>
                          </div>
                          <div className="chk-detail-row chk-detail-row--full">
                            <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cảng vụ/Chi cục</span>
                            <span className="chk-detail-value">{selectedRecord.approvalContentLevel1 || ''}</span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cục</span>
                            <span className="chk-detail-value">
                              {selectedRecord.approverLevel2Name ? (
                                <span style={{ fontWeight: fontWeightBold }}>{selectedRecord.approverLevel2Name}</span>
                              ) : ''}
                            </span>
                          </div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cục</span>
                            <span className="chk-detail-value">{selectedRecord.approvedDateLevel2 ? formatDate(selectedRecord.approvedDateLevel2) : ''}</span>
                          </div>
                          <div className="chk-detail-row chk-detail-row--full">
                            <span className="chk-detail-label sec-col1-label">Nội dung phê duyệt cấp Cục</span>
                            <span className="chk-detail-value">{selectedRecord.approvalContentLevel2 || ''}</span>
                          </div>
                          {selectedRecord.rejectionReason && String(selectedRecord.approvalStatus).toUpperCase().indexOf('REJECT') >= 0 && (
                            <div className="chk-detail-row chk-detail-row--full">
                              <span className="chk-detail-label sec-col1-label">Lý do từ chối</span>
                              <span className="chk-detail-value" style={{ color: statusCritical }}>{selectedRecord.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: "gis",
                label: `Thông tin vị trí (${parseWktToCoordinates(selectedRecord.coordinates || '').length})`,
                children: (
                  <div style={{ paddingTop: 6, paddingRight: 0, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 18px 8px 18px', marginBottom: 14, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)' }}>
                      <style>{`
                        .transmission-drawer-scope .gis-meta-detail.chk-detail-grid,
                        .gis-meta-detail.chk-detail-grid {
                          display: grid !important;
                          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
                          column-gap: 28px !important;
                          row-gap: 0 !important;
                        }
                        .transmission-drawer-scope .gis-meta-detail .chk-detail-row,
                        .gis-meta-detail .chk-detail-row {
                          display: flex !important;
                          align-items: flex-start !important;
                          min-height: 36px !important;
                          padding: 7px 0 !important;
                          border-bottom: 1px solid #f1f5f9 !important;
                          line-height: 1.5 !important;
                          gap: 10px !important;
                        }
                        .transmission-drawer-scope .gis-meta-detail .chk-detail-row:last-child,
                        .gis-meta-detail .chk-detail-row:last-child {
                          border-bottom: none !important;
                        }
                        .transmission-drawer-scope .gis-meta-detail .chk-detail-label,
                        .gis-meta-detail .chk-detail-label {
                          width: 215px !important;
                          min-width: 215px !important;
                          max-width: 215px !important;
                          flex-shrink: 0 !important;
                          color: ${colors.sidebarBg} !important;
                          font-weight: 600 !important;
                          font-size: 13.5px !important;
                          text-align: left !important;
                          line-height: 1.5 !important;
                        }
                        .transmission-drawer-scope .gis-meta-detail .sec-col1-label,
                        .gis-meta-detail .sec-col1-label {
                          width: 215px !important;
                          min-width: 215px !important;
                          max-width: 215px !important;
                          flex-shrink: 0 !important;
                        }
                        .transmission-drawer-scope .gis-meta-detail .sec-col2-label,
                        .gis-meta-detail .sec-col2-label {
                          width: 250px !important;
                          min-width: 250px !important;
                          max-width: 250px !important;
                          flex-shrink: 0 !important;
                        }
                        .transmission-drawer-scope .gis-meta-detail .chk-detail-label::after,
                        .gis-meta-detail .chk-detail-label::after {
                          content: ':' !important;
                          margin-left: 1px !important;
                          margin-right: 4px !important;
                        }
                        .transmission-drawer-scope .gis-meta-detail .chk-detail-value,
                        .gis-meta-detail .chk-detail-value {
                          color: #1e293b !important;
                          font-size: 13.5px !important;
                          flex: 1 !important;
                          min-width: 0 !important;
                          text-align: left !important;
                          line-height: 1.5 !important;
                          word-break: break-word !important;
                        }
                      `}</style>
                      <div className="chk-detail-grid gis-meta-detail">
                        {[
                          {
                            label: 'Loại đối tượng',
                            value: selectedRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : selectedRecord.geometryType === 'LINE' ? 'Đối tượng đường' : selectedRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '',
                          },
                          {
                            label: 'Biểu tượng',
                            value: (() => {
                              const symId = (selectedRecord as any)?.mapSymbolId || '';
                              const symName = selectedRecord.mapSymbolName || symbolMap.get(symId) || symId || '';
                              const symImg = symbolImageMap.get(symId);
                              return (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  {symImg ? <img src={symImg} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}
                                  {symName}
                                </span>
                              );
                            })(),
                          },
                          {
                            label: 'Hệ quy chiếu',
                            value: selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : (selectedRecord.coordinateSystem ? String(selectedRecord.coordinateSystem) : ''),
                          },
                          {
                            label: 'Quy tắc hiển thị',
                            value: selectedRecord.geometryType || selectedRecord.coordinates ? 'Độ, phút, giây (DMS)' : '',
                          },
                        ].map((row, i) => (
                          <div key={i} className="chk-detail-row">
                            <span className={`chk-detail-label ${i % 2 === 0 ? 'sec-col1-label' : 'sec-col2-label'}`}>{row.label}</span>
                            <span className="chk-detail-value">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px' }}>
                        Tọa độ GPS ({parseWktToCoordinates(selectedRecord.coordinates || '').length})
                      </span>
                      <Button
                        icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                        onClick={() => setMapScope('detail')}
                        style={{
                          ...outlineButtonStyle,
                          height: 32,
                          fontSize: 13.5,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Xem vị trí trên bản đồ
                      </Button>
                    </div>
                    <DetailTable
                      scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                      dataSource={parseWktToCoordinates(selectedRecord.coordinates || '')}
                      emptyText="Chưa có tọa độ GPS nào"
                      emptyHeightAuto
                      columns={[
                        { title: 'STT', width: 50 },
                        {
                          title: 'Vĩ độ (Latitude - N)',
                          key: 'lat',
                          render: (_value: unknown, record: { latitude?: number | null; longitude?: number | null }) => {
                            const latitudeValue = record.latitude;
                            if (latitudeValue == null || Number.isNaN(Number(latitudeValue))) return null;
                            const dms = ddToDms(latitudeValue);
                            return `${dms.d}° ${dms.m}' ${dms.s}" N`;
                          },
                        },
                        {
                          title: 'Kinh độ (Longitude - E)',
                          key: 'lng',
                          render: (_value: unknown, record: { latitude?: number | null; longitude?: number | null }) => {
                            const longitudeValue = record.longitude;
                            if (longitudeValue == null || Number.isNaN(Number(longitudeValue))) return null;
                            const dms = ddToDms(longitudeValue);
                            return `${dms.d}° ${dms.m}' ${dms.s}" E`;
                          },
                        },
                      ]}
                    />
                  </div>
                ),
              },
              {
                key: 'files', label: `File đính kèm (${Array.isArray(detailFiles) ? detailFiles.length : 0})`,
                children: (
                  <div style={{ paddingTop: 6 }} className="transmission-files-table">
                    <style>{`
                      .transmission-files-table .ant-table-thead > tr > th {
                        border-bottom: 1px solid #f1f5f9 !important;
                        box-shadow: none !important;
                      }
                    `}</style>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5 }}>File đính kèm</span>
                    </div>
                    <InfrastructureAttachmentTab
                      attachments={detailFiles}
                      readonly
                      readonlyBerthLayout
                      userMap={userMap}
                      isLoading={detailFilesLoading}
                      loadReadonlyPreviewImage={(attachmentId) => {
                        const targetId = selectedRecord?.id || updateTarget?.id;
                        if (!targetId) return Promise.reject(new Error('Chưa xác định được bản ghi đường truyền để tải ảnh'));
                        return api.get(`/v1/transmission/${targetId}/attachments/${attachmentId}/download`, { responseType: "blob" })
                          .then((res: any) => new Blob([res.data]));
                      }}
                      onDownload={handleDownloadAttachmentItem}
                    />
                  </div>
                ),
              },
              {
                key: 'operationMaintenance',
                label: 'Vận hành & bảo trì',
                children: (
                  <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
                    {/* Card 1 — Thông tin vận hành khai thác */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: operationCardOpen ? '12px 18px 12px 18px' : '10px 18px',
                        marginBottom: 14,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      <div
                        onClick={() => setOperationCardOpen((v) => !v)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: operationCardOpen ? 12 : 0,
                          paddingBottom: operationCardOpen ? 8 : 0,
                          borderBottom: operationCardOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeCellTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span className="transmission-section-card-title">Thông tin vận hành khai thác</span>
                        </div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{operationCardOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}</span>
                      </div>
                      {operationCardOpen && (
                        <DetailTable
                          dataSource={[]}
                          emptyText="Chưa có dữ liệu"
                          rowKey={(r: any) => r.id || r.planCode || r.code}
                          scrollY={160}
                          columns={[
                            { title: 'STT', width: 50 },
                            { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                            { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                            { title: 'Ngày bắt đầu', dataIndex: 'operationStartDate', key: 'operationStart', width: 150, align: 'center' as const, render: (v: string, rec: any) => rec.operationStartDate ? formatDate(rec.operationStartDate) : formatDate(v || rec.start || null) },
                            { title: 'Ngày kết thúc', dataIndex: 'operationEndDate', key: 'operationEnd', width: 150, align: 'center' as const, render: (v: string, rec: any) => rec.operationEndDate ? formatDate(rec.operationEndDate) : formatDate(v || rec.end || null) },
                          ]}
                        />
                      )}
                    </div>

                    {/* Card 2 — Thông tin bảo trì */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: maintenanceCardOpen ? '12px 18px 12px 18px' : '10px 18px',
                        marginBottom: 14,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      <div
                        onClick={() => setMaintenanceCardOpen((v) => !v)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: maintenanceCardOpen ? 12 : 0,
                          paddingBottom: maintenanceCardOpen ? 8 : 0,
                          borderBottom: maintenanceCardOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeCellTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span className="transmission-section-card-title">Thông tin bảo trì</span>
                        </div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{maintenanceCardOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}</span>
                      </div>
                      {maintenanceCardOpen && (
                        <DetailTable
                          dataSource={[]}
                          emptyText="Chưa có dữ liệu"
                          rowKey={(r: any) => r.id || r.planCode || r.code}
                          scrollY={160}
                          columns={[
                            { title: 'STT', width: 50 },
                            { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                            { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                            { title: 'Thời gian bắt đầu', dataIndex: 'maintenanceStartDate', key: 'maintenanceStart', width: 150, align: 'center' as const, render: (v: string, rec: any) => rec.maintenanceStartDate ? formatDate(rec.maintenanceStartDate) : formatDate(v || rec.startDate || null) },
                            { title: 'Thời gian kết thúc', dataIndex: 'maintenanceEndDate', key: 'maintenanceEnd', width: 150, align: 'center' as const, render: (v: string, rec: any) => rec.maintenanceEndDate ? formatDate(rec.maintenanceEndDate) : formatDate(v || rec.endDate || null) },
                          ]}
                        />
                      )}
                    </div>

                    {/* Card 3 — Thông tin sự cố */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: incidentCardOpen ? '12px 18px 12px 18px' : '10px 18px',
                        marginBottom: 14,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      <div
                        onClick={() => setIncidentCardOpen((v) => !v)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: incidentCardOpen ? 12 : 0,
                          paddingBottom: incidentCardOpen ? 8 : 0,
                          borderBottom: incidentCardOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeCellTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span className="transmission-section-card-title">Thông tin sự cố</span>
                        </div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{incidentCardOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}</span>
                      </div>
                      {incidentCardOpen && (
                        <DetailTable
                          dataSource={[]}
                          emptyText="Chưa có dữ liệu"
                          rowKey={(r: any) => r.id || r.planCode || r.code}
                          scrollY={160}
                          columns={[
                            { title: 'STT', width: 50 },
                            { title: 'Mã sự cố', dataIndex: 'incidentCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                            { title: 'Loại sự cố', dataIndex: 'incidentType', key: 'type', render: (v: string, rec: any) => v || rec.type || '' },
                            { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || '' },
                            { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string, rec: any) => rec.incidentTime ? formatDate(rec.incidentTime) : formatDate(v || rec.time || null) },
                          ]}
                        />
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </AppDrawer>

      {/* Modal Xem vị trí GIS trên bản đồ (dành cho Xem chi tiết) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              Xem vị trí trên bản đồ
            </span>
          </div>
        }
        open={mapScope === 'detail'}
        onCancel={() => setMapScope(null)}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={null}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline
            height={560}
            disabled
            value={{
              geometryType: mapGeometryType,
              coordinates: mapWkt,
              symbolId: selectedRecord?.mapSymbolId || undefined,
            }}
            defaultGeometryType={mapGeometryType as any}
          />
        </div>
      </Modal>

      {/* Approve Modal — dùng chung 2 cấp (C1 Cảng vụ / C2 Cục) (chuẩn /berth) */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approveLevel}
        loading={approveLoading}
        onConfirm={(content) => { void handleApprove(content); }}
        onCancel={() => {
          setApproveTarget(null);
          setApproveModalOpen(false);
        }}
      />

      {/* Submit Approval Modal — Gửi phê duyệt (chuẩn /berth) */}
      <Modal
        rootClassName="transmission-modal-scope"
        className="transmission-modal-scope"
        title={
          <span
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeLg,
            }}
          >
            Xác nhận gửi Cảng vụ phê duyệt
          </span>
        }
        open={submitModalOpen}
        onCancel={() => {
          setSubmitModalOpen(false);
          setSubmittingRecord(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setSubmitModalOpen(false);
              setSubmittingRecord(null);
            }}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              borderColor: borderDefault,
              color: textSecondary,
            }}
          >
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleConfirmSubmit}
            loading={submitLoading}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              background: actionPrimary,
              borderColor: actionPrimary,
            }}
          >
            Xác nhận
          </Button>,
        ]}
        width={480}
      >
        <div style={{ padding: "8px 0" }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.deviceCode ? `${submittingRecord.deviceCode} — ` : ''}{submittingRecord?.deviceName}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* Reject Modal (chuẩn /berth) */}
      <Modal
        rootClassName="transmission-modal-scope"
        className="transmission-modal-scope"
        title={
          <span
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeLg,
            }}
          >
            Từ chối phê duyệt
          </span>
        }
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectTarget(null);
          setRejectReason("");
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRejectModalOpen(false);
              setRejectTarget(null);
              setRejectReason("");
            }}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
              borderColor: borderDefault,
              color: textSecondary,
            }}
          >
            Hủy
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            loading={rejectLoading}
            onClick={handleReject}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
            }}
          >
            Xác nhận từ chối
          </Button>,
        ]}
        width={480}
      >
        <div style={{ padding: "8px 0" }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập lý do từ chối cho hệ thống truyền dẫn:
          </p>
          {rejectTarget && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>
                {rejectTarget.deviceCode ? `${rejectTarget.deviceCode} — ` : ''}{rejectTarget.deviceName}
              </strong>
            </p>
          )}
          <Input.TextArea
            placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            maxLength={500}
            showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd }}
          />
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        title={
          <span
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeLg,
            }}
          >
            Xác nhận xóa
          </span>
        }
        open={!!deleteTarget}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteConfirmText("");
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setDeleteTarget(null);
              setDeleteConfirmText("");
            }}
            style={outlineButtonStyle}
          >
            Hủy
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleteLoading}
            onClick={handleDeleteConfirm}
            style={{
              borderRadius: radiusPill,
              height: 40,
              fontSize: fontSizeMd,
            }}
          >
            Xác nhận xóa
          </Button>,
        ]}
        width={480}
      >
        <div style={{ padding: "8px 0" }}>
          <Alert
            message="Hành động này không thể hoàn tác"
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }}
          />
          <p
            style={{
              fontSize: fontSizeMd,
              color: textPrimary,
              marginBottom: spaceFormField,
            }}
          >
            Vui lòng nhập <strong>tên thiết bị</strong> hoặc gõ{" "}
            <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deleteTarget && (
            <p
              style={{
                fontSize: fontSizeMd,
                color: textSecondary,
                marginBottom: spaceFormField,
              }}
            >
              Thiết bị:{" "}
              <strong style={{ color: textPrimary }}>
                {deleteTarget.deviceName}
              </strong>
            </p>
          )}
          <Input
            placeholder="Nhập tên thiết bị hoặc XÓA"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            onPressEnter={handleDeleteConfirm}
            style={pillStyle}
            autoFocus
          />
        </div>
      </Modal>

            {/* ── Create Drawer (đồng bộ chuẩn /berth) ───────────────────── */}
      <AppDrawer
        width="min(920px, 96vw)"
        rootClassName="transmission-drawer-scope"
        className="transmission-drawer-scope"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới hệ thống truyền dẫn</span>}
        open={createModalOpen}
        destroyOnHidden
        onClose={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        footer={
          <div style={drawerFooterStyle}>
            <Button
              onClick={() => {
                actionTypeRef.current = 'draft';
                setActionType('draft');
                createFormRef.current?.submit('draft');
              }}
              loading={submitting && actionType === 'draft'}
              style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
            >
              Lưu tạm
            </Button>
            <Button
              type="primary"
              onClick={() => {
                actionTypeRef.current = 'submit';
                setActionType('submit');
                createFormRef.current?.submit('submit');
              }}
              loading={submitting && actionType === 'submit'}
              style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
            >
              Lưu và gửi phê duyệt
            </Button>
            {canSaveAndApprove && (
              <Button
                type="primary"
                onClick={() => {
                  actionTypeRef.current = 'approve';
                  setActionType('approve');
                  createFormRef.current?.submit('approve');
                }}
                loading={submitting && actionType === 'approve'}
                style={{
                  ...primaryButtonStyle,
                  background: statusOperational,
                  borderColor: statusOperational,
                  borderRadius: radiusPill,
                  height: 40,
                }}
              >
                Lưu và phê duyệt
              </Button>
            )}
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        destroyOnClose
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" initialValues={{ operationalStatus: 0 }}>
          <TransmissionForm
            ref={createFormRef}
            form={createForm}
            onFinish={() => {
              setCreateModalOpen(false);
              void fetchData();
              void fetchTabCounts();
            }}
            onSubmittingChange={setSubmitting}
          />
        </Form>
      </AppDrawer>

      {/* ── Edit Drawer (đồng bộ chuẩn /berth) ─────────────────────── */}
      <AppDrawer
        width="min(920px, 96vw)"
        rootClassName="transmission-drawer-scope"
        className="transmission-drawer-scope"
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            Chỉnh sửa thông tin — {updateTarget?.deviceName || updateTarget?.deviceCode || ''}
          </span>
        }
        open={updateModalOpen && !!updateTarget}
        onClose={() => {
          setUpdateModalOpen(false);
          setUpdateTarget(null);
          updateForm.resetFields();
        }}
        footer={
          <div style={drawerFooterStyle}>
            <Button
              onClick={() => {
                setUpdateModalOpen(false);
                setUpdateTarget(null);
                updateForm.resetFields();
              }}
              style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
            >
              Hủy
            </Button>
            {updateTarget && ['APPROVED', 'APPROVED_L2', 'APPROVED_LEVEL2', 'PUBLISHED'].includes(updateTarget.approvalStatus || '') ? (
              canSaveAndApprove && (
                <Button
                  type="primary"
                  onClick={() => {
                    actionTypeRef.current = 'approve';
                    setActionType('approve');
                    editFormRef.current?.submit('approve');
                  }}
                  loading={submitting && actionType === 'approve'}
                  style={{
                    ...primaryButtonStyle,
                    background: statusOperational,
                    borderColor: statusOperational,
                    borderRadius: radiusPill,
                    height: 40,
                  }}
                >
                  Lưu và phê duyệt
                </Button>
              )
            ) : (
              <>
                <Button
                  onClick={() => {
                    actionTypeRef.current = 'draft';
                    setActionType('draft');
                    editFormRef.current?.submit('draft');
                  }}
                  loading={submitting && actionType === 'draft'}
                  style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Lưu tạm
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    actionTypeRef.current = 'submit';
                    setActionType('submit');
                    editFormRef.current?.submit('submit');
                  }}
                  loading={submitting && actionType === 'submit'}
                  style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
                >
                  Lưu và gửi phê duyệt
                </Button>
                {canSaveAndApprove && (
                  <Button
                    type="primary"
                    onClick={() => {
                      actionTypeRef.current = 'approve';
                      setActionType('approve');
                      editFormRef.current?.submit('approve');
                    }}
                    loading={submitting && actionType === 'approve'}
                    style={{
                      ...primaryButtonStyle,
                      background: statusOperational,
                      borderColor: statusOperational,
                      borderRadius: radiusPill,
                      height: 40,
                    }}
                  >
                    Lưu và phê duyệt
                  </Button>
                )}
              </>
            )}
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {updateTarget && (
          <>
            <style>{requiredMarkStyle}</style>
            <Form form={updateForm} layout="vertical" initialValues={{}}>
              <TransmissionForm
                ref={editFormRef}
                form={updateForm}
                id={updateTarget.id}
                initialData={updateTarget}
                onFinish={() => {
                  setUpdateModalOpen(false);
                  setUpdateTarget(null);
                  void fetchData();
                  void fetchTabCounts();
                }}
                onSubmittingChange={setSubmitting}
              />
            </Form>
          </>
        )}
      </AppDrawer>

{/* ── History Drawer (đồng bộ chuẩn /berth) ─────────────────── */}
      <AppDrawer
        width={isIframeModal ? '100%' : 'min(880px, 96vw)'}
        rootClassName="transmission-drawer-scope"
        className="transmission-drawer-scope"
        mask={!isIframeModal}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyTarget ? `Lịch sử thay đổi — ${historyTarget.deviceName || historyTarget.deviceCode || ''}` : 'Lịch sử thay đổi'}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  padding: '2px 10px',
                  borderRadius: 999,
                  fontSize: fontSizeLg - 1,
                  fontWeight: fontWeightBold,
                  background: `${colors.sidebarBg}15`,
                  color: colors.sidebarBg,
                  lineHeight: '20px',
                }}
              >
                Tổng cộng {historyFieldCount}
              </span>
            </Space>
          </div>
        }
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}>
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
          {!historyLoading && (
            <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
              <Input
                placeholder="Tìm kiếm nội dung thay đổi..."
                allowClear
                value={historySearchInput}
                onChange={(e) => setHistorySearchInput(e.target.value)}
                onPressEnter={() => {
                  setHistorySearch(historySearchInput);
                  setHistoryReloadToken((t) => t + 1);
                }}
                style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
              />
              <DatePicker
                placeholder="Từ ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyFrom ? dayjs(historyFrom) : null}
                onChange={(d) => {
                  setHistoryFrom(d ? d.format('YYYY-MM-DD') : '');
                  setHistoryReloadToken((t) => t + 1);
                }}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
              <DatePicker
                placeholder="Đến ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyTo ? dayjs(historyTo) : null}
                onChange={(d) => {
                  setHistoryTo(d ? d.format('YYYY-MM-DD') : '');
                  setHistoryReloadToken((t) => t + 1);
                }}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => {
                  setHistorySearch(historySearchInput);
                  setHistoryReloadToken((t) => t + 1);
                }}
                style={{
                  borderRadius: radiusPill,
                  height: 40,
                  fontSize: fontSizeMd,
                  background: actionPrimary,
                  borderColor: actionPrimary,
                }}
              >
                Tìm kiếm
              </Button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {historyLoading ? (
            <LoadingSkeleton rows={5} />
          ) : historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
                Chưa có thay đổi nào được ghi nhận
              </div>
            </div>
          ) : (
            renderTransmissionHistoryTimeline(historyRecords)
          )}
        </div>
      </AppDrawer>
      </ThemeTokenProvider>
    </>
  );
};

export default TransmissionListPage;
