import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Typography, Modal, Form, Input, Select, Spin, Button, Row, Col, Drawer, Empty, Tree } from 'antd';
import { PlusOutlined, EditOutlined, LockOutlined, UnlockOutlined, KeyOutlined, ExclamationCircleOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser, useToggleLockUser, useResetPassword, useForgotPassword, useChangeStatusUser } from '../hooks/useUsers';
import { usePermissionStore } from '../store/permissionStore';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { ScreenHeader, DataTable } from '../components/list-view';
import FilterTableLayout from '../components/list-view/FilterTableLayout';
import Pagination from '../components/list-view/Pagination';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';
import { organizationService, type Organization } from '../services/organizationService';
import { userService } from '../services/userService';
import { normalizeSearchText, OrgUnitTreeSelect } from '../components/org-unit';
import { getVisiblePermissionKeys, mergePermissionKeys, usePermissions } from '../hooks/usePermissions';
import { statusAttention, statusCritical, statusDraft, actionPrimary, textSecondary, textPrimary, fontSizeMd, fontSizeLg, fontWeightBold, radiusPill, radiusTextArea, radiusMd, borderDefault, spaceFormField, spaceMd, spaceXs, formFieldStyle, formRowGutter, inputStyle, selectStyle, drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle, detailRowStyle, detailLabelColStyle, detailValueStyle } from '../tokens';
import { colors } from '../theme';
import toast from '../components/ToastNotification';
import ManagementDrawer from '../components/management/ManagementDrawer';
const { confirm } = Modal;

