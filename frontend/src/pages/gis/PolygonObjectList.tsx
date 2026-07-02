import { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Tooltip,
  Popconfirm,
  Modal,
  Form,
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
import { polygonObjectService } from '../../services/polygonObjectService';
import type { PolygonObject } from '../../services/polygonObjectService';
import {
  POLYGON_OBJECT_TYPE_OPTIONS,
  POLYGON_OBJECT_STATUS_MAP,
} from '../../types/polygonObject';
import type { CreatePolygonObjectPayload, UpdatePolygonObjectPayload } from '../../types/polygonObject';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import FormField from '../../components/FormField';

export default function PolygonObjectList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<PolygonObject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PolygonObject | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

      // WKT validation
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

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

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

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: PolygonObject, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 180,
      render: (code: string) => (
        <Tooltip title={code}>
          <Tag
            color="cyan"
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              verticalAlign: 'bottom',
            }}
          >
            {code}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Loại',
      dataIndex: 'objectType',
      width: 140,
      render: (type: string) => {
        const opt = POLYGON_OBJECT_TYPE_OPTIONS.find((o) => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      },
    },
    {
      title: 'Diện tích (km²)',
      dataIndex: 'area',
      width: 120,
      render: (v: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Mức độ cấm',
      dataIndex: 'restrictionLevel',
      width: 120,
      render: (text: string) => text ? <Tag color="red">{text}</Tag> : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const s = POLYGON_OBJECT_STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 130,
      render: (text: string) => (text ? dayjs(text).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: PolygonObject) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/gis/polygons/${record.id}`)}
            />
          </Tooltip>
          {hasPerm('gis.polygon.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
          )}
          {hasPerm('gis.polygon.delete') && record.status === 'DRAFT' && (
            <Popconfirm
              title="Xác nhận xóa"
              description={`Bạn có chắc muốn xóa "${record.name}"?`}
              okText="Xóa"
              okType="danger"
              cancelText="Hủy"
              onConfirm={() => handleDelete(record)}
            >
              <Tooltip title="Xóa">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === 'DRAFT' && hasPerm('gis.polygon.submit') && (
            <Tooltip title="Gửi duyệt">
              <Popconfirm
                title="Gửi duyệt đối tượng?"
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() => handleSubmitApproval(record)}
              >
                <Button type="link" size="small" icon={<SendOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'PENDING_APPROVAL' && hasPerm('gis.polygon.approve-l1') && (
            <Tooltip title="Phê duyệt L1">
              <Popconfirm
                title="Phê duyệt cấp 1?"
                okText="Phê duyệt"
                cancelText="Hủy"
                onConfirm={() => handleApproveL1(record)}
              >
                <Button type="link" size="small" icon={<CheckCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'APPROVED_L1' && hasPerm('gis.polygon.approve-l2') && (
            <Tooltip title="Phê duyệt L2">
              <Popconfirm
                title="Phê duyệt cấp 2?"
                okText="Phê duyệt"
                cancelText="Hủy"
                onConfirm={() => handleApproveL2(record)}
              >
                <Button type="link" size="small" icon={<CheckCircleOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tên, mã..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select
                placeholder="Loại đối tượng"
                allowClear
                style={{ width: 160 }}
                value={filterType}
                onChange={(val) => { setFilterType(val); setPage(1); }}
                options={POLYGON_OBJECT_TYPE_OPTIONS}
              />
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 160 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={Object.entries(POLYGON_OBJECT_STATUS_MAP).map(([value, { label }]) => ({ value, label }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              {hasPerm('gis.polygon.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Thêm đối tượng vùng
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
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
            ctaText="Thêm đối tượng vùng đầu tiên"
            onCta={openCreateModal}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<PolygonObject>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1460 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, sz) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} đối tượng`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      <Modal
        title={editingRecord ? 'Chỉnh sửa đối tượng vùng' : 'Thêm đối tượng vùng mới'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        confirmLoading={submitting}
        okText={editingRecord ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={700}
        mask={{ closable: false }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16, maxHeight: '60vh', overflowY: 'auto', paddingRight: 12 }}>
          <FormField
            type="text"
            name="code"
            label="Mã đối tượng"
            required
            disabled={!!editingRecord}
            placeholder="VD: PG-ANCHOR-001"
            help="Mã định danh duy nhất cho đối tượng vùng"
          />

          <FormField
            type="text"
            name="name"
            label="Tên đối tượng"
            required
            placeholder="VD: Vùng neo đậu Hải Phòng"
          />

          <FormField
            type="select"
            name="objectType"
            label="Loại đối tượng"
            required
            options={POLYGON_OBJECT_TYPE_OPTIONS}
          />

          <FormField
            type="textarea"
            name="coordinates"
            label="Tọa độ (WKT POLYGON)"
            required
            placeholder="POLYGON((106.7000 20.8000, 106.8000 20.8000, 106.8000 20.9000, 106.7000 20.9000, 106.7000 20.8000))"
            help="Định dạng WKT POLYGON — phải bắt đầu bằng 'POLYGON'"
          />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về đối tượng vùng..."
          />

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="number"
                name="area"
                label="Diện tích (km²)"
                min={0}
                step={0.01}
                placeholder="Tùy chọn"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="restrictionLevel"
                label="Mức độ hạn chế"
                placeholder="VD: HIGH, MEDIUM, LOW"
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="text"
                name="purpose"
                label="Mục đích sử dụng"
                placeholder="Tùy chọn"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="select"
                name="categoryId"
                label="Danh mục"
                placeholder="Tùy chọn danh mục"
                options={[
                  { label: 'Vùng nước cảng biển', value: 1 },
                  { label: 'Luồng hàng hải', value: 2 },
                  { label: 'Vùng đón trả hoa tiêu', value: 3 },
                  { label: 'Vùng kiểm dịch', value: 4 },
                  { label: 'Vùng hạn chế', value: 5 },
                  { label: 'Khác', value: 6 },
                ]}
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="select"
                name="fillSymbolId"
                label="Ký hiệu vùng"
                placeholder="Tùy chọn ký hiệu"
                options={[
                  { label: 'Symbol Vùng nước cảng biển', value: 1 },
                  { label: 'Symbol Luồng hàng hải', value: 2 },
                  { label: 'Symbol Vùng đón trả hoa tiêu', value: 3 },
                  { label: 'Symbol Vùng hạn chế', value: 4 },
                  { label: 'Symbol Khác', value: 5 },
                ]}
              />
            </Col>
            <Col span={12} />
          </Row>
        </Form>
      </Modal>
    </>
  );
}
