import { useState, useCallback, useEffect, useMemo, memo, type FC, type ReactNode } from 'react';
import { Typography, Modal, Form, Input, Select, Spin, Button, Row, Col, Tree, Checkbox, Tabs, Empty } from 'antd';
import AppDrawer from '../components/shared/AppDrawer';
import {
  PlusOutlined, LockOutlined, UnlockOutlined, KeyOutlined,
  ExclamationCircleOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser, useToggleLockUser, useResetPassword, useForgotPassword, useChangeStatusUser } from '../hooks/useUsers';
import { usePermissionStore, type PermissionState } from '../store/permissionStore';
import { useAuthStore } from '../store/authStore';
import { ScreenHeader, DataTable } from '../components/list-view';
import FilterTableLayout from '../components/list-view/FilterTableLayout';
import Pagination from '../components/list-view/Pagination';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';
import type { PermissionTreeNode } from '../types/permission';
import { organizationService, type Organization } from '../services/organizationService';
import { userService } from '../services/userService';
import { normalizeSearchText, OrgUnitTreeSelect } from '../components/org-unit';
import {
  filterTreeByOrgLevel,
  getPermissionTreeKeys,
  getVisiblePermissionKeys,
  handleTreeCheck,
  isC1PermissionKey,
  isC2PermissionKey,
  isHiddenPermission,
  isStructuralNodeKey,
  resolveOrgLevel,
  usePermissions,
  type OrgLevel,
} from '../hooks/usePermissions';
import {
  actionPrimary, textSecondary, textPrimary, textTertiary, fontSizeMd, fontSizeLg,
  fontWeightBold, radiusPill, radiusMd, radiusTextArea, borderDefault,
  spaceFormField, spaceMd, spaceSm, spaceXs, inputStyle,
  selectStyle, drawerTitleStyle, drawerFooterStyle, drawerFormScrollStyle,
  drawerTabBarStyle, primaryButtonStyle, outlineButtonStyle,
  statusOperational, statusCritical, statusDraft, statusAttention, textAreaStyle, icons, surfaceCard,
  cellTitleStyle, cellSubtitleStyle,
} from '../themetokenchk';
import { colors } from '../themetokenchk';
import * as themeTokenChk from '../themetokenchk';
import { ThemeTokenProvider } from '../context/ThemeTokenContext';
import toast, { modal } from '../components/ToastNotification';
import { formLabelProps as labelProps } from '../components/shared/formLabel';


