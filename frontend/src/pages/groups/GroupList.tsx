import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Modal, Form, Input, Spin, Button, Select, TreeSelect, Descriptions, Tree, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, ExclamationCircleOutlined, EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermissionStore } from '../../store/permissionStore';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import { groupService } from '../../services/groupService';
import type { Group, CreateGroupPayload, UpdateGroupPayload, GroupRole } from '../../services/groupService';
import { roleService } from '../../services/roleService';
import { organizationService } from '../../services/organizationService';
import type { Role } from '../../types/role';
import { actionPrimary, textSecondary, statusDraft, statusCritical, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, cardStyle, radiusMd, radiusPill, borderDefault, spaceFormField, spaceMd, spaceSm, statusOperational } from '../../tokens';
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
  const [filterMyGroups, setFilterMyGroups] = useState(false);
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
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [permissionGroup, setPermissionGroup] = useState<Group | null>(null);
  const [permissionRoles, setPermissionRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [orgTree, setOrgTree] = useState<any[]>([]);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await groupService.list({ page, pageSize, search: search || undefined, status: filterStatus, groupType: filterGroupType, myGroups: filterMyGroups });
      setDataSource(res.data); setTotal(res.total);
      
      // Update counts based on backend stats
      setCountActive(res.activeCount);
      setCountInactive(res.inactiveCount);
    } catch (err: unknown) { setIsError(true); setError(err instanceof Error ? err : new Error('Không thể tải danh sách nhóm')); }
    finally { setIsLoading(false); }
  }, [page, pageSize, search, filterStatus, filterGroupType, filterMyGroups]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        const buildOrgTree = (nodes: any[]): any[] => {
          const map = new Map<string, any>();
          const roots: any[] = [];
          nodes.forEach((org) => {
            map.set(org.id, { title: org.name, value: org.id, parentId: org.parentId, children: [] });
          });
          nodes.forEach((org) => {
            const node = map.get(org.id);
            if (org.parentId && map.has(org.parentId)) {
              map.get(org.parentId).children.push(node);
            } else {
              roots.push(node);
            }
          });
          return roots;
        };
        setOrgTree(buildOrgTree(orgs));
      } catch (_) { /* silently ignore */ }
    })();
  }, []);


  const totalAll = countActive + countInactive;

  const handleViewDetail = useCallback((group: Group) => {
    setDetailGroup(group);
  }, []);

  const openCreateModal = useCallback(() => { setEditingGroup(null); form.resetFields(); form.setFieldsValue({ status: 'active' }); setModalOpen(true); }, [form]);

  const openEditModal = useCallback((group: Group) => {
    setEditingGroup(group);
    form.setFieldsValue({ name: group.name, code: group.code, groupType: group.groupType, description: group.description, status: group.status, organizationId: group.organizationId });
    setModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields(); setSubmitting(true);
      if (editingGroup) {
        const payload: UpdateGroupPayload = { name: values.name, code: values.code, groupType: values.groupType, description: values.description, status: values.status, organizationId: values.organizationId };
        await groupService.update(editingGroup.id, payload);
        toast.success('Đã cập nhật nhóm');
      } else {
        const payload: CreateGroupPayload = { name: values.name, code: values.code, groupType: values.groupType, description: values.description, status: values.status, organizationId: values.organizationId };
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

  const handleLock = useCallback((group: Group) => {
    const actionLabel = group.status === 'active' ? 'khóa' : 'mở khóa';
    confirm({
      title: `Xác nhận ${actionLabel} nhóm`,
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn ${actionLabel} nhóm "${group.name}"?`,
      okText: group.status === 'active' ? 'Khóa nhóm' : 'Mở khóa nhóm',
      okType: 'primary',
      cancelText: 'Hủy',
      onOk: async () => {
        try { await groupService.lock(group.id); toast.success(`Đã ${actionLabel} nhóm`); fetchGroups(); }
        catch (err: unknown) { toast.error(err instanceof Error ? err.message : `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} nhóm thất bại`); }
      },
    });
  }, [fetchGroups]);

  const openPermissionModal = useCallback(async (group: Group) => {
    setPermissionGroup(group);
    setPermissionSearch('');
    setPermissionLoading(true);
    try {
      const [roles, assigned] = await Promise.all([
        roleService.listActive(),
        groupService.getPermissions(group.id),
      ]);
      setPermissionRoles(roles.filter((role) => role.id && role.name));
      setSelectedRoleIds(assigned.map((role: GroupRole) => role.id));
    } catch (err: unknown) {
      setPermissionRoles([]);
      setSelectedRoleIds([]);
      toast.error(err instanceof Error ? err.message : 'Không thể tải phân quyền của nhóm');
    } finally {
      setPermissionLoading(false);
    }
  }, []);

  const handlePermissionSave = useCallback(async () => {
    if (!permissionGroup) return;
    setPermissionSaving(true);
    try {
      await groupService.updatePermissions(permissionGroup.id, selectedRoleIds);
      toast.success('Đã cập nhật phân quyền cho nhóm');
      setPermissionGroup(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật phân quyền thất bại');
    } finally {
      setPermissionSaving(false);
    }
  }, [permissionGroup, selectedRoleIds]);



  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(typeof values.search === 'string' ? values.search.trim() : values.search || ''); setFilterStatus(values.status || undefined); setFilterGroupType(values.groupType || undefined); setFilterMyGroups(values.scope === 'myGroups'); setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => { setSearch(''); setFilterStatus(undefined); setFilterGroupType(undefined); setFilterMyGroups(false); setPage(1); }, []);

  const handleTabChange = useCallback((key: string) => {
    setFilterStatus(key === 'all' ? undefined : key); setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => { setPage(p); setPageSize(ps); }, []);

  const rowActions = useCallback((record: Group) => {
    const actions: { key: string; label: string; icon?: ReactNode; onClick: () => void; danger?: boolean }[] = [];
    actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => handleViewDetail(record) });
    actions.push({ key: 'members', label: 'Thành viên', icon: <UserOutlined />, onClick: () => navigate(`/groups/${record.id}/members`) });
    if (hasPerm('group:permission')) {
      actions.push({ key: 'permissions', label: 'Phân quyền', icon: <EditOutlined />, onClick: () => openPermissionModal(record) });
    }
    if (hasPerm('group:edit')) {
      actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    }
    if (hasPerm('group:lock')) {
      const isActive = record.status === 'active';
      actions.push({ key: 'lock', label: isActive ? 'Khóa nhóm' : 'Mở khóa nhóm', icon: isActive ? <LockOutlined /> : <UnlockOutlined />, onClick: () => handleLock(record) });
    }
    if (hasPerm('group:delete')) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    return actions;
  }, [hasPerm, navigate, handleViewDetail, openPermissionModal, openEditModal, handleDelete, handleLock]);

  const permissionTreeData = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    const roles = permissionRoles
      .filter((role) => !query || role.name.toLowerCase().includes(query) || role.code.toLowerCase().includes(query))
      .map((role) => ({
        key: role.id,
        title: (
          <span>
            <Typography.Text strong>{role.name}</Typography.Text>
            <Typography.Text type="secondary" style={{ marginLeft: spaceSm }}>({role.code})</Typography.Text>
          </span>
        ),
      }));
    return [{ key: 'role-root', title: 'Danh sách vai trò', children: roles }];
  }, [permissionRoles, permissionSearch]);

  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'name', label: 'Tên nhóm', dataIndex: 'name', width: 200,
      render: (text: string, record: Group) => (
        <Typography.Text
          strong
          style={{ color: actionPrimary, cursor: 'pointer' }}
          onClick={() => handleViewDetail(record)}
        >
          {text}
        </Typography.Text>
      ) },
    { key: 'code', label: 'Mã nhóm', dataIndex: 'code', width: 120 },
    { key: 'organizationName', label: 'Đơn vị', dataIndex: 'organizationName', width: 180,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'groupType', label: 'Loại nhóm', dataIndex: 'groupType', width: 140, align: 'center' as const,
      render: (text: string) => {
        const typeConfig: Record<string, { label: string; color: string }> = {
          department: { label: 'Phòng ban', color: '#1677ff' },
          project: { label: 'Dự án', color: '#722ed1' },
          custom: { label: 'Tùy chỉnh', color: '#8c8c8c' },
        };
        const config = typeConfig[text] || { label: text, color: '#8c8c8c' };
        return (
          <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${config.color}15`, color: config.color }}>
            {config.label}
          </span>
        );
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
  ], [page, pageSize, handleViewDetail]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách nhóm'} onRetry={fetchGroups} />;
    if (dataSource.length === 0) {
      if (search || filterStatus || filterMyGroups) return <EmptyState description="Không tìm thấy nhóm nào phù hợp" />;
      return <EmptyState description="Chưa có nhóm nào" />;
    }
    return <div style={{ overflowX: 'auto' }}><DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} scroll={{ x: 1000 }} /><Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} /></div>;
  };

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, mô tả...' },
    { key: 'scope', type: 'select' as const, label: 'My Groups', placeholder: 'Chọn phạm vi nhóm',
      options: [{ value: 'all', label: 'Tất cả nhóm' }, { value: 'myGroups', label: 'My Groups (Nhóm tôi tham gia)' }] },
    { key: 'groupType', type: 'select' as const, label: 'Loại nhóm', placeholder: 'Chọn loại',
      options: [{ value: 'department', label: 'Phòng ban' }, { value: 'project', label: 'Dự án' }, { value: 'custom', label: 'Tùy chỉnh' }] },
    { key: 'status', type: 'select' as const, label: 'Trạng thái', placeholder: 'Chọn trạng thái',
      options: [{ value: 'active', label: 'Sử dụng' }, { value: 'inactive', label: 'Không sử dụng' }] },
  ], []);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('group:create')) actions.push({ key: 'create', label: 'Thêm nhóm', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
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

      {/* Modal Xem chi tiết */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Chi tiết nhóm</span>}
        open={!!detailGroup}
        onCancel={() => setDetailGroup(null)}
        footer={[
          <Button
            key="members"
            icon={<UserOutlined />}
            onClick={() => {
              const groupId = detailGroup?.id;
              setDetailGroup(null);
              if (groupId) navigate(`/groups/${groupId}/members`);
            }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
          >
            Thành viên ({detailGroup?.memberCount || 0})
          </Button>,
          hasPerm('group:edit') && (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                const g = detailGroup;
                setDetailGroup(null);
                if (g) openEditModal(g);
              }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
            >
              Sửa nhóm
            </Button>
          ),
          <Button
            key="close"
            onClick={() => setDetailGroup(null)}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault }}
          >
            Đóng
          </Button>,
        ].filter(Boolean)}
        width={640}
      >
        {detailGroup && (
          <Descriptions column={2} bordered size="middle" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Tên nhóm" span={2}>
              <Typography.Text strong style={{ fontSize: fontSizeLg, color: colors.sidebarBg }}>{detailGroup.name}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mã nhóm">
              <code>{detailGroup.code}</code>
            </Descriptions.Item>
            <Descriptions.Item label="Đơn vị">
              {detailGroup.organizationName || <Typography.Text type="secondary">—</Typography.Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Loại nhóm">
              {(() => {
                const typeConfig: Record<string, { label: string; color: string }> = {
                  department: { label: 'Phòng ban', color: '#1677ff' },
                  project: { label: 'Dự án', color: '#722ed1' },
                  custom: { label: 'Tùy chỉnh', color: '#8c8c8c' },
                };
                const config = typeConfig[detailGroup.groupType] || { label: detailGroup.groupType, color: '#8c8c8c' };
                return (
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${config.color}15`, color: config.color }}>
                    {config.label}
                  </span>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Số thành viên">
              <Typography.Text strong>{detailGroup.memberCount || 0} người</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {(() => {
                const color = detailGroup.status === 'active' ? statusOperational : statusDraft;
                const label = STATUS_LABELS[detailGroup.status] || detailGroup.status;
                return (
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}>
                    {label}
                  </span>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {detailGroup.description || <Typography.Text type="secondary">Chưa có mô tả</Typography.Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {detailGroup.createdAt ? dayjs(detailGroup.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật cuối">
              {detailGroup.updatedAt ? dayjs(detailGroup.updatedAt).format('DD/MM/YYYY HH:mm') : '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Modal Phân quyền cho nhóm */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Phân quyền cho nhóm{permissionGroup ? `: ${permissionGroup.name}` : ''}</span>}
        open={!!permissionGroup}
        onCancel={() => setPermissionGroup(null)}
        destroyOnHidden
        width={640}
        mask={{ closable: false }}
        footer={[
          <Button key="cancel" onClick={() => setPermissionGroup(null)} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Đóng</Button>,
          <Button key="save" type="primary" loading={permissionSaving} onClick={handlePermissionSave} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Lưu</Button>,
        ]}
      >
        <Spin spinning={permissionLoading}>
          <Input.Search
            allowClear
            value={permissionSearch}
            onChange={(event) => setPermissionSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mã vai trò"
            style={{ margin: `${spaceMd}px 0` }}
          />
          {permissionRoles.length === 0 && !permissionLoading ? (
            <Empty description="Chưa có vai trò hoạt động" />
          ) : (
            <div style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceMd, maxHeight: 360, overflowY: 'auto' }}>
              <Tree
                checkable
                defaultExpandAll
                treeData={permissionTreeData}
                checkedKeys={selectedRoleIds}
                onCheck={(checkedKeys) => {
                  const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
                  const query = permissionSearch.trim().toLowerCase();
                  const visibleRoleIds = new Set(permissionRoles
                    .filter((role) => !query || role.name.toLowerCase().includes(query) || role.code.toLowerCase().includes(query))
                    .map((role) => role.id));
                  const checkedVisibleIds = keys.map(String).filter((key) => visibleRoleIds.has(key));
                  setSelectedRoleIds((current) => [
                    ...current.filter((id) => !visibleRoleIds.has(id)),
                    ...checkedVisibleIds,
                  ]);
                }}
              />
            </div>
          )}
        </Spin>
      </Modal>

      {/* Modal Thêm/Sửa */}
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
              <Input placeholder="vd: QL01" disabled={!!editingGroup} style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="groupType" {...labelProps('Loại nhóm')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn loại nhóm' }]}>
              <Select placeholder="Chọn loại nhóm" options={[{ value: 'department', label: 'Phòng ban' }, { value: 'project', label: 'Dự án' }, { value: 'custom', label: 'Tùy chỉnh' }]} style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>
            <Form.Item name="organizationId" {...labelProps('Đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: !editingGroup, message: 'Vui lòng chọn đơn vị' }]}>
              <TreeSelect
                placeholder="Chọn đơn vị"
                treeData={orgTree}
                showSearch
                treeDefaultExpandAll={false}
                disabled={!!editingGroup}
                filterTreeNode={(input, node: any) => (node?.title ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                allowClear
                style={{ borderRadius: radiusPill, height: 40 }}
              />
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

