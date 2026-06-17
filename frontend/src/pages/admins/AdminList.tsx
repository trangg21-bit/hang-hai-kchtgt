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
  Modal,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { adminService } from '../../services/adminService';
import type { Admin } from '../../services/adminService';
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

export default function AdminList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await adminService.list({ page, pageSize, search: search || undefined, status: filterStatus });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách quản trị viên'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterStatus]);

  useEffect(() => { void fetchAdmins(); }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    (admin: Admin) => {
      Modal.confirm({
        title: 'Xác nhận xóa quản trị viên',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn xóa "${admin.fullName}"? Hành động này không thể hoàn tác.`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await adminService.delete(admin.id);
            toast.success('Đã xóa quản trị viên');
            fetchAdmins();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
          }
        },
      });
    },
    [fetchAdmins],
  );

  const columns = [
    { title: '#', width: 60, render: (_, __, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      ellipsis: true,
      render: (text: string, record: Admin) => (
        <Space>
          <Badge status={record.status === 'active' ? 'success' : record.status === 'locked' ? 'error' : 'default'} />
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    { title: 'Tên đăng nhập', dataIndex: 'username', ellipsis: true },
    { title: 'Email', dataIndex: 'email', ellipsis: true },
    {
      title: 'Vai trò',
      dataIndex: 'roleName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLoginAt',
      width: 180,
      render: (text?: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : <Typography.Text type="secondary">Chưa đăng nhập</Typography.Text>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Admin) => (
        <Space size="small">
          <Tooltip title="Nhật ký hoạt động">
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/admins/${record.id}/audit`)}
            />
          </Tooltip>
          {hasPerm('admin.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/admins/${record.id}/edit`)}
              />
            </Tooltip>
          )}
          {hasPerm('admin.delete') && (
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
                placeholder="Tìm theo tên, email, username..."
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
                <Button icon={<ReloadOutlined />} onClick={fetchAdmins} />
              </Tooltip>
              {hasPerm('admin.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admins/create')}>
                  Thêm admin
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
            message={error?.message || 'Không thể tải danh sách quản trị viên'}
            onRetry={fetchAdmins}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterStatus ? 'Không tìm thấy admin' : 'Chưa có quản trị viên nào'}
            ctaText="Thêm admin đầu tiên"
            onCta={() => navigate('/admins/create')}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Admin>
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
              showTotal: (t) => `Tổng ${t} quản trị viên`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>
    </>
  );
}
