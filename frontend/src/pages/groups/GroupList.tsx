import { useState, useCallback } from 'react';
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
  Form,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { groupService } from '../../services/groupService';
import type { Group, CreateGroupPayload, UpdateGroupPayload } from '../../services/groupService';
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

export default function GroupList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await groupService.list({ page, pageSize, search: search || undefined, status: filterStatus });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách nhóm'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterStatus]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleTableChange = useCallback((pag: { current?: number; pageSize?: number }) => {
    setPage(pag.current || 1);
    setPageSize(pag.pageSize || 10);
  }, []);

  // ---- Modal handlers ----
  const openCreateModal = useCallback(() => {
    setEditingGroup(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (group: Group) => {
      setEditingGroup(group);
      form.setFieldsValue({
        name: group.name,
        code: group.code,
        description: group.description,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingGroup) {
        const payload: UpdateGroupPayload = {
          name: values.name,
          code: values.code,
          description: values.description,
        };
        await groupService.update(editingGroup.id, payload);
        toast.success('Đã cập nhật nhóm');
      } else {
        const payload: CreateGroupPayload = {
          name: values.name,
          code: values.code,
          description: values.description,
        };
        await groupService.create(payload);
        toast.success('Đã tạo nhóm mới');
      }
      setModalOpen(false);
      fetchGroups();
    } catch {
      // validation error — antd shows errors inline
    } finally {
      setSubmitting(false);
    }
  }, [editingGroup, form, fetchGroups]);

  const handleDelete = useCallback(
    (group: Group) => {
      Modal.confirm({
        title: 'Xác nhận xóa nhóm',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn xóa nhóm "${group.name}"? Hành động này không thể hoàn tác.`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await groupService.delete(group.id);
            toast.success('Đã xóa nhóm thành công');
            fetchGroups();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
          }
        },
      });
    },
    [fetchGroups],
  );

  const columns: ColumnsType<Group> = [
    {
      title: '#',
      width: 60,
      render: (_, __, idx) => (page - 1) * pageSize + idx + 1,
    },
    {
      title: 'Tên nhóm',
      dataIndex: 'name',
      ellipsis: true,
      render: (text: string, record: Group) => (
        <Space>
          <Badge status={record.status === 'active' ? 'success' : record.status === 'locked' ? 'error' : 'default'} />
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      ellipsis: true,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Thành viên',
      dataIndex: 'memberCount',
      width: 120,
      render: (count: number) => (
        <Space>
          <UserOutlined />
          <Typography.Text>{count}</Typography.Text>
        </Space>
      ),
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
      title: 'Cập nhật cuối',
      dataIndex: 'updatedAt',
      width: 160,
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Group) => (
        <Space size="small">
          <Tooltip title="Xem thành viên">
            <Button
              type="link"
              size="small"
              icon={<ArrowRightOutlined />}
              onClick={() => { /* members page — read-only navigation */ }}
            />
          </Tooltip>
          {hasPerm('group.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
          )}
          {hasPerm('group.delete') && (
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
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, mô tả..."
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
                <Button icon={<ReloadOutlined />} onClick={fetchGroups} />
              </Tooltip>
              {hasPerm('group.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Thêm nhóm
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách nhóm'}
            onRetry={fetchGroups}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterStatus ? 'Không tìm thấy nhóm nào' : 'Chưa có nhóm nào'}
            ctaText="Thêm nhóm đầu tiên"
            onCta={openCreateModal}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Group>
            columns={columns}
            dataSource={dataSource}
            loading={false}
            rowKey="id"
            scroll={{ x: 1000 }}
            onChange={handleTableChange}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p) => setPage(p),
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} nhóm`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingGroup ? 'Sửa nhóm' : 'Thêm nhóm mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        confirmLoading={submitting}
        okText={editingGroup ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
        maskClosable={false}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label="Tên nhóm"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}
            >
              <Input placeholder="vd: Nhóm Quản lý" />
            </Form.Item>

            <Form.Item
              name="code"
              label="Mã nhóm"
              rules={[{ required: true, message: 'Vui lòng nhập mã nhóm' }]}
            >
              <Input placeholder="vd: QL01" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
            >
              <Input.TextArea rows={3} placeholder="Mô tả nhóm (tùy chọn)" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
