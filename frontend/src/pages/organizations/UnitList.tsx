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
  Tree,
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

  const openCreateChildModal = useCallback((parentOrg: Organization) => {
    setEditingOrg(null);
    form.resetFields();
    form.setFieldsValue({
      parentId: parentOrg.id,
      type: 'CUC'
    });
    setModalOpen(true);
  }, [form]);

  const fetchOrgs = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Fetch full list once to get all parent dropdown options and base data
      const allRes = await organizationService.list({ page: 1, pageSize: 9999 });
      const fullList = allRes.data || [];
      setAllOrgs(fullList);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đơn vị'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
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

  const buildTreeData = useCallback((orgs: Organization[], parentId?: string): any[] => {
    return orgs
      .filter((o) => parentId ? o.parentId === parentId : !o.parentId)
      .sort((a, b) => {
        const levelDiff = (a.level || 1) - (b.level || 1);
        if (levelDiff !== 0) return levelDiff;
        return a.name.localeCompare(b.name, 'vi');
      })
      .map((org) => {
        return {
          key: org.id,
          title: (
            <Space size={8}>
              <Typography.Text strong>{org.name}</Typography.Text>
              {org.code && <Typography.Text type="secondary" style={{ fontSize: 12 }}>({org.code})</Typography.Text>}
              <Tag color="blue">C{org.level}</Tag>
              <Tag color={STATUS_MAP[org.status]?.color || 'default'}>
                {STATUS_MAP[org.status]?.label || org.status}
              </Tag>
              
              <Space size={4} style={{ marginLeft: 16 }}>
                {hasPerm('org.edit') && (
                  <Tooltip title="Sửa">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => { e.stopPropagation(); openEditModal(org); }}
                      style={{ color: '#1890ff', padding: '0 4px', height: 'auto' }}
                    />
                  </Tooltip>
                )}
                {hasPerm('org.create') && (
                  <Tooltip title="Thêm đơn vị con">
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={(e) => { e.stopPropagation(); openCreateChildModal(org); }}
                      style={{ color: '#52c41a', padding: '0 4px', height: 'auto' }}
                    />
                  </Tooltip>
                )}
                {hasPerm('org.edit') && (org.status === 'draft' || org.status === 'rejected') && (
                  <Tooltip title="Trình duyệt">
                    <Button
                      type="text"
                      size="small"
                      icon={<SendOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleSubmitApproval(org); }}
                      style={{ color: '#1890ff', padding: '0 4px', height: 'auto' }}
                    />
                  </Tooltip>
                )}
                {hasPerm('org.approve') && org.status === 'pending' && (
                  <>
                    <Tooltip title="Phê duyệt">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleApprove(org); }}
                        style={{ color: '#52c41a', padding: '0 4px', height: 'auto' }}
                      />
                    </Tooltip>
                    <Tooltip title="Từ chối">
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleReject(org); }}
                        style={{ color: '#ff4d4f', padding: '0 4px', height: 'auto' }}
                      />
                    </Tooltip>
                  </>
                )}
                {hasPerm('org.delete') && (
                  <Tooltip title="Xóa">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleDelete(org); }}
                      style={{ padding: '0 4px', height: 'auto' }}
                    />
                  </Tooltip>
                )}
              </Space>
            </Space>
          ),
          children: buildTreeData(orgs, org.id)
        };
      });
  }, [hasPerm, openEditModal, openCreateChildModal, handleSubmitApproval, handleApprove, handleReject, handleDelete]);

  const getFilteredOrgs = useCallback(() => {
    if (!search && !filterStatus) return allOrgs;
    
    const matchedIds = new Set<string>();
    allOrgs.forEach(o => {
      const matchesSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || (o.address || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !filterStatus || o.status.toLowerCase() === filterStatus.toLowerCase();
      if (matchesSearch && matchesStatus) {
        matchedIds.add(o.id);
      }
    });
    
    const resultIds = new Set<string>();
    const addNodeAndAncestors = (org: Organization) => {
      if (resultIds.has(org.id)) return;
      resultIds.add(org.id);
      if (org.parentId) {
        const parent = allOrgs.find(o => o.id === org.parentId);
        if (parent) {
          addNodeAndAncestors(parent);
        }
      }
    };
    
    allOrgs.forEach(o => {
      if (matchedIds.has(o.id)) {
        addNodeAndAncestors(o);
      }
    });
    
    return allOrgs.filter(o => resultIds.has(o.id));
  }, [allOrgs, search, filterStatus]);

  const filteredOrgs = getFilteredOrgs();

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
                onChange={(val) => setFilterStatus(val)}
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
        {isLoading && <LoadingSkeleton rows={8} type="card" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách đơn vị'}
            onRetry={fetchOrgs}
          />
        )}
        {!isLoading && !isError && filteredOrgs.length === 0 && (
          <EmptyState
            description={search || filterStatus ? 'Không tìm thấy đơn vị' : 'Chưa có đơn vị nào'}
            ctaText="Thêm đơn vị đầu tiên"
            onCta={openCreateModal}
          />
        )}
        {!isLoading && !isError && filteredOrgs.length > 0 && (
          <Tree
            treeData={buildTreeData(filteredOrgs)}
            defaultExpandedAll
            showLine
            showIcon={false}
          />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingOrg ? 'Sửa đơn vị' : 'Thêm mới đơn vị'}
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
