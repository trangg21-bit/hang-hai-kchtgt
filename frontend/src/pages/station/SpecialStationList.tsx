import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  Tag,
  Modal,
  Input,
  InputNumber,
  Select,
  Typography,
  Form,
  Row,
  Col,
  Upload,
  Tabs,
  Tooltip,
  Table,
  DatePicker,
} from 'antd';
import toast, { modal } from '../../components/ToastNotification';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  SendOutlined,
  UploadOutlined,
  FileOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { UploadFile } from 'antd';
import {
  fetchInmarsatList,
  fetchInmarsatCounts,
  fetchInmarsatById,
  createInmarsat,
  updateInmarsat,
  deleteInmarsat,
  submitInmarsat,
  approveInmarsatL1,
  approveInmarsatL2,
  rejectInmarsat,
  fetchInmarsatHistory,
} from '../../services/station/api';
import type {
  CoastalStationInmarsatResponse,
  CoastalStationInmarsatRequest,
  CoastalStationInmarsatUpdateRequest,
  CoastalStationInmarsatHistoryResponse,
} from '../../services/station/types';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout, { type StatusTab } from '../../components/list-view/FilterTableLayout';
import ListPageContainer from '../../components/list-view/ListPageContainer';
import SidebarFilterField from '../../components/list-view/SidebarFilterField';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { AppDrawer } from '../../components/shared/AppDrawer';
import FormSaveFooter, { type FormSaveAction } from '../../components/shared/FormSaveFooter';
import { FORM_TAB_LABEL } from '../../components/shared/formTabs';
import { symbolService } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../types/common';
import { colors } from '../../theme';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import { formLabelProps } from '../../components/shared/formLabel';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  radiusSm,
  radiusMd,
  radiusPill,
  surfaceCard,
  borderDefault,
  spaceSm,
  spaceMd,
  spaceLg,
  spaceXl,
  spaceFormField,
  badgeBaseStyle,
  uploadHintStyle,
  inputStyle,
  selectStyle,
  filterInputStyle,
  dangerButtonStyle,
  rejectReasonStyle,
  formFieldStyle,
  formRowGutter,
  drawerTitleStyle,
  drawerCloseBtnStyle,
} from '../../tokens';

const { TextArea } = Input;
const { Text } = Typography;

// --- CONSTANTS ---
export const CONDITION_STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Đang khai thác', color: statusOperational },
  { value: 'MAINTENANCE', label: 'Bảo trì / Sửa chữa', color: statusAttention },
  { value: 'STOPPED', label: 'Tạm ngừng hoạt động', color: statusCritical },
  { value: 'NOT_OPERATIONAL', label: 'Chưa hoạt động', color: statusDraft },
];

export const INMARSAT_SERVICE_OPTIONS = [
  { value: 'Inmarsat-C', label: 'Inmarsat-C (GMDSS / Cứu nạn an toàn)' },
  { value: 'Inmarsat-F77', label: 'Inmarsat-F77 (Thoại & Dữ liệu tốc độ cao)' },
  { value: 'FleetBroadband', label: 'FleetBroadband (Băng thông rộng)' },
  { value: 'SafetyNET', label: 'SafetyNET (Phát MSI an toàn hàng hải)' },
  { value: 'Fleet Safety', label: 'Fleet Safety (An toàn thế hệ mới)' },
  { value: 'LRIT Tracking', label: 'LRIT Tracking (Truy nhận & Theo dõi)' },
  { value: 'EGC', label: 'EGC (Enhanced Group Call)' },
];

export const OBJECT_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Điểm (Point)' },
  { value: 'LINE', label: 'Đường (Line)' },
  { value: 'POLYGON', label: 'Vùng (Polygon)' },
];

