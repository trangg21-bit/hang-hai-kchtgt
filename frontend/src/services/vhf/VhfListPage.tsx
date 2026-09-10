import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fmtNum } from "../../utils/numFmt";
import {
  parseWktToCoordinates,
  ddToDms,
} from "../../utils/gisGeometry";
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
  Drawer,
} from "antd";
import { OrgUnitTreeSelect } from "../../components/org-unit";
import {
  PlusOutlined,
  SearchOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
import {
  fetchVhfList,
  deleteVhf,
  submitVhf,
  approveVhfC1,
  approveVhfC2,
  fetchVhfHistory,
  fetchVhfAttachments,
  downloadVhfAttachment,
  type VhfAttachmentResponse,
} from "./api";
import {
  OPERATIONAL_STATUS_OPTIONS,
  ATTACHED_INFRA_TYPE_OPTIONS,
  operationalStatusBadge,
} from "./schema";
import type { VhfResponse, ApprovalRequest } from "./types";
import VhfForm, { type VhfFormRef } from "./VhfForm";
import {
  ScreenHeader,
  DataTable,
  Pagination,
  FilterTableLayout,
  SidebarFilterField,
} from "../../components/list-view";
import { VIETNAM_PROVINCES } from "../../types/common";
import { DEFAULT_OPERATING_ORGANIZATIONS } from "../operatingOrganizationsData";
import { organizationService } from "../organizationService";
import DetailTable from "../../components/shared/DetailTable";
import { ThemeTokenProvider, THEME_SCOPE_CLASS } from "../../context/ThemeTokenContext";
import toast from "../../components/ToastNotification";
import { exportTableToExcel, type ExportColumn } from "../../utils/exportExcel";
import { icons } from "../../themetokenchk";
import * as themeTokenChk from "../../themetokenchk";
import api from "../api";
import { useAuthStore } from "../../store/authStore";

// ── Đơn vị đo (unit of measure) labels ──────────────────────────────
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
  20: 'Phương tiện',
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
  cellSubtitleStyle,
} from "../../themetokenchk";

// ── Trạng thái phê duyệt 2 cấp (C1 Cảng vụ → C2 Cục) — đồng bộ chuẩn /cctv ──
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

function renderApprovalBadge(status: string | null | undefined) {
  if (!status) return null;
  const display = APPROVAL_STATUS_MAP[status] || status;
  const color = APPROVAL_COLOR[status] || textTertiary;
  return <span className="kcht-cell-badge" style={statusBadgeStyle(color)}>{display}</span>;
}

const tableMetaStyle: React.CSSProperties = {
  fontSize: fontSizeMd,
  color: textPrimary,
};

const SKELETON_KEYS = ['skel-1', 'skel-2', 'skel-3', 'skel-4', 'skel-5', 'skel-6'];
const LoadingSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 8px' }}>
    {SKELETON_KEYS.slice(0, rows).map((key) => (
      <div
        key={key}
        style={{
          height: 38,
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          borderRadius: 6,
          animation: 'pulse 1.5s infinite',
        }}
      />
    ))}
  </div>
);

