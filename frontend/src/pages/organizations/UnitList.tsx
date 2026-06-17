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
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  BranchesOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Hoạt động' },
  locked: { color: 'red', label: 'Đã khóa' },
  inactive: { color: 'default', label: 'Không hoạt động' },
};

export default function UnitList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrgs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await organizationService.list({ page, pageSize, search: search || undefined, status: filterStatus });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đơn vị'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterStatus]);

  useEffect(() => { void fetchOrgs(); }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (org: Organization) => {
      Modal.confirm({
        title: 'Xác nhận xóa đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn xóa đơn vị "${org.name}"?`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await organizationService.delete(org.id);
            toast.success('Đã xóa đơn vị thành công');
            fetchOrgs();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
          }
        },
      });
    },
    [fetchOrgs],
  );

  const columns = [
    {
      title: '#',
      width: 60,
      render: (_, __, idx: number) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Tên đơn vị',
      dataIndex: 'name',
      ellipsis: true,
      render: (text: string, record: Organization) => (
        <Space>
          <Badge status={record.status === 'active' ? 'success' : record.status === 'locked' ? 'error' : 'default'} />
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Cấp',
      dataIndex: 'level',
      width: 80,
      render: (level: number) => <Tag color="blue">C{level}</Tag>,
    },
    {
      title: 'Đơn vị cha',
      dataIndex: 'parentOrgName',
      width: 160,
      ellipsis: true,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Trụ sở',
      dataIndex: 'address',
      ellipsis: true,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Trưởng đơn vị',
      dataIndex: 'contactPerson',
      ellipsis: true,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Tr. thái',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 160,
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Organization) => (
        <Space size="small">
          <Tooltip title="Xem cây">
            <Button
              type="link"
              size="small"
              icon={<BranchesOutlined />}
              onClick={() => navigate(`/organizations/tree/${record.id}`)}
            />
          </Tooltip>
          {hasPerm('org.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/organizations/${record.id}/edit`)}
              />
            </Tooltip>
          )}
          {hasPerm('org.delete') && (
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
                placeholder="Tìm theo tên, địa chỉ..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 150 }}
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val);
                  setPage(1);
                }}
                options={[
                  { value: 'active', label: 'Hoạt động' },
                  { value: 'locked', label: 'Đã khóa' },
                  { value: 'inactive', label: 'Không hoạt động' },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchOrgs} />
              </Tooltip>
              {hasPerm('org.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/organizations/create')}>
                  Thêm đơn vị
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
            message={error?.message || 'Không thể tải danh sách đơn vị'}
            onRetry={fetchOrgs}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterStatus ? 'Không tìm thấy đơn vị' : 'Chưa có đơn vị nào'}
            ctaText="Thêm đơn vị đầu tiên"
            onCta={() => navigate('/organizations/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Organization>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} đơn vị`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
