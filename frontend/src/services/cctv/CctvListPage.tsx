import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fmtNum } from "../../utils/numFmt";
import {
  parseWktToCoordinates,
  ddToDms,
} from "../../utils/gisGeometry";

// Normalize form geometryType ('POINT' | 'LINE' | 'POLYGON') — fallback POINT khi chưa chọn
const normalizeGeometryType = (value: unknown): 'POINT' | 'LINE' | 'POLYGON' =>
  value === 'LINE' || value === 'POLYGON' ? value : 'POINT';
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
  Drawer,
} from "antd";
import { OrgUnitTreeSelect } from "../../components/org-unit";
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
import { useSearchParams } from "react-router-dom";
import {
  fetchCctvList,
  deleteCctv,
  submitCctv,
  approveCctvC1,
  approveCctvC2,
  fetchCctvHistory,
  fetchCctvAttachments,
  downloadCctvAttachment,
} from "./api";
import {
  OPERATIONAL_STATUS_OPTIONS,
} from "./schema";
import type { CctvResponse, ApprovalRequest } from "./types";
import toast from "../../components/ToastNotification";
import ApprovalModal from "../../components/shared/ApprovalModal";
import InfrastructureAttachmentTab, { type InfrastructureAttachmentItem } from "../../components/shared/InfrastructureAttachmentTab";
import AppDrawer from "../../components/shared/AppDrawer";
import CctvForm, { type CctvFormRef } from "./CctvForm";
import { DetailTable } from "../../components/shared/DetailTable";
import GisLocationSelector from "../../components/gis/GisLocationSelector";
import { deduplicateAttachmentHistoryChanges } from "../../utils/historyAttachmentDedup";
import { gisCoordinatesToLines, gisGeometryTypeLabel, isGisHistoryField } from "../../utils/historyGisFormat";
import { useAuthStore } from "../../store/authStore";
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
import { icons } from "../../themetokenchk";

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
  return code != null && UOM_LABELS[code] ? UOM_LABELS[code] : '—';
}

import {
  colors,
  DRAWER_TABLE_SCROLL_Y,
  fontSizeCellTitle,
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
  statusInfo,
  actionPrimary,
  borderDefault,
  surfaceCard,
  surfacePage,
  radiusPill,
  fontSans,
  spaceMd,
  spaceFormField,
  spaceSm,
  spaceXs,
  spaceXl,
  spaceLg,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  statusBadgeStyle,
  radiusSm,
  getRangePickerProps,
  inputStyle,
} from "../../themetokenchk";
import { cellTitleStyle, cellSubtitleStyle } from "../../themetokenchk";
import * as themeTokenChk from "../../themetokenchk";
import { ThemeTokenProvider, THEME_SCOPE_CLASS } from "../../context/ThemeTokenContext";
import dayjs from "dayjs";


// ── Trạng thái phê duyệt 2 cấp (C1 Cảng vụ → C2 Cục) — đồng bộ /vts-system ──
const APPROVAL_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
  APPROVED: 'Đã phê duyệt',
  REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
  REJECTED_LEVEL2: 'Từ chối cấp cục',
};

const APPROVAL_COLOR: Record<string, string> = {
  DRAFT: statusDraft,
  PENDING_APPROVAL: statusAttention,
  APPROVED_LEVEL1: statusInfo,
  APPROVED: statusOperational,
  REJECTED_LEVEL1: statusCritical,
  REJECTED_LEVEL2: statusCritical,
};

/* ── Shared list/detail UI tokens — aligned with Port list-view ───────── */

const pillStyle: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  fontFamily: fontSans,
};

// ── Card/section trong Drawer Xem chi tiết — đồng bộ chuẩn /berth (BerthDetailContent) ──
const cctvDetailSectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '12px 18px 8px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const cctvDetailSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const cctvDetailSectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeCellTitle,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

// ── Detail-page helpers (aligned with PortDetailPage) ────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch { return dateStr; }
}

/** Badge hiển thị giống chuẩn bến cảng: span pill + semantic token */
function renderCctvStatusBadge(b: { color: string; label: string }) {
  let c = textTertiary;
  if (b.color === 'green') c = statusOperational;
  else if (b.color === 'red') c = statusCritical;
  else if (b.color === 'orange') c = statusAttention;
  return <span className="kcht-cell-badge" style={statusBadgeStyle(c)}>{b.label}</span>;
}

/** Badge trạng thái phê duyệt 2 cấp — dùng APPROVAL_STATUS_MAP + APPROVAL_COLOR (quy chuẩn AGENTS.md) */
function renderApprovalBadge(status: string | null | undefined) {
  if (!status) return null;
  const display = APPROVAL_STATUS_MAP[status] || status;
  const color = APPROVAL_COLOR[status] || textTertiary;
  return <span className="kcht-cell-badge" style={statusBadgeStyle(color)}>{display}</span>;
}

// ── GIS DMS — chuẩn /vts-operation-center: giữ state thập phân, mỗi ô DMS đi qua
//    MỘT helper recompute từ 3 ô sibling (không ghi đè/mất dữ liệu khi sửa cell) ──

/** Suy luận loại hình học từ chuỗi WKT (dùng khi bản ghi thiếu geometryType). */
const inferGeometryFromWkt = (wkt?: string | null): 'POINT' | 'LINE' | 'POLYGON' => {
  const head = (wkt || '').trim().toUpperCase();
  if (head.startsWith('POLYGON')) return 'POLYGON';
  if (head.startsWith('LINE')) return 'LINE';
  return 'POINT';
};

interface RawAttachmentItem {
  id?: string;
  fileName?: string;
  fileSize?: number;
  filePath?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

/** Map danh sách tệp từ AttachmentDto sang InfrastructureAttachmentItem. */
const toAttachmentItemList = (list: RawAttachmentItem[]): InfrastructureAttachmentItem[] =>
  (Array.isArray(list) ? list : []).map((a) => ({
    id: a.id,
    fileName: a.fileName,
    fileSize: a.fileSize,
    filePath: a.filePath,
    uploadedDate: a.uploadedAt,
    uploadedBy: a.uploadedBy,
  }));

const tableValueStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
};

const tableMetaStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
};
const CctvListPage = () => {
  const [searchParams] = useSearchParams();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);
  const isIframeModal = window.parent !== window.self;
  const linkedAction = searchParams.get("action");
  const isMapLinkedView = isIframeModal && (linkedAction === "edit" || linkedAction === "detail");
  const [isLoading, setIsLoading] = useState(false);
  const [detailsSpecsOpen, setDetailsSpecsOpen] = useState(true);
  const [detailApprovalOpen, setDetailApprovalOpen] = useState(true);
  const [opRunOpen, setOpRunOpen] = useState(true);
  const [opMaintOpen, setOpMaintOpen] = useState(true);
  const [opIncidentOpen, setOpIncidentOpen] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);
  const [data, setData] = useState<CctvResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "0", 10);
    return isNaN(p) || p < 0 ? 0 : p;
  });
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState({
    orgUnitId: "" as string,
    deviceName: "",
    deviceCode: "",
    operationalStatus: undefined as number | undefined,
    approvalStatus: "" as string,
    province: "" as string,
    vtsSystemId: "" as string,
    attachedInfraType: undefined as number | undefined,
    attachedInfraId: "" as string,
    yearOfUse: undefined as number | undefined,
    updatedFrom: "" as string,
    updatedTo: "" as string,
  });

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
    ];
    const results = await Promise.allSettled(
      statuses.map((s) =>
        fetchCctvList({
          page: 0,
          size: 1,
          orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__'
                          ? filterValues.orgUnitId
                          : undefined),
          approvalStatus: s.status,
        })
      )
    );
    const counts: Record<string, number> = {};
    results.forEach((r, i) => {
      counts[statuses[i].key] = r.status === "fulfilled" ? (r.value?.totalElements ?? 0) : 0;
    });
    setTabCounts(counts);
    // Tất cả = Lưu tạm + Chờ Cảng vụ + Chờ Cục + Đã phê duyệt + Từ chối (Từ chối cấp Cảng vụ/Chi cục + Từ chối cấp cục)
    setTotalAll(
      counts.DRAFT +
        counts.PENDING_APPROVAL +
        counts.APPROVED_LEVEL1 +
        counts.APPROVED +
        counts.REJECTED_LEVEL1 +
        counts.REJECTED_LEVEL2
    );
  }, [filterValues.orgUnitId]);

  // Org units — danh sách đã được backend lọc theo phạm vi phân quyền
  // (GET /common/options/org-units), hiển thị thẳng như màn /vts-system.
  const [orgUnits, setOrgUnits] = useState<{ id: string; name: string; parentId?: string; children?: { id: string; name: string }[] }[]>([]);
  const orgUnitOptions = orgUnits;
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Symbols
  const [symbols, setSymbols] = useState<MapSymbolType[]>([]);

  // Year options for "Năm đưa vào sử dụng" (current year - 30 to current year)
  const yearOfUseOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 31 }, (_, i) => ({
      label: String(currentYear - i),
      value: currentYear - i,
    }));
  }, []);



  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CctvResponse | null>(
    null
  );

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

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<CctvResponse | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<CctvResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<CctvResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const cctvFormRef = useRef<CctvFormRef>(null);
  const editCctvFormRef = useRef<CctvFormRef>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve'>('draft');

  const [attachmentItems, setAttachmentItems] = useState<InfrastructureAttachmentItem[]>([]);

  // ── GIS Map Picker (Xem vị trí trên bản đồ cho Chi tiết) ──
  const [gisMapOpen, setGisMapOpen] = useState(false);

  // Update modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<CctvResponse | null>(null);
  const [updateForm] = Form.useForm();

  // "Lưu và phê duyệt" chỉ dành cho tài khoản có quyền duyệt cấp Cục (chuẩn VTS).
  const canSaveAndApprove = !!hasPerm?.("cctv:approvec2");

  // Map-linked view: GIS mở page trong iframe (?action=edit|detail&id=...) — khi đóng
  // drawer phải báo parent (bản đồ) đóng modal KCHT. (Khôi phục định nghĩa từ a05fbe7a)
  const closeLinkedDrawer = useCallback(() => {
    if (isMapLinkedView) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, [isMapLinkedView]);

  // Submissions
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<CctvResponse | null>(
    null
  );
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── History state ─────────────────────────────────────────────────────
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyEntityName, setHistoryEntityName] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyReloadToken, setHistoryReloadToken] = useState(0);

  // ── History map helpers ────────────────────────────────────────
  const symbolMap = useMemo(() => {
    const m = new Map<string, string>();
    (symbols || []).forEach((s) => {
      if (s.name) m.set(s.id, s.name);
    });
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
        if (item.name) m.set(item.id, item.name);
        if (item.children) build(item.children);
      }
    };
    build(orgUnits || []);
    return m;
  }, [orgUnits]);

  // Sorting
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const handleSort = useCallback((field: string, order: "asc" | "desc") => {
    setSortField(field);
    setSortOrder(order === "asc" ? "ascend" : "descend");
    setPage(0);
  }, []);

  // Mở Drawer Xem chi tiết + nạp danh sách File đính kèm (read-only tab)
  const openViewDetail = useCallback((record: CctvResponse) => {
    setSelectedRecord(record);
    setDetailDrawerOpen(true);
    setAttachmentItems([]);
    void fetchCctvAttachments(record.id)
      .then((list: RawAttachmentItem[]) => setAttachmentItems(toAttachmentItemList(list)))
      .catch(() => { /* ignore */ });
  }, []);

  const columns = useMemo(
    () => {
      // Cột dạng "Cán bộ/Ngày": dòng 1 = tên (đậm), dòng 2 = ngày (màu phụ)
      const renderInfoStack = (name: string | null | undefined, date: string | null | undefined) => {
        const dateText = date ? dayjs(date).format("DD/MM/YYYY HH:mm:ss") : "";
        if (!name && !date) return null;
        return (
          <div style={{ lineHeight: "1.35", overflow: "hidden" }}>
            <div
              title={name || undefined}
              style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {name || null}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: "nowrap" }}>
              {dateText || null}
            </div>
          </div>
        );
      };
      return [
      {
        key: "index",
        label: "STT",
        width: 60,
        type: "mono" as const,
        align: "center" as const,
        fixed: "left" as const,
        render: (_: unknown, __: CctvResponse, index: number) => (
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
        render: (val: string, record: CctvResponse) => (
          <div style={{ minWidth: 0 }}>
            <button
              type="button"
              className="kcht-cell-title"
              onClick={() => openViewDetail(record)}
              style={{ ...cellTitleStyle, background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: "inherit", width: "100%" }}
              title={val || null}
            >
              {val || null}
            </button>
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
          <span style={tableMetaStyle}>{val != null ? formatUnitOfMeasure(val) : null}</span>
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
        render: (_: unknown, record: CctvResponse) => renderInfoStack(record.updatedByName, record.updatedAt),
      },
      {
        key: "submittedInfo",
        label: "Cán bộ gửi phê duyệt",
        dataIndex: "submittedByName",
        width: 230,
        render: (_: unknown, record: CctvResponse) => renderInfoStack(record.submittedByName, record.submittedDate),
      },
      {
        key: "approvedLevel1Info",
        label: "Cán bộ phê duyệt cấp Cảng vụ/Chi cục",
        dataIndex: "approverLevel1Name",
        width: 380,
        render: (_: unknown, record: CctvResponse) => renderInfoStack(record.approverLevel1Name, record.approvedDateLevel1),
      },
      {
        key: "approvedLevel2Info",
        label: "Cán bộ phê duyệt cấp Cục",
        dataIndex: "approverLevel2Name",
        width: 270,
        render: (_: unknown, record: CctvResponse) => renderInfoStack(record.approverLevel2Name, record.approvedDateLevel2),
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
            label: String(val || ""),
          };
          if (!s.label) return null;
          return (
            <span className="kcht-cell-badge" style={statusBadgeStyle(s.color)}>
              {s.label}
            </span>
          );
        },
      },
      {
        key: "approvalStatus",
        label: "Trạng thái",
        dataIndex: "approvalStatus",
        width: 180,
        type: "status" as const,
        render: (val: string) => renderApprovalBadge(val),
      },
    ];
    },
    [page, pageSize, sortField, sortOrder, openViewDetail]
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
    symbolMap?: Map<string, string>
  ): string {
    if (!val || val === '(null)' || val === 'null') return '(trống)';
    if (fn === 'orgUnitId' && orgMap) {
      const full = orgMap.get(val);
      return full ? full.split(' - ').pop() || full : '';
    }
    if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || '';
    if (fn === 'approvalStatus') {
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
        PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
        APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
        APPROVED: 'Đã phê duyệt',
        REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
        REJECTED_LEVEL2: 'Từ chối cấp cục',
      };
      const norm = ALIAS[String(val || '').trim().toUpperCase()] || String(val || '').trim().toUpperCase();
      return m[norm] || val;
    }
    if (fn === 'operationalStatus') {
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
    if (fn === 'unitOfMeasure') {
      return formatUnitOfMeasure(Number(val));
    }
    if (fn === 'coordinateSystem') {
      const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
      return m[String(val)] || val;
    }
    if (fn === 'changedAt' || fn === 'createdAt') {
      try { return dayjs(val).format('DD/MM/YYYY HH:mm:ss'); } catch { return val; }
    }
    return val;
  }

  const HISTORY_PAGE_SIZE = 20;

  const historyTimestamp = (item: any): string =>
    item.approvedDate || item.changedAt || item.createdAt || '';

  const historyField = (item: any): string =>
    item.changedField || item.fieldName || '';

  const historyOldValue = (item: any): string | null =>
    item.previousValue ?? item.oldValue ?? null;

  const historyNewValue = (item: any): string | null =>
    item.newValue ?? null;

  const historyActor = (item: any): string => {
    const raw = item?.approvedBy || item?.changedBy || '';
    return raw || '—';
  };

  const resolveHistoryActionMeta = (item: any): { label: string; color: string; bg: string } => {
    const rawStatus = String(item?.status ?? item?.action ?? '').toUpperCase();
    const rawReason = String(item?.reason ?? '').toLowerCase();
    const rawField = String(item?.changedField ?? item?.fieldName ?? '').toLowerCase();
    if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
      return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}15` };
    }
    if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || (rawField.includes('đính kèm') && rawReason.includes('tải'))) {
      return { label: 'Tải lên tệp', color: statusInfo, bg: `${statusInfo}15` };
    }
    if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xoa tai lieu') || rawReason.includes('xóa tệp')) {
      return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' };
    }
    // Xóa bản ghi (soft delete)
    if (rawStatus === 'DELETED' || rawStatus === 'ARCHIVED' || rawStatus === 'DELETE' || rawReason.includes('xóa bản ghi') || rawReason.includes('xoa ban ghi')) {
      return { label: 'Xóa', color: textTertiary, bg: `${textTertiary}15` };
    }

    // Gửi phê duyệt — kiểm tra trước nhánh phê duyệt (lý do gửi có thể chứa từ "phê duyệt")
    if (rawStatus === 'SUBMITTED' || rawStatus === 'PROPOSED' || rawStatus === 'PENDING' || rawStatus === 'PENDING_APPROVAL' || rawReason.includes('gửi phê duyệt') || rawReason.includes('gui phe duyet') || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet')) {
      return { label: 'Gửi phê duyệt', color: statusAttention, bg: `${statusAttention}15` };
    }

    // Từ chối — phân biệt cấp (Cảng vụ/Chi cục = vòng 1, Cục = vòng 2)
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawStatus === 'REJECTED_LEVEL1' || rawStatus === 'REJECTED_LEVEL2' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      const levelRaw = String(item?.approvalLevel ?? '').toUpperCase();
      const isLevel2 = levelRaw === '2' || levelRaw.includes('LEVEL_2') || levelRaw === 'C2' || levelRaw.includes('CUC');
      const isLevel1 = levelRaw === '1' || levelRaw.includes('LEVEL_1') || levelRaw === 'C1' || levelRaw.includes('CANG_VU');
      if (rawStatus === 'REJECTED_LEVEL2' || isLevel2 || rawReason.includes('cấp cục') || rawReason.includes('cap cuc')) {
        return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}15` };
      }
      if (rawStatus === 'REJECTED_LEVEL1' || isLevel1 || rawReason.includes('cấp cảng vụ') || rawReason.includes('cap cang vu') || rawReason.includes('chi cục')) {
        return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}15` };
      }
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}15` };
    }

    // Phê duyệt — phân biệt cấp (C1 Cảng vụ/Chi cục → C2 Cục)
    if (rawStatus === 'APPROVED' || rawStatus === 'APPROVE' || rawStatus === 'APPROVED_LEVEL1' || rawStatus === 'APPROVED_LEVEL2') {
      const levelRaw2 = String(item?.approvalLevel ?? '').toUpperCase();
      const isL2 = levelRaw2 === '2' || levelRaw2.includes('LEVEL_2') || levelRaw2 === 'C2' || levelRaw2.includes('CUC');
      const isL1 = levelRaw2 === '1' || levelRaw2.includes('LEVEL_1') || levelRaw2 === 'C1' || levelRaw2.includes('CANG_VU');
      if (rawStatus === 'APPROVED' || rawStatus === 'APPROVED_LEVEL2' || isL2) {
        return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}15` };
      }
      if (rawStatus === 'APPROVED_LEVEL1' || isL1) {
        return { label: 'Phê duyệt cấp Cảng vụ', color: statusInfo, bg: `${statusInfo}15` };
      }
      return { label: 'Phê duyệt', color: statusOperational, bg: `${statusOperational}15` };
    }

    if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('cap nhat')) {
      return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` };
    }
      return { label: 'Chỉnh sửa', color: actionPrimary, bg: `${actionPrimary}15` };
  };

  useEffect(() => {
    if (!historyModalVisible || !selectedRecord) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        const history = await fetchCctvHistory(selectedRecord.id, 0, HISTORY_PAGE_SIZE, {
          keyword: historySearch,
          fromDate: historyDateFrom,
          toDate: historyDateTo,
        });
        if (cancelled) return;
        const items = history || [];
        setHistoryRecords(items);
        setHasMoreHistory(items.length === HISTORY_PAGE_SIZE);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }, historySearch.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [historyModalVisible, selectedRecord, historySearch, historyDateFrom, historyDateTo, historyReloadToken]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await fetchCctvHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE, {
        keyword: historySearch,
        fromDate: historyDateFrom,
        toDate: historyDateTo,
      });
      if (history && history.length > 0) {
        setHistoryRecords((prev) => [...prev, ...history]);
      }
      setHistoryPage(nextPage);
      setHasMoreHistory((history || []).length === HISTORY_PAGE_SIZE);
    } catch {
      /* ignore */
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  const handleHistoryScroll = (e: any) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      loadMoreHistory();
    }
  };

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'deviceCode', 'deviceName', 'manufacturer', 'model',
    'quantity', 'operatingUnitId', 'provinceName', 'detailedLocation',
    'attachedInfrastructureType', 'attachedInfrastructureId',
    'unitOfMeasure', 'yearOfUse', 'operationalStatus',
    'specifications', 'maintenanceInformation', 'note',
    'objectType', 'mapSymbolId', 'coordinateSystem', 'displayRule',
  ];

  const renderCctvHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort(
      (a: any, b: any) =>
        new Date(historyTimestamp(b) || 0).getTime() -
        new Date(historyTimestamp(a) || 0).getTime()
    );
    const q = historySearch.toLowerCase().trim();

    // Chuẩn /vts-operation-center: gộp nhóm theo ĐÚNG giây (một lần Lưu ghi nhiều dòng cùng
    // thời điểm) và merge liên tiếp các hành động dạng update (UPDATED/đính kèm) cùng người dùng.
    const isUpdateAction = (status: string, reason?: string) => {
      const s = String(status || '').toUpperCase();
      const r = String(reason || '').toLowerCase();
      return s === 'UPDATED' || s === 'UPDATE' || s === 'EDIT' || s === 'ATTACHMENT_UPLOADED' || s === 'ATTACHMENT_DELETED'
        || r.includes('cập nhật') || r.includes('chỉnh sửa') || r.includes('tải lên') || r.includes('xóa tệp') || r.includes('xóa tài liệu');
    };

    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];

    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      const isBothUpdate = prev && isUpdateAction(prev.status, prev.items[0]?.reason) && isUpdateAction(r.status, r.reason);
      const isSameGroup = prev && prev.tsSec === sec && prev.actor === actor && (prev.status === r.status || isBothUpdate);
      if (isSameGroup)
        prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
    }

    if (groups.length === 0)
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
        </div>
      );

    const fmtTime = (ts: string) => {
      const d = new Date(ts);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };

    return (
      <div>
        {groups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const orgId = rec0.orgUnitId || selectedRecord?.orgUnitId;
          const orgName = orgId ? orgMap.get(orgId) : '';
          const unitName =
            rec0.orgUnitName ||
            (orgName ? orgName.split(' - ').pop() || orgName : '') ||
            selectedRecord?.orgUnitName ||
            '';
          // Chuẩn /vts-operation-center: dedup thay đổi đính kèm (upload/delete cùng lúc).
          const changes = deduplicateAttachmentHistoryChanges(
            g.items.flatMap((item: any) => {
              const fn = historyField(item);
              return fn ? [{ field: fn, oldValue: historyOldValue(item), newValue: historyNewValue(item) }] : [];
            })
          );
          const actionMeta = resolveHistoryActionMeta(g.items[0] || {});
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
              (c: any) => c.field !== 'infrastructureList' && c.field !== 'attachments'
            );

          const formatHistoryValue = (fn: string, raw: string | null) => {
            if (raw === null || raw === '(null)' || raw === '') return null;
            // GIS: nhãn loại đối tượng + tọa độ DMS nhiều dòng (chuẩn /vts-operation-center).
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
              const n = Number(t);
              return Number.isInteger(n) ? String(n) : t;
            }
            return historyFieldValue(fn, raw, orgMap, symbolMap);
          };

          if (orderedChanges.length === 0) return null;

          return (
            <div
              key={gi}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)',
                gap: spaceLg,
                alignItems: 'start',
                marginBottom: gi < groups.length - 1 ? spaceMd : 0,
              }}
            >
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeLg - 1, color: textPrimary, fontWeight: fontWeightBold, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                    {g.ts ? fmtTime(g.ts) : '—'}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>
                      {actionMeta.label}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: spaceXs }}>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                    Người cập nhật: <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{g.actor || null}</span>
                  </Typography.Text>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                    Đơn vị: <span style={{ color: textPrimary }}>{unitName}</span>
                  </Typography.Text>
                </div>
              </div>
              <div style={{ position: 'relative', minWidth: 0, background: surfacePage, borderRadius: radiusSm, padding: `${spaceMd}px ${spaceLg}px`, paddingLeft: spaceLg, overflow: 'hidden', border: `1px solid ${borderDefault}` }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: spaceXs, background: `linear-gradient(180deg, ${actionMeta.color} 0%, ${actionMeta.color}40 100%)` }} />
                <Typography.Text style={{ display: 'block', color: colors.sidebarBg, fontSize: fontSizeMd, fontWeight: fontWeightBold, marginBottom: spaceSm }}>{informationTitle}</Typography.Text>
                {orderedChanges.length > 0 ? (
                  <div>
                    {orderedChanges.map((change, ri: number) => {
                      const fn = change.field;
                      const ov = formatHistoryValue(fn, change.oldValue);
                      const nv = formatHistoryValue(fn, change.newValue);
                      const renderCell = (rawVal: string | null) => {
                        if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                          const img = symbolImageMap.get(rawVal);
                          const name = symbolMap.get(rawVal) || '';
                          if (!img && !name) return null;
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }}
                                />
                              ) : null}
                              {name || null}
                            </span>
                          );
                        }
                        return null;
                      };
                      const renderValueNode = (rawVal: string | null, val: string | null) => {
                        const node = renderCell(rawVal) ?? val ?? '';
                        return isGisHistoryField(fn) ? (
                          <span style={{ whiteSpace: 'pre-line' as const, lineHeight: 1.5 }}>{node}</span>
                        ) : (
                          node
                        );
                      };
                      return isCreate ? (
                        <div
                          key={`${fn}-${ri}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '170px minmax(100px, 1fr)',
                            alignItems: 'flex-start',
                            gap: spaceSm,
                            fontSize: fontSizeMd,
                            lineHeight: 1.6,
                            padding: '3px 0',
                          }}
                        >
                          <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>
                            {fn ? `${historyFieldName(fn)}:` : '—'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                            {renderValueNode(change.newValue, nv)}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={`${fn}-${ri}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)',
                            alignItems: 'flex-start',
                            gap: spaceSm,
                            fontSize: fontSizeMd,
                            lineHeight: 1.6,
                            padding: '3px 0',
                          }}
                        >
                          <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>
                            {fn ? `${historyFieldName(fn)}:` : '—'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                            {renderValueNode(change.oldValue, ov)}
                          </div>
                          <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>→</div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflowWrap: 'break-word', color: textPrimary }}>
                            {renderValueNode(change.newValue, nv)}
                          </div>
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

  // ── rowActions callback ──────────────────────────────────────────
  const rowActions = useCallback(
    (record: CctvResponse) => {
      const actions: Array<{ key: string; label: string; icon?: React.ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }> = [
        {
          key: "view",
          label: "Xem chi tiết",
          icon: icons.view,
          onClick: () => openViewDetail(record),
        },
      ];

      // Chỉnh sửa: hồ sơ Đã phê duyệt chỉ người có quyền phê duyệt cấp Cục (cctv:approvec2) mới sửa được
      // (chuẩn §3.6 + 12 điều vàng #8); các trạng thái khác vẫn mở theo yêu cầu nghiệp vụ 2026-08-26.
      if (record.approvalStatus !== "APPROVED" || canSaveAndApprove) {
        actions.push({
          key: "edit",
          label: "Chỉnh sửa",
          icon: icons.edit,
          onClick: () => {
            setUpdateTarget(record);
            setUpdateModalOpen(true);
          },
        });
      }

      actions.push({
        key: "history",
        label: "Lịch sử",
        icon: icons.history,
        onClick: () => {
          setSelectedRecord(record);
          setHistoryEntityName(record.deviceName || '');
          setHistoryModalVisible(true);
          setHistoryRecords([]);
          setLoadingHistory(false);
          setLoadingMoreHistory(false);
          setHasMoreHistory(true);
          setHistorySearch('');
          setHistorySearchInput('');
          setHistoryDateFrom('');
          setHistoryDateTo('');
          setHistoryPage(0);
        },
      });

      // DRAFT / REJECTED_LEVEL1 / REJECTED_LEVEL2 + cctv:update → Gửi phê duyệt (submitCctv)
      if (
        hasPerm?.("cctv:update") &&
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

      // PENDING_APPROVAL + cctv:approvec1 → Phê duyệt / Từ chối cấp Cảng vụ (C1)
      // Nguyên tắc 4 mắt: người tạo không được tự duyệt hồ sơ do mình tạo (back-end chặn, FE disable).
      if (hasPerm?.("cctv:approvec1") && record.approvalStatus === "PENDING_APPROVAL") {
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

      // APPROVED_LEVEL1 + cctv:approvec2 → Phê duyệt / Từ chối cấp Cục (C2)
      // Nguyên tắc 4 mắt: người đã phê duyệt C1 không được tự duyệt tiếp ở C2.
      if (hasPerm?.("cctv:approvec2") && record.approvalStatus === "APPROVED_LEVEL1") {
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

      // Chỉ hồ sơ "Lưu tạm" mới được xóa (phê duyệt 2 cấp — như /vts-system)
      if (hasPerm?.("cctv:delete") && record.approvalStatus === "DRAFT") {
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
    [hasPerm, currentUser, openViewDetail, canSaveAndApprove]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const safePage = Math.max(page, 0);
      const safeSize = Math.max(1, Math.min(pageSize, 100));
      const result = await fetchCctvList({
        page: safePage,
        size: safeSize,
        orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__'
                          ? filterValues.orgUnitId
                          : undefined),
        search: filterValues.deviceCode || filterValues.deviceName || undefined,
        deviceCode: filterValues.deviceCode || undefined,
        deviceName: filterValues.deviceName || undefined,
        operationalStatus: filterValues.operationalStatus != null ? String(filterValues.operationalStatus) : undefined,
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
  }, [page, pageSize, filterValues, sortField, sortOrder]);

  const fetchOrgUnits = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const res = await api.get("/common/options/org-units");
      const items = res.data?.data;
      const orgs = (Array.isArray(items) ? items : []).map((o: { id?: string; name?: string; code?: string; parentId?: string | null }) => ({
        id: String(o.id),
        name: o.name || "Đơn vị",
        code: o.code || undefined,
        parentId: o.parentId ? String(o.parentId) : undefined,
      }));
      setOrgUnits(orgs);
    } catch (error) {
      console.error("Lỗi tải danh sách đơn vị:", error);
    } finally {
      setLoadingOrgs(false);
    }
  }, []);

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await api.get("/common/options/symbols");
      const items = res.data?.data;
      setSymbols((Array.isArray(items) ? items : []) as MapSymbolType[]);
    } catch (error) {
      console.error("Lỗi tải biểu tượng:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchOrgUnits();
    fetchSymbols();
    fetchTabCounts();
  }, [fetchData, fetchOrgUnits, fetchSymbols, fetchTabCounts]);

  const handleFilterApply = useCallback(() => {
    // Validate khoảng ngày: Từ ngày không được lớn hơn Đến ngày (so sánh chuỗi ISO "YYYY-MM-DD HH:mm:ss")
    if (filterValues.updatedFrom && filterValues.updatedTo && filterValues.updatedFrom > filterValues.updatedTo) {
      toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }
    setPage(0);
    fetchData();
  }, [fetchData, filterValues.updatedFrom, filterValues.updatedTo]);

  const handleFilterReset = useCallback(() => {
    setFilterValues({
      orgUnitId: "",
      deviceName: "",
      deviceCode: "",
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
    fetchData();
  }, [fetchData]);

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
      await deleteCctv(deleteTarget.id);
      toast.success("Xóa hệ thống CCTV thành công");
      setDeleteTarget(null);
      setDeleteConfirmText("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[cctv] delete error", error); // toast toàn cục đã xử lý ở interceptor api.ts
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
          await approveCctvC1(approveTarget.id, payload);
          toast.success("Phê duyệt cấp Cảng vụ thành công");
        } else {
          await approveCctvC2(approveTarget.id, payload);
          toast.success("Phê duyệt cấp Cục thành công");
        }
        setApproveTarget(null);
        setApproveModalOpen(false);
        fetchData();
        fetchTabCounts();
      } catch (error: unknown) {
        console.error("[cctv] approve error", error); // toast toàn cục đã xử lý ở interceptor api.ts
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
      if (rejectLevel === "c1") await approveCctvC1(rejectTarget.id, payload);
      else await approveCctvC2(rejectTarget.id, payload);
      toast.success("Từ chối phê duyệt thành công");
      setRejectTarget(null);
      setRejectModalOpen(false);
      setRejectReason("");
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[cctv] reject error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setRejectLoading(false);
    }
  }, [rejectTarget, rejectLevel, rejectReason, fetchData, fetchTabCounts]);

  const handleDownloadAttachmentItem = useCallback(async (attId: string, fileName?: string) => {
    const item = attachmentItems.find((a) => a.id === attId);
    const downloadName = fileName || item?.fileName || 'file';
    const targetId = selectedRecord?.id || updateTarget?.id;
    if (!targetId) {
      toast.error('Không thể tải xuống tệp đính kèm');
      return;
    }
    try {
      await downloadCctvAttachment(targetId, attId, downloadName);
    } catch {
      toast.error('Không thể tải xuống tệp đính kèm');
    }
  }, [attachmentItems, selectedRecord?.id, updateTarget?.id]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    setSubmitLoading(true);
    try {
      await submitCctv(submittingRecord.id);
      toast.success("Gửi phê duyệt thành công");
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      fetchData();
      fetchTabCounts();
    } catch (error: unknown) {
      console.error("[cctv] submit error", error); // toast toàn cục đã xử lý ở interceptor api.ts
    } finally {
      setSubmitLoading(false);
    }
  }, [submittingRecord, fetchData, fetchTabCounts]);

  const CHK_FILTER_LABEL = { ...themeTokenChk.filterLabelStyle, fontSize: 13.5 };

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5, filterLabelStyle: CHK_FILTER_LABEL }}>
      <div className="cctv-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .cctv-page-wrapper,
        .cctv-page-wrapper .ant-input,
        .cctv-page-wrapper .ant-select,
        .cctv-page-wrapper .ant-select .ant-select-selection-item,
        .cctv-page-wrapper .ant-select-item-option-content,
        .cctv-page-wrapper .ant-picker,
        .cctv-page-wrapper .ant-picker-input > input,
        .cctv-page-wrapper .ant-btn,
        .cctv-page-wrapper .ant-pagination,
        .cctv-page-wrapper .ant-form-item-label > label { font-size: 13.5px !important; }
        /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, cuộn ngang khi tràn (chuẩn /berth) ── */
        .cctv-page-wrapper div:has(> button[aria-pressed]) {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          justify-content: center !important;
          justify-content: safe center !important;
          align-items: center !important;
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 2px 16px 6px 16px !important;
          gap: 20px !important;
        }
        .cctv-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar { height: 6px !important; display: block !important; }
        .cctv-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track { background: #f1f5f9 !important; border-radius: 999px !important; }
        .cctv-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb { background: #cbd5e1 !important; border-radius: 999px !important; }
        .cctv-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover { background: #94a3b8 !important; }
        .cctv-page-wrapper div:has(> button[aria-pressed]) > button { white-space: nowrap !important; flex-shrink: 0 !important; cursor: pointer !important; }

        /* ── Cỡ chữ 13.5px chuẩn: bảng + popup/drawer con (port đầy đủ từ màn /berth; bao cả nhãn/giá trị khối chk-detail bị theme dùng chung ép 13px) ── */
        /* ── Breadcrumb title (màn /cctv): "Trang chủ" 14px, "Quản lý hệ thống CCTV" 16px —
           khóa cỡ 14/16 trên span tiêu đề, thắng cả ép 13.5px của font trang bên dưới ── */
        .cctv-page-wrapper .ant-breadcrumb .ant-breadcrumb-item:not(:last-child) > .ant-breadcrumb-link > span { font-size: 14px !important; }
        .cctv-page-wrapper .ant-breadcrumb .ant-breadcrumb-item:last-child > .ant-breadcrumb-link > span { font-size: 16px !important; }
        .cctv-page-wrapper .ant-table,
        .cctv-page-wrapper .ant-table-cell,
        .cctv-page-wrapper .ant-table-thead > tr > th,
        .cctv-page-wrapper .ant-table-tbody > tr > td,
        .cctv-page-wrapper .ant-pagination-item,
        .cctv-page-wrapper .ant-pagination-total-text,
        .cctv-page-wrapper .ant-breadcrumb,
        .cctv-page-wrapper .list-view-table .ant-table-cell,
        .cctv-drawer-scope,
        .cctv-drawer-scope .ant-drawer-content,
        .cctv-drawer-scope .ant-tabs-tab,
        .cctv-drawer-scope .chk-detail-label,
        .cctv-drawer-scope .chk-detail-value,
        .cctv-drawer-scope .chk-detail-row > span,
        .cctv-drawer-scope .ant-table,
        .cctv-drawer-scope .ant-table-cell,
        .cctv-drawer-scope .ant-table-thead > tr > th,
        .cctv-drawer-scope .list-view-table .ant-table-cell,
        .cctv-drawer-scope .ant-btn,
        .cctv-drawer-scope .ant-select,
        .cctv-drawer-scope .ant-select .ant-select-selection-item,
        .cctv-drawer-scope .ant-select-item-option-content,
        .cctv-drawer-scope .ant-input,
        .cctv-drawer-scope .ant-picker,
        .cctv-drawer-scope .ant-picker-input > input,
        .cctv-drawer-scope .ant-form-item-label > label,
        .cctv-modal-scope,
        .cctv-modal-scope .ant-modal-content,
        .cctv-modal-scope .ant-modal-title,
        .cctv-modal-scope .ant-btn,
        .cctv-modal-scope .ant-input,
        .cctv-modal-scope .ant-modal-body p,
        .cctv-modal-scope .ant-modal-body > p,
        .cctv-modal-scope .chk-detail-label,
        .cctv-modal-scope .chk-detail-value {
          font-size: 13.5px !important;
        }


        /* ── KẸP CỨNG 13.5px — nâng MỌI text/label còn để 13px (kể cả inline font-size và chk-detail bị theme nào đó ép 13) chỉ trong phạm vi màn /cctv ── */
        .cctv-page-wrapper.cctv-page-wrapper,
        .cctv-page-wrapper.cctv-page-wrapper div,
        .cctv-page-wrapper.cctv-page-wrapper span,
        .cctv-page-wrapper.cctv-page-wrapper p,
        .cctv-page-wrapper.cctv-page-wrapper label,
        .cctv-page-wrapper.cctv-page-wrapper li,
        .cctv-page-wrapper.cctv-page-wrapper a,
        .cctv-page-wrapper.cctv-page-wrapper button:not(.anticon),
        .cctv-page-wrapper.cctv-page-wrapper .ant-table-cell,
        .cctv-page-wrapper.cctv-page-wrapper .ant-table-thead > tr > th,
        .cctv-page-wrapper.cctv-page-wrapper .ant-table-tbody > tr > td,
        .cctv-drawer-scope.cctv-drawer-scope .chk-detail-row .chk-detail-label,
        .cctv-drawer-scope.cctv-drawer-scope .chk-detail-row .chk-detail-value,
        .cctv-drawer-scope.cctv-drawer-scope .ant-table-cell,
        .cctv-modal-scope.cctv-modal-scope,
        .cctv-modal-scope.cctv-modal-scope div,
        .cctv-modal-scope.cctv-modal-scope span,
        .cctv-modal-scope.cctv-modal-scope p,
        .cctv-modal-scope.cctv-modal-scope label,
        .cctv-modal-scope.cctv-modal-scope li,
        .cctv-modal-scope.cctv-modal-scope a,
        .cctv-modal-scope.cctv-modal-scope button:not(.anticon),
        .cctv-modal-scope.cctv-modal-scope .chk-detail-row .chk-detail-label,
        .cctv-modal-scope.cctv-modal-scope .chk-detail-row .chk-detail-value,
        .cctv-modal-scope.cctv-modal-scope .ant-table-cell {
          font-size: 13.5px !important;
        }
        /* Thu nhỏ icon DropdownList (mũi tên xổ + nút xóa) về kích thước compact chuẩn */
        .cctv-page-wrapper .ant-select .ant-select-suffix,
        .cctv-page-wrapper .ant-select .ant-select-clear {
          font-size: 10px !important;
          line-height: 1 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .cctv-page-wrapper .ant-select .ant-select-suffix .anticon,
        .cctv-page-wrapper .ant-select .ant-select-clear .anticon {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
        }
        .cctv-page-wrapper .ant-select .ant-select-suffix svg,
        .cctv-page-wrapper .ant-select .ant-select-clear svg {
          font-size: 10px !important;
          width: 10px !important;
          height: 10px !important;
          display: block !important;
        }
        /* Chuẩn cỡ chữ giá trị trong bảng: tên 14 / mã 12 / badge 13 / còn lại 13.5 (+StatusTab text 13) */
        .cctv-page-wrapper.cctv-page-wrapper .ant-table-row .kcht-cell-title.kcht-cell-title { font-size: 14px !important; }
        .cctv-page-wrapper.cctv-page-wrapper .kcht-cell-code { font-size: 12px !important; }
        .cctv-page-wrapper.cctv-page-wrapper .kcht-cell-badge { font-size: 13px !important; }
        .cctv-page-wrapper.cctv-page-wrapper button[aria-pressed] span { font-size: 13px !important; }
        /* Divider giữa các dòng của tab "Thông tin chung" — nhạt như /berth (#f1f5f9). Drawer portal ra body nên anchor theo .cctv-drawer-scope */
        .cctv-drawer-scope.cctv-drawer-scope .chk-detail-row,
        .cctv-page-wrapper.cctv-page-wrapper .chk-detail-row { border-bottom: 1px solid #f1f5f9 !important; }
        /* Tiêu đề card (Section header) trong Drawer Xem chi tiết — 14px như /berth (rule clamp 13.5px ở trên không được ép/thắng mục này) */
        .cctv-drawer-scope.cctv-drawer-scope .cctv-section-card-title,
        .cctv-page-wrapper.cctv-page-wrapper .cctv-section-card-title { font-size: 14px !important; }
        /* Mũi tên đóng/mở (chevron) trong Drawer Xem chi tiết — cố định 12px như /berth và /scada */
        .cctv-drawer-scope .anticon-down,
        .cctv-drawer-scope .anticon-right {
          font-size: 12px !important;
        }
        .cctv-drawer-scope .anticon-down svg,
        .cctv-drawer-scope .anticon-right svg {
          width: 12px !important;
          height: 12px !important;
        }
        /* Tiêu đề Drawer Xem chi tiết — 15px như /berth (drawerTitleStyle = fontSizeLg, thoát khỏi clamp 13.5px phía trên) */
        .cctv-drawer-scope.cctv-drawer-scope .ant-drawer-title span { font-size: 15px !important; }
        /* Responsive drawer Xem chi tiết — sao chép chuẩn /berth để không vỡ khi zoom/phóng nhỏ */
        /* Kẹp wrapper drawer không tràn ngoài viewport khi zoom in (clone rule chuẩn /berth: .berth-drawer-scope .ant-drawer-content-wrapper) */
        .cctv-drawer-scope .ant-drawer-content-wrapper {
          max-width: 100vw !important;
        }

        /* ── Grid 2 cột & nhãn đồng bộ chuẩn /berth (BerthDetailContent) ── */
        .cctv-drawer-scope .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }
        .cctv-drawer-scope .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }
        .cctv-drawer-scope .chk-detail-row:last-child {
          border-bottom: none !important;
        }
        .cctv-drawer-scope .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }
        .cctv-drawer-scope .chk-detail-row .chk-detail-label,
        .cctv-drawer-scope .chk-detail-label {
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
        .cctv-drawer-scope .chk-detail-row .sec-col1-label,
        .cctv-drawer-scope .sec-col1-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .cctv-drawer-scope .chk-detail-row .sec-col2-label,
        .cctv-drawer-scope .sec-col2-label {
          width: 250px !important;
          min-width: 250px !important;
          max-width: 250px !important;
          flex-shrink: 0 !important;
        }
        .cctv-drawer-scope .chk-detail-row .sec-full-label,
        .cctv-drawer-scope .sec-full-label {
          width: 215px !important;
          min-width: 215px !important;
          max-width: 215px !important;
          flex-shrink: 0 !important;
        }
        .cctv-drawer-scope .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }
        .cctv-drawer-scope .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }
        @media (max-width: 960px) {
          .cctv-drawer-scope .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .cctv-drawer-scope .chk-detail-row--full {
            grid-column: 1 !important;
          }
          .cctv-drawer-scope .chk-detail-row .chk-detail-label,
          .cctv-drawer-scope .chk-detail-label,
          .cctv-drawer-scope .sec-col1-label,
          .cctv-drawer-scope .sec-col2-label,
          .cctv-drawer-scope .sec-full-label {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }
        @media (max-width: 640px) {
          .cctv-drawer-scope .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .cctv-drawer-scope .chk-detail-row .chk-detail-label,
          .cctv-drawer-scope .chk-detail-label,
          .cctv-drawer-scope .sec-col1-label,
          .cctv-drawer-scope .sec-col2-label,
          .cctv-drawer-scope .sec-full-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .cctv-drawer-scope .chk-detail-value {
            width: 100% !important;
          }
        }
      `}</style>

      <ScreenHeader
        breadcrumb={[
          { label: "Trang chủ", path: "/" },
          { label: "Quản lý hệ thống CCTV", path: "/cctv" },
        ]}
        actions={[
          hasPerm?.("cctv:create")
            ? {
                key: "create",
                label: "Thêm mới",
                icon: <PlusOutlined />,
                variant: "primary" as const,
                onClick: () => {
                  createForm.resetFields();
                  setCreateModalOpen(true);
                },
              }
            : null,
        ].filter(Boolean)}
      />

      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={Boolean(isError)}
        errorMessage={isError || undefined}
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
                placeholder="Chọn đơn vị"
                allowClear
                showPath
                allLabel="Tất cả"
                treeDefaultExpandAll={false}
                value={filterValues.orgUnitId || undefined}
                onChange={(val) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    orgUnitId: val as string,
                  }))
                }
                loading={loadingOrgs}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </SidebarFilterField>

            <SidebarFilterField label="Tên thiết bị" labelGap={spaceSm}>
              <Input placeholder="Tìm theo tên thiết bị..." allowClear
                value={filterValues.deviceName || ""}
                onChange={(e) =>
                  setFilterValues((prev) => ({
                    ...prev,
                    deviceName: e.target.value,
                  }))
                }
                onPressEnter={handleFilterApply}
                style={{ borderRadius: radiusPill, height: 40 }} />
            </SidebarFilterField>

            {filterCollapsed && (
              <>
                <SidebarFilterField label="Mã thiết bị" labelGap={spaceSm}>
                  <Input placeholder="Tìm theo mã thiết bị..." allowClear
                    value={filterValues.deviceCode || ""}
                    onChange={(e) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        deviceCode: e.target.value,
                      }))
                    }
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
                  <Select placeholder="Chọn năm" allowClear
                    value={filterValues.yearOfUse}
                    onChange={(val) =>
                      setFilterValues((prev) => ({
                        ...prev,
                        yearOfUse: val as number | undefined,
                      }))
                    }
                    options={yearOfUseOptions}
                    style={{ width: "100%", borderRadius: radiusPill, height: 40 }} />
                </SidebarFilterField>

                <SidebarFilterField label="Ngày cập nhật" labelGap={spaceSm}>
                  <DatePicker.RangePicker format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']} allowClear popupClassName="chk-range-datepicker-popup"
                    value={[filterValues.updatedFrom ? dayjs(filterValues.updatedFrom) : null, filterValues.updatedTo ? dayjs(filterValues.updatedTo) : null]}
                    onChange={(dates) => { setFilterValues(prev => ({ ...prev, updatedFrom: dates?.[0]? dates[0].format('YYYY-MM-DD 00:00:00') : undefined, updatedTo: dates?.[1]? dates[1].format('YYYY-MM-DD 23:59:59') : undefined })); }}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
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
            <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
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
                  <EmptyState message="Chưa có dữ liệu hệ thống CCTV" />
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
      <Drawer
        {...drawerProps}
        size={undefined} /* bỏ size '50%' từ drawerProps để antd dùng width bên dưới (khớp chuẩn /berth) */
        width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
        style={{ maxWidth: '96vw' }} /* Clone chuẩn /berth (BerthListPage Detail Drawer): inline kẹp 96vw lên wrapper */
      rootClassName={THEME_SCOPE_CLASS}
      className="cctv-drawer-scope"
      title={<span style={drawerTitleStyle}>Chi tiết hệ thống CCTV{selectedRecord ? ` - ${selectedRecord.deviceName || selectedRecord.deviceCode || ''}` : ''}</span>}
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          closeLinkedDrawer();
        }}
        extra={
          <Button
            type="text"
            onClick={() => {
              setDetailDrawerOpen(false);
              closeLinkedDrawer();
            }}
            style={drawerCloseBtnStyle}
          >
            ✕
          </Button>
        }
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
                    <div style={cctvDetailSectionBoxStyle}>
                      <div style={{ ...cctvDetailSectionHeaderStyle, borderBottom: '1px solid #f1f5f9' }}>
                        <div style={cctvDetailSectionTitleStyle}>
                          <BankOutlined style={{ color: actionPrimary }} />
                          <span className="cctv-section-card-title">Thông tin cơ bản & Quản lý vận hành</span>
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
                            { label: 'Tình trạng', value: (() => { if (!selectedRecord.operationalStatus) return null; const stMap: Record<string, { color: string; label: string }> = { 'NOT_YET_OPERATIONAL': { color: 'orange', label: 'Chưa khai thác/vận hành' }, 'OPERATIONAL': { color: 'green', label: 'Đang khai thác/vận hành' }, 'SUSPENDED': { color: 'red', label: 'Dừng khai thác/vận hành' } }; const st = stMap[String(selectedRecord.operationalStatus).toUpperCase()]; return st ? renderCctvStatusBadge(st) : null; })() },
                            { label: 'Địa điểm chi tiết', value: selectedRecord.detailedLocation || null },
                          ] as Array<{ label: string; value: React.ReactNode; badge?: boolean; bold?: boolean; fullWidth?: boolean }>).map((row) => {
                            let labelCls: string;
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
                    <div style={{ ...cctvDetailSectionBoxStyle, padding: detailsSpecsOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                      <div
                        onClick={() => setDetailsSpecsOpen(o => !o)}
                        style={{
                          ...cctvDetailSectionHeaderStyle,
                          marginBottom: detailsSpecsOpen ? 10 : 0,
                          paddingBottom: detailsSpecsOpen ? 8 : 0,
                          borderBottom: detailsSpecsOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={cctvDetailSectionTitleStyle}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span className="cctv-section-card-title">Thông số kỹ thuật</span>
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
                    <div style={{ ...cctvDetailSectionBoxStyle, padding: detailApprovalOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                      <div
                        onClick={() => setDetailApprovalOpen(o => !o)}
                        style={{
                          ...cctvDetailSectionHeaderStyle,
                          marginBottom: detailApprovalOpen ? 10 : 0,
                          paddingBottom: detailApprovalOpen ? 8 : 0,
                          borderBottom: detailApprovalOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={cctvDetailSectionTitleStyle}>
                          <AuditOutlined style={{ color: actionPrimary }} />
                          <span className="cctv-section-card-title">Thông tin phê duyệt</span>
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
                              {renderApprovalBadge(selectedRecord.approvalStatus)}
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
                label: `Thông tin vị trí (${parseWktToCoordinates((selectedRecord as any)?.coordinates || '').length})`,
                children: (
                  <div style={{ paddingTop: 6, paddingRight: 0, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
                    <div style={cctvDetailSectionBoxStyle}>
                      <style>{`
                        .cctv-drawer-scope .gis-meta-detail.chk-detail-grid,
                        .gis-meta-detail.chk-detail-grid {
                          display: grid !important;
                          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
                          column-gap: 28px !important;
                          row-gap: 0 !important;
                        }
                        .cctv-drawer-scope .gis-meta-detail .chk-detail-row,
                        .gis-meta-detail .chk-detail-row {
                          display: flex !important;
                          align-items: flex-start !important;
                          min-height: 36px !important;
                          padding: 7px 0 !important;
                          border-bottom: 1px solid #f1f5f9 !important;
                          line-height: 1.5 !important;
                          gap: 10px !important;
                        }
                        .cctv-drawer-scope .gis-meta-detail .chk-detail-row:last-child,
                        .gis-meta-detail .chk-detail-row:last-child {
                          border-bottom: none !important;
                        }
                        .cctv-drawer-scope .gis-meta-detail .chk-detail-label,
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
                        .cctv-drawer-scope .gis-meta-detail .sec-col1-label,
                        .gis-meta-detail .sec-col1-label {
                          width: 215px !important;
                          min-width: 215px !important;
                          max-width: 215px !important;
                          flex-shrink: 0 !important;
                        }
                        .cctv-drawer-scope .gis-meta-detail .sec-col2-label,
                        .gis-meta-detail .sec-col2-label {
                          width: 250px !important;
                          min-width: 250px !important;
                          max-width: 250px !important;
                          flex-shrink: 0 !important;
                        }
                        .cctv-drawer-scope .gis-meta-detail .chk-detail-label::after,
                        .gis-meta-detail .chk-detail-label::after {
                          content: ':' !important;
                          margin-left: 1px !important;
                          margin-right: 4px !important;
                        }
                        .cctv-drawer-scope .gis-meta-detail .chk-detail-value,
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
                            value: (({ POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' } as Record<string, string>)[selectedRecord.geometryType || '']) || null,
                          },
                          {
                            label: 'Biểu tượng',
                            value: (() => {
                              const symId = (selectedRecord as any)?.mapSymbolId || '';
                              const symName =
                                selectedRecord.mapSymbolName ||
                                (symId ? symbolMap.get(symId) : '') ||
                                '';
                              const symImg = symbolImageMap.get(symId);
                              if (!symImg && !symName) return null;
                              return (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  {symImg ? <img src={symImg} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}
                                  {symName || null}
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
                        Tọa độ GPS ({parseWktToCoordinates((selectedRecord as any)?.coordinates || '').length})
                      </span>
                      <Button
                        icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                        onClick={() => { setGisMapOpen(true); }}
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
                      dataSource={parseWktToCoordinates((selectedRecord as any)?.coordinates || '')}
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
                key: "files",
                label: `File đính kèm (${attachmentItems.length})`,
                children: (
                  <div style={{ paddingTop: 6 }} className="cctv-files-table">
                    <style>{`
                      .cctv-files-table.cctv-files-table .anticon { font-size: 16px !important; }
                      .cctv-files-table .ant-table-thead > tr > th {
                        height: 38px !important;
                        box-sizing: border-box !important;
                        border-bottom: 1px solid #f1f5f9 !important;
                        box-shadow: none !important;
                      }
                    `}</style>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5 }}>File đính kèm</span>
                    </div>
                    <InfrastructureAttachmentTab
                      attachments={attachmentItems}
                      readonly
                      readonlyBerthLayout
                      userMap={userMap}
                      loadReadonlyPreviewImage={(attachmentId) => {
                        const targetId = selectedRecord?.id || updateTarget?.id;
                        if (!targetId) return Promise.reject(new Error('Chưa xác định được bản ghi camera để tải ảnh'));
                        return api.get(`/v1/cctv/${targetId}/attachments/${attachmentId}/download`, { responseType: "blob" })
                          .then((res: any) => new Blob([res.data]));
                      }}
                      onDownload={handleDownloadAttachmentItem}
                    />
                  </div>
                ),
              },
              {
                key: "operationMaintenance",
                label: "Vận hành & bảo trì",
                children: (
                  <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)' }}>
                    {/* ── Section 1: Thông tin vận hành khai thác (card chuẩn /berth, bấm để đóng/mở) ── */}
                    <div style={{ ...cctvDetailSectionBoxStyle, padding: opRunOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                  <div
                        onClick={() => setOpRunOpen(!opRunOpen)}
                        style={{
                          ...cctvDetailSectionHeaderStyle,
                          marginBottom: opRunOpen ? 12 : 0,
                          paddingBottom: opRunOpen ? 8 : 0,
                          borderBottom: opRunOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span className="cctv-section-card-title">Thông tin vận hành khai thác</span>
                        </div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{opRunOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}</span>
                      </div>
                      {opRunOpen && (
                        <DetailTable
                          dataSource={[]}
                          emptyText="Chưa có dữ liệu"
                          rowKey={(r: any) => r.id || r.planCode || r.code}
                          scrollY={160}
                          columns={[
                            { title: 'STT', width: 50 },
                            { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                            { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                            { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.startTime || rec.start || null) },
                            { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.endTime || rec.end || null) },
                          ]}
                        />
                      )}
                    </div>

                    {/* ── Section 2: Thông tin bảo trì (card chuẩn /berth, bấm để đóng/mở) ── */}
                    <div style={{ ...cctvDetailSectionBoxStyle, padding: opMaintOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                      <div
                        onClick={() => setOpMaintOpen(!opMaintOpen)}
                        style={{
                          ...cctvDetailSectionHeaderStyle,
                          marginBottom: opMaintOpen ? 12 : 0,
                          paddingBottom: opMaintOpen ? 8 : 0,
                          borderBottom: opMaintOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span className="cctv-section-card-title">Thông tin bảo trì</span>
                        </div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{opMaintOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}</span>
                      </div>
                      {opMaintOpen && (
                        <DetailTable
                          dataSource={[]}
                          emptyText="Chưa có dữ liệu"
                          rowKey={(r: any) => r.id || r.planCode || r.code}
                          scrollY={160}
                          columns={[
                            { title: 'STT', width: 50 },
                            { title: 'Mã kế hoạch', dataIndex: 'planCode', key: 'code', render: (v: string, rec: any) => v || rec.code || '' },
                            { title: 'Tên kế hoạch', dataIndex: 'planName', key: 'name', render: (v: string, rec: any) => v || rec.name || '' },
                            { title: 'Thời gian bắt đầu', dataIndex: 'startTime', key: 'start', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.start || rec.startDate || null) },
                            { title: 'Thời gian kết thúc', dataIndex: 'endTime', key: 'end', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.end || rec.endDate || null) },
                          ]}
                        />
                      )}
                    </div>

                    {/* ── Section 3: Thông tin sự cố (card chuẩn /berth, bấm để đóng/mở) ── */}
                    <div style={{ ...cctvDetailSectionBoxStyle, padding: opIncidentOpen ? '12px 18px 12px 18px' : '10px 18px' }}>
                      <div
                        onClick={() => setOpIncidentOpen(!opIncidentOpen)}
                        style={{
                          ...cctvDetailSectionHeaderStyle,
                          marginBottom: opIncidentOpen ? 12 : 0,
                          paddingBottom: opIncidentOpen ? 8 : 0,
                          borderBottom: opIncidentOpen ? '1px solid #f1f5f9' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SlidersOutlined style={{ color: actionPrimary }} />
                          <span className="cctv-section-card-title">Thông tin sự cố</span>
                        </div>
                        <span style={{ color: actionPrimary, fontSize: 12, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{opIncidentOpen ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}</span>
                      </div>
                      {opIncidentOpen && (
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
                            { title: 'Thời gian', dataIndex: 'incidentTime', key: 'time', width: 150, align: 'center' as const, render: (v: string, rec: any) => formatDate(v || rec.time || null) },
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
      </Drawer>

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
        rootClassName="cctv-modal-scope"
        className="cctv-modal-scope"
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
        rootClassName="cctv-modal-scope"
        className="cctv-modal-scope"
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
            Vui lòng nhập lý do từ chối cho hệ thống CCTV:
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
        rootClassName="cctv-modal-scope"
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

      {/* Modal Chọn vị trí trên bản đồ — dùng chung Tạo mới / Cập nhật / Xem chi tiết (chuẩn /vts-operation-center) */}
      <Modal
        rootClassName="cctv-modal-scope"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
              Xem vị trí trên bản đồ
            </span>
          </div>
        }
        open={gisMapOpen}
        onCancel={() => setGisMapOpen(false)}
        destroyOnHidden
        width="90vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={null}
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline
            height={560}
            disabled={true}
            value={{
              geometryType:
                normalizeGeometryType((selectedRecord as any)?.geometryType || inferGeometryFromWkt((selectedRecord as any)?.coordinates)),
              coordinates:
                (selectedRecord as any)?.coordinates || '',
              symbolId:
                (selectedRecord as any)?.mapSymbolId || undefined,
            }}
            defaultGeometryType={
              normalizeGeometryType((selectedRecord as any)?.geometryType || inferGeometryFromWkt((selectedRecord as any)?.coordinates)) as 'POINT' | 'LINE' | 'POLYGON'
            }
          />
        </div>
      </Modal>

      {/* ── Create Drawer ─────────────────────────────── */}
      <AppDrawer
        width="min(920px, 96vw)"
        rootClassName="cctv-drawer-scope"
        className="cctv-drawer-scope"
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            Thêm mới hệ thống CCTV
          </span>
        }
        open={createModalOpen}
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
                cctvFormRef.current?.submit('DRAFT');
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
                cctvFormRef.current?.submit('SUBMIT');
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
                  cctvFormRef.current?.submit('APPROVED');
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
          header: {
            padding: '12px 24px',
            borderBottom: `1px solid ${borderDefault}`,
            flexShrink: 0,
          },
          body: { padding: '0 24px 12px 24px' },
        }}
        destroyOnClose
      >
        <style>{requiredMarkStyle}</style>
        {createModalOpen && (
          <Form form={createForm} layout="vertical" initialValues={{}}>
            <CctvForm
              ref={cctvFormRef}
              form={createForm}
              onFinish={() => {
                setCreateModalOpen(false);
                fetchData();
                fetchTabCounts();
              }}
              onSubmittingChange={setSubmitting}
            />
          </Form>
        )}
      </AppDrawer>

      {/* ── Edit Drawer ──────────────────────────────────────────────── */}
      <AppDrawer
        width="min(920px, 96vw)"
        rootClassName="cctv-drawer-scope"
        className="cctv-drawer-scope"
        title={
          <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
            Chỉnh sửa thông tin — {updateTarget?.deviceName || 'Hệ thống CCTV'}
          </span>
        }
        open={updateModalOpen && !!updateTarget}
        onClose={() => {
          setUpdateModalOpen(false);
          setUpdateTarget(null);
          updateForm.resetFields();
          closeLinkedDrawer();
        }}
        footer={
          <div style={drawerFooterStyle}>
            {updateTarget?.approvalStatus !== 'APPROVED' && (
              <Button
                onClick={() => {
                  actionTypeRef.current = 'draft';
                  setActionType('draft');
                  editCctvFormRef.current?.submit('DRAFT');
                }}
                loading={submitting && actionType === 'draft'}
                style={{ ...outlineButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu tạm
              </Button>
            )}
            {(updateTarget?.approvalStatus === 'DRAFT' ||
              updateTarget?.approvalStatus === 'REJECTED_LEVEL1' ||
              updateTarget?.approvalStatus === 'REJECTED_LEVEL2') && (
              <Button
                type="primary"
                onClick={() => {
                  actionTypeRef.current = 'submit';
                  setActionType('submit');
                  editCctvFormRef.current?.submit('SUBMIT');
                }}
                loading={submitting && actionType === 'submit'}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill, height: 40 }}
              >
                Lưu và gửi phê duyệt
              </Button>
            )}
            {updateTarget?.approvalStatus === 'APPROVED' && canSaveAndApprove && (
              <Button
                type="primary"
                onClick={() => {
                  actionTypeRef.current = 'approve';
                  setActionType('approve');
                  editCctvFormRef.current?.submit('APPROVED');
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
          header: {
            padding: '12px 24px',
            borderBottom: `1px solid ${borderDefault}`,
            flexShrink: 0,
          },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {updateTarget?.id && (
          <>
            <style>{requiredMarkStyle}</style>
            <Form form={updateForm} layout="vertical" initialValues={{}}>
              <CctvForm
                ref={editCctvFormRef}
                form={updateForm}
                id={updateTarget.id}
                onFinish={() => {
                  setUpdateModalOpen(false);
                  setUpdateTarget(null);
                  fetchData();
                  fetchTabCounts();
                  closeLinkedDrawer();
                }}
                onSubmittingChange={setSubmitting}
              />
            </Form>
          </>
        )}
      </AppDrawer>

      {/* ── History Drawer ─────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
      rootClassName={THEME_SCOPE_CLASS}
      className="cctv-drawer-scope"
      size={isIframeModal ? '100%' : 960}
        mask={!isIframeModal}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyEntityName ? `Lịch sử thay đổi — ${historyEntityName}` : 'Lịch sử thay đổi'}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusSm, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                {/* Nhật ký nạp theo trang nên đây là số đã tải, không phải tổng (chuẩn /vts-operation-center). */}
                {`Đã tải ${historyRecords.length}`}
              </span>
            </Space>
          </div>
        }
        open={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        extra={<Button type="text" onClick={() => setHistoryModalVisible(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}>
        <div style={{ display: 'flex', gap: spaceSm, alignItems: 'center', paddingBottom: spaceMd }}>
          <Input
            placeholder="Tìm kiếm nội dung thay đổi..."
            allowClear
            value={historySearchInput}
            onChange={(e) => {
              const val = e.target.value;
              setHistorySearchInput(val);
              if (!val) setHistorySearch('');
            }}
            onPressEnter={() => {
              setHistorySearch(historySearchInput.trim());
              setHistoryReloadToken((t) => t + 1);
            }}
            style={{ ...inputStyle, flex: 1 }}
          />
          <DatePicker.RangePicker
            {...getRangePickerProps({
              value: (historyDateFrom && historyDateTo)
                ? [dayjs(historyDateFrom), dayjs(historyDateTo)]
                : (historyDateFrom ? [dayjs(historyDateFrom), null] : (historyDateTo ? [null, dayjs(historyDateTo)] : null)),
              onChange: (dates: any) => {
                if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                  setHistoryDateFrom('');
                  setHistoryDateTo('');
                } else {
                  setHistoryDateFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                  setHistoryDateTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                }
              },
              style: { ...inputStyle, width: 280 },
            })}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loadingHistory}
            onClick={() => {
              setHistorySearch(historySearchInput.trim());
              setHistoryReloadToken((t) => t + 1);
            }}
            style={primaryButtonStyle}
          >
            Tìm kiếm
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} onScroll={handleHistoryScroll}>
          {loadingHistory && historyRecords.length === 0 ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>{historySearch || historyDateFrom || historyDateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div></div>
          ) : (
            <>
              {renderCctvHistoryTimeline(historyRecords)}
              {loadingMoreHistory && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
            </>
          )}
        </div>
      </Drawer>
    </ThemeTokenProvider>
  );
};

export default CctvListPage;
