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
  MoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { organizationService } from '../../services/organizationService';
import type { Organization, CreateOrganizationPayload, UpdateOrganizationPayload } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { ScreenHeader, FilterBar, DataTable } from '../../components/list-view';
import {
  actionPrimary, statusOperational, statusCritical, statusAttention,
  dataSecondary,
  spaceFormField, radiusPill, cardStyle, textSecondary, textTertiary,
  fontSizeMd, fontSizeLg, fontWeightBold, spaceSm, spaceMd,
} from '../../tokens';
import { colors } from '../../theme';
const { confirm } = Modal;

interface OrgRow extends Organization {
  indent: number;
  parentName: string;
  sortPath: string;
}

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

export default function UnitList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

  const buildOrgRows = useCallback((orgs: Organization[]): OrgRow[] => {
    const result: OrgRow[] = [];
    const traverse = (parentId: string | undefined, indent: number, parentSortPath: string, parentName: string) => {
      const children = orgs
        .filter(o => parentId ? o.parentId === parentId : !o.parentId)
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      children.forEach((org, idx) => {
        const ownIdx = String(idx).padStart(4, '0');
        const sortPath = parentSortPath ? `${parentSortPath}/${ownIdx}` : ownIdx;
        result.push({ ...org, indent, parentName, sortPath });
        traverse(org.id, indent + 1, sortPath, org.name);
      });
    };
    traverse(undefined, 0, '', '—');
    return result;
  }, []);

  const filteredOrgs = useMemo(() => {
    const rows = buildOrgRows(allOrgs);
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(o =>
      o.name.toLowerCase().includes(q) ||
      (o.code || '').toLowerCase().includes(q)
    );
  }, [allOrgs, search, buildOrgRows]);

  const columns = useMemo(() => [
    { key: 'stt', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{idx + 1}</span> },
    { key: 'name', label: 'Tên đơn vị', dataIndex: 'name', width: 280, align: 'left' as const, render: (_: unknown, record: OrgRow) => (
      <span style={{ paddingLeft: record.indent * 24, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {record.indent > 0 && <span style={{ color: textTertiary, fontSize: 10 }}>└</span>}
        <Typography.Text strong>{record.name}</Typography.Text>
      </span>
    )},
    { key: 'code', label: 'Mã', dataIndex: 'code', width: 120, align: 'left' as const, render: (text: string) => text ? <Typography.Text style={{ fontSize: fontSizeMd, color: textSecondary }}>{text}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'type', label: 'Loại', dataIndex: 'type', width: 120, align: 'center' as const, render: (type: string) => {
      const m: Record<string, {l:string; c:string}> = { TCT:{l:'Tổng cục',c:actionPrimary}, CUC:{l:'Cục',c:statusOperational}, CHI_CUC:{l:'Chi cục',c:statusAttention}, CANG_VU:{l:'Cảng vụ',c:dataSecondary} };
      const i = m[type] || {l:type||'—',c:textTertiary};
      return <span style={{display:'inline-flex',padding:'2px 10px',borderRadius:radiusPill,fontSize:fontSizeMd,fontWeight:fontWeightBold,background:`${i.c}15`,color:i.c}}>{i.l}</span>;
    }},
    { key: 'parent', label: 'Đơn vị cha', dataIndex: 'parentName', width: 180, align: 'left' as const, render: (text: string) => text && text !== '—' ? <Typography.Text>{text}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text> },
  ], []);

  const rowActions = useCallback((record: Organization) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    if (hasPerm('org.edit')) actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    if (hasPerm('org.create')) actions.push({ key: 'addChild', label: 'Thêm đơn vị con', icon: <PlusOutlined />, onClick: () => openCreateChildModal(record) });
    if (hasPerm('org.delete')) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    return actions;
  }, [hasPerm, openEditModal, openCreateChildModal, handleDelete]);

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, mã đơn vị...' },
  ], []);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('org.create')) actions.push({ key: 'create', label: 'Thêm đơn vị', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    actions.push({ key: 'reload', label: '', variant: 'subtle' as const, icon: <ReloadOutlined style={{ color: statusOperational }} />, borderColor: `${statusOperational}80`, color: statusOperational, onClick: fetchOrgs });
    return actions;
  }, [hasPerm, openCreateModal, fetchOrgs, statusOperational]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
  }, []);

  return (
    <>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý đơn vị' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
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
            description={search ? 'Không tìm thấy đơn vị' : 'Chưa có đơn vị nào'}
            ctaText="Thêm đơn vị đầu tiên"
            onCta={openCreateModal}
          />
        )}
        {!isLoading && !isError && filteredOrgs.length > 0 && (
          <DataTable
            columns={columns}
            dataSource={filteredOrgs}
            rowKey="id"
            rowActions={rowActions}
          />
        )}
      </div>

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
              borderColor: 'rgba(11,46,79,0.09)', color: textSecondary }}>
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
