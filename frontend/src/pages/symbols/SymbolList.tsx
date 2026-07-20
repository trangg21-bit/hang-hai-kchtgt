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
  Modal,
  Form,
  Descriptions,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { symbolService } from '../../services/symbolService';
import type { Symbol, CreateSymbolPayload, UpdateSymbolPayload } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import DataTable from '../../components/DataTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import FormField from '../../components/FormField';
import toast from '../../components/ToastNotification';
import { colors } from '../../theme';
import { fontWeightBold, fontSizeLg } from '../../tokens';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Sử dụng' },
  inactive: { color: 'default', label: 'Không sử dụng' },
  deprecated: { color: 'red', label: 'Ngừng sử dụng' },
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Sử dụng' },
  { value: 'inactive', label: 'Không sử dụng' },
  { value: 'deprecated', label: 'Ngừng sử dụng' },
];

interface UploadImageInputProps {
  value?: string;
  onChange?: (value: string) => void;
}

const UploadImageInput: React.FC<UploadImageInputProps> = ({ value, onChange }) => {
  const handleUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange?.(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    return false; // prevent automatic upload
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 60,
          height: 60,
          border: '1px solid #d9d9d9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          overflow: 'hidden',
        }}
      >
        {value ? (
          <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ color: '#bfbfbf', fontSize: 12 }}>Trống</div>
        )}
      </div>
      <Upload
        accept="image/png, image/jpeg, image/jpg"
        beforeUpload={handleUpload}
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />}>Chọn hình ảnh</Button>
      </Upload>
    </div>
  );
};

