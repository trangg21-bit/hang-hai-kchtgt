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
  Modal,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Hoạt động' },
  inactive: { color: 'default', label: 'Không hoạt động' },
  deprecated: { color: 'red', label: 'Ngừng sử dụng' },
};

export default function SymbolList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<Symbol[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSymbols = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await symbolService.list({
        page,
        pageSize,
        search: search || undefined,
        category: filterCategory,
        status: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách biểu tượng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterCategory, filterStatus]);

  useEffect(() => { void fetchSymbols(); }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (symbol: Symbol) => {
      Modal.confirm({
        title: 'Xác nhận xóa biểu tượng',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn xóa biểu tượng "${symbol.name}" (${symbol.code})?`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await symbolService.delete(symbol.id);
            toast.success('Đã xóa biểu tượng');
            fetchSymbols();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
          }
        },
      });
    },
    [fetchSymbols],
  );

  const columns = [
    { title: '#', width: 60, render: (_, __, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã ký hiệu',
      dataIndex: 'code',
      width: 180,
      render: (code: string) => (
        <Tooltip title={code}>
          <Tag
            color="cyan"
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              verticalAlign: 'bottom',
            }}
          >
            {code}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      ellipsis: true,
      render: (text: string, record: Symbol) => (
        <Space>
          <Typography.Text strong>{text}</Typography.Text>
          {record.color && (
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: record.color,
              }}
            />
          )}
        </Space>
      ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      width: 100,
      render: (v?: string) => v ? <Tag>{v}</Tag> : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      width: 120,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 160,
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Symbol) => (
        <Space size="small">
          <Tooltip title="Xem trước">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/symbols/${record.id}/preview`)}
            />
          </Tooltip>
          {hasPerm('symbol.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/symbols/${record.id}/edit`)}
              />
            </Tooltip>
          )}
          {hasPerm('symbol.delete') && (
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
                placeholder="Tìm theo tên, mã, mô tả..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select placeholder="Danh mục" allowClear style={{ width: 150 }} value={filterCategory} onChange={(val) => { setFilterCategory(val); setPage(1); }} options={[
                { value: 'navigation', label: 'Điều hướng' },
                { value: 'road', label: 'Đường' },
                { value: 'position', label: 'Vị trí' },
                { value: 'division', label: 'Phân chia' },
                { value: 'building', label: 'Công trình' },
                { value: 'transport', label: 'Giao thông' },
                { value: 'location', label: 'Địa điểm' },
              ]} />
              <Select placeholder="Trạng thái" allowClear style={{ width: 150 }} value={filterStatus} onChange={(val) => { setFilterStatus(val); setPage(1); }} options={[
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Không hoạt động' },
                { value: 'deprecated', label: 'Ngừng sử dụng' },
              ]} />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchSymbols} />
              </Tooltip>
              {hasPerm('symbol.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/symbols/create')}>
                  Thêm biểu tượng
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
            message={error?.message || 'Không thể tải danh sách biểu tượng'}
            onRetry={fetchSymbols}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterCategory ? 'Không tìm thấy biểu tượng' : 'Chưa có biểu tượng nào'}
            ctaText="Thêm biểu tượng đầu tiên"
            onCta={() => navigate('/symbols/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Symbol>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1180 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} biểu tượng`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
