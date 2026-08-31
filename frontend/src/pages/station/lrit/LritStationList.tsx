import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Input,
  Select,
  Modal,
  Space,
  Button,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ScreenHeader, DataTable } from '../../../components/list-view';
import FilterTableLayout from '../../../components/list-view/FilterTableLayout';
import Pagination from '../../../components/list-view/Pagination';
import EmptyState from '../../../components/EmptyState';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import { OrgUnitTreeSelect, normalizeSearchText } from '../../../components/org-unit';
import { VIETNAM_PROVINCE_OPTIONS, getProvinceNameById } from '../../../types/common';
import { CONDITION_STATUS_OPTIONS, ApprovalStatus } from '../../../types/vtsSystem';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../../services/operatingOrganizationsData';
import { organizationService } from '../../../services/organizationService';
import type { LritStationItem } from '../../../types/lritStation';
import { lritStationService } from '../../../services/lritStationService';
import { LritStationFormModal } from './LritStationFormModal';
import { LritStationDetailDrawer } from './LritStationDetailDrawer';
import { useAuthStore } from '../../../store/authStore';
import { usePermissionStore } from '../../../store/permissionStore';
import toast from '../../../components/ToastNotification';
import { colors } from '../../../theme';
import {
  statusDraft,
  statusOperational,
  statusCritical,
  statusAttention,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  surfacePage,
  spaceMd,
  spaceSm,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  spaceFormField,
  radiusPill,
  primaryButtonStyle,
  outlineButtonStyle,
  selectStyle,
  inputStyle,
  textAreaStyle,
} from '../../../tokens';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../../utils/approvalEditPolicy';
import ApprovalStatusBadge from '../../../components/shared/ApprovalStatusBadge';

