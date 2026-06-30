import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  InputNumber,
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
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { organizationService } from '../../services/organizationService';
import type { Organization, CreateOrganizationPayload, UpdateOrganizationPayload } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: 'Bản nháp' },
  pending: { color: 'orange', label: 'Chờ duyệt' },
  approved: { color: 'green', label: 'Đã phê duyệt' },
  rejected: { color: 'red', label: 'Bị từ chối' },
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
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [form] = Form.useForm();
  const selectedType = Form.useWatch('type', form);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrgs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Fetch full list once to get all parent dropdown options and base data
      const allRes = await organizationService.list({ page: 1, pageSize: 9999 });
      const fullList = allRes.data || [];
      setAllOrgs(fullList);

      // Apply search and status filter locally for list view
      let filtered = [...fullList];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (o) => o.name.toLowerCase().includes(q) || (o.address || "").toLowerCase().includes(q)
        );
      }
      if (filterStatus) {
        filtered = filtered.filter(
          (o) => o.status.toLowerCase() === filterStatus.toLowerCase()
        );
      }

      const start = (page - 1) * pageSize;
      setDataSource(filtered.slice(start, start + pageSize));
      setTotal(filtered.length);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đơn vị'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterStatus]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

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
    setEditingOrg(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (org: Organization) => {
      setEditingOrg(org);
      form.setFieldsValue({
        name: org.name,
        code: org.code,
        parentId: org.parentId,
        type: org.type,
        address: org.address,
        phone: org.phone,
        contactPerson: org.contactPerson,
        contactPhone: org.contactPhone,
        coefficient: org.coefficient,
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const targetParentId = values.type === 'TCT' ? undefined : values.parentId;

      if (editingOrg) {
        const payload: UpdateOrganizationPayload = {
          name: values.name,
          code: values.code,
          parentId: targetParentId,
          type: values.type,
          address: values.address,
          phone: values.phone,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          coefficient: values.coefficient,
        };
        await organizationService.update(editingOrg.id, payload);
        toast.success('Đã cập nhật đơn vị');
      } else {
        const payload: CreateOrganizationPayload = {
          name: values.name,
          code: values.code,
          parentId: targetParentId,
          type: values.type,
          address: values.address,
          phone: values.phone,
          contactPerson: values.contactPerson,
          contactPhone: values.contactPhone,
          coefficient: values.coefficient,
        };
        await organizationService.create(payload);
        toast.success('Đã tạo đơn vị mới');
      }
      setModalOpen(false);
      fetchOrgs();
    } catch {
      // validation error — antd shows errors inline
    } finally {
      setSubmitting(false);
    }
  }, [editingOrg, form, fetchOrgs]);

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

  const handleSubmitApproval = useCallback(
    async (org: Organization) => {
      Modal.confirm({
        title: 'Xác nhận trình duyệt đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có muốn gửi yêu cầu phê duyệt cho đơn vị "${org.name}"?`,
        okText: 'Trình duyệt',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await organizationService.submit(org.id);
            toast.success('Đã trình phê duyệt đơn vị thành công');
            fetchOrgs();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Trình duyệt thất bại');
          }
        },
      });
    },
    [fetchOrgs],
  );

  const handleApprove = useCallback(
    async (org: Organization) => {
      Modal.confirm({
        title: 'Xác nhận phê duyệt đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn phê duyệt đơn vị "${org.name}"?`,
        okText: 'Phê duyệt',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await organizationService.approve(org.id);
            toast.success('Đã phê duyệt đơn vị thành công');
            fetchOrgs();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
          }
        },
      });
    },
    [fetchOrgs],
  );

  const handleReject = useCallback(
    async (org: Organization) => {
      let comments = '';
      Modal.confirm({
        title: 'Xác nhận từ chối đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>Bạn có chắc chắn muốn từ chối đơn vị "{org.name}"?</p>
            <Input
              placeholder="Nhập lý do từ chối (tùy chọn)"
              onChange={(e) => { comments = e.target.value; }}
              style={{ marginTop: 10 }}
            />
          </div>
        ),
        okText: 'Từ chối',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await organizationService.reject(org.id, comments);
            toast.success('Đã từ chối đơn vị');
            fetchOrgs();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
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
      render: (text: string, record: Organization) => (
        <Space>
          <Badge status={record.status === 'approved' ? 'success' : record.status === 'rejected' ? 'error' : 'default'} />
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
      title: 'Hệ số',
      dataIndex: 'coefficient',
      width: 100,
      render: (val?: number) => val !== undefined ? val.toFixed(2) : '—',
    },
    {
      title: 'Đơn vị cha',
      dataIndex: 'parentOrgName',
      width: 200,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Trụ sở',
      dataIndex: 'address',
      width: 180,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Trưởng đơn vị',
      dataIndex: 'contactPerson',
      width: 160,
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
      width: 240,
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
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
          )}
          {hasPerm('org.edit') && (record.status === 'draft' || record.status === 'rejected') && (
            <Tooltip title="Trình duyệt">
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmitApproval(record)}
              />
            </Tooltip>
          )}
          {hasPerm('org.approve') && record.status === 'pending' && (
            <>
              <Tooltip title="Phê duyệt">
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(record)}
                />
              </Tooltip>
            </>
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
                  { value: 'draft', label: 'Bản nháp' },
                  { value: 'pending', label: 'Chờ duyệt' },
                  { value: 'approved', label: 'Đã phê duyệt' },
                  { value: 'rejected', label: 'Bị từ chối' },
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
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
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
            onCta={openCreateModal}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Organization>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            onChange={handleTableChange}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, sz) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} đơn vị`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingOrg ? 'Sửa đơn vị' : 'Thêm đơn vị mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        okText={editingOrg ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={600}
        mask={{ closable: false }}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="name"
              label="Tên đơn vị"
              rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}
            >
              <Input placeholder="vd: Phòng Kỹ thuật" />
            </Form.Item>

            <Form.Item
              name="code"
              label="Mã đơn vị"
              rules={[{ required: true, message: 'Vui lòng nhập mã đơn vị' }]}
            >
              <Input placeholder="vd: KT01" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Loại đơn vị"
              rules={[{ required: true, message: 'Vui lòng chọn loại đơn vị' }]}
            >
              <Select
                placeholder="Chọn loại đơn vị"
                options={[
                  { value: 'TCT', label: 'Tổng cục' },
                  { value: 'CUC', label: 'Cục' },
                  { value: 'CHI_CUC', label: 'Chi cục' },
                  { value: 'CANG_VU', label: 'Cảng vụ' },
                ]}
              />
            </Form.Item>

            {selectedType !== 'TCT' && (
              <Form.Item
                name="parentId"
                label="Đơn vị cha"
              >
                <Select
                  placeholder="Chọn đơn vị cha (tùy chọn)"
                  allowClear
                  options={allOrgs
                    .filter((o) => !editingOrg || o.id !== editingOrg.id)
                    .map((o) => ({
                      value: o.id,
                      label: o.name,
                    }))}
                />
              </Form.Item>
            )}

            <Form.Item
              name="address"
              label="Trụ sở"
            >
              <Input placeholder="Địa chỉ trụ sở (tùy chọn)" />
            </Form.Item>

            <Form.Item
              name="coefficient"
              label="Hệ số"
              rules={[
                { required: true, message: 'Vui lòng nhập hệ số' },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null) return Promise.resolve();
                    if (value <= 0) {
                      return Promise.reject(new Error('Hệ số phải lớn hơn 0'));
                    }
                    const parts = String(value).split('.');
                    if (parts[1] && parts[1].length > 2) {
                      return Promise.reject(new Error('Hệ số tối đa 2 chữ số thập phân'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} step={0.1} placeholder="VD: 1.00" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="contactPerson"
                  label="Trưởng đơn vị"
                >
                  <Input placeholder="Tên người phụ trách (tùy chọn)" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="contactPhone"
                  label="Số điện thoại"
                  rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}
                >
                  <Input placeholder="0901234567" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
