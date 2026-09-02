import { useState, useCallback, useEffect, useMemo, memo, type FC, type ReactNode } from 'react';
import { Typography, Modal, Form, Input, Select, Spin, Button, Row, Col, Drawer, Tree, Checkbox, Tabs, Empty } from 'antd';
import {
  PlusOutlined, LockOutlined, UnlockOutlined, KeyOutlined,
  ExclamationCircleOutlined, CloseOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser, useToggleLockUser, useResetPassword, useForgotPassword, useChangeStatusUser } from '../hooks/useUsers';
import { usePermissionStore } from '../store/permissionStore';
import { ScreenHeader, DataTable } from '../components/list-view';
import FilterTableLayout from '../components/list-view/FilterTableLayout';
import Pagination from '../components/list-view/Pagination';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';
import { organizationService, type Organization } from '../services/organizationService';
import { userService } from '../services/userService';
import { normalizeSearchText, OrgUnitTreeSelect } from '../components/org-unit';
import { getVisiblePermissionKeys, mergePermissionKeys, usePermissions } from '../hooks/usePermissions';
import {
  actionPrimary, textSecondary, textPrimary, textTertiary, fontSizeSm, fontSizeMd, fontSizeLg,
  fontWeightBold, fontWeightMedium, radiusPill, radiusMd, radiusTextArea, borderDefault,
  spaceFormField, spaceMd, spaceSm, spaceXs, inputStyle,
  selectStyle, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, drawerStyles, drawerFormScrollStyle,
  drawerTabBarStyle, primaryButtonStyle, outlineButtonStyle,
  statusOperational, statusCritical, statusDraft, statusAttention, textAreaStyle, icons, surfaceCard,
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

  const { tree: rawPermissionTree, allKeys: allPermissionKeys, isLoading: permissionCatalogLoading } = usePermissions();
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
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

  const hasPerm = usePermissionStore((s: any) => s.hasPermission);

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
    } catch (err: any) {
      if (err.errorFields) return;
      const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống';
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
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Thao tác thất bại');
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
    } catch (err: any) {
      if (err.errorFields) return;
      const msg = err.response?.data?.message || err.message || 'Không thể đặt lại mật khẩu';
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
  }, [filterStatus, fullName, page, refetch, search]);

  const handleTabChange = useCallback((key: string) => {
    const nextStatus = key === 'all' ? undefined : key;
    setFilterStatus(nextStatus);
    setPage(1);
  }, []);

  const handleSort = useCallback((key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); }, []);

  const handlePageChange = useCallback((p: number, ps: number) => { setPage(p); setPageSize(ps); }, []);

  const handleApprove = useCallback((user: User) => {
    confirm({ title: 'Phê duyệt tài khoản', icon: <ExclamationCircleOutlined />, content: `Bạn có chắc chắn muốn phê duyệt tài khoản "${user.fullName}"?`, okText: 'Phê duyệt', cancelText: 'Hủy', onOk: () => changeStatusUser.mutateAsync({ id: user.id, status: 'ACTIVE' }) });
  }, [changeStatusUser]);

  const handleReject = useCallback((user: User) => {
    confirm({ title: 'Từ chối tài khoản', icon: <ExclamationCircleOutlined />, content: `Bạn có chắc chắn muốn từ chối tài khoản "${user.fullName}"?`, okText: 'Từ chối', okType: 'danger', cancelText: 'Hủy', onOk: () => changeStatusUser.mutateAsync({ id: user.id, status: 'INACTIVE' }) });
  }, [changeStatusUser]);

  const openPermissionModal = useCallback(async (user: User) => {
    setPermissionUser(user);
    setAppliedPermissionSearch('');
    setPermissionLoading(true);
    try {
      const grants = await userService.getUserPermissions(user.id);
      setSelectedPermissionKeys(grants.map((grant) => typeof grant === 'string' ? grant : grant.permissionCode).filter(Boolean));
    } catch (err: any) {
      setSelectedPermissionKeys(user.permissionCodes || []);
      toast.error(err.response?.data?.message || err.message || 'Không thể tải quyền trực tiếp của người dùng');
    } finally {
      setPermissionLoading(false);
    }
  }, []);

  const handlePermissionSave = useCallback(async () => {
    if (!permissionUser) return;
    setPermissionSaving(true);
    try {
      await userService.replaceDirectPermissions(permissionUser.id, selectedPermissionKeys);
      toast.success('Đã cập nhật quyền trực tiếp cho người dùng');
      setPermissionUser(null);
      await refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Cập nhật quyền trực tiếp thất bại');
    } finally {
      setPermissionSaving(false);
    }
  }, [permissionUser, selectedPermissionKeys, refetch]);

  const indexedPermissionTree = useMemo(() => {
    const attachMeta = (nodes: typeof rawPermissionTree): any[] => nodes.map((node) => ({
      ...node,
      _searchStr: normalizeSearchText(`${node.title} ${node.key}`),
      children: node.children ? attachMeta(node.children) : [],
    }));
    return attachMeta(rawPermissionTree);
  }, [rawPermissionTree]);

  const permissionTreeData = useMemo(() => {
    const keyword = normalizeSearchText(appliedPermissionSearch);
    if (!keyword) return rawPermissionTree;
    const filter = (nodes: any[]): any[] => nodes.flatMap((node) => {
      const parentMatches = node._searchStr.includes(keyword);
      if (parentMatches) {
        return [{ ...node, children: node.children || [] }];
      }
      const children = filter(node.children || []);
      return children.length ? [{ ...node, children }] : [];
    });
    return filter(indexedPermissionTree);
  }, [indexedPermissionTree, rawPermissionTree, appliedPermissionSearch]);

  const allPermissionsSelected = allPermissionKeys.length > 0
    && allPermissionKeys.every((key) => selectedPermissionKeys.includes(key));
  const somePermissionsSelected = allPermissionKeys.some((key) => selectedPermissionKeys.includes(key));

  const rowActions = useCallback((record: User) => {
    const actions: {
      key: string; label: string; icon?: ReactNode;
      onClick: () => void; danger?: boolean;
    }[] = [];

    if (hasPerm('user:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => setDetailUserId(record.id) });
    }

    if (hasPerm('user:manage')) {
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
  }, [hasPerm, openPermissionModal, openEditModal, handleToggleLock, handleResetPassword, handleForgotPassword, handleDelete, handleApprove, handleReject]);

  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, fixed: 'left' as const, render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'fullName', label: 'Họ và tên', dataIndex: 'fullName', width: 260, sortable: true, sorter: true, align: 'left' as const, sortOrder: sortField === 'fullName' ? sortOrder : null, render: (text: string) => <span style={{ color: textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>{text}</span> },
    { key: 'email', label: 'Email', dataIndex: 'email', width: 200, sortable: true, align: 'left' as const, sortOrder: sortField === 'email' ? sortOrder : null, render: (text: string) => <span style={{ color: textSecondary, fontSize: fontSizeMd }}>{text}</span> },
    { key: 'orgUnitName', label: 'Đơn vị', dataIndex: 'orgUnitName', width: 220, sortable: true, align: 'left' as const, sortOrder: sortField === 'orgUnitName' ? sortOrder : null, render: (text: string) => text ? <span style={{ color: textPrimary, fontSize: fontSizeMd }}>{text}</span> : <span style={{ color: textTertiary }}>—</span> },
    { key: 'lastLoginAt', label: 'Đăng nhập cuối', dataIndex: 'lastLoginAt', width: 170, sortable: true, align: 'center' as const, sortOrder: sortField === 'lastLoginAt' ? sortOrder : null, render: (text: string) => text ? <span style={{ color: textSecondary, fontSize: fontSizeMd }}>{dayjs(text).format('DD/MM/YYYY HH:mm')}</span> : <span style={{ color: textTertiary, fontSize: fontSizeSm }}>Chưa đăng nhập</span> },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
      sortable: true,
      align: 'center' as const,
      sortOrder: sortField === 'status' ? sortOrder : null,
      render: (status: string) => {
        const conf = STATUS_CONFIG[status] || { label: status, color: statusDraft };
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: radiusPill,
              fontSize: fontSizeSm,
              fontWeight: fontWeightMedium,
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
    const actions: any[] = [];
    if (hasPerm('user:create') || hasPerm('user.create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: openCreateModal,
      });
    }
    return actions;
  }, [hasPerm, openCreateModal]);


  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
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

        <Drawer
          width="50%"
          placement="right"
          closable={false}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          styles={drawerStyles}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={drawerTitleStyle}>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm mới người dùng'}</span>
              <Button
                type="text"
                onClick={() => setModalOpen(false)}
                style={{
                  ...drawerCloseBtnStyle,
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseOutlined style={{ fontSize: 14, color: textSecondary }} />
              </Button>
            </div>
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
        </Drawer>


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

        <Drawer
          width="50%"
          placement="right"
          closable={false}
          open={Boolean(permissionUser)}
          onClose={() => {
            setPermissionUser(null);
            setAppliedPermissionSearch('');
          }}
          destroyOnClose
          styles={drawerStyles}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={drawerTitleStyle}>Phân quyền chức năng cho người dùng{permissionUser ? `: ${permissionUser.fullName}` : ''}</span>
              <Button
                type="text"
                onClick={() => {
                  setPermissionUser(null);
                  setAppliedPermissionSearch('');
                }}
                style={{
                  ...drawerCloseBtnStyle,
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseOutlined style={{ fontSize: 14, color: textSecondary }} />
              </Button>
            </div>
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
                      indeterminate={!allPermissionsSelected && somePermissionsSelected}
                      disabled={permissionLoading || permissionCatalogLoading || allPermissionKeys.length === 0}
                      onChange={(event) => setSelectedPermissionKeys(event.target.checked ? allPermissionKeys : [])}
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
                      onCheck={(checked) => {
                        const keys = Array.isArray(checked) ? checked : checked.checked;
                        setSelectedPermissionKeys(
                          mergePermissionKeys(selectedPermissionKeys, keys.map(String), permissionTreeData)
                            .filter((key) => !key.startsWith('group_')),
                        );
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Spin>
        </Drawer>

        <Drawer
          width="50%"
          placement="right"
          closable={false}
          open={detailUserId !== null}
          onClose={() => setDetailUserId(null)}
          styles={drawerStyles}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={drawerTitleStyle}>
                {detailUser?.fullName ? `Xem chi tiết — ${detailUser.fullName}` : 'Xem chi tiết tài khoản'}
              </span>
              <Button
                type="text"
                onClick={() => setDetailUserId(null)}
                style={{
                  ...drawerCloseBtnStyle,
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseOutlined style={{ fontSize: 14, color: textSecondary }} />
              </Button>
            </div>
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
                                      fontSize: fontSizeSm,
                                      fontWeight: fontWeightMedium,
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
        </Drawer>




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


