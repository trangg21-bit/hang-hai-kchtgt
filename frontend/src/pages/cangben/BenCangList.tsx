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
  benCangCRUD,
  benCangApproval,
  cangBienCRUD,
} from '../../services/cangbenService';
import type { BenCang } from '../../types/cangben';
import { BECBANG_STATUS_MAP } from '../../types/cangben';
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

export default function BenCangList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterCangBienId, setFilterCangBienId] = useState<string | undefined>();
  const [filterLoaiBen, setFilterLoaiBen] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<BenCang[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cangBienOptions, setCangBienOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await cangBienCRUD.search({ page: 1, pageSize: 1000 });
        setCangBienOptions((res.data || []).map((cb: any) => ({ value: cb.id, label: cb.tenCang })));
      } catch { /* ignore */ }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await benCangCRUD.search({
        page,
        pageSize,
        search: search || undefined,
        cangBienId: filterCangBienId,
        loaiBen: filterLoaiBen || undefined,
        trangThaiPheDuyet: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách bến cảng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterCangBienId, filterLoaiBen, filterStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterCangBienId(values.cangBienId || undefined);
    setFilterLoaiBen(values.loaiBen || '');
    setFilterStatus(values.trangThaiPheDuyet || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterCangBienId(undefined);
    setFilterLoaiBen('');
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: BenCang) => {
      try {
        await benCangCRUD.delete(record.id);
        toast.success('Đã xóa bến cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: BenCang) => {
      try {
        await benCangApproval.approve(record.id);
        toast.success('Đã gửi duyệt bến cảng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: BenCang) => {
      try {
        await benCangApproval.approve(record.id);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: BenCang) => {
      try {
        await benCangApproval.approve(record.id);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: BenCang) => {
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null) return;
      try {
        await benCangApproval.reject(record.id, reason);
        toast.success('Đã từ chối');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, mã...' },
    { key: 'cangBienId', type: 'select' as const, label: 'Cảng biển', placeholder: 'Chọn cảng biển', options: cangBienOptions },
  ], [cangBienOptions]);

  const headerActions = useMemo(() => [
    { key: 'create', label: 'Tạo bến cảng', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => navigate('/bencang/create') },
    { key: 'export', label: '', variant: 'subtle' as const, icon: <FileExcelOutlined style={{ color: statusOperational }} />, borderColor: `${statusOperational}80`, color: statusOperational, onClick: () => {} },
  ], [navigate]);

  const columns = useMemo(() => [
    { key: 'stt', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, render: (_: unknown, __: BenCang, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'maBen', label: 'Mã', dataIndex: 'maBen', width: 140, render: (maBen: string) => <Tag color="cyan">{maBen}</Tag> },
    { key: 'tenBen', label: 'Tên', dataIndex: 'tenBen', ellipsis: true },
    { key: 'tenCangBien', label: 'Cảng biển', dataIndex: 'tenCangBien', width: 180, render: (v: string) => v || '—' },
    { key: 'tuyenDuongThuy', label: 'Tuyến đường thủy', dataIndex: 'tuyenDuongThuy', ellipsis: true },
    { key: 'loaiBen', label: 'Loại bến', dataIndex: 'loaiBen', width: 120 },
    { key: 'chieuDai', label: 'Chiều dài', dataIndex: 'chieuDai', width: 110, render: (v: number) => <span style={{ color: textSecondary }}>{v?.toFixed(2) || '—'}</span> },
    { key: 'chieuRong', label: 'Chiều rộng', dataIndex: 'chieuRong', width: 110, render: (v: number) => <span style={{ color: textSecondary }}>{v?.toFixed(2) || '—'}</span> },
    { key: 'doSauLuong', label: 'Độ sâu luồng', dataIndex: 'doSauLuong', width: 110, render: (v: number) => <span style={{ color: textSecondary }}>{v?.toFixed(2) || '—'}</span> },
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

  const rowActions = useCallback((record: BenCang) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => navigate(`/bencang/${record.id}`) });
    actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => navigate(`/bencang/${record.id}/edit`) });
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
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách bến cảng'} onRetry={fetchData} />;
    if (dataSource.length === 0) {
      if (search || filterCangBienId || filterLoaiBen || filterStatus) return <EmptyState description="Không tìm thấy bến cảng nào phù hợp" />;
      return <EmptyState description="Chưa có bến cảng nào" />;
    }
    return <div style={{ overflowX: 'auto' }}>
      <DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} scroll={{ x: 1600 }} />
      <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
    </div>;
  };

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản lý bến cảng' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>
    </div>
  );
}
