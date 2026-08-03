import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  Modal,
  Form,
  Spin,
  Tree,
  Row,
  Col,
  Input,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { organizationService } from '../../services/organizationService';
import type { Organization, CreateOrganizationPayload, UpdateOrganizationPayload } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { ScreenHeader, FilterBar, StatusTabs } from '../../components/list-view';
import {
  actionPrimary, statusOperational, statusCritical, statusDraft, statusAttention,
  spaceFormField, radiusPill, cardStyle, textSecondary, borderDefault,
  fontSizeMd, fontSizeLg, fontWeightBold, fontWeightMedium, spaceSm, spaceMd,
} from '../../tokens';
import { colors } from '../../theme';
const { confirm } = Modal;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: statusDraft, label: 'Bản nháp' },
  pending: { color: statusAttention, label: 'Chờ duyệt' },
  approved: { color: statusOperational, label: 'Đã phê duyệt' },
  rejected: { color: statusCritical, label: 'Bị từ chối' },
};

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

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

  // ---- Status count computations ----
  const totalCount = useMemo(() => allOrgs.length, [allOrgs]);
  const draftCount = useMemo(() => allOrgs.filter((o) => o.status === 'draft').length, [allOrgs]);
  const pendingCount = useMemo(() => allOrgs.filter((o) => o.status === 'pending').length, [allOrgs]);
  const approvedCount = useMemo(() => allOrgs.filter((o) => o.status === 'approved').length, [allOrgs]);
  const rejectedCount = useMemo(() => allOrgs.filter((o) => o.status === 'rejected').length, [allOrgs]);

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
      confirm({
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
      confirm({
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
      confirm({
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
      confirm({
        title: 'Xác nhận từ chối đơn vị',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>Bạn có chắc chắn muốn từ chối đơn vị "{org.name}"?</p>
            <Input
              placeholder="Nhập lý do từ chối (tùy chọn)"
              onChange={(e) => { comments = e.target.value; }}
              style={{ marginTop: spaceSm }}
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
            <Space size={spaceSm}>
              <Typography.Text strong>{org.name}</Typography.Text>
              {org.code && <Typography.Text type="secondary" style={{ fontSize: fontSizeMd }}>({org.code})</Typography.Text>}
              <Tag color={actionPrimary}>C{org.level}</Tag>
              <Tag color={STATUS_MAP[org.status]?.color || statusDraft}>
                {STATUS_MAP[org.status]?.label || org.status}
              </Tag>

              <Space size={spaceSm} style={{ marginLeft: spaceMd }}>
                {hasPerm('org.edit') && (
                  <Tooltip title="Sửa">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => { e.stopPropagation(); openEditModal(org); }}
                      style={{ color: actionPrimary }}
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
                      style={{ color: statusOperational }}
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
                      style={{ color: actionPrimary }}
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
                        style={{ color: statusOperational }}
                      />
                    </Tooltip>
                    <Tooltip title="Từ chối">
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleReject(org); }}
                        style={{ color: statusCritical }}
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

  // ---- Filter bar helpers ----
  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, địa chỉ...' },
    { key: 'status', type: 'select' as const, label: 'Trạng thái', placeholder: 'Chọn trạng thái', options: [
      { value: 'draft', label: 'Bản nháp' },
      { value: 'pending', label: 'Chờ duyệt' },
      { value: 'approved', label: 'Đã phê duyệt' },
      { value: 'rejected', label: 'Bị từ chối' },
    ]},
  ], []);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('org.create')) actions.push({ key: 'create', label: 'Thêm đơn vị', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    actions.push({ key: 'reload', label: '', variant: 'subtle' as const, icon: <ReloadOutlined style={{ color: statusOperational }} />, borderColor: `${statusOperational}80`, color: statusOperational, onClick: fetchOrgs });
    return actions;
  }, [hasPerm, openCreateModal, fetchOrgs, statusOperational]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterStatus(values.status || undefined);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterStatus(undefined);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setFilterStatus(key === 'all' ? undefined : key);
  }, []);

  return (
    <>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị đơn vị' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, marginBottom: 4, padding: '8px 16px' }}>
        <StatusTabs
          tabs={[
            { key: 'all', label: 'Tất cả', count: totalCount, color: textSecondary, active: !filterStatus },
            { key: 'draft', label: 'Bản nháp', count: draftCount, color: statusDraft, active: filterStatus === 'draft' },
            { key: 'pending', label: 'Chờ duyệt', count: pendingCount, color: statusAttention, active: filterStatus === 'pending' },
            { key: 'approved', label: 'Đã phê duyệt', count: approvedCount, color: statusOperational, active: filterStatus === 'approved' },
            { key: 'rejected', label: 'Bị từ chối', count: rejectedCount, color: statusCritical, active: filterStatus === 'rejected' },
          ]}
          onChange={handleTabChange}
        />
      </div>
      <div style={{ ...cardStyle, padding: '8px 16px', marginTop: 4 }}>
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
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
          {editingOrg ? 'Sửa đơn vị' : 'Thêm mới đơn vị'}
        </span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        width={600}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd,
              borderColor: borderDefault, color: textSecondary }}>
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={handleSubmit} loading={submitting}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd,
              background: actionPrimary, borderColor: actionPrimary }}>
            {editingOrg ? 'Cập nhật' : 'Tạo mới'}
          </Button>,
        ]}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: spaceMd }}
            labelCol={{ style: { padding: 0, marginBottom: 4 } }}
          >
            <Form.Item
              name="name"
              {...labelProps('Tên đơn vị')}
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị' }]}
            >
              <Input placeholder="vd: Phòng Kỹ thuật" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>

            <Form.Item
              name="code"
              {...labelProps('Mã đơn vị')}
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập mã đơn vị' }]}
            >
              <Input placeholder="vd: KT01" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>

            <Form.Item
              name="type"
              {...labelProps('Loại đơn vị')}
              style={{ marginBottom: spaceFormField }}
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
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </Form.Item>

            {selectedType !== 'TCT' && (
              <Form.Item
                name="parentId"
                {...labelProps('Đơn vị cha')}
                style={{ marginBottom: spaceFormField }}
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
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            )}

            <Form.Item
              name="address"
              {...labelProps('Trụ sở')}
              style={{ marginBottom: spaceFormField }}
            >
              <Input placeholder="Địa chỉ trụ sở (tùy chọn)" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>

            <Row gutter={spaceMd}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="contactPerson"
                  {...labelProps('Trưởng đơn vị')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="Tên người phụ trách (tùy chọn)" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="contactPhone"
                  {...labelProps('Số điện thoại')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}
                >
                  <Input placeholder="0901234567" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