// ── AUDIT / HISTORY TIMELINE RENDERING HELPER ─────────────────────────
function renderVhfHistoryTimeline(records: any[]) {
  return (
    <div style={{ padding: '8px 4px' }}>
      {records.map((item, idx) => (
        <div
          key={item.id || idx}
          style={{
            display: 'flex',
            gap: 12,
            position: 'relative',
            paddingBottom: idx === records.length - 1 ? 8 : 20,
          }}
        >
          {idx !== records.length - 1 && (
            <div
              style={{
                position: 'absolute',
                left: 11,
                top: 24,
                bottom: 0,
                width: 2,
                backgroundColor: '#e2e8f0',
              }}
            />
          )}
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: item.action === 'CREATE' ? '#1BAF7A' : item.action === 'DELETE' ? '#e11d48' : '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              zIndex: 1,
            }}
          >
            <HistoryOutlined style={{ color: '#fff', fontSize: 12 }} />
          </div>
          <div
            style={{
              flex: 1,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13.5 }}>
                {item.actionDescription || item.action || 'Cập nhật'}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {item.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#334155', marginBottom: 4 }}>
              <span style={{ color: '#64748b' }}>Người thực hiện: </span>
              <strong>{item.createdBy || item.actorName || 'Hệ thống'}</strong>
            </div>
            {item.description && (
              <div style={{ fontSize: 12.5, color: '#475569', background: '#fff', padding: '6px 10px', borderRadius: 4, border: '1px solid #f1f5f9' }}>
                {item.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const VhfListPage = () => {
  const [searchParams] = useSearchParams();
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const currentUser = useAuthStore((s) => s.user);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [data, setData] = useState<VhfResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "0", 10);
    return isNaN(p) || p < 0 ? 0 : p;
  });
  const [pageSize, setPageSize] = useState(20);

  // Sorting
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const handleSort = useCallback((field: string, order: "asc" | "desc") => {
    setSortField(field);
    setSortOrder(order === "asc" ? "ascend" : "descend");
    setPage(0);
  }, []);

  // Bộ lọc
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState({
    orgUnitId: "" as string,
    deviceName: "",
    deviceCode: "",
    seaportId: "" as string,
    operationalStatus: undefined as number | undefined,
    approvalStatus: "" as string,
    province: "" as string,
    attachedInfraType: undefined as number | undefined,
    attachedInfraId: "" as string,
    yearOfUse: undefined as number | undefined,
    updatedFrom: "" as string,
    updatedTo: "" as string,
  });

  // Tab counts
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [totalAll, setTotalAll] = useState(0);

  // Quản lý Modal & Drawer
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<VhfResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<VhfFormRef>(null);
  const [form] = Form.useForm();

  // Modal phê duyệt / từ chối
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalType, setApprovalType] = useState<'SUBMIT' | 'APPROVE_C1' | 'APPROVE_C2' | 'REJECT_C1' | 'REJECT_C2'>('SUBMIT');
  const [approvalContent, setApprovalContent] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Lịch sử thay đổi
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Đính kèm
  const [viewAttachments, setViewAttachments] = useState<VhfAttachmentResponse[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Danh mục options
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [seaportOptions, setSeaportOptions] = useState<Array<{ id: string; portName: string; portCode?: string }>>([]);

  // Load danh mục đơn vị quản lý, khai thác, cảng biển
  useEffect(() => {
    organizationService.list({ pageSize: 1000 }).then((res) => {
      setOrgUnits(res.data || []);
    }).catch(() => {});

    organizationService.list({ type: 'PORT_AUTHORITY', status: 'ACTIVE' }).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setOperatingOrgs(res.map((o: any) => ({ id: o.id, name: o.name, code: o.code || '' })));
      } else {
        setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS);
      }
    }).catch(() => {
      setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS);
    });

    api.get('/v1/ports/options').then((res) => {
      const data = res.data?.data;
      if (Array.isArray(data)) setSeaportOptions(data);
    }).catch(() => {
      api.get('/v1/ports?size=1000').then((res) => {
        const list = res.data?.data?.content || res.data?.data || [];
        if (Array.isArray(list)) {
          setSeaportOptions(list.map((p: any) => ({ id: p.id, portName: p.portName || p.name, portCode: p.portCode || p.code })));
        }
      }).catch(() => {});
    });
  }, []);

  // Lấy dữ liệu danh sách
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const safePage = Math.max(page, 0);
      const safeSize = Math.max(1, Math.min(pageSize, 100));
      const result = await fetchVhfList({
        page: safePage,
        size: safeSize,
        orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__' ? filterValues.orgUnitId : undefined),
        search: filterValues.deviceCode || filterValues.deviceName || undefined,
        deviceCode: filterValues.deviceCode || undefined,
        deviceName: filterValues.deviceName || undefined,
        seaportId: filterValues.seaportId || undefined,
        operationalStatus: filterValues.operationalStatus != null ? String(filterValues.operationalStatus) : undefined,
        approvalStatus: filterValues.approvalStatus || undefined,
        province: filterValues.province || undefined,
        attachedInfraType: filterValues.attachedInfraType,
        attachedInfraId: filterValues.attachedInfraId || undefined,
        yearOfUse: filterValues.yearOfUse,
        updatedFrom: filterValues.updatedFrom || undefined,
        updatedTo: filterValues.updatedTo || undefined,
        sortBy: sortField || "updatedAt",
        sortOrder: sortOrder === "ascend" ? "asc" : "desc",
      });
      setData(result.content || []);
      setTotal(result.totalElements || 0);
      setPage(result.number || 0);
    } catch (error: any) {
      setIsError(error?.response?.data?.message || "Lỗi khi tải danh sách hệ thống VHF");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterValues, sortField, sortOrder]);

  const fetchTabCounts = useCallback(async () => {
    const statuses = [
      { key: "DRAFT", status: "DRAFT" },
      { key: "PENDING_APPROVAL", status: "PENDING_APPROVAL" },
      { key: "APPROVED_LEVEL1", status: "APPROVED_LEVEL1" },
      { key: "APPROVED", status: "APPROVED" },
      { key: "REJECTED_LEVEL1", status: "REJECTED_LEVEL1" },
      { key: "REJECTED_LEVEL2", status: "REJECTED_LEVEL2" },
    ];
    try {
      const results = await Promise.allSettled(
        statuses.map((s) =>
          fetchVhfList({
            page: 0,
            size: 1,
            orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__' ? filterValues.orgUnitId : undefined),
            approvalStatus: s.status,
          })
        )
      );
      const counts: Record<string, number> = {};
      results.forEach((r, i) => {
        counts[statuses[i].key] = r.status === "fulfilled" ? (r.value?.totalElements || 0) : 0;
      });
      setTabCounts(counts);

      const allRes = await fetchVhfList({
        page: 0,
        size: 1,
        orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__' ? filterValues.orgUnitId : undefined),
      });
      setTotalAll(allRes.totalElements || 0);
    } catch {
      // ignore
    }
  }, [filterValues.orgUnitId]);

  useEffect(() => {
    fetchData();
    fetchTabCounts();
  }, [fetchData, fetchTabCounts]);

  const handleFilterApply = useCallback(() => {
    setPage(0);
    fetchData();
    fetchTabCounts();
  }, [fetchData, fetchTabCounts]);

  const handleFilterReset = useCallback(() => {
    setFilterValues({
      orgUnitId: "",
      deviceName: "",
      deviceCode: "",
      seaportId: "",
      operationalStatus: undefined,
      approvalStatus: "",
      province: "",
      attachedInfraType: undefined,
      attachedInfraId: "",
      yearOfUse: undefined,
      updatedFrom: "",
      updatedTo: "",
    });
    setPage(0);
    fetchData();
    fetchTabCounts();
  }, [fetchData, fetchTabCounts]);

  // Load attachments khi mở xem chi tiết
  useEffect(() => {
    if (drawerMode === 'view' && selectedRecord?.id) {
      setLoadingAttachments(true);
      fetchVhfAttachments(selectedRecord.id)
        .then((res: any) => {
          setViewAttachments(Array.isArray(res) ? res : (res?.data || []));
        })
        .catch(() => {
          setViewAttachments([]);
        })
        .finally(() => {
          setLoadingAttachments(false);
        });
    } else {
      setViewAttachments([]);
    }
  }, [drawerMode, selectedRecord?.id]);

  const handleOpenCreate = () => {
    setSelectedRecord(null);
    form.resetFields();
    setDrawerMode('create');
  };

  const handleOpenEdit = (record: VhfResponse) => {
    setSelectedRecord(record);
    form.resetFields();
    setDrawerMode('edit');
  };

  const handleOpenView = (record: VhfResponse) => {
    setSelectedRecord(record);
    setDrawerMode('view');
  };

  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleDelete = (record: VhfResponse) => {
    Modal.confirm({
      title: "Xác nhận xóa hệ thống thông tin liên lạc VHF",
      icon: <ExclamationCircleOutlined style={{ color: statusCritical }} />,
      content: `Bạn có chắc chắn muốn xóa thiết bị "${record.deviceName}" (${record.deviceCode})?`,
      okText: "Xác nhận xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteVhf(record.id);
          toast.success("Xóa hệ thống thông tin liên lạc VHF thành công");
          fetchData();
          fetchTabCounts();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Lỗi khi xóa hệ thống VHF");
        }
      },
    });
  };

  const handleOpenApproval = (record: VhfResponse, type: 'SUBMIT' | 'APPROVE_C1' | 'APPROVE_C2' | 'REJECT_C1' | 'REJECT_C2') => {
    setSelectedRecord(record);
    setApprovalType(type);
    setApprovalContent('');
    setApprovalModalOpen(true);
  };

  const handleExecuteApproval = async () => {
    if (!selectedRecord) return;
    setSubmittingApproval(true);
    try {
      if (approvalType === 'SUBMIT') {
        await submitVhf(selectedRecord.id, approvalContent);
        toast.success("Trình duyệt thành công");
      } else if (approvalType === 'APPROVE_C1') {
        await approveVhfC1(selectedRecord.id, { decision: 'APPROVED', reason: approvalContent });
        toast.success("Phê duyệt cấp Cảng vụ thành công");
      } else if (approvalType === 'REJECT_C1') {
        await approveVhfC1(selectedRecord.id, { decision: 'REJECTED', reason: approvalContent });
        toast.success("Từ chối cấp Cảng vụ thành công");
      } else if (approvalType === 'APPROVE_C2') {
        await approveVhfC2(selectedRecord.id, { decision: 'APPROVED', reason: approvalContent });
        toast.success("Phê duyệt cấp Cục thành công");
      } else if (approvalType === 'REJECT_C2') {
        await approveVhfC2(selectedRecord.id, { decision: 'REJECTED', reason: approvalContent });
        toast.success("Từ chối cấp Cục thành công");
      }
      setApprovalModalOpen(false);
      fetchData();
      fetchTabCounts();
      if (drawerMode === 'view') {
        handleCloseDrawer();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xử lý phê duyệt thất bại");
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleOpenHistory = async (record: VhfResponse) => {
    setSelectedRecord(record);
    setHistoryDrawerVisible(true);
    setLoadingHistory(true);
    try {
      const res: any = await fetchVhfHistory(record.id);
      setHistoryRecords(Array.isArray(res) ? res : (res?.data || []));
    } catch {
      setHistoryRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetchVhfList({
        page: 0,
        size: 10000,
        keyword: filterValues.deviceName || filterValues.deviceCode || undefined,
        orgUnitId: (filterValues.orgUnitId && filterValues.orgUnitId !== '__all__' ? filterValues.orgUnitId : undefined),
        seaportId: filterValues.seaportId || undefined,
        operatingUnitId: undefined,
        operationalStatus: filterValues.operationalStatus != null ? String(filterValues.operationalStatus) : undefined,
        province: filterValues.province || undefined,
        yearOfUse: filterValues.yearOfUse,
        updatedFrom: filterValues.updatedFrom || undefined,
        updatedTo: filterValues.updatedTo || undefined,
        approvalStatus: filterValues.approvalStatus || undefined,
      });
      const excelColumns: ExportColumn[] = [
        { header: 'STT', key: 'stt' },
        { header: 'Mã thiết bị', key: 'deviceCode' },
        { header: 'Tên thiết bị', key: 'deviceName' },
        { header: 'Thuộc cảng biển', key: 'seaportName' },
        { header: 'Đơn vị quản lý', key: 'orgUnitName' },
        { header: 'Thuộc hạ tầng', key: 'attachedInfrastructureName' },
        { header: 'Đơn vị khai thác', key: 'operatingUnitName' },
        { header: 'Địa điểm (Tỉnh/TP)', key: 'provinceName' },
        { header: 'Đơn vị tính', key: 'unitOfMeasure' },
        { header: 'Số lượng', key: 'quantity' },
        { header: 'Năm đưa vào sử dụng', key: 'yearOfUse' },
        { header: 'Tình trạng hoạt động', key: 'operationalStatus' },
        { header: 'Trạng thái phê duyệt', key: 'approvalStatus' },
      ];
      const rows = (res.content || []).map((item, idx) => ({
        stt: idx + 1,
        deviceCode: item.deviceCode,
        deviceName: item.deviceName,
        seaportName: item.seaportName || '',
        orgUnitName: item.orgUnitName || '',
        attachedInfrastructureName: item.attachedInfrastructureName || '',
        operatingUnitName: item.operatingUnitName || '',
        provinceName: item.provinceName || '',
        unitOfMeasure: formatUnitOfMeasure(item.unitOfMeasure),
        quantity: item.quantity || 1,
        yearOfUse: item.yearOfUse || '',
        operationalStatus: item.operationalStatus || '',
        approvalStatus: APPROVAL_STATUS_MAP[item.approvalStatus || ''] || item.approvalStatus || '',
      }));
      exportTableToExcel(excelColumns, rows, 'Danh_sach_he_thong_VHF');
      toast.success("Xuất danh sách Excel thành công");
    } catch {
      toast.error("Lỗi khi xuất dữ liệu Excel");
    }
  };

  // Helper render stack info (tên + ngày giờ) chuẩn /cctv
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

  // ── Columns đồng bộ chuẩn /cctv ──
  const columns: any[] = useMemo(() => [
    {
      key: "index",
      label: "STT",
      width: 60,
      type: "mono" as const,
      align: "center" as const,
      fixed: "left" as const,
      render: (_: unknown, __: VhfResponse, index: number) => (
        <span style={{ ...tableMetaStyle, fontWeight: fontWeightMedium }}>
          {page * pageSize + index + 1}
        </span>
      ),
    },
    {
      key: "deviceName",
      label: "Tên / Mã thiết bị",
      dataIndex: "deviceName",
      width: 340,
      fixed: "left" as const,
      ellipsis: false,
      sortable: true,
      sortOrder: sortField === "deviceName" ? sortOrder : null,
      render: (val: string, record: VhfResponse) => (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: "1.35" }}>
          <button
            type="button"
            className="kcht-cell-title"
            onClick={() => handleOpenView(record)}
            style={{ border: "none", background: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%", fontWeight: fontWeightBold, color: actionPrimary }}
            title={val || null}
          >
            {val || null}
          </button>
          <span className="kcht-cell-code" style={{ ...cellSubtitleStyle }}>{record.deviceCode || null}</span>
        </div>
      ),
    },
    {
      key: "seaportName",
      label: "Thuộc cảng biển",
      dataIndex: "seaportName",
      width: 220,
      ellipsis: true,
      render: (val: string) => <span style={tableMetaStyle}>{val || '—'}</span>,
    },
    {
      key: "orgUnitName",
      label: "Đơn vị quản lý",
      dataIndex: "orgUnitName",
      width: 260,
      render: (val: string) => (
        <span style={{ ...tableMetaStyle, fontWeight: fontWeightBold }}>{val || '—'}</span>
      ),
    },
    {
      key: "vtsSystemName",
      label: "Thuộc TTDH VTS/Trạm Radar",
      dataIndex: "attachedInfrastructureName",
      width: 280,
      render: (val: string) => (
        <span style={tableMetaStyle}>{val || '—'}</span>
      ),
    },
    {
      key: "operatingUnitName",
      label: "Đơn vị khai thác",
      dataIndex: "operatingUnitName",
      width: 260,
      render: (val: string) => (
        <span style={tableMetaStyle}>{val || '—'}</span>
      ),
    },
    {
      key: "provinceName",
      label: "Địa điểm\n(Tỉnh/Thành phố)",
      dataIndex: "provinceName",
      width: 220,
      ellipsis: false,
      render: (val: string) => (
        <span style={tableMetaStyle}>{val || '—'}</span>
      ),
    },
    {
      key: "unitOfMeasure",
      label: "Đơn vị tính",
      dataIndex: "unitOfMeasure",
      width: 130,
      render: (val: number) => (
        <span style={tableMetaStyle}>{val != null ? formatUnitOfMeasure(val) : '—'}</span>
      ),
    },
    {
      key: "quantity",
      label: "Số lượng",
      dataIndex: "quantity",
      width: 120,
      align: "center" as const,
      render: (val: number) => (
        <span style={{ ...tableMetaStyle, fontWeight: fontWeightMedium }}>{val != null ? val : 1}</span>
      ),
    },
    {
      key: "yearOfUse",
      label: "Năm đưa vào\nsử dụng",
      dataIndex: "yearOfUse",
      width: 160,
      align: "center" as const,
      ellipsis: false,
      render: (val: number) => (
        <span style={tableMetaStyle}>{val || '—'}</span>
      ),
    },
    {
      key: "updatedByName",
      label: "Cán bộ cập nhật",
      dataIndex: "updatedByName",
      width: 200,
      sortable: true,
      sortOrder: sortField === "updatedAt" || sortField === "updatedByName" ? sortOrder : null,
      render: (_: unknown, record: VhfResponse) => renderInfoStack(record.updatedByName, record.updatedAt),
    },
    {
      key: "submittedInfo",
      label: "Cán bộ gửi phê duyệt",
      dataIndex: "submittedByName",
      width: 230,
      render: (_: unknown, record: VhfResponse) => renderInfoStack(record.submittedByName, record.submittedDate),
    },
    {
      key: "approvedLevel1Info",
      label: "Cán bộ phê duyệt cấp Cảng vụ/Chi cục",
      dataIndex: "approverLevel1Name",
      width: 380,
      render: (_: unknown, record: VhfResponse) => renderInfoStack(record.approverLevel1Name, record.approvedDateLevel1),
    },
    {
      key: "approvedLevel2Info",
      label: "Cán bộ phê duyệt cấp Cục",
      dataIndex: "approverLevel2Name",
      width: 270,
      render: (_: unknown, record: VhfResponse) => renderInfoStack(record.approverLevel2Name, record.approvedDateLevel2),
    },
    {
      key: "operationalStatus",
      label: "Tình trạng",
      dataIndex: "operationalStatus",
      width: 270,
      type: "status" as const,
      render: (val: number | string) => {
        const num = typeof val === 'number' ? val : (val === 'OPERATIONAL' || val === '1' ? 1 : val === 'SUSPENDED' || val === '2' ? 2 : 0);
        const badge = operationalStatusBadge(num);
        return (
          <span className="kcht-cell-badge" style={statusBadgeStyle(badge.color)}>
            {badge.label}
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
  ], [page, pageSize, sortField, sortOrder, handleOpenView]);

  // ── Row Actions chuẩn /cctv ──
  const rowActions = useCallback((record: VhfResponse) => {
    const actions: any[] = [];

    actions.push({
      key: "view",
      label: "Xem chi tiết",
      icon: icons.view,
      onClick: () => handleOpenView(record),
    });

    if (hasPerm?.("vhf:update")) {
      actions.push({
        key: "edit",
        label: "Chỉnh sửa",
        icon: icons.edit,
        onClick: () => handleOpenEdit(record),
      });
    }

    actions.push({
      key: "history",
      label: "Lịch sử",
      icon: icons.history,
      onClick: () => handleOpenHistory(record),
    });

    if (
      hasPerm?.("vhf:update") &&
      (record.approvalStatus === "DRAFT" ||
        record.approvalStatus === "REJECTED_LEVEL1" ||
        record.approvalStatus === "REJECTED_LEVEL2")
    ) {
      actions.push({
        key: "submit",
        label: "Gửi phê duyệt",
        icon: icons.submit,
        onClick: () => handleOpenApproval(record, 'SUBMIT'),
      });
    }

    if (hasPerm?.("vhf:approvec1") && record.approvalStatus === "PENDING_APPROVAL") {
      actions.push({
        key: "approveC1",
        label: "Phê duyệt cấp Cảng vụ",
        icon: icons.approve,
        onClick: () => handleOpenApproval(record, 'APPROVE_C1'),
      });
      actions.push({
        key: "rejectC1",
        label: "Từ chối cấp Cảng vụ",
        icon: icons.reject,
        danger: true,
        onClick: () => handleOpenApproval(record, 'REJECT_C1'),
      });
    }

    if (hasPerm?.("vhf:approvec2") && record.approvalStatus === "APPROVED_LEVEL1") {
      actions.push({
        key: "approveC2",
        label: "Phê duyệt cấp Cục",
        icon: icons.approve,
        onClick: () => handleOpenApproval(record, 'APPROVE_C2'),
      });
      actions.push({
        key: "rejectC2",
        label: "Từ chối cấp Cục",
        icon: icons.reject,
        danger: true,
        onClick: () => handleOpenApproval(record, 'REJECT_C2'),
      });
    }

    if (hasPerm?.("vhf:delete") && record.approvalStatus === "DRAFT") {
      actions.push({
        key: "delete",
        label: "Xóa",
        icon: icons.delete,
        danger: true,
        onClick: () => handleDelete(record),
      });
    }

    return actions;
  }, [hasPerm, handleOpenView, handleOpenEdit, handleOpenHistory, handleOpenApproval, handleDelete]);

  const CHK_FILTER_LABEL = { ...themeTokenChk.filterLabelStyle, fontSize: 13.5 };

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5, filterLabelStyle: CHK_FILTER_LABEL }}>
      <div className="vhf-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <style>{`
          .vhf-page-wrapper,
          .vhf-page-wrapper .ant-input,
          .vhf-page-wrapper .ant-select,
          .vhf-page-wrapper .ant-picker,
          .vhf-page-wrapper .ant-btn,
          .vhf-page-wrapper .ant-pagination { font-size: 13.5px !important; }
          .vhf-page-wrapper.vhf-page-wrapper .ant-table-row .kcht-cell-title.kcht-cell-title { font-size: 14px !important; }
          .vhf-page-wrapper.vhf-page-wrapper .kcht-cell-code { font-size: 12px !important; }
          .vhf-page-wrapper.vhf-page-wrapper .kcht-cell-badge { font-size: 13px !important; }
          .vhf-page-wrapper .list-view-table .ant-table-cell { padding-block: 8.5px !important; }
        `}</style>

        <ScreenHeader
          breadcrumb={[
            { label: "Trang chủ", path: "/" },
            { label: "Luồng hàng hải", path: "/navigation-channel" },
            { label: "Quản lý hệ thống thông tin liên lạc VHF", path: "/vhf" },
          ]}
          actions={[
            hasPerm?.("vhf:create")
              ? {
                  key: "create",
                  label: "Thêm mới",
                  icon: <PlusOutlined />,
                  variant: "primary" as const,
                  onClick: handleOpenCreate,
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
                  organizations={orgUnits}
                  placeholder="Chọn đơn vị"
                  allowClear
                  showPath
                  allLabel="Tất cả"
                  value={filterValues.orgUnitId || undefined}
                  onChange={(val) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: val as string || "" }));
                    setPage(0);
                  }}
                  style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tên thiết bị" labelGap={spaceSm}>
                <Input
                  placeholder="Tìm theo tên thiết bị..."
                  allowClear
                  value={filterValues.deviceName || ""}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, deviceName: e.target.value }))}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </SidebarFilterField>

              {filterCollapsed && (
                <>
                  <SidebarFilterField label="Mã thiết bị" labelGap={spaceSm}>
                    <Input
                      placeholder="Tìm theo mã thiết bị..."
                      allowClear
                      value={filterValues.deviceCode || ""}
                      onChange={(e) => setFilterValues((prev) => ({ ...prev, deviceCode: e.target.value }))}
                      onPressEnter={handleFilterApply}
                      style={{ borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Thuộc cảng biển" labelGap={spaceSm}>
                    <Select
                      placeholder="Chọn cảng biển"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      value={filterValues.seaportId || undefined}
                      onChange={(val) => setFilterValues((prev) => ({ ...prev, seaportId: val as string || "" }))}
                      options={seaportOptions.map((p) => ({ label: p.portCode ? `${p.portCode} - ${p.portName}` : p.portName, value: p.id }))}
                      style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Tình trạng" labelGap={spaceSm}>
                    <Select
                      placeholder="Chọn tình trạng"
                      allowClear
                      value={filterValues.operationalStatus || undefined}
                      onChange={(val) => setFilterValues((prev) => ({ ...prev, operationalStatus: val as number | undefined }))}
                      options={OPERATIONAL_STATUS_OPTIONS}
                      style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Thuộc loại hạ tầng" labelGap={spaceSm}>
                    <Select
                      placeholder="Chọn loại hạ tầng"
                      allowClear
                      value={filterValues.attachedInfraType || undefined}
                      onChange={(val) => setFilterValues((prev) => ({ ...prev, attachedInfraType: val as number | undefined }))}
                      options={ATTACHED_INFRA_TYPE_OPTIONS}
                      style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Năm đưa vào sử dụng" labelGap={spaceSm}>
                    <Select
                      placeholder="Chọn năm"
                      allowClear
                      showSearch
                      value={filterValues.yearOfUse || undefined}
                      onChange={(val) => setFilterValues((prev) => ({ ...prev, yearOfUse: val as number | undefined }))}
                      options={Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return { value: year, label: String(year) };
                      })}
                      style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Ngày cập nhật" labelGap={spaceSm}>
                    <DatePicker.RangePicker
                      {...getRangePickerProps()}
                      style={{ width: "100%" }}
                      value={filterValues.updatedFrom && filterValues.updatedTo ? [dayjs(filterValues.updatedFrom), dayjs(filterValues.updatedTo)] : null}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setFilterValues((prev) => ({
                            ...prev,
                            updatedFrom: dates[0]!.startOf('day').toISOString(),
                            updatedTo: dates[1]!.endOf('day').toISOString(),
                          }));
                        } else {
                          setFilterValues((prev) => ({ ...prev, updatedFrom: "", updatedTo: "" }));
                        }
                      }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)" labelGap={spaceSm}>
                    <Select
                      placeholder="Chọn Tỉnh/Thành phố"
                      allowClear
                      showSearch
                      value={filterValues.province || undefined}
                      onChange={(val) => setFilterValues((prev) => ({ ...prev, province: val as string || "" }))}
                      options={VIETNAM_PROVINCES.map((p) => ({ label: p, value: p }))}
                      style={{ width: "100%", borderRadius: radiusPill, height: 40 }}
                    />
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
            const approvalStatus = key === "all" ? "" : key;
            setFilterValues((prev) => ({ ...prev, approvalStatus }));
            setPage(0);
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

        {/* ── DRAWER FORM TẠO MỚI / CHỈNH SỬA ── */}
        <Drawer
          {...drawerProps}
          destroyOnClose
          open={drawerMode === 'create' || drawerMode === 'edit'}
          onClose={handleCloseDrawer}
          title={
            <span style={drawerTitleStyle}>
              {drawerMode === 'create'
                ? 'Thêm mới hệ thống thông tin liên lạc VHF'
                : `Chỉnh sửa hệ thống thông tin liên lạc VHF: ${selectedRecord?.deviceName || ''}`}
            </span>
          }
          extra={
            <Button type="text" onClick={handleCloseDrawer} style={drawerCloseBtnStyle}>
              ✕
            </Button>
          }
          footer={
            <div style={drawerFooterStyle}>
              <Button style={{ ...outlineButtonStyle, borderRadius: radiusPill }} onClick={handleCloseDrawer}>
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                loading={isSubmitting}
                style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
                onClick={() => formRef.current?.submit('UPDATE')}
              >
                {drawerMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
              </Button>
            </div>
          }
          width={840}
        >
          <VhfForm
            ref={formRef}
            form={form}
            id={selectedRecord?.id}
            onFinish={() => {
              handleCloseDrawer();
              fetchData();
              fetchTabCounts();
            }}
            onSubmittingChange={setIsSubmitting}
          />
        </Drawer>

        {/* ── DRAWER XEM CHI TIẾT ── */}
        <Drawer
          {...drawerProps}
          open={drawerMode === 'view'}
          onClose={handleCloseDrawer}
          title={
            <span style={drawerTitleStyle}>
              Chi tiết hệ thống thông tin liên lạc VHF: {selectedRecord?.deviceName || ''}
            </span>
          }
          extra={
            <Button type="text" onClick={handleCloseDrawer} style={drawerCloseBtnStyle}>
              ✕
            </Button>
          }
          footer={
            <div style={drawerFooterStyle}>
              <Button style={{ ...outlineButtonStyle, borderRadius: radiusPill }} onClick={handleCloseDrawer}>
                Đóng
              </Button>
              {selectedRecord && (
                <Space>
                  {selectedRecord.approvalStatus === 'DRAFT' && hasPerm('vhf:update') && (
                    <Button
                      type="primary"
                      style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
                      onClick={() => handleOpenApproval(selectedRecord, 'SUBMIT')}
                    >
                      Trình duyệt
                    </Button>
                  )}
                  {selectedRecord.approvalStatus === 'PENDING_APPROVAL' && hasPerm('vhf:approve') && (
                    <>
                      <Button
                        danger
                        style={{ borderRadius: radiusPill }}
                        onClick={() => handleOpenApproval(selectedRecord, 'REJECT_C1')}
                      >
                        Từ chối C1
                      </Button>
                      <Button
                        type="primary"
                        style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
                        onClick={() => handleOpenApproval(selectedRecord, 'APPROVE_C1')}
                      >
                        Duyệt C1
                      </Button>
                    </>
                  )}
                  {selectedRecord.approvalStatus === 'APPROVED_LEVEL1' && hasPerm('vhf:approve') && (
                    <>
                      <Button
                        danger
                        style={{ borderRadius: radiusPill }}
                        onClick={() => handleOpenApproval(selectedRecord, 'REJECT_C2')}
                      >
                        Từ chối C2
                      </Button>
                      <Button
                        type="primary"
                        style={{ ...primaryButtonStyle, borderRadius: radiusPill }}
                        onClick={() => handleOpenApproval(selectedRecord, 'APPROVE_C2')}
                      >
                        Duyệt C2
                      </Button>
                    </>
                  )}
                </Space>
              )}
            </div>
          }
          width={880}
        >
          {selectedRecord && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: 16 }}>
                <div><strong>Mã thiết bị:</strong> {selectedRecord.deviceCode}</div>
                <div><strong>Tên thiết bị:</strong> {selectedRecord.deviceName}</div>
                <div><strong>Thuộc cảng biển:</strong> {selectedRecord.seaportName || '—'}</div>
                <div><strong>Vị trí chi tiết:</strong> {selectedRecord.detailedLocation || '—'}</div>
                <div><strong>Hãng sản xuất:</strong> {selectedRecord.manufacturer || '—'}</div>
                <div><strong>Model:</strong> {selectedRecord.model || '—'}</div>
                <div><strong>Số lượng:</strong> {selectedRecord.quantity || 1}</div>
                <div><strong>Đơn vị đo:</strong> {formatUnitOfMeasure(selectedRecord.unitOfMeasure)}</div>
                <div><strong>Năm đưa vào sử dụng:</strong> {selectedRecord.yearOfUse || '—'}</div>
                <div><strong>Đơn vị quản lý:</strong> {selectedRecord.orgUnitName || '—'}</div>
                <div><strong>Đơn vị khai thác:</strong> {selectedRecord.operatingUnitName || '—'}</div>
                <div><strong>Tỉnh/Thành phố:</strong> {selectedRecord.provinceName || '—'}</div>
                <div><strong>Hạ tầng gắn kèm:</strong> {selectedRecord.attachedInfrastructureName || '—'}</div>
                <div>
                  <strong>Tình trạng:</strong>{' '}
                  <span style={statusBadgeStyle(operationalStatusBadge(typeof selectedRecord.operationalStatus === 'number' ? selectedRecord.operationalStatus : 1).color)}>
                    {operationalStatusBadge(typeof selectedRecord.operationalStatus === 'number' ? selectedRecord.operationalStatus : 1).label}
                  </span>
                </div>
                <div>
                  <strong>Trạng thái phê duyệt:</strong>{' '}
                  {renderApprovalBadge(selectedRecord.approvalStatus)}
                </div>
              </div>

              {/* Danh sách đính kèm */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontWeight: fontWeightBold, marginBottom: 10 }}>Tài liệu đính kèm</h4>
                <DetailTable
                  columns={[
                    {
                      title: 'STT',
                      key: 'stt',
                      width: 60,
                      align: 'center' as const,
                      render: (_: unknown, __: unknown, idx: number) => (
                        <span style={{ color: textSecondary, fontSize: fontSizeSm }}>{idx + 1}</span>
                      ),
                    },
                    {
                      title: 'Tên tài liệu',
                      dataIndex: 'fileName',
                      key: 'fileName',
                      render: (name: string) => (
                        <span style={{ fontWeight: fontWeightMedium, color: textPrimary, fontSize: fontSizeSm }}>
                          {name || '—'}
                        </span>
                      ),
                    },
                    {
                      title: 'Dung lượng',
                      dataIndex: 'fileSize',
                      key: 'fileSize',
                      width: 120,
                      align: 'right' as const,
                      render: (size?: number) => (
                        <span style={{ color: textSecondary, fontSize: fontSizeSm }}>
                          {size ? `${(size / 1024).toFixed(1)} KB` : '—'}
                        </span>
                      ),
                    },
                  ]}
                  dataSource={viewAttachments}
                  rowKey="id"
                  loading={loadingAttachments}
                  pagination={false}
                  scrollY={DRAWER_TABLE_SCROLL_Y.pureTable}
                />
              </div>
            </div>
          )}
        </Drawer>

        {/* ── MODAL PHÊ DUYỆT / TỪ CHỐI ── */}
        <Modal
          open={approvalModalOpen}
          onCancel={() => setApprovalModalOpen(false)}
          onOk={handleExecuteApproval}
          confirmLoading={submittingApproval}
          title={
            approvalType === 'SUBMIT'
              ? 'Trình duyệt hệ thống thông tin liên lạc VHF'
              : approvalType.startsWith('APPROVE')
              ? 'Phê duyệt hệ thống thông tin liên lạc VHF'
              : 'Từ chối phê duyệt hệ thống thông tin liên lạc VHF'
          }
          okText={approvalType.startsWith('REJECT') ? 'Xác nhận từ chối' : 'Xác nhận'}
          okButtonProps={{ danger: approvalType.startsWith('REJECT') }}
          cancelText="Hủy"
        >
          <div style={{ padding: '12px 0' }}>
            <p>
              Thiết bị: <strong>{selectedRecord?.deviceName}</strong> ({selectedRecord?.deviceCode})
            </p>
            <Form.Item label="Nội dung / Lý do:">
              <Input.TextArea
                rows={4}
                value={approvalContent}
                onChange={(e) => setApprovalContent(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do phê duyệt / từ chối..."
              />
            </Form.Item>
          </div>
        </Modal>

        {/* ── DRAWER LỊCH SỬ THAY ĐỔI ── */}
        <Drawer
          open={historyDrawerVisible}
          onClose={() => setHistoryDrawerVisible(false)}
          title={`Lịch sử thay đổi: ${selectedRecord?.deviceName || ''}`}
          width={640}
        >
          {loadingHistory ? (
            <LoadingSkeleton rows={5} />
          ) : historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: textTertiary }}>
              Chưa có lịch sử thay đổi nào được ghi nhận
            </div>
          ) : (
            renderVhfHistoryTimeline(historyRecords)
          )}
        </Drawer>
      </div>
    </ThemeTokenProvider>
  );
};

export default VhfListPage;
