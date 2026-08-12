import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Typography, Modal, Form, Input, Select, Spin, Button, Descriptions, Row, Col, Drawer, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, KeyOutlined, ExclamationCircleOutlined, CheckOutlined, CloseOutlined, EyeOutlined, MailOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser, useToggleLockUser, useResetPassword, useForgotPassword, useChangeStatusUser } from '../hooks/useUsers';
import { useRolesSimple } from '../hooks/useRoles';
import { usePermissionStore } from '../store/permissionStore';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { ScreenHeader, DataTable } from '../components/list-view';
import FilterTableLayout from '../components/list-view/FilterTableLayout';
import Pagination from '../components/list-view/Pagination';
import type { User, CreateUserPayload, UpdateUserPayload } from '../types/user';
import { organizationService, type Organization } from '../services/organizationService';
import { statusAttention, statusCritical, statusDraft, actionPrimary, textSecondary, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold, dataSea1, radiusPill, borderDefault, spaceFormField, spaceMd, drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle, primaryButtonStyle, outlineButtonStyle } from '../tokens';
import { colors } from '../theme';
import toast from '../components/ToastNotification';
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

function getRoleTagClass(roleId: string): string {
  switch (roleId) {
    case 'ROLE_SYSTEM_ADMIN': return 'role-tag--admin';
    case 'ROLE_ADMIN': return 'role-tag--org-admin';
    case 'ROLE_MANAGER': return 'role-tag--manager';
    case 'ROLE_VIEWER': return 'role-tag--viewer';
    default: return 'role-tag--user';
  }
}

