import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Typography, Modal, Form, Input, Spin, Button, Select, Tree, Tabs, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, ExclamationCircleOutlined, EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermissionStore } from '../../store/permissionStore';
import { getVisiblePermissionKeys, mergePermissionKeys, usePermissions } from '../../hooks/usePermissions';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import { groupService } from '../../services/groupService';
import type { Group, GroupMember, CreateGroupPayload, UpdateGroupPayload } from '../../services/groupService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { userService } from '../../services/userService';
import { OrgUnitTreeSelect, type OrgUnitTreeOption } from '../../components/org-unit';
import type { Role } from '../../types/role';
import { actionPrimary, textPrimary, textSecondary, statusDraft, statusCritical, statusOperational, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, radiusMd, radiusPill, borderDefault, spaceFormField, spaceMd, spaceSm, primaryButtonStyle, outlineButtonStyle } from '../../tokens';
import { colors } from '../../theme';
import toast from '../../components/ToastNotification';
import { normalizeSearchText } from '../../components/org-unit';
import { ManagementDrawer, ManagementFormField, ManagementFormGrid } from '../../components/management';
import { PERMISSIONS } from '../../constants/permissions';

const { confirm } = Modal;

const STATUS_LABELS: Record<string, string> = { active: 'Sử dụng', inactive: 'Không sử dụng' };
const NON_INHERITABLE_GROUP_PERMISSIONS = new Set(['group:manage', 'admin:all', 'orgunit:scope_all', '*']);

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

