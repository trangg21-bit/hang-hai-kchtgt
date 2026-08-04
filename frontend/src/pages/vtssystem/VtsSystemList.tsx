import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Modal, Input } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD, vtsSystemApproval } from '../../services/vtsSystemService';
import type { VtsSystemResponse, ListParams, ApprovalRequest } from '../../types/vtsSystem';
import { ConditionStatus, ApprovalStatus, CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/vtsSystem';
import { useAuthStore } from '../../store/authStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import VtsSystemForm from './VtsSystemForm';
import toast from '../../components/ToastNotification';
import {
  actionPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeMd, fontSizeLg,
  cardStyle, radiusPill, borderDefault, spaceFormField, spaceMd,
  statusOperational, statusDraft,
} from '../../tokens';
import dayjs from 'dayjs';
import { colors } from '../../theme';

function formatDate(value: string | undefined): string {
  return value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';
}

const APPROVAL_STATUS_MAP: Record<string, string> = {
  [ApprovalStatus.PROPOSED]: 'Chờ duyệt',
  [ApprovalStatus.UNDER_REVIEW]: 'Đang xem xét',
  [ApprovalStatus.APPROVED]: 'Đã phê duyệt',
  [ApprovalStatus.REJECTED]: 'Từ chối',
};

const APPROVAL_COLOR: Record<string, string> = {
  [ApprovalStatus.PROPOSED]: '#faad14',
  [ApprovalStatus.UNDER_REVIEW]: '#1677ff',
  [ApprovalStatus.APPROVED]: statusOperational,
  [ApprovalStatus.REJECTED]: statusDraft,
};

const CONDITION_COLOR: Record<string, string> = {
  [ConditionStatus.GOOD]: statusOperational,
  [ConditionStatus.DEGRADED]: '#fa8c16',
  [ConditionStatus.DAMAGED]: statusDraft,
};

export default function VtsSystemList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];
  const isAdmin = currentUser?.role === 'ROLE_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.username === 'admin' || userPermissions.includes('*');
  const hasPerm = useCallback((permission: string) => isAdmin || userPermissions.includes(permission), [isAdmin, userPermissions]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterConditionStatus, setFilterConditionStatus] = useState<ConditionStatus | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<ApprovalStatus | undefined>();
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [orgUnitOptions, setOrgUnitOptions] = useState<{ label: string; value: string }[]>([]);

  const [dataSource, setDataSource] = useState<VtsSystemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<VtsSystemResponse | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectLevel, setRejectLevel] = useState<'c1' | 'c2'>('c1');
  const [rejectReason, setRejectReason] = useState('');

  const [countAll, setCountAll] = useState(0);
  const [countProposed, setCountProposed] = useState<number>(0);
  const [countUnderReview, setCountUnderReview] = useState<number>(0);
  const [countApproved, setCountApproved] = useState<number>(0);
  const [countRejected, setCountRejected] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const resp: any = await organizationService.list({ pageSize: 1000 });
        const list = Array.isArray(resp) ? resp : (resp?.data || resp?.content || []);
        setOrgUnitOptions(list.map((o: any) => ({ label: o.name || o.unitName || o.tenDonVi || 'Đơn vị', value: String(o.id) })));
      } catch (e) {
        console.error('Failed to fetch org units for filter', e);
      }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    try {
      const params: ListParams = {
        page: page - 1, size: pageSize,
        keyword: filterKeyword || undefined,
        conditionStatus: filterConditionStatus,
        approvalStatus: filterApprovalStatus,
        orgUnitId: filterOrgUnitId || undefined,
      };
      const res = await vtsSystemCRUD.list(params);
      setDataSource(res.items);
      setTotal(res.total);
      if (res.statusCounts) {
        setCountProposed(res.statusCounts.PROPOSED || 0);
        setCountUnderReview(res.statusCounts.UNDER_REVIEW || 0);
        setCountApproved(res.statusCounts.APPROVED || 0);
        setCountRejected(res.statusCounts.REJECTED || 0);
      }
    } catch (err: unknown) {
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách');
    } finally { setLoading(false); }
  }, [page, pageSize, filterKeyword, filterConditionStatus, filterApprovalStatus, filterOrgUnitId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    try { await vtsSystemCRUD.delete(id); toast.success('Xóa thành công'); fetchData(); }
    catch (err: any) { toast.error(err?.message || 'Lỗi xóa'); }
  };

  const confirmDelete = (record: VtsSystemResponse) => {
    Modal.confirm({
      title: 'Xác nhận xóa hệ thống VTS',
      icon: <ExclamationCircleOutlined />,
      content: 'Bản ghi đã phê duyệt sẽ được xóa mềm và không còn hiển thị trong danh sách.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => handleDelete(record.id),
    });
  };

  const handleApproveC1 = async (record: VtsSystemResponse) => {
    try {
      await vtsSystemApproval.approveC1(record.id, { quyetDinh: 'APPROVED', reason: 'Phê duyệt cấp 1' });
      toast.success('Phê duyệt cấp 1 thành công'); fetchData();
    } catch (err: any) { toast.error(err?.message || 'Lỗi phê duyệt'); }
  };

  const handleApproveC2 = async (record: VtsSystemResponse) => {
    try {
      await vtsSystemApproval.approveC2(record.id, { quyetDinh: 'APPROVED', reason: 'Phê duyệt cấp 2' });
      toast.success('Phê duyệt cấp 2 thành công'); fetchData();
    } catch (err: any) { toast.error(err?.message || 'Lỗi phê duyệt'); }
  };

  const openRejectModal = (id: string, level: 'c1' | 'c2') => {
    setRejectTargetId(id); setRejectLevel(level); setRejectReason(''); setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) { toast.error('Lý do từ chối phải có ít nhất 10 ký tự'); return; }
    if (!rejectTargetId) return;
    try {
      const payload: ApprovalRequest = { quyetDinh: 'REJECTED', reason: rejectReason.trim() };
      if (rejectLevel === 'c1') await vtsSystemApproval.approveC1(rejectTargetId, payload);
      else await vtsSystemApproval.approveC2(rejectTargetId, payload);
      toast.success('Đã từ chối'); setRejectModalOpen(false); fetchData();
    } catch (err: any) { toast.error(err?.message || 'Lỗi từ chối'); }
  };

  const handleViewHistory = (record: VtsSystemResponse) => {
    setEditingId(record.id);
    setSelectedRecord(record);
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const columns = useMemo(() => [
    { key: 'stt', label: 'STT', width: 50, align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (page - 1) * pageSize + idx + 1 },
    { key: 'systemName', label: 'Tên hệ thống', dataIndex: 'systemName', width: 200, sortable: true,
      render: (val: string) => <Typography.Text strong>{val || '—'}</Typography.Text> },
    { key: 'location', label: 'Vị trí', dataIndex: 'location', width: 200, sortable: true },
    { key: 'conditionStatus', label: 'Tình trạng', dataIndex: 'conditionStatus', width: 120, sortable: true, align: 'center' as const,
      render: (val: ConditionStatus) => {
        if (!val) return '—';
        const display = CONDITION_STATUS_MAP[val] || val;
        const color = CONDITION_COLOR[val] || textSecondary;
        return <span style={{ color, fontWeight: fontWeightMedium }}>{display}</span>;
      }},
    { key: 'responsibilityLevel', label: 'Mức độ phụ trách', dataIndex: 'responsibilityLevel', width: 150 },
    { key: 'partner', label: 'Đối tác', dataIndex: 'partner', width: 150 },
    { key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 180 },
    { key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 140, sortable: true, align: 'center' as const,
      render: (val: ApprovalStatus) => {
        const label = APPROVAL_STATUS_MAP[val] || val;
        const color = APPROVAL_COLOR[val] || textSecondary;
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}>{label}</span>;
      }},
    { key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 150, sortable: true, align: 'center' as const, render: (val: string) => formatDate(val) },
  ], [page, pageSize]);

  const rowActions = useCallback((record: VtsSystemResponse) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }[] = [];
    if (hasPerm('vts:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => { setEditingId(record.id); setSelectedRecord(record); setModalMode('detail'); setIsModalOpen(true); } });
      actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => handleViewHistory(record) });
    }
    if (hasPerm('vts:update') && record.approvalStatus !== ApprovalStatus.APPROVED) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => { setEditingId(record.id); setSelectedRecord(record); setModalMode('edit'); setIsModalOpen(true); } });
    }
    if (hasPerm('vts:approve:c1') && record.approvalStatus === ApprovalStatus.PROPOSED) {
      actions.push({ key: 'approveC1', label: 'Phê duyệt C1', icon: <CheckOutlined />, onClick: () => handleApproveC1(record) });
      actions.push({ key: 'rejectC1', label: 'Từ chối C1', danger: true, icon: <CloseOutlined />, onClick: () => openRejectModal(record.id, 'c1') });
    }
    if (hasPerm('vts:approve:c2') && record.approvalStatus === ApprovalStatus.UNDER_REVIEW) {
      const isSelfApproval = Boolean(currentUser?.userId && record.approverLevel1 === currentUser.userId);
      actions.push({ key: 'approveC2', label: isSelfApproval ? 'Phê duyệt C2 (không thể tự duyệt)' : 'Phê duyệt C2', icon: <CheckOutlined />, disabled: isSelfApproval, onClick: () => handleApproveC2(record) });
      actions.push({ key: 'rejectC2', label: isSelfApproval ? 'Từ chối C2 (không thể tự duyệt)' : 'Từ chối C2', danger: true, disabled: isSelfApproval, icon: <CloseOutlined />, onClick: () => openRejectModal(record.id, 'c2') });
    }
    if (hasPerm('vts:delete') && record.approvalStatus === ApprovalStatus.APPROVED) {
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => confirmDelete(record) });
    }
    return actions;
  }, [hasPerm, currentUser?.userId]);

  const statusTabs = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: total, color: textSecondary, active: !filterApprovalStatus },
    { key: ApprovalStatus.PROPOSED, label: 'Chờ duyệt', count: countProposed, color: '#faad14', active: filterApprovalStatus === ApprovalStatus.PROPOSED },
    { key: ApprovalStatus.UNDER_REVIEW, label: 'Đang xem xét', count: countUnderReview, color: '#1677ff', active: filterApprovalStatus === ApprovalStatus.UNDER_REVIEW },
    { key: ApprovalStatus.APPROVED, label: 'Đã phê duyệt', count: countApproved, color: statusOperational, active: filterApprovalStatus === ApprovalStatus.APPROVED },
    { key: ApprovalStatus.REJECTED, label: 'Từ chối', count: countRejected, color: statusDraft, active: filterApprovalStatus === ApprovalStatus.REJECTED },
  ], [total, filterApprovalStatus, countProposed, countUnderReview, countApproved, countRejected]);

  const filterFields = useMemo(() => [
    { key: 'keyword', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo mã, tên hệ thống VTS...' },
    { key: 'orgUnitId', type: 'select' as const, label: 'Đơn vị quản lý', placeholder: 'Chọn Cảng vụ / Chi cục',
      options: orgUnitOptions },
    { key: 'conditionStatus', type: 'select' as const, label: 'Tình trạng', placeholder: 'Chọn tình trạng',
      options: CONDITION_STATUS_OPTIONS },
  ], [orgUnitOptions]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setFilterKeyword(values.keyword?.trim() || '');
    setFilterOrgUnitId(values.orgUnitId || undefined);
    setFilterConditionStatus(values.conditionStatus || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterKeyword(''); setFilterOrgUnitId(undefined); setFilterConditionStatus(undefined); setFilterApprovalStatus(undefined); setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setFilterApprovalStatus(key === 'all' ? undefined : key as ApprovalStatus);
    setPage(1);
  }, []);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Hệ thống VTS' }]}
        actions={
          hasPerm('vts:create')
            ? [{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />,
                onClick: () => { setEditingId(null); setModalMode('create'); setIsModalOpen(true); } }]
            : []
        }
      />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />

      <div style={{ ...cardStyle, marginBottom: spaceMd, display: 'flex', justifyContent: 'center', padding: '8px 16px' }}>
        <StatusTabs tabs={statusTabs} onChange={handleTabChange} />
      </div>

      <div style={{ ...cardStyle, padding: spaceMd }}>
        {loading ? <LoadingSkeleton rows={8} /> :
         isError ? <ErrorState message={errorMessage} onRetry={fetchData} /> :
         dataSource.length === 0 ? <EmptyState description="Chưa có hệ thống VTS nào" /> :
         <>
           <DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} loading={false} scroll={{ x: 'max-content' }} />
           <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
         </>
        }
      </div>

      <VtsSystemForm
        open={isModalOpen} editId={editingId} initialData={selectedRecord} mode={modalMode}
        onCancel={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); }}
        onSuccess={() => { setIsModalOpen(false); setEditingId(null); setSelectedRecord(null); fetchData(); }}
      />

      <Modal title="Từ chối" open={rejectModalOpen} onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)} okText="Từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}>
        <p style={{ marginBottom: spaceFormField }}>Nhập lý do từ chối (tối thiểu 10 ký tự):</p>
        <Input.TextArea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." />
      </Modal>
    </div>
  );
}
