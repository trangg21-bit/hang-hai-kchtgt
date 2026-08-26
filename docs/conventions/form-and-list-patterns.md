# Form & List UI Convention

> Contract giao diện và kích thước dùng chung: [`list-screen-ui-standard.md`](./list-screen-ui-standard.md).

## List Screen Pattern

### Component Stack (top to bottom)

```
ScreenHeader → FilterBar → StatusTabs → DataTable → Pagination
```

### Code Skeleton

```tsx
import { useState, useCallback, useMemo } from 'react';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../components/list-view';
import Pagination from '../components/list-view/Pagination';
import { cardStyle } from '../tokens';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function ListPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);

  // Fetch data with useQuery hook
  const { data, isLoading, isError, error, refetch } = useYourQuery({
    page, pageSize, search: search || undefined, status: filterStatus,
    sortField, sortOrder,
  });

  const columns = useMemo(() => [
    { key: 'stt', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) =>
        <span>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'name', label: 'Tên', dataIndex: 'name', width: 200, sortable: true },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 140,
      sortable: true, align: 'center' as const },
  ], [page, pageSize]);

  const rowActions = useCallback((record: any) => [
    { key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => {} },
    { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => {}, danger: true },
  ], []);

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm',
      placeholder: 'Tìm kiếm...' },
    { key: 'status', type: 'select' as const, label: 'Trạng thái',
      placeholder: 'Chọn trạng thái',
      options: [{ value: 'active', label: 'Hoạt động' }] },
  ], []);

  const headerActions = useMemo(() => [
    { key: 'create', label: 'Thêm mới', variant: 'primary' as const,
      icon: <PlusOutlined />, onClick: () => {} },
  ], []);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterStatus(values.status || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setFilterStatus(key === 'all' ? undefined : key);
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

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message} onRetry={() => refetch()} />;
    const tableData = data?.data || [];
    if (tableData.length === 0) {
      if (search) return <EmptyState description="Không tìm thấy dữ liệu phù hợp" />;
      return <EmptyState description="Chưa có dữ liệu" ctaText="Thêm mới" onCta={() => {}} />;
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          rowActions={rowActions}
          onSort={handleSort}
          scroll={{ x: 900 }}
        />
        <Pagination
          total={data?.total || 0}
          current={page}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Module' }, { label: 'Danh sách' }]}
        actions={headerActions}
      />
      <FilterBar
        fields={filterFields}
        onSearch={handleFilterSearch}
        onReset={handleFilterReset}
      />
      <div style={{ ...cardStyle, marginBottom: 4, padding: '8px 16px' }}>
        <StatusTabs
          tabs={[
            { key: 'all', label: 'Tất cả', count: 0, color: textSecondary, active: !filterStatus },
            { key: 'active', label: 'Hoạt động', count: 0, color: actionPrimary, active: filterStatus === 'active' },
          ]}
          onChange={handleTabChange}
        />
      </div>
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {renderContent()}
      </div>
    </div>
  );
}
```

### Key Rules

1. **KHÔNG** tạo custom search/filter UI — dùng `FilterBar`
2. **KHÔNG** tạo custom table — dùng `DataTable`
3. **KHÔNG** tạo custom pagination — dùng `Pagination`
4. Dùng `StatusTabs` cho mọi filter theo trạng thái
5. State pattern: `search`, `filterStatus`, `page`, `pageSize`, `sortField`, `sortOrder` — always `useState`
6. Import `ScreenHeader`, `FilterBar`, `StatusTabs`, `DataTable` từ `../components/list-view` (barrel export)
7. Import `Pagination` từ `../components/list-view/Pagination` (separate file)
8. Luôn xử lý 4 trạng thái: Loading (`LoadingSkeleton`), Error (`ErrorState`), Empty (`EmptyState`), Data (DataTable + Pagination)

---

## Form/Modal Pattern

### Code Skeleton

