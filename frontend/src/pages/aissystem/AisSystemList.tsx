import { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal, Input, Select, DatePicker } from 'antd';
import { aisSystemService } from '../../services/aisSystemService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { vtsOperationCenterService } from '../../services/vtsOperationCenterService';
import { radarStationService } from '../../services/radarStationService';
import { organizationService } from '../../services/organizationService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import type { AisSystemListItem, AisSystemResponse } from '../../types/aisSystem';
import { UNIT_OF_MEASURE_MAP, UnitOfMeasure } from '../../types/aisSystem';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_MAP, CONDITION_STATUS_OPTIONS } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, DataTable, Pagination } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import AisSystemForm from './AisSystemForm';
import ApprovalModal from '../../components/shared/ApprovalModal';
import CommonHistoryDrawer from '../../components/shared/CommonHistoryDrawer';
import toast from '../../components/ToastNotification';
import {
  actionPrimary, textSecondary,
  fontWeightBold, fontWeightMedium,
  spaceMd, spaceFormField,
  statusOperational, statusCritical, statusAttention,
  selectStyle, statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle, textAreaStyle,
  getRangePickerProps, getSidebarDatePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds, type OrgUnitTreeOption } from '../../components/org-unit';
import SidebarFilterField from '../../components/list-view/SidebarFilterField';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';

