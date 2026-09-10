import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, DatePicker, Select } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import DeleteConfirmModal from '../../../components/shared/DeleteConfirmModal';
import { hanoiStationService, type HanoiStationListParams } from '../../../services/hanoiStationService';
import { symbolService } from '../../../services/symbolService';
import { organizationService } from '../../../services/organizationService';
import type { HanoiStationItem } from '../../../types/hanoiStation';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../../types/vtsSystem';
import { useAuthStore, type AuthState } from '../../../store/authStore';
import { usePermissionStore, type PermissionState } from '../../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../../components/list-view';
import FilterTableLayout from '../../../components/list-view/FilterTableLayout';
import Pagination from '../../../components/list-view/Pagination';
import HanoiStationForm from './HanoiStationForm';
import ApprovalModal from '../../../components/shared/ApprovalModal';
import CommonHistoryDrawer, { type CommonHistoryEntry } from '../../../components/shared/CommonHistoryDrawer';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import { useStandardApprovalStatusTabs } from '../../../components/shared/approvalStatusTabs';
import toast from '../../../components/ToastNotification';
import {
  actionPrimary, textSecondary,
  fontWeightBold,
  spaceSm, spaceMd,
  statusOperational, statusCritical, statusAttention,
  statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  textAreaStyle, colors, radiusPill,
  getRangePickerProps,
  getConditionStatusColor,
  getConditionStatusLabel,
} from '../../../themetokenchk';
import * as themeTokenChk from '../../../themetokenchk';
import { ThemeTokenProvider } from '../../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../../components/org-unit';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../../utils/approvalEditPolicy';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';

const fontSizeMd = 13.5;

const filterLabelStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd,
  marginBottom: spaceSm,
};

/** Số bản ghi nhật ký mỗi lần cuộn tải thêm trong drawer lịch sử. */
const HISTORY_PAGE_SIZE = 20;

const CONDITION_COLOR: Record<ConditionStatus, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

const HANOI_FIELD_MAP: Record<string, string> = {
  code: 'Mã đài',
  deviceCode: 'Mã đài',
  name: 'Tên đài',
  stationName: 'Tên đài',
  'Tên đài': 'Tên đài',
  orgUnitId: 'Đơn vị quản lý',
  orgUnitName: 'Đơn vị quản lý',
  'Đơn vị quản lý': 'Đơn vị quản lý',
  operatingOrgId: 'Đơn vị khai thác',
  operatingOrgName: 'Đơn vị khai thác',
  'Đơn vị khai thác': 'Đơn vị khai thác',
  provinceId: 'Địa điểm (Tỉnh/TP)',
  'Địa điểm (Tỉnh/TP)': 'Địa điểm (Tỉnh/TP)',
  locationDetail: 'Địa điểm chi tiết',
  locationAddress: 'Địa điểm chi tiết',
  'Địa điểm chi tiết': 'Địa điểm chi tiết',
  conditionStatus: 'Tình trạng',
  'Tình trạng': 'Tình trạng',
  coverageZone: 'Vùng phủ sóng',
  'Vùng phủ sóng': 'Vùng phủ sóng',
  coverageArea: 'Khu vực phủ sóng',
  'Khu vực phủ sóng': 'Khu vực phủ sóng',
  services: 'Dịch vụ cung cấp',
  'Dịch vụ cung cấp': 'Dịch vụ cung cấp',
  frequency: 'Tần số',
  communicationFrequency: 'Tần số liên lạc',
  'Tần số': 'Tần số',
  equipmentType: 'Loại thiết bị',
  operationalLicense: 'Giấy phép hoạt động',
  licenseExpiry: 'Thời hạn giấy phép',
  lastInspectionDate: 'Ngày kiểm định gần nhất',
  nextInspectionDate: 'Ngày kiểm định tiếp theo',
  inspectorName: 'Cán bộ kiểm định',
  inspectorPhone: 'SĐT cán bộ kiểm định',
  contactPerson: 'Người liên hệ',
  contactPhone: 'Số điện thoại',
  notes: 'Ghi chú',
  note: 'Ghi chú',
  description: 'Ghi chú',
  'Ghi chú': 'Ghi chú',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  'Tọa độ GPS': 'Tọa độ GPS',
  symbol: 'Biểu tượng',
  'Biểu tượng': 'Biểu tượng',
  geometryType: 'Loại đối tượng',
  objectType: 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  coordinateSystem: 'Hệ quy chiếu',
  'Hệ quy chiếu': 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  'Quy tắc hiển thị': 'Quy tắc hiển thị',
  approvalStatus: 'Trạng thái phê duyệt',
  approvalLevel: 'Cấp phê duyệt',
};