export default function GroupList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterOrganizationInput, setFilterOrganizationInput] = useState<string | undefined>();
  const [filterOrganizationId, setFilterOrganizationId] = useState<string | undefined>();
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState('info');
  const [detailMembers, setDetailMembers] = useState<GroupMember[]>([]);
  const [detailMembersTotal, setDetailMembersTotal] = useState(0);
  const [detailMembersLoading, setDetailMembersLoading] = useState(false);
  const [detailMembersError, setDetailMembersError] = useState<string | null>(null);
  const [detailMembersPage, setDetailMembersPage] = useState(1);
  const [detailMembersPageSize, setDetailMembersPageSize] = useState(10);
  const [detailMembersSearchInput, setDetailMembersSearchInput] = useState('');
  const [detailMembersSearch, setDetailMembersSearch] = useState('');
  const [detailMembersReload, setDetailMembersReload] = useState(0);
  const [addMemberDrawerOpen, setAddMemberDrawerOpen] = useState(false);
  const [addMemberOptions, setAddMemberOptions] = useState<{ value: string; label: string }[]>([]);
  const [existingMemberIds, setExistingMemberIds] = useState<string[]>([]);
  const [addMemberSearchLoading, setAddMemberSearchLoading] = useState(false);
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [addMemberForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { tree: rawPermissionTree } = usePermissions();
  const [permissionGroup, setPermissionGroup] = useState<Group | null>(null);
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [orgTree, setOrgTree] = useState<OrgUnitTreeOption[]>([]);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await groupService.list({ page, pageSize, search: search || undefined, status: filterStatus, organizationId: filterOrganizationId });
      setDataSource(res.data); setTotal(res.total);
      
      // Update counts based on backend stats
      setCountActive(res.activeCount);
      setCountInactive(res.inactiveCount);
    } catch (err: unknown) { setIsError(true); setError(err instanceof Error ? err : new Error('Không thể tải danh sách nhóm')); }
    finally { setIsLoading(false); }
  }, [page, pageSize, search, filterStatus, filterOrganizationId]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    if (!detailGroup) {
      setDetailTab('info');
      setDetailMembers([]);
      setDetailMembersPage(1);
      setDetailMembersPageSize(10);
      setDetailMembersSearchInput('');
      setDetailMembersSearch('');
      setAddMemberDrawerOpen(false);
      return;
    }

    setDetailMembersPage(1);
  }, [detailGroup?.id]);

  useEffect(() => {
    if (!detailGroup || detailTab !== 'members') return;

    let cancelled = false;
    setDetailMembersLoading(true);
    setDetailMembersError(null);
    void groupService.getMembers(detailGroup.id, {
      page: detailMembersPage,
      pageSize: detailMembersPageSize,
      search: detailMembersSearch || undefined,
    })
      .then((response) => {
        if (cancelled) return;
        setDetailMembers(response.data);
        setDetailMembersTotal(response.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDetailMembersError(err instanceof Error ? err.message : 'Không thể tải danh sách thành viên');
      })
      .finally(() => {
        if (!cancelled) setDetailMembersLoading(false);
      });

    return () => { cancelled = true; };
  }, [detailGroup?.id, detailMembersPage, detailMembersPageSize, detailMembersReload, detailMembersSearch, detailTab]);

  const fetchExistingMemberIds = useCallback(async () => {
    if (!detailGroup) return [];

    const response = await groupService.getMembers(detailGroup.id, { page: 1, pageSize: 1000 });
    const ids = response.data.map((member) => member.userId);
    setExistingMemberIds(ids);
    return ids;
  }, [detailGroup?.id]);

  const fetchAddMemberOptions = useCallback(async (searchText: string, excludedIds: string[]) => {
    setAddMemberSearchLoading(true);
    try {
      const response = await userService.list({ search: searchText.trim(), pageSize: 50 });
      const excluded = new Set(excludedIds);
      setAddMemberOptions(response.data
        .filter((user) => !excluded.has(user.id))
        .map((user) => ({ value: user.id, label: `${user.fullName} (${user.username})` })));
    } catch (_) {
      setAddMemberOptions([]);
    } finally {
      setAddMemberSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!addMemberDrawerOpen || !detailGroup) return;

    let cancelled = false;
    void (async () => {
      try {
        const ids = await fetchExistingMemberIds();
        if (!cancelled) await fetchAddMemberOptions('', ids);
      } catch (_) {
        if (!cancelled) setAddMemberOptions([]);
      }
    })();

    return () => { cancelled = true; };
  }, [addMemberDrawerOpen, detailGroup, fetchAddMemberOptions, fetchExistingMemberIds]);

  useEffect(() => {
    (async () => {
      try {
        const orgs = await vtsSystemCRUD.getScopedOrgUnitOptions();
        setOrgTree(orgs.map((org) => ({
          id: String(org.id),
          name: org.name,
          code: org.code,
          parentId: org.parentId ? String(org.parentId) : undefined,
        })));
      } catch (_) { /* silently ignore */ }
    })();
  }, []);


  const totalAll = countActive + countInactive;

  const openDetail = useCallback(async (group: Group, tab: 'info' | 'members') => {
    setDetailTab(tab);
    setDetailGroup(group);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await groupService.getById(group.id);
      setDetailGroup(detail);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Không thể tải chi tiết nhóm');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleViewDetail = useCallback((group: Group) => { void openDetail(group, 'info'); }, [openDetail]);

  const handleViewMembers = useCallback((group: Group) => { void openDetail(group, 'members'); }, [openDetail]);

  const handleDetailMembersSearch = useCallback(() => {
    setDetailMembersSearch(detailMembersSearchInput.trim());
    setDetailMembersPage(1);
  }, [detailMembersSearchInput]);

  const handleDetailMembersPageChange = useCallback((nextPage: number, nextPageSize: number) => {
    setDetailMembersPage(nextPage);
    setDetailMembersPageSize(nextPageSize);
  }, []);

  const openAddMemberDrawer = useCallback(() => {
    addMemberForm.resetFields();
    setAddMemberDrawerOpen(true);
  }, [addMemberForm]);

  const handleAddMembers = useCallback(async () => {
    if (!detailGroup) return;

    try {
      const values = await addMemberForm.validateFields();
      const userIds = Array.isArray(values.userIds) ? values.userIds : [values.userIds];
      setAddMemberSubmitting(true);
      await groupService.addMembers(detailGroup.id, userIds);
      toast.success(`Đã thêm ${userIds.length} thành viên vào nhóm`);
      addMemberForm.resetFields();
      setAddMemberDrawerOpen(false);
      setDetailMembersReload((value) => value + 1);
    } catch (err: any) {
      if (err?.errorFields) return;
      toast.error(err instanceof Error ? err.message : 'Lỗi khi thêm thành viên');
    } finally {
      setAddMemberSubmitting(false);
    }
  }, [addMemberForm, detailGroup]);

  const handleRemoveDetailMember = useCallback((member: GroupMember) => {
    if (!detailGroup) return;

    confirm({
      title: 'Xác nhận xóa thành viên',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa "${member.fullName}" khỏi nhóm này?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await groupService.removeMember(detailGroup.id, member.userId);
          toast.success('Đã xóa thành viên khỏi nhóm');
          setDetailMembersReload((value) => value + 1);
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
        }
      },
    });
  }, [detailGroup]);

  const detailMemberActions = useCallback((member: GroupMember) => (
    hasPerm(PERMISSIONS.GROUP_MEMBER.MANAGE)
      ? [{ key: 'remove', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleRemoveDetailMember(member), danger: true }]
      : []
  ), [handleRemoveDetailMember, hasPerm]);

  const openCreateModal = useCallback(() => { setEditingGroup(null); form.resetFields(); form.setFieldsValue({ status: 'active' }); setModalOpen(true); }, [form]);

  const openEditModal = useCallback((group: Group) => {
    setEditingGroup(group);
    form.setFieldsValue({ name: group.name, code: group.code, description: group.description, status: group.status, organizationId: group.organizationId });
    setModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields(); setSubmitting(true);
      const name = String(values.name ?? '').trim();
      const code = String(values.code ?? '').trim().toUpperCase();
      const description = String(values.description ?? '').trim() || undefined;
      if (editingGroup) {
        const payload: UpdateGroupPayload = { name, description, status: values.status };
        await groupService.update(editingGroup.id, payload);
        toast.success('Đã cập nhật nhóm');
      } else {
        const payload: CreateGroupPayload = { name, code, description, status: values.status, organizationId: values.organizationId };
        await groupService.create(payload);
        toast.success('Đã tạo thành công');
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
    const isActive = group.status === 'active';
    const actionLabel = isActive ? 'khóa' : 'mở khóa';
    confirm({
      title: isActive ? 'Xác nhận khóa nhóm' : 'Xác nhận mở khóa nhóm',
      icon: <ExclamationCircleOutlined />,
      content: isActive
        ? `Bạn có chắc chắn muốn khóa nhóm '${group.name}'? Toàn bộ thành viên trong nhóm sẽ bị tạm ngưng quyền sử dụng chức năng thừa hưởng từ nhóm.`
        : `Bạn có chắc chắn muốn mở khóa nhóm '${group.name}'? Quyền sử dụng chức năng thừa hưởng từ nhóm sẽ được khôi phục cho các thành viên.`,
      okText: isActive ? 'Khóa nhóm' : 'Mở khóa nhóm',
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
      const permissions = await groupService.getPermissions(group.id);
      setSelectedPermissionKeys(permissions);
    } catch (err: unknown) {
      setSelectedPermissionKeys([]);
      toast.error(err instanceof Error ? err.message : 'Không thể tải phân quyền của nhóm');
    } finally {
      setPermissionLoading(false);
    }
  }, []);

  const handlePermissionSave = useCallback(async () => {
    if (!permissionGroup) return;
    setPermissionSaving(true);
    try {
      const selectedPerms = selectedPermissionKeys.filter((key) =>
        !key.startsWith('group_') && !NON_INHERITABLE_GROUP_PERMISSIONS.has(key));
      await groupService.updatePermissions(permissionGroup.id, selectedPerms);
      toast.success('Đã cập nhật phân quyền chức năng cho nhóm');
      setPermissionGroup(null);
      fetchGroups();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật phân quyền thất bại');
    } finally {
      setPermissionSaving(false);
    }
  }, [permissionGroup, selectedPermissionKeys, fetchGroups]);

  const assignablePermissionTree = useMemo(() => {
    const sanitize = (nodes: typeof rawPermissionTree): typeof rawPermissionTree => nodes.flatMap((node) => {
      if (NON_INHERITABLE_GROUP_PERMISSIONS.has(String(node.key))) return [];
      const children = sanitize(node.children || []);
      return [{ ...node, children }];
    });

    const groupNode = rawPermissionTree.find((node) => node.key === 'group_group');
    const groupMemberNode = rawPermissionTree.find((node) => node.key === 'group_groupmember');
    const groupChildren = [
      ...(groupNode ? sanitize(groupNode.children || []) : []),
      ...(groupMemberNode ? sanitize(groupMemberNode.children || []) : []),
    ];

    return rawPermissionTree.flatMap((node) => {
      if (node.key === 'group_groupmember') return [];
      if (node.key === 'group_group') {
        return groupChildren.length ? [{ ...node, children: groupChildren }] : [];
      }
      if (NON_INHERITABLE_GROUP_PERMISSIONS.has(String(node.key))) return [];
      const children = sanitize(node.children || []);
      return children.length || !String(node.key).startsWith('group_')
        ? [{ ...node, children }]
        : [];
    });
  }, [rawPermissionTree]);

  const permissionTreeData = useMemo(() => {
    const keyword = normalizeSearchText(permissionSearch);
    if (!keyword) return assignablePermissionTree;
    const filter = (nodes: typeof assignablePermissionTree): typeof assignablePermissionTree => nodes.flatMap((node) => {
      const children = filter(node.children || []);
      const matches = normalizeSearchText(node.title).includes(keyword) || normalizeSearchText(node.key).includes(keyword);
      return matches || children.length ? [{ ...node, children }] : [];
    });
    return filter(assignablePermissionTree);
  }, [assignablePermissionTree, permissionSearch]);

  const handleFilterSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setFilterOrganizationId(filterOrganizationInput);
    setPage(1);
  }, [filterOrganizationInput, searchInput]);

  const handleFilterReset = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setFilterStatus(undefined);
    setFilterOrganizationInput(undefined);
    setFilterOrganizationId(undefined);
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    const nextStatus = key === 'all' ? undefined : key;
    setFilterStatus(nextStatus);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => { setPage(p); setPageSize(ps); }, []);

  const rowActions = useCallback((record: Group) => {
    const actions: { key: string; label: string; icon?: ReactNode; onClick: () => void; danger?: boolean }[] = [];
    if (hasPerm(PERMISSIONS.GROUP.READ)) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => handleViewDetail(record) });
    }
    if (hasPerm(PERMISSIONS.GROUP.EDIT)) {
      actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    }
    if (hasPerm(PERMISSIONS.GROUP.LOCK)) {
      const isActive = record.status === 'active';
      actions.push({ key: 'lock', label: isActive ? 'Khóa nhóm' : 'Mở khóa nhóm', icon: isActive ? <LockOutlined /> : <UnlockOutlined />, onClick: () => handleLock(record) });
    }
    if (hasPerm(PERMISSIONS.GROUP.PERMISSION)) {
      actions.push({ key: 'permissions', label: 'Phân quyền', icon: <EditOutlined />, onClick: () => openPermissionModal(record) });
    }
    if (hasPerm(PERMISSIONS.GROUP_MEMBER.MANAGE)) {
      actions.push({ key: 'members', label: 'Thêm người dùng vào nhóm', icon: <UserOutlined />, onClick: () => handleViewMembers(record) });
    }
    if (hasPerm(PERMISSIONS.GROUP.DELETE)) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    return actions;
  }, [hasPerm, handleViewDetail, handleViewMembers, openPermissionModal, openEditModal, handleDelete, handleLock]);

  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, fixed: 'left' as const,
      render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'organizationName', label: 'Đơn vị', dataIndex: 'organizationName', width: 220,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'code', label: 'Mã nhóm', dataIndex: 'code', width: 180,
      render: (text?: string) => text || <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'name', label: 'Tên nhóm', dataIndex: 'name', width: 300,
      render: (text: string, record: Group) => (
        <Typography.Text
          strong
          style={{ color: hasPerm(PERMISSIONS.GROUP.READ) ? actionPrimary : textSecondary, cursor: hasPerm(PERMISSIONS.GROUP.READ) ? 'pointer' : 'default' }}
          onClick={() => { if (hasPerm(PERMISSIONS.GROUP.READ)) handleViewDetail(record); }}
        >
          {text}
        </Typography.Text>
      ) },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 140, align: 'center' as const,
      render: (status: string) => {
        const color = status === 'active' ? statusOperational : statusDraft;
        const label = STATUS_LABELS[status] || status;
        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}>{label}</span>;
      } },
  ], [page, pageSize, handleViewDetail, hasPerm]);

  const detailMemberColumns = useMemo(() => [
    {
      key: 'sequenceNo', label: 'STT', width: 64, align: 'center' as const,
      render: (_value: unknown, _record: GroupMember, index: number) => (detailMembersPage - 1) * detailMembersPageSize + index + 1,
    },
    { key: 'fullName', label: 'Họ và tên', dataIndex: 'fullName', width: 220 },
    { key: 'username', label: 'Tên đăng nhập', dataIndex: 'username', width: 180 },
    { key: 'email', label: 'Email', dataIndex: 'email', width: 240 },
    {
      key: 'joinedAt', label: 'Tham gia từ', dataIndex: 'joinedAt', width: 160, align: 'center' as const,
      render: (value: string) => value ? dayjs(value).format('DD/MM/YYYY') : '—',
    },
  ], [detailMembersPage, detailMembersPageSize]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách nhóm'} onRetry={fetchGroups} />;
    const emptyDescription = search || filterStatus || filterOrganizationId
      ? 'Không tìm thấy nhóm nào phù hợp'
      : 'Chưa có nhóm nào';
    return <>
      <DataTable
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        rowActions={rowActions}
        scroll={{ x: 'max-content' }}
        emptyState={dataSource.length === 0 ? <EmptyState description={emptyDescription} /> : undefined}
      />
      {dataSource.length > 0 && (
        <Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} />
      )}
    </>;
  };

  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tìm kiếm</div>
        <Input
          placeholder="Tìm theo tên, mã nhóm, mô tả..."
          allowClear
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onPressEnter={handleFilterSearch}
          style={{ borderRadius: radiusPill, height: 40 }}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị</div>
        <OrgUnitTreeSelect
          organizations={orgTree}
          value={filterOrganizationInput}
          onChange={(value) => setFilterOrganizationInput(value)}
          placeholder="Tất cả đơn vị"
          showSearch
          allowClear
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>
    </>
  );

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm(PERMISSIONS.GROUP.CREATE)) actions.push({ key: 'create', label: 'Thêm nhóm', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    return actions;
  }, [hasPerm, openCreateModal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý nhóm' }]} actions={headerActions} />
      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        onFilterApply={handleFilterSearch}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={isError}
        onRetry={fetchGroups}
        filterContent={filterContent}
        statusTabs={[
          { key: 'all', label: 'Tất cả', count: totalAll, color: textSecondary, active: !filterStatus },
          { key: 'active', label: 'Sử dụng', count: countActive, color: statusOperational, active: filterStatus === 'active' },
          { key: 'inactive', label: 'Không sử dụng', count: countInactive, color: statusDraft, active: filterStatus === 'inactive' },
        ]}
        onStatusTabChange={handleTabChange}
      >
        {renderContent()}
      </FilterTableLayout>

      {/* Modal Xem chi tiết */}
      <ManagementDrawer
        title={<>Chi tiết nhóm - {detailGroup?.name ?? ''}</>}
        open={!!detailGroup}
        onClose={() => { setDetailGroup(null); setAddMemberDrawerOpen(false); }}
      >
        {detailGroup && (
          <Spin spinning={detailLoading}>
            {detailError ? <ErrorState message={detailError} onRetry={() => { void openDetail(detailGroup, detailTab as 'info' | 'members'); }} /> : (
          <div style={{ paddingTop: 16 }}>
            <style>{`.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; } .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; } .detail-label { width: 200px; flex-shrink: 0; color: ${colors.sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; } .detail-label::after { content: ':'; margin-left: 2px; } .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; }`}</style>
            <Tabs
              activeKey={detailTab}
              onChange={setDetailTab}
              tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}
              items={[
              {
                key: 'info',
                label: 'Thông tin nhóm',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div className="detail-grid">
                      {[
                        ['Đơn vị', detailGroup.organizationName || '—'],
                        ['Tên nhóm', <Typography.Text strong style={{ color: colors.sidebarBg }}>{detailGroup.name}</Typography.Text>],
                        ['Mã nhóm', detailGroup.code || '—'],
                        ['Mô tả', detailGroup.description || 'Chưa có mô tả'],
                        ['Trạng thái', (() => {
                          const color = detailGroup.status === 'active' ? statusOperational : statusDraft;
                          return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${color}15`, color }}>{STATUS_LABELS[detailGroup.status] || detailGroup.status}</span>;
                        })()],
                        ['Ngày tạo', detailGroup.createdAt ? dayjs(detailGroup.createdAt).format('DD/MM/YYYY HH:mm') : '—'],
                        ['Người tạo', detailGroup.createdByName || '—'],
                        ['Cập nhật cuối', detailGroup.updatedAt ? dayjs(detailGroup.updatedAt).format('DD/MM/YYYY HH:mm') : '—'],
                        ['Người cập nhật', detailGroup.updatedByName || '—'],
                      ].map(([label, value], index) => (
                        <div key={index} className="detail-row">
                          <span className="detail-label">{label}</span>
                          <span className="detail-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                key: 'members',
                label: 'Danh sách thành viên',
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spaceMd, marginBottom: spaceMd }}>
                      <Input.Search
                        allowClear
                        value={detailMembersSearchInput}
                        placeholder="Tìm theo họ tên, tên đăng nhập, email..."
                        onChange={(event) => {
                          const value = event.target.value;
                          setDetailMembersSearchInput(value);
                          if (!value) {
                            setDetailMembersSearch('');
                            setDetailMembersPage(1);
                          }
                        }}
                        onSearch={handleDetailMembersSearch}
                        style={{ width: 360, maxWidth: '100%', borderRadius: radiusPill }}
                      />
                      {hasPerm(PERMISSIONS.GROUP_MEMBER.MANAGE) && (
                        <Button
                          type={addMemberDrawerOpen ? 'default' : 'primary'}
                          icon={<PlusOutlined />}
                          onClick={() => {
                            if (addMemberDrawerOpen) {
                              setAddMemberDrawerOpen(false);
                              addMemberForm.resetFields();
                            } else {
                              openAddMemberDrawer();
                            }
                          }}
                          style={addMemberDrawerOpen ? outlineButtonStyle : primaryButtonStyle}
                        >
                          {addMemberDrawerOpen ? 'Ẩn thêm thành viên' : 'Thêm thành viên'}
                        </Button>
                      )}
                    </div>
                    {addMemberDrawerOpen && (
                      <div style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceMd, marginBottom: spaceMd }}>
                        <Form form={addMemberForm} layout="vertical">
                          <Form.Item
                            name="userIds"
                            label="Chọn người dùng"
                            required
                            style={{ marginBottom: spaceMd }}
                            rules={[
                              { required: true, message: 'Vui lòng chọn ít nhất một người dùng' },
                              { validator: (_, value: string[]) => value?.length > 100
                                ? Promise.reject(new Error('Mỗi lần chỉ được thêm tối đa 100 người dùng'))
                                : Promise.resolve() },
                            ]}
                          >
                            <Select
                              mode="multiple"
                              showSearch
                              placeholder="Tìm và chọn nhiều người dùng..."
                              options={addMemberOptions}
                              filterOption={false}
                              maxTagCount="responsive"
                              onSearch={(value) => { void fetchAddMemberOptions(value, existingMemberIds); }}
                              loading={addMemberSearchLoading}
                              style={{ borderRadius: radiusPill, minHeight: 40 }}
                            />
                          </Form.Item>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spaceMd }}>
                            <Button onClick={() => { setAddMemberDrawerOpen(false); addMemberForm.resetFields(); }} style={outlineButtonStyle}>Hủy</Button>
                            <Button type="primary" onClick={handleAddMembers} loading={addMemberSubmitting} style={primaryButtonStyle}>Thêm</Button>
                          </div>
                        </Form>
                      </div>
                    )}
                    <Spin spinning={detailMembersLoading}>
                      {detailMembersError ? (
                        <ErrorState message={detailMembersError} onRetry={() => setDetailMembersReload((value) => value + 1)} />
                      ) : (
                        <>
                          <DataTable
                            columns={detailMemberColumns}
                            dataSource={detailMembers}
                            rowKey="userId"
                            rowActions={hasPerm(PERMISSIONS.GROUP_MEMBER.MANAGE) ? detailMemberActions : undefined}
                            scroll={{ x: 'max-content' }}
                            emptyState={<EmptyState description={detailMembersSearch ? 'Không tìm thấy thành viên phù hợp' : 'Chưa có thành viên nào'} />}
                          />
                          {detailMembersTotal > 0 && (
                            <Pagination
                              total={detailMembersTotal}
                              current={detailMembersPage}
                              pageSize={detailMembersPageSize}
                              pageSizeOptions={[10, 20, 50, 100]}
                              onChange={handleDetailMembersPageChange}
                            />
                          )}
                        </>
                      )}
                    </Spin>
                  </div>
                ),
              },
              ]}
            />
          </div>
            )}
          </Spin>
        )}
      </ManagementDrawer>

      {/* Drawer Phân quyền cho nhóm */}
      <ManagementDrawer
        title={<>Phân quyền chức năng cho nhóm{permissionGroup ? `: ${permissionGroup.name}` : ''}</>}
        open={!!permissionGroup}
        onClose={() => setPermissionGroup(null)}
        maskClosable={false}
        footer={
          <>
            <Button onClick={() => setPermissionGroup(null)} style={outlineButtonStyle}>Đóng</Button>
            <Button type="primary" loading={permissionSaving} onClick={handlePermissionSave} style={primaryButtonStyle}>Lưu</Button>
          </>
        }
      >
        <Spin spinning={permissionLoading}>
          <Input.Search
            allowClear
            value={permissionSearch}
            onChange={(event) => setPermissionSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mã quyền (vd: port:read, Cảng biển...)"
            style={{ margin: `${spaceMd}px 0` }}
          />
          {permissionTreeData.length === 0 && !permissionLoading ? (
            <Empty description="Không tìm thấy quyền phù hợp" />
          ) : (
              <div style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceMd, maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' }}>
              <Tree
                checkable
                defaultExpandAll
                treeData={permissionTreeData}
                checkedKeys={getVisiblePermissionKeys(selectedPermissionKeys, permissionTreeData)}
                onCheck={(checked) => {
                  const keys = Array.isArray(checked) ? checked : checked.checked;
                  setSelectedPermissionKeys(mergePermissionKeys(selectedPermissionKeys, keys.map(String), permissionTreeData));
                }}
              />
            </div>
          )}
        </Spin>
      </ManagementDrawer>

      {/* Modal Thêm/Sửa */}
      <ManagementDrawer
        title={editingGroup ? 'Sửa nhóm' : 'Thêm nhóm mới'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maskClosable={false}
        footer={
          <>
          <Button onClick={() => setModalOpen(false)} style={outlineButtonStyle}>Hủy</Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>{editingGroup ? 'Cập nhật' : 'Tạo mới'}</Button>
          </>
        }
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }} labelCol={{ style: { padding: 0, marginBottom: 4 } }}>
            <ManagementFormGrid>
              <ManagementFormField>
                <Form.Item name="name" {...labelProps('Tên nhóm')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }, { min: 2, max: 100, message: 'Tên nhóm phải từ 2 đến 100 ký tự' }]}>
                  <Input placeholder="vd: Nhóm Quản lý" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </ManagementFormField>
              <ManagementFormField>
                <Form.Item name="code" {...labelProps('Mã nhóm')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập mã nhóm' }, { min: 2, max: 30, message: 'Mã nhóm phải từ 2 đến 30 ký tự' }, { pattern: /^[A-Z0-9_]+$/, message: 'Mã nhóm chỉ gồm chữ hoa, số và dấu gạch dưới' }]}>
                  <Input placeholder="vd: QL01" disabled={!!editingGroup} normalize={(value) => String(value ?? '').trim().toUpperCase()} style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </ManagementFormField>
            </ManagementFormGrid>
            <ManagementFormGrid>
              <ManagementFormField>
                <Form.Item name="organizationId" {...labelProps('Đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: !editingGroup, message: 'Vui lòng chọn đơn vị' }]}>
                  <OrgUnitTreeSelect
                    organizations={orgTree}
                    placeholder="Chọn đơn vị"
                    showSearch
                    disabled={!!editingGroup}
                    allowClear
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </ManagementFormField>
              <ManagementFormField>
                <Form.Item name="status" {...labelProps('Trạng thái')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}>
                  <Select placeholder="Chọn trạng thái" options={[{ value: 'active', label: 'Sử dụng' }, { value: 'inactive', label: 'Không sử dụng' }]} style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </ManagementFormField>
            </ManagementFormGrid>
            <Form.Item name="description" {...labelProps('Mô tả')} style={{ marginBottom: spaceFormField }} rules={[{ max: 1000, message: 'Mô tả tối đa 1000 ký tự' }]}>
              <Input.TextArea rows={3} placeholder="Mô tả nhóm (tùy chọn)" />
            </Form.Item>
          </Form>
        </Spin>
      </ManagementDrawer>
    </div>
  );
}