export default function SpecialStationList() {
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id;
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // Data & Pagination
  const [data, setData] = useState<CoastalStationInmarsatResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filter States
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>(undefined);
  const [filterOperatingOrgId, setFilterOperatingOrgId] = useState<string | undefined>(undefined);
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>(undefined);
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>(undefined);
  const [filterCollapsed, setFilterCollapsed] = useState<boolean>(false);
  const [filterDateRange, setFilterDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Dropdown options
  const [operatingOrgOptions, setOperatingOrgOptions] = useState<{ value: string; label: string }[]>(
    DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({ value: o.id, label: o.name }))
  );
  const [mapSymbolOptions, setMapSymbolOptions] = useState<{ value: string; label: string }[]>([]);
  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRecord, setSelectedRecord] = useState<CoastalStationInmarsatResponse | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState('1');
  const [form] = Form.useForm();
  const [savingAction, setSavingAction] = useState<FormSaveAction | null>(null);

  // Form Cascading values
  const formOrgUnitId = Form.useWatch('orgUnitId', form);

  // History & Attachments
  const [historyList, setHistoryList] = useState<CoastalStationInmarsatHistoryResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyTargetRecord, setHistoryTargetRecord] = useState<CoastalStationInmarsatResponse | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleOpenHistoryModal = useCallback(async (record: CoastalStationInmarsatResponse) => {
    setHistoryTargetRecord(record);
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    try {
      const hist = await fetchInmarsatHistory(record.id);
      setHistoryList(hist || []);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải lịch sử biến động');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Modal Rejection
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRecord, setRejectRecord] = useState<CoastalStationInmarsatResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');

  // Load lookup options
  useEffect(() => {
    (async () => {
      try {
        const orgTree = await organizationService.getTree();
        setOrgUnitOptions((orgTree || []) as OrgUnitTreeOption[]);

        vtsSystemCRUD.getOperatingOrganizationOptions().then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setOperatingOrgOptions(res.map((o) => ({ value: o.id, label: o.name })));
          }
        }).catch(() => {});

        const symbols = await symbolService.getOptions();
        setMapSymbolOptions(symbols.map((s: any) => ({ value: s.id, label: s.name })));
      } catch (e) {
        console.error('Failed to load lookup options', e);
      }
    })();
  }, []);

  // Fetch list and counts
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const updatedFrom = filterDateRange?.[0] ? filterDateRange[0].startOf('day').toISOString() : undefined;
      const updatedTo = filterDateRange?.[1] ? filterDateRange[1].endOf('day').toISOString() : undefined;

      const res = await fetchInmarsatList({
        page: page - 1,
        size: pageSize,
        orgUnitId: filterOrgUnitId,
        operatingOrgId: filterOperatingOrgId,
        provinceId: filterProvinceId,
        keyword: filterKeyword ? filterKeyword.trim() : undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: activeTab === 'ALL' ? undefined : activeTab,
        updatedFrom,
        updatedTo,
      });

      setData(res.content || []);
      setTotal(res.totalElements || 0);

      // Load counts
      const counts = await fetchInmarsatCounts({
        orgUnitId: filterOrgUnitId,
        keyword: filterKeyword ? filterKeyword.trim() : undefined,
        conditionStatus: filterConditionStatus,
      });
      setStatusCounts(counts || {});
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải danh sách Đài Inmarsat');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    activeTab,
    filterOrgUnitId,
    filterOperatingOrgId,
    filterProvinceId,
    filterKeyword,
    filterConditionStatus,
    filterDateRange,
  ]);

  useEffect(() => {
    if (isIframeModal) return;
    loadData();
  }, [loadData, isIframeModal]);

  // Tab count helper
  const getTabCount = (statusKey: string) => {
    if (statusKey === 'ALL') return statusCounts['ALL'] || 0;
    if (statusKey === 'REJECTED') {
      return (statusCounts['REJECTED_LEVEL1'] || 0) + (statusCounts['REJECTED_LEVEL2'] || 0) + (statusCounts['REJECTED'] || 0);
    }
    return statusCounts[statusKey] || 0;
  };

  const statusTabs: StatusTab[] = useMemo(() => [
    { key: 'ALL', label: 'Tất cả', count: getTabCount('ALL'), color: actionPrimary, active: activeTab === 'ALL' },
    { key: 'DRAFT', label: 'Lưu tạm', count: getTabCount('DRAFT'), color: statusDraft, active: activeTab === 'DRAFT' },
    { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', count: getTabCount('PENDING_APPROVAL'), color: statusAttention, active: activeTab === 'PENDING_APPROVAL' },
    { key: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt', count: getTabCount('APPROVED_LEVEL1'), color: '#0284C7', active: activeTab === 'APPROVED_LEVEL1' },
    { key: 'APPROVED', label: 'Đã duyệt', count: getTabCount('APPROVED'), color: statusOperational, active: activeTab === 'APPROVED' },
    { key: 'REJECTED', label: 'Từ chối', count: getTabCount('REJECTED'), color: statusCritical, active: activeTab === 'REJECTED' },
  ], [statusCounts, activeTab]);

  // Reset filter
  const handleResetFilter = () => {
    setFilterOrgUnitId(undefined);
    setFilterOperatingOrgId(undefined);
    setFilterProvinceId(undefined);
    setFilterKeyword('');
    setFilterConditionStatus(undefined);
    setFilterDateRange(null);
    setActiveTab('ALL');
    setPage(1);
  };

  // Open Drawer
  const handleOpenDrawer = async (record: CoastalStationInmarsatResponse | null, mode: 'create' | 'edit' | 'view') => {
    setSelectedRecord(record);
    setDrawerMode(mode);
    setActiveDrawerTab('1');
    form.resetFields();
    setFileList([]);
    setHistoryList([]);
    setDrawerOpen(true);

    if (record && record.id) {
      try {
        const detail = await fetchInmarsatById(record.id);
        setSelectedRecord(detail);

        // Parse services multi-select
        let parsedServices: string[] = [];
        if (detail.services) {
          try {
            parsedServices = JSON.parse(detail.services);
          } catch {
            parsedServices = detail.services.split(',').map((s) => s.trim());
          }
        }

        form.setFieldsValue({
          ...detail,
          services: parsedServices,
          code: detail.code || detail.deviceCode,
          name: detail.name || detail.stationName,
          provinceId: detail.provinceId != null ? String(detail.provinceId) : undefined,
          notes: detail.notes || detail.description,
          coverageZone: detail.coverageZone || detail.coverageArea,
          locationAddress: detail.locationAddress || detail.locationDetail,
          conditionStatus: detail.conditionStatus || 'OPERATIONAL',
          coordinateSystem: detail.coordinateSystem || 'WGS84',
        });
      } catch (err: any) {
        toast.error(err.message || 'Lỗi khi tải chi tiết Đài Inmarsat');
      }
    } else {
      // Create mode default values
      form.setFieldsValue({
        conditionStatus: 'OPERATIONAL',
        coordinateSystem: 'WGS84',
        objectType: 'POINT',
      });
    }
  };

  // Submit Drawer Form — 'draft' chỉ lưu; 'submit' lưu rồi gửi phê duyệt;
  // 'approve' lưu, gửi duyệt rồi duyệt luôn (dành cho người có quyền duyệt cấp Cục).
  const handleDrawerSubmit = async (action: FormSaveAction = 'draft') => {
    try {
      const values = await form.validateFields();
      setSavingAction(action);

      const payload: CoastalStationInmarsatRequest = {
        ...values,
        provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
        services: Array.isArray(values.services) ? JSON.stringify(values.services) : values.services,
      };

      let recordId = selectedRecord?.id;
      if (drawerMode === 'create') {
        const created = await createInmarsat(payload);
        recordId = created?.id;
        toast.success('Tạo mới Đài Inmarsat thành công (Lưu tạm)!');
      } else if (drawerMode === 'edit' && selectedRecord) {
        await updateInmarsat(selectedRecord.id, payload as CoastalStationInmarsatUpdateRequest);
        toast.success('Cập nhật Đài Inmarsat thành công!');
      }

      if (action === 'submit' && recordId) {
        await submitInmarsat(recordId);
        toast.success('Đã gửi phê duyệt lên cấp Cảng vụ/Chi cục');
      }

      if (action === 'approve' && recordId) {
        // Quy tắc 14: người gửi thuộc cấp Cục thì submit đưa hồ sơ thẳng vào "Chờ Cục duyệt",
        // nên chỉ cần duyệt vòng 2 là hồ sơ có hiệu lực ngay.
        await submitInmarsat(recordId);
        await approveInmarsatL2(recordId);
        toast.success('Đã lưu và phê duyệt Đài Inmarsat');
      }

      setDrawerOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Thao tác không thành công');
    } finally {
      setSavingAction(null);
    }
  };

  // Action Handlers
  const handleSubmitApproval = async (record: CoastalStationInmarsatResponse) => {
    modal.confirm({
      title: 'Gửi phê duyệt Đài Inmarsat',
      icon: <ExclamationCircleOutlined style={{ color: actionPrimary }} />,
      content: `Bạn có chắc chắn muốn gửi phê duyệt đài "${record.name || record.stationName || record.code}" lên cấp Cảng vụ/Chi cục?`,
      okText: 'Gửi phê duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await submitInmarsat(record.id);
          toast.success('Đã gửi phê duyệt thành công!');
          loadData();
        } catch (err: any) {
          toast.error(err.message || 'Gửi phê duyệt thất bại');
        }
      },
    });
  };

  const handleApproveL1 = async (record: CoastalStationInmarsatResponse) => {
    modal.confirm({
      title: 'Phê duyệt cấp 1 (Cảng vụ / Chi cục)',
      icon: <CheckCircleOutlined style={{ color: statusOperational }} />,
      content: `Xác nhận phê duyệt cấp 1 cho đài "${record.name || record.stationName || record.code}" để chuyển tiếp lên Cục Hàng hải?`,
      okText: 'Phê duyệt C1',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await approveInmarsatL1(record.id);
          toast.success('Phê duyệt C1 thành công!');
          loadData();
        } catch (err: any) {
          toast.error(err.message || 'Phê duyệt thất bại');
        }
      },
    });
  };

  const handleApproveL2 = async (record: CoastalStationInmarsatResponse) => {
    modal.confirm({
      title: 'Phê duyệt cấp 2 (Cục Hàng hải Việt Nam)',
      icon: <CheckCircleOutlined style={{ color: statusOperational }} />,
      content: `Xác nhận phê duyệt cấp 2 chính thức cho đài "${record.name || record.stationName || record.code}"?`,
      okText: 'Phê duyệt C2',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await approveInmarsatL2(record.id);
          toast.success('Phê duyệt cấp 2 thành công!');
          loadData();
        } catch (err: any) {
          toast.error(err.message || 'Phê duyệt thất bại');
        }
      },
    });
  };

  const handleOpenRejectModal = (record: CoastalStationInmarsatResponse) => {
    setRejectRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    if (!rejectRecord) return;

    setRejectSubmitting(true);
    try {
      await rejectInmarsat(rejectRecord.id, rejectReason.trim());
      toast.success('Đã từ chối phê duyệt thành công!');
      setRejectModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Từ chối phê duyệt thất bại');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleDelete = (record: CoastalStationInmarsatResponse) => {
    modal.confirm({
      title: 'Xóa Đài Inmarsat',
      icon: <ExclamationCircleOutlined style={{ color: statusCritical }} />,
      content: `Bạn có chắc chắn muốn xóa đài "${record.name || record.stationName || record.code}"? Dữ liệu sẽ được chuyển vào lưu trữ lịch sử.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteInmarsat(record.id);
          toast.success('Xóa Đài Inmarsat thành công!');
          loadData();
        } catch (err: any) {
          toast.error(err.message || 'Xóa thất bại');
        }
      },
    });
  };

  // Export Excel
  // Anti-self-approval checker
  const isCreator = (record: CoastalStationInmarsatResponse) => {
    return currentUserId && record.createdBy && String(record.createdBy) === String(currentUserId);
  };

  // Table Columns
  const columns = useMemo(() => [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      // list-screen-ui-standard §2: Tên và Mã gộp thành MỘT cột 2 dòng, cố định
      // trái ngay sau STT, rộng 220–260px. Trước đây tách làm hai cột rời.
      title: 'Tên/Mã đài Inmarsat',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      fixed: 'left' as const,
      ellipsis: false,
      render: (name: string, record: CoastalStationInmarsatResponse) => {
        const displayName = name || record.stationName || '—';
        const displayCode = record.code || record.deviceCode || '—';
        return (
          <div style={{ overflow: 'hidden' }}>
            <div
              title={displayName}
              style={{
                fontWeight: fontWeightBold,
                color: colors.sidebarBg,
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayName}
            </div>
            <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textSecondary, whiteSpace: 'nowrap' }}>
              {displayCode}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      key: 'orgUnitName',
      width: 200,
      ellipsis: false,
      render: (val: string) => val || '-',
    },
    {
      title: 'Đơn vị khai thác',
      dataIndex: 'operatingOrgName',
      key: 'operatingOrgName',
      width: 180,
      ellipsis: false,
      render: (val: string) => val || '-',
    },
    {
      title: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      key: 'provinceId',
      width: 160,
      ellipsis: false,
      render: (provId: number, record: CoastalStationInmarsatResponse) => {
        return (provId ? getProvinceNameById(provId) : undefined) || record.provinceName || '-';
      },
    },
    {
      // list-screen-ui-standard §4: cột badge rộng 160px, §Alignment: căn trái.
      // §5: badge dạng viên thuốc nền 15% / viền 40% — antd <Tag color> cho ra
      // kiểu khác hẳn nên không dùng.
      title: 'Tình trạng',
      dataIndex: 'conditionStatus',
      key: 'conditionStatus',
      width: 160,
      ellipsis: false,
      render: (val: string) => {
        const found = CONDITION_STATUS_OPTIONS.find((c) => c.value === val);
        const color = found?.color || statusOperational;
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              border: `1px solid ${color}40`,
              borderRadius: radiusPill,
              fontSize: fontSizeMd,
              fontWeight: fontWeightMedium,
              background: `${color}15`,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {found?.label || val || 'Đang khai thác'}
          </span>
        );
      },
    },
    {
      title: 'Trạng thái phê duyệt',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 180,
      ellipsis: false,
      render: (val: string) => <ApprovalStatusBadge status={val} />,
    },
    {
      // list-screen-ui-standard §3: gộp Cán bộ cập nhật + Ngày giờ cập nhật thành
      // một cột 2 dòng, rộng 190–220px, định dạng DD/MM/YYYY HH:mm:ss.
      title: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      key: 'updatedByName',
      width: 220,
      ellipsis: false,
      render: (val: string, record: CoastalStationInmarsatResponse) => {
        // §3: chỉ Họ và tên — không fallback sang mã UUID.
        const name = val || record.createdByName || '—';
        const date = record.updatedAt || record.createdAt;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              title={name}
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
  ], [page, pageSize]);

  // Row Actions
  const rowActions = useCallback((record: CoastalStationInmarsatResponse) => {
    const isDraft = !record.approvalStatus || record.approvalStatus === 'DRAFT';
    const isRejected = record.approvalStatus === 'REJECTED_LEVEL1' || record.approvalStatus === 'REJECTED_LEVEL2' || record.approvalStatus === 'REJECTED';
    const isPendingL1 = record.approvalStatus === 'PENDING_APPROVAL' || record.approvalStatus === 'PROPOSED';
    const isPendingL2 = record.approvalStatus === 'APPROVED_LEVEL1';
    // 4 mắt: người tạo hồ sơ không được tự phê duyệt (backend cũng chặn)
    const creatorBlocked = isCreator(record);

    return [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => handleOpenDrawer(record, 'view'),
      },
      {
        key: 'history',
        label: 'Lịch sử',
        icon: <HistoryOutlined />,
        onClick: () => handleOpenHistoryModal(record),
      },
      // Quy tắc 12 (approval-2-level-spec.md mục 3.9)
      ...(canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'coastalstationinmarsat' }) ? [{
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: <EditOutlined />,
        onClick: () => handleOpenDrawer(record, 'edit'),
      }] : []),
      ...((isDraft || isRejected) && hasPerm('coastalstationinmarsat:update') ? [{
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: <SendOutlined />,
        onClick: () => handleSubmitApproval(record),
      }] : []),
      ...(isPendingL1 && hasPerm('coastalstationinmarsat:approvec1') ? [{
        key: 'approveL1',
        label: creatorBlocked ? 'Không thể tự phê duyệt' : 'Phê duyệt C1 (Cảng vụ)',
        icon: <CheckCircleOutlined />,
        disabled: !!creatorBlocked,
        tooltip: creatorBlocked ? 'Bạn không thể tự phê duyệt bản ghi do chính mình tạo' : undefined,
        onClick: () => handleApproveL1(record),
      }] : []),
      ...(isPendingL2 && hasPerm('coastalstationinmarsat:approvec2') ? [{
        key: 'approveL2',
        label: creatorBlocked ? 'Không thể tự phê duyệt' : 'Phê duyệt C2 (Cục HH)',
        icon: <CheckCircleOutlined />,
        disabled: !!creatorBlocked,
        tooltip: creatorBlocked ? 'Bạn không thể tự phê duyệt bản ghi do chính mình tạo' : undefined,
        onClick: () => handleApproveL2(record),
      }] : []),
      ...((isPendingL1 || isPendingL2) && hasPerm('coastalstationinmarsat:reject') ? [{
        key: 'reject',
        label: 'Từ chối phê duyệt',
        icon: <CloseCircleOutlined />,
        danger: true,
        onClick: () => handleOpenRejectModal(record),
      }] : []),
      ...((isDraft || isRejected) && hasPerm('coastalstationinmarsat:delete') ? [{
        key: 'delete',
        label: 'Xóa đài',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(record),
      }] : []),
    ];
  }, [hasPerm, currentUserId]);

  // Sidebar Filter Component
  const sidebarFilterContent = (
    <>
      {/* ── BỘ LỌC THƯỜNG (LUÔN HIỂN THỊ) ── */}
      <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
        <OrgUnitTreeSelect
          organizations={orgUnitOptions}
          value={filterOrgUnitId}
          onChange={(val) => {
            setFilterOrgUnitId(val);
            setFilterOperatingOrgId(undefined);
          }}
          placeholder="Tất cả"
          allowClear
          treeDefaultExpandAll={true}
          listHeight={256}
          style={{ ...selectStyle, width: '100%' }}
        />
      </SidebarFilterField>

      <SidebarFilterField label="Tìm kiếm">
        <Input
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          onPressEnter={() => { setPage(1); loadData(); }}
          placeholder="Tìm kiếm"
          allowClear
          prefix={<SearchOutlined style={{ color: textTertiary }} />}
          style={{ ...inputStyle, width: '100%' }}
        />
      </SidebarFilterField>

      {/* ── BỘ LỌC NÂNG CAO (KHI MỞ RỘNG) ── */}
      {filterCollapsed && (
        <>
          <SidebarFilterField label="Tình trạng">
            <Select
              value={filterConditionStatus}
              onChange={(val) => setFilterConditionStatus(val)}
              options={CONDITION_STATUS_OPTIONS}
              placeholder="Tất cả tình trạng"
              allowClear
              style={{ ...selectStyle, width: '100%' }}
            />
          </SidebarFilterField>

          <SidebarFilterField label="Ngày cập nhật">
            <DatePicker.RangePicker
              value={filterDateRange}
              onChange={(dates) => setFilterDateRange(dates as [Dayjs | null, Dayjs | null])}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              allowClear
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </SidebarFilterField>

          <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)">
            <Select
              value={filterProvinceId}
              onChange={(val) => setFilterProvinceId(val)}
              options={VIETNAM_PROVINCE_OPTIONS}
              placeholder="Tất cả tỉnh thành"
              allowClear
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
              }
              style={{ ...selectStyle, width: '100%' }}
            />
          </SidebarFilterField>

          <SidebarFilterField label="Đơn vị khai thác">
            <Select
              value={filterOperatingOrgId}
              onChange={(val) => setFilterOperatingOrgId(val)}
              options={operatingOrgOptions}
              placeholder="Tất cả đơn vị khai thác"
              allowClear
              showSearch
              filterOption={(input, option) =>
                normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
              }
              style={{ ...selectStyle, width: '100%' }}
            />
          </SidebarFilterField>
        </>
      )}
    </>
  );

  return (
    <ListPageContainer>
      <ScreenHeader
        title="Quản lý Đài thông tin vệ tinh Inmarsat"
        breadcrumb={[{ label: 'Quản lý nhà trạm' }, { label: 'Đài vệ tinh Inmarsat' }]}
        actions={[
          ...(hasPerm('coastalstationinmarsat:create') ? [{
            key: 'create',
            label: 'Thêm đài Inmarsat',
            variant: 'primary' as const,
            icon: <PlusOutlined />,
            onClick: () => handleOpenDrawer(null, 'create'),
          }] : []),
        ]}
      />

      <FilterTableLayout
        filterContent={sidebarFilterContent}
        statusTabs={statusTabs}
        onStatusTabChange={(key) => {
          setActiveTab(key);
          setPage(1);
        }}
        onFilterApply={() => {
          setPage(1);
          loadData();
        }}
        onFilterReset={handleResetFilter}
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
      >
        <DataTable
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 'max-content', y: 560 }}
          emptyState={
            <EmptyState
              description="Không có dữ liệu Đài Inmarsat"
            />
          }
        />

        <div style={{ marginTop: spaceMd, display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(p, s) => {
              setPage(p);
              setPageSize(s);
            }}
          />
        </div>
      </FilterTableLayout>

      {/* 5-TAB APP DRAWER */}
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          <div style={drawerTitleStyle}>
            {drawerMode === 'create' && 'Thêm mới Đài vệ tinh Inmarsat'}
            {drawerMode === 'edit' && `Chỉnh sửa Đài Inmarsat: ${selectedRecord?.name || selectedRecord?.code}`}
            {drawerMode === 'view' && `Chi tiết Đài Inmarsat: ${selectedRecord?.name || selectedRecord?.code}`}
          </div>
        }
        footer={drawerMode === 'view' ? null : (
          <FormSaveFooter
            onAction={handleDrawerSubmit}
            loadingAction={savingAction}
            canSubmitForApproval={hasPerm('coastalstationinmarsat:create') || hasPerm('coastalstationinmarsat:update')}
            canApprove={hasPerm('coastalstationinmarsat:approvec2') || hasPerm('coastalstationinmarsat:approve')}
            draftLabel={drawerMode === 'create' ? 'Lưu tạm' : 'Lưu thay đổi'}
          />
        )}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={drawerMode === 'view'}
          initialValues={{
            conditionStatus: 'OPERATIONAL',
            coordinateSystem: 'WGS84',
            objectType: 'POINT',
          }}
        >
          <Tabs
            activeKey={activeDrawerTab}
            onChange={setActiveDrawerTab}
            items={[
              {
                key: '1',
                label: FORM_TAB_LABEL.GENERAL,
                children: (
                  <div>
                    <Row gutter={formRowGutter}>
                      <Col span={12}>
                        <Form.Item
                          name="orgUnitId"
                          {...formLabelProps('Đơn vị quản lý')}
                          rules={[{ required: true, message: 'Vui lòng chọn đơn vị quản lý' }]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <OrgUnitTreeSelect
                            organizations={orgUnitOptions}
                            placeholder="Chọn đơn vị quản lý"
                            allowClear
                            treeDefaultExpandAll={true}
                            listHeight={256}
                            style={{ width: '100%', borderRadius: radiusPill }}
                            onChange={() => {
                              form.setFieldValue('operatingOrgId', undefined);
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="operatingOrgId"
                          {...formLabelProps('Đơn vị khai thác')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            options={operatingOrgOptions}
                            placeholder="Chọn đơn vị khai thác"
                            allowClear
                            showSearch
                            filterOption={(input, option) =>
                              normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                            }
                            style={{ ...selectStyle, width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={formRowGutter}>
                      <Col span={12}>
                        <Form.Item
                          name="code"
                          {...formLabelProps('Mã đài (Tự sinh)')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input
                            placeholder="Hệ thống tự sinh (INMARSAT-xxxx)"
                            disabled
                            style={{ ...inputStyle, backgroundColor: '#f5f5f5' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="name"
                          {...formLabelProps('Tên đài Inmarsat')}
                          rules={[{ required: true, message: 'Vui lòng nhập tên đài' }]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="Nhập tên đài vệ tinh Inmarsat..." style={inputStyle} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={formRowGutter}>
                      <Col span={12}>
                        <Form.Item
                          name="provinceId"
                          {...formLabelProps('Địa điểm (Tỉnh/Thành phố)')}
                          rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành phố' }]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            options={VIETNAM_PROVINCE_OPTIONS}
                            placeholder="Chọn tỉnh/thành phố"
                            allowClear
                            showSearch
                            filterOption={(input, option) =>
                              normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                            }
                            style={{ ...selectStyle, width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="conditionStatus"
                          {...formLabelProps('Tình trạng hoạt động')}
                          rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            options={CONDITION_STATUS_OPTIONS}
                            placeholder="Chọn tình trạng hoạt động"
                            style={{ ...selectStyle, width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="locationAddress"
                      {...formLabelProps('Địa điểm chi tiết')}
                      rules={[{ required: true, message: 'Vui lòng nhập địa điểm chi tiết' }]}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <TextArea rows={2} placeholder="Nhập địa chỉ, vị trí chi tiết của đài..." style={{ borderRadius: 20, padding: '10px 16px' }} />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: '2',
                label: FORM_TAB_LABEL.TECHNICAL,
                children: (
                  <div>
                    <Row gutter={formRowGutter}>
                      <Col span={12}>
                        <Form.Item
                          name="services"
                          {...formLabelProps('Dịch vụ cung cấp (Multi-select)')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            mode="multiple"
                            options={INMARSAT_SERVICE_OPTIONS}
                            placeholder="Chọn các dịch vụ Inmarsat..."
                            allowClear
                            showSearch
                            filterOption={(input, option) =>
                              normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                            }
                            style={{ width: '100%', minHeight: 40 }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="modemType"
                          {...formLabelProps('Loại Modem / Thiết bị')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="VD: Capsat, Sailor 6006..." style={inputStyle} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={formRowGutter}>
                      <Col span={12}>
                        <Form.Item
                          name="frequency"
                          {...formLabelProps('Tần số liên lạc')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="VD: 1.6 GHz, L-Band..." style={inputStyle} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="sarCode"
                          {...formLabelProps('Mã SAR (Tìm kiếm cứu nạn)')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="VD: SAR-INM-VN01..." style={inputStyle} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="coverageZone"
                      {...formLabelProps('Vùng phủ sóng')}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <TextArea rows={2} placeholder="Mô tả phạm vi, vùng biển và vệ tinh phủ sóng..." style={{ borderRadius: 20, padding: '10px 16px' }} />
                    </Form.Item>

                    <Row gutter={formRowGutter}>
                      <Col span={12}>
                        <Form.Item
                          name="contactPerson"
                          {...formLabelProps('Người liên hệ / Trực ban')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="Họ và tên cán bộ quản trị trạm..." style={inputStyle} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="contactPhone"
                          {...formLabelProps('Số điện thoại liên hệ')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="Số điện thoại trực ban / hotline..." style={inputStyle} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="notes"
                      {...formLabelProps('Ghi chú kỹ thuật')}
                      style={{ marginBottom: spaceFormField }}
                    >
                      <TextArea rows={3} placeholder="Ghi chú bổ sung về vận hành, kỹ thuật..." style={{ borderRadius: 20, padding: '10px 16px' }} />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: '3',
                label: FORM_TAB_LABEL.LOCATION,
                children: (
                  <div>
                    <Row gutter={formRowGutter}>
                      <Col span={12}>
                        <Form.Item
                          name="objectType"
                          {...formLabelProps('Loại đối tượng GIS')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select options={OBJECT_TYPE_OPTIONS} style={{ ...selectStyle, width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="symbol"
                          {...formLabelProps('Biểu tượng bản đồ')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Select
                            options={mapSymbolOptions}
                            placeholder="Chọn ký hiệu biểu tượng"
                            allowClear
                            showSearch
                            filterOption={(input, option) =>
                              normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                            }
                            style={{ ...selectStyle, width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={formRowGutter}>
                      <Col span={12}>
                        <Form.Item
                          name="coordinateSystem"
                          {...formLabelProps('Hệ quy chiếu')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input disabled style={{ ...inputStyle, backgroundColor: '#f5f5f5' }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="displayRule"
                          {...formLabelProps('Quy tắc hiển thị')}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <Input placeholder="VD: ZoomLevel 8-18..." style={inputStyle} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={formRowGutter}>
                      <Col span={12}>
                        <Form.Item
                          name="latitude"
                          {...formLabelProps('Vĩ độ (Latitude WGS84)')}
                          rules={[
                            { type: 'number', min: -90, max: 90, message: 'Vĩ độ trong khoảng -90 đến 90' },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <InputNumber step="0.000001" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} placeholder="VD: 10.776889" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="longitude"
                          {...formLabelProps('Kinh độ (Longitude WGS84)')}
                          rules={[
                            { type: 'number', min: -180, max: 180, message: 'Kinh độ trong khoảng -180 đến 180' },
                          ]}
                          style={{ marginBottom: spaceFormField }}
                        >
                          <InputNumber step="0.000001" style={{ width: '100%', borderRadius: radiusPill, height: 40 }} placeholder="VD: 106.700806" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: '4',
                label: FORM_TAB_LABEL.ATTACHMENTS,
                children: (
                  <div>
                    <Upload.Dragger
                      fileList={fileList}
                      beforeUpload={() => false}
                      onChange={({ fileList: fl }) => setFileList(fl)}
                      disabled={drawerMode === 'view'}
                      style={{ padding: spaceMd, borderRadius: radiusMd, backgroundColor: surfaceCard }}
                    >
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined style={{ fontSize: 32, color: actionPrimary }} />
                      </p>
                      <p style={{ fontWeight: fontWeightBold }}>Nhấp hoặc kéo thả tệp vào đây để tải lên</p>
                      <p style={uploadHintStyle}>Hỗ trợ PDF, DOCX, XLSX, PNG, JPG (Tối đa 10MB/tệp)</p>
                    </Upload.Dragger>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </AppDrawer>

      {/* DRAWER / MODAL LỊCH SỬ BIẾN ĐỘNG (AUDIT TRAIL RIÊNG BIỆT) */}
      <AppDrawer
        open={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        title={`Lịch sử biến động: ${historyTargetRecord?.name || historyTargetRecord?.stationName || historyTargetRecord?.code || ''}`}
        size="large"
      >
        {historyTargetRecord && (
          <div style={{ marginBottom: spaceLg, padding: spaceMd, backgroundColor: '#fcfcfc', border: `1px solid ${borderDefault}`, borderRadius: radiusMd }}>
            <Text style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg }}>
              Thông tin tiến trình phê duyệt 2 cấp (M-1006):
            </Text>
            <Row gutter={[16, 8]} style={{ marginTop: spaceSm }}>
              <Col span={12}><Text type="secondary">Người tạo:</Text> <b>{historyTargetRecord.createdByName || '-'}</b></Col>
              <Col span={12}><Text type="secondary">Ngày tạo:</Text> <b>{historyTargetRecord.createdAt ? dayjs(historyTargetRecord.createdAt).format('DD/MM/YYYY HH:mm') : '-'}</b></Col>
              <Col span={12}><Text type="secondary">Người gửi duyệt:</Text> <b>{historyTargetRecord.submittedByName || '-'}</b></Col>
              <Col span={12}><Text type="secondary">Ngày gửi duyệt:</Text> <b>{historyTargetRecord.submittedAt ? dayjs(historyTargetRecord.submittedAt).format('DD/MM/YYYY HH:mm') : '-'}</b></Col>
              <Col span={12}><Text type="secondary">Phê duyệt C1 (Cảng vụ):</Text> <b>{historyTargetRecord.approverNameLevel1 || '-'}</b></Col>
              <Col span={12}><Text type="secondary">Ngày duyệt C1:</Text> <b>{historyTargetRecord.approvedDateLevel1 ? dayjs(historyTargetRecord.approvedDateLevel1).format('DD/MM/YYYY HH:mm') : '-'}</b></Col>
              <Col span={12}><Text type="secondary">Phê duyệt C2 (Cục HH):</Text> <b>{historyTargetRecord.approverNameLevel2 || historyTargetRecord.approvedByName || '-'}</b></Col>
              <Col span={12}><Text type="secondary">Ngày duyệt C2:</Text> <b>{historyTargetRecord.approvedDateLevel2 || historyTargetRecord.approvedDate ? dayjs(historyTargetRecord.approvedDateLevel2 || historyTargetRecord.approvedDate).format('DD/MM/YYYY HH:mm') : '-'}</b></Col>
            </Row>

            {historyTargetRecord.rejectionReason && (
              <div style={{ marginTop: spaceSm, padding: spaceSm, backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: radiusSm }}>
                <Text type="danger" style={{ fontWeight: fontWeightBold }}>Lý do từ chối gần nhất:</Text>
                <div style={{ color: statusCritical, marginTop: 4 }}>{historyTargetRecord.rejectionReason}</div>
              </div>
            )}
          </div>
        )}

        <Text style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd, color: colors.sidebarBg }}>
          Nhật ký biến động dữ liệu:
        </Text>
        <Table
          dataSource={historyList}
          rowKey="id"
          loading={historyLoading}
          pagination={false}
          size="small"
          style={{ marginTop: spaceSm }}
          columns={[
            {
              title: 'Thời gian',
              dataIndex: 'changedAt',
              key: 'changedAt',
              width: 150,
              render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm:ss') : '-',
            },
            {
              title: 'Hành động',
              dataIndex: 'actionType',
              key: 'actionType',
              width: 140,
              render: (val: string) => <Tag color="blue">{val}</Tag>,
            },
            {
              title: 'Nội dung thay đổi',
              dataIndex: 'newValue',
              key: 'newValue',
              ellipsis: false,
            },
            {
              title: 'Cán bộ thực hiện',
              dataIndex: 'changedBy',
              key: 'changedBy',
              width: 140,
            },
          ]}
        />
      </AppDrawer>

      {/* MODAL NHẬP LÝ DO TỪ CHỐI */}
      <Modal
        title="Từ chối phê duyệt Đài Inmarsat"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleConfirmReject}
        confirmLoading={rejectSubmitting}
        okText="Xác nhận từ chối"
        okType="danger"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: spaceMd }}>
          <Text>
            Vui lòng nhập lý do từ chối phê duyệt cho đài <b>{rejectRecord?.name || rejectRecord?.code}</b>. Lý do sẽ được lưu vào lịch sử phê duyệt và thông báo lại cho người gửi.
          </Text>
        </div>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối chi tiết (tối thiểu 10 ký tự)..."
          style={{ borderRadius: 20, padding: '10px 16px' }}
        />
      </Modal>
    </ListPageContainer>
  );
}