export default function SymbolList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<Symbol[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<Symbol | null>(null);
  const [previewSymbol, setPreviewSymbol] = useState<Symbol | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchSymbols = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await symbolService.list({
        page,
        pageSize,
        search: search || undefined,
        status: filterStatus,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách biểu tượng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterStatus]);

  useEffect(() => { void fetchSymbols(); }, [fetchSymbols]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingSymbol(null);
    form.resetFields();
    setFormOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: Symbol) => {
    setEditingSymbol(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
      hinhAnh: record.hinhAnh,
      status: record.status,
    });
    setFormOpen(true);
  }, [form]);

  const openPreviewModal = useCallback((record: Symbol) => {
    setPreviewSymbol(record);
    setPreviewOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingSymbol) {
        const payload: UpdateSymbolPayload = {
          name: values.name,
          description: values.description,
          hinhAnh: values.hinhAnh,
          status: values.status,
        };
        await symbolService.update(editingSymbol.id, payload);
        toast.success('Đã cập nhật biểu tượng');
      } else {
        const payload: CreateSymbolPayload = {
          code: values.code,
          name: values.name,
          description: values.description,
          hinhAnh: values.hinhAnh,
        };
        await symbolService.create(payload);
        toast.success('Đã tạo biểu tượng');
      }
      setFormOpen(false);
      fetchSymbols();
    } catch {
      // validation or connection error
    } finally {
      setSubmitting(false);
    }
  }, [editingSymbol, form, fetchSymbols]);

  const handleDelete = useCallback(
    async (symbol: Symbol) => {
      Modal.confirm({
        title: 'Xác nhận xóa biểu tượng',
        icon: <ExclamationCircleOutlined />,
        content: `Bạn có chắc chắn muốn xóa biểu tượng "${symbol.name}" (${symbol.code})?`,
        okText: 'Xóa',
        okType: 'danger',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await symbolService.delete(symbol.id);
            toast.success('Đã xóa biểu tượng');
            fetchSymbols();
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
          }
        },
      });
    },
    [fetchSymbols],
  );

  const columns = [
    { title: '#', width: 60, render: (_, __, idx: number) => (page - 1) * pageSize + idx + 1 },
    {
      title: 'Mã ký hiệu',
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
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'hinhAnh',
      width: 120,
      align: 'center' as const,
      render: (src?: string) => (
        src ? (
          <img
            src={src}
            alt="Biểu tượng"
            style={{ maxHeight: 30, maxWidth: 60, objectFit: 'contain' }}
          />
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 160,
      render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Symbol) => (
        <Space size="small">
          <Tooltip title="Xem trước">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openPreviewModal(record)}
            />
          </Tooltip>
          {hasPerm('symbol.edit') && (
            <Tooltip title="Sửa">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              />
            </Tooltip>
          )}
          {hasPerm('symbol.delete') && (
            <Tooltip title="Xóa">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
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
                placeholder="Tìm theo tên, mã, mô tả..."
                allowClear
                style={{ width: 260 }}
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
              />
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 150 }}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={STATUS_OPTIONS}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Tooltip title="Tải lại">
                <Button icon={<ReloadOutlined />} onClick={fetchSymbols} />
              </Tooltip>
              {hasPerm('symbol.create') && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                  Thêm biểu tượng
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
            message={error?.message || 'Không thể tải danh sách biểu tượng'}
            onRetry={fetchSymbols}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState
            description={search ? 'Không tìm thấy biểu tượng' : 'Chưa có biểu tượng nào'}
          />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <DataTable<Symbol>
            columns={columns}
            dataSource={dataSource}
            rowKey="id"
            scroll={{ x: 1180 }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, sz) => {
                setPage(p);
                if (sz) setPageSize(sz);
              },
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} biểu tượng`,
              pageSizeOptions: ['10', '20', '50'],
            }}
          />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{editingSymbol ? 'Chỉnh sửa biểu tượng' : 'Thêm biểu tượng mới'}</span>}
        open={formOpen}
        onOk={handleSave}
        onCancel={() => setFormOpen(false)}
        confirmLoading={submitting}
        okText={editingSymbol ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        width={650}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'active' }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="text"
                name="code"
                label="Mã biểu tượng"
                required
                disabled={!!editingSymbol}
                placeholder="Mã biểu tượng"
                maxLength={10}
              />
            </Col>
            <Col span={12}>
              <FormField
                type="text"
                name="name"
                label="Tên biểu tượng"
                required
                placeholder="Tên biểu tượng"
                maxLength={255}
              />
            </Col>
          </Row>

          <Form.Item
            name="hinhAnh"
            label="Hình ảnh"
            required
            rules={[{ required: true, message: 'Hình ảnh không được để trống' }]}
            style={{ marginBottom: 20 }}
          >
            <UploadImageInput />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <FormField
                type="select"
                name="status"
                label="Trạng thái"
                required
                options={STATUS_OPTIONS}
              />
            </Col>
            <Col span={12}>
              <FormField
                type="textarea"
                name="description"
                label="Ghi chú"
                placeholder="Ghi chú"
                maxLength={500}
                rows={2}
              />
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xem trước chi tiết biểu tượng</span>}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewOpen(false)}>
            Đóng
          </Button>
        ]}
        width={650}
        destroyOnClose
      >
        {previewSymbol && (
          <div style={{ marginTop: 16 }}>
            {/* Visual Preview */}
            <Card style={{ textAlign: 'center', marginBottom: 16, backgroundColor: '#fafafa' }}>
              <Typography.Title level={4} style={{ margin: 0 }}>{previewSymbol.name}</Typography.Title>
              <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                <Tag color="cyan" style={{ fontSize: 16, padding: '4px 12px' }}>{previewSymbol.code}</Tag>
                {previewSymbol.hinhAnh && (
                  <div
                    style={{
                      height: 60,
                      margin: '12px auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={previewSymbol.hinhAnh}
                      alt="Preview"
                      style={{ maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </Space>
            </Card>

            {/* Details table */}
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã ký hiệu">{previewSymbol.code}</Descriptions.Item>
              <Descriptions.Item label="Tên">{previewSymbol.name}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={2}>
                {(() => {
                  const s = STATUS_MAP[previewSymbol.status] || { color: 'default', label: previewSymbol.status };
                  return <Tag color={s.color}>{s.label}</Tag>;
                })()}
              </Descriptions.Item>
              {previewSymbol.description && (
                <Descriptions.Item label="Ghi chú" span={2}>{previewSymbol.description}</Descriptions.Item>
              )}
              <Descriptions.Item label="Tạo bởi">{previewSymbol.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">{dayjs(previewSymbol.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc" span={2}>{dayjs(previewSymbol.updatedAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </>
  );
}
