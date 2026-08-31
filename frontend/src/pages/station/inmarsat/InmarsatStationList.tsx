import { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal, Input, Drawer, Select, DatePicker } from 'antd';
import { inmarsatStationService } from '../../../services/inmarsatStationService';
import { organizationService } from '../../../services/organizationService';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import type { CoastalStationInmarsatResponse, CoastalStationInmarsatHistoryResponse } from '../../../services/station/types';
import { ConditionStatus, CONDITION_STATUS_MAP, CONDITION_STATUS_OPTIONS } from '../../../types/vtsSystem';
import { useAuthStore } from '../../../store/authStore';
import { usePermissionStore } from '../../../store/permissionStore';
import { ScreenHeader, DataTable } from '../../../components/list-view';
import FilterTableLayout from '../../../components/list-view/FilterTableLayout';
import Pagination from '../../../components/list-view/Pagination';
import InmarsatStationForm from './InmarsatStationForm';
import ApprovalModal from '../../../components/shared/ApprovalModal';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';
import toast from '../../../components/ToastNotification';
import {
  actionPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusPill, spaceMd, sidebarBg,
  statusOperational, statusCritical, statusAttention, statusDraft,
  drawerTitleStyle, selectStyle,
  borderDefault, statusBadgeStyle, icons, cellTitleStyle, cellSubtitleStyle,
  inputStyle, clientSideStringSorter,
  clientSideProvinceSorter, clientSideBadgeSorter,
  getRangePickerProps,
} from '../../../themetokenchk';
import * as themeTokenChk from '../../../themetokenchk';
import { ThemeTokenProvider } from '../../../context/ThemeTokenContext';
import dayjs from 'dayjs';
import { getProvinceNameById, VIETNAM_PROVINCE_OPTIONS } from '../../../types/common';
import { OrgUnitTreeSelect, normalizeSearchText, resolveOrgSubtreeIds } from '../../../components/org-unit';
import SidebarFilterField from '../../../components/list-view/SidebarFilterField';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../../utils/approvalEditPolicy';
import LoadingSkeleton from '../../../components/LoadingSkeleton';

const CONDITION_COLOR: Record<ConditionStatus, string> = {
  [ConditionStatus.OPERATIONAL]: statusOperational,
  [ConditionStatus.STOPPED]: statusCritical,
  [ConditionStatus.MAINTENANCE]: statusAttention,
  [ConditionStatus.UNDER_CONSTRUCTION]: actionPrimary,
};

