import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Typography, Modal, Input, Drawer, Button, DatePicker, Space, Select, Radio, Tag } from 'antd';
import {
  HistoryOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { vtsOperationCenterService, type VtsOperationCenterListParams } from '../../services/vtsOperationCenterService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { portCRUD } from '../../services/portService';
import type { VtsOperationCenterListItem, VtsOperationCenterResponse } from '../../types/vtsOperationCenter';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import VtsOperationCenterChkForm from './VtsOperationCenterChkForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import toast, { modal } from '../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusSm, radiusPill, spaceFormField, spaceMd, spaceSm, spaceLg,
  statusOperational, statusDraft, statusCritical, statusAttention,
  surfacePage, spaceXs, spaceXl, drawerTitleStyle, drawerCloseBtnStyle, selectStyle,
  borderDefault, statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle, primaryButtonStyle, textAreaStyle, clientSideStringSorter, clientSideDateSorter,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const HISTORY_PAGE_SIZE = 20;

const HISTORY_FIELD_ORDER = [
  'orgUnitId', 'orgUnitName', 'portId', 'portName', 'vtsSystemId', 'vtsSystemName',
  'code', 'name', 'provinceId', 'province', 'detailedLocation', 'coverage', 'conditionStatus', 'note'
];

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    name: 'Tên trung tâm điều hành VTS', code: 'Mã trung tâm điều hành VTS', province: 'Tỉnh/Thành phố',
    provinceId: 'Địa điểm (Tỉnh/TP)', detailedLocation: 'Địa điểm chi tiết', address: 'Địa điểm chi tiết',
    coverage: 'Vùng phủ sóng', note: 'Ghi chú', approvalStatus: 'Trạng thái phê duyệt', conditionStatus: 'Tình trạng',
    orgUnitName: 'Đơn vị quản lý', orgUnitId: 'Đơn vị quản lý', portName: 'Thuộc cảng biển', portId: 'Thuộc cảng biển',
    vtsSystemName: 'Thuộc hệ thống VTS', vtsSystemId: 'Thuộc hệ thống VTS',
  };
  return map[fn] || fn;
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

function historyFieldValue(fn: string, val: string | null): string {
  if (!val || val === '(null)' || val === 'null' || val === '') return '(trống)';
  const displayValue = val.split(';').map((part) => {
    const separator = part.indexOf('=');
    return separator >= 0 ? part.slice(separator + 1).trim() : part.trim();
  }).filter(Boolean).join('; ');
  const historyFieldKeys = fn.split(/[,;]+/).map(normalizeHistoryKey);
  const isApprovalField = fn === 'approvalStatus'
    || historyFieldKeys.includes('approvalstatus')
    || historyFieldKeys.includes('trang thai phe duyet');
  if (isApprovalField) {
    const statusMap: Record<string, string> = {
      DRAFT: 'Lưu tạm',
      PROPOSED: 'Chờ Cảng vụ duyệt',
      PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
      PENDING: 'Chờ Cảng vụ duyệt',
      APPROVED_LEVEL1: 'Chờ Cục duyệt',
      APPROVED_LEVEL2: 'Đã duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      REJECTED_LEVEL1: 'Từ chối',
      REJECTED_LEVEL2: 'Từ chối',
    };
    return displayValue.split(';').map((value) => {
      const normalizedValue = String(value || '').trim();
      const fromEnum = statusMap[normalizedValue] || statusMap[normalizedValue.toUpperCase()];
      if (fromEnum) return fromEnum;
      return normalizedValue;
    }).join('; ');
  }
  if (fn === 'provinceId') {
    const num = Number(displayValue);
    if (!isNaN(num)) return getProvinceNameById(num) || displayValue;
    return displayValue;
  }
  if (fn === 'conditionStatus') {
    return CONDITION_STATUS_MAP[displayValue as ConditionStatus] || displayValue;
  }
  return displayValue;
}

function historyTimestamp(item: any): string {
  return item.approvedDate || item.changedAt || item.createdAt || item.performedDate || '';
}

function historyField(item: any): string {
  return item.changedField || item.fieldName || '';
}

function historyOldValue(item: any): string | null {
  return item.previousValue ?? item.oldValue ?? null;
}

