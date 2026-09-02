import { useState, useCallback, useEffect, useMemo, memo, type FC } from 'react';
import { Form, Input, Spin, Button, Select, Tree, Tabs, Empty, Checkbox, Drawer, Row, Col } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  ExclamationCircleOutlined, EyeOutlined, LockOutlined, UnlockOutlined,
  SearchOutlined, CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePermissionStore } from '../../store/permissionStore';
import { getPermissionTreeKeys, getVisiblePermissionKeys, mergePermissionKeys, usePermissions } from '../../hooks/usePermissions';
import type { MenuTreeNode } from '../../types/permission';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ScreenHeader, DataTable } from '../../components/list-view';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import Pagination from '../../components/list-view/Pagination';
import SidebarFilterField from '../../components/list-view/SidebarFilterField';
import { groupService } from '../../services/groupService';
import type { Group, GroupMember, CreateGroupPayload, UpdateGroupPayload } from '../../services/groupService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { userService } from '../../services/userService';
import { OrgUnitTreeSelect, normalizeSearchText, type OrgUnitTreeOption } from '../../components/org-unit';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd,
  radiusMd, radiusPill, spaceFormField, spaceMd,
  statusOperational, statusCritical, surfaceCard, borderDefault,
  drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, drawerStyles, drawerFormScrollStyle, drawerTabBarStyle,
  primaryButtonStyle, outlineButtonStyle, inputStyle, selectStyle, textAreaStyle,
  cellTitleStyle, cellSubtitleStyle,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import toast, { modal } from '../../components/ToastNotification';
import { PERMISSIONS } from '../../constants/permissions';
import { formLabelProps as labelProps } from '../../components/shared/formLabel';

const { confirm } = modal;
const drawerProps = { styles: drawerStyles, maskClosable: false };

const STATUS_LABELS: Record<string, string> = { active: 'Sử dụng', inactive: 'Không sử dụng' };
const NON_INHERITABLE_GROUP_PERMISSIONS = new Set(['admin:all', '*']);

const PermissionSearchBar: FC<{ onSearch: (val: string) => void }> = memo(({ onSearch }) => {
  const [value, setValue] = useState('');

  return (
    <Input
      allowClear
      value={value}
      onChange={(e) => {
        const nextVal = e.target.value;
        setValue(nextVal);
        if (!nextVal) {
          onSearch('');
        }
      }}
      onPressEnter={() => onSearch(value.trim())}
      suffix={
        <SearchOutlined
          style={{ cursor: 'pointer', color: textSecondary, fontSize: 16 }}
          onClick={() => onSearch(value.trim())}
        />
      }
      placeholder="Nhập tên hoặc mã quyền"
      style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
    />
  );
});

