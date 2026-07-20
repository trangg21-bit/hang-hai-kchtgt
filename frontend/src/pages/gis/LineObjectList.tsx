import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
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
import { lineObjectService } from '../../services/lineObjectService';
import type { LineObject } from '../../services/lineObjectService';
import {
  LINE_OBJECT_TYPE_OPTIONS,
  LINE_OBJECT_STATUS_MAP,
} from '../../types/lineObject';
import type { CreateLineObjectPayload, UpdateLineObjectPayload } from '../../types/lineObject';
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

export default function LineObjectList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<LineObject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LineObject | null>(null);
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
      const res = await lineObjectService.list({
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
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đối tượng đường'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterType, filterStatus]);

  const openCreateModal = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: LineObject) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      objectType: record.objectType,
      categoryId: record.categoryId,
      lineSymbolId: record.lineSymbolId,
      coordinates: record.coordinates,
      description: record.description,
      length: record.length,
      material: record.material,
      yearBuilt: record.yearBuilt,
    });
    setIsModalOpen(true);
  }, [form]);

  const validateWKT = (value: string): boolean => {
    if (!value) return false;
    return value.trim().toUpperCase().startsWith('LINESTRING');
  };

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (!validateWKT(values.coordinates)) {
        message.error('Tọa độ phải ở định dạng WKT LINESTRING (VD: LINESTRING(106.7 21.0, 106.8 21.1))');
        return;
      }

      setSubmitting(true);

      if (editingRecord) {
        const payload: UpdateLineObjectPayload = {
          name: values.name,
          objectType: values.objectType,
          categoryId: values.categoryId,
          lineSymbolId: values.lineSymbolId,
          coordinates: values.coordinates,
          description: values.description,
          length: values.length,
          material: values.material,
          yearBuilt: values.yearBuilt,
        };
        await lineObjectService.update(editingRecord.id, payload);
        toast.success('Đã cập nhật đối tượng đường');
      } else {
        const payload: CreateLineObjectPayload = {
          name: values.name,
          code: values.code,
          objectType: values.objectType,
          categoryId: values.categoryId,
          lineSymbolId: values.lineSymbolId,
          coordinates: values.coordinates,
          description: values.description,
          length: values.length,
          material: values.material,
          yearBuilt: values.yearBuilt,
        };
        await lineObjectService.create(payload);
        toast.success('Đã tạo đối tượng đường');
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
    async (record: LineObject) => {
      try {
        await lineObjectService.delete(record.id);
        toast.success('Đã xóa đối tượng đường');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: LineObject) => {
      try {
        await lineObjectService.submitForApproval(record.id);
        toast.success('Đã gửi duyệt đối tượng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: LineObject) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await lineObjectService.approveL1(record.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: LineObject) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await lineObjectService.approveL2(record.id, approverId);
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
      render: (_: unknown, __: LineObject, idx: number) =>
        <span style={{ color: textTertiary }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'code', label: 'Mã', dataIndex: 'code', width: 180,
      render: (code: string) => (
        <Tooltip title={code}>
          <Tag color="cyan" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'bottom' }}>{code}</Tag>
        </Tooltip>) },
    { key: 'name', label: 'Tên', dataIndex: 'name' },
    { key: 'objectType', label: 'Loại', dataIndex: 'objectType', width: 140,
      render: (type: string) => {
        const opt = LINE_OBJECT_TYPE_OPTIONS.find((o) => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      } },
    { key: 'length', label: 'Chiều dài (km)', dataIndex: 'length', width: 110, align: 'right' as const,
      render: (v: number) => v?.toFixed(2) || '—' },
    { key: 'material', label: 'Vật liệu', dataIndex: 'material', width: 120,
      render: (text: string) => text || <Typography.Text type="secondary">—</Typography.Text> },
    { key: 'yearBuilt', label: 'Năm xây', dataIndex: 'yearBuilt', width: 90,
      render: (v?: number) => v || '—' },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 140, align: 'center' as const,
      type: 'status' as const,
      render: (status: string) => {
        const s = LINE_OBJECT_STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      } },
    { key: 'updatedAt', label: 'Cập nhật', dataIndex: 'updatedAt', width: 130,
      type: 'date' as const,
      render: (text: string) => (text ? dayjs(text).format('DD/MM/YYYY') : '—') },
    { key: 'actions', label: 'Thao tác', width: 140, align: 'center' as const,
      type: 'action' as const,
      render: (_: unknown, record: LineObject) => (
        <Space size={spaceXs}>
          <Tooltip title="Xem chi tiết">
            <Button type="link" size="small" icon={<EyeOutlined />}
              onClick={() => navigate(`/gis/lines/${record.id}`)} />
          </Tooltip>
          {hasPerm('gis.line.edit') && (
            <Tooltip title="Sửa">
              <Button type="link" size="small" icon={<EditOutlined />}
                onClick={() => openEditModal(record)} />
            </Tooltip>
          )}
          {hasPerm('gis.line.delete') && record.status === 'DRAFT' && (
            <Popconfirm title="Xác nhận xóa" description={`Bạn có chắc muốn xóa "${record.name}"?`}
              okText="Xóa" okType="danger" cancelText="Hủy"
              onConfirm={() => handleDelete(record)}>
              <Tooltip title="Xóa">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === 'DRAFT' && hasPerm('gis.line.submit') && (
            <Tooltip title="Gửi duyệt">
              <Popconfirm title="Gửi duyệt đối tượng?" okText="Gửi" cancelText="Hủy"
                onConfirm={() => handleSubmitApproval(record)}>
                <Button type="link" size="small" icon={<SendOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'PENDING_APPROVAL' && hasPerm('gis.line.approve-l1') && (
            <Tooltip title="Phê duyệt L1">
              <Popconfirm title="Phê duyệt cấp 1?" okText="Phê duyệt" cancelText="Hủy"
                onConfirm={() => handleApproveL1(record)}>
                <Button type="link" size="small" icon={<CheckCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'APPROVED_L1' && hasPerm('gis.line.approve-l2') && (
            <Tooltip title="Phê duyệt L2">
              <Popconfirm title="Phê duyệt cấp 2?" okText="Phê duyệt" cancelText="Hủy"
                onConfirm={() => handleApproveL2(record)}>
                <Button type="link" size="small" icon={<CheckCircleOutlined />} />
              </Popconfirm>
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
      options: LINE_OBJECT_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label })) },
    { key: 'status', type: 'select' as const, label: 'Trạng thái', placeholder: 'Chọn trạng thái',
      options: Object.entries(LINE_OBJECT_STATUS_MAP).map(([value, { label }]) => ({ value, label })) },
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
    hasPerm('gis.line.create') ? {
      key: 'create', label: 'Thêm đối tượng đường', variant: 'primary' as const,
      icon: <PlusOutlined />, onClick: openCreateModal,
    } : null,
  ].filter(Boolean) as { key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon: React.ReactNode; onClick: () => void }[], [hasPerm, openCreateModal]);

  return (
    <>
      <ScreenHeader
        breadcrumb={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
          { label: 'Quản lý danh mục đối tượng đường' },
        ]}
        actions={headerActions}
      />

      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />

      {isLoading && <LoadingSkeleton rows={8} type="table" />}
      {isError && (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách đối tượng đường'}
          onRetry={fetchData}
        />
      )}
      {!isLoading && !isError && dataSource.length === 0 && (
        <EmptyState
          description={search || filterType || filterStatus ? 'Không tìm thấy' : 'Chưa có đối tượng đường nào'}
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
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingRecord ? 'Chỉnh sửa đối tượng đường' : 'Thêm đối tượng đường mới'}</span>}
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
            <Input placeholder="VD: LN-ROUTE-001" disabled={!!editingRecord} style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="name" label="Tên đối tượng"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: Tuyến hàng hải Hải Phòng - Quảng Ninh" style={INPUT_STYLE} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="objectType" label="Loại đối tượng"
                rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
                style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Chọn loại đối tượng" options={LINE_OBJECT_TYPE_OPTIONS} style={SELECT_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lineSymbolId" label="Ký hiệu đường"
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

          <Form.Item name="coordinates" label="Tọa độ (WKT LINESTRING)"
            rules={[{ required: true, message: 'Vui lòng nhập tọa độ WKT' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="LINESTRING(106.7000 20.8500, 106.8000 20.9000, 107.0000 21.0000)" style={INPUT_STYLE} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="length" label="Chiều dài (km)"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="Tùy chọn" min={0} step={0.01}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="yearBuilt" label="Năm xây dựng"
                style={{ marginBottom: spaceFormField }}>
                <InputNumber placeholder="Tùy chọn" min={1900} max={9999}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="material" label="Vật liệu"
                style={{ marginBottom: spaceFormField }}>
                <Input placeholder="Tùy chọn" style={INPUT_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="categoryId" label="Danh mục"
                style={{ marginBottom: spaceFormField }}>
                <Select placeholder="Tùy chọn danh mục" style={SELECT_STYLE}
                  options={[
                    { label: 'Đường bờ biển', value: 1 },
                    { label: 'Tuyến hàng hải', value: 2 },
                    { label: 'Đường thủy', value: 3 },
                    { label: 'Khác', value: 4 },
                  ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả"
            style={{ marginBottom: 0 }}>
            <Input.TextArea placeholder="Mô tả về đối tượng đường..." rows={3}
              style={{ borderRadius: radiusPill }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
