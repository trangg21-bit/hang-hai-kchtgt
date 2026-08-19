import { useState, useCallback, useMemo } from 'react';
import { Form, Input, Select, Button, Spin, Row, Col, Drawer } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

import { ScreenHeader, DataTable } from '../components/list-view';
import FilterTableLayout from '../components/list-view/FilterTableLayout';
import Pagination from '../components/list-view/Pagination';
import {
  spaceFormField,
  radiusPill,
  textSecondary,
  fontWeightBold,
  fontSizeMd,
  drawerProps,
  drawerTitleStyle,
  drawerCloseBtnStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  filterInputStyle,
  filterLabelStyle,
} from '../tokens';
import { colors } from '../theme';
import toast, { modal } from '../components/ToastNotification';

const FEATURE_OPTIONS = [
  { value: 'phanhien', label: 'Phản hiện' },
  { value: 'baocao', label: 'Báo cáo' },
  { value: 'danhmuc', label: 'Danh mục' },
  { value: 'admin', label: 'Admin' },
];

const ACTION_OPTIONS = [
  { value: 'read', label: 'read' },
  { value: 'write', label: 'write' },
  { value: 'delete', label: 'delete' },
  { value: 'approve', label: 'approve' },
  { value: 'export', label: 'export' },
  { value: 'manage', label: 'manage' },
  { value: 'full', label: 'full' },
];