export const LritStationList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LritStationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Filter states
  const [orgUnitId, setOrgUnitId] = useState<string | undefined>();
  const [operatingOrgId, setOperatingOrgId] = useState<string | undefined>();
  const [keyword, setKeyword] = useState<string>('');
  const [provinceId, setProvinceId] = useState<number | undefined>();
  const [conditionStatus, setConditionStatus] = useState<string | undefined>();
  const [approvalStatusTab, setApprovalStatusTab] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Form & Detail states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedStation, setSelectedStation] = useState<LritStationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailStationId, setDetailStationId] = useState<string | null>(null);

  // Reject modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string }>>([]);

  const user = useAuthStore((state) => state.user);
  const hasPermission = usePermissionStore((state) => state.hasPermission);

  useEffect(() => {
    organizationService.getAll().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setOperatingOrgs(res.map((o) => ({ id: o.id, name: o.name })));
      } else {
        setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS);
      }
    }).catch(() => {
      setOperatingOrgs(DEFAULT_OPERATING_ORGANIZATIONS);
    });
  }, []);

  const mapTabToApprovalStatus = (tabKey: string): number | string | undefined => {
    switch (tabKey) {
      case 'draft': return ApprovalStatus.DRAFT;
      case 'pending': return ApprovalStatus.PENDING_APPROVAL;
      case 'approvedL1': return ApprovalStatus.APPROVED_LEVEL1;
      case 'approved': return ApprovalStatus.APPROVED;
      case 'rejected': return 'REJECTED_ALL';
      default: return undefined;
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const mappedApproval = mapTabToApprovalStatus(approvalStatusTab);
      const res = await lritStationService.search({
        orgUnitId,
        operatingOrgId,
        keyword: keyword.trim() || undefined,
        provinceId,
        conditionStatus,
        approvalStatus: mappedApproval,
        updatedFrom: dateRange?.[0] ? dateRange[0].startOf('day').toISOString() : undefined,
        updatedTo: dateRange?.[1] ? dateRange[1].endOf('day').toISOString() : undefined,
        page,
        size: pageSize,
      });
      setData(res.items);
      setTotal(res.total);
      if (res.statusCounts) {
        setStatusCounts(res.statusCounts);
      }
    } catch (err: any) {
      toast.error('Không thể tải danh sách Đài LRIT');
    } finally {
      setLoading(false);
    }
  }, [orgUnitId, operatingOrgId, keyword, provinceId, conditionStatus, approvalStatusTab, dateRange, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetFilter = () => {
    setOrgUnitId(undefined);
    setOperatingOrgId(undefined);
    setKeyword('');
    setProvinceId(undefined);
    setConditionStatus(undefined);
    setDateRange(null);
    setPage(1);
  };

  const handleCreate = () => {
    setFormMode('create');
    setSelectedStation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: LritStationItem) => {
    setFormMode('edit');
    setSelectedStation(record);
    setIsFormOpen(true);
  };

  const handleView = (record: LritStationItem) => {
    setDetailStationId(record.id);
    setIsDetailOpen(true);
  };

  const handleSubmitApproval = async (record: LritStationItem) => {
    try {
      await lritStationService.submit(record.id);
      toast.success(`Đã gửi phê duyệt Đài LRIT: ${record.name}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi phê duyệt');
    }
  };

  const handleApproveC1 = async (record: LritStationItem) => {
    try {
      await lritStationService.approveC1(record.id);
      toast.success(`Cảng vụ đã phê duyệt Đài LRIT: ${record.name}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi duyệt cấp 1');
    }
  };

  const handleApproveC2 = async (record: LritStationItem) => {
    try {
      await lritStationService.approveC2(record.id);
      toast.success(`Cục Hàng hải đã phê duyệt Đài LRIT: ${record.name}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi duyệt cấp 2');
    }
  };

  const handleOpenReject = (record: LritStationItem) => {
    setRejectingId(record.id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await lritStationService.reject(rejectingId, rejectReason.trim());
      toast.success('Đã trả về hồ sơ Đài LRIT');
      setIsRejectModalOpen(false);
      setRejectingId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi từ chối hồ sơ');
    }
  };

  const handleDelete = (record: LritStationItem) => {
    Modal.confirm({
      title: 'Xác nhận xóa Đài LRIT',
      content: `Bạn có chắc chắn muốn xóa Đài LRIT "${record.name}" (${record.code})? Hành động này không thể hoàn tác.`,
      okText: 'Xác nhận xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await lritStationService.delete(record.id);
          toast.success('Đã xóa Đài LRIT thành công');
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Lỗi khi xóa Đài LRIT');
        }
      },
    });
  };

  const statusTabItems = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: statusCounts.all ?? 0, color: actionPrimary },
    { key: 'draft', label: 'Lưu tạm', count: statusCounts.draft ?? 0, color: statusDraft },
    { key: 'pending', label: 'Chờ Cảng vụ duyệt', count: statusCounts.pending ?? 0, color: statusAttention },
    { key: 'approvedL1', label: 'Chờ Cục duyệt', count: statusCounts.approvedL1 ?? 0, color: '#0284C7' },
    { key: 'approved', label: 'Đã duyệt', count: statusCounts.approved ?? 0, color: statusOperational },
    { key: 'rejected', label: 'Từ chối', count: statusCounts.rejected ?? 0, color: statusCritical },
  ], [statusCounts]);

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      title: 'Tên đài / Mã đài',
      key: 'name_code',
      width: 260,
      fixed: 'left' as const,
      render: (_: any, record: LritStationItem) => (
        <div>
          <div
            style={{
              fontSize: fontSizeMd,
              fontWeight: fontWeightBold,
              color: colors.primary,
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={record.name}
            onClick={() => handleView(record)}
          >
            {record.name}
          </div>
          <div style={{ fontSize: fontSizeMd, color: textSecondary }}>
            {record.code}
          </div>
        </div>
      ),
    },
    {
      title: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      key: 'orgUnitName',
      width: 220,
      render: (val: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          {val || '—'}
        </div>
      ),
    },
    {
      title: 'Đơn vị khai thác',
      dataIndex: 'operatingOrgName',
      key: 'operatingOrgName',
      width: 200,
      render: (val: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
          {val || '—'}
        </div>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'provinceName',
      key: 'provinceName',
      width: 160,
      render: (val: string, r: LritStationItem) => val || (r.provinceId ? getProvinceNameById(r.provinceId) : '—'),
    },
    {
      title: 'Cán bộ cập nhật',
      key: 'updatedInfo',
      width: 210,
      render: (_: any, r: LritStationItem) => (
        <div>
          <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>
            {r.updatedByName || r.createdByName || '—'}
          </div>
          <div style={{ fontSize: fontSizeMd, color: textSecondary }}>
            {r.updatedAt ? dayjs(r.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái phê duyệt',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 180,
      render: (status: string) => <ApprovalStatusBadge status={status || 'DRAFT'} />,
    },
    {
      title: 'Tình trạng',
      dataIndex: 'conditionStatus',
      key: 'conditionStatus',
      width: 160,
      render: (status: string) => {
        const isGood = status === 'OPERATIONAL' || status === '1';
        return (
          <span
            style={{
              display: 'inline-block',
              borderRadius: radiusPill,
              padding: '2px 10px',
              fontSize: fontSizeMd,
              fontWeight: 500,
              background: isGood ? `${statusOperational}15` : `${statusAttention}15`,
              border: `1px solid ${isGood ? statusOperational : statusAttention}40`,
              color: isGood ? statusOperational : statusAttention,
            }}
          >
            {isGood ? 'Hoạt động tốt' : 'Đang bảo trì'}
          </span>
        );
      },
    },
  ];

  const getRowActions = (record: LritStationItem) => {
    const isOwner = user?.id && record.createdBy === user.id;
    const canEdit = canEditApprovalRecord(record.approvalStatus || 'DRAFT', { hasPerm: hasPermission, resource: 'coastalstationlrit' });
    const canDelete = canDeleteApprovalRecord(record.approvalStatus || 'DRAFT', { hasPerm: hasPermission, resource: 'coastalstationlrit' });

    return [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => handleView(record),
      },
      ...(canEdit
        ? [
            {
              key: 'edit',
              label: 'Chỉnh sửa',
              icon: <EditOutlined />,
              onClick: () => handleEdit(record),
            },
          ]
        : []),
      ...(record.approvalStatus === ApprovalStatus.DRAFT ||
      record.approvalStatus === ApprovalStatus.REJECTED_LEVEL1 ||
      record.approvalStatus === ApprovalStatus.REJECTED_LEVEL2
        ? [
            {
              key: 'submit',
              label: 'Gửi phê duyệt',
              icon: <SendOutlined />,
              onClick: () => handleSubmitApproval(record),
            },
          ]
        : []),
      ...(record.approvalStatus === ApprovalStatus.PENDING_APPROVAL && !isOwner && hasPermission('coastalstationlrit:approvec1')
        ? [
            {
              key: 'approve_c1',
              label: 'Duyệt Cấp 1 (Cảng vụ)',
              icon: <CheckCircleOutlined style={{ color: statusOperational }} />,
              onClick: () => handleApproveC1(record),
            },
            {
              key: 'reject_c1',
              label: 'Từ chối Cấp 1',
              icon: <CloseCircleOutlined style={{ color: statusCritical }} />,
              onClick: () => handleOpenReject(record),
            },
          ]
        : []),
      ...(record.approvalStatus === ApprovalStatus.APPROVED_LEVEL1 && !isOwner && hasPermission('coastalstationlrit:approvec2')
        ? [
            {
              key: 'approve_c2',
              label: 'Duyệt Cấp 2 (Cục HH)',
              icon: <CheckCircleOutlined style={{ color: statusOperational }} />,
              onClick: () => handleApproveC2(record),
            },
            {
              key: 'reject_c2',
              label: 'Từ chối Cấp 2',
              icon: <CloseCircleOutlined style={{ color: statusCritical }} />,
              onClick: () => handleOpenReject(record),
            },
          ]
        : []),
      ...(canDelete
        ? [
            {
              key: 'delete',
              label: 'Xóa bỏ',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDelete(record),
            },
          ]
        : []),
    ];
  };

  const sidebarFilterContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceFormField, padding: spaceSm }}>
      <div>
        <label style={{ fontSize: fontSizeSm, fontWeight: fontWeightMedium, color: textSecondary, display: 'block', marginBottom: 4 }}>
          Đơn vị quản lý
        </label>
        <OrgUnitTreeSelect
          placeholder="Tất cả đơn vị"
          value={orgUnitId}
          onChange={setOrgUnitId}
          allowClear
          treeDefaultExpandAll
          listHeight={256}
          style={{ width: '100%', borderRadius: radiusPill }}
        />
      </div>

      <div>
        <label style={{ fontSize: fontSizeSm, fontWeight: fontWeightMedium, color: textSecondary, display: 'block', marginBottom: 4 }}>
          Tìm kiếm từ khóa
        </label>
        <Input
          placeholder="Nhập tên, mã đài, terminal..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={() => setPage(1)}
          allowClear
          prefix={<SearchOutlined style={{ color: textTertiary }} />}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={{ fontSize: fontSizeSm, fontWeight: fontWeightMedium, color: textSecondary, display: 'block', marginBottom: 4 }}>
          Đơn vị khai thác
        </label>
        <Select
          showSearch
          placeholder="Tất cả đơn vị khai thác"
          value={operatingOrgId}
          onChange={setOperatingOrgId}
          allowClear
          filterOption={(input, option) =>
            normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
          }
          options={operatingOrgs.map((o) => ({ value: o.id, label: o.name }))}
          style={{ ...selectStyle, width: '100%' }}
        />
      </div>

      <div>
        <label style={{ fontSize: fontSizeSm, fontWeight: fontWeightMedium, color: textSecondary, display: 'block', marginBottom: 4 }}>
          Địa điểm (Tỉnh/TP)
        </label>
        <Select
          showSearch
          placeholder="Tất cả Tỉnh/TP"
          value={provinceId}
          onChange={setProvinceId}
          allowClear
          filterOption={(input, option) =>
            normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
          }
          options={VIETNAM_PROVINCE_OPTIONS}
          style={{ ...selectStyle, width: '100%' }}
        />
      </div>

      <div>
        <label style={{ fontSize: fontSizeSm, fontWeight: fontWeightMedium, color: textSecondary, display: 'block', marginBottom: 4 }}>
          Tình trạng hoạt động
        </label>
        <Select
          placeholder="Tất cả tình trạng"
          value={conditionStatus}
          onChange={setConditionStatus}
          allowClear
          options={CONDITION_STATUS_OPTIONS}
          style={{ ...selectStyle, width: '100%' }}
        />
      </div>

      <div>
        <label style={{ fontSize: fontSizeSm, fontWeight: fontWeightMedium, color: textSecondary, display: 'block', marginBottom: 4 }}>
          Khoảng ngày cập nhật
        </label>
        <DatePicker.RangePicker
          value={dateRange}
          onChange={setDateRange}
          format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']}
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', gap: spaceSm, marginTop: spaceSm }}>
        <Button
          icon={<ReloadOutlined />}
          style={{ ...outlineButtonStyle, flex: 1 }}
          onClick={handleResetFilter}
        >
          Làm mới
        </Button>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          style={{ ...primaryButtonStyle, flex: 1 }}
          onClick={() => { setPage(1); fetchData(); }}
        >
          Tìm kiếm
        </Button>
      </div>
    </div>
  );

  return (
    <div style={{ background: surfacePage, minHeight: '100vh', padding: spaceMd }}>
      <ScreenHeader
        breadcrumb={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Đài bờ & TT thông tin' },
          { label: 'Đài LRIT' },
        ]}
        actions={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              style={outlineButtonStyle}
              onClick={() => toast.info('Chức năng Xuất Excel đang tải dữ liệu...')}
            >
              Xuất Excel
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={primaryButtonStyle}
              onClick={handleCreate}
            >
              Thêm mới
            </Button>
          </Space>
        }
      />

      <FilterTableLayout
        statusTabs={statusTabItems}
        onStatusTabChange={(key) => {
          setApprovalStatusTab(key);
          setPage(1);
        }}
        onFilterApply={() => { setPage(1); fetchData(); }}
        onFilterReset={handleResetFilter}
        filterContent={sidebarFilterContent}
        hideFilterToggle={true}
        loading={loading}
      >
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : data.length === 0 ? (
          <EmptyState
            description="Không tìm thấy bản ghi nào khớp với tiêu chí tìm kiếm"
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              dataSource={data}
              rowKey="id"
              rowActions={getRowActions}
              scroll={{ x: 1300 }}
            />
            <div style={{ marginTop: spaceMd, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
              />
            </div>
          </>
        )}
      </FilterTableLayout>

      {/* Form modal */}
      {isFormOpen && (
        <LritStationFormModal
          open={isFormOpen}
          mode={formMode}
          initialData={selectedStation}
          onCancel={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchData();
          }}
        />
      )}

      {/* Detail drawer */}
      {isDetailOpen && (
        <LritStationDetailDrawer
          open={isDetailOpen}
          stationId={detailStationId}
          onClose={() => {
            setIsDetailOpen(false);
            setDetailStationId(null);
          }}
          onEdit={(st) => {
            setIsDetailOpen(false);
            handleEdit(st);
          }}
        />
      )}

      {/* Reject reason modal */}
      <Modal
        title="Từ chối phê duyệt Đài LRIT"
        open={isRejectModalOpen}
        onOk={handleConfirmReject}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectingId(null);
        }}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true, style: { borderRadius: radiusPill } }}
        cancelButtonProps={{ style: { borderRadius: radiusPill } }}
      >
        <div style={{ marginBottom: spaceSm, color: textSecondary, fontSize: fontSizeMd }}>
          Vui lòng nhập lý do từ chối hoặc yêu cầu chỉnh sửa bổ sung hồ sơ:
        </div>
        <Input.TextArea
          rows={4}
          placeholder="Nhập lý do từ chối (bắt buộc)..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          style={textAreaStyle}
        />
      </Modal>
    </div>
  );
};

export default LritStationList;