const CONDITION_COLOR: Record<ConditionStatus, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

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
  // Sắp xếp chạy ở server để áp dụng cho toàn bộ kết quả; nếu để antd tự sắp thì
  // chỉ 20 dòng của trang hiện tại được sắp, gây hiểu nhầm là đã sắp cả danh sách.
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>(undefined);
  const [filterValues, setFilterValues] = useState<{
    keyword?: string;
    orgUnitId?: string;
    vtsOperationCenterId?: string;
    operatingOrgId?: string;
    provinceId?: number;
    commissioningYear?: number;
    conditionStatus?: ConditionStatus;
    updateDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  }>({});
  const [appliedFilterValues, setAppliedFilterValues] = useState<typeof filterValues>({});

  const [orgUnitOptions, setOrgUnitOptions] = useState<OrgUnitTreeOption[]>([]);
  const [operatingOrganizations, setOperatingOrganizations] = useState<any[]>(DEFAULT_OPERATING_ORGANIZATIONS);
  const [opCenters, setOpCenters] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);
  const [radarStations, setRadarStations] = useState<{ id: string; name: string; orgUnitId?: string }[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AisSystemResponse | null>(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c1');
  const [actionTargetRecord, setActionTargetRecord] = useState<AisSystemListItem | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadReferenceData = useCallback(async () => {
    try {
      const [orgRes, opRes, radarRes, operatingRes] = await Promise.allSettled([
        organizationService.getAll(),
        vtsOperationCenterService.getOptions(),
        radarStationService.getOptions(),
        vtsSystemCRUD.getOperatingOrganizationOptions(),
      ]);

      if (orgRes.status === 'fulfilled' && Array.isArray(orgRes.value)) {
        setOrgUnitOptions(orgRes.value);
      }
      if (opRes.status === 'fulfilled' && Array.isArray(opRes.value)) {
        setOpCenters(opRes.value.map((item: any) => ({
          id: item.id,
          name: item.name,
          orgUnitId: item.orgUnitId || item.managementUnitId || item.operatingUnitId,
        })));
      }
      if (radarRes.status === 'fulfilled' && Array.isArray(radarRes.value)) {
        setRadarStations(radarRes.value.map((item: any) => ({
          id: item.id,
          name: item.name,
          orgUnitId: item.orgUnitId || item.managementUnitId || item.operatingUnitId,
        })));
      }
      if (operatingRes.status === 'fulfilled' && Array.isArray(operatingRes.value)) {
        setOperatingOrganizations(operatingRes.value);
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const operatingUnitOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [];

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    setErrorMessage('');
    try {
      let filterOpCenterId: string | undefined = undefined;
      let filterRadarStationId: string | undefined = undefined;
      if (appliedFilterValues.vtsOperationCenterId) {
        if (appliedFilterValues.vtsOperationCenterId.startsWith('op_')) {
          filterOpCenterId = appliedFilterValues.vtsOperationCenterId.replace('op_', '');
        } else if (appliedFilterValues.vtsOperationCenterId.startsWith('radar_')) {
          filterRadarStationId = appliedFilterValues.vtsOperationCenterId.replace('radar_', '');
        } else {
          filterOpCenterId = appliedFilterValues.vtsOperationCenterId;
        }
      }
      let updatedFrom: string | undefined = undefined;
      let updatedTo: string | undefined = undefined;
      // Backend nhận LocalDateTime và BỎ QUA offset, nên `toISOString()` (giờ UTC)
      // làm cửa sổ lọc lệch đúng bằng chênh lệch múi giờ (VN: -7h): hồ sơ cập nhật
      // sau 17h bị đẩy nhầm sang ngày hôm sau. Gửi thẳng giờ địa phương.
      if (appliedFilterValues.updateDateRange && appliedFilterValues.updateDateRange[0]) {
        updatedFrom = appliedFilterValues.updateDateRange[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss');
      }
      if (appliedFilterValues.updateDateRange && appliedFilterValues.updateDateRange[1]) {
        updatedTo = appliedFilterValues.updateDateRange[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss');
      }

      const res = await aisSystemService.search({
        keyword: appliedFilterValues.keyword?.trim() || undefined,
        orgUnitId: appliedFilterValues.orgUnitId || undefined,
        vtsOperationCenterId: filterOpCenterId,
        radarStationId: filterRadarStationId,
        operatingOrgId: appliedFilterValues.operatingOrgId || undefined,
        provinceId: appliedFilterValues.provinceId,
        commissioningYear: appliedFilterValues.commissioningYear,
        conditionStatus: appliedFilterValues.conditionStatus ? (Number(appliedFilterValues.conditionStatus) as any) : undefined,
        approvalStatus: filterApprovalStatus,
        updatedFrom,
        updatedTo,
        page,
        size: pageSize,
        sortBy: sortField,
        sortDir: sortField ? sortDirection.toUpperCase() : undefined,
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
  }, [page, pageSize, appliedFilterValues, filterApprovalStatus, sortField, sortDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(order);
    setPage(1);
  }, []);

  const sortOrderFor = (key: string): 'ascend' | 'descend' | null =>
    (sortField === key ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null);

  // Bộ so sánh trung tính: thứ tự do server quyết định, hàm này chỉ để antd hiện
  // biểu tượng sắp xếp mà không tự sắp lại 20 dòng của trang hiện tại.
  const serverSideSorter = () => 0;

  const refreshList = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const countDraft = statusCounts['DRAFT'] || 0;
  const countPendingApproval = (statusCounts['PENDING_APPROVAL'] || 0) + (statusCounts['PROPOSED'] || 0);
  const countApprovedLevel1 = statusCounts['APPROVED_LEVEL1'] || 0;
  const countApproved = (statusCounts['APPROVED'] || 0) + (statusCounts['APPROVED_LEVEL2'] || 0);
  const countRejected = (statusCounts['REJECTED'] || 0) + (statusCounts['REJECTED_LEVEL1'] || 0) + (statusCounts['REJECTED_LEVEL2'] || 0);
  const countAll = countDraft + countPendingApproval + countApprovedLevel1 + countApproved + countRejected;

  const statusTabs = useMemo(() => [
    { key: 'ALL', label: 'Tất cả', count: countAll, color: actionPrimary, active: !filterApprovalStatus },
    { key: ApprovalStatus.DRAFT, label: 'Lưu tạm', count: countDraft, color: '#93A3B3', active: filterApprovalStatus === ApprovalStatus.DRAFT },
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
    setAppliedFilterValues(vals);
  };

  const handleFilterReset = () => {
    setPage(1);
    setFilterValues({});
    setAppliedFilterValues({});
    setFilterApprovalStatus(undefined);
  };

  const handleViewHistory = async (record: AisSystemListItem) => {
    setSelectedRecord(record as any);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const records = await aisSystemService.getHistory(record.id);
      setHistoryRecords(records || []);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
    }
  };

  const confirmDelete = (record: AisSystemListItem) => {
    Modal.confirm({
      title: 'Xác nhận xóa hệ thống AIS',
      icon: <span style={{ color: statusCritical, fontSize: 22, marginRight: 8 }}>⚠</span>,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa hệ thống AIS <strong>{record.name}</strong> ({record.code})?</p>
          <p style={{ color: textSecondary, fontSize: '14px' }}>Hành động này không thể hoàn tác.</p>
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
    // approval-2-level-spec §3.4 (quy tắc 5): lý do từ chối tối thiểu 10 ký tự.
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      toast.warning('Lý do từ chối phải có ít nhất 10 ký tự');
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
      label: 'Tên / Mã thiết bị',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
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
      width: 200,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('orgUnitName'),
      render: (v: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v || '—'}>
          {v || '—'}
        </div>
      ),
    },
    {
      key: 'vtsOperationCenterName',
      label: 'Thuộc TTDH VTS / Trạm Radar',
      dataIndex: 'vtsOperationCenterName',
      width: 220,
      ellipsis: false,
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
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('operatingOrgName'),
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
      sortable: true,
      sorter: serverSideSorter,
      // DataTable lấy khóa sắp xếp từ `dataIndex` nên cột này gửi lên `provinceId`.
      sortOrder: sortOrderFor('provinceId'),
      render: (_: any, r: AisSystemListItem) => {
        const val = r.provinceName || getProvinceNameById(r.provinceId) || '—';
        return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>{val}</div>;
      },
    },
    {
      key: 'unitOfMeasure',
      label: 'Đơn vị tính',
      dataIndex: 'unitOfMeasure',
      width: 130,
      align: 'center' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('unitOfMeasure'),
      render: (v: string) => {
        const label = UNIT_OF_MEASURE_MAP[v as unknown as UnitOfMeasure] || v || '—';
        return <span style={{ fontWeight: fontWeightMedium }}>{label}</span>;
      },
    },
    {
      key: 'quantity',
      label: 'Số lượng',
      dataIndex: 'quantity',
      width: 110,
      align: 'center' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('quantity'),
      render: (v: number) => <span style={{ fontWeight: fontWeightBold }}>{v ?? 1}</span>,
    },
    {
      key: 'commissioningYear',
      label: 'Năm đưa vào sử dụng',
      dataIndex: 'commissioningYear',
      width: 170,
      align: 'center' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('commissioningYear'),
      render: (v: number) => <span>{v || '—'}</span>,
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      align: 'center' as const,
      ellipsis: false,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('conditionStatus'),
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
  ], [page, pageSize, operatingUnitOptions, sortField, sortDirection]);

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

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#F8FAFC' }}>
        <ScreenHeader
          breadcrumb={[
            { label: 'Tài sản KCHTGT' },
            { label: 'Hệ thống trạm bờ AIS' },
          ]}
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
          hideFilterToggle={true}
          onFilterApply={() => handleFilterSearch(filterValues)}
          onFilterReset={handleFilterReset}
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
                  placeholder="Tất cả đơn vị"
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

              <SidebarFilterField label="Thuộc TTDH VTS / Trạm Radar">
                <Select
                  placeholder="Tất cả TTDH / Trạm Radar"
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

              <SidebarFilterField label="Tìm kiếm">
                <Input
                  placeholder="Tìm theo mã, tên thiết bị"
                  allowClear
                  value={filterValues.keyword}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, keyword: e.target.value }))}
                  onPressEnter={() => handleFilterSearch(filterValues)}
                  style={inputStyle}
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

              <SidebarFilterField label="Năm đưa vào sử dụng">
                <DatePicker
                  {...getSidebarDatePickerProps({
                    picker: 'year',
                    format: 'YYYY',
                    placeholder: 'Tất cả năm',
                    value: filterValues.commissioningYear ? dayjs(String(filterValues.commissioningYear), 'YYYY') : null,
                    onChange: (date: any) => setFilterValues((prev) => ({ ...prev, commissioningYear: date ? date.year() : undefined })),
                  })}
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
            </>
          }
        >
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            rowActions={rowActions}
            loading={loading}
            onSort={handleSort}
            scroll={{ x: 'max-content' }}
          />
          <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
        </FilterTableLayout>

        {isModalOpen && (
          <AisSystemForm
            open={true}
            editId={editingId}
            initialData={selectedRecord}
            mode={modalMode}
            orgUnits={orgUnitOptions}
            opCenterOptions={opCenters}
            radarStationOptions={radarStations}
            operatingOrganizationOptions={operatingOrganizations}
            onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
            onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); refreshList(); }}
          />
        )}

        <CommonHistoryDrawer
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          entityName={selectedRecord?.name || (selectedRecord as any)?.code || 'Hệ thống AIS'}
          records={historyRecords}
          loading={loadingHistory}
        />

        <ApprovalModal
          visible={approveModalOpen}
          level={approveLevel}
          onConfirm={handleApprove}
          onCancel={() => setApproveModalOpen(false)}
        />

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
            placeholder="Nhập lý do từ chối"
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
