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
import { lineObjectService } from '../../services/lineObjectService';
import type { LineObject } from '../../services/lineObjectService';
import {
  LINE_OBJECT_TYPE_OPTIONS,
  LINE_OBJECT_STATUS_MAP,
} from '../../types/lineObject';
import type { CreateLineObjectPayload, UpdateLineObjectPayload } from '../../types/lineObject';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import FormField from '../../components/FormField';

export default function LineObjectList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<LineObject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LineObject | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

      // WKT validation
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

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

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

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: LineObject, idx: number) => (page - 1) * pageSize + idx + 1 },
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
        const opt = LINE_OBJECT_TYPE_OPTIONS.find((o) => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      },
    },
    {
      title: 'Chiều dài (km)',
      dataIndex: 'length',
      width: 110,
      render: (v: number) => v?.toFixed(2) || '—',
    },
    {
      title: 'Vật liệu',
      dataIndex: 'material',
      width: 120,
      render: (text: string) => text || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Năm xây',
      dataIndex: 'yearBuilt',
      width: 90,
      render: (v?: number) => v || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const s = LINE_OBJECT_STATUS_MAP[status] || { color: 'default', label: status };
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
      render: (_: unknown, record: LineObject) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/gis/lines/${record.id}`)}
            />
          </Tooltip>
          {hasPerm('gis.line.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
          )}
          {hasPerm('gis.line.delete') && record.status === 'DRAFT' && (
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
          {record.status === 'DRAFT' && hasPerm('gis.line.submit') && (
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
          {record.status === 'PENDING_APPROVAL' && hasPerm('gis.line.approve-l1') && (
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
          {record.status === 'APPROVED_L1' && hasPerm('gis.line.approve-l2') && (
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
                options={LINE_OBJECT_TYPE_OPTIONS}
              />
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 160 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={Object.entries(LINE_OBJECT_STATUS_MAP).map(([value, { label }]) => ({ value, label }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              {hasPerm('gis.line.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Thêm đối tượng đường
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
            message={error?.message || 'Không thể tải danh sách đối tượng đường'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search || filterType || filterStatus ? 'Không tìm thấy' : 'Chưa có đối tượng đường nào'}
            ctaText="Thêm đối tượng đường đầu tiên"
            onCta={openCreateModal}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<LineObject>
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
        title={editingRecord ? 'Chỉnh sửa đối tượng đường' : 'Thêm đối tượng đường mới'}
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
            placeholder="VD: LN-ROUTE-001"
            help="Mã định danh duy nhất cho đối tượng đường"
          />

          <FormField
            type="text"
            name="name"
            label="Tên đối tượng"
            required
            placeholder="VD: Tuyến hàng hải Hải Phòng - Quảng Ninh"
          />

          <FormField
            type="select"
            name="objectType"
            label="Loại đối tượng"
            required
            options={LINE_OBJECT_TYPE_OPTIONS}
          />

          <FormField
            type="textarea"
            name="coordinates"
            label="Tọa độ (WKT LINESTRING)"
            required
            placeholder="LINESTRING(106.7000 20.8500, 106.8000 20.9000, 107.0000 21.0000)"
            help="Định dạng WKT LINESTRING — phải bắt đầu bằng 'LINESTRING'"
          />

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về đối tượng đường..."
          />

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="number"
                name="length"
                label="Chiều dài (km)"
                min={0}
                step={0.01}
                placeholder="Tùy chọn"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="yearBuilt"
                label="Năm xây dựng"
                min={1900}
                max={9999}
                placeholder="Tùy chọn"
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="text"
                name="material"
                label="Vật liệu"
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
                  { label: 'Đường bờ biển', value: 1 },
                  { label: 'Tuyến hàng hải', value: 2 },
                  { label: 'Đường thủy', value: 3 },
                  { label: 'Khác', value: 4 },
                ]}
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="select"
                name="lineSymbolId"
                label="Ký hiệu đường"
                placeholder="Tùy chọn ký hiệu"
                options={[
                  { label: 'Symbol Đường bờ biển', value: 1 },
                  { label: 'Symbol Tuyến hàng hải', value: 2 },
                  { label: 'Symbol Đường thủy', value: 3 },
                  { label: 'Symbol Khác', value: 4 },
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