export const InmarsatStationList = () => {
  const [data, setData] = useState<CoastalStationInmarsatResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filters
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filterCollapsed, setFilterCollapsed] = useState<boolean>(false);
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterOperatingOrgId, setFilterOperatingOrgId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<number | undefined>();
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Reference data
  const [orgUnits, setOrgUnits] = useState<any[]>([]);

  // Drawer / Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [selectedRecord, setSelectedRecord] = useState<CoastalStationInmarsatResponse | null>(null);

  // Approval modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLevel, setApproveLevel] = useState<'c1' | 'c2'>('c2');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [targetRecord, setTargetRecord] = useState<CoastalStationInmarsatResponse | null>(null);

  // History modal
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState<CoastalStationInmarsatHistoryResponse[]>([]);

  // Permissions & user
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  const userOrgId = user?.orgUnitId ? String(user.orgUnitId) : undefined;
  const userUnitType = user?.unitType || '';

  const canCreate = hasPermission('coastalstationinmarsat:create') || hasPermission('specialstation:create') || hasPermission('data:create') || hasPermission('admin:all');
  const canUpdate = hasPermission('coastalstationinmarsat:update') || hasPermission('specialstation:update') || hasPermission('data:update') || hasPermission('admin:all');
  const isCucLevel = !userUnitType || userUnitType === 'CHUYEN_VIEN_CUC' || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CUC' || userUnitType === 'CUC_HANG_HAI' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isCangVuLevel = userUnitType === 'CVHH' || userUnitType === 'CANG_VU';
  const canApproveL1 = (hasPermission('coastalstationinmarsat:approvec1') || hasPermission('coastalstationinmarsat:approve') || hasPermission('specialstation:approve') || hasPermission('admin:all')) && (isCangVuLevel || !isCucLevel);
  const canApproveL2 = (hasPermission('coastalstationinmarsat:approvec2') || hasPermission('coastalstationinmarsat:approve') || hasPermission('specialstation:approvec2') || hasPermission('specialstation:approve') || hasPermission('admin:all')) && isCucLevel;

  // Load organizations
  useEffect(() => {
    organizationService.getAll()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        setOrgUnits(list);
      })
      .catch(() => setOrgUnits([]));
  }, []);

  // Filter org units based on data scope
  const filteredOrgUnits = useMemo(() => {
    if (!userOrgId || userUnitType === 'LANH_DAO_CUC' || userUnitType === 'CHUYEN_VIEN_CUC') {
      return orgUnits;
    }
    const allowed = new Set(resolveOrgSubtreeIds(orgUnits, userOrgId));
    return orgUnits.filter((u) => allowed.has(String(u.id)));
  }, [orgUnits, userOrgId, userUnitType]);

  // Fetch list
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let approvalStatusParam: string | undefined = undefined;
      if (activeTab === 'draft') approvalStatusParam = 'DRAFT';
      else if (activeTab === 'proposed') approvalStatusParam = 'PROPOSED';
      else if (activeTab === 'approved_level1') approvalStatusParam = 'APPROVED_LEVEL1';
      else if (activeTab === 'approved_level2') approvalStatusParam = 'APPROVED_LEVEL2';
      else if (activeTab === 'rejected') approvalStatusParam = 'REJECTED';

      const res = await inmarsatStationService.search({
        keyword: filterKeyword?.trim() || undefined,
        orgUnitId: filterOrgUnitId,
        operatingOrgId: filterOperatingOrgId,
        provinceId: filterProvinceId,
        conditionStatus: filterConditionStatus,
        approvalStatus: approvalStatusParam,
        updatedFrom: filterDateRange?.[0] ? filterDateRange[0].startOf('day').toISOString() : undefined,
        updatedTo: filterDateRange?.[1] ? filterDateRange[1].endOf('day').toISOString() : undefined,
        page,
        size: pageSize,
      });

      setData(res.items);
      setTotal(res.total);
      setStatusCounts(res.statusCounts || {});
    } catch {
      setData([]);
      setTotal(0);
      toast.error('Không thể tải danh sách Đài vệ tinh Inmarsat');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterKeyword, filterOrgUnitId, filterOperatingOrgId, filterProvinceId, filterConditionStatus, filterDateRange, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle open modals
  const handleOpenCreate = () => {
    setSelectedRecord(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleOpenEdit = (rec: CoastalStationInmarsatResponse) => {
    setSelectedRecord(rec);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleOpenDetail = (rec: CoastalStationInmarsatResponse) => {
    setSelectedRecord(rec);
    setFormMode('detail');
    setFormOpen(true);
  };

  const handleDelete = (rec: CoastalStationInmarsatResponse) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa Đài Inmarsat "${rec.name || rec.stationName || rec.code}" không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, style: { borderRadius: radiusPill, height: 36 } },
      cancelButtonProps: { style: { borderRadius: radiusPill, height: 36 } },
      onOk: async () => {
        try {
          await inmarsatStationService.delete(rec.id);
          toast.success('Xóa đài Inmarsat thành công');
          fetchData();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Không thể xóa đài Inmarsat');
        }
      },
    });
  };

  const handleSubmit = async (rec: CoastalStationInmarsatResponse) => {
    try {
      await inmarsatStationService.submit(rec.id);
      toast.success('Gửi phê duyệt thành công');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Lỗi gửi phê duyệt');
    }
  };

  const handleOpenApprove = (rec: CoastalStationInmarsatResponse, level: 'c1' | 'c2') => {
    setTargetRecord(rec);
    setApproveLevel(level);
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!targetRecord) return;
    try {
      setApprovalLoading(true);
      if (approveLevel === 'c2') {
        await inmarsatStationService.approveL2(targetRecord.id);
      } else {
        await inmarsatStationService.approveL1(targetRecord.id);
      }
      toast.success('Phê duyệt thành công');
      setApproveModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Phê duyệt thất bại');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleOpenReject = (rec: CoastalStationInmarsatResponse) => {
    setTargetRecord(rec);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!targetRecord) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      setApprovalLoading(true);
      await inmarsatStationService.reject(targetRecord.id, rejectReason.trim());
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Từ chối thất bại');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleOpenHistory = async (rec: CoastalStationInmarsatResponse) => {
    setSelectedRecord(rec);
    setHistoryDrawerOpen(true);
    setHistoryLoading(true);
    try {
      const logs = await inmarsatStationService.getHistory(rec.id);
      setHistoryList(logs);
    } catch {
      setHistoryList([]);
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Status tabs definition
  const totalDraft = Number(statusCounts?.draft ?? statusCounts?.DRAFT ?? 0);
  const totalProposed = Number(statusCounts?.proposed ?? statusCounts?.PROPOSED ?? statusCounts?.pending ?? 0);
  const totalApprovedL1 = Number(statusCounts?.approved_level1 ?? statusCounts?.APPROVED_LEVEL1 ?? 0);
  const totalApprovedL2 = Number(statusCounts?.approved_level2 ?? statusCounts?.APPROVED_LEVEL2 ?? statusCounts?.approved ?? 0);
  const totalRejected = Number(statusCounts?.rejected ?? statusCounts?.REJECTED ?? 0);
  const totalAll = totalDraft + totalProposed + totalApprovedL1 + totalApprovedL2 + totalRejected;

  const statusTabs = [
    { key: 'all', label: 'Tất cả', count: totalAll || total, color: actionPrimary },
    { key: 'draft', label: 'Lưu tạm', count: totalDraft, color: statusDraft },
    { key: 'proposed', label: 'Chờ Cảng vụ duyệt', count: totalProposed, color: statusAttention },
    { key: 'approved_level1', label: 'Chờ Cục duyệt', count: totalApprovedL1, color: actionPrimary },
    { key: 'approved_level2', label: 'Đã duyệt', count: totalApprovedL2, color: statusOperational },
    { key: 'rejected', label: 'Từ chối', count: totalRejected, color: statusCritical },
  ];

  // Table columns definition
  const columns = [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>
          {(page - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Tên/Mã đài Inmarsat',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sorter: clientSideStringSorter('name', 'code'),
      render: (_: any, record: CoastalStationInmarsatResponse) => {
        const title = record.name || record.stationName || '—';
        const sub = record.code || record.deviceCode || '—';
        return (
          <div
            style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onClick={() => handleOpenDetail(record)}
          >
            <div style={cellTitleStyle} title={title}>{title}</div>
            <div style={cellSubtitleStyle} title={sub}>{sub}</div>
          </div>
        );
      },
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 200,
      sorter: clientSideStringSorter('orgUnitName'),
      render: (val: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          {val || '—'}
        </div>
      ),
    },
    {
      key: 'operatingOrgName',
      label: 'Đơn vị khai thác',
      dataIndex: 'operatingOrgName',
      width: 180,
      sorter: clientSideStringSorter('operatingOrgName'),
      render: (val: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          {val || '—'}
        </div>
      ),
    },
    {
      key: 'provinceId',
      label: 'Địa điểm (Tỉnh/TP)',
      dataIndex: 'provinceId',
      width: 160,
      sorter: clientSideProvinceSorter('provinceId'),
      render: (pId: number) => {
        const pName = getProvinceNameById(pId);
        return (
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pName}>
            {pName || '—'}
          </span>
        );
      },
    },
    {
      key: 'conditionStatus',
      label: 'Tình trạng',
      dataIndex: 'conditionStatus',
      width: 160,
      sorter: clientSideBadgeSorter('conditionStatus', CONDITION_STATUS_MAP),
      render: (st: string) => {
        const enumKey = (st || ConditionStatus.OPERATIONAL) as ConditionStatus;
        const color = CONDITION_COLOR[enumKey] || statusOperational;
        const label = CONDITION_STATUS_MAP[enumKey] || st || 'Đang hoạt động';
        return (
          <span
            style={{
              ...statusBadgeStyle(color),
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: radiusPill,
              fontWeight: fontWeightMedium,
              fontSize: fontSizeMd,
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: 'approvalStatus',
      label: 'Trạng thái phê duyệt',
      dataIndex: 'approvalStatus',
      width: 180,
      sorter: clientSideBadgeSorter('approvalStatus'),
      render: (st: string) => <ApprovalStatusBadge status={st} />,
    },
    {
      key: 'updatedByName',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 220,
      sorter: (a: any, b: any) => (a.updatedAt ? new Date(a.updatedAt).getTime() : 0) - (b.updatedAt ? new Date(b.updatedAt).getTime() : 0),
      render: (val: string, record: CoastalStationInmarsatResponse) => {
        const name = val || (record as any).createdByName || '—';
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
            <div style={{ fontSize: fontSizeSm, color: textTertiary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        {/* Header */}
        <ScreenHeader
          breadcrumb={[
            { label: 'Đài duyên hải & Vệ tinh' },
            { label: 'Đài vệ tinh Inmarsat' },
          ]}
          actions={
            canCreate
              ? [{
                key: 'create',
                label: 'Thêm đài Inmarsat',
                variant: 'primary' as const,
                icon: icons.create,
                onClick: handleOpenCreate,
              }]
              : []
          }
        />

        {/* Main List Layout */}
        <FilterTableLayout
          statusTabs={statusTabs}
          onStatusTabChange={(k) => { setActiveTab(k); setPage(1); }}
          onFilterReset={() => {
            setFilterOrgUnitId(undefined);
            setFilterKeyword('');
            setFilterOperatingOrgId(undefined);
            setFilterProvinceId(undefined);
            setFilterConditionStatus(undefined);
            setFilterDateRange(null);
            setActiveTab('all');
            setPage(1);
          }}
          onFilterApply={() => { setPage(1); fetchData(); }}
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
          loading={loading}
          filterContent={
            <>
              {/* ── BỘ LỌC CƠ BẢN ── */}
              <SidebarFilterField label="Đơn vị quản lý" style={{ marginTop: spaceMd }}>
                <OrgUnitTreeSelect
                  organizations={filteredOrgUnits}
                  placeholder="Tất cả"
                  allowClear
                  treeDefaultExpandAll={true}
                  listHeight={256}
                  value={filterOrgUnitId}
                  onChange={(val) => {
                    setFilterOrgUnitId(val);
                    setFilterOperatingOrgId(undefined);
                  }}
                  style={{ ...selectStyle, width: '100%' }}
                />
              </SidebarFilterField>

              <SidebarFilterField label="Tìm kiếm">
                <Input
                  placeholder="Tìm kiếm"
                  allowClear
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  onPressEnter={() => { setPage(1); fetchData(); }}
                  prefix={icons.search}
                  style={inputStyle}
                />
              </SidebarFilterField>

              {/* ── BỘ LỌC NÂNG CAO (KHI MỞ RỘNG) ── */}
              {filterCollapsed && (
                <>
                  <SidebarFilterField label="Tình trạng">
                    <Select
                      placeholder="Tất cả tình trạng"
                      allowClear
                      value={filterConditionStatus}
                      onChange={(val) => setFilterConditionStatus(val)}
                      options={CONDITION_STATUS_OPTIONS}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Khoảng ngày cập nhật">
                    <DatePicker.RangePicker
                      {...getRangePickerProps({
                        value: filterDateRange,
                        onChange: (dates: any) => { setFilterDateRange(dates); setPage(1); },
                      })}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Địa điểm (Tỉnh/Thành phố)">
                    <Select
                      placeholder="Tất cả tỉnh thành"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                      }
                      value={filterProvinceId}
                      onChange={(val) => setFilterProvinceId(val)}
                      options={VIETNAM_PROVINCE_OPTIONS}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </SidebarFilterField>

                  <SidebarFilterField label="Đơn vị khai thác">
                    <Select
                      placeholder="Tất cả đơn vị khai thác"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                      }
                      value={filterOperatingOrgId}
                      onChange={(val) => setFilterOperatingOrgId(val)}
                      options={DEFAULT_OPERATING_ORGANIZATIONS.map((o) => ({ value: o.id, label: o.name }))}
                      style={{ ...selectStyle, width: '100%' }}
                    />
                  </SidebarFilterField>
                </>
              )}
            </>
          }
        >
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <DataTable<CoastalStationInmarsatResponse>
                dataSource={data}
                columns={columns}
                rowKey="id"
                scroll={{ x: 'max-content' }}
                emptyText="Không có dữ liệu Đài Inmarsat"
                rowActions={(rec) => {
                  const isPendingL1 = rec.approvalStatus === 'PROPOSED' || rec.approvalStatus === 'PENDING' || rec.approvalStatus === 'PENDING_APPROVAL';
                  const isPendingL2 = rec.approvalStatus === 'APPROVED_LEVEL1';
                  const isDraftOrRejected = rec.approvalStatus === 'DRAFT' || rec.approvalStatus === 'REJECTED' || rec.approvalStatus === 'REJECTED_LEVEL1' || rec.approvalStatus === 'REJECTED_LEVEL2';

                  const canEditThis = canEditApprovalRecord(rec.approvalStatus, {
                    hasPerm: hasPermission,
                    resource: 'coastalstationinmarsat',
                    extraUpdatePerms: ['specialstation:update', 'data:update', 'admin:all'],
                    extraApprovePerms: ['specialstation:approvec2', 'specialstation:approve', 'admin:all'],
                  });

                  const canDeleteThis = canDeleteApprovalRecord(rec.approvalStatus, {
                    hasPerm: hasPermission,
                    resource: 'coastalstationinmarsat',
                    extraDeletePerms: ['specialstation:delete', 'data:delete', 'admin:all'],
                  });

                  return [
                    {
                      key: 'view',
                      label: 'Xem chi tiết',
                      icon: icons.view,
                      onClick: () => handleOpenDetail(rec),
                    },
                    {
                      key: 'history',
                      label: 'Lịch sử',
                      icon: icons.history,
                      onClick: () => handleOpenHistory(rec),
                    },
                    ...(canEditThis ? [{
                      key: 'edit',
                      label: 'Chỉnh sửa',
                      icon: icons.edit,
                      onClick: () => handleOpenEdit(rec),
                    }] : []),
                    ...(isDraftOrRejected && canCreate ? [{
                      key: 'submit',
                      label: 'Gửi phê duyệt',
                      icon: icons.submit,
                      onClick: () => handleSubmit(rec),
                    }] : []),
                    ...(isPendingL1 && canApproveL1 ? [
                      {
                        key: 'approveL1',
                        label: 'Phê duyệt cấp Cảng vụ/Chi cục',
                        icon: icons.approve,
                        onClick: () => handleOpenApprove(rec, 'c1'),
                      },
                      {
                        key: 'rejectL1',
                        label: 'Từ chối cấp Cảng vụ/Chi cục',
                        icon: icons.reject,
                        danger: true,
                        onClick: () => handleOpenReject(rec),
                      },
                    ] : []),
                    ...(isPendingL2 && canApproveL2 ? [
                      {
                        key: 'approveL2',
                        label: 'Phê duyệt cấp Cục',
                        icon: icons.approve,
                        onClick: () => handleOpenApprove(rec, 'c2'),
                      },
                      {
                        key: 'rejectL2',
                        label: 'Từ chối cấp Cục',
                        icon: icons.reject,
                        danger: true,
                        onClick: () => handleOpenReject(rec),
                      },
                    ] : []),
                    ...(canDeleteThis ? [{
                      key: 'delete',
                      label: 'Xóa bỏ',
                      icon: icons.delete,
                      danger: true,
                      onClick: () => handleDelete(rec),
                    }] : []),
                  ];
                }}
              />
              <Pagination
                total={total}
                current={page}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50]}
                onChange={(p, sz) => { setPage(p); setPageSize(sz); }}
              />
            </>
          )}
        </FilterTableLayout>

        {/* Unified Drawer Form */}
        {formOpen && (
          <InmarsatStationForm
            open={formOpen}
            mode={formMode}
            editId={selectedRecord?.id}
            initialData={selectedRecord}
            orgUnits={orgUnits}
            onClose={() => setFormOpen(false)}
            onSuccess={() => { setFormOpen(false); fetchData(); }}
            onEdit={(rec) => { setSelectedRecord(rec); setFormMode('edit'); }}
          />
        )}

        {/* Approval Modal */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approveLevel}
          loading={approvalLoading}
          onConfirm={handleConfirmApprove}
          onCancel={() => setApproveModalOpen(false)}
        />

        {/* Reject Modal */}
        <Modal
          title={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
          open={rejectModalOpen}
          onCancel={() => setRejectModalOpen(false)}
          onOk={handleConfirmReject}
          okText="Xác nhận từ chối"
          cancelText="Hủy"
          okButtonProps={{ danger: true, style: { borderRadius: radiusPill, height: 38 }, loading: approvalLoading }}
          cancelButtonProps={{ style: { borderRadius: radiusPill, height: 38 } }}
          width={520}
        >
          <div style={{ padding: '12px 0' }}>
            <div style={{ marginBottom: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textSecondary }}>
              Lý do từ chối <span style={{ color: statusCritical }}>*</span>
            </div>
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do từ chối phê duyệt..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </div>
        </Modal>

        {/* History Drawer */}
        <Drawer
          title={
            <span style={drawerTitleStyle}>
              Lịch sử thay đổi: {selectedRecord?.name || selectedRecord?.stationName || selectedRecord?.code}
            </span>
          }
          open={historyDrawerOpen}
          onClose={() => setHistoryDrawerOpen(false)}
          width={720}
          destroyOnHidden
        >
          {historyLoading ? (
            <LoadingSkeleton />
          ) : historyList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: textTertiary }}>
              Chưa có lịch sử thay đổi nào
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {historyList.map((h, i) => (
                <div
                  key={h.id || i}
                  style={{
                    padding: 16,
                    border: `1px solid ${borderDefault}`,
                    borderRadius: 8,
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: fontWeightBold, color: actionPrimary, fontSize: fontSizeMd }}>
                      {h.actionType === 'CREATE' ? 'Tạo mới' : h.actionType === 'UPDATE' ? 'Cập nhật' : h.actionType}
                    </span>
                    <span style={{ color: textTertiary, fontSize: fontSizeSm }}>
                      {(h as any).performedAt ? dayjs((h as any).performedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                    </span>
                  </div>
                  <div style={{ color: textSecondary, fontSize: fontSizeSm }}>
                    <span>Thực hiện bởi: </span>
                    <span style={{ fontWeight: fontWeightMedium, color: textSecondary }}>
                      {(h as any).performedByName || (h as any).performedBy || 'Hệ thống'}
                    </span>
                  </div>
                  {(h as any).reason && (
                    <div style={{ marginTop: 6, color: statusCritical, fontSize: fontSizeSm }}>
                      <span>Lý do: </span>
                      <span>{(h as any).reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Drawer>
      </div>
    </ThemeTokenProvider>
  );
};

export default InmarsatStationList;