export default function GroupList() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [code, setCode] = useState('');
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

  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortOrderFor = (key: string): 'ascend' | 'descend' | null =>
    (sortField === key ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null);

  const serverSideSorter = () => 0;

  const handleSortChange = (key: string, direction: 'asc' | 'desc') => {
    setSortField(key);
    setSortDirection(direction);
    setPage(1);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [detailMembersOnly, setDetailMembersOnly] = useState(false);
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
  const [addMemberSearchLoading, setAddMemberSearchLoading] = useState(false);
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [addMemberForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { tree: rawPermissionTree } = usePermissions();
  const [permissionGroup, setPermissionGroup] = useState<Group | null>(null);
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [appliedPermissionSearch, setAppliedPermissionSearch] = useState('');
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [orgTree, setOrgTree] = useState<OrgUnitTreeOption[]>([]);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await groupService.list({
        page,
        pageSize,
        search: search || undefined,
        code: code || undefined,
        status: filterStatus,
        organizationId: filterOrganizationId,
        sortBy: sortField,
        sortDir: sortField ? sortDirection.toUpperCase() : undefined,
      });
      setDataSource(res.data); setTotal(res.total);
      setCountActive(res.activeCount);
      setCountInactive(res.inactiveCount);
    } catch (err: unknown) { setIsError(true); setError(err instanceof Error ? err : new Error('Không thể tải danh sách nhóm')); }
    finally { setIsLoading(false); }
  }, [page, pageSize, search, code, filterStatus, filterOrganizationId, sortField, sortDirection]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    if (!detailGroup) {
      setDetailTab('info');
      setDetailMembersOnly(false);
      setDetailMembers([]);
      setDetailMembersPage(1);
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
    void groupService.getMembers(detailGroup.id, { page: detailMembersPage, pageSize: detailMembersPageSize, search: detailMembersSearch || undefined })
      .then((response) => { if (!cancelled) { setDetailMembers(response.data); setDetailMembersTotal(response.total); } })
      .catch((err: unknown) => { if (!cancelled) setDetailMembersError(err instanceof Error ? err.message : 'Không thể tải danh sách thành viên'); })
      .finally(() => { if (!cancelled) setDetailMembersLoading(false); });
    return () => { cancelled = true; };
  }, [detailGroup?.id, detailMembersPage, detailMembersPageSize, detailMembersReload, detailMembersSearch, detailTab]);

  const fetchExistingMemberIds = useCallback(async () => {
    if (!detailGroup) return [];
    const response = await groupService.getMembers(detailGroup.id, { page: 1, pageSize: 1000 });
    return response.data.map((member) => member.userId);
  }, [detailGroup?.id]);

  const fetchAddMemberOptions = useCallback(async (excludedIds: string[]) => {
    setAddMemberSearchLoading(true);
    try {
      const response = await userService.list({ pageSize: 1000 });
      const excluded = new Set(excludedIds);
      setAddMemberOptions(
        response.data
          .filter((user) => !excluded.has(user.id))
          .map((user) => ({
            value: user.id,
            label: `${user.fullName} (${user.username})`,
          }))
      );
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
        if (cancelled) return;
        await fetchAddMemberOptions(ids);
      } catch {
        if (!cancelled) setAddMemberOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [addMemberDrawerOpen, detailGroup, fetchAddMemberOptions, fetchExistingMemberIds]);

  const openDetail = useCallback(async (group: Group, tab: 'info' | 'members' = 'info', membersOnly = false) => {
    setDetailGroup(group);
    setDetailTab(tab);
    setDetailMembersOnly(membersOnly);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await groupService.getById(group.id);
      setDetailGroup(detail);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Không thể tải thông tin nhóm');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleViewDetail = useCallback((group: Group) => { void openDetail(group, 'info', false); }, [openDetail]);
  const handleViewMembers = useCallback((group: Group) => { void openDetail(group, 'members', true); }, [openDetail]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let orgs: any[] = await organizationService.getTree();
        if (!orgs || orgs.length === 0) {
          orgs = await organizationService.getAll();
        }
        if (!orgs || orgs.length === 0) {
          orgs = await vtsSystemCRUD.getScopedOrgUnitOptions();
        }
        if (mounted && Array.isArray(orgs)) {
          setOrgTree(orgs.map((org: any) => ({
            id: String(org.id),
            name: org.name || org.unitName || org.tenDonVi || 'Đơn vị',
            code: org.code || org.maDonVi,
            parentId: org.parentId ? String(org.parentId) : undefined,
          })));
        }
      } catch (err) {
        console.error('Error fetching org tree for groups:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleDetailMembersSearch = useCallback(() => {
    setDetailMembersSearch(detailMembersSearchInput.trim());
    setDetailMembersPage(1);
  }, [detailMembersSearchInput]);

  const handleDetailMembersPageChange = useCallback((nextPage: number, nextPageSize: number) => {
    setDetailMembersPage(nextPage);
    setDetailMembersPageSize(nextPageSize);
  }, []);

  const openAddMemberDrawer = useCallback(() => { addMemberForm.resetFields(); setAddMemberDrawerOpen(true); }, [addMemberForm]);

  const handleAddMembers = useCallback(async () => {
    if (!detailGroup) return;
    try {
      const values = await addMemberForm.validateFields();
      const rawIds = values.userIds;
      const userIds = Array.isArray(rawIds) ? rawIds : (rawIds ? [rawIds] : []);
      if (userIds.length === 0) {
        toast.warning('Vui lòng chọn ít nhất một người dùng');
        return;
      }
      setAddMemberSubmitting(true);
      await groupService.addMembers(detailGroup.id, userIds);
      toast.success(`Đã thêm ${userIds.length} thành viên vào nhóm`);
      addMemberForm.resetFields();
      setAddMemberDrawerOpen(false);
      setDetailMembersReload((v) => v + 1);
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
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try { await groupService.removeMember(detailGroup.id, member.userId); toast.success('Đã xóa thành viên khỏi nhóm'); setDetailMembersReload((v) => v + 1); }
        catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Thao tác thất bại'); }
      },
    });
  }, [detailGroup]);

  const detailMemberActions = useCallback((member: GroupMember) => (
    hasPerm(PERMISSIONS.GROUP_MEMBER.MANAGE) ? [{ key: 'remove', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleRemoveDetailMember(member), danger: true }] : []
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
      const payload = { name: String(values.name).trim(), code: String(values.code).trim().toUpperCase(), description: String(values.description || '').trim() || undefined, status: values.status, organizationId: values.organizationId };
      if (editingGroup) { await groupService.update(editingGroup.id, payload as UpdateGroupPayload); toast.success('Đã cập nhật nhóm'); }
      else { await groupService.create(payload as CreateGroupPayload); toast.success('Đã tạo thành công'); }
      setModalOpen(false); fetchGroups();
    } catch (err: any) { if (!err.errorFields) toast.error(err?.message || 'Thao tác thất bại'); } finally { setSubmitting(false); }
  }, [editingGroup, form, fetchGroups]);

  const handleLock = useCallback((group: Group) => {
    const isActive = group.status === 'active';
    confirm({
      title: isActive ? 'Xác nhận khóa nhóm' : 'Xác nhận mở khóa nhóm',
      icon: <ExclamationCircleOutlined />,
      content: isActive ? `Bạn có chắc chắn muốn khóa nhóm '${group.name}'?` : `Bạn có chắc chắn muốn mở khóa nhóm '${group.name}'?`,
      okText: isActive ? 'Khóa nhóm' : 'Mở khóa nhóm', okType: 'primary', cancelText: 'Hủy',
      onOk: async () => { try { await groupService.lock(group.id); toast.success('Đã cập nhật trạng thái'); fetchGroups(); } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Thao tác thất bại'); } },
    });
  }, [fetchGroups]);

  const openPermissionModal = useCallback(async (group: Group) => {
    setPermissionGroup(group); setAppliedPermissionSearch(''); setPermissionLoading(true);
    try { const permissions = await groupService.getPermissions(group.id); setSelectedPermissionKeys(permissions); }
    catch (err: unknown) { setSelectedPermissionKeys([]); toast.error(err instanceof Error ? err.message : 'Không thể tải phân quyền'); }
    finally { setPermissionLoading(false); }
  }, []);

  const handlePermissionSave = useCallback(async () => {
    if (!permissionGroup) return; setPermissionSaving(true);
    try {
      const selected = selectedPermissionKeys.filter((key) => !key.startsWith('group_') && !NON_INHERITABLE_GROUP_PERMISSIONS.has(key));
      await groupService.updatePermissions(permissionGroup.id, selected);
      toast.success('Đã cập nhật phân quyền'); setPermissionGroup(null); fetchGroups();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Cập nhật phân quyền thất bại'); } finally { setPermissionSaving(false); }
  }, [permissionGroup, selectedPermissionKeys, fetchGroups]);

  const assignablePermissionTree = useMemo(() => {
    const sanitize = (nodes: typeof rawPermissionTree): typeof rawPermissionTree => nodes.flatMap((node) => {
      if (NON_INHERITABLE_GROUP_PERMISSIONS.has(String(node.key))) return [];
      const children = sanitize(node.children || []);
      return [{ ...node, children }];
    });
    const groupNode = rawPermissionTree.find((n) => n.key === 'group_group');
    const groupMemberNode = rawPermissionTree.find((n) => n.key === 'group_groupmember');
    const groupChildren = [...(groupNode ? sanitize(groupNode.children || []) : []), ...(groupMemberNode ? sanitize(groupMemberNode.children || []) : [])];
    return rawPermissionTree.flatMap((node) => {
      if (node.key === 'group_groupmember') return [];
      if (node.key === 'group_group') return groupChildren.length ? [{ ...node, children: groupChildren }] : [];
      if (NON_INHERITABLE_GROUP_PERMISSIONS.has(String(node.key))) return [];
      const children = sanitize(node.children || []);
      return children.length || !String(node.key).startsWith('group_') ? [{ ...node, children }] : [];
    });
  }, [rawPermissionTree]);

  const indexedGroupPermissionTree = useMemo(() => {
    const attachMeta = (nodes: readonly MenuTreeNode[]): any[] => nodes.map((n) => ({ ...n, _searchStr: normalizeSearchText(`${n.title} ${n.key}`), children: n.children ? attachMeta(n.children) : [] }));
    return attachMeta(assignablePermissionTree);
  }, [assignablePermissionTree]);

  const permissionTreeData = useMemo(() => {
    const keyword = normalizeSearchText(appliedPermissionSearch);
    if (!keyword) return assignablePermissionTree;
    const filter = (nodes: any[]): MenuTreeNode[] => nodes.flatMap((n) => {
      if (n._searchStr.includes(keyword)) return [{ ...n, children: n.children || [] }];
      const children = filter(n.children || []);
      return children.length ? [{ ...n, children }] : [];
    });
    return filter(indexedGroupPermissionTree);
  }, [indexedGroupPermissionTree, assignablePermissionTree, appliedPermissionSearch]);

  const allGroupPermissionKeys = useMemo(() => Array.from(getPermissionTreeKeys(assignablePermissionTree)).filter((k) => !k.startsWith('group_')), [assignablePermissionTree]);
  const allGroupPermissionsSelected = allGroupPermissionKeys.length > 0 && allGroupPermissionKeys.every((k) => selectedPermissionKeys.includes(k));
  const someGroupPermissionsSelected = allGroupPermissionKeys.some((k) => selectedPermissionKeys.includes(k));

  const handleFilterSearch = useCallback(() => { setSearch(searchInput.trim()); setCode(codeInput.trim()); setFilterOrganizationId(filterOrganizationInput); setPage(1); }, [filterOrganizationInput, searchInput, codeInput]);
  const handleFilterReset = useCallback(() => { setSearchInput(''); setSearch(''); setCodeInput(''); setCode(''); setFilterStatus(undefined); setFilterOrganizationInput(undefined); setFilterOrganizationId(undefined); setPage(1); }, []);
  const handleTabChange = useCallback((k: string) => { setFilterStatus(k === 'all' ? undefined : k); setPage(1); }, []);
  const handlePageChange = useCallback((p: number, ps: number) => { setPage(p); setPageSize(ps); }, []);

  const rowActions = useCallback((record: Group) => {
    const acts: any[] = [];
    if (hasPerm(PERMISSIONS.GROUP.READ)) acts.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => handleViewDetail(record) });
    if (hasPerm(PERMISSIONS.GROUP.EDIT)) acts.push({ key: 'edit', label: 'Sửa thông tin', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    if (hasPerm(PERMISSIONS.GROUP.LOCK)) acts.push({ key: 'lock', label: record.status === 'active' ? 'Khóa nhóm' : 'Mở khóa nhóm', icon: record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />, onClick: () => handleLock(record) });
    if (hasPerm(PERMISSIONS.GROUP.PERMISSION)) acts.push({ key: 'permissions', label: 'Phân quyền chức năng', icon: <EditOutlined />, onClick: () => openPermissionModal(record) });
    if (hasPerm(PERMISSIONS.GROUP_MEMBER.MANAGE)) acts.push({ key: 'members', label: 'Quản lý thành viên', icon: <UserOutlined />, onClick: () => handleViewMembers(record) });
    return acts;
  }, [hasPerm, handleViewDetail, handleViewMembers, openPermissionModal, openEditModal, handleLock]);

  const columns = useMemo(() => [
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 60,
      type: 'mono' as const,
      align: 'center' as const,
      fixed: 'left' as const,
      sortable: false,
      render: (_: unknown, __: unknown, idx: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + idx + 1}</span>
      ),
    },
    {
      key: 'name',
      label: 'TÊN / MÃ NHÓM',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('name'),
      render: (_: any, record: Group) => (
        <div
          style={{
            cursor: hasPerm(PERMISSIONS.GROUP.READ) ? 'pointer' : 'default',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          onClick={() => {
            if (hasPerm(PERMISSIONS.GROUP.READ)) handleViewDetail(record);
          }}
        >
          <div style={cellTitleStyle} title={record.name || ''}>{record.name || '—'}</div>
          <div style={cellSubtitleStyle} title={record.code || ''}>{record.code || '—'}</div>
        </div>
      ),
    },
    {
      key: 'organizationName',
      label: 'ĐƠN VỊ',
      dataIndex: 'organizationName',
      width: 260,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('organizationName'),
      render: (text?: string) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: fontWeightBold }} title={text || ''}>
          {text || '—'}
        </div>
      ),
    },
    {
      key: 'updater',
      label: 'CÁN BỘ CẬP NHẬT',
      dataIndex: 'updatedByName',
      width: 220,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('updatedByName'),
      render: (_: unknown, record: Group) => {
        const updaterName = record.updatedByName || record.createdByName || '—';
        const updateTime = record.updatedAt || record.createdAt;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              title={updaterName}
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {updaterName}
            </div>
            <div
              title={updateTime ? dayjs(updateTime).format('DD/MM/YYYY HH:mm:ss') : '—'}
              style={{
                fontSize: fontSizeMd,
                color: textSecondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {updateTime ? dayjs(updateTime).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'TRẠNG THÁI',
      dataIndex: 'status',
      width: 140,
      align: 'center' as const,
      sortable: true,
      sorter: serverSideSorter,
      sortOrder: sortOrderFor('status'),
      render: (status: string) => {
        const color = status === 'active' ? statusOperational : statusCritical;
        const label = STATUS_LABELS[status] || status;
        return (
          <span
            title={label}
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: radiusPill,
              fontSize: fontSizeSm,
              fontWeight: fontWeightMedium,
              backgroundColor: `${color}15`,
              border: `1px solid ${color}40`,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        );
      },
    },
  ], [page, pageSize, handleViewDetail, hasPerm, sortField, sortDirection]);

  const detailMemberColumns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 64, align: 'center' as const, sortable: false, render: (_v: any, _r: any, idx: number) => (detailMembersPage - 1) * detailMembersPageSize + idx + 1 },
    { key: 'fullName', label: 'Họ tên', dataIndex: 'fullName', width: 220, sortable: false },
    { key: 'username', label: 'Tên đăng nhập', dataIndex: 'username', width: 180, sortable: false },
    { key: 'email', label: 'Email', dataIndex: 'email', width: 240, sortable: false },
    { key: 'joinedAt', label: 'Ngày tham gia', dataIndex: 'joinedAt', width: 160, align: 'center' as const, sortable: false, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
  ], [detailMembersPage, detailMembersPageSize]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách nhóm'} onRetry={fetchGroups} />;
    return (
      <>
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 'max-content' }}
          onSort={handleSortChange}
        />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} />
      </>
    );
  };

  const filterContent = (
    <>
      <SidebarFilterField label="Tên nhóm" style={{ marginTop: spaceMd }}>
        <Input placeholder="Nhập tên nhóm" allowClear value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onPressEnter={handleFilterSearch} style={{ ...inputStyle, borderRadius: radiusPill, height: 38 }} />
      </SidebarFilterField>
      <SidebarFilterField label="Mã nhóm">
        <Input placeholder="Nhập mã nhóm" allowClear value={codeInput} onChange={(e) => setCodeInput(e.target.value)} onPressEnter={handleFilterSearch} style={{ ...inputStyle, borderRadius: radiusPill, height: 38 }} />
      </SidebarFilterField>
      <SidebarFilterField label="Đơn vị">
        <OrgUnitTreeSelect organizations={orgTree} value={filterOrganizationInput} onChange={setFilterOrganizationInput} placeholder="Chọn đơn vị" showSearch allowClear style={{ width: '100%', borderRadius: radiusPill, height: 38 }} />
      </SidebarFilterField>
    </>
  );

  const headerActions = useMemo(() => {
    const acts: any[] = [];
    if (hasPerm(PERMISSIONS.GROUP.CREATE)) acts.push({ key: 'create', label: 'Thêm mới', variant: 'primary', icon: <PlusOutlined />, onClick: openCreateModal });
    return acts;
  }, [hasPerm, openCreateModal]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý nhóm' }]} actions={headerActions} />
        <FilterTableLayout hideFilterToggle onFilterApply={handleFilterSearch} onFilterReset={handleFilterReset} loading={isLoading} error={isError} onRetry={fetchGroups} filterContent={filterContent} statusTabs={[{ key: 'all', label: 'Tất cả', count: countActive + countInactive, color: colors.primary, active: !filterStatus }, { key: 'active', label: 'Sử dụng', count: countActive, color: statusOperational, active: filterStatus === 'active' }, { key: 'inactive', label: 'Không sử dụng', count: countInactive, color: statusCritical, active: filterStatus === 'inactive' }]} onStatusTabChange={handleTabChange}>
          {renderContent()}
        </FilterTableLayout>

        <Drawer {...drawerProps} width="50%" open={!!detailGroup} onClose={() => { setDetailGroup(null); setAddMemberDrawerOpen(false); }} title={<span style={drawerTitleStyle}>{detailMembersOnly ? 'Thành viên nhóm' : 'Chi tiết nhóm'} - {detailGroup?.name ?? ''}</span>} extra={<Button type="text" onClick={() => { setDetailGroup(null); setAddMemberDrawerOpen(false); }} style={drawerCloseBtnStyle}><CloseOutlined style={{ fontSize: 14, color: textSecondary }} /></Button>} footer={null}>
          {detailGroup && (
            <Spin spinning={detailLoading}>
              {detailError ? <ErrorState message={detailError} onRetry={() => { void openDetail(detailGroup, detailTab as 'info' | 'members', detailMembersOnly); }} /> : (
                <div style={drawerFormScrollStyle}>
                  <Tabs tabBarStyle={detailMembersOnly ? { display: 'none' } : drawerTabBarStyle} animated={false} activeKey={detailTab} onChange={setDetailTab} items={[...(!detailMembersOnly ? [{ key: 'info', label: 'Thông tin chung', children: (<div style={{ paddingTop: spaceMd }}><div className="chk-detail-grid"><div className="chk-detail-row"><span className="chk-detail-label">Đơn vị</span><span className="chk-detail-value">{detailGroup.organizationName || '—'}</span></div><div className="chk-detail-row"><span className="chk-detail-label">Tên nhóm</span><span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{detailGroup.name}</span></div><div className="chk-detail-row"><span className="chk-detail-label">Mã nhóm</span><span className="chk-detail-value">{detailGroup.code || '—'}</span></div><div className="chk-detail-row"><span className="chk-detail-label">Trạng thái</span><span className="chk-detail-value"><span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: radiusPill, fontSize: fontSizeSm, fontWeight: fontWeightMedium, backgroundColor: detailGroup.status === 'active' ? `${statusOperational}15` : `${statusCritical}15`, border: detailGroup.status === 'active' ? `1px solid ${statusOperational}40` : `1px solid ${statusCritical}40`, color: detailGroup.status === 'active' ? statusOperational : statusCritical }}>{STATUS_LABELS[detailGroup.status] || detailGroup.status}</span></span></div><div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Mô tả</span><span className="chk-detail-value">{detailGroup.description || 'Chưa có mô tả'}</span></div></div><div style={{ marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, backgroundColor: actionPrimary }} /><span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Thông tin hệ thống</span></div><div className="chk-detail-grid"><div className="chk-detail-row"><span className="chk-detail-label">Cán bộ cập nhật</span><span className="chk-detail-value">{detailGroup.updatedByName || '—'}</span></div><div className="chk-detail-row"><span className="chk-detail-label">Ngày cập nhật</span><span className="chk-detail-value">{detailGroup.updatedAt ? dayjs(detailGroup.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}</span></div></div></div>) }] : []), { key: 'members', label: 'Danh sách thành viên', children: (<div style={{ paddingTop: spaceMd }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spaceMd, marginBottom: spaceMd }}><Input allowClear prefix={<SearchOutlined style={{ color: textSecondary }} />} value={detailMembersSearchInput} placeholder="Nhập từ khóa tìm kiếm" onChange={(e) => { const v = e.target.value; setDetailMembersSearchInput(v); if (!v) { setDetailMembersSearch(''); setDetailMembersPage(1); } }} onPressEnter={handleDetailMembersSearch} style={{ ...inputStyle, width: 360, maxWidth: '100%', borderRadius: radiusPill, height: 40 }} />{hasPerm(PERMISSIONS.GROUP_MEMBER.MANAGE) && (<Button type={addMemberDrawerOpen ? 'default' : 'primary'} icon={<PlusOutlined />} onClick={() => { if (addMemberDrawerOpen) { setAddMemberDrawerOpen(false); addMemberForm.resetFields(); } else { openAddMemberDrawer(); } }} style={addMemberDrawerOpen ? outlineButtonStyle : primaryButtonStyle}>{addMemberDrawerOpen ? 'Ẩn thêm thành viên' : 'Thêm thành viên'}</Button>)}</div>{addMemberDrawerOpen && (<div style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceMd, marginBottom: spaceMd, background: surfaceCard }}><Form form={addMemberForm} layout="vertical"><Form.Item name="userIds" {...labelProps('Chọn người dùng')} style={{ marginBottom: spaceMd }} rules={[{ validator: (_, val: any) => { if (!val || !Array.isArray(val) || val.length === 0) { return Promise.reject(new Error('Vui lòng chọn ít nhất một người dùng')); } if (val.length > 100) { return Promise.reject(new Error('Mỗi lần chỉ được thêm tối đa 100 người dùng')); } return Promise.resolve(); } }]}> <Select mode="multiple" showSearch placeholder="Chọn người dùng" options={addMemberOptions} filterOption={(input, option) => normalizeSearchText(option?.label ?? '').includes(normalizeSearchText(input))} maxTagCount="responsive" loading={addMemberSearchLoading} style={{ borderRadius: radiusPill, minHeight: 40 }} /></Form.Item><div style={{ display: 'flex', justifyContent: 'flex-end', gap: spaceMd }}><Button onClick={() => { setAddMemberDrawerOpen(false); addMemberForm.resetFields(); }} style={outlineButtonStyle}>Hủy</Button><Button type="primary" onClick={handleAddMembers} loading={addMemberSubmitting} style={primaryButtonStyle}>Thêm</Button></div></Form></div>)}<Spin spinning={detailMembersLoading}>{detailMembersError ? <ErrorState message={detailMembersError} onRetry={() => setDetailMembersReload((v) => v + 1)} /> : (<><DataTable columns={detailMemberColumns} dataSource={detailMembers} rowKey="userId" rowActions={hasPerm(PERMISSIONS.GROUP_MEMBER.MANAGE) ? detailMemberActions : undefined} scroll={{ x: 'max-content' }} emptyState={<EmptyState description={detailMembersSearch ? 'Không tìm thấy thành viên phù hợp' : 'Chưa có thành viên nào'} />} />{detailMembersTotal > 0 && (<Pagination total={detailMembersTotal} current={detailMembersPage} pageSize={detailMembersPageSize} pageSizeOptions={[10, 20, 50, 100]} onChange={handleDetailMembersPageChange} />)}</>)}</Spin></div>) }]} />
                </div>
              )}
            </Spin>
          )}
        </Drawer>

        <Drawer {...drawerProps} width="50%" open={!!permissionGroup} onClose={() => { setPermissionGroup(null); setAppliedPermissionSearch(''); }} title={<span style={drawerTitleStyle}>Phân quyền chức năng cho nhóm{permissionGroup ? `: ${permissionGroup.name}` : ''}</span>} extra={<Button type="text" onClick={() => { setPermissionGroup(null); setAppliedPermissionSearch(''); }} style={drawerCloseBtnStyle}><CloseOutlined style={{ fontSize: 14, color: textSecondary }} /></Button>} footer={<div style={drawerFooterStyle}><Button onClick={() => { setPermissionGroup(null); setAppliedPermissionSearch(''); }} style={outlineButtonStyle}>Đóng</Button><Button type="primary" loading={permissionSaving} onClick={handlePermissionSave} style={primaryButtonStyle}>Lưu</Button></div>}>
          <Spin spinning={permissionLoading} wrapperClassName="chk-h-full"><div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', padding: '16px 0 8px 0' }}><div style={{ flexShrink: 0, marginBottom: spaceMd }}><PermissionSearchBar onSearch={setAppliedPermissionSearch} /></div>{permissionTreeData.length === 0 && !permissionLoading ? <Empty description="Không tìm thấy quyền phù hợp" /> : (<div style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceMd, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: surfaceCard }}><div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceMd, flexShrink: 0 }}>Danh sách chức năng</div><div style={{ marginBottom: spaceMd, flexShrink: 0 }}><Checkbox checked={allGroupPermissionsSelected} indeterminate={!allGroupPermissionsSelected && someGroupPermissionsSelected} disabled={permissionLoading || allGroupPermissionKeys.length === 0} onChange={(e) => setSelectedPermissionKeys(e.target.checked ? allGroupPermissionKeys : [])}>HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI</Checkbox></div><div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}><Tree checkable defaultExpandAll treeData={permissionTreeData} checkedKeys={getVisiblePermissionKeys(selectedPermissionKeys, permissionTreeData)} onCheck={(c) => { const ks = Array.isArray(c) ? c : (c as any).checked; setSelectedPermissionKeys(mergePermissionKeys(selectedPermissionKeys, ks.map(String), permissionTreeData)); }} /></div></div>)}</div></Spin>
        </Drawer>

        <Drawer {...drawerProps} width="50%" open={modalOpen} onClose={() => setModalOpen(false)} title={<span style={drawerTitleStyle}>{editingGroup ? 'Sửa thông tin nhóm' : 'Thêm mới nhóm'}</span>} extra={<Button type="text" onClick={() => setModalOpen(false)} style={drawerCloseBtnStyle}><CloseOutlined style={{ fontSize: 14, color: textSecondary }} /></Button>} footer={<div style={drawerFooterStyle}><Button onClick={() => setModalOpen(false)} style={outlineButtonStyle}>Hủy</Button><Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>{editingGroup ? 'Cập nhật' : 'Tạo mới'}</Button></div>}>
          <Spin spinning={submitting}><Tabs tabBarStyle={drawerTabBarStyle} animated={false} items={[{ key: 'general', label: 'Thông tin chung', children: (<div style={drawerFormScrollStyle}><Form form={form} layout="vertical" style={{ marginTop: 16 }} labelCol={{ style: { padding: 0, marginBottom: 4 } }}><Row gutter={[24, 0]}><Col span={12}><Form.Item name="organizationId" {...labelProps('Đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: !editingGroup, message: 'Vui lòng chọn đơn vị' }]}><OrgUnitTreeSelect organizations={orgTree} placeholder="Chọn đơn vị" showSearch disabled={!!editingGroup} allowClear style={{ ...selectStyle, borderRadius: radiusPill, height: 40, width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item name="name" {...labelProps('Tên nhóm')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }, { min: 2, max: 100, message: 'Tên nhóm phải từ 2 đến 100 ký tự' }]}><Input placeholder="Nhập tên nhóm" maxLength={100} showCount style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} /></Form.Item></Col><Col span={12}><Form.Item name="code" {...labelProps('Mã nhóm')} style={{ marginBottom: spaceFormField }} normalize={(v) => String(v ?? '').trim().toUpperCase()} rules={[{ required: true, message: 'Vui lòng nhập mã nhóm' }, { min: 2, max: 30, message: 'Mã nhóm phải từ 2 đến 30 ký tự' }, { pattern: /^[A-Z0-9_]+$/, message: 'Mã nhóm chỉ gồm chữ hoa, số và dấu gạch dưới' }]}><Input placeholder="Nhập mã nhóm" maxLength={30} showCount disabled={!!editingGroup} style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }} /></Form.Item></Col><Col span={12}><Form.Item name="status" {...labelProps('Trạng thái')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}><Select placeholder="Chọn trạng thái" options={[{ value: 'active', label: 'Sử dụng' }, { value: 'inactive', label: 'Không sử dụng' }]} style={{ ...selectStyle, borderRadius: radiusPill, height: 40, width: '100%' }} /></Form.Item></Col><Col span={24}><Form.Item name="description" {...labelProps('Mô tả')} style={{ marginBottom: spaceFormField }} rules={[{ max: 1000, message: 'Mô tả tối đa 1000 ký tự' }]}><Input.TextArea rows={3} placeholder="Nhập mô tả" maxLength={1000} showCount style={textAreaStyle} /></Form.Item></Col></Row></Form></div>) }]} /></Spin>
        </Drawer>
      </div>
    </ThemeTokenProvider>
  );
}
