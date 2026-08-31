import { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal, Input, Drawer, Button, Select, DatePicker, Space } from 'antd';
import { HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import { aisSystemService } from '../../services/aisSystemService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { radarStationService } from '../../services/radarStationService';
import { organizationService } from '../../services/organizationService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import type { AisSystemListItem, AisSystemResponse } from '../../types/aisSystem';
import type { HistoryEntry } from '../../types/radarStation';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_MAP, CONDITION_STATUS_OPTIONS } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import AisSystemForm from './AisSystemForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import toast from '../../components/ToastNotification';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusSm, radiusMd, spaceFormField, spaceSm, spaceMd,
  statusOperational, statusCritical, statusAttention, statusDraft,
  surfacePage, drawerTitleStyle, drawerCloseBtnStyle, selectStyle,
  borderDefault, statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle, primaryButtonStyle, textAreaStyle, clientSideStringSorter,
  clientSideProvinceSorter, clientSideUserSorter, clientSideBadgeSorter,
  getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds, type OrgUnitTreeOption } from '../../components/org-unit';
import SidebarFilterField from '../../components/list-view/SidebarFilterField';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const CONDITION_COLOR: Record<ConditionStatus, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

function historyFieldName(fn: string): string {
  const map: Record<string, string> = {
    name: 'Tên thiết bị AIS', code: 'Mã thiết bị AIS', province: 'Tỉnh/Thành phố',
    provinceId: 'Địa điểm (Tỉnh/TP)', detailedLocation: 'Địa điểm chi tiết',
    operatingOrgId: 'Đơn vị khai thác', operatingOrgName: 'Đơn vị khai thác',
    unitOfMeasure: 'Đơn vị tính', quantity: 'Số lượng', model: 'Model/Ký hiệu',
    specifications: 'Thông số kỹ thuật', manufacturer: 'Hãng sản xuất',
    commissioningYear: 'Năm đưa vào sử dụng', maintenanceInfo: 'Thông tin bảo trì',
    note: 'Ghi chú', approvalStatus: 'Trạng thái phê duyệt', conditionStatus: 'Tình trạng',
    orgUnitName: 'Đơn vị quản lý', orgUnitId: 'Đơn vị quản lý',
    vtsOperationCenterId: 'Thuộc TTDH VTS', radarStationId: 'Thuộc trạm Radar',
    symbolId: 'Biểu tượng', coordinates: 'Tọa độ GIS', geometryType: 'Loại đối tượng GIS',
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

function normalizedHistoryFields(value: string): string[] {
  const fields = value.split(/[,;]+/).map((field: string) => field.trim()).filter(Boolean);
  const hasApprovalStatus = fields.some((field) => {
    const key = normalizeHistoryKey(field);
    return key === 'approvalstatus' || key === 'trang thai phe duyet';
  });

  if (hasApprovalStatus) {
    return fields.filter((field) => {
      const key = normalizeHistoryKey(field);
      return key !== 'approvedlevel1'
        && key !== 'approvedlevel2'
        && key !== 'rejectedlevel1'
        && key !== 'rejectedlevel2'
        && key !== 'approvalreasonlevel1'
        && key !== 'approvalreasonlevel2';
    });
  }

  return fields;
}

function historyChangeRows(item: any): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  const fields = normalizedHistoryFields(historyField(item));
  const oldVal = historyOldValue(item);
  const newVal = historyNewValue(item);

  if (fields.length <= 1) {
    return [{ field: fields[0] || '', oldValue: oldVal, newValue: newVal }];
  }

  const oldMap = new Map<string, string>();
  if (oldVal) {
    oldVal.split(';').forEach((part) => {
      const idx = part.indexOf('=');
      if (idx >= 0) oldMap.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
    });
  }

  const newMap = new Map<string, string>();
  if (newVal) {
    newVal.split(';').forEach((part) => {
      const idx = part.indexOf('=');
      if (idx >= 0) newMap.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
    });
  }

  return fields.map((fn) => ({
    field: fn,
    oldValue: oldMap.get(fn) ?? (fields.length === 1 ? oldVal : null),
    newValue: newMap.get(fn) ?? (fields.length === 1 ? newVal : null),
  })).filter((r) => {
    if (r.oldValue === null && r.newValue === null) return false;
    return r.oldValue !== r.newValue;
  });
}

export function AisSystemList() {
  const currentUser = useAuthStore((s) => s.user);
  const { hasPermission } = usePermissionStore();
  const hasPerm = useCallback((perm: string) => hasPermission(perm), [hasPermission]);

  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dataSource, setDataSource] = useState<AisSystemListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Status counts
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filter state
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>(undefined);
  const [filterValues, setFilterValues] = useState<{
    keyword?: string;
    orgUnitId?: string;
    vtsOperationCenterId?: string;
    operatingOrgId?: string;
    provinceId?: number;
    conditionStatus?: ConditionStatus;
    updateDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  }>({});

  // Dropdown reference data
  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [operatingOrganizations, setOperatingOrganizations] = useState<any[]>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [opCenters, setOpCenters] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [radarStations, setRadarStations] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);

  // Modal / Drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AisSystemResponse | null>(null);

  // History Drawer
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  // Approval modals
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [actionTargetRecord, setActionTargetRecord] = useState<AisSystemListItem | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Load dropdown lists
  const loadReferenceData = useCallback(async () => {
    try {
      const [orgRes, opRes, radarRes, operatingRes] = await Promise.allSettled([
        organizationService.list({ pageSize: 1000 }),
        vtsOperationCenterService.getOptions(),
        radarStationService.getOptions(),
        vtsSystemCRUD.getOperatingOrganizationOptions(),
      ]);
      if (orgRes.status === 'fulfilled' && orgRes.value && Array.isArray(orgRes.value.data)) {
        setOrgUnitOptions(orgRes.value.data);
      }
      if (opRes.status === 'fulfilled' && Array.isArray(opRes.value)) {
        setOpCenters(opRes.value.map((c: any) => ({ id: c.id, name: c.name, orgUnitId: c.orgUnitId })));
      }
      if (radarRes.status === 'fulfilled' && Array.isArray(radarRes.value)) {
        setRadarStations(radarRes.value.map((r: any) => ({ id: r.id, name: r.stationName || r.code || r.id, orgUnitId: r.orgUnitId })));
      }
      if (operatingRes.status === 'fulfilled' && Array.isArray(operatingRes.value) && operatingRes.value.length > 0) {
        setOperatingOrganizations(operatingRes.value);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const operatingUnitOptions = useMemo(() => {
    const list: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();

    if (Array.isArray(orgUnitOptions)) {
      orgUnitOptions.forEach((o) => {
        if (o.id && o.name && !seen.has(String(o.id))) {
          seen.add(String(o.id));
          list.push({ value: String(o.id), label: o.code ? `${o.code} - ${o.name}` : o.name });
        }
      });
    }

    if (Array.isArray(operatingOrganizations)) {
      operatingOrganizations.forEach((o) => {
        if (o.id && o.name && !seen.has(String(o.id))) {
          seen.add(String(o.id));
          list.push({ value: String(o.id), label: o.code ? `${o.code} - ${o.name}` : o.name });
        }
      });
    }

    return list;
  }, [orgUnitOptions, operatingOrganizations]);

  const filteredOpCenters = useMemo(() => {
    if (!filterValues.orgUnitId) return opCenters;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId);
    return opCenters.filter((c) => !c.orgUnitId || allowedIds.has(c.orgUnitId));
  }, [opCenters, filterValues.orgUnitId, orgUnitOptions]);

  const filteredRadarStations = useMemo(() => {
    if (!filterValues.orgUnitId) return radarStations;
    const allowedIds = resolveOrgSubtreeIds(orgUnitOptions, filterValues.orgUnitId);
    return radarStations.filter((r) => !r.orgUnitId || allowedIds.has(r.orgUnitId));
  }, [radarStations, filterValues.orgUnitId, orgUnitOptions]);

  const combinedLocationOptions = useMemo(() => [
    {
      label: 'Trung tâm điều hành VTS',
      options: filteredOpCenters.map((c) => ({ value: `op_${c.id}`, rawId: c.id, type: 'op', label: c.name })),
    },
    {
      label: 'Trạm Radar',
      options: filteredRadarStations.map((r) => ({ value: `radar_${r.id}`, rawId: r.id, type: 'radar', label: r.name })),
    },
  ], [filteredOpCenters, filteredRadarStations]);

  // Fetch list data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    setErrorMessage('');
    try {
      let filterOpCenterId: string | undefined = undefined;
      let filterRadarStationId: string | undefined = undefined;
      if (filterValues.vtsOperationCenterId) {
        if (filterValues.vtsOperationCenterId.startsWith('op_')) {
          filterOpCenterId = filterValues.vtsOperationCenterId.replace('op_', '');
        } else if (filterValues.vtsOperationCenterId.startsWith('radar_')) {
          filterRadarStationId = filterValues.vtsOperationCenterId.replace('radar_', '');
        } else {
          filterOpCenterId = filterValues.vtsOperationCenterId;
        }
      }

      let updatedFrom: string | undefined = undefined;
      let updatedTo: string | undefined = undefined;
      if (filterValues.updateDateRange && filterValues.updateDateRange[0]) {
        updatedFrom = filterValues.updateDateRange[0].startOf('day').toISOString();
      }
      if (filterValues.updateDateRange && filterValues.updateDateRange[1]) {
        updatedTo = filterValues.updateDateRange[1].endOf('day').toISOString();
      }

      const res = await aisSystemService.search({
        keyword: filterValues.keyword?.trim() || undefined,
        orgUnitId: filterValues.orgUnitId || undefined,
        vtsOperationCenterId: filterOpCenterId,
        radarStationId: filterRadarStationId,
        provinceId: filterValues.provinceId,
        conditionStatus: filterValues.conditionStatus ? (Number(filterValues.conditionStatus) as any) : undefined,
        approvalStatus: filterApprovalStatus,
        updatedFrom,
        updatedTo,
        page,
        size: pageSize,
      });

      setDataSource(res.items || []);
      setTotal(res.total || 0);
      setStatusCounts(res.statusCounts || {});
    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err?.message || 'Không thể tải danh sách hệ thống AIS');
      toast.error('Không thể tải danh sách hệ thống AIS');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterValues, filterApprovalStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshList = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Tab counts
  const countDraft = statusCounts['DRAFT'] || 0;
  const countPendingApproval = (statusCounts['PENDING_APPROVAL'] || 0) + (statusCounts['PROPOSED'] || 0);
  const countApprovedLevel1 = statusCounts['APPROVED_LEVEL1'] || 0;
  const countApproved = (statusCounts['APPROVED'] || 0) + (statusCounts['APPROVED_LEVEL2'] || 0);
  const countRejected = (statusCounts['REJECTED'] || 0) + (statusCounts['REJECTED_LEVEL1'] || 0) + (statusCounts['REJECTED_LEVEL2'] || 0);
  const countAll = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejected;

  const statusTabs = useMemo(() => [
    { key: 'ALL', label: 'Tất cả', count: countAll, color: actionPrimary, active: !filterApprovalStatus },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countDraft, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.DRAFT },
    { key: ApprovalStatus.PENDING_APPROVAL, label: 'Chờ Cảng vụ duyệt', count: countPendingApproval, color: statusAttention, active: filterApprovalStatus === ApprovalStatus.PENDING_APPROVAL },
    { key: ApprovalStatus.APPROVED_LEVEL1, label: 'Chờ Cục duyệt', count: countApprovedLevel1, color: '#0284C7', active: filterApprovalStatus === ApprovalStatus.APPROVED_LEVEL1 },
    { key: ApprovalStatus.APPROVED, label: 'Đã duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: 'REJECTED', label: 'Từ chối', count: countRejected, color: statusCritical, active: filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2 },
  ], [countAll, countDraft, countPendingApproval, countApprovedLevel1, countApproved, countRejected, filterApprovalStatus]);

  const handleTabChange = (key: string) => {
    setPage(1);
    if (key === 'ALL') {
      setFilterApprovalStatus(undefined);
    } else if (key === 'REJECTED') {
      setFilterApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
    } else {
      setFilterApprovalStatus(key as ApprovalStatus);
    }
  };

  const handleFilterSearch = (vals: typeof filterValues) => {
    setPage(1);
    setFilterValues(vals);
  };

  const handleFilterReset = () => {
    setPage(1);
    setFilterValues({});
    setFilterApprovalStatus(undefined);
  };

  // View history
  const handleViewHistory = async (record: AisSystemListItem) => {
    setSelectedRecord(record as any);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    setHistorySearchInput('');
    setHistorySearch('');
    setHistoryDateFrom('');
    setHistoryDateTo('');
    try {
      const records = await aisSystemService.getHistory(record.id);
      setHistoryRecords(records || []);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Confirm delete
  const confirmDelete = (record: AisSystemListItem) => {
    Modal.confirm({
      title: 'Xác nhận xóa hệ thống AIS',
      icon: <span style={{ color: statusCritical, fontSize: 22, marginRight: 8 }}>⚠</span>,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa hệ thống AIS <strong>{record.name}</strong> ({record.code})?</p>
          <p style={{ color: textSecondary, fontSize: fontSizeSm }}>Hành động này không thể hoàn tác.</p>
        </div>
      ),
      okText: 'Xác nhận xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await aisSystemService.delete(record.id);
          toast.success('Xóa hệ thống AIS thành công');
          refreshList();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || err?.message || 'Xóa thất bại');
        }
      },
    });
  };

  // Approve / Reject actions
  const openApprove = (record: AisSystemListItem, level: 'c1' | 'c2') => {
    setActionTargetRecord(record);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleApprove = async (reason?: string) => {
    if (!actionTargetRecord) return;
    try {
      if (approveLevel === 'c1') {
        await aisSystemService.approveC1(actionTargetRecord.id, 'APPROVED', reason);
        toast.success('Phê duyệt cấp Cảng vụ/Chi cục thành công');
      } else {
        await aisSystemService.approveC2(actionTargetRecord.id, 'APPROVED', reason);
        toast.success('Phê duyệt cấp Cục thành công');
      }
      setApproveModalOpen(false);
      setActionTargetRecord(null);
      refreshList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Phê duyệt thất bại');
    }
  };

  const openReject = (record: AisSystemListItem) => {
    setActionTargetRecord(record);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!actionTargetRecord) return;
    if (!rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await aisSystemService.reject(actionTargetRecord.id, rejectReason.trim());
      toast.success('Từ chối phê duyệt thành công');
      setRejectModalOpen(false);
      setActionTargetRecord(null);
      refreshList();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Từ chối thất bại');
    }
  };

  // Table Columns
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
      label: 'Tên / Mã thiết bị AIS',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sorter: clientSideStringSorter('name', 'code'),
      render: (_: any, record: AisSystemListItem) => (
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
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 220,
      ellipsis: false,
      sorter: clientSideStringSorter('orgUnitName'),
      render: (v: string) => <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: fontWeightBold }} title={v}>{v || '—'}</div>,
    },
    {
      key: 'vtsOperationCenterName',
      label: 'Thuộc TTDH VTS / Trạm Radar',
      dataIndex: 'vtsOperationCenterName',
      width: 220,
      ellipsis: false,
      sorter: (a: AisSystemListItem, b: AisSystemListItem) => {
        const aVal = a.attachedLocationName || a.vtsOperationCenterName || a.radarStationName || '';
        const bVal = b.attachedLocationName || b.vtsOperationCenterName || b.radarStationName || '';
        return aVal.localeCompare(bVal, 'vi');
      },
      render: (_: any, record: AisSystemListItem) => {
        const val = record.attachedLocationName || record.vtsOperationCenterName || record.radarStationName || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'operatingOrgName',
      label: 'Đơn vị khai thác',
      dataIndex: 'operatingOrgName',
      width: 200,
      ellipsis: false,
      sorter: clientSideStringSorter('operatingOrgName'),
      render: (v: string, record: AisSystemListItem) => {
        const val = v || record.operatingOrgName || operatingUnitOptions.find((o) => o.value === String(record.operatingOrgId))?.label || DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === record.operatingOrgId)?.name || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'province',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 180,
      ellipsis: false,
      sorter: clientSideProvinceSorter('provinceName', 'provinceId'),
      render: (_: any, r: AisSystemListItem) => {
        const val = r.provinceName || getProvinceNameById(r.provinceId) || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      ellipsis: false,
      sorter: clientSideBadgeSorter('conditionStatus', CONDITION_STATUS_MAP),
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
      sorter: clientSideBadgeSorter('approvalStatus'),
      render: (status: ApprovalStatus) => <ApprovalStatusBadge status={status} />,
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 220,
      ellipsis: false,
      sorter: clientSideUserSorter('updatedByName', 'createdByName', 'updatedAt'),
      render: (_: any, record: AisSystemListItem) => {
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
      key: 'submittedByName',
      label: 'Cán bộ gửi phê duyệt',
      dataIndex: 'submittedByName',
      width: 220,
      ellipsis: false,
      render: (_: any, record: AisSystemListItem) => {
        const name = record.submittedByName || '—';
        const date = record.submittedAt || (record as any).submittedDate;
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
      key: 'approverLevel1Name',
      label: 'Phê duyệt cấp Cảng vụ/Chi cục',
      dataIndex: 'approverLevel1Name',
      width: 240,
      ellipsis: false,
      render: (_: any, record: AisSystemListItem) => {
        const name = record.approverLevel1Name || (record as any).approverLevel1 || '—';
        const date = record.approvedDateLevel1;
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
      key: 'approverLevel2Name',
      label: 'Phê duyệt cấp Cục',
      dataIndex: 'approverLevel2Name',
      width: 220,
      ellipsis: false,
      render: (_: any, record: AisSystemListItem) => {
        const name = record.approverLevel2Name || (record as any).approverLevel2 || '—';
        const date = record.approvedDateLevel2;
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
  const rowActions = (record: AisSystemListItem) => {
    const isCreator = Boolean(currentUser?.id && record.createdBy === currentUser.id);
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

    if (hasPerm('aissystem:history')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => handleViewHistory(record),
      });
    }

    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'aissystem' })) {
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

    if (hasPerm('aissystem:update') && (record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2)) {
      actions.push({
        key: 'submit',
        label: 'Gửi duyệt',
        icon: icons.submit,
        onClick: async () => {
          try {
            await aisSystemService.submit(record.id);
            toast.success('Gửi duyệt thành công');
            refreshList();
          } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Lỗi gửi duyệt');
          }
        },
      });
    }

    if (hasPerm('aissystem:approvec1') && record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && !isCreator) {
      actions.push({
        key: 'approve_c1',
        label: 'Phê duyệt cấp Cảng vụ/Chi cục',
        icon: icons.approve,
        onClick: () => openApprove(record, 'c1'),
      });
      actions.push({
        key: 'reject_c1',
        label: 'Từ chối cấp Cảng vụ/Chi cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openReject(record),
      });
    }

    if (hasPerm('aissystem:approvec2') && record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1) {
      actions.push({
        key: 'approve_c2',
        label: 'Phê duyệt cấp Cục',
        icon: icons.approve,
        onClick: () => openApprove(record, 'c2'),
      });
      actions.push({
        key: 'reject_c2',
        label: 'Từ chối cấp Cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openReject(record),
      });
    }

    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'aissystem' })) {
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

  // Render History Timeline
  const renderHistoryTimeline = (list: HistoryEntry[]) => {
    if (!list || list.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: textTertiary }}>
          Chưa có lịch sử thay đổi nào
        </div>
      );
    }

    return (
      <div style={{ padding: '8px 0' }}>
        {list.map((h, i) => {
          const rows = historyChangeRows(h);
          const reasons = [h.reason, (h as any).ghiChu, (h as any).note].filter(Boolean);

          return (
            <div
              key={h.id || i}
              style={{
                padding: '12px 16px',
                marginBottom: 12,
                border: `1px solid ${borderDefault}`,
                borderRadius: radiusMd,
                background: surfacePage,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd }}>
                  {historyActor(h)}
                </span>
                <span style={{ color: textSecondary, fontSize: fontSizeSm }}>
                  {historyTimestamp(h) ? dayjs(historyTimestamp(h)).format('DD/MM/YYYY HH:mm:ss') : '—'}
                </span>
              </div>

              {rows.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                  {rows.map((r, ri) => (
                    <div
                      key={ri}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '170px minmax(100px, 1fr) 24px minmax(100px, 1fr)',
                        alignItems: 'center',
                        gap: spaceSm,
                        fontSize: fontSizeMd,
                        lineHeight: 1.6,
                      }}
                    >
                      <div style={{ fontWeight: fontWeightMedium, color: textSecondary }}>
                        {r.field ? `${historyFieldName(r.field)}:` : '—'}
                      </div>
                      <div style={{ color: statusCritical, textDecoration: 'line-through' }}>
                        {historyFieldValue(r.field, r.oldValue)}
                      </div>
                      <div style={{ textAlign: 'center', color: textTertiary }}>→</div>
                      <div style={{ color: statusOperational, fontWeight: fontWeightMedium }}>
                        {historyFieldValue(r.field, r.newValue)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {reasons.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${borderDefault}` }}>
                  {reasons.map((r: any, ri: number) => (
                    <div key={ri} style={{ fontSize: fontSizeMd, color: textPrimary }}>
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        <ScreenHeader
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Hệ thống trạm bờ AIS' }]}
          actions={
            hasPerm('aissystem:create')
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
          filterContent={
            <>
              <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
                <OrgUnitTreeSelect
                  organizations={orgUnitOptions}
                  placeholder="Tất cả"
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  value={filterValues.orgUnitId}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value, vtsOperationCenterId: undefined }));
                  }}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tìm kiếm">
                <Input
                  placeholder="Tìm theo mã, tên thiết bị..."
                  allowClear
                  value={filterValues.keyword}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, keyword: e.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  style={inputStyle}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Thuộc TTDH VTS / Trạm Radar">
                <Select
                  placeholder="Tất cả"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                  }
                  value={filterValues.vtsOperationCenterId}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, vtsOperationCenterId: value }))}
                  options={combinedLocationOptions}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Đơn vị khai thác">
                <Select
                  placeholder="Tất cả đơn vị khai thác"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    normalizeSearchText(option?.label || '').includes(normalizeSearchText(input))
                  }
                  value={filterValues.operatingOrgId}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, operatingOrgId: value }))}
                  options={operatingUnitOptions}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tình trạng">
                <Select
                  placeholder="Tất cả tình trạng"
                  allowClear
                  value={filterValues.conditionStatus}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Khoảng ngày cập nhật">
                <DatePicker.RangePicker
                  {...getRangePickerProps({
                    value: filterValues.updateDateRange,
                    onChange: (dates: any) => setFilterValues((prev) => ({ ...prev, updateDateRange: dates })),
                  })}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Địa điểm (Tỉnh / TP)">
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
              </SidebarFilterField>
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
          <AisSystemForm
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
          extra={<Button type="text" aria-label="Đóng lịch sử thay đổi" onClick={() => setHistoryModalOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
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
                  {selectedRecord ? `Lịch sử thay đổi — ${selectedRecord.name || (selectedRecord as any).code}` : 'Lịch sử thay đổi'}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusSm, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                  {`Tổng cộng ${historyRecords.length}`}
                </span>
              </Space>
            </div>
          }
        >
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
              <Input
                placeholder="Tìm kiếm nội dung thay đổi..."
                allowClear
                value={historySearchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setHistorySearchInput(val);
                  if (!val) setHistorySearch('');
                }}
                onPressEnter={() => setHistorySearch(historySearchInput.trim())}
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
                  if (selectedRecord) {
                    setLoadingHistory(true);
                    aisSystemService.getHistory(selectedRecord.id).then((res) => {
                      setHistoryRecords(res || []);
                    }).catch(() => {
                      toast.error('Không thể tải lịch sử thay đổi');
                    }).finally(() => {
                      setLoadingHistory(false);
                    });
                  }
                }}
                style={primaryButtonStyle}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {loadingHistory && historyRecords.length === 0 ? (
              <LoadingSkeleton rows={5} />
            ) : (
              renderHistoryTimeline(
                historyRecords.filter((item) => {
                  if (!historySearch && !historyDateFrom && !historyDateTo) return true;
                  const q = historySearch.toLowerCase().trim();
                  const ts = historyTimestamp(item);
                  if (historyDateFrom && ts && dayjs(ts).isBefore(dayjs(historyDateFrom))) return false;
                  if (historyDateTo && ts && dayjs(ts).isAfter(dayjs(historyDateTo))) return false;
                  if (!q) return true;
                  const act = historyActor(item).toLowerCase();
                  const fn = historyFieldName(historyField(item)).toLowerCase();
                  const ov = String(historyOldValue(item) || '').toLowerCase();
                  const nv = String(historyNewValue(item) || '').toLowerCase();
                  return act.includes(q) || fn.includes(q) || ov.includes(q) || nv.includes(q);
                })
              )
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
            maxLength={1000}
            showCount
            style={textAreaStyle}
          />
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
}

export default AisSystemList;
