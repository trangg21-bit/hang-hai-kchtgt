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
  SearchOutlined,
  ReloadOutlined,
  SendOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { pointObjectService } from '../../services/pointObjectService';
import type { PointObject } from '../../services/pointObjectService';
import {
  POINT_OBJECT_TYPE_OPTIONS,
  POINT_OBJECT_STATUS_MAP,
} from '../../types/pointObject';
import type { CreatePointObjectPayload, UpdatePointObjectPayload } from '../../types/pointObject';
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
  spaceMd, spaceFormField, spaceSm, spaceLg, spaceXs,
  radiusPill, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  textPrimary, textSecondary, textTertiary,
  statusOperational, statusAttention, statusCritical, statusDraft,
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

const CATEGORY_OPTIONS = [
  { value: '1', label: 'Cảng biển' },
  { value: '2', label: 'Đèn biển' },
  { value: '3', label: 'Phao tiêu' },
  { value: '4', label: 'Đèn hiệu' },
  { value: '5', label: 'Khác' },
];

export default function PointObjectList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<PointObject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PointObject | null>(null);
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
      const res = await pointObjectService.list({
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
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đối tượng điểm'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterType, filterStatus]);

  const openCreateModal = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: 'DRAFT' });
    setIsModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: PointObject) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      objectType: record.objectType,
      categoryId: record.categoryId,
      iconId: record.iconId,
      longitude: record.longitude,
      latitude: record.latitude,
      description: record.description,
      status: record.status,
    });
    setIsModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (values.latitude < -90 || values.latitude > 90) {
        message.error('Vĩ độ phải từ -90 đến 90');
        return;
      }
      if (values.longitude < -180 || values.longitude > 180) {
        message.error('Kinh độ phải từ -180 đến 180');
        return;
      }

      setSubmitting(true);

      if (editingRecord) {
        const payload: UpdatePointObjectPayload = {
          name: values.name,
          objectType: values.objectType,
          categoryId: values.categoryId,
          iconId: values.iconId,
          longitude: values.longitude,
          latitude: values.latitude,
          description: values.description,
        };
        await pointObjectService.update(editingRecord.id, payload);
        toast.success('Đã cập nhật đối tượng điểm');
      } else {
        const payload: CreatePointObjectPayload = {
          name: values.name,
          code: values.code,
          objectType: values.objectType,
          categoryId: values.categoryId,
          iconId: values.iconId,
          longitude: values.longitude,
          latitude: values.latitude,
          description: values.description,
        };
        await pointObjectService.create(payload);
        toast.success('Đã tạo đối tượng điểm');
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
    async (record: PointObject) => {
      try {
        await pointObjectService.delete(record.id);
        toast.success('Đã xóa đối tượng điểm');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: PointObject) => {
      try {
        await pointObjectService.submitForApproval(record.id);
        toast.success('Đã gửi duyệt đối tượng');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: PointObject) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await pointObjectService.approveL1(record.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: PointObject) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await pointObjectService.approveL2(record.id, approverId);
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
      render: (_: unknown, __: PointObject, idx: number) =>
        <span style={{ color: textTertiary }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'code', label: 'Mã', dataIndex: 'code', width: 140,
      render: (code: string) => (
        <Tooltip title={code}>
          <Tag color="cyan" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{code}</Tag>
        </Tooltip>) },
    { key: 'name', label: 'Tên', dataIndex: 'name' },
    { key: 'objectType', label: 'Loại', dataIndex: 'objectType', width: 120,
      render: (type: string) => {
        const opt = POINT_OBJECT_TYPE_OPTIONS.find((o) => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      } },
    { key: 'latitude', label: 'Vĩ độ', dataIndex: 'latitude', width: 100, align: 'right' as const,
      render: (v: number) => v?.toFixed(4) || '—' },
    { key: 'longitude', label: 'Kinh độ', dataIndex: 'longitude', width: 100, align: 'right' as const,
      render: (v: number) => v?.toFixed(4) || '—' },
    { key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 120, align: 'center' as const,
      type: 'status' as const,
      render: (status: string) => {
        const s = POINT_OBJECT_STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      } },
    { key: 'approvalStatus', label: 'Duyệt', dataIndex: 'approvalStatus', width: 100, align: 'center' as const,
      render: (status: string) => {
        const color = status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange';
        const label = status === 'APPROVED' ? 'Đã duyệt' : status === 'REJECTED' ? 'Từ chối' : 'Chờ';
        return <Tag color={color}>{label}</Tag>;
      } },
    { key: 'updatedAt', label: 'Cập nhật', dataIndex: 'updatedAt', width: 120,
      type: 'date' as const,
      render: (text: string) => (text ? dayjs(text).format('DD/MM/YYYY') : '—') },
    { key: 'actions', label: 'Thao tác', width: 140, align: 'center' as const,
      type: 'action' as const,
      render: (_: unknown, record: PointObject) => (
        <Space size={spaceXs}>
          <Tooltip title="Xem chi tiết">
            <Button type="link" size="small" icon={<EyeOutlined />}
              onClick={() => navigate(`/gis/points/${record.id}`)} />
          </Tooltip>
          {hasPerm('gis.point.edit') && (
            <Tooltip title="Sửa">
              <Button type="link" size="small" icon={<EditOutlined />}
                onClick={() => openEditModal(record)} />
            </Tooltip>
          )}
          {hasPerm('gis.point.delete') && record.status === 'DRAFT' && (
            <Popconfirm title="Xác nhận xóa" description={`Bạn có chắc muốn xóa "${record.name}"?`}
              okText="Xóa" okType="danger" cancelText="Hủy"
              onConfirm={() => handleDelete(record)}>
              <Tooltip title="Xóa">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === 'DRAFT' && hasPerm('gis.point.submit') && (
            <Tooltip title="Gửi duyệt">
              <Popconfirm title="Gửi duyệt đối tượng?" okText="Gửi" cancelText="Hủy"
                onConfirm={() => handleSubmitApproval(record)}>
                <Button type="link" size="small" icon={<SendOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'PENDING_APPROVAL' && hasPerm('gis.point.approve-l1') && (
            <Tooltip title="Phê duyệt L1">
              <Popconfirm title="Phê duyệt cấp 1?" okText="Phê duyệt" cancelText="Hủy"
                onConfirm={() => handleApproveL1(record)}>
                <Button type="link" size="small" icon={<CheckCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'APPROVED_L1' && hasPerm('gis.point.approve-l2') && (
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
      options: POINT_OBJECT_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label })) },
    { key: 'status', type: 'select' as const, label: 'Trạng thái', placeholder: 'Chọn trạng thái',
      options: Object.entries(POINT_OBJECT_STATUS_MAP).map(([value, { label }]) => ({ value, label })) },
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
    hasPerm('gis.point.create') ? {
      key: 'create', label: 'Thêm đối tượng điểm', variant: 'primary' as const,
      icon: <PlusOutlined />, onClick: openCreateModal,
    } : null,
  ].filter(Boolean) as { key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon: React.ReactNode; onClick: () => void }[], [hasPerm, openCreateModal]);

  return (
    <>
      <ScreenHeader
        breadcrumb={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
          { label: 'Quản lý danh mục đối tượng điểm' },
        ]}
        actions={headerActions}
      />

      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />

      {isLoading && <LoadingSkeleton rows={8} type="table" />}
      {isError && (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách đối tượng điểm'}
          onRetry={fetchData}
        />
      )}
      {!isLoading && !isError && dataSource.length === 0 && (
        <EmptyState
          description={search || filterType || filterStatus ? 'Không tìm thấy' : 'Chưa có đối tượng điểm nào'}
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
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingRecord ? 'Chỉnh sửa đối tượng điểm' : 'Thêm đối tượng điểm mới'}</span>}
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
            <Input placeholder="VD: PT-PORT-001" disabled={!!editingRecord} style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="name" label="Tên đối tượng"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            style={{ marginBottom: spaceFormField }}>
            <Input placeholder="VD: Cảng Hải Phòng" style={INPUT_STYLE} />
          </Form.Item>

          <Form.Item name="objectType" label="Loại đối tượng"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            style={{ marginBottom: spaceFormField }}>
            <Select placeholder="Chọn loại đối tượng" options={POINT_OBJECT_TYPE_OPTIONS} style={SELECT_STYLE} />
          </Form.Item>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="longitude" label="Kinh độ (Longitude)"
                rules={[{ required: true, message: 'Nhập kinh độ' }]}
                style={{ marginBottom: spaceFormField }}>                <InputNumber placeholder="-106.7" min={-180} max={180} step={0.0001}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="latitude" label="Vĩ độ (Latitude)"
                rules={[{ required: true, message: 'Nhập vĩ độ' }]}
                style={{ marginBottom: spaceFormField }}>                <InputNumber placeholder="20.9" min={-90} max={90} step={0.0001}
                  style={{ ...INPUT_STYLE, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={spaceMd}>
            <Col span={12}>
              <Form.Item name="categoryId" label="Danh mục"
                style={{ marginBottom: spaceFormField }}>                <Select placeholder="Tùy chọn danh mục" options={CATEGORY_OPTIONS} style={SELECT_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="iconId" label="Biểu tượng bản đồ"
                style={{ marginBottom: spaceFormField }}>                <Select placeholder="Tùy chọn biểu tượng" style={SELECT_STYLE}
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

          <Form.Item name="description" label="Mô tả"
            style={{ marginBottom: spaceFormField }}>            <Input.TextArea placeholder="Mô tả về đối tượng điểm..." rows={3}
              style={{ borderRadius: radiusPill }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
