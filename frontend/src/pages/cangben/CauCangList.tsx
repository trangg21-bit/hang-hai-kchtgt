import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, Space, Tag, Tooltip, Popconfirm } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileExcelOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  cauCangCRUD,
  cauCangApproval,
} from '../../services/cangbenService';
import type { CauCang } from '../../types/cangben';
import {
  BECBANG_STATUS_MAP,
  CAUCANG_LOAI_OPTIONS,
  CAUCANG_LOAI_MAP,
} from '../../types/cangben';
import { ScreenHeader, FilterBar, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  cardStyle,
  textPrimary,
  textSecondary,
  fontSizeMd,
} from '../../tokens';

const STATUS_STYLE_MAP: Record<string, { color: string; label: string }> = {
  HIEN_HANH: { color: '#1BAF7A', label: 'Hiện hành' },
  TAM_NGUNG: { color: '#EDA100', label: 'Tạm ngừng' },
};

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  CHO_PHE_DUYET: { color: '#EDA100', label: 'Chờ phê duyệt' },
  DUOC_PHE_DUYET: { color: '#1BAF7A', label: 'Được phê duyệt' },
  TU_CHOI: { color: '#E34948', label: 'Từ chối' },
};

export default function CauCangList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterLoai, setFilterLoai] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CauCang[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await cauCangCRUD.search({
        page,
        pageSize,
        maCau: search || undefined,
        tenCau: search || undefined,
        loaiCau: filterLoai,
        trangThaiHoatDong: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cầu cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterLoai, filterStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterLoai(values.loaiCau || undefined);
    setFilterStatus(values.trangThaiPheDuyet || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterLoai(undefined);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: CauCang) => {
      try {
        await cauCangCRUD.delete(record.id);
        toast.success('Đã xóa cầu cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: CauCang) => {
      try {
        await cauCangApproval.submitForApproval?.(record.id);
        toast.success('Đã gửi duyệt cầu cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: CauCang) => {
      try {
        await cauCangApproval.approveL1?.(record.id, localStorage.getItem('user_id') || '1');
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: CauCang) => {
      try {
        await cauCangApproval.approveL2?.(record.id, localStorage.getItem('user_id') || '1');
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: CauCang) => {
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null) return;
      try {
        await cauCangApproval.reject(record.id, reason, localStorage.getItem('user_id') || '1');
        toast.success('Đã từ chối');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo mã, tên...' },
    { key: 'loaiCau', type: 'select' as const, label: 'Loại cầu', placeholder: 'Chọn loại', options: CAUCANG_LOAI_OPTIONS },
  ], []);

  const headerActions = useMemo(() => [
    { key: 'create', label: 'Tạo cầu cảng', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => navigate('/caucang/create') },
    { key: 'export', label: '', variant: 'subtle' as const, icon: <FileExcelOutlined style={{ color: statusOperational }} />, borderColor: `${statusOperational}80`, color: statusOperational, onClick: () => {} },
  ], [navigate]);

  const columns = useMemo(() => [
    { key: 'stt', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, render: (_: unknown, __: CauCang, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'maCau', label: 'Mã', dataIndex: 'maCau', width: 140, render: (maCau: string) => <Tag color="cyan">{maCau}</Tag> },
    { key: 'tenCau', label: 'Tên', dataIndex: 'tenCau', ellipsis: true },
    { key: 'tenBenCang', label: 'Bến cảng', dataIndex: 'tenBenCang', width: 180, render: (v: string) => v || '—' },
    { key: 'chieuDai', label: 'Chiều dài', dataIndex: 'chieuDai', width: 110, render: (v: number) => <span style={{ color: textSecondary }}>{v?.toFixed(1) || '—'}</span> },
    { key: 'taiTrong', label: 'Tải trọng', dataIndex: 'taiTrong', width: 120, render: (v: number) => <span style={{ color: textSecondary }}>{v?.toFixed(1) || '—'}</span> },
    {
      key: 'loaiCau', label: 'Loại cầu', dataIndex: 'loaiCau', width: 140,
      render: (loaiCau: string) => {
        const m = CAUCANG_LOAI_MAP[loaiCau as keyof typeof CAUCANG_LOAI_MAP];
        return m ? <Tag color={m.color}>{CAUCANG_LOAI_OPTIONS.find((o) => o.value === loaiCau)?.label || loaiCau}</Tag> : <Tag>{loaiCau}</Tag>;
      },
    },
    {
      key: 'trangThaiHoatDong', label: 'Trạng thái hoạt động', dataIndex: 'trangThaiHoatDong', width: 160, align: 'center' as const,
      render: (status: string) => {
        const s = STATUS_STYLE_MAP[status] || { color: textSecondary, label: status };
        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: 500, background: `${s.color}15`, color: s.color }}>{s.label}</span>;
      },
    },
    {
      key: 'trangThaiPheDuyet', label: 'Trạng thái phê duyệt', dataIndex: 'trangThaiPheDuyet', width: 170, align: 'center' as const,
      render: (status: string) => {
        const s = APPROVAL_STYLE_MAP[status] || BECBANG_STATUS_MAP[status as keyof typeof BECBANG_STATUS_MAP] || { color: textSecondary, label: status };
        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: 500, background: `${s.color}15`, color: s.color }}>{s.label}</span>;
      },
    },
    {
      key: 'createdAt', label: 'Ngày tạo', dataIndex: 'createdAt', width: 160, align: 'center' as const,
      render: (v: string) => v ? <span style={{ color: textSecondary }}>{new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span> : '—',
    },
  ], [page, pageSize]);

  const rowActions = useCallback((record: CauCang) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => navigate(`/caucang/${record.id}`) });
    actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => navigate(`/caucang/${record.id}`) });
    if (record.trangThaiPheDuyet === 'DRAFT') {
      actions.push({ key: 'submit', label: 'Gửi duyệt', icon: <SendOutlined />, onClick: () => handleSubmitApproval(record) });
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    }
    if (record.trangThaiPheDuyet === 'PENDING_APPROVAL') {
      actions.push({ key: 'approve1', label: 'Phê duyệt L1', icon: <CheckCircleOutlined />, onClick: () => handleApproveL1(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => handleReject(record), danger: true });
    }
    if (record.trangThaiPheDuyet === 'APPROVED_L1') {
      actions.push({ key: 'approve2', label: 'Phê duyệt L2', icon: <CheckCircleOutlined />, onClick: () => handleApproveL2(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => handleReject(record), danger: true });
    }
    return actions;
  }, [navigate, handleSubmitApproval, handleDelete, handleApproveL1, handleApproveL2, handleReject]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách cầu cảng'} onRetry={fetchData} />;
    if (dataSource.length === 0) {
      if (search || filterLoai || filterStatus) return <EmptyState description="Không tìm thấy cầu cảng nào phù hợp" />;
      return <EmptyState description="Chưa có cầu cảng nào" />;
    }
    return <div style={{ overflowX: 'auto' }}>
      <DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} scroll={{ x: 1400 }} />
      <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
    </div>;
  };

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản lý cầu cảng' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>
    </div>
  );
}
