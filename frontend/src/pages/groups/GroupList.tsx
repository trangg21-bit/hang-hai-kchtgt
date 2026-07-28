import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Modal, Form, Input, Spin, Button, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermissionStore } from '../../store/permissionStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import { groupService } from '../../services/groupService';
import type { Group, CreateGroupPayload, UpdateGroupPayload } from '../../services/groupService';
import { actionPrimary, textSecondary, statusCritical, statusDraft, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, cardStyle, radiusPill, borderDefault, spaceFormField, statusOperational } from '../../tokens';
import { colors } from '../../theme';
import toast from '../../components/ToastNotification';
const { confirm } = Modal;

const STATUS_LABELS: Record<string, string> = { active: 'Sử dụng', inactive: 'Không sử dụng' };

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

export default function GroupList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterGroupType, setFilterGroupType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [countActive, setCountActive] = useState(0);
  const [countInactive, setCountInactive] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await groupService.list({ page, pageSize, search: search || undefined, status: filterStatus, groupType: filterGroupType });
      setDataSource(res.data); setTotal(res.total);
      
      // Update counts based on backend stats
      setCountActive(res.activeCount);
      setCountInactive(res.inactiveCount);
    } catch (err: unknown) { setIsError(true); setError(err instanceof Error ? err : new Error('Không thể tải danh sách nhóm')); }
    finally { setIsLoading(false); }
  }, [page, pageSize, search, filterStatus, filterGroupType]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);


  const totalAll = countActive + countInactive;

  const openCreateModal = useCallback(() => { setEditingGroup(null); form.resetFields(); form.setFieldsValue({ status: 'active' }); setModalOpen(true); }, [form]);

  const openEditModal = useCallback((group: Group) => {
    setEditingGroup(group);
    form.setFieldsValue({ name: group.name, code: group.code, groupType: group.groupType, description: group.description, status: group.status });
    setModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields(); setSubmitting(true);
      if (editingGroup) {
        const payload: UpdateGroupPayload = { name: values.name, code: values.code, groupType: values.groupType, description: values.description, status: values.status };
        await groupService.update(editingGroup.id, payload);
        toast.success('Đã cập nhật nhóm');
      } else {
        const payload: CreateGroupPayload = { name: values.name, code: values.code, groupType: values.groupType, description: values.description, status: values.status };
        await groupService.create(payload);
        toast.success('Đã tạo nhóm mới');
      }
      setModalOpen(false); fetchGroups();
    } catch (err: any) {
      if (err.errorFields) return;
      toast.error(err?.message || 'Thao tác thất bại');
    } finally { setSubmitting(false); }
  }, [editingGroup, form, fetchGroups]);

  const handleDelete = useCallback((group: Group) => {
    confirm({
      title: 'Xác nhận xóa nhóm',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa nhóm "${group.name}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try { await groupService.delete(group.id); toast.success('Đã xóa nhóm'); fetchGroups(); }
        catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Xóa thất bại'); }
      },
    });
  }, [fetchGroups]);



  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(typeof values.search === 'string' ? values.search.trim() : values.search || ''); setFilterStatus(values.status || undefined); setFilterGroupType(values.groupType || undefined); setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => { setSearch(''); setFilterStatus(undefined); setFilterGroupType(undefined); setPage(1); }, []);

  const handleTabChange = useCallback((key: string) => {
    setFilterStatus(key === 'all' ? undefined : key); setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => { setPage(p); setPageSize(ps); }, []);

  const rowActions = useCallback((record: Group) => {
    const actions: { key: string; label: string; icon?: ReactNode; onClick: () => void; danger?: boolean }[] = [];
    actions.push({ key: 'members', label: 'Thành viên', icon: <UserOutlined />, onClick: () => navigate(`/groups/${record.id}/members`) });
    if (hasPerm('group.edit')) {
      actions.push({ key: 'permissions', label: 'Phân quyền', icon: <EditOutlined />, onClick: () => toast.info('Tính năng phân quyền nhóm đang được phát triển') });
      actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    }
    if (hasPerm('group.delete')) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    return actions;
  }, [hasPerm, navigate, openEditModal, handleDelete]);

  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'name', label: 'Tên nhóm', dataIndex: 'name', width: 200,
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text> },
    { key: 'code', label: 'Mã nhóm', dataIndex: 'code', width: 120 },
    { key: 'groupType', label: 'Loại nhóm', dataIndex: 'groupType', width: 140, align: 'center' as const,
      render: (text: string) => {
        const typeLabels: Record<string, string> = { department: 'Phòng ban', project: 'Dự án', custom: 'Tùy chỉnh' };
        return <span>{typeLabels[text] || text}</span>;
      } },
    { key: 'description', label: 'Mô tả', dataIndex: 'description', width: 200,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'memberCount', label: 'Thành viên', dataIndex: 'memberCount', width: 120, align: 'center' as const,
      render: (count: number) => <span>{count}</span> },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 140, align: 'center' as const,
      render: (status: string) => {
        const color = status === 'active' ? statusOperational : statusDraft;
        const label = STATUS_LABELS[status] || status;
        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}>{label}</span>;
      } },
    { key: 'updatedAt', label: 'Cập nhật cuối', dataIndex: 'updatedAt', width: 170, align: 'center' as const,
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '—' },
  ], [page, pageSize]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách nhóm'} onRetry={fetchGroups} />;
    if (dataSource.length === 0) {
      if (search || filterStatus) return <EmptyState description="Không tìm thấy nhóm nào phù hợp" />;
      return <EmptyState description="Chưa có nhóm nào" />;
    }
    return <div style={{ overflowX: 'auto' }}><DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} scroll={{ x: 1000 }} /><Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} /></div>;
  };

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, mô tả...' },
    { key: 'groupType', type: 'select' as const, label: 'Loại nhóm', placeholder: 'Chọn loại',
      options: [{ value: 'department', label: 'Phòng ban' }, { value: 'project', label: 'Dự án' }, { value: 'custom', label: 'Tùy chỉnh' }] },
    { key: 'status', type: 'select' as const, label: 'Trạng thái', placeholder: 'Chọn trạng thái',
      options: [{ value: 'active', label: 'Sử dụng' }, { value: 'inactive', label: 'Không sử dụng' }] },
  ], []);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('group.create')) actions.push({ key: 'create', label: 'Thêm nhóm', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    return actions;
  }, [hasPerm, openCreateModal]);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý nhóm' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, marginBottom: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 16px' }}>
        <StatusTabs
          tabs={[
            { key: 'all', label: 'Tất cả', count: totalAll, color: textSecondary, active: !filterStatus },
{ key: 'active', label: 'Sử dụng', count: countActive, color: statusOperational, active: filterStatus === 'active' },
            { key: 'inactive', label: 'Không sử dụng', count: countInactive, color: statusDraft, active: filterStatus === 'inactive' },
          ]}
          onChange={handleTabChange}
        />
      </div>
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingGroup ? 'Sửa nhóm' : 'Thêm nhóm mới'}</span>}
        open={modalOpen} onCancel={() => setModalOpen(false)} destroyOnHidden confirmLoading={submitting} width={600} mask={{ closable: false }}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={handleSubmit} loading={submitting} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>{editingGroup ? 'Cập nhật' : 'Tạo mới'}</Button>,
        ]}
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }} labelCol={{ style: { padding: 0, marginBottom: 4 } }}>
            <Form.Item name="name" {...labelProps('Tên nhóm')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}>
              <Input placeholder="vd: Nhóm Quản lý" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="code" {...labelProps('Mã nhóm')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập mã nhóm' }]}>
              <Input placeholder="vd: QL01" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="groupType" {...labelProps('Loại nhóm')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn loại nhóm' }]}>
              <Select placeholder="Chọn loại nhóm" options={[{ value: 'department', label: 'Phòng ban' }, { value: 'project', label: 'Dự án' }, { value: 'custom', label: 'Tùy chỉnh' }]} style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="status" {...labelProps('Trạng thái')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
              <Select placeholder="Chọn trạng thái" options={[{ value: 'active', label: 'Sử dụng' }, { value: 'inactive', label: 'Không sử dụng' }]} style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="description" {...labelProps('Mô tả')} style={{ marginBottom: spaceFormField }}>
              <Input.TextArea rows={3} placeholder="Mô tả nhóm (tùy chọn)" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}

