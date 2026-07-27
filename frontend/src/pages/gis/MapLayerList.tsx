import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Space,
  Tag,
  Tooltip,
  Switch,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { mapLayerService } from '../../services/mapLayerService';
import type { MapLayer } from '../../types/mapLayer';
import type { CreateMapLayerPayload, UpdateMapLayerPayload } from '../../types/mapLayer';
import {
  MAP_LAYER_TYPE_OPTIONS,
  MAP_LAYER_STATUS_MAP,
} from '../../types/mapLayer';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterBar, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import {
  spaceMd, spaceFormField, spaceSm, spaceLg, spaceXs,
  radiusPill, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  textPrimary, textSecondary, textTertiary,
  statusOperational,
  actionPrimary, borderDefault,
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

export default function MapLayerList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<MapLayer[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Modal form state ──
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MapLayer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await mapLayerService.list({ page, pageSize });
      const filtered = res.data.filter((l) => {
        if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.code.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        if (filterType && l.layerType !== filterType) return false;
        return true;
      });
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + pageSize);
      setDataSource(paginated);
      setTotal(filtered.length);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách lớp bản đồ'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterType]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // ── Modal handlers ──
  const openCreateModal = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ visible: true, opacity: 1, order: 0 });
    setIsModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: MapLayer) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      layerType: record.layerType,
      source: record.source,
      visible: record.visible,
      opacity: record.opacity,
      order: record.order,
      styleConfig: record.styleConfig,
    });
    setIsModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingRecord) {
        const payload: UpdateMapLayerPayload = {
          name: values.name,
          layerType: values.layerType,
          source: values.source,
          visible: values.visible,
          opacity: values.opacity,
          order: values.order,
          styleConfig: values.styleConfig,
        };
        await mapLayerService.update(editingRecord.id, payload);
        toast.success('Đã cập nhật lớp bản đồ');
      } else {
        const payload: CreateMapLayerPayload = {
          name: values.name,
          code: values.code,
          layerType: values.layerType,
          source: values.source,
          visible: values.visible,
          opacity: values.opacity,
          order: values.order,
          styleConfig: values.styleConfig,
        };
        await mapLayerService.create(payload);
        toast.success('Đã tạo lớp bản đồ');
      }

      setIsModalOpen(false);
      void fetchData();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, form, fetchData]);

  const handleToggleVisible = useCallback(
    async (record: MapLayer) => {
      const newVisible = !record.visible;
      try {
        await mapLayerService.update(record.id, { visible: newVisible });
        toast.success(newVisible ? 'Đã bật hiển thị' : 'Đã tắt hiển thị');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
      }
    },
    [fetchData],
  );

  const handleDelete = useCallback(
    async (record: MapLayer) => {
      try {
        await mapLayerService.delete(record.id);
        toast.success('Đã xóa lớp bản đồ');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  // ── List-view columns ──
  const columns = useMemo(() => [
    { key: 'sequenceNo', label: '#', width: 60, align: 'center' as const, type: 'mono' as const,
      render: (_: unknown, __: MapLayer, idx: number) =>
        <span style={{ color: textTertiary }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'code', label: 'Mã', dataIndex: 'code', width: 180,
      render: (code: string) => (
        <Tooltip title={code}>
          <Tag color="cyan" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'bottom' }}>{code}</Tag>
        </Tooltip>) },
    { key: 'name', label: 'Tên', dataIndex: 'name',
      render: (text: string, record: MapLayer) => (
        <Space>
          {record.visible ? (
            <EyeOutlined style={{ color: statusOperational }} />
          ) : (
            <EyeInvisibleOutlined style={{ color: textTertiary }} />
          )}
          <Typography.Text strong>{text}</Typography.Text>
        </Space>
      ),
    },
    { key: 'layerType', label: 'Loại lớp', dataIndex: 'layerType', width: 130,
      render: (type: string) => {
        const opt = MAP_LAYER_TYPE_OPTIONS.find((o) => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      } },
    { key: 'opacity', label: 'Opacity', dataIndex: 'opacity', width: 90, align: 'center' as const,
      render: (v: number) => `${(v! * 100).toFixed(0)}%` },
    { key: 'order', label: 'Thứ tự', dataIndex: 'order', width: 80, align: 'center' as const,
      render: (v: number) => v },
    { key: 'visible', label: 'Hiển thị', dataIndex: 'visible', width: 90, align: 'center' as const,
      render: (visible: boolean, record: MapLayer) => (
        <Switch checked={visible} onChange={() => handleToggleVisible(record)} size="small" />
      ),
    },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 120, align: 'center' as const,
      type: 'status' as const,
      render: (status: string) => {
        const s = MAP_LAYER_STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      } },
    { key: 'updatedAt', label: 'Cập nhật', dataIndex: 'updatedAt', width: 130,
      type: 'date' as const,
      render: (text: string) => (text ? dayjs(text).format('DD/MM/YYYY') : '—') },
    { key: 'actions', label: 'Thao tác', width: 160, align: 'center' as const,
      type: 'action' as const,
      render: (_: unknown, record: MapLayer) => (
        <Space size={spaceXs}>
          {hasPerm('gis.layer.edit') && (
            <Tooltip title="Sửa">
              <Button type="link" size="small" icon={<EditOutlined />}
                onClick={() => openEditModal(record)} />
            </Tooltip>
          )}
          {hasPerm('gis.layer.delete') && (
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
          )}
        </Space>
      ),
    },
  ], [page, pageSize, hasPerm, openEditModal, handleToggleVisible, handleDelete]);

  // ── Filter fields ──
  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, mã...' },
    { key: 'layerType', type: 'select' as const, label: 'Loại lớp', placeholder: 'Chọn loại',
      options: MAP_LAYER_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label })) },
  ], []);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterType(values.layerType || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterType(undefined);
    setPage(1);
  }, []);

  // ── Header actions ──
  const headerActions = useMemo(() => [
    hasPerm('gis.layer.create') ? {
      key: 'create', label: 'Thêm lớp bản đồ', variant: 'primary' as const,
      icon: <PlusOutlined />, onClick: openCreateModal,
    } : null,
  ].filter(Boolean) as { key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon: React.ReactNode; onClick: () => void }[], [hasPerm, openCreateModal]);

  return (
    <>
      <ScreenHeader
        breadcrumb={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Quản lý KCHT trên nền bản đồ (GIS)', path: '#' },
          { label: 'Quản lý lớp bản đồ' },
        ]}
        actions={headerActions}
      />

      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />

      {isLoading && <LoadingSkeleton rows={8} type="table" />}
      {isError && (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách lớp bản đồ'}
          onRetry={fetchData}
        />
      )}
      {!isLoading && !isError && dataSource.length === 0 && (
        <EmptyState
          description={search || filterType ? 'Không tìm thấy' : 'Chưa có lớp bản đồ nào'}
        />
      )}
      {!isLoading && !isError && dataSource.length > 0 && (
        <>
          <DataTable
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            loading={false}
          />
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onChange={(p, sz) => { setPage(p); if (sz) setPageSize(sz); }}
          />
        </>
      )}

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingRecord ? 'Chỉnh sửa lớp bản đồ' : 'Thêm lớp bản đồ mới'}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        destroyOnHidden
        confirmLoading={submitting}
        okText={editingRecord ? 'Cập nhật' : 'Tạo lớp'}
        cancelText="Hủy"
        width={700}
        mask={{ closable: false }}
        footer={[
          <Button key="cancel" style={{ ...BTN_STYLE, borderColor: borderDefault, color: textSecondary }}
            onClick={() => setIsModalOpen(false)}>Hủy</Button>,
          <Button key="submit" type="primary" style={{ ...BTN_STYLE, background: actionPrimary, borderColor: actionPrimary }}
            loading={submitting} onClick={handleSubmit}>
            {editingRecord ? 'Cập nhật' : 'Tạo lớp'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={MODAL_FORM_STYLE}>
          <Form.Item name="code" label="Mã lớp"
            rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: LAY-PT-001" disabled={!!editingRecord} style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="name" label="Tên lớp"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: Đối tượng điểm cảng biển" style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="layerType" label="Loại lớp"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại lớp" options={MAP_LAYER_TYPE_OPTIONS} style={SELECT_STYLE} />
          </Form.Item>

          <Form.Item name="source" label="Nguồn dữ liệu"
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: WMS, GeoJSON, file shape..." style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="styleConfig" label="Cấu hình style (JSON)"
            style={{ marginBottom: spaceFormField }}>
            <Input.TextArea placeholder='{"color": "#ff0000", "width": 2}'
              rows={3} style={{ borderRadius: radiusPill }} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="opacity" label="Độ mờ (0-1)"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="1" min={0} max={1} step={0.1}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="order" label="Thứ tự hiển thị"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="0" min={0} step={1}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="visible" label="Hiển thị" valuePropName="checked"
            style={{ marginBottom: spaceFormField }}>
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
