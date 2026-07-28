import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button, Modal, Form, Input, Select, Upload, Row, Col, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { symbolService } from '../../services/symbolService';
import type { Symbol, CreateSymbolPayload, UpdateSymbolPayload } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterBar, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import {
  statusOperational, statusDraft, actionPrimary, textSecondary, textPrimary, textTertiary,
  fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  cardStyle, radiusPill, radiusSm, borderDefault, spaceFormField, spaceMd, spaceSm,
} from '../../tokens';
import { colors } from '../../theme';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: 'Sử dụng' },
  inactive: { color: 'default', label: 'Không sử dụng' },
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Sử dụng' },
  { value: 'inactive', label: 'Không sử dụng' },
];

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

interface UploadImageInputProps {
  value?: string;
  onChange?: (value: string) => void;
}

const UploadImageInput: React.FC<UploadImageInputProps> = ({ value, onChange }) => {
  const [error, setError] = useState<string | null>(null);

  const validateImage = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const allowedTypes = ['image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        resolve('Ảnh biểu tượng phải có định dạng PNG hoặc JPG');
        return;
      }
      if (file.size > 500 * 1024) {
        resolve('Ảnh biểu tượng không được vượt quá 500KB');
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.naturalWidth > 128 || img.naturalHeight > 128) {
          resolve('Ảnh biểu tượng không được vượt quá 128×128 pixels');
          return;
        }
        if (img.naturalWidth !== img.naturalHeight) {
          resolve('Ảnh biểu tượng phải có tỉ lệ 1:1 (hình vuông)');
          return;
        }
        resolve(null);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('Không thể đọc file ảnh');
      };
      img.src = url;
    });
  };

  const handleUpload = async (file: File) => {
    setError(null);
    const validationError = await validateImage(file);
    if (validationError) {
      setError(validationError);
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange?.(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 60,
            height: 60,
            border: `1px solid ${borderDefault}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.bodyBg,
            overflow: 'hidden',
            borderRadius: radiusSm,
          }}
        >
          {value ? (
            <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: textTertiary, fontSize: fontSizeMd }}>Trống</span>
          )}
        </div>
        <Upload
          accept="image/png, image/jpeg"
          beforeUpload={handleUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Chọn hình ảnh</Button>
        </Upload>
      </div>
      {error && (
        <div style={{ color: colors.error, fontSize: fontSizeMd, marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
};

export default function SymbolList() {
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

  const openCreateModal = useCallback(() => {
    setEditingSymbol(null);
    form.resetFields();
    setFormOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: Symbol) => {
    setEditingSymbol(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      image: record.image,
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
          image: values.image,
          status: values.status,
        };
        await symbolService.update(editingSymbol.id, payload);
        toast.success('Đã cập nhật biểu tượng');
      } else {
        const payload: CreateSymbolPayload = {
          name: values.name,
          description: values.description,
          image: values.image,
          status: values.status || 'ACTIVE',
        };
        await symbolService.create(payload);
        toast.success('Đã tạo biểu tượng');
      }
      setFormOpen(false);
      fetchSymbols();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingSymbol, form, fetchSymbols]);

  const handleDelete = useCallback((symbol: Symbol) => {
    Modal.confirm({
      title: 'Xác nhận xóa biểu tượng',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa biểu tượng "${symbol.name}"?`,
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
  }, [fetchSymbols]);

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

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const columns = useMemo(() => [
    {
      key: 'stt', label: 'STT', width: 60, type: 'mono' as const, align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span>
      ),
    },
    {
      key: 'name', label: 'Tên biểu tượng', dataIndex: 'name',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      key: 'image', label: 'Hình ảnh', dataIndex: 'image', width: 120, align: 'center' as const,
      render: (src?: string) =>
        src ? (
          <img src={src} alt="Biểu tượng" style={{ maxHeight: 30, maxWidth: 60, objectFit: 'contain' }} />
        ) : (
          <span style={{ color: textTertiary }}>—</span>
        ),
    },
    {
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 140,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status };
        const statusColor = s.color === 'green' ? statusOperational : textTertiary;
        return (
          <span style={{
            display: 'inline-flex', padding: '2px 8px', borderRadius: radiusPill,
            fontSize: fontSizeMd, fontWeight: fontWeightMedium,
            background: `${statusColor}15`, color: statusColor,
          }}>
            {s.label}
          </span>
        );
      },
    },
    {
      key: 'actions', label: 'Thao tác', width: 180, align: 'center' as const,
      render: (_: unknown, record: Symbol) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Tooltip title="Xem chi tiết">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openPreviewModal(record)} />
          </Tooltip>
          {hasPerm('symbol.edit') && (
            <Tooltip title="Sửa">
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            </Tooltip>
          )}
          {hasPerm('symbol.delete') && (
            <Tooltip title="Xóa">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
            </Tooltip>
          )}
        </div>
      ),
    },
  ], [page, pageSize, hasPerm, openEditModal, openPreviewModal, handleDelete]);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('symbol.create')) {
      actions.push({
        key: 'create', label: 'Thêm mới', variant: 'primary' as const,
        icon: <PlusOutlined />, onClick: openCreateModal,
      });
    }
    return actions;
  }, [hasPerm, openCreateModal]);

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo tên biểu tượng...' },
    { key: 'status', type: 'select' as const, label: 'Trạng thái', placeholder: 'Chọn trạng thái', options: STATUS_OPTIONS },
  ], []);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError)
      return <ErrorState message={error?.message || 'Không thể tải danh sách biểu tượng'} onRetry={fetchSymbols} />;
    if (dataSource.length === 0) {
      if (search || filterStatus) return <EmptyState description="Không tìm thấy biểu tượng" />;
      return <EmptyState description="Chưa có biểu tượng nào" />;
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable columns={columns} dataSource={dataSource} rowKey="id" scroll={{ x: 800 }} />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} />
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý biểu tượng trên bản đồ' }]}
        actions={headerActions}
      />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, padding: '8px 16px' }}>{renderContent()}</div>

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
          {editingSymbol ? 'Cập nhật thông tin biểu tượng trên bản đồ' : 'Thêm mới thông tin biểu tượng trên bản đồ'}
        </span>}
        open={formOpen} onOk={handleSave} onCancel={() => setFormOpen(false)}
        confirmLoading={submitting} width={600} destroyOnClose
        footer={[
          <Button key="cancel" onClick={() => setFormOpen(false)}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="ok" type="primary" onClick={handleSave} loading={submitting}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>
            {editingSymbol ? 'Cập nhật' : 'Thêm mới'}</Button>,
        ]}>
        <Form form={form} layout="vertical" initialValues={{ status: 'active' }} style={{ marginTop: 16 }}
          labelCol={{ style: { padding: 0, marginBottom: 4 } }}>
          <Form.Item name="name" {...labelProps('Tên biểu tượng')} style={{ marginBottom: spaceFormField }}
            rules={[{ required: true, message: 'Vui lòng nhập tên biểu tượng' }, { max: 255, message: 'Tối đa 255 ký tự' }]}>
            <Input placeholder="Tên biểu tượng" style={{ borderRadius: radiusPill, height: 40 }} />
          </Form.Item>
          <Form.Item name="image" {...labelProps('Hình ảnh')} style={{ marginBottom: spaceFormField }}
            rules={[{ required: true, message: 'Hình ảnh không được để trống' }]}>
            <UploadImageInput />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" {...labelProps('Trạng thái')} style={{ marginBottom: spaceFormField }}>
                <Select options={STATUS_OPTIONS} style={{ borderRadius: radiusPill, height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="description" {...labelProps('Ghi chú')} style={{ marginBottom: spaceFormField }}
                rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}>
                <Input.TextArea placeholder="Ghi chú" rows={2} maxLength={500} style={{ borderRadius: radiusSm }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Chi tiết biểu tượng trên bản đồ</span>}
        open={previewOpen} onCancel={() => setPreviewOpen(false)} width={600} destroyOnClose
        footer={[
          <Button key="close" type="primary" onClick={() => setPreviewOpen(false)}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Đóng</Button>,
        ]}>
        {previewSymbol && (
          <div style={{ marginTop: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: spaceMd, ...cardStyle }}>
              {previewSymbol.image && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spaceMd }}>
                  <img src={previewSymbol.image} alt={previewSymbol.name} style={{ maxHeight: 128, objectFit: 'contain' }} />
                </div>
              )}
              <Typography.Title level={4} style={{ margin: 0 }}>{previewSymbol.name}</Typography.Title>
              <div style={{ marginTop: 8 }}>
                {(() => {
                  const s = STATUS_MAP[previewSymbol.status] || { color: 'default', label: previewSymbol.status };
                  const statusColor = s.color === 'green' ? statusOperational : textTertiary;
                  return (
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${statusColor}15`, color: statusColor }}>
                      {s.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            {previewSymbol.description && (
              <div style={{ marginBottom: spaceMd }}>
                <Typography.Text strong style={{ fontSize: fontSizeMd, color: textSecondary }}>Ghi chú:</Typography.Text>
                <Typography.Paragraph style={{ margin: '4px 0 0' }}>{previewSymbol.description}</Typography.Paragraph>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spaceSm, fontSize: fontSizeMd }}>
              <div><span style={{ color: textSecondary }}>Tạo bởi: </span><span>{previewSymbol.createdBy}</span></div>
              <div><span style={{ color: textSecondary }}>Tạo lúc: </span><span>{previewSymbol.createdAt ? dayjs(previewSymbol.createdAt).format('DD/MM/YYYY HH:mm') : '—'}</span></div>
              <div><span style={{ color: textSecondary }}>Cập nhật lúc: </span><span>{previewSymbol.updatedAt ? dayjs(previewSymbol.updatedAt).format('DD/MM/YYYY HH:mm') : '—'}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
