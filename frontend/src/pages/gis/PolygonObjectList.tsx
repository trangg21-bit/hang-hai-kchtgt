import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { polygonObjectService } from '../../services/polygonObjectService';
import type { PolygonObject } from '../../services/polygonObjectService';
import {
  POLYGON_OBJECT_TYPE_OPTIONS,
  POLYGON_OBJECT_STATUS_MAP,
} from '../../types/polygonObject';
import type { CreatePolygonObjectPayload, UpdatePolygonObjectPayload } from '../../types/polygonObject';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterBar, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import {
  spaceMd, spaceFormField, spaceXs,
  radiusPill, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  textPrimary, textSecondary, textTertiary,
  borderDefault, actionPrimary,
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

export default function PolygonObjectList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<PolygonObject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PolygonObject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  useEffect(() => {
    void fetchSymbols();
  }, [fetchSymbols]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await polygonObjectService.list({
        page,
        pageSize,
        search: search || undefined,
        objectType: filterType,
        status: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đối tượng vùng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterType, filterStatus]);

  const openCreateModal = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: PolygonObject) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      objectType: record.objectType,
      categoryId: record.categoryId,
      fillSymbolId: record.fillSymbolId,
      coordinates: record.coordinates,
      description: record.description,
      area: record.area,
      purpose: record.purpose,
      restrictionLevel: record.restrictionLevel,
    });
    setIsModalOpen(true);
  }, [form]);

  const validateWKT = (value: string): boolean => {
    if (!value) return false;
    return value.trim().toUpperCase().startsWith('POLYGON');
  };

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (!validateWKT(values.coordinates)) {
        message.error('Tọa độ phải ở định dạng WKT POLYGON (VD: POLYGON((106.7 20.8, 106.8 20.8, 106.8 20.9, 106.7 20.9, 106.7 20.8)))');
        return;
      }

      setSubmitting(true);

      if (editingRecord) {
        const payload: UpdatePolygonObjectPayload = {
          name: values.name,
          objectType: values.objectType,
          categoryId: values.categoryId,
          fillSymbolId: values.fillSymbolId,
          coordinates: values.coordinates,
          description: values.description,
          area: values.area,
          purpose: values.purpose,
          restrictionLevel: values.restrictionLevel,
        };
        await polygonObjectService.update(editingRecord.id, payload);
        toast.success('Đã cập nhật đối tượng vùng');
      } else {
        const payload: CreatePolygonObjectPayload = {
          name: values.name,
          code: values.code,
          objectType: values.objectType,
          categoryId: values.categoryId,
          fillSymbolId: values.fillSymbolId,
          coordinates: values.coordinates,
          description: values.description,
          area: values.area,
          purpose: values.purpose,
          restrictionLevel: values.restrictionLevel,
        };
        await polygonObjectService.create(payload);
        toast.success('Đã tạo đối tượng vùng');
      }

      setIsModalOpen(false);
      void fetchData();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, form, fetchData]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleDelete = useCallback(
    async (record: PolygonObject) => {
      try {
        await polygonObjectService.delete(record.id);
        toast.success('Đã xóa đối tượng vùng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: PolygonObject) => {
      try {
        await polygonObjectService.submitForApproval(record.id);
        toast.success('Đã gửi duyệt đối tượng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: PolygonObject) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await polygonObjectService.approveL1(record.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: PolygonObject) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await polygonObjectService.approveL2(record.id, approverId);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  // ── List-view columns ──
  const columns = useMemo(() => [
    { key: 'stt', label: '#', width: 60, align: 'center' as const, type: 'mono' as const,
      render: (_: unknown, __: PolygonObject, idx: number) =>
        <span style={{ color: textTertiary }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'code', label: 'Mã', dataIndex: 'code', width: 180,
      render: (code: string) => (
        <Tooltip title={code}>
          <Tag color="cyan" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'bottom' }}>{code}</Tag>
        </Tooltip>) },
    { key: 'name', label: 'Tên', dataIndex: 'name' },
    { key: 'objectType', label: 'Loại', dataIndex: 'objectType', width: 140,
      render: (type: string) => {
        const opt = POLYGON_OBJECT_TYPE_OPTIONS.find((o) => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      } },
    { key: 'area', label: 'Diện tích (km²)', dataIndex: 'area', width: 120, align: 'right' as const,
      render: (v: number) => v?.toFixed(2) || '—' },
    { key: 'restrictionLevel', label: 'Mức độ cấm', dataIndex: 'restrictionLevel', width: 120,
      render: (text: string) => text ? <Tag color="red">{text}</Tag> : <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 140, align: 'center' as const,
      type: 'status' as const,
      render: (status: string) => {
        const s = POLYGON_OBJECT_STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      } },
    { key: 'updatedAt', label: 'Cập nhật', dataIndex: 'updatedAt', width: 130,
      type: 'date' as const,
      render: (text: string) => (text ? dayjs(text).format('DD/MM/YYYY') : '—') },
    { key: 'actions', label: 'Thao tác', width: 140, align: 'center' as const,
      type: 'action' as const,
      render: (_: unknown, record: PolygonObject) => (
        <Space size={spaceXs}>
          <Tooltip title="Xem chi tiết">
            <Button type="link" size="small" icon={<EyeOutlined />}
              onClick={() => navigate(`/gis/polygons/${record.id}`)} />
          </Tooltip>
          {hasPerm('gis.polygon.edit') && (
            <Tooltip title="Sửa">
              <Button type="link" size="small" icon={<EditOutlined />}
                onClick={() => openEditModal(record)} />
            </Tooltip>
          )}
          {hasPerm('gis.polygon.delete') && record.status === 'DRAFT' && (
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
          {record.status === 'DRAFT' && hasPerm('gis.polygon.submit') && (
            <Tooltip title="Gửi duyệt">
              <Button type="link" size="small" icon={<SendOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Gửi duyệt đối tượng?',
                    okText: 'Gửi',
                    cancelText: 'Hủy',
                    onOk: () => handleSubmitApproval(record),
                  });
                }}
              />
            </Tooltip>
          )}
          {record.status === 'PENDING_APPROVAL' && hasPerm('gis.polygon.approve-l1') && (
            <Tooltip title="Phê duyệt L1">
              <Button type="link" size="small" icon={<CheckCircleOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Phê duyệt cấp 1?',
                    okText: 'Phê duyệt',
                    cancelText: 'Hủy',
                    onOk: () => handleApproveL1(record),
                  });
                }}
              />
            </Tooltip>
          )}
          {record.status === 'APPROVED_L1' && hasPerm('gis.polygon.approve-l2') && (
            <Tooltip title="Phê duyệt L2">
              <Button type="link" size="small" icon={<CheckCircleOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Phê duyệt cấp 2?',
                    okText: 'Phê duyệt',
                    cancelText: 'Hủy',
                    onOk: () => handleApproveL2(record),
                  });
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ], [page, pageSize, navigate, hasPerm, openEditModal, handleDelete, handleSubmitApproval, handleApproveL1, handleApproveL2]);

  // ── Filter fields ──
  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên, mã...' },
    { key: 'objectType', type: 'select' as const, label: 'Loại đối tượng', placeholder: 'Chọn loại',
      options: POLYGON_OBJECT_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label })) },
    { key: 'status', type: 'select' as const, label: 'Trạng thái', placeholder: 'Chọn trạng thái',
      options: Object.entries(POLYGON_OBJECT_STATUS_MAP).map(([value, { label }]) => ({ value, label })) },
  ], []);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterType(values.objectType || undefined);
    setFilterStatus(values.status || undefined);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterType(undefined);
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  // ── Header actions ──
  const headerActions = useMemo(() => [
    hasPerm('gis.polygon.create') ? {
      key: 'create', label: 'Thêm đối tượng vùng', variant: 'primary' as const,
      icon: <PlusOutlined />, onClick: openCreateModal,
    } : null,
  ].filter(Boolean) as { key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon: React.ReactNode; onClick: () => void }[], [hasPerm, openCreateModal]);

  return (
    <>
      <ScreenHeader
        breadcrumb={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
          { label: 'Quản lý danh mục đối tượng vùng' },
        ]}
        actions={headerActions}
      />

      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />

      {isLoading && <LoadingSkeleton rows={8} type="table" />}
      {isError && (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách đối tượng vùng'}
          onRetry={fetchData}
        />
      )}
      {!isLoading && !isError && dataSource.length === 0 && (
        <EmptyState
          description={search || filterType || filterStatus ? 'Không tìm thấy' : 'Chưa có đối tượng vùng nào'}
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
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingRecord ? 'Chỉnh sửa đối tượng vùng' : 'Thêm đối tượng vùng mới'}</span>}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        confirmLoading={submitting}
        okText={editingRecord ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={700}
        mask={{ closable: false }}
        footer={[
          <Button key="cancel" style={{ ...BTN_STYLE, borderColor: borderDefault, color: textSecondary }}
            onClick={() => setIsModalOpen(false)}>Hủy</Button>,
          <Button key="submit" type="primary" style={{ ...BTN_STYLE, background: actionPrimary, borderColor: actionPrimary }}
            loading={submitting} onClick={handleSubmit}>
            {editingRecord ? 'Cập nhật' : 'Tạo mới'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={MODAL_FORM_STYLE}>
          <Form.Item name="code" label="Mã đối tượng"
            rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: PG-ANCHOR-001" disabled={!!editingRecord} style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="name" label="Tên đối tượng"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: Vùng neo đậu Hải Phòng" style={INPUT_STYLE} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="objectType" label="Loại đối tượng"
                rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
                style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn loại đối tượng" options={POLYGON_OBJECT_TYPE_OPTIONS} style={SELECT_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fillSymbolId" label="Ký hiệu vùng"
                style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Tùy chọn ký hiệu" style={SELECT_STYLE}
                  options={symbols.map(s => ({
                    label: (
                      <Space>
                        {s.hinhAnh && <img src={s.hinhAnh} alt={s.name} style={{ width: 16, height: 16, objectFit: 'contain' }} />}
                        <span>{s.name} ({s.code})</span>
                      </Space>
                    ),
                    value: s.id
                  }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="coordinates" label="Tọa độ (WKT POLYGON)"
            rules={[{ required: true, message: 'Vui lòng nhập tọa độ WKT' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="POLYGON((106.7000 20.8000, 106.8000 20.8000, 106.8000 20.9000, 106.7000 20.9000, 106.7000 20.8000))" style={INPUT_STYLE} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="area" label="Diện tích (km²)"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="Tùy chọn" min={0} step={0.01}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="restrictionLevel" label="Mức độ hạn chế"
                style={{ marginBottom: spaceFormField }}>
                <Input placeholder="VD: HIGH, MEDIUM, LOW" style={INPUT_STYLE} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="purpose" label="Mục đích sử dụng"
                style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Tùy chọn" style={INPUT_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="categoryId" label="Danh mục"
                style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Tùy chọn danh mục" style={SELECT_STYLE}
                  options={[
                    { label: 'Vùng nước cảng biển', value: 1 },
                    { label: 'Luồng hàng hải', value: 2 },
                    { label: 'Vùng đón trả hoa tiêu', value: 3 },
                    { label: 'Vùng kiểm dịch', value: 4 },
                    { label: 'Vùng hạn chế', value: 5 },
                    { label: 'Khác', value: 6 },
                  ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả"
            style={{ marginBottom: 0 }}>
            <Input.TextArea placeholder="Mô tả về đối tượng vùng..." rows={3}
              style={{ borderRadius: radiusPill }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