function historyNewValue(item: any): string | null {
  return item.newValue ?? null;
}

function historyActor(item: any): string {
  const raw = item?.approvedByName || item?.changedByName || item?.performedByName || item?.userName || item?.actorName || item?.approvedBy || item?.changedBy || item?.performedBy || '';
  return raw || '—';
}

function renderValueBadge(val: string, isStatus = false) {
  if (!val || val === '(trống)') {
    return <span style={{ color: textTertiary, fontStyle: 'italic' }}>{val}</span>;
  }

  if (isStatus) {
    const normVal = val.toLowerCase();
    if (normVal.includes('hoat dong') || normVal.includes('da duyet') || normVal.includes('operational') || normVal.includes('approved')) {
      return <span style={statusBadgeStyle(statusOperational)}>{val}</span>;
    }
    if (normVal.includes('cho') || normVal.includes('bao tri') || normVal.includes('pending') || normVal.includes('maintenance')) {
      return <span style={statusBadgeStyle(statusAttention)}>{val}</span>;
    }
    if (normVal.includes('tu choi') || normVal.includes('tra ve') || normVal.includes('dung') || normVal.includes('rejected') || normVal.includes('stopped')) {
      return <span style={statusBadgeStyle(statusCritical)}>{val}</span>;
    }
    if (normVal.includes('luu tam') || normVal.includes('draft')) {
      return <span style={statusBadgeStyle(statusDraft)}>{val}</span>;
    }
  }

  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

export default function VtsOperationCenterChkList() {
  const currentUser = useAuthStore((s) => s.user);
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterVtsSystemId, setFilterVtsSystemId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();

  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [portOptions, setPortOptions] = useState<Array<{ id: string; portName?: string; portCode?: string; orgUnitId?: string }>>([]);
  const [vtsSystemOptions, setVtsSystemOptions] = useState<Array<{ id: string; name?: string; code?: string; orgUnitId?: string }>>([]);

  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const [dataSource, setDataSource] = useState<VtsOperationCenterListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<VtsOperationCenterResponse | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  // History drawer state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState<string>('');
  const [historyDateTo, setHistoryDateTo] = useState<string>('');

  // Count tabs
  const [countDraft, setCountDraft] = useState<number>(0);
  const [countPendingApproval, setCountPendingApproval] = useState<number>(0);
  const [countApprovedLevel1, setCountApprovedLevel1] = useState<number>(0);
  const [countApproved, setCountApproved] = useState<number>(0);
  const [countRejected, setCountRejected] = useState<number>(0);
  const statusCountFilterKey = useRef<string | null>(null);
  const listRequestId = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const [orgs, ports, systems] = await Promise.all([
          vtsSystemCRUD.getScopedOrgUnitOptions(),
          portCRUD.getOptions(),
          vtsSystemCRUD.getOptions(),
        ]);
        setOrgUnitOptions(orgs.map((o: any) => ({
          id: String(o.id),
          name: o.name || o.unitName || o.tenDonVi || 'Đơn vị',
          code: o.code || o.maDonVi,
          parentId: o.parentId ? String(o.parentId) : undefined,
        })));
        setPortOptions(Array.isArray(ports) ? ports : []);
        setVtsSystemOptions(Array.isArray(systems) ? systems : []);
      } catch (e) {
        console.error('Failed to fetch lookup options', e);
      }
    })();
  }, []);

  const filteredPortOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return portOptions;
    return portOptions.filter((p) => !p.orgUnitId || p.orgUnitId === filterValues.orgUnitId);
  }, [portOptions, filterValues.orgUnitId]);

  const filteredVtsSystemOptions = useMemo(() => {
    if (!filterValues.orgUnitId) return vtsSystemOptions;
    return vtsSystemOptions.filter((v) => !v.orgUnitId || v.orgUnitId === filterValues.orgUnitId);
  }, [vtsSystemOptions, filterValues.orgUnitId]);

  const fetchData = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    setIsError(false);
    try {
      const currentStatusCountFilterKey = JSON.stringify([
        filterKeyword, filterConditionStatus, filterOrgUnitId, filterPortId, filterVtsSystemId, filterProvinceId,
        filterUpdatedFrom, filterUpdatedTo,
      ]);
      const shouldIncludeCounts = statusCountFilterKey.current !== currentStatusCountFilterKey;
      const params: VtsOperationCenterListParams = {
        page: page,
        size: pageSize,
        keyword: filterKeyword || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
        portId: filterPortId || undefined,
        vtsSystemId: filterVtsSystemId || undefined,
        provinceId: filterProvinceId,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      };

      const res = await vtsOperationCenterService.search(params);
      if (requestId !== listRequestId.current) return;
      setDataSource(res.items || []);
      setTotal(res.total || 0);

      if (shouldIncludeCounts && res.statusCounts) {
        const counts = res.statusCounts;
        setCountDraft(Number(counts.DRAFT) || 0);
        setCountPendingApproval(Number(counts.PENDING_APPROVAL) || 0);
        setCountApprovedLevel1(Number(counts.APPROVED_LEVEL1) || 0);
        setCountApproved(Number(counts.APPROVED) || 0);
        setCountRejected((Number(counts.REJECTED_LEVEL1) || 0) + (Number(counts.REJECTED_LEVEL2) || 0));
        statusCountFilterKey.current = currentStatusCountFilterKey;
      }
    } catch (err: unknown) {
      if (requestId !== listRequestId.current) return;
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  }, [
    page, pageSize, filterKeyword, filterConditionStatus, filterApprovalStatus,
    filterOrgUnitId, filterPortId, filterVtsSystemId, filterProvinceId,
    filterUpdatedFrom, filterUpdatedTo,
  ]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshList = useCallback(() => {
    statusCountFilterKey.current = null;
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await vtsOperationCenterService.delete(id);
      toast.success('Xóa thành công');
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi xóa');
    }
  };

  const confirmDelete = (record: VtsOperationCenterListItem) => {
    modal.confirm({
      title: 'Xác nhận xóa trung tâm điều hành VTS',
      icon: <ExclamationCircleOutlined />,
      content: 'Hồ sơ ở trạng thái Lưu tạm sẽ chuyển sang "Đã xóa (lịch sử)": không còn hiển thị trong danh sách nhưng vẫn được giữ lại để đối chiếu.',
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: () => handleDelete(record.id),
    });
  };

  const openApproveModal = (id: string, level: 'c1' | 'c2') => {
    setApproveTargetId(id);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (content: string) => {
    if (!approveTargetId) return;
    try {
      if (approveLevel === 'c1') {
        await vtsOperationCenterService.approveC1(approveTargetId, 'APPROVED', content);
        toast.success('Phê duyệt cấp 1 thành công');
      } else {
        await vtsOperationCenterService.approveC2(approveTargetId, 'APPROVED', content);
        toast.success('Phê duyệt cấp 2 thành công');
      }
      setApproveModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi phê duyệt');
    }
  };

  const openRejectModal = (id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    if (!rejectTargetId) return;
    try {
      await vtsOperationCenterService.reject(rejectTargetId, rejectReason.trim());
      toast.success('Đã từ chối');
      setRejectModalOpen(false);
      refreshList();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi từ chối');
    }
  };

  const handleViewHistory = (record: VtsOperationCenterListItem) => {
    setSelectedRecord(record as any);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(true);
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');

    vtsOperationCenterService.getHistory(record.id).then((res) => {
      setHistoryRecords(res || []);
    }).catch(() => {
      toast.error('Không thể tải lịch sử thay đổi');
    }).finally(() => {
      setLoadingHistory(false);
    });
  };

  const countAll = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejected;

  const statusTabs = useMemo(() => [
    { key: 'ALL', label: 'Tất cả', count: countAll, color: actionPrimary, active: !filterApprovalStatus },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countDraft, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.DRAFT },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ Cảng vụ duyệt', count: countPendingApproval, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PENDING_APPROVAL },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ Cục duyệt', count: countApprovedLevel1, color: '#0284C7', active: filterApprovalStatus === ApprovalStatus.APPROVED_LEVEL1 },
    { key: ApprovalStatus.APPROVED, label: 'Đã duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: 'REJECTED', label: 'Từ chối', count: countRejected, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2 },
  ], [countAll, filterApprovalStatus, countDraft, countPendingApproval, countApprovedLevel1, countApproved, countRejected]);

  const handleTabChange = (key: string) => {
    if (key === 'ALL') setFilterApprovalStatus(undefined);
    else if (key === 'REJECTED') setFilterApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
    else setFilterApprovalStatus(key as ApprovalStatus);
    setPage(1);
  };

  const handleFilterSearch = (vals: Record<string, any>) => {
    setFilterKeyword(vals.keyword || '');
    setFilterConditionStatus(vals.conditionStatus);
    setFilterOrgUnitId(vals.orgUnitId);
    setFilterPortId(vals.portId);
    setFilterVtsSystemId(vals.vtsSystemId);
    setFilterProvinceId(vals.provinceId);
    setFilterUpdatedFrom(vals.updateDateRange?.[0] ? dayjs(vals.updateDateRange[0]).startOf('day').toISOString() : undefined);
    setFilterUpdatedTo(vals.updateDateRange?.[1] ? dayjs(vals.updateDateRange[1]).endOf('day').toISOString() : undefined);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilterKeyword('');
    setFilterConditionStatus(undefined);
    setFilterOrgUnitId(undefined);
    setFilterPortId(undefined);
    setFilterVtsSystemId(undefined);
    setFilterProvinceId(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setPage(1);
  };

  // Table Columns with client-side sorting (sắp xếp trực tiếp trên dữ liệu bảng)
  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      key: 'name',
      label: 'Tên / Mã trung tâm điều hành',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sorter: (a: any, b: any) => String(a.name || a.code || '').localeCompare(String(b.name || b.code || ''), 'vi'),
      render: (_: any, record: VtsOperationCenterListItem) => (
        <div
          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onClick={() => {
            setEditingId(record.id);
            setSelectedRecord(record as any);
            setModalMode('detail');
            setIsModalOpen(true);
          }}
        >
          <div style={cellTitleStyle} title={record.name || ''}>{record.name || '—'}</div>
          <div style={cellSubtitleStyle} title={record.code || ''}>{record.code || '—'}</div>
        </div>
      ),
    },
    {
      key: 'vtsSystemName',
      label: 'Thuộc hệ thống VTS',
      dataIndex: 'vtsSystemName',
      width: 220,
      ellipsis: false,
      sorter: (a: any, b: any) => String(a.vtsSystemName || '').localeCompare(String(b.vtsSystemName || ''), 'vi'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'portName',
      label: 'Thuộc cảng biển',
      dataIndex: 'portName',
      width: 200,
      ellipsis: false,
      sorter: (a: any, b: any) => String(a.portName || '').localeCompare(String(b.portName || ''), 'vi'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 220,
      ellipsis: false,
      sorter: (a: any, b: any) => String(a.orgUnitName || '').localeCompare(String(b.orgUnitName || ''), 'vi'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'province',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 180,
      ellipsis: false,
      sorter: (a: any, b: any) => {
        const valA = a.provinceName || getProvinceNameById(a.provinceId) || '';
        const valB = b.provinceName || getProvinceNameById(b.provinceId) || '';
        return String(valA).localeCompare(String(valB), 'vi');
      },
      render: (_: any, r: VtsOperationCenterListItem) => {
        const val = r.provinceName || getProvinceNameById(r.provinceId) || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 220,
      ellipsis: false,
      sorter: (a: any, b: any) => {
        const nameA = a.updatedByName || a.createdByName || '';
        const nameB = b.updatedByName || b.createdByName || '';
        const cmp = String(nameA).localeCompare(String(nameB), 'vi');
        if (cmp !== 0) return cmp;
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeA - timeB;
      },
      render: (_: any, record: VtsOperationCenterListItem) => {
        const name = record.updatedByName || record.createdByName || '—';
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
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      ellipsis: false,
      sorter: (a: any, b: any) => {
        const labelA = CONDITION_STATUS_MAP[a.conditionStatus as ConditionStatus] || String(a.conditionStatus || '');
        const labelB = CONDITION_STATUS_MAP[b.conditionStatus as ConditionStatus] || String(b.conditionStatus || '');
        return String(labelA).localeCompare(String(labelB), 'vi');
      },
      render: (v: string) => {
        const label = CONDITION_STATUS_MAP[v as ConditionStatus] || v;
        const color = CONDITION_COLOR[v as ConditionStatus] || textSecondary;
        return (
          <span style={statusBadgeStyle(color)}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái',
      dataIndex: 'approvalStatus',
      width: 180,
      ellipsis: false,
      sorter: (a: any, b: any) => {
        const labelA = String(a.approvalStatusLabel || a.approvalStatus || '');
        const labelB = String(b.approvalStatusLabel || b.approvalStatus || '');
        return String(labelA).localeCompare(String(labelB), 'vi');
      },
      render: (status: ApprovalStatus) => <ApprovalStatusBadge status={status} />,
    },
  ], [page, pageSize]);

  const rowActions = (record: VtsOperationCenterListItem) => {
    const isCreator = currentUser?.id && record.createdBy === currentUser.id;
    const isSelfApproval = Boolean(isCreator);
    const actions: any[] = [
      {
        key: 'detail',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record as any);
          setModalMode('detail');
          setIsModalOpen(true);
        },
      },
    ];

    if (hasPerm('vtsoperationcenter:history')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => handleViewHistory(record),
      });
    }

    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'vtsoperationcenter' })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => {
          setEditingId(record.id);
          setSelectedRecord(record as any);
          setModalMode('edit');
          setIsModalOpen(true);
        },
      });
    }

    if (hasPerm('vtsoperationcenter:update') && (record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2)) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: icons.submit,
        onClick: async () => {
          try {
            await vtsOperationCenterService.submit(record.id);
            toast.success('Gửi duyệt thành công');
            refreshList();
          } catch (e: any) {
            toast.error(e?.message || 'Lỗi gửi duyệt');
          }
        },
      });
    }

    if (hasPerm('vtsoperationcenter:approvec1') && record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && !isCreator) {
      actions.push({
        key: 'approve_c1',
        label: 'Phê duyệt cấp Cảng vụ/Chi cục',
        icon: icons.approve,
        onClick: () => openApproveModal(record.id, 'c1'),
      });
      actions.push({
        key: 'reject_c1',
        label: 'Từ chối cấp Cảng vụ/Chi cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openRejectModal(record.id),
      });
    }

    if (hasPerm('vtsoperationcenter:approvec2') && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1) {
      actions.push({
        key: 'approve_c2',
        label: isSelfApproval ? 'Phê duyệt cấp Cục (không thể tự duyệt)' : 'Phê duyệt cấp Cục',
        icon: icons.approve,
        disabled: isSelfApproval,
        onClick: () => openApproveModal(record.id, 'c2'),
      });
      actions.push({
        key: 'reject_c2',
        label: isSelfApproval ? 'Từ chối cấp Cục (không thể tự duyệt)' : 'Từ chối cấp Cục',
        icon: icons.reject,
        danger: true,
        disabled: isSelfApproval,
        onClick: () => openRejectModal(record.id),
      });
    }

    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'vtsoperationcenter' })) {
      actions.push({
        key: 'delete',
        label: 'Xóa bỏ',
        icon: icons.delete,
        danger: true,
        onClick: () => confirmDelete(record),
      });
    }

    return actions;
  };

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        <ScreenHeader
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Trung tâm điều hành CHK' }]}
          actions={
            hasPerm('vtsoperationcenter:create')
              ? [{
                key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: icons.create,
                onClick: () => { setEditingId(null); setSelectedRecord(null); setModalMode('create'); setIsModalOpen(true); }
              }]
              : []
          }
        />
        <FilterTableLayout
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed((value) => !value)}
          onFilterApply={() => handleFilterSearch(filterValues)}
          onFilterReset={() => { setFilterValues({}); handleFilterReset(); }}
          loading={loading}
          error={isError}
          errorMessage={errorMessage}
          onRetry={refreshList}
          statusTabs={statusTabs}
          onStatusTabChange={handleTabChange}
          hideFilterToggle={false}
          filterContent={
            <>
              {/* ── BỘ LỌC CƠ BẢN ── */}
              <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Đơn vị quản lý</div>
                <OrgUnitTreeSelect
                  organizations={orgUnitOptions}
                  placeholder="Tất cả"
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  value={filterValues.orgUnitId}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value, portId: undefined, vtsSystemId: undefined }));
                  }}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: spaceFormField }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Thuộc cảng biển</div>
                <Select
                  placeholder="Tất cả cảng biển"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                  }
                  value={filterValues.portId}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, portId: value }))}
                  options={filteredPortOptions.map((p) => ({
                    value: p.id,
                    label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : (p.portName || p.id),
                  }))}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: spaceFormField }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Thuộc hệ thống VTS</div>
                <Select
                  placeholder="Tất cả hệ thống VTS"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                  }
                  value={filterValues.vtsSystemId}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, vtsSystemId: value }))}
                  options={filteredVtsSystemOptions.map((v) => ({
                    value: v.id,
                    label: v.code ? `${v.code} - ${v.name || ''}` : (v.name || v.id),
                  }))}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: spaceFormField }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tìm kiếm</div>
                <Input
                  placeholder="Tìm theo mã, tên trung tâm..."
                  allowClear
                  value={filterValues.keyword || ''}
                  onChange={(event) => setFilterValues((prev) => ({ ...prev, keyword: event.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  style={inputStyle}
                />
              </div>

              {/* ── BỘ LỌC NÂNG CAO (Đóng / mở qua nút phễu [⎚]) ── */}
              {filterCollapsed && (
                <>
                  <div style={{ marginBottom: spaceFormField }}>
                    <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Tình trạng</div>
                    <Select
                      placeholder="Tất cả"
                      allowClear
                      value={filterValues.conditionStatus}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                      options={CONDITION_STATUS_OPTIONS}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: spaceFormField }}>
                    <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Ngày cập nhật</div>
                    <DatePicker.RangePicker
                      format="DD/MM/YYYY"
                      placeholder={['Từ ngày', 'Đến ngày']}
                      placement="topLeft"
                      value={filterValues.updateDateRange}
                      onChange={(dates) => setFilterValues((prev) => ({ ...prev, updateDateRange: dates }))}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: spaceFormField }}>
                    <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Địa điểm (Tỉnh / TP)</div>
                    <Select
                      placeholder="Tất cả tỉnh thành"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                      }
                      value={filterValues.provinceId}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, provinceId: value }))}
                      options={VIETNAM_PROVINCE_OPTIONS}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </div>
                </>
              )}
            </>
          }
        >
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            scroll={{ x: 'max-content' }}
          />
          <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
        </FilterTableLayout>

        {/* Drawer Unified Form */}
        {isModalOpen && (
          <VtsOperationCenterChkForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={orgUnitOptions}
            onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
            onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
          />
        )}

        {/* History Drawer */}
        <Drawer
          size={960}
          placement="right"
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          closable={false}
          extra={<Button type="text" onClick={() => setHistoryModalOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {selectedRecord ? `Lịch sử thay đổi — ${selectedRecord.name}` : 'Lịch sử thay đổi'}
                </span>
              </Space>
            </div>
          }
        >
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {loadingHistory ? (
              <LoadingSkeleton rows={5} />
            ) : historyRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {historyRecords.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      borderRadius: radiusSm,
                      border: `1px solid ${borderDefault}`,
                      background: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
                        {historyActor(item)}
                      </span>
                      <span style={{ color: textTertiary, fontSize: fontSizeSm }}>
                        {historyTimestamp(item) ? dayjs(historyTimestamp(item)).format('DD/MM/YYYY HH:mm:ss') : '—'}
                      </span>
                    </div>
                    <div style={{ fontSize: fontSizeMd, color: textPrimary }}>
                      <span style={{ color: textSecondary }}>Thao tác: </span>
                      <strong>{item.action || 'Cập nhật'}</strong>
                    </div>
                    {item.fieldName && (
                      <div style={{ fontSize: fontSizeSm, color: textSecondary, marginTop: 4 }}>
                        Trường thay đổi: <strong>{historyFieldName(item.fieldName)}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer>

        {/* Approval Modal */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approveLevel}
          onConfirm={handleApprove}
          onCancel={() => setApproveModalOpen(false)}
        />

        {/* Reject Modal */}
        <Modal
          title="Từ chối"
          open={rejectModalOpen}
          onOk={handleReject}
          onCancel={() => setRejectModalOpen(false)}
          okText="Từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối:</p>
          <Input.TextArea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            style={textAreaStyle}
          />
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
}
