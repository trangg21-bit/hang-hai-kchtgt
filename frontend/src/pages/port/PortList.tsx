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
  portCRUD,
  portApproval,
} from '../../services/portService';
import type { Port } from '../../types/port';
import { BECBANG_STATUS_MAP } from '../../types/port';
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

export default function PortList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterMaCang, setFilterMaCang] = useState('');
  const [filterTenCang, setFilterTenCang] = useState('');
  const [filterTinhThanhPho, setFilterTinhThanhPho] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<Port[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await portCRUD.search({
        page,
        pageSize,
        portCode: filterMaCang || undefined,
        portName: filterTenCang || undefined,
        province: filterTinhThanhPho || undefined,
        approvalStatus: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cảng biển'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterMaCang, filterTenCang, filterTinhThanhPho, filterStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterMaCang(values.search || '');
    setFilterTenCang(values.search || '');
    setFilterTinhThanhPho(values.search || '');
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterMaCang('');
    setFilterTenCang('');
    setFilterTinhThanhPho('');
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (record: Port) => {
      try {
        await portCRUD.delete(record.id);
        toast.success('Đã xóa cảng biển');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: Port) => {
      try {
        await portApproval.approve(record.id);
        toast.success('Đã gửi duyệt cảng biển');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: Port) => {
      try {
        await portApproval.approve(record.id);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: Port) => {
      try {
        await portApproval.approve(record.id);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: Port) => {
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null) return;
      try {
        await portApproval.reject(record.id, reason);
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
  ], []);

  const headerActions = useMemo(() => [
    { key: 'create', label: 'Tạo cảng biển', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => navigate('/Port/create') },
    { key: 'export', label: '', variant: 'subtle' as const, icon: <FileExcelOutlined style={{ color: statusOperational }} />, borderColor: `${statusOperational}80`, color: statusOperational, onClick: () => {} },
  ], [navigate]);

  const columns = useMemo(() => [
    { key: 'stt', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, render: (_: unknown, __: Port, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'portCode', label: 'Mã', dataIndex: 'portCode', width: 140, render: (portCode: string) => <Tag color="cyan">{portCode}</Tag> },
    { key: 'portName', label: 'Tên', dataIndex: 'portName', ellipsis: true },
    { key: 'province', label: 'Tỉnh/thành phố', dataIndex: 'province', ellipsis: true },
    { key: 'viDo', label: 'Vĩ độ', dataIndex: 'viDo', width: 100, render: (v: number) => <span style={{ color: textSecondary }}>{v?.toFixed(4) || '—'}</span> },
    { key: 'kinhDo', label: 'Kinh độ', dataIndex: 'kinhDo', width: 100, render: (v: number) => <span style={{ color: textSecondary }}>{v?.toFixed(4) || '—'}</span> },
    { key: 'area', label: 'Diện tích', dataIndex: 'area', width: 110, render: (v: number) => <span style={{ color: textSecondary }}>{v?.toFixed(2) || '—'}</span> },
    {
      key: 'operationalStatus', label: 'Trạng thái hoạt động', dataIndex: 'operationalStatus', width: 160, align: 'center' as const,
      render: (status: string) => {
        const s = STATUS_STYLE_MAP[status] || { color: textSecondary, label: status };
        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: 500, background: `${s.color}15`, color: s.color }}>{s.label}</span>;
      },
    },
    {
      key: 'approvalStatus', label: 'Trạng thái phê duyệt', dataIndex: 'approvalStatus', width: 170, align: 'center' as const,
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

  const rowActions = useCallback((record: Port) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => navigate(`/Port/${record.id}`) });
    actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => navigate(`/Port/${record.id}`) });
    if (record.approvalStatus === 'DRAFT') {
      actions.push({ key: 'submit', label: 'Gửi duyệt', icon: <SendOutlined />, onClick: () => handleSubmitApproval(record) });
      actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    }
    if (record.approvalStatus === 'PENDING_APPROVAL') {
      actions.push({ key: 'approve1', label: 'Phê duyệt L1', icon: <CheckCircleOutlined />, onClick: () => handleApproveL1(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => handleReject(record), danger: true });
    }
    if (record.approvalStatus === 'APPROVED_L1') {
      actions.push({ key: 'approve2', label: 'Phê duyệt L2', icon: <CheckCircleOutlined />, onClick: () => handleApproveL2(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => handleReject(record), danger: true });
    }
    return actions;
  }, [navigate, handleSubmitApproval, handleDelete, handleApproveL1, handleApproveL2, handleReject]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách cảng biển'} onRetry={fetchData} />;
    if (dataSource.length === 0) {
      if (search || filterMaCang || filterTenCang || filterTinhThanhPho || filterStatus) return <EmptyState description="Không tìm thấy cảng biển nào phù hợp" />;
      return <EmptyState description="Chưa có cảng biển nào" />;
    }
    return <div style={{ overflowX: 'auto' }}>
      <DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} scroll={{ x: 1400 }} />
      <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
    </div>;
  };

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản lý cảng biển' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>
    </div>
  );
}
