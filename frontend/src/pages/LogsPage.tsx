import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Typography, Badge } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../components/list-view';
import Pagination from '../components/list-view/Pagination';
import { logService, type AccessLogEntry } from '../services/logService';
import { usePermissionStore } from '../store/permissionStore';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import toast from '../components/ToastNotification';
import { statusOperational, statusAttention, statusCritical, statusDraft, actionPrimary, textSecondary, textTertiary, fontSizeMd, fontWeightMedium, dataSea1 } from '../tokens';

const TYPE_TABS = [
  { key: 'access', label: 'Log truy cập', color: dataSea1 },
  { key: 'login', label: 'Log đăng nhập', color: actionPrimary },
  { key: 'error', label: 'Log lỗi', color: statusCritical },
  { key: 'account', label: 'Log tài khoản', color: statusOperational },
  { key: 'configuration', label: 'Log cấu hình', color: statusAttention },
];

const SEVERITY_MAP: Record<string, { color: string; label: string }> = {
  info: { color: actionPrimary, label: 'Thông tin' },
  warning: { color: statusAttention, label: 'Cảnh báo' },
  error: { color: statusCritical, label: 'Lỗi' },
  critical: { color: '#820014', label: 'Nghiêm trọng' },
};

export default function LogsPage() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [activeTab, setActiveTab] = useState('access');
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // For tab counts
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // API call with type
      const res = await logService.listAccessLogs({
        page: page - 1,
        size: pageSize,
        action: filterAction,
        from: dateRange?.[0],
        to: dateRange?.[1],
        ...( { type: activeTab } as any ),
      });
      
      let content = res.content || [];
      if (search) {
        content = content.filter(l => l.username?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()));
      }
      setLogs(content);
      setTotal(res.totalElements || content.length);
      
      setCounts(prev => ({ ...prev, [activeTab]: res.totalElements || content.length }));
    } catch (err) {
      console.error(err);
      setIsError(true);
      toast.error('Không thể tải nhật ký hoạt động');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, activeTab, search, filterAction, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterAction(values.action || undefined);
    setFilterStatus(values.status || undefined);
    if (values.dateRange && values.dateRange.length === 2) {
      setDateRange([values.dateRange[0].startOf('day').toISOString(), values.dateRange[1].endOf('day').toISOString()]);
    } else {
      setDateRange(null);
    }
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterAction(undefined);
    setFilterStatus(undefined);
    setDateRange(null);
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const handleExport = useCallback(() => {
    toast.info('Đang xuất dữ liệu CSV, quá trình này có thể mất vài phút...');
  }, []);

  const columns = useMemo(() => [
    {
      key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span>
    },
    {
      key: 'createdAt', label: 'Thời gian', dataIndex: 'createdAt', width: 140,
      render: (text: string) => <span style={{ fontSize: fontSizeMd }}>{dayjs(text).format('DD/MM/YYYY HH:mm:ss')}</span>
    },
    {
      key: 'severity', label: 'Mức độ', dataIndex: 'severity', width: 110, align: 'center' as const,
      render: (severity: string = 'info') => {
        const config = SEVERITY_MAP[severity] || SEVERITY_MAP.info;
        return (
          <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: fontWeightMedium, background: `${config.color}15`, color: config.color }}>
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'action', label: 'Hành động', dataIndex: 'action', width: 150,
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>
    },
    {
      key: 'user', label: 'Tài khoản / Đơn vị', width: 200,
      render: (_: any, record: AccessLogEntry) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography.Text strong>{record.username} {record.email ? `(${record.email})` : ''}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.organization || '—'}</Typography.Text>
        </div>
      )
    },
    {
      key: 'network', label: 'IP & Session', width: 160,
      render: (_: any, record: AccessLogEntry) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography.Text style={{ fontFamily: 'monospace' }}>{record.ipAddress}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis title={record.sessionId}>SSID: {record.sessionId || '—'}</Typography.Text>
        </div>
      )
    },
    {
      key: 'status', label: 'Kết quả', dataIndex: 'status', width: 100, align: 'center' as const,
      render: (status: string) => {
        const isSuccess = status === 'SUCCESS';
        return <Badge status={isSuccess ? 'success' : 'error'} text={isSuccess ? 'Thành công' : 'Thất bại'} />;
      }
    },
    {
      key: 'detail', label: 'Chi tiết', dataIndex: 'detail', width: 250,
      render: (text: string, record: AccessLogEntry) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography.Text ellipsis={{ tooltip: text }}>{text || record.targetResource || '—'}</Typography.Text>
          {record.requestPath && <Typography.Text type="secondary" style={{ fontSize: 11 }} ellipsis title={record.requestPath}>{record.requestPath}</Typography.Text>}
        </div>
      )
    }
  ], [page, pageSize]);

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tên đăng nhập, email...' },
    { key: 'action', type: 'select' as const, label: 'Hành động', placeholder: 'Tất cả hành động', options: [
      { value: 'LOGIN', label: 'Đăng nhập' },
      { value: 'LOGOUT', label: 'Đăng xuất' },
      { value: 'CREATE', label: 'Thêm mới' },
      { value: 'UPDATE', label: 'Cập nhật' },
      { value: 'DELETE', label: 'Xóa' },
      { value: 'EXPORT', label: 'Xuất dữ liệu' }
    ] },
    { key: 'dateRange', type: 'dateRange' as const, label: 'Thời gian', placeholder: ['Từ ngày', 'Đến ngày'] as [string, string] },
    { key: 'status', type: 'select' as const, label: 'Kết quả', placeholder: 'Tất cả kết quả', options: [
      { value: 'SUCCESS', label: 'Thành công' },
      { value: 'FAILED', label: 'Thất bại' }
    ] }
  ], []);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('log.export')) {
      actions.push({ key: 'export', label: 'Xuất CSV', variant: 'primary' as const, icon: <DownloadOutlined />, onClick: handleExport });
    }
    return actions;
  }, [hasPerm, handleExport]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={10} />;
    if (isError) return <ErrorState message="Không thể tải nhật ký hoạt động. Vui lòng thử lại sau." onRetry={fetchLogs} />;
    if (logs.length === 0) {
      if (search || filterAction || dateRange) return <EmptyState description="Không tìm thấy log nào phù hợp với điều kiện lọc" />;
      return <EmptyState description="Chưa có dữ liệu log" />;
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable columns={columns} dataSource={logs} rowKey="id" scroll={{ x: 1300 }} />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} />
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Nhật ký hệ thống' }]} actions={headerActions} />
      
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      
      <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 16px', background: '#fff', borderRadius: 8 }}>
        <StatusTabs
          tabs={TYPE_TABS.map(tab => ({
            key: tab.key,
            label: tab.label,
            count: counts[tab.key] || 0,
            color: tab.color,
            active: activeTab === tab.key
          }))}
          onChange={handleTabChange}
        />
      </div>
      
      <div style={{ background: '#fff', padding: '8px 16px', borderRadius: 8 }}>
        {renderContent()}
      </div>
    </div>
  );
}