const labelProps = (text: string) => ({ label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span> });

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterRoleId, setFilterRoleId] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
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

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data: detailResponse, isLoading: detailLoading } = useUser(detailUserId ?? undefined);
  const detailUser = detailResponse?.data ?? null;

  useEffect(() => {
    if (!modalOpen) return;
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
  }, [modalOpen]);

  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const { data, isLoading, isError, error, refetch } = useUsers({
    page, pageSize, search: search || undefined,
    roleId: filterRoleId, status: filterStatus, sortField, sortOrder,
  });

  const { data: rolesData } = useRolesSimple();
  const statusCounts = (data as any)?.statusCounts;

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
    form.setFieldsValue({ fullName: user.fullName, email: user.email, phone: user.phone, roleId: user.roleId, orgUnitId: user.orgUnitId, status: user.status });
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
          role: values.roleId, 
          orgUnitId: values.orgUnitId || undefined, 
          status: values.status 
        };
        await updateUser.mutateAsync({ id: editingUser.id, payload });
      } else {
        const payload: CreateUserPayload = { 
          username: values.username?.trim(), 
          fullName: values.fullName?.trim(), 
          email: values.email?.trim(), 
          phone: values.phone?.trim(), 
          password: values.password, 
          role: values.roleId, 
          orgUnitId: values.orgUnitId || undefined 
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

  const handleFilterApply = useCallback(() => { setPage(1); }, []);

  const handleFilterReset = useCallback(() => { setSearchInput(''); setSearch(''); setFilterRoleId(undefined); setFilterStatus(undefined); setPage(1); }, []);

  const handleTabChange = useCallback((key: string) => { setFilterStatus(key === 'all' ? undefined : key); setPage(1); }, []);

  const handleSort = useCallback((key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); }, []);

  const handlePageChange = useCallback((p: number, ps: number) => { setPage(p); setPageSize(ps); }, []);

  const handleApprove = useCallback((user: User) => {
    confirm({ title: 'Phê duyệt tài khoản', icon: <ExclamationCircleOutlined />, content: `Bạn có chắc chắn muốn phê duyệt tài khoản "${user.fullName}"?`, okText: 'Phê duyệt', cancelText: 'Hủy', onOk: () => changeStatusUser.mutateAsync({ id: user.id, status: 'ACTIVE' }) });
  }, [changeStatusUser]);

  const handleReject = useCallback((user: User) => {
    confirm({ title: 'Từ chối tài khoản', icon: <ExclamationCircleOutlined />, content: `Bạn có chắc chắn muốn từ chối tài khoản "${user.fullName}"?`, okText: 'Từ chối', okType: 'danger', cancelText: 'Hủy', onOk: () => changeStatusUser.mutateAsync({ id: user.id, status: 'INACTIVE' }) });
  }, [changeStatusUser]);

  const rowActions = useCallback((record: User) => {
    const actions: {
      key: string; label: string; icon?: ReactNode;
      onClick: () => void; danger?: boolean;
    }[] = [];

    if (hasPerm('user.view')) {
      actions.push({ key: 'view', label: 'Xem chi tiết tài khoản', icon: <EyeOutlined />, onClick: () => setDetailUserId(record.id) });
    }

    if (record.status === 'PENDING_APPROVAL') {
      if (hasPerm('user.approve')) actions.push({ key: 'approve', label: 'Phê duyệt tài khoản', icon: <CheckOutlined />, onClick: () => handleApprove(record) });
      if (hasPerm('user.approve')) actions.push({ key: 'reject', label: 'Từ chối tài khoản', icon: <CloseOutlined />, onClick: () => handleReject(record), danger: true });
    } else {
      if (hasPerm('user.edit')) actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
      if (hasPerm('user.lock')) actions.push({ key: 'lock', label: record.status === 'locked' ? 'Mở khóa' : 'Khóa', icon: record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />, onClick: () => handleToggleLock(record) });
      if (hasPerm('user.reset_password')) actions.push({ key: 'reset-password', label: 'Reset mật khẩu', icon: <KeyOutlined />, onClick: () => handleResetPassword(record) });
      if (hasPerm('user.reset_password')) actions.push({ key: 'forgot-password', label: 'Quên mật khẩu', icon: <MailOutlined />, onClick: () => handleForgotPassword(record) });
      if (hasPerm('user.delete')) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleDelete(record), danger: true });
    }
    return actions;
  }, [hasPerm, openEditModal, handleToggleLock, handleResetPassword, handleForgotPassword, handleDelete, handleApprove, handleReject]);

  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const, fixed: 'left' as const, render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'nameCode', label: 'Tên đăng nhập – Họ và tên', dataIndex: 'fullName', width: 300, sortable: true, sorter: true, align: 'left' as const, sortOrder: sortField === 'fullName' ? sortOrder : null, render: (_text: string, record: User) => <Typography.Text strong>{record.username} – {record.fullName}</Typography.Text> },
    { key: 'email', label: 'Email', dataIndex: 'email', width: 200, sortable: true, align: 'left' as const, sortOrder: sortField === 'email' ? sortOrder : null },
    { key: 'roleName', label: 'Vai trò', dataIndex: 'roleName', width: 180, sortable: true, align: 'center' as const, sortOrder: sortField === 'roleName' ? sortOrder : null, render: (text: string, record: User) => {
      const variant = getRoleTagClass(record.roleId);
      if (variant !== 'role-tag--user') {
        return <span className={`role-tag ${variant}`}>{text}</span>;
      }
      return (
        <span style={{
          display: 'inline-flex', fontSize: fontSizeMd, fontWeight: fontWeightMedium,
          padding: '2px 10px', borderRadius: 8,
          background: `${dataSea1}15`, color: dataSea1,
        }}>{text}</span>
      );
    } },
    { key: 'orgUnitName', label: 'Đơn vị', dataIndex: 'orgUnitName', width: 200, sortable: true, align: 'left' as const, sortOrder: sortField === 'orgUnitName' ? sortOrder : null, render: (text: string) => text ? <Typography.Text>{text}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'lastLoginAt', label: 'Đăng nhập cuối', dataIndex: 'lastLoginAt', width: 170, sortable: true, align: 'center' as const, sortOrder: sortField === 'lastLoginAt' ? sortOrder : null, render: (text: string) => text ? <span>{dayjs(text).format('DD/MM/YYYY HH:mm')}</span> : <Typography.Text type="secondary">Chưa đăng nhập</Typography.Text> },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 140, sortable: true, align: 'center' as const, sortOrder: sortField === 'status' ? sortOrder : null, render: (status: string) => { return (<span className={`status-badge ${getStatusBadgeClass(status)}`}>{STATUS_LABEL[status] || status}</span>); } },
  ], [page, pageSize, sortField, sortOrder]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách người dùng'} onRetry={() => refetch()} />;
    const tableData = data?.data || [];
    if (tableData.length === 0) {
      if (search || filterRoleId || filterStatus) return <EmptyState description="Không tìm thấy người dùng nào phù hợp" />;
      return <EmptyState description="Chưa có người dùng nào" />;
    }
    return <><style>{`.list-view-table .ant-table-cell { padding-block: 9px !important; }`}</style><DataTable columns={columns} dataSource={tableData} rowKey="id" rowActions={rowActions} loading={false} scroll={{ x: 1400, y: 'calc(100vh - 350px)' }} onSort={handleSort} /><Pagination total={data?.total || 0} current={page} pageSize={pageSize} onChange={handlePageChange} /></>;
  };


  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: 16 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Tìm kiếm</div>
        <Input placeholder="Tìm theo tên, email, username..." allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Vai trò</div>
        <Select placeholder="Chọn vai trò" allowClear
          value={filterRoleId}
          onChange={(val) => setFilterRoleId(val)}
          options={rolesData?.map((r: any) => ({ value: r.code, label: r.name })) || []}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: 4 }}>Trạng thái</div>
        <Select placeholder="Chọn trạng thái" allowClear
          value={filterStatus}
          onChange={(val) => setFilterStatus(val)}
          options={[{ value: 'active', label: 'Hoạt động' }, { value: 'PENDING_APPROVAL', label: 'Chờ phê duyệt' }, { value: 'locked', label: 'Đã khóa' }, { value: 'inactive', label: 'Không hoạt động' }]}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
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

      <Drawer
        {...drawerProps}
        title={<span style={drawerTitleStyle}>{editingUser ? 'Sửa người dùng' : 'Thêm mới người dùng'}</span>}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        extra={<Button type="text" onClick={() => setModalOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => setModalOpen(false)} style={outlineButtonStyle}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>{editingUser ? 'Cập nhật' : 'Tạo mới'}</Button>
          </div>
        }
      >
        <Spin spinning={submitting}>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}
            labelCol={{ style: { padding: 0, marginBottom: 4 } }}
          >
            {!editingUser && (<>
              <Form.Item name="username" {...labelProps('Tên đăng nhập')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }, { min: 3, message: 'Tối thiểu 3 ký tự' }, { max: 100, message: 'Tối đa 100 ký tự' }, { pattern: /^[a-z0-9_]+$/, message: 'Chỉ chứa chữ thường, số và dấu gạch dưới' }]}><Input placeholder="vd: nguyenvana" autoComplete="username" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
              <Form.Item name="password" {...labelProps('Mật khẩu')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 8, message: 'Tối thiểu 8 ký tự' }, { max: 255, message: 'Tối đa 255 ký tự' }, { pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#^_\-]).+$/, message: 'Phải có chữ hoa, chữ thường, số và ký tự đặc biệt' }]}><Input.Password placeholder="Ít nhất 8 ký tự" autoComplete="new-password" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
            </>)}
            <Form.Item name="fullName" {...labelProps('Họ và tên')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập họ tên' }, { max: 200, message: 'Tối đa 200 ký tự' }]}><Input placeholder="Nguyễn Văn A" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="email" {...labelProps('Email')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }, { max: 150, message: 'Tối đa 150 ký tự' }]}><Input placeholder="email@example.com" autoComplete="email" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="phone" {...labelProps('Số điện thoại')} style={{ marginBottom: spaceFormField }} rules={[{ pattern: /^0\d{9,10}$/, message: 'Số điện thoại không hợp lệ (10-11 số)' }]}><Input placeholder="0901234567" style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item></Col>
            </Row>
            <Form.Item name="roleId" {...labelProps('Vai trò')} style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}><Select placeholder="Chọn vai trò" options={rolesData?.map((r: any) => ({ value: r.code, label: r.name }))} style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
            <Form.Item name="orgUnitId" {...labelProps('Đơn vị trực thuộc')} style={{ marginBottom: spaceFormField }}><Select placeholder="Chọn đơn vị trực thuộc" allowClear showSearch filterOption={(input: string, option: any) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())} options={organizations.map((org) => ({ value: org.id, label: org.code ? `${org.code} - ${org.name}` : org.name }))} style={{ borderRadius: radiusPill, height: 40 }} /></Form.Item>
            {editingUser && (
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
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </Form.Item>
            )}
          </Form>
        </Spin>
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
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Tên đăng nhập">{detailUser.username}</Descriptions.Item>
            <Descriptions.Item label="Họ và tên">{detailUser.fullName}</Descriptions.Item>
            <Descriptions.Item label="Email">{detailUser.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{detailUser.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">{detailUser.roleName}</Descriptions.Item>
            <Descriptions.Item label="Nhóm quyền">{detailUser.groupNames?.length ? detailUser.groupNames.join(', ') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Quyền hiệu lực">
              {detailUser.permissionCodes?.length ? <>{detailUser.permissionCodes.map((permission) => <Tag key={permission}>{permission}</Tag>)}</> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Đơn vị trực thuộc">{detailUser.orgUnitName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{STATUS_LABEL[detailUser.status] || detailUser.status}</Descriptions.Item>
            <Descriptions.Item label="Đăng nhập gần nhất">{detailUser.lastLoginAt ? dayjs(detailUser.lastLoginAt).format('DD/MM/YYYY HH:mm') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{detailUser.createdAt ? dayjs(detailUser.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Người tạo">{detailUser.createdByName || '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày cập nhật">{detailUser.updatedAt ? dayjs(detailUser.updatedAt).format('DD/MM/YYYY HH:mm') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Người cập nhật">{detailUser.updatedByName || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}

