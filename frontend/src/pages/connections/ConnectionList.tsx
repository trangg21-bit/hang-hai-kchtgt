import { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Tooltip,
  Progress,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { connectionService } from '../../services/connectionService';
import type { Connection } from '../../services/connectionService';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  healthy: { color: 'green', label: 'Khỏe mạnh', icon: <CheckCircleOutlined /> },
  degraded: { color: 'orange', label: 'Suy giảm', icon: <WarningOutlined /> },
  down: { color: 'red', label: 'Ngừng hoạt động', icon: <CloseCircleOutlined /> },
  unknown: { color: 'default', label: 'Chưa rõ', icon: <ThunderboltOutlined /> },
};

const TYPE_MAP: Record<string, { color: string; label: string }> = {
  rest: { color: 'blue', label: 'REST' },
  soap: { color: 'purple', label: 'SOAP' },
  grpc: { color: 'cyan', label: 'gRPC' },
  file: { color: 'orange', label: 'FTP' },
  mq: { color: 'magenta', label: 'MQ' },
};

export default function ConnectionList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<Connection[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await connectionService.list({
        page,
        pageSize,
        search: search || undefined,
        type: filterType,
        status: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách kết nối'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterType, filterStatus]);

  useEffect(() => { void fetchConnections(); }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (conn: Connection) => {
      Modal.confirm({
        title: 'Xác nhận xóa kết nối',
        content: `Bạn có chắc chắn muốn xóa kết nối "${conn.name}"?`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await connectionService.delete(conn.id);
            toast.success('Đã xóa kết nối');
            fetchConnections();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
          }
        },
      });
    },
    [fetchConnections],
  );

  const columns = [
    { title: '#', width: 60, render: (_, __, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Tên',
      dataIndex: 'name',
      ellipsis: true,
      render: (text: string, record: Connection) => (
        <Space>
          {STATUS_MAP[record.status]?.icon}
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 100,
      render: (type: string) => {
        const t = TYPE_MAP[type] || { color: 'default', label: type };
        return <Tag color={t.color}>{t.label}</Tag>;
      },
    },
    {
      title: 'URL',
      dataIndex: 'url',
      ellipsis: true,
      render: (text: string) => (
        <Typography.Text copyable={{ text }} style={{ fontSize: 13 }}>{text}</Typography.Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status, icon: null };
        return (
          <Space>
            {s.icon}
            <Tag color={s.color}>{s.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      width: 120,
      render: (uptime: number) => <Progress percent={Math.round(uptime)} size="small" status={uptime > 95 ? 'normal' : uptime > 80 ? 'exception' : 'exception'} />,
    },
    {
      title: 'Phản hồi',
      dataIndex: 'responseTime',
      width: 120,
      render: (rt: number) => rt ? `${rt}ms` : '—',
    },
    {
      title: 'Kiểm tra cuối',
      dataIndex: 'lastCheckedAt',
      width: 180,
      render: (text?: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Connection) => (
        <Space size="small">
          <Tooltip title="Kiểm tra sức khỏe">
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => navigate(`/connections/${record.id}/health`)}
            />
          </Tooltip>
          {hasPerm('connection.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/connections/${record.id}/edit`)}
              />
            </Tooltip>
          )}
          {hasPerm('connection.delete') && (
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, URL..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select placeholder="Loại" allowClear style={{ width: 140 }} value={filterType} onChange={(val) => { setFilterType(val); setPage(1); }} options={[
                { value: 'rest', label: 'REST' },
                { value: 'soap', label: 'SOAP' },
                { value: 'grpc', label: 'gRPC' },
                { value: 'file', label: 'FTP' },
                { value: 'mq', label: 'MQ' },
              ]} />
              <Select placeholder="Trạng thái" allowClear style={{ width: 160 }} value={filterStatus} onChange={(val) => { setFilterStatus(val); setPage(1); }} options={[
                { value: 'healthy', label: 'Khỏe mạnh' },
                { value: 'degraded', label: 'Suy giảm' },
                { value: 'down', label: 'Ngừng hoạt động' },
                { value: 'unknown', label: 'Chưa rõ' },
              ]} />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchConnections} />
              </Tooltip>
              {hasPerm('connection.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/connections/create')}>
                  Thêm kết nối
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách kết nối'}
            onRetry={fetchConnections}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterType ? 'Không tìm thấy kết nối' : 'Chưa có kết nối nào'}
            ctaText="Thêm kết nối đầu tiên"
            onCta={() => navigate('/connections/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Connection>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} kết nối`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
