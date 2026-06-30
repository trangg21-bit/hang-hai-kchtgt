import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Select,
  Input,
  Row,
  Col,
  Modal,
  Form,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate, useParams } from 'react-router-dom';
import { groupService } from '../../services/groupService';
import type { GroupMember, AddMemberPayload } from '../../services/groupService';
import { userService } from '../../services/userService';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import dayjs from 'dayjs';
import FormField from '../../components/FormField';

const ROLE_MAP: Record<string, { color: string; label: string }> = {
  admin: { color: 'red', label: 'Quản lý' },
  member: { color: 'blue', label: 'Thành viên' },
  viewer: { color: 'default', label: 'Xem' },
};

export default function GroupMembers() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();

  const [dataSource, setDataSource] = useState<GroupMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string | undefined>();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await userService.list({ pageSize: 100 });
        setUserOptions(
          res.data.map((u) => ({
            value: u.id,
            label: `${u.fullName} (${u.username})`,
          }))
        );
      } catch (err) {
        console.error('Failed to load users for dropdown:', err);
      }
    };
    void loadUsers();
  }, []);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const members = await groupService.getMembers(id!);
      let filtered = [...members];

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.fullName.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q),
        );
      }
      if (filterRole) {
        filtered = filtered.filter((m) => m.role === filterRole);
      }

      const start = (page - 1) * pageSize;
      setDataSource(filtered.slice(start, start + pageSize));
      setTotal(filtered.length);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách thành viên'));
    } finally {
      setIsLoading(false);
    }
  }, [id, page, pageSize, search, filterRole]);

  useEffect(() => { void fetchMembers(); }, [fetchMembers]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRemove = useCallback(
    async (member: GroupMember) => {
      Modal.confirm({
        title: 'Xác nhận xóa thành viên',
        content: `Bạn có chắc chắn muốn xóa "${member.fullName}" khỏi nhóm này?`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await groupService.removeMember(id!, member.userId);
            toast.success('Đã xóa thành viên khỏi nhóm');
            fetchMembers();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
          }
        },
      });
    },
    [id, fetchMembers],
  );

  const handleAddMember = useCallback(async () => {
    try {
      const values = await form.validateFields();
      await groupService.addMember(id!, {
        userId: values.userId,
        role: values.role,
      });
      toast.success('Đã thêm thành viên vào nhóm');
      setAddModalOpen(false);
      form.resetFields();
      fetchMembers();
    } catch {
      // validation error
    }
  }, [id, form, fetchMembers]);

  const columns: ColumnsType<GroupMember> = [
    {
      title: '#',
      width: 60,
      render: (_, __, idx) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      ellipsis: true,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      ellipsis: true,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 120,
      render: (role: string) => {
        const r = ROLE_MAP[role] || { color: 'default', label: role };
        return <Tag color={r.color}>{r.label}</Tag>;
      },
    },
    {
      title: 'Tham gia từ',
      dataIndex: 'joinedAt',
      width: 160,
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: GroupMember) => (
        <Tooltip title="Xóa khỏi nhóm">
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemove(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/groups')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>Quản lý thành viên</Typography.Title>
        </Space>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, email..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select
                placeholder="Vai trò"
                allowClear
                style={{ width: 150 }}
                value={filterRole}
                onChange={(val) => {
                  setFilterRole(val);
                  setPage(1);
                }}
                options={[
                  { value: 'admin', label: 'Quản lý' },
                  { value: 'member', label: 'Thành viên' },
                  { value: 'viewer', label: 'Xem' },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
              Thêm thành viên
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách thành viên'}
            onRetry={fetchMembers}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState description="Chưa có thành viên nào" />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<GroupMember>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, sz) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} thành viên`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      {/* Add Member Modal */}
      <Modal
        title="Thêm thành viên vào nhóm"
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false);
          form.resetFields();
        }}
        onOk={handleAddMember}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <FormField
            type="select"
            name="userId"
            label="Chọn người dùng"
            required
            placeholder="Tìm và chọn người dùng..."
            options={userOptions}
          />
          <FormField
            type="select"
            name="role"
            label="Vai trò"
            required
            options={[
              { value: 'admin', label: 'Quản lý' },
              { value: 'member', label: 'Thành viên' },
              { value: 'viewer', label: 'Xem' },
            ]}
          />
        </Form>
      </Modal>
    </>
  );
}