interface Permission {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface PermissionListResponse {
  data: Permission[];
  total: number;
  page: number;
  pageSize: number;
}

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

export default function PermissionsPage() {
  const [search, setSearch] = useState('');
  const [filterFeature, setFilterFeature] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const queryClient = useQueryClient();

  const queryParams = useMemo(() => ({
    page,
    pageSize,
    search: search?.trim() || undefined,
    feature: filterFeature,
    sortField,
    sortOrder,
  }), [page, pageSize, search, filterFeature, sortField, sortOrder]);

  const { data, isLoading, isError, refetch } = useQuery<PermissionListResponse>({
    queryKey: ['permissions', queryParams],
    queryFn: async () => {
      const params: Record<string, any> = {
        page: queryParams.page - 1,
        size: queryParams.pageSize,
      };
      if (queryParams.search) params.search = queryParams.search;
      if (queryParams.feature) params.feature = queryParams.feature;
      if (queryParams.sortField) {
        params.sort = `${queryParams.sortField},${queryParams.sortOrder === 'ascend' ? 'asc' : 'desc'}`;
      }
      const resp = await api.get('/v1/permissions', { params });
      const rawData = resp.data?.data ?? resp.data;
      const items: Permission[] = Array.isArray(rawData)
        ? rawData
        : (rawData?.content ?? []);
      const total = Array.isArray(rawData)
        ? rawData.length
        : (rawData?.totalElements ?? 0);
      return {
        data: items,
        total,
        page: queryParams.page,
        pageSize: queryParams.pageSize,
      };
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Omit<Permission, 'id'>) => api.post('/v1/permissions', payload),
    onSuccess: () => {
      toast.success('Đã tạo quyền hạn thành công');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setModalOpen(false);
    },
    onError: () => {},
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<Permission, 'id'> }) =>
      api.put(`/v1/permissions/${id}`, payload),
    onSuccess: () => {
      toast.success('Đã cập nhật quyền hạn');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setModalOpen(false);
    },
    onError: () => {},
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/permissions/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa quyền hạn');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: () => {},
  });

  const openCreateModal = useCallback(() => {
    setEditingPermission(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback(
    (record: Permission) => {
      setEditingPermission(record);
      form.setFieldsValue({
        code: record.code,
        name: record.name,
        resource: record.resource,
        action: record.action,
        description: record.description || '',
      });
      setModalOpen(true);
    },
    [form],
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        code: values.code?.trim(),
        name: values.name?.trim(),
        resource: values.resource,
        action: values.action,
        description: values.description?.trim() || '',
      };
      if (editingPermission) {
        await updateMutation.mutateAsync({ id: editingPermission.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch {
      // validation errors are shown by AntD Form
    } finally {
      setSubmitting(false);
    }
  }, [editingPermission, form, createMutation, updateMutation]);

  const handleDelete = useCallback(
    (record: Permission) => {
      modal.confirm({
        title: 'Xác nhận xóa',
        content: `Bạn có chắc chắn muốn xóa quyền hạn "${record.name}" không?`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: () => deleteMutation.mutate(record.id),
      });
    },
    [deleteMutation],
  );

  const columns = useMemo(
    () => [
      {
        key: 'stt',
        label: 'STT',
        width: 60,
        align: 'center' as const,
        render: (_: unknown, __: unknown, idx: number) => (
          <span style={{ color: textSecondary, fontSize: fontSizeMd }}>
            {(page - 1) * pageSize + idx + 1}
          </span>
        ),
      },
      {
        key: 'code',
        label: 'Mã quyền',
        dataIndex: 'code',
        width: 200,
        sortable: true,
        sortOrder: sortField === 'code' ? sortOrder : null,
      },
      {
        key: 'name',
        label: 'Tên quyền',
        dataIndex: 'name',
        width: 200,
        sortable: true,
        sortOrder: sortField === 'name' ? sortOrder : null,
      },
      {
        key: 'resource',
        label: 'Resource',
        dataIndex: 'resource',
        width: 140,
        align: 'center' as const,
      },
      {
        key: 'action',
        label: 'Hành động',
        dataIndex: 'action',
        width: 120,
        align: 'center' as const,
      },
      {
        key: 'description',
        label: 'Mô tả',
        dataIndex: 'description',
        width: 260,
      },
    ],
    [page, pageSize, sortField, sortOrder],
  );

  const rowActions = useCallback(
    (record: Permission) => [
      {
        key: 'edit',
        label: 'Sửa',
        onClick: () => openEditModal(record),
      },
      {
        key: 'delete',
        label: 'Xóa',
        danger: true,
        onClick: () => handleDelete(record),
      },
    ],
    [openEditModal, handleDelete],
  );

  const handleFilterApply = useCallback(() => {
    setPage(1);
  }, []);

  const filterContent = useMemo(
    () => (
      <>
        <div style={{ marginBottom: spaceFormField }}>
          <div style={filterLabelStyle}>Tìm kiếm</div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã quyền..."
            style={filterInputStyle}
            onPressEnter={handleFilterApply}
          />
        </div>
        <div style={{ marginBottom: spaceFormField }}>
          <div style={filterLabelStyle}>Tính năng</div>
          <Select
            value={filterFeature}
            onChange={setFilterFeature}
            placeholder="Chọn tính năng"
            options={FEATURE_OPTIONS}
            style={filterInputStyle}
          />
        </div>
      </>
    ),
    [search, filterFeature, handleFilterApply],
  );

  const statusTabs: Array<{ key: string; label: string; count: number; color: string; active: boolean }> = [];

  const headerActions = useMemo(
    () => [
      {
        key: 'create',
        label: 'Thêm quyền hạn',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: openCreateModal,
      },
    ],
    [openCreateModal],
  );

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterFeature(undefined);
    setPage(1);
  }, []);

  const handleSort = useCallback((key: string, order: 'asc' | 'desc') => {
    setSortField(key);
    setSortOrder(order === 'asc' ? 'ascend' : 'descend');
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const renderContent = () => {
    const tableData = data?.data ?? [];
    if (tableData.length === 0) {
      if (search || filterFeature)
        return <EmptyState description="Không tìm thấy quyền hạn nào phù hợp" />;
      return (
        <EmptyState
          description="Chưa có quyền hạn nào"
          ctaText="Thêm quyền hạn"
          onCta={openCreateModal}
        />
      );
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          rowActions={rowActions}
          loading={isMutating}
          scroll={{ x: 1000, y: 500 }}
          onSort={handleSort}
        />
        <Pagination
          total={data?.total ?? 0}
          current={page}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <style>{`.list-view-table .ant-table-cell { padding-block: 9px !important; }`}</style>
      <ScreenHeader breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý quyền hạn' }]} actions={headerActions} />
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
        onStatusTabChange={() => {}}
      >
        {isLoading ? <LoadingSkeleton rows={8} /> : renderContent()}
      </FilterTableLayout>

      <Drawer
        {...drawerProps}
        title={<span style={drawerTitleStyle}>{editingPermission ? 'Sửa quyền hạn' : 'Thêm quyền hạn'}</span>}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        extra={<Button type="text" onClick={() => setModalOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => setModalOpen(false)} style={outlineButtonStyle}>Hủy</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitting} style={primaryButtonStyle}>{editingPermission ? 'Cập nhật' : 'Tạo mới'}</Button>
          </div>
        }
      >
        <Spin spinning={submitting}>
          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 16 }}
            labelCol={{ style: { padding: 0, marginBottom: 4 } }}
          >
            <Form.Item
              name="code"
              {...labelProps('Mã quyền')}
              style={{ marginBottom: spaceFormField }}
              rules={[
                { required: true, message: 'Vui lòng nhập mã quyền' },
                {
                  pattern: /^[a-z]+:[a-z]+$/,
                  message: 'Định dạng phải là feature:action (vd: admin:read)',
                },
              ]}
            >
              <Input
                placeholder="vd: admin:read"
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </Form.Item>

            <Form.Item
              name="name"
              {...labelProps('Tên quyền')}
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập tên quyền' }]}
            >
              <Input
                placeholder="Nhập tên quyền"
                style={{ borderRadius: radiusPill, height: 40 }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="resource"
                  {...labelProps('Resource')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng chọn resource' }]}
                >
                  <Select
                    placeholder="Chọn resource"
                    options={FEATURE_OPTIONS}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="action"
                  {...labelProps('Hành động')}
                  style={{ marginBottom: spaceFormField }}
                  rules={[{ required: true, message: 'Vui lòng chọn hành động' }]}
                >
                  <Select
                    placeholder="Chọn hành động"
                    options={ACTION_OPTIONS}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              {...labelProps('Mô tả')}
              style={{ marginBottom: spaceFormField }}
            >
              <Input.TextArea
                placeholder="Nhập mô tả quyền hạn"
                rows={3}
              />
            </Form.Item>
          </Form>
        </Spin>
      </Drawer>
    </div>
  );
}