const STATUS_LABEL: Record<string, string> = {
  active: 'Hoạt động',
  locked: 'Đã khóa',
  inactive: 'Không hoạt động',
  pending_approval: 'Chờ phê duyệt',
  PENDING_APPROVAL: 'Chờ phê duyệt',
};

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active': return 'status-badge--active';
    case 'locked': return 'status-badge--locked';
    case 'inactive': return 'status-badge--inactive';
    case 'pending_approval':
    case 'PENDING_APPROVAL': return 'status-badge--pending';
    default: return '';
  }
}

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

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
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const { tree: rawPermissionTree, isLoading: permissionCatalogLoading } = usePermissions();
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);

  const { data: detailResponse, isLoading: detailLoading } = useUser(detailUserId ?? undefined);
  const detailUser = detailResponse?.data ?? null;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const orgs = await organizationService.getTree({ allowMockFallback: false });
        if (isMounted) setOrganizations(orgs);
      } catch (err) {
        console.error('Không thể tải danh sách đơn vị trực thuộc', err);
        if (isMounted) setOrganizations([]);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const { data, isLoading, isError, error, refetch } = useUsers({
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

  const handleDelete = useCallback((user: User) => {
    confirm({ title: 'Xác nhận xóa người dùng', icon: <ExclamationCircleOutlined />, content: `Bạn có chắc chắn muốn xóa người dùng "${user.fullName}"? Hành động này không thể hoàn tác.`, okText: 'Xóa', okType: 'danger', cancelText: 'Hủy', onOk: () => deleteUser.mutateAsync(user.id) });
  }, [deleteUser]);

  const handleToggleLock = useCallback((user: User) => {
    const willBeLocked = user.status !== 'locked';
    confirm({ title: willBeLocked ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản', icon: <ExclamationCircleOutlined />, content: willBeLocked ? `Tài khoản "${user.fullName}" sẽ bị khóa và không thể đăng nhập. Tiếp tục?` : `Tài khoản "${user.fullName}" sẽ được mở khóa. Tiếp tục?`, okText: willBeLocked ? 'Khóa' : 'Mở khóa', okType: willBeLocked ? 'danger' : 'primary', cancelText: 'Hủy', onOk: () => toggleLock.mutateAsync({ id: user.id, currentStatus: user.status }) });
  }, [toggleLock]);

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
    setPermissionSearch('');
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

  const permissionTreeData = useMemo(() => {
    const keyword = normalizeSearchText(permissionSearch);
    if (!keyword) return rawPermissionTree;
    const filter = (nodes: typeof rawPermissionTree): typeof rawPermissionTree => nodes.flatMap((node) => {
      const children = filter(node.children || []);
      const matches = normalizeSearchText(node.title).includes(keyword) || normalizeSearchText(node.key).includes(keyword);
      return matches || children.length ? [{ ...node, children }] : [];
    });
    return filter(rawPermissionTree);
  }, [rawPermissionTree, permissionSearch]);

  const rowActions = useCallback((record: User) => {
    const actions: {
      key: string; label: string; icon?: ReactNode;
      onClick: () => void; danger?: boolean;
    }[] = [];

    if (hasPerm('user:read')) {
      actions.push({ key: 'view', label: 'Xem chi tiết tài khoản', icon: <EyeOutlined />, onClick: () => setDetailUserId(record.id) });
    }

    if (hasPerm('user:manage')) {
      actions.push({ key: 'permissions', label: 'Phân quyền', icon: <KeyOutlined />, onClick: () => openPermissionModal(record) });
    }

    if (record.status === 'PENDING_APPROVAL') {
      if (hasPerm('user:approve')) actions.push({ key: 'approve', label: 'Phê duyệt tài khoản', icon: <CheckOutlined />, onClick: () => handleApprove(record) });
      if (hasPerm('user:approve')) actions.push({ key: 'reject', label: 'Từ chối tài khoản', icon: <CloseOutlined />, onClick: () => handleReject(record), danger: true });
    } else {
      if (hasPerm('user.edit')) actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
      if (hasPerm('user.lock')) actions.push({ key: 'lock', label: record.status === 'locked' ? 'Mở khóa' : 'Khóa', icon: record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />, onClick: () => handleToggleLock(record) });
      // Intentionally hidden per TRI-1786688745847-4d03: reset-password, forgot-password, delete row actions.
      // Handlers/modals/hooks (handleResetPassword, handleForgotPassword, handleDelete) remain intact.
    }
    return actions;
  }, [hasPerm, openPermissionModal, openEditModal, handleToggleLock, handleResetPassword, handleForgotPassword, handleDelete, handleApprove, handleReject]);

  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, fixed: 'left' as const, render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'fullName', label: 'Họ và tên', dataIndex: 'fullName', width: 260, sortable: true, sorter: true, align: 'left' as const, sortOrder: sortField === 'fullName' ? sortOrder : null, render: (text: string) => <Typography.Text strong>{text}</Typography.Text> },
    { key: 'email', label: 'Email', dataIndex: 'email', width: 200, sortable: true, align: 'left' as const, sortOrder: sortField === 'email' ? sortOrder : null },
    { key: 'orgUnitName', label: 'Đơn vị', dataIndex: 'orgUnitName', width: 200, sortable: true, align: 'left' as const, sortOrder: sortField === 'orgUnitName' ? sortOrder : null, render: (text: string) => text ? <Typography.Text>{text}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'lastLoginAt', label: 'Đăng nhập cuối', dataIndex: 'lastLoginAt', width: 170, sortable: true, align: 'center' as const, sortOrder: sortField === 'lastLoginAt' ? sortOrder : null, render: (text: string) => text ? <span>{dayjs(text).format('DD/MM/YYYY HH:mm')}</span> : <Typography.Text type="secondary">Chưa đăng nhập</Typography.Text> },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 140, sortable: true, align: 'center' as const, sortOrder: sortField === 'status' ? sortOrder : null, render: (status: string) => { return (<span className={`status-badge ${getStatusBadgeClass(status)}`}>{STATUS_LABEL[status] || status}</span>); } },
  ], [page, pageSize, sortField, sortOrder]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách người dùng'} onRetry={() => refetch()} />;
    const tableData = data?.data || [];
    const emptyDescription = search || fullName || filterStatus || filterOrganizationId
      ? 'Không tìm thấy người dùng nào phù hợp'
      : 'Chưa có người dùng nào';
    return <>
      <DataTable
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        rowActions={rowActions}
        loading={false}
        onSort={handleSort}
        scroll={{ x: 'max-content' }}
        emptyState={tableData.length === 0 ? <EmptyState description={emptyDescription} /> : undefined}
      />
      {tableData.length > 0 && (
        <Pagination total={data?.total || 0} current={page} pageSize={pageSize} onChange={handlePageChange} />
      )}
    </>;
  };


  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: 16 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Email</div>
        <Input placeholder="Tìm theo email" allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceXs }}>Họ tên</div>
        <Input placeholder="Tìm theo họ tên" allowClear
          value={fullNameInput}
          onChange={(e) => setFullNameInput(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceMd }}>Đơn vị</div>
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
    { key: 'all', label: 'Tất cả', count: statusCounts?.total ?? (data?.total || 0), color: textSecondary, active: !filterStatus },
    { key: 'active', label: 'Hoạt động', count: statusCounts?.active ?? 0, color: actionPrimary, active: filterStatus === 'active' },
    { key: 'pending_approval', label: 'Chờ phê duyệt', count: statusCounts?.pending_approval ?? 0, color: statusAttention, active: filterStatus === 'pending_approval' || filterStatus === 'PENDING_APPROVAL' },
    { key: 'locked', label: 'Đã khóa', count: statusCounts?.locked ?? 0, color: statusCritical, active: filterStatus === 'locked' },
    { key: 'inactive', label: 'Không hoạt động', count: statusCounts?.inactive ?? 0, color: statusDraft, active: filterStatus === 'inactive' },
  ];

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('user.create')) actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: openCreateModal });
    return actions;
  }, [hasPerm, openCreateModal]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý người dùng' }]} actions={headerActions} />
      <FilterTableLayout
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
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

      <ManagementDrawer
        size={760}
        title={<span style={drawerTitleStyle}>{editingUser ? 'Sửa người dùng' : 'Thêm mới người dùng'}</span>}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button onClick={() => setModalOpen(false)} style={outlineButtonStyle}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>{editingUser ? 'Cập nhật' : 'Tạo mới'}</Button>
          </>
        }
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: spaceMd }}
            labelCol={{ style: { padding: 0, marginBottom: 4 } }}
            initialValues={{ status: 'active' }}
          >
            <Form.Item name="orgUnitId" {...labelProps('Đơn vị')} style={formFieldStyle} rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}>
              <OrgUnitTreeSelect
                organizations={organizations}
                placeholder="Chọn đơn vị"
                allowClear
                style={selectStyle}
              />
            </Form.Item>
            <Row gutter={formRowGutter}>
              <Col xs={24} md={12}>
                <Form.Item name="email" {...labelProps('Email')} style={formFieldStyle} rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }, { max: 150, message: 'Tối đa 150 ký tự' }]}>
                  <Input placeholder="email@example.com" autoComplete="email" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="fullName" {...labelProps('Họ và tên')} style={formFieldStyle} rules={[{ required: true, message: 'Vui lòng nhập họ tên' }, { max: 200, message: 'Tối đa 200 ký tự' }]}>
                  <Input placeholder="Nguyễn Văn A" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={formRowGutter}>
              <Col xs={24} md={12}>
                <Form.Item name="phone" {...labelProps('Số điện thoại')} style={formFieldStyle} rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}>
                  <Input placeholder="0901234567" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="address" {...labelProps('Địa chỉ')} style={formFieldStyle} rules={[{ max: 255, message: 'Địa chỉ tối đa 255 ký tự' }]}>
                  <Input placeholder="Nhập địa chỉ" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={formRowGutter}>
              <Col xs={24} md={12}>
                <Form.Item name="department" {...labelProps('Phòng ban')} style={formFieldStyle} rules={[{ required: true, message: 'Vui lòng nhập phòng ban' }, { max: 100, message: 'Phòng ban tối đa 100 ký tự' }]}>
                  <Input placeholder="Ví dụ: Phòng Quản lý cảng" style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="position" {...labelProps('Chức vụ')} style={formFieldStyle} rules={[{ required: true, message: 'Vui lòng nhập chức vụ' }, { max: 100, message: 'Chức vụ tối đa 100 ký tự' }]}>
                  <Input placeholder="Ví dụ: Chuyên viên" style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="status"
              {...labelProps('Trạng thái')}
              style={formFieldStyle}
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
            <Form.Item name="note" {...labelProps('Ghi chú')} style={formFieldStyle} rules={[{ max: 500, message: 'Ghi chú tối đa 500 ký tự' }]}> 
              <Input.TextArea placeholder="Nhập ghi chú" rows={3} style={{ borderRadius: radiusTextArea }} />
            </Form.Item>
          </Form>
        </Spin>
      </ManagementDrawer>

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
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
          >
            Hủy
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={handleResetPasswordSubmit}
            loading={resetPasswordSubmitting}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
          >
            Đặt lại mật khẩu
          </Button>,
        ]}
      >
        <Spin spinning={resetPasswordSubmitting}>
          <Typography.Text style={{ color: textSecondary }}>
            Tài khoản: {resetPasswordUser?.fullName} ({resetPasswordUser?.username})
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
                style={{ borderRadius: radiusPill, height: 40 }}
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
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <ManagementDrawer
        title={<>Phân quyền chức năng cho người dùng{permissionUser ? `: ${permissionUser.fullName}` : ''}</>}
        open={Boolean(permissionUser)}
        onClose={() => setPermissionUser(null)}
        destroyOnHidden
        maskClosable={false}
        footer={
          <>
            <Button onClick={() => setPermissionUser(null)} style={outlineButtonStyle}>Đóng</Button>
            <Button type="primary" loading={permissionSaving} onClick={handlePermissionSave} style={primaryButtonStyle}>Lưu</Button>
          </>
        }
      >
        <Spin spinning={permissionLoading || permissionCatalogLoading}>
          <Input.Search
            allowClear
            value={permissionSearch}
            onChange={(event) => setPermissionSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mã quyền..."
            style={{ margin: `${spaceMd}px 0` }}
          />
          {permissionTreeData.length === 0 && !permissionLoading ? (
            <Empty description="Không tìm thấy quyền phù hợp" />
          ) : (
            <div style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceMd, maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceMd }}>Danh sách chức năng</div>
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
          )}
        </Spin>
      </ManagementDrawer>

      <Drawer
        {...drawerProps}
        title={<span style={drawerTitleStyle}>Chi tiết tài khoản</span>}
        open={detailUserId !== null}
        onClose={() => setDetailUserId(null)}
        extra={<Button type="text" onClick={() => setDetailUserId(null)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={() => setDetailUserId(null)} style={primaryButtonStyle}>Đóng</Button>
          </div>
        }
      >
        {detailLoading ? <Spin /> : detailUser && (
          <div style={{ paddingTop: spaceMd }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {[ 
                ['Họ và tên', detailUser.fullName],
                ['Email', detailUser.email],
                ['Số điện thoại', detailUser.phone || '—'],
                ['Địa chỉ', detailUser.address || '—'],
                ['Phòng ban', detailUser.department || '—'],
                ['Chức vụ', detailUser.position || '—'],
                ['Ghi chú', detailUser.note || '—'],
                ['Nhóm nghiệp vụ', detailUser.groupNames?.length ? detailUser.groupNames.join(', ') : '—'],
                ['Đơn vị trực thuộc', detailUser.orgUnitName || '—'],
                ['Trạng thái', <span className={`status-badge ${getStatusBadgeClass(detailUser.status)}`}>{STATUS_LABEL[detailUser.status] || detailUser.status}</span>],
                ['Đăng nhập gần nhất', detailUser.lastLoginAt ? dayjs(detailUser.lastLoginAt).format('DD/MM/YYYY HH:mm') : '—'],
                ['Ngày tạo', detailUser.createdAt ? dayjs(detailUser.createdAt).format('DD/MM/YYYY HH:mm') : '—'],
                ['Người tạo', detailUser.createdByName || '—'],
                ['Ngày cập nhật', detailUser.updatedAt ? dayjs(detailUser.updatedAt).format('DD/MM/YYYY HH:mm') : '—'],
                ['Người cập nhật', detailUser.updatedByName || '—'],
              ].map(([label, value], index) => (
                <div key={index} style={detailRowStyle}>
                  <span style={detailLabelColStyle}>{label}:</span>
                  <span style={{ ...detailValueStyle, color: value === '—' ? textSecondary : textPrimary }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