const formatHistoryValue = (field: string, val: unknown): string => {
  if (val === null || val === undefined || val === '') return '—';
  if (field === 'provinceId' || field === 'Địa điểm (Tỉnh/TP)') {
    return getProvinceNameById(val as number) || String(val);
  }
  if (field === 'conditionStatus' || field === 'Tình trạng') {
    return getConditionStatusLabel(val as string);
  }
  return String(val);
};

export default function HanoiStationList() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get('action');
  const linkedRecordId = searchParams.get('id');
  const handledLinkedRecordRef = useRef<string | null>(null);

  const currentUser = useAuthStore((s: AuthState) => s.user);
  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const customTokens = useMemo(() => ({
    ...themeTokenChk,
    fontSizeMd: 13.5,
  }), []);

  const [data, setData] = useState<HanoiStationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const statusCountFilterKey = useRef<string | null>(null);

  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [filterKeyword, setFilterKeyword] = useState('');
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>(undefined);
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>(undefined);
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>(undefined);
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>(undefined);
  const [filterOperatingOrgId, setFilterOperatingOrgId] = useState<string | undefined>(undefined);
  const [filterStationCode, setFilterStationCode] = useState<string | undefined>(undefined);
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>(undefined);
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>(undefined);
  const [filterCollapsed, setFilterCollapsed] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [selectedRecord, setSelectedRecord] = useState<HanoiStationItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<CommonHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTargetId, setHistoryTargetId] = useState<string | null>(null);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  const [orgUnits, setOrgUnits] = useState<OrgUnitTreeOption[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);

  const canCreate = hasPerm('coastalstationhaiphong:create') || hasPerm('specialstation:create') || hasPerm('data:create') || (currentUser as any)?.role === 'SUPER_ADMIN' || (currentUser as any)?.role === 'ADMIN';

  useEffect(() => {
    organizationService.getAll().then((res) => {
      const items = Array.isArray(res) ? res : ((res as any)?.data || []);
      setOrgUnits(items);
    }).catch(() => {});

    symbolService.getOptions().then((res) => {
      if (Array.isArray(res) && res.length > 0) setSymbols(res);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentFilterKey = `${filterKeyword}|${filterOrgUnitId}|${filterOperatingOrgId}|${filterStationCode}|${filterProvinceId}|${filterConditionStatus}|${filterUpdatedFrom}|${filterUpdatedTo}`;
      const filterChanged = statusCountFilterKey.current !== currentFilterKey;

      const params: HanoiStationListParams = {
        keyword: filterKeyword || undefined,
        orgUnitId: filterOrgUnitId || undefined,
        operatingOrgId: filterOperatingOrgId || undefined,
        code: filterStationCode || undefined,
        provinceId: filterProvinceId,
        conditionStatus: filterConditionStatus || undefined,
        approvalStatus: filterApprovalStatus || undefined,
        updatedFrom: filterUpdatedFrom || undefined,
        updatedTo: filterUpdatedTo || undefined,
        page,
        size: pageSize,
        sortBy: sortField,
        sortDir: sortDirection,
        includeCounts: filterChanged,
      };

      const res = await hanoiStationService.search(params);
      setData(res.items);
      setTotal(res.total);
      if (filterChanged) {
        setStatusCounts(res.statusCounts || {});
        statusCountFilterKey.current = currentFilterKey;
      }
    } catch (err: any) {
      const msg = err?.message || 'Không thể tải danh sách Đài TTXLTT Hàng hải';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [
    filterKeyword, filterOrgUnitId, filterOperatingOrgId, filterStationCode,
    filterProvinceId, filterConditionStatus, filterApprovalStatus,
    filterUpdatedFrom, filterUpdatedTo, page, pageSize, sortField, sortDirection,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hỗ trợ mở tự động qua URL query parameters: ?action=detail|edit&id=...
  useEffect(() => {
    if (!linkedAction || !linkedRecordId) return;
    if (handledLinkedRecordRef.current === `${linkedAction}_${linkedRecordId}`) return;

    hanoiStationService.getById(linkedRecordId).then((rec) => {
      if (!rec) return;
      handledLinkedRecordRef.current = `${linkedAction}_${linkedRecordId}`;
      setSelectedRecord(rec);
      setEditingId(rec.id);
      if (linkedAction === 'edit') {
        setModalMode('edit');
        setIsModalOpen(true);
      } else if (linkedAction === 'detail') {
        setModalMode('detail');
        setIsModalOpen(true);
      }
    }).catch(() => {});
  }, [linkedAction, linkedRecordId]);

  const handleCreate = () => {
    setSelectedRecord(null);
    setEditingId(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (record: HanoiStationItem) => {
    setSelectedRecord(record);
    setEditingId(record.id);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDetail = (record: HanoiStationItem) => {
    setSelectedRecord(record);
    setEditingId(record.id);
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const handleSubmitForApproval = async (record: HanoiStationItem) => {
    try {
      await hanoiStationService.submit(record.id);
      toast.success('Gửi phê duyệt thành công');
      statusCountFilterKey.current = null;
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi gửi phê duyệt');
    }
  };

  // ── Delete confirmation modal (Chuẩn Bến cảng) ───────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<HanoiStationItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = (record: HanoiStationItem) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await hanoiStationService.delete(deletingRecord.id);
      toast.success('Xóa Đài TTXLTT thành công');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      statusCountFilterKey.current = null;
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi xóa Đài TTXLTT');
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadHistoryPage = async (
    targetId: string,
    pageToLoad: number,
    isInitial = false,
    filters?: { keyword: string; fromDate?: string; toDate?: string }
  ) => {
    if (isInitial) {
      setLoadingHistory(true);
    } else {
      setLoadingMoreHistory(true);
    }

    try {
      const res = await hanoiStationService.getHistory(targetId, pageToLoad, HISTORY_PAGE_SIZE, {
        keyword: filters?.keyword || undefined,
        fromDate: filters?.fromDate || undefined,
        toDate: filters?.toDate || undefined,
      });

      const entries = res || [];

      const formattedEntries: CommonHistoryEntry[] = entries.map((raw: any) => ({
        id: raw.id || `${raw.timestamp || Date.now()}_${Math.random()}`,
        action: raw.action || raw.actionType || 'UPDATE',
        actionLabel: raw.actionLabel || raw.actionName,
        performedBy: raw.performedBy || raw.performedByName || raw.userName || '—',
        performedAt: raw.performedAt || raw.createdAt || raw.timestamp || dayjs().toISOString(),
        details: raw.details || raw.description || '',
        note: raw.note || raw.comment || '',
        changes: Array.isArray(raw.changes)
          ? raw.changes.map((c: any) => {
              const fieldName = c.fieldName || c.field || '';
              const mappedLabel = HANOI_FIELD_MAP[fieldName] || c.fieldLabel || fieldName;
              return {
                fieldName,
                fieldLabel: mappedLabel,
                oldValue: formatHistoryValue(fieldName, c.oldValue),
                newValue: formatHistoryValue(fieldName, c.newValue),
              };
            })
          : [],
      }));

      if (isInitial) {
        setHistoryRecords(formattedEntries);
      } else {
        setHistoryRecords((prev) => [...prev, ...formattedEntries]);
      }

      setHistoryPage(pageToLoad);
      setHasMoreHistory(entries.length === HISTORY_PAGE_SIZE);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
      setLoadingMoreHistory(false);
    }
  };

  const handleOpenHistory = (record: HanoiStationItem) => {
    setSelectedRecord(record);
    setHistoryTargetId(record.id);
    setHistoryRecords([]);
    setHistoryPage(0);
    setHasMoreHistory(true);
    setHistoryFilters({ keyword: '' });
    setHistoryModalOpen(true);
    loadHistoryPage(record.id, 0, true);
  };

  const handleHistorySearch = (vals: { keyword: string; fromDate?: string; toDate?: string }) => {
    if (!historyTargetId) return;
    setHistoryFilters(vals);
    setHistoryPage(0);
    setHasMoreHistory(true);
    loadHistoryPage(historyTargetId, 0, true, vals);
  };

  const handleLoadMoreHistory = () => {
    if (!historyTargetId || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    loadHistoryPage(historyTargetId, historyPage + 1, false, historyFilters);
  };

  const { statusTabs, handleTabChange } = useStandardApprovalStatusTabs(
    statusCounts,
    filterApprovalStatus,
    (status) => {
      setFilterApprovalStatus(status);
      setPage(1);
    }
  );

  const handleFilterSearch = (vals: Record<string, any>) => {
    setFilterKeyword(vals.keyword || '');
    setFilterOrgUnitId(vals.orgUnitId);
    setFilterOperatingOrgId(vals.operatingOrgId);
    setFilterStationCode(vals.stationCode);
    setFilterConditionStatus(vals.conditionStatus);
    setFilterProvinceId(vals.provinceId);
    setFilterUpdatedFrom(vals.updateDateRange?.[0] ? dayjs(vals.updateDateRange[0]).startOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setFilterUpdatedTo(vals.updateDateRange?.[1] ? dayjs(vals.updateDateRange[1]).endOf('day').format('YYYY-MM-DDTHH:mm:ss') : undefined);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setFilterKeyword('');
    setFilterOrgUnitId(undefined);
    setFilterOperatingOrgId(undefined);
    setFilterStationCode(undefined);
    setFilterConditionStatus(undefined);
    setFilterProvinceId(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setPage(1);
  };

  const resolveOrgUnitName = useCallback((orgUnitId?: string, orgUnitName?: string) => {
    if (orgUnitName && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(orgUnitName)) return orgUnitName;
    if (!orgUnitId) return '—';
    const match = orgUnits.find((u) => u.id === orgUnitId || u.code === orgUnitId);
    return match ? match.name : '—';
  }, [orgUnits]);

  const resolveOperatingOrgName = useCallback((opOrgId?: string, opOrgName?: string) => {
    if (opOrgName && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(opOrgName)) return opOrgName;
    if (!opOrgId) return '—';
    const found = DEFAULT_OPERATING_ORGANIZATIONS.find((o) => o.id === opOrgId || o.code === opOrgId);
    if (found) return found.name;
    const match = orgUnits.find((u) => u.id === opOrgId || u.code === opOrgId);
    return match ? match.name : '—';
  }, [orgUnits]);

  const sortOrderFor = useCallback((key: string): 'ascend' | 'descend' | null =>
    (sortField === key ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null), [sortField, sortDirection]);

  const serverSideSorter = () => 0;

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(order);
    setPage(1);
  }, []);

  const isRejectionTabActive = filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL1 || filterApprovalStatus === ApprovalStatus.REJECTED_LEVEL2;

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
      label: 'Tên / Mã đài TTXLTT',
      dataIndex: 'name',
      width: 280,
      fixed: 'left' as const,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
      render: (_: any, record: HanoiStationItem) => (
        <div style={{ lineHeight: '1.4' }}>
          <div
            style={{
              ...cellTitleStyle,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: fontSizeMd,
              fontWeight: fontWeightBold,
            }}
            title={record.name}
            onClick={() => handleDetail(record)}
          >
            {record.name}
          </div>
          <div
            style={{
              ...cellSubtitleStyle,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: fontSizeMd,
            }}
            title={record.code}
          >
            {record.code}
          </div>
        </div>
      ),
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 220,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('orgUnitName'),
      render: (val: string, record: HanoiStationItem) => {
        const name = resolveOrgUnitName(record.orgUnitId, val);
        return (
          <span
            style={{
              fontSize: fontSizeMd,
              fontWeight: fontWeightBold,
              color: '#0F172A',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={name}
          >
            {name}
          </span>
        );
      },
    },
    {
      key: 'operatingOrgName',
      label: 'Đơn vị khai thác',
      dataIndex: 'operatingOrgName',
      width: 200,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('operatingOrgName'),
      render: (val: string, record: HanoiStationItem) => {
        const name = resolveOperatingOrgName(record.operatingOrgId, val);
        return (
          <span
            style={{
              fontSize: fontSizeMd,
              color: textSecondary,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={name}
          >
            {name}
          </span>
        );
      },
    },
    {
      key: 'provinceId',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 180,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('provinceId'),
      render: (val: number, record: HanoiStationItem) => {
        const province = getProvinceNameById(val) || record.provinceName || '—';
        return (
          <span
            style={{
              fontSize: fontSizeMd,
              color: textSecondary,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={province}
          >
            {province}
          </span>
        );
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('conditionStatus'),
      render: (val: ConditionStatus | string) => {
        const color = CONDITION_COLOR[val as ConditionStatus] || getConditionStatusColor(val as string);
        const label = CONDITION_STATUS_MAP[val as ConditionStatus] || getConditionStatusLabel(val as string);
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
      width: 280,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('approvalStatus'),
      render: (val: ApprovalStatus | string) => <ApprovalStatusBadge status={val} />,
    },
    ...(isRejectionTabActive ? [{
      key: 'rejectionReason',
      label: 'Lý do từ chối',
      dataIndex: 'rejectionReason',
      width: 260,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('rejectionReason'),
      render: (val: string) => (
        <span
          style={{
            fontSize: fontSizeMd,
            color: textSecondary,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={val || ''}
        >
          {val || '—'}
        </span>
      ),
    }] : []),
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 220,
      align: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('updatedByName'),
      render: (_: any, record: HanoiStationItem) => {
        const isUuid = (value?: string | null) => !!value && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(value);
        const person = isUuid(record.updatedByName) ? '—' : (record.updatedByName || record.createdByName || '—');
        const time = (record.updatedAt || record.updatedDate || record.createdAt)
          ? dayjs(record.updatedAt || record.updatedDate || record.createdAt).format('DD/MM/YYYY HH:mm:ss')
          : '—';
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={person}
            >
              {person}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {time}
            </div>
          </div>
        );
      },
    },
  ], [page, pageSize, isRejectionTabActive, sortOrderFor, resolveOrgUnitName, resolveOperatingOrgName]);

  const rowActions = (record: HanoiStationItem) => {
    const uid = currentUser?.userId || currentUser?.id;
    const isCreator = Boolean(uid && (record.createdBy === uid || (record as any).userId === uid));
    const isApproverL1 = Boolean(uid && ((record as any).approverLevel1 === uid || (record as any).approverLevel1Name === currentUser?.fullName));
    const userUnitType = currentUser?.unitType || '';
    const isAdmin = (currentUser as any)?.role === 'SUPER_ADMIN' || (currentUser as any)?.role === 'ADMIN' || (currentUser as any)?.roleName === 'SUPER_ADMIN' || (currentUser as any)?.roleName === 'ADMIN';
    const isCucLevel = !userUnitType || userUnitType === 'CHUYEN_VIEN_CUC' || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CUC' || userUnitType === 'CUC_HANG_HAI' || isAdmin;

    const isApproverL1Perm = hasPerm('coastalstationhaiphong:approvec1') || hasPerm('specialstation:approvec1') || hasPerm('data:approvec1') || hasPerm('data:approve') || isAdmin;
    const isApproverL2Perm = hasPerm('coastalstationhaiphong:approvec2') || hasPerm('coastalstationhaiphong:approve') || hasPerm('specialstation:approvec2') || hasPerm('specialstation:approve') || hasPerm('data:approvec2') || hasPerm('data:approve') || isAdmin || isCucLevel;

    const canEdit = canEditApprovalRecord(record.approvalStatus, {
      hasPerm,
      resource: 'coastalstationhaiphong',
      extraUpdatePerms: ['specialstation:update', 'data:update'],
      extraApprovePerms: ['specialstation:approvec2', 'specialstation:approve', 'data:approvec2', 'data:approve'],
    }) || (record.approvalStatus === ApprovalStatus.APPROVED && (isApproverL2Perm || isAdmin));

    const canDelete = canDeleteApprovalRecord(record.approvalStatus, {
      hasPerm,
      resource: 'coastalstationhaiphong',
      extraDeletePerms: ['specialstation:delete', 'data:delete'],
    });
    const canSubmit = (record.approvalStatus === ApprovalStatus.DRAFT || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 || record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2) &&
      (hasPerm('coastalstationhaiphong:update') || hasPerm('specialstation:update') || hasPerm('data:update') || isAdmin);

    const canApproveL1 = record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && isApproverL1Perm && (!isCreator || isCucLevel || isAdmin);
    const canApproveL2 = (record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 || (record.approvalStatus as string) === 'CHO_PD_CAP_CUC') && isApproverL2Perm && (!isApproverL1 || isCucLevel || isAdmin);

    return [
      {
        key: 'detail',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => handleDetail(record),
      },
      ...(canEdit ? [{
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => handleEdit(record),
      }] : []),
      {
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => handleOpenHistory(record),
      },
      ...(canSubmit ? [{
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: icons.submit,
        onClick: () => handleSubmitForApproval(record),
      }] : []),
      ...(canApproveL1 ? [
        {
          key: 'approveL1',
          label: 'Phê duyệt cấp Cảng vụ',
          icon: icons.approve,
          onClick: () => {
            setApproveTargetId(record.id);
            setApproveLevel('c1');
            setApproveModalOpen(true);
          },
        },
        {
          key: 'rejectL1',
          label: 'Từ chối cấp Cảng vụ',
          icon: icons.reject,
          danger: true,
          onClick: () => {
            setRejectTargetId(record.id);
            setRejectReason('');
            setRejectModalOpen(true);
          },
        },
      ] : []),
      ...(canApproveL2 ? [
        {
          key: 'approveL2',
          label: 'Phê duyệt cấp Cục',
          icon: icons.approve,
          onClick: () => {
            setApproveTargetId(record.id);
            setApproveLevel('c2');
            setApproveModalOpen(true);
          },
        },
        {
          key: 'rejectL2',
          label: 'Từ chối cấp Cục',
          icon: icons.reject,
          danger: true,
          onClick: () => {
            setRejectTargetId(record.id);
            setRejectReason('');
            setRejectModalOpen(true);
          },
        },
      ] : []),
      ...(canDelete ? [{
        key: 'delete',
        label: 'Xóa',
        icon: icons.delete,
        danger: true,
        onClick: () => openDeleteModal(record),
      }] : []),
    ];
  };

  const handleApproveConfirm = async (content: string) => {
    if (!approveTargetId) return;
    try {
      if (approveLevel === 'c1') {
        await hanoiStationService.approveL1(approveTargetId, content);
        toast.success('Phê duyệt cấp Cảng vụ thành công');
      } else {
        await hanoiStationService.approveL2(approveTargetId, content);
        toast.success('Phê duyệt cấp Cục thành công');
      }
      setApproveModalOpen(false);
      statusCountFilterKey.current = null;
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi phê duyệt');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTargetId) return;
    if (!rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await hanoiStationService.reject(rejectTargetId, rejectReason.trim());
      toast.success('Từ chối phê duyệt thành công');
      setRejectModalOpen(false);
      statusCountFilterKey.current = null;
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi từ chối phê duyệt');
    }
  };

  return (
    <ThemeTokenProvider tokens={customTokens}>
      <div className="hanoi-station-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .hanoi-station-page-wrapper,
          .hanoi-station-page-wrapper .ant-table,
          .hanoi-station-page-wrapper .ant-table-cell,
          .hanoi-station-page-wrapper .ant-input,
          .hanoi-station-page-wrapper .ant-select,
          .hanoi-station-page-wrapper .ant-select-selection-item,
          .hanoi-station-page-wrapper .ant-select-selection-placeholder,
          .hanoi-station-page-wrapper .ant-picker,
          .hanoi-station-page-wrapper .ant-picker-input > input,
          .hanoi-station-page-wrapper .ant-btn,
          .hanoi-station-page-wrapper .ant-pagination,
          .hanoi-station-page-wrapper .ant-breadcrumb,
          .hanoi-station-page-wrapper .filter-label,
          .hanoi-drawer-scope,
          .hanoi-drawer-scope .ant-drawer-content,
          .hanoi-drawer-scope .ant-tabs-tab,
          .hanoi-drawer-scope .chk-detail-label,
          .hanoi-drawer-scope .chk-detail-value,
          .hanoi-drawer-scope .ant-table,
          .hanoi-drawer-scope .ant-table-cell,
          .hanoi-drawer-scope .ant-table-thead > tr > th,
          .hanoi-drawer-scope .ant-btn,
          .hanoi-drawer-scope .ant-select,
          .hanoi-drawer-scope .ant-input,
          .hanoi-drawer-scope .ant-form-item-label > label,
          .berth-drawer-scope,
          .berth-drawer-scope .ant-drawer-content,
          .berth-drawer-scope .ant-tabs-tab,
          .berth-drawer-scope .chk-detail-label,
          .berth-drawer-scope .chk-detail-value,
          .berth-drawer-scope .ant-table,
          .berth-drawer-scope .ant-table-cell,
          .berth-drawer-scope .ant-table-thead > tr > th,
          .berth-drawer-scope .ant-btn,
          .berth-drawer-scope .ant-select,
          .berth-drawer-scope .ant-input,
          .berth-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
          .hanoi-station-page-wrapper .screen-header {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          /* ── Responsive StatusTabs: Căn giữa khi đủ chỗ, thanh cuộn ngang khi tràn màn hình ── */
          .hanoi-station-page-wrapper div:has(> button[aria-pressed]) {
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
          .hanoi-station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .hanoi-station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .hanoi-station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .hanoi-station-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .hanoi-station-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }

          /* ── Responsive Drawers: Không tràn viền khi màn hình nhỏ / zoom cao ── */
          .hanoi-drawer-scope .ant-drawer-content-wrapper,
          .berth-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
          @media (max-width: 1024px) {
            .hanoi-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .hanoi-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
          }
          @media (max-width: 640px) {
            .hanoi-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
              padding: 8px 0 !important;
            }
            .hanoi-drawer-scope .chk-detail-label {
              width: 100% !important;
            }
            .hanoi-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Đài TTXLTT Hàng hải' },
          ]}
          actions={
            canCreate
              ? [{
                key: 'create',
                label: 'Thêm mới',
                variant: 'primary' as const,
                icon: icons.create,
                onClick: handleCreate,
              }]
              : []
          }
        />

        <FilterTableLayout
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed((value) => !value)}
          onFilterApply={() => handleFilterSearch(filterValues)}
          onFilterReset={() => {
            setFilterValues({});
            handleFilterReset();
          }}
          loading={loading}
          error={Boolean(error)}
          errorMessage={error || undefined}
          onRetry={fetchData}
          statusTabs={statusTabs}
          onStatusTabChange={handleTabChange}
          filterContent={
            <>
              {/* ── BỘ LỌC CƠ BẢN (LUÔN HIỂN THỊ) ── */}
              <div style={{ marginBottom: 12, marginTop: spaceMd }}>
                <div style={filterLabelStyle}>Đơn vị quản lý</div>
                <OrgUnitTreeSelect
                  organizations={orgUnits}
                  placeholder="Chọn đơn vị..."
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  value={filterValues.orgUnitId as string | undefined}
                  onChange={(value) => {
                    setFilterValues((prev) => ({ ...prev, orgUnitId: value }));
                  }}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={filterLabelStyle}>Tên đài TTXLTT Hàng hải</div>
                <Input
                  placeholder="Tìm theo tên đài TTXLTT Hàng hải"
                  allowClear
                  value={(filterValues.keyword as string) || ''}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, keyword: e.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={filterLabelStyle}>Tình trạng</div>
                <Select
                  placeholder="Chọn tình trạng"
                  allowClear
                  value={filterValues.conditionStatus as string | undefined}
                  onChange={(value) => setFilterValues((prev) => ({ ...prev, conditionStatus: value }))}
                  options={CONDITION_STATUS_OPTIONS}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>

              {/* ── BỘ LỌC NÂNG CAO (ẨN KHI COLLAPSED) ── */}
              {filterCollapsed && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Đơn vị khai thác</div>
                    <Select
                      value={filterValues.operatingOrgId as string | undefined}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, operatingOrgId: value }))}
                      options={DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({ label: o.name, value: o.id }))}
                      placeholder="Chọn đơn vị khai thác"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
                      }
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Mã đài TTXLTT Hàng hải</div>
                    <Input
                      placeholder="Tìm theo mã đài TTXLTT Hàng hải"
                      allowClear
                      value={(filterValues.stationCode as string) || ''}
                      onChange={(e) => setFilterValues((prev) => ({ ...prev, stationCode: e.target.value }))}
                      onPressEnter={() => handleFilterSearch(filterValues)}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Địa điểm (Tỉnh/Thành Phố)</div>
                    <Select
                      placeholder="Chọn tỉnh/thành phố"
                      allowClear
                      showSearch
                      value={filterValues.provinceId as number | undefined}
                      onChange={(value) => setFilterValues((prev) => ({ ...prev, provinceId: value }))}
                      options={VIETNAM_PROVINCE_OPTIONS}
                      filterOption={(input, option) =>
                        normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
                      }
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={filterLabelStyle}>Ngày cập nhật</div>
                    <DatePicker.RangePicker
                      value={filterValues.updateDateRange as any}
                      onChange={(dates) => setFilterValues((prev) => ({ ...prev, updateDateRange: dates }))}
                      {...getRangePickerProps()}
                      format="DD/MM/YYYY"
                      placeholder={['Từ ngày', 'Đến ngày']}
                      style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>
                </>
              )}
            </>
          }
        >
          <DataTable
            dataSource={data}
            columns={columns}
            loading={loading}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            rowActions={rowActions}
            onSort={handleSort}
            pagination={false}
          />
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </FilterTableLayout>

        {isModalOpen && (
          <HanoiStationForm
            open={isModalOpen}
            mode={modalMode}
            editId={editingId}
            initialData={selectedRecord}
            orgUnits={orgUnits}
            symbols={symbols}
            onCancel={() => setIsModalOpen(false)}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              setIsModalOpen(false);
              statusCountFilterKey.current = null;
              fetchData();
            }}
          />
        )}

        <ApprovalModal
          open={approveModalOpen}
          level={approveLevel}
          onConfirm={handleApproveConfirm}
          onCancel={() => setApproveModalOpen(false)}
        />

        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ExclamationCircleOutlined style={{ color: statusCritical }} />
              <span>Từ chối phê duyệt Đài TTXLTT Hàng hải</span>
            </div>
          }
          open={rejectModalOpen}
          onOk={handleRejectConfirm}
          onCancel={() => setRejectModalOpen(false)}
          okText="Xác nhận từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true, style: { borderRadius: radiusPill } }}
          cancelButtonProps={{ style: { borderRadius: radiusPill } }}
        >
          <div style={{ marginTop: 16 }}>
            <span style={{ display: 'block', marginBottom: 8, fontWeight: fontWeightBold }}>
              Lý do từ chối <span style={{ color: statusCritical }}>*</span>
            </span>
            <Input.TextArea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối"
              style={textAreaStyle}
              maxLength={1000}
              showCount
            />
          </div>
        </Modal>

        <CommonHistoryDrawer
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          entityName={selectedRecord?.name || selectedRecord?.code || 'Đài TTXLTT Hàng hải'}
          records={historyRecords}
          loading={loadingHistory}
          serverFiltered
          onFilterChange={(filters) => handleHistorySearch(filters)}
          onLoadMore={handleLoadMoreHistory}
          loadingMore={loadingMoreHistory}
          variant="berth"
        />

        {/* ── Delete Confirmation Modal (Chuẩn Bến cảng) ────────────── */}
        <DeleteConfirmModal
          open={deleteModalOpen}
          onCancel={() => {
            if (!deleteLoading) {
              setDeleteModalOpen(false);
              setDeletingRecord(null);
            }
          }}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
          itemType="Đài TTXLTT Hàng hải"
          itemName={deletingRecord?.name}
          itemCode={deletingRecord?.code}
        />
      </div>
    </ThemeTokenProvider>
  );
}
