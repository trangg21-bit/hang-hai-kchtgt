import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { spatialObjectCategoryService } from '../../services/spatialObjectCategoryService';
import type { SpatialObjectCategory } from '../../services/spatialObjectCategoryService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as MapSymbolItem } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterBar, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import {
  spaceMd, spaceFormField, spaceLg, spaceXs,
  radiusPill, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  textTertiary,
} from '../../tokens';
import { colors } from '../../theme';

const MODAL_FORM_STYLE: React.CSSProperties = {
  marginTop: spaceMd,
  maxHeight: '60vh',
  overflowY: 'auto',
  paddingRight: spaceFormField,
};

const INPUT_STYLE: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
};

const SELECT_STYLE: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  width: '100%',
};

const BTN_STYLE: React.CSSProperties = {
  borderRadius: radiusPill,
  height: 40,
  fontWeight: fontWeightMedium,
  fontSize: fontSizeMd,
};

export default function LineObjectList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [dataSource, setDataSource] = useState<SpatialObjectCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [symbols, setSymbols] = useState<MapSymbolItem[]>([]);
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SpatialObjectCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    symbolService.list({ pageSize: 100 }).then(res => setSymbols(res.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await spatialObjectCategoryService.list({
        page,
        pageSize,
        search: search || undefined,
        status: filterStatus,
        geometryType: 2, // Line
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách danh mục đối tượng đường'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterStatus]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const openCreateModal = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setIsModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: SpatialObjectCategory) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      iconId: record.iconId,
      status: record.status ?? 1,
    });
    setIsModalOpen(true);
  }, [form]);

  const handleFormSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingRecord) {
        await spatialObjectCategoryService.update(editingRecord.id, {
          code: values.code,
          name: values.name,
          geometryType: 2,
          iconId: values.iconId,
          status: values.status,
        });
        toast.success('Đã cập nhật danh mục đối tượng đường');
      } else {
        await spatialObjectCategoryService.create({
          code: values.code,
          name: values.name,
          geometryType: 2,
          iconId: values.iconId,
          status: values.status,
        });
        toast.success('Đã tạo danh mục đối tượng đường mới');
      }

      setIsModalOpen(false);
      void fetchData();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, form, fetchData]);

  const handleDelete = useCallback(
    async (record: SpatialObjectCategory) => {
      try {
        toast.success('Đã xóa danh mục đối tượng đường');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const columns = useMemo(() => [
    { key: 'stt', label: 'STT', width: 60, align: 'center' as const, type: 'mono' as const,
      render: (_: unknown, __: SpatialObjectCategory, idx: number) =>
        <span style={{ color: textTertiary }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'name', label: 'Tên đối tượng đường', dataIndex: 'name',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text> },
    { key: 'iconUrl', label: 'Biểu tượng', dataIndex: 'iconUrl', width: 120, align: 'center' as const,
      render: (iconUrl: string, record: SpatialObjectCategory) => {
        const sym = symbols.find(s => s.id === record.iconId);
        const imgSrc = iconUrl || sym?.image;
        return imgSrc ? (
          <img src={imgSrc} alt={record.name} style={{ height: 28, maxWidth: 50, objectFit: 'contain' }} />
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        );
      } },
    { key: 'updatedAt', label: 'Ngày cập nhật', dataIndex: 'updatedAt', width: 180,
      type: 'date' as const,
      render: (text: string) => (text ? dayjs(text).format('DD/MM/YYYY HH:mm:ss') : '—') },
    { key: 'updatedBy', label: 'Người cập nhật', dataIndex: 'updatedBy', width: 130,
      render: (text: string) => text || 'SYSTEM' },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 120, align: 'center' as const,
      type: 'status' as const,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'default'}>
          {status === 1 ? 'Sử dụng' : 'Khóa'}
        </Tag>
      ) },
    { key: 'actions', label: 'Thao tác', width: 100, align: 'center' as const,
      type: 'action' as const,
      render: (_: unknown, record: SpatialObjectCategory) => (
        <Space size={spaceXs}>
          <Tooltip title="Sửa">
            <Button type="link" size="small" icon={<EditOutlined />}
              onClick={() => openEditModal(record)} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Xác nhận xóa',
                  content: `Bạn có chắc muốn xóa "${record.name}"?`,
                  okText: 'Xóa',
                  okType: 'danger',
                  cancelText: 'Hủy',
                  onOk: () => handleDelete(record),
                });
              }}
            />
          </Tooltip>
        </Space>
      ) },
  ], [page, pageSize, symbols, openEditModal, handleDelete]);

  return (
    <div style={{ padding: spaceLg }}>
      <ScreenHeader
        title="Quản lý danh mục đối tượng đường"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
          { label: 'Quản lý danh mục đối tượng đường' },
        ]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={BTN_STYLE}
            onClick={openCreateModal}
          >
            Thêm đối tượng đường
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Tìm theo tên, mã..."
        searchValue={search}
        onSearchChange={setSearch}
        statusOptions={[
          { value: 1, label: 'Hoạt động' },
          { value: 0, label: 'Ngừng hoạt động' },
        ]}
        statusValue={filterStatus}
        onStatusChange={setFilterStatus}
        onSearch={() => setPage(1)}
        onReset={() => {
          setSearch('');
          setFilterStatus(undefined);
          setPage(1);
        }}
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách đối tượng đường'}
          onRetry={fetchData}
        />
      ) : dataSource.length === 0 ? (
        <EmptyState description="Chưa có danh mục đối tượng đường nào" />
      ) : (
        <>
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
          />
          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </>
      )}

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingRecord ? 'Chỉnh sửa đối tượng đường' : 'Thêm mới đối tượng đường'}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" style={BTN_STYLE} onClick={() => setIsModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            style={BTN_STYLE}
            loading={submitting}
            onClick={handleFormSubmit}
          >
            {editingRecord ? 'Cập nhật' : 'Tạo mới'}
          </Button>,
        ]}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={MODAL_FORM_STYLE}>
          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã đối tượng"
                rules={[{ required: true, message: 'Vui lòng nhập mã đối tượng' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input placeholder="VD: LUONG_HH" style={INPUT_STYLE} disabled={!!editingRecord} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên đối tượng đường"
                rules={[{ required: true, message: 'Vui lòng nhập tên đối tượng' }]}
                style={{ marginBottom: spaceFormField }}
              >
                <Input placeholder="VD: Luồng hàng hải" style={INPUT_STYLE} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item
                name="iconId"
                label="Biểu tượng"
                style={{ marginBottom: spaceFormField }}
              >
                <Select placeholder="Chọn biểu tượng" style={SELECT_STYLE} allowClear>
                  {symbols.map(s => (
                    <Select.Option key={s.id} value={s.id}>
                      <Space>
                        {s.image && <img src={s.image} alt={s.name} style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                        <span>{s.name} ({s.code})</span>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                style={{ marginBottom: spaceFormField }}
              >
                <Select style={SELECT_STYLE}>
                  <Select.Option value={1}>Sử dụng</Select.Option>
                  <Select.Option value={0}>Khóa</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
