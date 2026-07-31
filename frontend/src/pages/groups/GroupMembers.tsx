import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, Form, Button, Spin, Space, Typography, Select } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { groupService } from '../../services/groupService';
import type { GroupMember, AddMemberPayload } from '../../services/groupService';
import { userService } from '../../services/userService';
import { ScreenHeader, FilterBar, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { spaceMd, spaceFormField, radiusPill, fontSizeMd, fontSizeLg, fontWeightBold, actionPrimary, textSecondary, borderDefault, cardStyle } from '../../tokens';
import { colors } from '../../theme';

export default function GroupMembers() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();

  const [dataSource, setDataSource] = useState<GroupMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout>();

  const fetchUserOptions = useCallback(async (searchTxt: string) => {
    setIsSearchingUser(true);
    try {
      const res = await userService.list({ search: searchTxt.trim(), pageSize: 50 });
      setUserOptions(res.data.map((u) => ({ value: u.id, label: `${u.fullName} (${u.username})` })));
    } catch (err) {
      console.error('Failed to load users for dropdown:', err);
    } finally {
      setIsSearchingUser(false);
    }
  }, []);

  useEffect(() => {
    if (addModalOpen) {
      void fetchUserOptions('');
    }
  }, [addModalOpen, fetchUserOptions]);

  const handleUserSearch = useCallback((value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      void fetchUserOptions(value.trim());
    }, 500);
  }, [fetchUserOptions]);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const resp = await groupService.getMembers(id!, { page, pageSize, search });
      setDataSource(resp.data);
      setTotal(resp.total);
    } catch (err: unknown) { setIsError(true); setError(err instanceof Error ? err : new Error('Không thể tải danh sách thành viên')); }
    finally { setIsLoading(false); }
  }, [id, page, pageSize, search]);

  useEffect(() => { void fetchMembers(); }, [fetchMembers]);

  const handleRemove = useCallback(async (member: GroupMember) => {
    Modal.confirm({
      title: 'Xác nhận xóa thành viên',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa "${member.fullName}" khỏi nhóm này?`,
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try { await groupService.removeMember(id!, member.userId); toast.success('Đã xóa thành viên khỏi nhóm'); fetchMembers(); }
        catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Thao tác thất bại'); }
      },
    });
  }, [id, fetchMembers]);

  const handleAddMember = useCallback(async () => {
    try {
      const values = await form.validateFields();
      await groupService.addMember(id!, { userId: values.userId });
      toast.success('Đã thêm thành viên vào nhóm');
      setAddModalOpen(false); form.resetFields(); fetchMembers();
    } catch (err: any) {
      if (err?.errorFields) {
        // Form validation error, ignore as antd handles UI display
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Lỗi khi thêm thành viên');
    }
  }, [id, form, fetchMembers]);

  // ---- Filter handlers ----
  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(typeof values.search === 'string' ? values.search.trim() : values.search || ''); setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => { setSearch(''); setPage(1); }, []);

  const handlePageChange = useCallback((p: number, ps: number) => { setPage(p); setPageSize(ps); }, []);

  // ---- Row actions ----
  const rowActions = useCallback((record: GroupMember) => [
    { key: 'remove', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => handleRemove(record), danger: true },
  ], [handleRemove]);

  // ---- Columns ----
  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'fullName', label: 'Họ và tên', dataIndex: 'fullName', width: 200,
      render: (text: string) => <Space><UserOutlined /><Typography.Text strong>{text}</Typography.Text></Space> },
    { key: 'username', label: 'Tên đăng nhập', dataIndex: 'username', width: 150 },
    { key: 'email', label: 'Email', dataIndex: 'email', width: 200 },
    { key: 'joinedAt', label: 'Tham gia từ', dataIndex: 'joinedAt', width: 150, align: 'center' as const,
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '—' },
  ], [page, pageSize]);

  // ---- Render ----
  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách thành viên'} onRetry={fetchMembers} />;
    if (dataSource.length === 0) {
      if (search) return <EmptyState description="Không tìm thấy thành viên nào phù hợp" />;
      return <EmptyState description="Chưa có thành viên nào" />;
    }
    return <div style={{ overflowX: 'auto' }}><DataTable columns={columns} dataSource={dataSource} rowKey="userId" rowActions={rowActions} scroll={{ x: 900 }} /><Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} /></div>;
  };

  // ---- Filter fields ----
  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, email...' },
  ], []);

  // ---- Header actions ----
  const headerActions = useMemo(() => [
    { key: 'back', label: 'Quay lại', variant: 'subtle' as const, icon: <ArrowLeftOutlined />, onClick: () => navigate('/groups') },
    { key: 'add', label: 'Thêm thành viên', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => setAddModalOpen(true) },
  ], [navigate]);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Quản lý nhóm', path: '/groups' }, { label: 'Thành viên' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Thêm thành viên vào nhóm</span>}
        open={addModalOpen} onCancel={() => { setAddModalOpen(false); form.resetFields(); }} destroyOnHidden width={500} mask={{ closable: false }}
        footer={[
          <Button key="cancel" onClick={() => { setAddModalOpen(false); form.resetFields(); }} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={handleAddMember} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Thêm</Button>,
        ]}
      >
        <Spin spinning={false}>
          <Form form={form} layout="vertical" style={{ marginTop: spaceMd }}>
            <Form.Item name="userId" label="Chọn người dùng" required style={{ marginBottom: spaceFormField }} rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}>
              <Select
                showSearch
                placeholder="Tìm và chọn người dùng..."
                options={userOptions}
                filterOption={false}
                onSearch={handleUserSearch}
                loading={isSearchingUser}
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
}