```tsx
import { useState, useCallback } from 'react';
import { Modal, Form, Input, Select, Button, Spin, Row, Col } from 'antd';
import { spaceFormField, radiusPill, actionPrimary, textSecondary, borderDefault, fontWeightBold, fontSizeLg, fontSizeMd } from '../tokens';
import { colors } from '../theme';

// Helper: nhất quán label style
const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

export default function SomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const openCreateModal = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: any) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingRecord) {
        // await updateMutation.mutateAsync({ id: editingRecord.id, payload: values });
      } else {
        // await createMutation.mutateAsync(values);
      }
      setModalOpen(false);
    } catch {} finally {
      setSubmitting(false);
    }
  }, [editingRecord, form]);

  return (
    <>
      {/* ... list screen ... */}

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
          {editingRecord ? 'Sửa' : 'Thêm mới'}
        </span>}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        width={600}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd,
              borderColor: borderDefault, color: textSecondary }}>
            Hủy
          </Button>,
          <Button key="ok" type="primary" onClick={handleSubmit} loading={submitting}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd,
              background: actionPrimary, borderColor: actionPrimary }}>
            {editingRecord ? 'Cập nhật' : 'Tạo mới'}
          </Button>,
        ]}
      >
        <Spin spinning={submitting}>
          <Form
            form={form}
            layout="vertical"
            style={{ marginTop: 16 }}
            labelCol={{ style: { padding: 0, marginBottom: 4 } }}
          >
            <Form.Item
              name="name"
              {...labelProps('Tên')}
              style={{ marginBottom: spaceFormField }}
              rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            >
              <Input placeholder="Nhập tên" style={{ borderRadius: radiusPill, height: 40 }} />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fieldA"
                  {...labelProps('Trường A')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="..." style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fieldB"
                  {...labelProps('Trường B')}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select placeholder="Chọn..."
                    options={[{ value: 'opt1', label: 'Option 1' }]}
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              {...labelProps('Mô tả / Ghi chú')}
              style={{ marginBottom: spaceFormField }}
            >
              <Input.TextArea
                rows={3}
                placeholder="Nhập mô tả / ghi chú..."
                showCount
                maxLength={2000}
                style={{ borderRadius: 20, padding: '10px 16px' }}
              />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
}
```

### Key Rules

1. `marginBottom: spaceFormField` (12px) trên **mọi** `Form.Item`
2. `borderRadius: radiusPill` (999px) trên **mọi** `Input`, `Select`, button trong modal footer
3. `height: 40` trên **mọi** `Input`, `Select`
4. Dùng `labelProps()` helper function (defined locally) để có label style nhất quán
5. Modal title: `<span>` với `fontWeightBold + fontSizeLg + colors.sidebarBg`
6. Modal footer: Cancel button (outlined) + Submit button (primary), **cả hai đều pill radius**
7. Luôn có `destroyOnHidden` + `maskClosable={false}` trên Modal
8. Wrap form body trong `<Spin spinning={submitting}>` để disable khi submit
9. Dùng `Row gutter={16} + Col xs={24} md={12}` cho form fields nằm ngang 2 cột
10. `labelCol={{ style: { padding: 0, marginBottom: 4 } }}` trên Form
11. **Tab Lịch sử trong Form Drawer**: Tab "Lịch sử & Phê duyệt" **BẮT BUỘC chỉ hiển thị khi `drawerMode !== 'create'`** (chỉ hiện khi Xem chi tiết `view` hoặc Chỉnh sửa `edit`); khi Thêm mới (`create`), tab này **BẮT BUỘC ĐƯỢC ẨN ĐI** (`...(drawerMode !== 'create' ? [tabHistory] : [])`).
12. **Lịch sử thay đổi (Audit Trail)**: Mở từ menu dòng (`rowActions` -> "Lịch sử"), truy vấn từ bảng tập trung duy nhất `infrastructure_history` (bỏ hoàn toàn `change_logs`, `approval_logs`).

---

## Token Reference

| Token | Value | Usage |
|---|---|---|
| `spaceFormField` | 12 | `Form.Item` `marginBottom` |
| `radiusPill` | 999 | `Input` / `Select` / `Button` `borderRadius` |
| `spaceSm` | 8 | Gap between filter fields / action buttons |
| `cardStyle` | `{ background, border, borderRadius, padding }` | Container card style for StatusTabs + table wrapper |

---

## Reference Implementation

`frontend/src/pages/UsersPage.tsx` — full working example of both patterns:

- **List section**: ScreenHeader with breadcrumb/actions → FilterBar (search, role, status selects) → StatusTabs (all/active/locked/inactive) → DataTable (8 columns with sort + row dropdown) → Pagination
- **Form section**: Modal with create/edit mode, 6+ form fields, `labelProps()` helper, `spaceFormField` margin, `radiusPill` inputs, `height: 40`, outlined Cancel + primary Submit buttons
