import { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
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
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  beaconLightCRUD,
  approval,
} from '../../services/beaconService';
import type { BeaconLight, CreateBeaconLightRequest, UpdateBeaconLightRequest } from '../../types/beacon';
import {
  BEACON_STATUS_MAP,
  BEACON_LIGHT_TYPE_OPTIONS,
  BEACON_LIGHT_TYPE_MAP,
} from '../../types/beacon';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import FormField from '../../components/FormField';

export default function BeaconList() {
  const navigate = useNavigate();

  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataSource, setDataSource] = useState<BeaconLight[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BeaconLight | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await beaconLightCRUD.search({
        page,
        pageSize,
        name: filterName || undefined,
        code: filterCode || undefined,
        type: filterType,
        status: filterStatus,
      });
      const startIndex = (page - 1) * pageSize;
      const paginatedData = res.data.slice(startIndex, startIndex + pageSize);
      setDataSource(paginatedData);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đèn biển'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterName, filterCode, filterType, filterStatus]);

  const openCreateModal = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: BeaconLight) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      type: record.type,
      longitude: record.longitude,
      latitude: record.latitude,
      lightRange: record.lightRange,
      lightColor: record.lightColor,
      description: record.description,
    });
    setIsModalOpen(true);
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      // WGS84 validation
      if (values.latitude < -90 || values.latitude > 90) {
        message.error('Vĩ độ phải từ -90 đến 90');
        return;
      }
      if (values.longitude < -180 || values.longitude > 180) {
        message.error('Kinh độ phải từ -180 đến 180');
        return;
      }
      if (values.lightRange < 0.01 || values.lightRange > 60) {
        message.error('Bán kính chiếu sáng phải từ 0.01 đến 60');
        return;
      }

      setSubmitting(true);

      if (editingRecord) {
        const payload: UpdateBeaconLightRequest = {
          name: values.name,
          type: values.type,
          longitude: values.longitude,
          latitude: values.latitude,
          lightRange: values.lightRange,
          lightColor: values.lightColor,
          description: values.description,
        };
        await beaconLightCRUD.update(editingRecord.id, payload);
        toast.success('Đã cập nhật đèn biển');
      } else {
        const payload: CreateBeaconLightRequest = {
          name: values.name,
          code: values.code,
          type: values.type,
          longitude: values.longitude,
          latitude: values.latitude,
          lightRange: values.lightRange,
          lightColor: values.lightColor,
          description: values.description,
        };
        await beaconLightCRUD.create(payload);
        toast.success('Đã tạo đèn biển');
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
    async (record: BeaconLight) => {
      try {
        await beaconLightCRUD.delete(record.id);
        toast.success('Đã xóa đèn biển');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
      }
    },
    [fetchData],
  );

  const handleSubmitApproval = useCallback(
    async (record: BeaconLight) => {
      try {
        await approval.submitForApproval(record.id);
        toast.success('Đã gửi duyệt đèn biển');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL1 = useCallback(
    async (record: BeaconLight) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await approval.approveL1(record.id, approverId);
        toast.success('Đã phê duyệt cấp 1');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleApproveL2 = useCallback(
    async (record: BeaconLight) => {
      const approverId = localStorage.getItem('user_id') || '1';
      try {
        await approval.approveL2(record.id, approverId);
        toast.success('Đã phê duyệt cấp 2');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
      }
    },
    [fetchData],
  );

  const handleReject = useCallback(
    async (record: BeaconLight) => {
      const approverId = localStorage.getItem('user_id') || '1';
      const reason = window.prompt('Lý do từ chối:', '');
      if (reason === null) return; // user cancelled
      try {
        await approval.reject(record.id, reason, approverId);
        toast.success('Đã từ chối');
        fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
      }
    },
    [fetchData],
  );

  const columns = [
    { title: '#', width: 60, render: (_: unknown, __: BeaconLight, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 160,
      render: (code: string) => <Tag color="cyan">{code}</Tag>,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 160,
      render: (type: string) => {
        const m = BEACON_LIGHT_TYPE_MAP[type as keyof typeof BEACON_LIGHT_TYPE_MAP];
        return m ? <Tag color={m.color}>{BEACON_LIGHT_TYPE_OPTIONS.find((o) => o.value === type)?.label || type}</Tag> : <Tag>{type}</Tag>;
      },
    },
    {
      title: 'Vĩ độ',
      dataIndex: 'latitude',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '—',
    },
    {
      title: 'Kinh độ',
      dataIndex: 'longitude',
      width: 100,
      render: (v: number) => v?.toFixed(4) || '—',
    },
    {
      title: 'Bán kính (km)',
      dataIndex: 'lightRange',
      width: 110,
      render: (v: number) => v?.toFixed(1) || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const s = BEACON_STATUS_MAP[status as keyof typeof BEACON_STATUS_MAP] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: BeaconLight) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/beacons/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title="Gửi duyệt">
              <Popconfirm
                title="Gửi duyệt đèn biển?"
                description="Sau khi gửi, đèn biển sẽ chuyển sang trạng thái chờ phê duyệt cấp 1."
                okText="Gửi"
                cancelText="Hủy"
                onConfirm={() => handleSubmitApproval(record)}
              >
                <Button type="link" size="small" icon={<SendOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'PENDING_APPROVAL' && (
            <>
              <Tooltip title="Phê duyệt cấp 1">
                <Popconfirm
                  title="Phê duyệt cấp 1?"
                  description="Sau khi phê duyệt, đèn biển sẽ chuyển sang trạng thái chờ phê duyệt cấp 2."
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApproveL1(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối?"
                  description="Bạn sẽ cần nhập lý do từ chối."
                  okText="Từ chối"
                  cancelText="Hủy"
                  onConfirm={() => handleReject(record)}
                >
                  <Button type="link" size="small" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
          {record.status === 'APPROVED_L1' && (
            <>
              <Tooltip title="Phê duyệt cấp 2">
                <Popconfirm
                  title="Phê duyệt cấp 2?"
                  description="Sau khi phê duyệt, đèn biển sẽ được công bố chính thức."
                  okText="Phê duyệt"
                  cancelText="Hủy"
                  onConfirm={() => handleApproveL2(record)}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Từ chối">
                <Popconfirm
                  title="Từ chối?"
                  description="Bạn sẽ cần nhập lý do từ chối."
                  okText="Từ chối"
                  cancelText="Hủy"
                  onConfirm={() => handleReject(record)}
                >
                  <Button type="link" size="small" danger icon={<CloseCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
          {record.status === 'DRAFT' && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa đèn biển "${record.name}"?`}
                okText="Xóa"
                okType="danger"
                cancelText="Hủy"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
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
              <Input
                placeholder="Lọc theo tên"
                allowClear
                style={{ width: 160 }}
                value={filterName}
                onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
              />
              <Input
                placeholder="Lọc theo mã"
                allowClear
                style={{ width: 140 }}
                value={filterCode}
                onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
              />
              <Select
                placeholder="Loại đèn biển"
                allowClear
                style={{ width: 180 }}
                value={filterType}
                onChange={(val) => { setFilterType(val); setPage(1); }}
                options={BEACON_LIGHT_TYPE_OPTIONS}
              />
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 160 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={Object.entries(BEACON_STATUS_MAP).map(([value, { label }]) => ({ value, label }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchData} />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                Tạo đèn biển
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={8} type="table" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải danh sách đèn biển'}
            onRetry={fetchData}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={filterName || filterCode || filterType || filterStatus ? 'Không tìm thấy' : 'Chưa có đèn biển nào'}
            ctaText="Tạo đèn biển đầu tiên"
            onCta={openCreateModal}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<BeaconLight>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p: number, sz?: number) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t: number) => `Tổng ${t} đèn biển`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      <Modal
        title={editingRecord ? 'Chỉnh sửa đèn biển' : 'Thêm đèn biển mới'}
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
            label="Mã đèn biển"
            required
            disabled={!!editingRecord}
            placeholder="VD: LH-HAIPHONG-001"
            help="Mã định danh duy nhất cho đèn biển"
          />

          <FormField
            type="text"
            name="name"
            label="Tên đèn biển"
            required
            placeholder="VD: Đèn biển Hòn Dấu"
          />

          <FormField
            type="select"
            name="type"
            label="Loại đèn biển"
            required
            options={BEACON_LIGHT_TYPE_OPTIONS}
          />

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="number"
                name="longitude"
                label="Kinh độ (Longitude)"
                required
                min={-180}
                max={180}
                step={0.000001}
                placeholder="106.8"
                help="WGS84: -180 ~ 180"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="number"
                name="latitude"
                label="Vĩ độ (Latitude)"
                required
                min={-90}
                max={90}
                step={0.000001}
                placeholder="20.7"
                help="WGS84: -90 ~ 90"
              />
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="number"
                name="lightRange"
                label="Bán kính chiếu sáng (Hải lý)"
                required
                min={0.01}
                max={60}
                step={0.01}
                placeholder="VD: 15"
                help="Từ 0.01 đến 60 hải lý"
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="lightColor"
                label="Màu sắc ánh sáng"
                required
                placeholder="VD: Trắng, Đỏ chớp"
              />
            </Col>
          </Row>

          <FormField
            type="textarea"
            name="description"
            label="Mô tả"
            placeholder="Mô tả về đặc tính đèn biển..."
          />
        </Form>
      </Modal>
    </>
  );
}
