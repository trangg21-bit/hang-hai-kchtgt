import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { Button, Modal, Form, Input, Select, Upload, Row, Col, Typography, Alert, Drawer, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { symbolService } from '../../services/symbolService';
import type { Symbol, CreateSymbolPayload, UpdateSymbolPayload } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterTableLayout, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast, { modal } from '../../components/ToastNotification';
import {
  statusOperational, statusDraft, statusCritical, textSecondary, textPrimary, textTertiary,
  fontSizeMd, fontWeightBold,
  radiusSm, radiusMd, radiusPill, borderDefault, surfaceCard, surfacePage, spaceMd, spaceSm, spaceXs, spaceLg, spaceFormField,
  badgeBaseStyle, primaryButtonStyle, outlineButtonStyle, formFieldStyle, inputStyle, selectStyle, formRowGutter,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  requiredMarkStyle,
} from '../../tokens';
import { colors } from '../../theme';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: statusOperational, label: 'Sử dụng' },
  inactive: { color: statusDraft, label: 'Không sử dụng' },
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
      {!value ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có hình ảnh.</span>
          <Upload accept="image/png, image/jpeg" beforeUpload={handleUpload} showUploadList={false}>
            <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Chọn hình ảnh</Button>
          </Upload>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', width: 96, height: 96, background: surfacePage, border: `1px solid ${borderDefault}`, borderRadius: radiusMd, padding: spaceXs, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: spaceSm }}>
            <img src={value} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <Upload accept="image/png, image/jpeg" beforeUpload={handleUpload} showUploadList={false}>
              <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>Đổi hình ảnh</Button>
            </Upload>
          </div>
        </div>
      )}
      {error && (
        <div style={{ color: statusCritical, fontSize: fontSizeMd, marginTop: spaceXs }}>{error}</div>
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
  const [systemOpen, setSystemOpen] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<Symbol | null>(null);
  const [previewSymbol, setPreviewSymbol] = useState<Symbol | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Symbol | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
    setDeleteTarget(symbol);
    setDeleteConfirmText('');
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const expected = (deleteTarget.name || '').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expected && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên biểu tượng hoặc gõ "XÓA" để xác nhận');
      return;
    }
    try {
      await symbolService.delete(deleteTarget.id);
      toast.success('Đã xóa biểu tượng');
      setDeleteTarget(null);
      setDeleteConfirmText('');
      fetchSymbols();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  }, [deleteTarget, deleteConfirmText, fetchSymbols]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchSymbols();
  }, [fetchSymbols]);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterStatus(undefined);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const rowActions = useCallback((record: Symbol) => {
    const actions = [
      { key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => openPreviewModal(record) },
    ];
    if (hasPerm('symbol.edit')) actions.push({ key: 'edit', label: 'Sửa', icon: <EditOutlined />, onClick: () => openEditModal(record) });
    if (hasPerm('symbol.delete')) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record) });
    return actions;
  }, [hasPerm, openPreviewModal, openEditModal, handleDelete]);

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
      key: 'status', label: 'Trạng thái', dataIndex: 'status', width: 180,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: textTertiary, label: status };
        return (
          <span style={{ ...badgeBaseStyle, fontSize: fontSizeMd, background: surfacePage, color: s.color }}>
            {s.label}
          </span>
        );
      },
    },
  ], [page, pageSize]);

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

  const filterContent = (
    <>
      <div style={{ marginBottom: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Tên biểu tượng
        </div>
        <Input
          placeholder="Tìm theo tên biểu tượng..."
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40 }}
        />
      </div>
      <div style={{ marginBottom: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Trạng thái
        </div>
        <Select
          placeholder="Chọn trạng thái"
          allowClear
          value={filterStatus || undefined}
          onChange={(val) => setFilterStatus(val || undefined)}
          options={STATUS_OPTIONS}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>
    </>
  );

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError)
      return <ErrorState message={error?.message || 'Không thể tải danh sách biểu tượng'} onRetry={fetchSymbols} />;
    if (dataSource.length === 0) {
      if (search || filterStatus) return <EmptyState description="Không tìm thấy biểu tượng" />;
      return <EmptyState description="Chưa có biểu tượng nào" />;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} fill scroll={{ x: 800, y: 550 }} />
        <div style={{ paddingBottom: 6 /* căn mép dưới bảng thẳng hàng mép trên khối nút filter */ }}>
          <Pagination total={total} current={page} pageSize={pageSize} onChange={handlePageChange} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'Quản trị hệ thống' }, { label: 'Quản lý biểu tượng trên bản đồ' }]}
        actions={headerActions}
      />
      <FilterTableLayout
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        loading={isLoading}
        error={isError}
        onRetry={fetchSymbols}
        filterContent={filterContent}
        hideFilterToggle
        hideStatusTabs
      >
        {renderContent()}
      </FilterTableLayout>

      <Drawer
        {...drawerProps}
        title={
          <span style={drawerTitleStyle}>
            {editingSymbol ? 'Cập nhật thông tin biểu tượng trên bản đồ' : 'Thêm mới thông tin biểu tượng trên bản đồ'}
          </span>
        }
        open={formOpen}
        onClose={() => setFormOpen(false)}
        extra={<Button type="text" onClick={() => setFormOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => setFormOpen(false)} style={outlineButtonStyle}>Hủy</Button>
            <Button type="primary" onClick={handleSave} loading={submitting} style={primaryButtonStyle}>
              {editingSymbol ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        }
      >
        <style>{requiredMarkStyle}</style>
        <Form form={form} layout="vertical" initialValues={{ status: 'active' }} style={{ paddingTop: 16 }}
          labelCol={{ style: { padding: 0, marginBottom: spaceXs } }}>
          <Row gutter={formRowGutter}>
            <Col span={12}>
              <Form.Item name="name" {...labelProps('Tên biểu tượng')} style={formFieldStyle}
                rules={[{ required: true, message: 'Vui lòng nhập tên biểu tượng' }, { max: 255, message: 'Tối đa 255 ký tự' }]}>
                <Input placeholder="Tên biểu tượng" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" {...labelProps('Trạng thái')} style={formFieldStyle}>
                <Select options={STATUS_OPTIONS} style={selectStyle} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" {...labelProps('Ghi chú')} style={formFieldStyle}
            rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}>
            <Input.TextArea placeholder="Ghi chú" rows={2} maxLength={500} style={{ borderRadius: radiusSm }} />
          </Form.Item>
          <Form.Item name="image" {...labelProps('Hình ảnh')} style={formFieldStyle}
            rules={[{ required: true, message: 'Hình ảnh không được để trống' }]}>
            <UploadImageInput />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        {...drawerProps}
        size={1000}
        title={<span style={drawerTitleStyle}>Chi tiết biểu tượng trên bản đồ{previewSymbol ? ' - ' + previewSymbol.name : ''}</span>}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        extra={<Button type="text" onClick={() => setPreviewOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {previewSymbol && (() => {
          const s = STATUS_MAP[previewSymbol.status] || { color: textTertiary, label: previewSymbol.status };
          return (
            <Tabs
              defaultActiveKey="general"
              tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
              items={[
                {
                  key: 'general', label: 'Thông tin chung',
                  children: (
                    <div style={{ paddingTop: 3 }}>
                      <style>{`.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; } .detail-row { display: flex; padding: 10px 12px; border-bottom: 1px solid ${borderDefault}; } .detail-row--full { grid-column: 1 / -1; } .detail-label { width: 200px; flex-shrink: 0; color: ${colors.sidebarBg}; font-weight: ${fontWeightBold}; font-size: ${fontSizeMd}px; } .detail-label::after { content: ':'; margin-left: 2px; } .detail-value { color: ${textPrimary}; font-size: ${fontSizeMd}px; flex: 1; } .ant-tabs-nav{margin-bottom:0!important;padding-left:12px!important}`}</style>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spaceLg }}>
                        <div
                          style={{
                            width: 96,
                            height: 96,
                            background: surfacePage,
                            border: `1px solid ${borderDefault}`,
                            borderRadius: radiusMd,
                            padding: spaceXs,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {previewSymbol.image ? (
                            <img src={previewSymbol.image} alt={previewSymbol.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ color: textTertiary, fontSize: fontSizeMd }}>Trống</span>
                          )}
                        </div>
                      </div>
                      <div className="detail-grid">
                        {[
                          ['Tên biểu tượng', previewSymbol.name],
                          ['Trạng thái', (
                            <span style={{ ...badgeBaseStyle, fontSize: fontSizeMd, background: surfacePage, color: s.color }}>
                              {s.label}
                            </span>
                          )],
                        ].map(([label, value], i) => (
                          <div key={i} className="detail-row">
                            <span className="detail-label">{label}</span>
                            <span className="detail-value">{value}</span>
                          </div>
                        ))}
                        <div className="detail-row detail-row--full">
                          <span className="detail-label">Ghi chú</span>
                          <span className="detail-value">{previewSymbol.description || '—'}</span>
                        </div>
                      </div>
                      <div style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12 }} onClick={() => setSystemOpen(!systemOpen)}>
                        <span style={{ color: systemOpen ? '#1677ff' : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{systemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
                      </div>
                      {systemOpen && (
                        <div className="detail-grid" style={{ marginTop: 4 }}>
                          {[
                            ['Người tạo', previewSymbol.createdByName || previewSymbol.createdBy || '—'],
                            ['Ngày tạo', previewSymbol.createdAt ? new Date(previewSymbol.createdAt).toLocaleString('vi-VN') : '—'],
                            ['Người cập nhật', previewSymbol.updatedByName || previewSymbol.updatedBy || '—'],
                            ['Ngày cập nhật', previewSymbol.updatedAt ? new Date(previewSymbol.updatedAt).toLocaleString('vi-VN') : '—'],
                          ].map(([label, value], i) => (
                            <div key={i} className="detail-row">
                              <span className="detail-label">{label}</span>
                              <span className="detail-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          );
        })()}
      </Drawer>

      <Modal
        title={<span style={drawerTitleStyle}>Xác nhận xóa biểu tượng</span>}
        open={!!deleteTarget}
        onCancel={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }} style={outlineButtonStyle}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={handleDeleteConfirm}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          <Alert message="Hành động này không thể hoàn tác" type="warning" showIcon icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên biểu tượng</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deleteTarget && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Biểu tượng: <strong style={{ color: textPrimary }}>{deleteTarget.name}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên biểu tượng hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={handleDeleteConfirm}
            style={{ borderRadius: radiusPill, height: 40 }} autoFocus />
        </div>
      </Modal>
    </div>
  );
}