const { confirm } = modal;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Hoạt động', color: statusOperational },
  ACTIVE: { label: 'Hoạt động', color: statusOperational },
  locked: { label: 'Đã khóa', color: statusCritical },
  LOCKED: { label: 'Đã khóa', color: statusCritical },
  inactive: { label: 'Không hoạt động', color: statusDraft },
  INACTIVE: { label: 'Không hoạt động', color: statusDraft },
  pending_approval: { label: 'Chờ phê duyệt', color: statusAttention },
  PENDING_APPROVAL: { label: 'Chờ phê duyệt', color: statusAttention },
  pending_verification: { label: 'Chờ xác thực', color: statusAttention },
  PENDING_VERIFICATION: { label: 'Chờ xác thực', color: statusAttention },
};


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
      placeholder="Tìm theo tên hoặc mã quyền"
      style={{ borderRadius: radiusPill, height: 40 }}
    />
  );
});

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [fullName, setFullName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterOrganizationInput, setFilterOrganizationInput] = useState<string | undefined>();
  const [filterOrganizationId, setFilterOrganizationId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPasswordSubmitting, setResetPasswordSubmitting] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [permissionUser, setPermissionUser] = useState<User | null>(null);
  const {
    tree: rawPermissionTree,
    allKeys: allPermissionKeys,
    isLoading: permissionCatalogLoading,
    apiPermissions,
    validCodesSet,
  } = usePermissions();
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [appliedPermissionSearch, setAppliedPermissionSearch] = useState('');
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);

  const { data: detailResponse, isLoading: detailLoading } = useUser(detailUserId ?? undefined);
  const detailUser = detailResponse?.data ?? null;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        if (isMounted) setOrganizations(orgs);
      } catch (err) {
        console.error('Không thể tải danh sách đơn vị trực thuộc', err);
        if (isMounted) setOrganizations([]);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const hasPerm = usePermissionStore((s: PermissionState) => s.hasPermission);

  const { data, isLoading, isError, refetch } = useUsers({
    page, pageSize, search: search || undefined, fullName: fullName || undefined,
    status: filterStatus, orgUnitId: filterOrganizationId, sortField, sortOrder,
  });

  const statusCounts = data?.statusCounts;

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toggleLock = useToggleLockUser();
  const resetPassword = useResetPassword();
  const forgotPassword = useForgotPassword();
  const changeStatusUser = useChangeStatusUser();

  const openCreateModal = useCallback(() => { setEditingUser(null); form.resetFields(); setModalOpen(true); }, [form]);

  const openEditModal = useCallback((user: User) => {
    setEditingUser(user);
    form.setFieldsValue({ fullName: user.fullName, email: user.email, phone: user.phone, orgUnitId: user.orgUnitId, status: user.status, address: user.address, department: user.department, position: user.position, note: user.note });
    setModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingUser) {
        const payload: UpdateUserPayload = {
          fullName: values.fullName?.trim(),
          email: values.email?.trim(),
          phone: values.phone?.trim(),
          orgUnitId: values.orgUnitId || undefined,
          status: values.status,
          address: values.address?.trim() || undefined,
          department: values.department?.trim() || undefined,
          position: values.position?.trim() || undefined,
          note: values.note?.trim() || undefined,
        };
        await updateUser.mutateAsync({ id: editingUser.id, payload });
      } else {
        const payload: CreateUserPayload = {
          fullName: values.fullName?.trim(),
          email: values.email?.trim(),
          phone: values.phone?.trim(),
          orgUnitId: values.orgUnitId || undefined,
          status: values.status,
          address: values.address?.trim() || undefined,
          department: values.department?.trim() || undefined,
          position: values.position?.trim() || undefined,
          note: values.note?.trim() || undefined,
        };
        await createUser.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string; errorFields?: unknown };
      if (errorObj.errorFields) return;
      const msg = errorObj.response?.data?.message || errorObj.message || 'Lỗi hệ thống';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [editingUser, form, createUser, updateUser]);

  const [lockTargetUser, setLockTargetUser] = useState<User | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [lockSubmitting, setLockSubmitting] = useState(false);

  const handleDelete = useCallback((user: User) => {
    confirm({ title: 'Xác nhận xóa người dùng', icon: <ExclamationCircleOutlined />, content: `Bạn có chắc chắn muốn xóa người dùng "${user.fullName}"? Hành động này không thể hoàn tác.`, okText: 'Xóa', okType: 'danger', cancelText: 'Hủy', onOk: () => deleteUser.mutateAsync(user.id) });
  }, [deleteUser]);

  const handleToggleLock = useCallback((user: User) => {
    setLockTargetUser(user);
    setLockReason('');
  }, []);

  const handleConfirmToggleLock = useCallback(async () => {
    if (!lockTargetUser) return;
    setLockSubmitting(true);
    try {
      await toggleLock.mutateAsync({
        id: lockTargetUser.id,
        currentStatus: lockTargetUser.status,
        reason: lockReason.trim() || undefined,
      });
      setLockTargetUser(null);
      setLockReason('');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(errorObj.response?.data?.message || errorObj.message || 'Thao tác thất bại');
    } finally {
      setLockSubmitting(false);
    }
  }, [lockTargetUser, lockReason, toggleLock]);

  const handleResetPassword = useCallback((user: User) => {
    resetPasswordForm.resetFields();
    setResetPasswordUser(user);
  }, [resetPasswordForm]);

  const handleResetPasswordSubmit = useCallback(async () => {
    if (!resetPasswordUser) return;

    try {
      const values = await resetPasswordForm.validateFields();
      setResetPasswordSubmitting(true);
      await resetPassword.mutateAsync({
        id: resetPasswordUser.id,
        newPassword: values.newPassword.trim(),
      });
      setResetPasswordUser(null);
      resetPasswordForm.resetFields();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string; errorFields?: unknown };
      if (errorObj.errorFields) return;
      const msg = errorObj.response?.data?.message || errorObj.message || 'Không thể đặt lại mật khẩu';
      toast.error(msg);
    } finally {
      setResetPasswordSubmitting(false);
    }
  }, [resetPassword, resetPasswordForm, resetPasswordUser]);

  const handleForgotPassword = useCallback((user: User) => {
    confirm({
      title: 'Gửi liên kết quên mật khẩu',
      icon: <ExclamationCircleOutlined />,
      content: `Hệ thống sẽ gửi liên kết đặt lại mật khẩu tới email "${user.email}". Tiếp tục?`,
      okText: 'Gửi liên kết',
      cancelText: 'Hủy',
      onOk: () => forgotPassword.mutateAsync(user.email),
    });
  }, [forgotPassword]);
  void handleDelete;
  void handleResetPassword;
  void handleForgotPassword;

  const handleFilterApply = useCallback(() => {
    const nextSearch = searchInput.trim();
    const nextFullName = fullNameInput.trim();
    const sameFilters = nextSearch === search
      && nextFullName === fullName
      && filterOrganizationInput === filterOrganizationId
      && page === 1;

    setSearch(nextSearch);
    setFullName(nextFullName);
    setFilterOrganizationId(filterOrganizationInput);
    setPage(1);

    // Clicking Search again with unchanged filters still performs an
    // explicit request instead of waiting for the query cache to expire.
    if (sameFilters) void refetch();
  }, [filterOrganizationInput, filterOrganizationId, fullName, fullNameInput, page, refetch, search, searchInput]);

  const handleFilterReset = useCallback(() => {
    const alreadyReset = !search && !fullName && !filterStatus && !filterOrganizationId && page === 1;
    setSearchInput('');
    setSearch('');
    setFullNameInput('');
    setFullName('');
    setFilterStatus(undefined);
    setFilterOrganizationInput(undefined);
    setFilterOrganizationId(undefined);
    setPage(1);
    if (alreadyReset) void refetch();
  }, [filterOrganizationId, filterStatus, fullName, page, refetch, search]);

  const handleTabChange = useCallback((key: string) => {
    const nextStatus = key === 'all' ? undefined : key;
    setFilterStatus(nextStatus);
    setPage(1);
  }, []);

  const handleSort = useCallback((key: string, order: 'asc' | 'desc' | null) => {
    if (!order) {
      setSortField(undefined);
      setSortOrder(null);
    } else {
      setSortField(key);
      setSortOrder(order === 'asc' ? 'ascend' : 'descend');
    }
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => { setPage(p); setPageSize(ps); }, []);

  const handleApprove = useCallback((user: User) => {
    confirm({ title: 'Phê duyệt tài khoản', icon: <ExclamationCircleOutlined />, content: `Bạn có chắc chắn muốn phê duyệt tài khoản "${user.fullName}"?`, okText: 'Phê duyệt', cancelText: 'Hủy', onOk: () => changeStatusUser.mutateAsync({ id: user.id, status: 'ACTIVE' }) });
  }, [changeStatusUser]);

  const handleReject = useCallback((user: User) => {
    confirm({ title: 'Từ chối tài khoản', icon: <ExclamationCircleOutlined />, content: `Bạn có chắc chắn muốn từ chối tài khoản "${user.fullName}"?`, okText: 'Từ chối', okType: 'danger', cancelText: 'Hủy', onOk: () => changeStatusUser.mutateAsync({ id: user.id, status: 'INACTIVE' }) });
  }, [changeStatusUser]);

  const targetUserOrgLevel = useMemo<OrgLevel>(() => {
    if (!permissionUser) return 'ALL';
    if (permissionUser.username?.toLowerCase() === 'admin') {
      return 'CUC';
    }
    return resolveOrgLevel(permissionUser.orgUnitId, permissionUser.orgUnitName, organizations);
  }, [permissionUser, organizations]);

  const userScopedRawPermissionTree = useMemo(() => {
    return filterTreeByOrgLevel(rawPermissionTree, targetUserOrgLevel);
  }, [rawPermissionTree, targetUserOrgLevel]);

  const openPermissionModal = useCallback(async (user: User) => {
    setPermissionUser(user);
    setAppliedPermissionSearch('');
    setPermissionLoading(true);
    try {
      const userLevel = user.username?.toLowerCase() === 'admin'
        ? 'CUC'
        : resolveOrgLevel(user.orgUnitId, user.orgUnitName, organizations);

      const grants = await userService.getUserPermissions(user.id);
      const rawCodes = grants.map((grant) => typeof grant === 'string' ? grant : grant.permissionCode).filter(Boolean);
      let cleanCodes = rawCodes.filter((code) => !isHiddenPermission(code));

      if (userLevel === 'CANG_VU') {
        cleanCodes = cleanCodes.filter((code) => !isC2PermissionKey(code));
      } else if (userLevel === 'CUC') {
        cleanCodes = cleanCodes.filter((code) => !isC1PermissionKey(code));
      }

      if (rawCodes.includes('*')) {
        const scopedTree = filterTreeByOrgLevel(rawPermissionTree, userLevel);
        const scopedLeafKeys = Array.from(getPermissionTreeKeys(scopedTree)).filter((k) => !isStructuralNodeKey(k));
        setSelectedPermissionKeys(scopedLeafKeys.length > 0 ? scopedLeafKeys : cleanCodes);
      } else {
        setSelectedPermissionKeys(cleanCodes);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(errorObj.response?.data?.message || errorObj.message || 'Không thể tải quyền trực tiếp của người dùng');
      setPermissionUser(null);
    } finally {
      setPermissionLoading(false);
    }
  }, [rawPermissionTree, organizations]);

  useEffect(() => {
    if (permissionUser && allPermissionKeys.length > 0) {
      queueMicrotask(() => {
        setSelectedPermissionKeys((prev) => {
          if (prev.includes('*')) {
            const scopedTree = filterTreeByOrgLevel(rawPermissionTree, targetUserOrgLevel);
            return Array.from(getPermissionTreeKeys(scopedTree)).filter((k) => !isStructuralNodeKey(k));
          }
          return prev;
        });
      });
    }
  }, [permissionUser, allPermissionKeys, rawPermissionTree, targetUserOrgLevel]);

  const handlePermissionSave = useCallback(async () => {
    if (!permissionUser) return;
    setPermissionSaving(true);
    try {
      const validCodes = validCodesSet || new Set(apiPermissions.map((p) => p.key.toLowerCase()));
      const keysToSave = selectedPermissionKeys.filter((k) => {
        if (k === '*' || isStructuralNodeKey(k)) return false;
        if (targetUserOrgLevel === 'CANG_VU' && isC2PermissionKey(k)) return false;
        if (targetUserOrgLevel === 'CUC' && isC1PermissionKey(k)) return false;
        return validCodes.size === 0 || validCodes.has(k.toLowerCase());
      });

      await userService.replaceDirectPermissions(permissionUser.id, keysToSave);
      toast.success('Đã cập nhật quyền trực tiếp cho người dùng');
      setPermissionUser(null);
      await refetch();

      const currentAuthUser = useAuthStore.getState().user;
      if (currentAuthUser && (currentAuthUser.id === permissionUser.id || currentAuthUser.username === permissionUser.username)) {
        await useAuthStore.getState().refreshPermissions();
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(errorObj.response?.data?.message || errorObj.message || 'Cập nhật quyền trực tiếp thất bại');
    } finally {
      setPermissionSaving(false);
    }
  }, [permissionUser, selectedPermissionKeys, refetch, apiPermissions, validCodesSet, targetUserOrgLevel]);


  const indexedPermissionTree = useMemo(() => {
    interface IndexedPermissionNode extends PermissionTreeNode {
      _searchStr?: string;
      children?: IndexedPermissionNode[];
    }
    const attachMeta = (nodes: PermissionTreeNode[]): IndexedPermissionNode[] => nodes.map((node) => ({
      ...node,
      _searchStr: normalizeSearchText(`${node.title} ${node.key}`),
      children: node.children ? attachMeta(node.children) : [],
    }));
    return attachMeta(userScopedRawPermissionTree);
  }, [userScopedRawPermissionTree]);

  const permissionTreeData = useMemo(() => {
    const keyword = normalizeSearchText(appliedPermissionSearch);
    if (!keyword) return userScopedRawPermissionTree;
    interface IndexedPermissionNode extends PermissionTreeNode {
      _searchStr?: string;
      children?: IndexedPermissionNode[];
    }
    const filter = (nodes: IndexedPermissionNode[]): IndexedPermissionNode[] => nodes.flatMap((node) => {
      const parentMatches = node._searchStr ? node._searchStr.includes(keyword) : false;
      if (parentMatches) {
        return [{ ...node, children: node.children || [] }];
      }
      const children = filter(node.children || []);
      return children.length ? [{ ...node, children }] : [];
    });
    return filter(indexedPermissionTree);
  }, [indexedPermissionTree, userScopedRawPermissionTree, appliedPermissionSearch]);

  const allLeafKeys = useMemo(
    () => Array.from(getPermissionTreeKeys(userScopedRawPermissionTree)).filter((k) => !isStructuralNodeKey(k)),
    [userScopedRawPermissionTree],
  );

  const visibleSelectedKeys = useMemo(
    () => getVisiblePermissionKeys(selectedPermissionKeys, userScopedRawPermissionTree),
    [selectedPermissionKeys, userScopedRawPermissionTree],
  );

  const allPermissionsSelected = allLeafKeys.length > 0
    && allLeafKeys.every((key) => visibleSelectedKeys.includes(key));
  const somePermissionsSelected = visibleSelectedKeys.length > 0 && !allPermissionsSelected;

  const rowActions = useCallback((record: User) => {
    const actions: {
      key: string; label: string; icon?: ReactNode;
      onClick: () => void; danger?: boolean;
    }[] = [];

    if (hasPerm('user:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => setDetailUserId(record.id) });
    }

    if (hasPerm('user:permission') || hasPerm('user:manage')) {
      actions.push({ key: 'permissions', label: 'Phân quyền', icon: <KeyOutlined />, onClick: () => openPermissionModal(record) });
    }

    const s = (record.status || '').toUpperCase();
    if (s === 'PENDING_APPROVAL' || s === 'PENDING_VERIFICATION') {
      if (hasPerm('user:approve')) actions.push({ key: 'approve', label: 'Phê duyệt tài khoản', icon: icons.approve, onClick: () => handleApprove(record) });
      if (hasPerm('user:approve')) actions.push({ key: 'reject', label: 'Từ chối tài khoản', icon: icons.reject, onClick: () => handleReject(record), danger: true });
    } else {
      if (hasPerm('user:update') || hasPerm('user:manage')) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => openEditModal(record) });
      if (hasPerm('user:lock') || hasPerm('user:manage')) actions.push({ key: 'lock', label: record.status === 'locked' ? 'Mở khóa' : 'Khóa', icon: record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />, onClick: () => handleToggleLock(record) });
      // Intentionally hidden per TRI-1786688745847-4d03: reset-password, forgot-password, delete row actions.
      // Handlers/modals/hooks (handleResetPassword, handleForgotPassword, handleDelete) remain intact.
    }
    return actions;
  }, [hasPerm, openPermissionModal, openEditModal, handleToggleLock, handleApprove, handleReject]);

  const columns = useMemo(() => [
    {
      key: 'sequenceNo',
      label: 'STT',
      width: 60,
      type: 'mono' as const,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + idx + 1}</span>
      ),
    },
    {
      key: 'fullName',
      label: 'Họ và tên',
      dataIndex: 'fullName',
      width: 260,
      fixed: 'left' as const,
      sortable: true,
      sorter: true,
      align: 'left' as const,
      ellipsis: false,
      sortOrder: sortField === 'fullName' ? sortOrder : null,
      render: (text: string, record: User) => (
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <a
            title={text}
            onClick={() => setDetailUserId(record.id)}
            style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {text}
          </a>
          {record.username && (
            <span
              style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={record.username}
            >
              {record.username}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      dataIndex: 'email',
      width: 200,
      sortable: true,
      sorter: true,
      align: 'left' as const,
      sortOrder: sortField === 'email' ? sortOrder : null,
      render: (text: string) => <span style={{ color: textSecondary, fontSize: fontSizeMd }}>{text}</span>,
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      dataIndex: 'phone',
      width: 140,
      sortable: true,
      align: 'left' as const,
      render: (text: string) => <span style={{ color: textPrimary, fontSize: fontSizeMd }}>{text || '—'}</span>,
    },
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 240,
      sortable: true,
      align: 'left' as const,
      sortOrder: sortField === 'orgUnitName' ? sortOrder : null,
      render: (text: string) => (
        text ? <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> : <span style={{ color: textTertiary }}>—</span>
      ),
    },
    {
      key: 'position',
      label: 'Chức vụ / Phòng ban',
      dataIndex: 'position',
      width: 200,
      sortable: true,
      align: 'left' as const,
      render: (_: unknown, record: User) => (
        <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
          <div
            style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={record.position || ''}
          >
            {record.position || '—'}
          </div>
          {record.department && (
            <div
              style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={record.department}
            >
              {record.department}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'groupNames',
      label: 'Nhóm nghiệp vụ',
      dataIndex: 'groupNames',
      width: 180,
      align: 'left' as const,
      render: (names: string[] | undefined) => (
        names && names.length > 0 ? (
          <span style={{ color: textPrimary, fontSize: fontSizeMd }} title={names.join(', ')}>
            {names.join(', ')}
          </span>
        ) : (
          <span style={{ color: textTertiary }}>—</span>
        )
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 160,
      sortable: true,
      align: 'left' as const,
      ellipsis: false,
      sortOrder: sortField === 'status' ? sortOrder : null,
      render: (status: string) => {
        const conf = STATUS_CONFIG[status] || { label: status, color: statusDraft };
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: radiusPill,
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: `${conf.color}15`,
              border: `1px solid ${conf.color}40`,
              color: conf.color,
              lineHeight: '20px',
            }}
          >
            {conf.label}
          </span>
        );
      },
    },
    {
      key: 'lastLoginAt',
      label: 'Đăng nhập cuối',
      dataIndex: 'lastLoginAt',
      width: 170,
      sortable: true,
      align: 'left' as const,
      sortOrder: sortField === 'lastLoginAt' ? sortOrder : null,
      render: (text: string) => (
        text ? (
          <span style={{ color: textSecondary, fontSize: fontSizeMd }}>{dayjs(text).format('DD/MM/YYYY HH:mm')}</span>
        ) : (
          <span style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa đăng nhập</span>
        )
      ),
    },
    {
      key: 'updatedAt',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedByName',
      width: 215,
      sortable: true,
      align: 'left' as const,
      ellipsis: false,
      sortOrder: (sortField === 'updatedAt' || sortField === 'updatedByName') ? sortOrder : null,
      render: (_: unknown, record: User) => {
        const name = record.updatedByName || record.createdByName || '—';
        const date = record.updatedAt || record.createdAt;
        return (
          <div style={{ lineHeight: '1.35', overflow: 'hidden' }}>
            <div
              style={{ fontWeight: fontWeightBold, color: '#0F172A', fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={name}
            >
              {name}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
  ], [page, pageSize, sortField, sortOrder]);

  const renderContent = () => {
    const tableData = data?.data || [];
    return (
      <>
        <DataTable
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          rowActions={rowActions}
          loading={isLoading}
          onSort={handleSort}
          scroll={{ x: 'max-content' }}
        />
        {/* Luôn hiển thị phân trang cố định ở đáy giống Trung tâm VTS (Tổng cộng: 0) */}
        <Pagination total={data?.total || 0} current={page} pageSize={pageSize} onChange={handlePageChange} />
      </>
    );
  };

  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Email</div>
        <Input
          placeholder="Tìm theo email"
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Họ tên</div>
        <Input
          placeholder="Tìm theo họ tên"
          allowClear
          value={fullNameInput}
          onChange={(e) => setFullNameInput(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ ...inputStyle, borderRadius: radiusPill, height: 40 }}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Đơn vị</div>
        <OrgUnitTreeSelect
          organizations={organizations}
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

  const statusTabs = [
    { key: 'all', label: 'Tất cả', count: statusCounts?.total ?? (data?.total || 0), color: colors.primary, active: !filterStatus },
    { key: 'active', label: 'Hoạt động', count: statusCounts?.active ?? 0, color: statusOperational, active: filterStatus === 'active' },
    { key: 'locked', label: 'Đã khóa', count: statusCounts?.locked ?? 0, color: statusCritical, active: filterStatus === 'locked' },
    { key: 'inactive', label: 'Không hoạt động', count: statusCounts?.inactive ?? 0, color: statusDraft, active: filterStatus === 'inactive' },
  ];

  const headerActions = useMemo(() => {
    const actions: {
      key: string;
      label: string;
      variant: 'primary' | 'outline' | 'subtle';
      icon?: ReactNode;
      onClick: () => void;
    }[] = [];
    if (hasPerm('user:create') || hasPerm('user.create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary',
        icon: <PlusOutlined />,
        onClick: openCreateModal,
      });
    }
    return actions;
  }, [hasPerm, openCreateModal]);


  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5 }}>
      <div className="users-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .users-page-wrapper,
          .users-page-wrapper .ant-table,
          .users-page-wrapper .ant-table-cell,
          .users-page-wrapper .ant-table-thead > tr > th,
          .users-page-wrapper .ant-table-tbody > tr > td,
          .users-page-wrapper .ant-input,
          .users-page-wrapper .ant-select,
          .users-page-wrapper .ant-select-selection-item,
          .users-page-wrapper .ant-picker,
          .users-page-wrapper .ant-btn,
          .users-page-wrapper .ant-pagination,
          .users-page-wrapper .ant-pagination-item,
          .users-page-wrapper .ant-pagination-total-text,
          .users-page-wrapper .ant-breadcrumb,
          .users-page-wrapper .ant-form-item-label > label,
          .users-drawer-scope,
          .users-drawer-scope .ant-drawer-content,
          .users-drawer-scope .ant-tabs-tab,
          .users-drawer-scope .chk-detail-label,
          .users-drawer-scope .chk-detail-value,
          .users-drawer-scope .ant-table,
          .users-drawer-scope .ant-table-cell,
          .users-drawer-scope .ant-btn,
          .users-drawer-scope .ant-select,
          .users-drawer-scope .ant-input,
          .users-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }

          /* Responsive StatusTabs */
          .users-page-wrapper div:has(> button[aria-pressed]) {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            justify-content: safe center !important;
            align-items: center !important;
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 #f8fafc !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            padding: 2px 8px 4px 8px !important;
            gap: clamp(6px, 1vw, 14px) !important;
          }
          .users-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 4px !important;
            display: block !important;
          }
          .users-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .users-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .users-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .users-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
            padding: 4px 2px !important;
          }

          /* Responsive Drawers */
          .users-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
          @media (max-width: 1024px) {
            .users-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .users-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
          }
          @media (max-width: 640px) {
            .users-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
              padding: 8px 0 !important;
            }
            .users-drawer-scope .chk-detail-label {
              width: 100% !important;
            }
            .users-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
        `}</style>
        <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý tài khoản người dùng' }]} actions={headerActions} />
        <FilterTableLayout
          hideFilterToggle
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          loading={isLoading}
          error={isError}
          onRetry={() => refetch()}
          filterContent={filterContent}
          statusTabs={statusTabs}
          onStatusTabChange={handleTabChange}
        >
          {renderContent()}
        </FilterTableLayout>

        <AppDrawer
          size="50%"
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          rootClassName="users-drawer-scope"
          className="users-drawer-scope"
          destroyOnHidden
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm mới người dùng'}</span>
          }
          footer={
            <div style={drawerFooterStyle}>
              <Button onClick={() => setModalOpen(false)} style={outlineButtonStyle}>Hủy</Button>
              <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>{editingUser ? 'Cập nhật' : 'Tạo mới'}</Button>
            </div>
          }
        >
          <Tabs
            tabBarStyle={drawerTabBarStyle}
            animated={false}
            items={[
              {
                key: 'general',
                label: 'Thông tin chung',
                children: (
                  <Spin spinning={submitting}>
                    <div style={drawerFormScrollStyle}>
                      <Form
                        form={form}
                        layout="vertical"
                        style={{ marginTop: spaceMd }}
                        labelCol={{ style: { padding: 0, marginBottom: 4 } }}
                        initialValues={{ status: 'active' }}
                      >
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <Form.Item name="orgUnitId" {...labelProps('Đơn vị')} style={{ marginBottom: spaceFormField }} rules={[{ required: !editingUser, message: 'Vui lòng chọn đơn vị' }]}>
                              <OrgUnitTreeSelect
                                organizations={organizations}
                                currentOrgName={editingUser?.orgUnitName}
                                placeholder="Chọn đơn vị"
                                allowClear
                                disabled={Boolean(editingUser)}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              name="status"
                              {...labelProps('Trạng thái')}
                              style={{ marginBottom: spaceFormField }}
                              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                            >
                              <Select
                                placeholder="Chọn trạng thái"
                                options={[
                                  { value: 'active', label: 'Hoạt động' },
                                  { value: 'inactive', label: 'Không hoạt động' },
                                ]}
                                style={selectStyle}
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item name="fullName" {...labelProps('Họ và tên')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập họ tên' }, { max: 200, message: 'Tối đa 200 ký tự' }]}>
                              <Input placeholder="Nhập họ và tên" maxLength={200} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="email" {...labelProps('Email')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }, { max: 150, message: 'Tối đa 150 ký tự' }]}>
                              <Input placeholder="Nhập email" autoComplete="email" disabled={Boolean(editingUser)} maxLength={150} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item name="phone" {...labelProps('Số điện thoại')} style={{ marginBottom: spaceFormField }} rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}>
                              <Input placeholder="Nhập số điện thoại" maxLength={15} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="address" {...labelProps('Địa chỉ')} style={{ marginBottom: spaceFormField }} rules={[{ max: 255, message: 'Địa chỉ tối đa 255 ký tự' }]}>
                              <Input placeholder="Nhập địa chỉ" maxLength={255} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item name="department" {...labelProps('Phòng ban')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập phòng ban' }, { max: 100, message: 'Phòng ban tối đa 100 ký tự' }]}>
                              <Input placeholder="Nhập phòng ban" maxLength={100} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="position" {...labelProps('Chức vụ')} style={{ marginBottom: spaceFormField }} rules={[{ max: 100, message: 'Chức vụ tối đa 100 ký tự' }]}>
                              <Input placeholder="Nhập chức vụ" maxLength={100} showCount style={inputStyle} />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Form.Item name="note" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }} rules={[{ max: 500, message: 'Ghi chú tối đa 500 ký tự' }]}>
                              <Input.TextArea placeholder="Nhập ghi chú" rows={3} maxLength={500} showCount style={textAreaStyle} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Form>
                    </div>
                  </Spin>
                ),
              },
            ]}
          />
        </AppDrawer>


        <Modal
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Đặt lại mật khẩu</span>}
          open={Boolean(resetPasswordUser)}
          onOk={handleResetPasswordSubmit}
          onCancel={() => setResetPasswordUser(null)}
          destroyOnHidden
          confirmLoading={resetPasswordSubmitting}
          width={600}
          mask={{ closable: false }}
          footer={[
            <Button
              key="cancel"
              onClick={() => setResetPasswordUser(null)}
              style={outlineButtonStyle}
            >
              Hủy
            </Button>,
            <Button
              key="ok"
              type="primary"
              onClick={handleResetPasswordSubmit}
              loading={resetPasswordSubmitting}
              style={primaryButtonStyle}
            >
              Đặt lại mật khẩu
            </Button>,
          ]}
        >
          <Spin spinning={resetPasswordSubmitting}>
            <Typography.Text style={{ color: textSecondary, fontSize: fontSizeMd }}>
              Tài khoản: <strong>{resetPasswordUser?.fullName}</strong> ({resetPasswordUser?.username})
            </Typography.Text>
            <Form
              form={resetPasswordForm}
              layout="vertical"
              style={{ marginTop: spaceMd }}
              labelCol={{ style: { padding: 0, marginBottom: 4 } }}
            >
              <Form.Item
                name="newPassword"
                {...labelProps('Mật khẩu mới')}
                style={{ marginBottom: spaceFormField }}
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  {
                    validator: (_, value) => {
                      const password = typeof value === 'string' ? value.trim() : '';
                      if (!password) return Promise.resolve();
                      if (password.length < 8) return Promise.reject(new Error('Mật khẩu phải có ít nhất 8 ký tự'));
                      if (password.length > 128) return Promise.reject(new Error('Mật khẩu tối đa 128 ký tự'));
                      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
                        return Promise.reject(new Error('Mật khẩu phải có ít nhất một chữ cái và một số'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.Password
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                {...labelProps('Xác nhận mật khẩu')}
                dependencies={['newPassword']}
                style={{ marginBottom: spaceFormField }}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                  ({ getFieldValue }) => ({
                    validator: (_, value) => {
                      const password = getFieldValue('newPassword')?.trim();
                      const confirmation = typeof value === 'string' ? value.trim() : '';
                      if (!confirmation || password === confirmation) return Promise.resolve();
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </Form.Item>
            </Form>
          </Spin>
        </Modal>

        <AppDrawer
          size="50%"
          open={Boolean(permissionUser)}
          onClose={() => {
            setPermissionUser(null);
            setAppliedPermissionSearch('');
          }}
          destroyOnHidden
          rootClassName="users-drawer-scope"
          className="users-drawer-scope"
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>Phân quyền chức năng cho người dùng{permissionUser ? `: ${permissionUser.fullName}` : ''}</span>
          }
          footer={
            <div style={drawerFooterStyle}>
              <Button
                onClick={() => {
                  setPermissionUser(null);
                  setAppliedPermissionSearch('');
                }}
                style={outlineButtonStyle}
              >
                Đóng
              </Button>
              <Button type="primary" loading={permissionSaving} onClick={handlePermissionSave} style={primaryButtonStyle}>Lưu</Button>
            </div>
          }
        >
          <Spin spinning={permissionLoading || permissionCatalogLoading} wrapperClassName="chk-h-full">
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', padding: '16px 0 8px 0' }}>
              <div style={{ flexShrink: 0, marginBottom: spaceMd }}>
                <PermissionSearchBar onSearch={setAppliedPermissionSearch} />
              </div>
              {permissionTreeData.length === 0 && !permissionLoading ? (
                <Empty description="Không tìm thấy quyền phù hợp" />
              ) : (
                <div style={{
                  border: `1px solid ${borderDefault}`,
                  borderRadius: radiusMd,
                  padding: spaceMd,
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  background: surfaceCard,
                }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceMd, flexShrink: 0 }}>Danh sách chức năng</div>
                  <div style={{ marginBottom: spaceMd, flexShrink: 0 }}>
                    <Checkbox
                      checked={allPermissionsSelected}
                      indeterminate={somePermissionsSelected}
                      disabled={permissionLoading || permissionCatalogLoading || allLeafKeys.length === 0}
                      onChange={() => {
                        if (allPermissionsSelected || somePermissionsSelected) {
                          setSelectedPermissionKeys([]);
                        } else {
                          setSelectedPermissionKeys([...allLeafKeys]);
                        }
                      }}
                    >
                      HỆ THỐNG THÔNG TIN QUẢN LÝ KẾT CẤU HẠ TẦNG GIAO THÔNG HÀNG HẢI
                    </Checkbox>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    <Tree
                      checkable
                      defaultExpandAll
                      treeData={permissionTreeData}
                      checkedKeys={getVisiblePermissionKeys(selectedPermissionKeys, permissionTreeData)}
                      onCheck={(checked, info) => {
                        const next = handleTreeCheck(
                          checked,
                          info,
                          selectedPermissionKeys,
                          permissionTreeData,
                          validCodesSet,
                        );
                        setSelectedPermissionKeys(next);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Spin>
        </AppDrawer>

        <AppDrawer
          size="50%"
          open={detailUserId !== null}
          onClose={() => setDetailUserId(null)}
          rootClassName="users-drawer-scope"
          className="users-drawer-scope"
          destroyOnHidden
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              {detailUser?.fullName ? `Xem chi tiết — ${detailUser.fullName}` : 'Xem chi tiết tài khoản'}
            </span>
          }
          footer={null}
        >
          {detailLoading ? <Spin /> : detailUser && (
            <Tabs
              tabBarStyle={drawerTabBarStyle}
              animated={false}
              items={[
                {
                  key: 'general',
                  label: 'Thông tin chung',
                  children: (
                    <div style={drawerFormScrollStyle}>
                      <div style={{ paddingTop: spaceMd }}>
                        <div className="chk-detail-grid">
                          <div className="chk-detail-row"><span className="chk-detail-label">Họ và tên</span><span className="chk-detail-value">{detailUser.fullName || '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Email</span><span className="chk-detail-value">{detailUser.email || '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Đơn vị trực thuộc</span><span className="chk-detail-value">{detailUser.orgUnitName || '—'}</span></div>
                          <div className="chk-detail-row">
                            <span className="chk-detail-label">Trạng thái</span>
                            <span className="chk-detail-value">
                              {(() => {
                                const conf = STATUS_CONFIG[detailUser.status] || { label: detailUser.status, color: statusDraft };
                                return (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 10px',
                                      borderRadius: radiusPill,
                                      fontSize: 13,
                                      fontWeight: 500,
                                      backgroundColor: `${conf.color}15`,
                                      border: `1px solid ${conf.color}40`,
                                      color: conf.color,
                                    }}
                                  >
                                    {conf.label}
                                  </span>
                                );
                              })()}
                            </span>
                          </div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Số điện thoại</span><span className="chk-detail-value">{detailUser.phone || '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Địa chỉ</span><span className="chk-detail-value">{detailUser.address || '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Phòng ban</span><span className="chk-detail-value">{detailUser.department || '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Chức vụ</span><span className="chk-detail-value">{detailUser.position || '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Nhóm nghiệp vụ</span><span className="chk-detail-value">{detailUser.groupNames?.length ? detailUser.groupNames.join(', ') : '—'}</span></div>
                          <div className="chk-detail-row chk-detail-row--full"><span className="chk-detail-label">Ghi chú</span><span className="chk-detail-value">{detailUser.note || '—'}</span></div>
                        </div>

                        <div style={{ marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'inline-block', width: 4, height: 16, borderRadius: 2, backgroundColor: actionPrimary }} />
                          <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Thông tin hệ thống
                          </span>
                        </div>

                        <div className="chk-detail-grid">
                          <div className="chk-detail-row"><span className="chk-detail-label">Người tạo</span><span className="chk-detail-value">{detailUser.createdByName || '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Ngày tạo</span><span className="chk-detail-value">{detailUser.createdAt ? dayjs(detailUser.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Người cập nhật</span><span className="chk-detail-value">{detailUser.updatedByName || '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Ngày cập nhật</span><span className="chk-detail-value">{detailUser.updatedAt ? dayjs(detailUser.updatedAt).format('DD/MM/YYYY HH:mm') : '—'}</span></div>
                          <div className="chk-detail-row"><span className="chk-detail-label">Đăng nhập gần nhất</span><span className="chk-detail-value">{detailUser.lastLoginAt ? dayjs(detailUser.lastLoginAt).format('DD/MM/YYYY HH:mm') : '—'}</span></div>
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </AppDrawer>




        <Modal
          open={Boolean(lockTargetUser)}
          title={
            <span style={{ fontSize: fontSizeLg, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              {lockTargetUser?.status === 'locked' ? 'Xác nhận mở khóa tài khoản' : 'Xác nhận khóa tài khoản'}
            </span>
          }
          onCancel={() => { if (!lockSubmitting) setLockTargetUser(null); }}
          footer={[
            <Button key="cancel" onClick={() => setLockTargetUser(null)} style={outlineButtonStyle} disabled={lockSubmitting}>
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              danger={lockTargetUser?.status !== 'locked'}
              loading={lockSubmitting}
              onClick={handleConfirmToggleLock}
              style={lockTargetUser?.status === 'locked' ? primaryButtonStyle : { borderRadius: radiusPill, height: 40 }}
            >
              {lockTargetUser?.status === 'locked' ? 'Mở khóa' : 'Khóa'}
            </Button>,
          ]}
        >
          <div style={{ padding: `${spaceSm}px 0` }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceMd }}>
              {lockTargetUser?.status === 'locked'
                ? `Bạn có chắc chắn muốn mở khóa cho tài khoản "${lockTargetUser?.fullName}" (${lockTargetUser?.email})?`
                : `Tài khoản "${lockTargetUser?.fullName}" (${lockTargetUser?.email}) sẽ bị khóa và không thể đăng nhập. Tiếp tục?`}
            </p>
            <div style={{ marginBottom: spaceSm }}>
              <label style={{ display: 'block', fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, marginBottom: spaceXs }}>
                Lý do:
              </label>
              <Input.TextArea
                rows={3}
                placeholder={lockTargetUser?.status !== 'locked' ? "Nhập lý do khóa tài khoản" : "Nhập lý do mở khóa tài khoản"}
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                style={{ borderRadius: radiusTextArea || radiusMd }}
                maxLength={500}
                showCount
              />
            </div>
          </div>
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
}


