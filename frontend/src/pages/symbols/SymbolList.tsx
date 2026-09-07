import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { symbolService } from '../../services/symbolService';
import type { Symbol, CreateSymbolPayload, UpdateSymbolPayload } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterTableLayout, DataTable, type ScreenHeaderAction } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import { AppDrawer } from '../../components/shared/AppDrawer';
import {
  actionPrimary,
  statusOperational,
  statusDraft,
  statusCritical,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeSm,
  fontSizeMd,
  fontWeightMedium,
  fontWeightBold,
  radiusMd,
  radiusPill,
  radiusTextArea,
  borderDefault,
  surfacePage,
  surfaceCard,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceLg,
  spaceFormField,
  badgeBaseStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  drawerTitleStyle,
  drawerFooterStyle,
  requiredMarkStyle,
  uploadAreaStyle,
  icons,
  colors,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  active: { color: statusOperational, label: 'Sử dụng' },
  ACTIVE: { color: statusOperational, label: 'Sử dụng' },
  inactive: { color: statusDraft, label: 'Không sử dụng' },
  INACTIVE: { color: statusDraft, label: 'Không sử dụng' },
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Sử dụng' },
  { value: 'inactive', label: 'Không sử dụng' },
];

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
        <div style={uploadAreaStyle}>
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>
            Chưa có hình ảnh.
          </span>
          <Upload accept="image/png, image/jpeg" beforeUpload={handleUpload} showUploadList={false}>
            <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>
              Chọn hình ảnh
            </Button>
          </Upload>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              width: 96,
              height: 96,
              background: surfacePage,
              border: `1px solid ${borderDefault}`,
              borderRadius: radiusMd,
              padding: spaceXs,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: spaceSm,
            }}
          >
            <img src={value} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <Upload accept="image/png, image/jpeg" beforeUpload={handleUpload} showUploadList={false}>
              <Button type="dashed" icon={<UploadOutlined />} style={{ borderRadius: radiusPill }}>
                Đổi hình ảnh
              </Button>
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
  const [filterCode, setFilterCode] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');

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

  const [deleteTarget, setDeleteTarget] = useState<Symbol | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [tabCounts, setTabCounts] = useState<{ all: number; active: number; inactive: number }>({
    all: 0,
    active: 0,
    inactive: 0,
  });

  const fetchSymbols = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await symbolService.list({
        page,
        pageSize,
        search: search || undefined,
        code: filterCode || undefined,
        status: filterStatus,
      });
      setDataSource(res.data || []);
      setTotal(res.total || 0);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách biểu tượng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterCode, filterStatus]);

  // Fetch counts for status tabs
  const fetchCounts = useCallback(async () => {
    try {
      const [resAll, resActive, resInactive] = await Promise.all([
        symbolService.list({ page: 1, pageSize: 1 }),
        symbolService.list({ page: 1, pageSize: 1, status: 'ACTIVE' }),
        symbolService.list({ page: 1, pageSize: 1, status: 'INACTIVE' }),
      ]);
      setTabCounts({
        all: resAll.total,
        active: resActive.total,
        inactive: resInactive.total,
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchSymbols();
    });
  }, [fetchSymbols]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCounts();
    });
  }, [fetchCounts]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchSymbols();
  }, [fetchSymbols]);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterCode('');
    setFilterStatus(undefined);
    setActiveStatusTab('all');
    setPage(1);
  }, []);

  const handleStatusTabChange = useCallback((key: string) => {
    setActiveStatusTab(key);
    if (key === 'all') {
      setFilterStatus(undefined);
    } else {
      setFilterStatus(key);
    }
    setPage(1);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingSymbol(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setFormOpen(true);
  }, [form]);

  const openEditModal = useCallback((record: Symbol) => {
    setEditingSymbol(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      image: record.image,
      status: record.status || 'active',
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
          code: values.code,
          description: values.description,
          image: values.image,
          status: values.status,
        };
        await symbolService.update(editingSymbol.id, payload);
        toast.success('Đã cập nhật biểu tượng');
      } else {
        const payload: CreateSymbolPayload = {
          name: values.name,
          code: values.code,
          description: values.description,
          image: values.image,
          status: values.status || 'active',
        };
        await symbolService.create(payload);
        toast.success('Đã tạo biểu tượng mới');
      }
      setFormOpen(false);
      void fetchSymbols();
      void fetchCounts();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingSymbol, form, fetchSymbols, fetchCounts]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await symbolService.delete(deleteTarget.id);
      toast.success('Đã xóa biểu tượng');
      setDeleteTarget(null);
      void fetchSymbols();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchSymbols, fetchCounts]);

  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      fixed: 'left' as const,
      type: 'mono' as const,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{(page - 1) * pageSize + idx + 1}</span>
      ),
    },
    {
      key: 'name',
      label: 'Tên biểu tượng',
      dataIndex: 'name',
      width: 240,
      fixed: 'left' as const,
      ellipsis: false,
      render: (name: string, record: Symbol) => (
        <div style={{ lineHeight: '1.4' }}>
          <div
            onClick={() => openPreviewModal(record)}
            style={{
              fontWeight: fontWeightBold,
              fontSize: fontSizeMd,
              color: colors.sidebarBg,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={name}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: fontSizeMd,
              fontWeight: fontWeightMedium,
              color: textSecondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={record.code}
          >
            {record.code || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'image',
      label: 'Hình ảnh',
      dataIndex: 'image',
      width: 120,
      align: 'center' as const,
      render: (src?: string) =>
        src ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              background: surfacePage,
              border: `1px solid ${borderDefault}`,
              borderRadius: radiusMd,
              padding: 2,
            }}
          >
            <img src={src} alt="Biểu tượng" style={{ maxHeight: 26, maxWidth: 30, objectFit: 'contain' }} />
          </div>
        ) : (
          <span style={{ color: textTertiary }}>—</span>
        ),
    },
    {
      key: 'updatedBy',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedBy',
      width: 200,
      ellipsis: false,
      render: (v: string | null, record: Symbol) => {
        const name = v || record.updatedByName || record.createdByName || record.createdBy || 'SYSTEM';
        const date = record.updatedAt || record.createdAt;
        return (
          <div style={{ lineHeight: '1.35' }}>
            <div
              style={{
                fontWeight: fontWeightBold,
                color: '#0F172A',
                fontSize: fontSizeMd,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={name}
            >
              {name}
            </div>
            <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
              {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 160,
      align: 'center' as const,
      ellipsis: false,
      render: (status: string) => {
        const s = STATUS_MAP[status] || { color: statusDraft, label: status || '—' };
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radiusPill,
              padding: '2px 10px',
              fontSize: fontSizeMd,
              fontWeight: fontWeightMedium,
              background: `${s.color}15`,
              border: `1px solid ${s.color}40`,
              color: s.color,
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </span>
        );
      },
    },
  ], [page, pageSize, openPreviewModal]);

  const rowActions = useCallback((record: Symbol) => {
    const actions = [
      { key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openPreviewModal(record) },
    ];
    if (hasPerm('symbol.edit')) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => openEditModal(record) });
    }
    if (hasPerm('symbol.delete')) {
      actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => setDeleteTarget(record) });
    }
    return actions;
  }, [hasPerm, openPreviewModal, openEditModal]);

  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('symbol.create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary',
        icon: <PlusOutlined />,
        onClick: openCreateModal,
      });
    }
    return actions;
  }, [hasPerm, openCreateModal]);

  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Mã biểu tượng
        </div>
        <Input
          placeholder="Tìm theo mã biểu tượng..."
          allowClear
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Tên biểu tượng
        </div>
        <Input
          placeholder="Tìm theo tên biểu tượng..."
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Trạng thái
        </div>
        <Select
          placeholder="Tất cả trạng thái"
          allowClear
          value={filterStatus}
          onChange={(val) => setFilterStatus(val || undefined)}
          options={STATUS_OPTIONS}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>
    </>
  );

  const statusTabs = [
    { key: 'all', label: 'Tất cả', count: tabCounts.all, color: actionPrimary, active: activeStatusTab === 'all' },
    { key: 'active', label: 'Sử dụng', count: tabCounts.active, color: statusOperational, active: activeStatusTab === 'active' },
    { key: 'inactive', label: 'Không sử dụng', count: tabCounts.inactive, color: statusDraft, active: activeStatusTab === 'inactive' },
  ];

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} type="table" />;
    if (isError) {
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách biểu tượng'}
          onRetry={fetchSymbols}
        />
      );
    }
    if (dataSource.length === 0) {
      return (
        <EmptyState
          description={search || filterCode || filterStatus ? 'Không tìm thấy biểu tượng' : 'Chưa có biểu tượng nào'}
        />
      );
    }
    return (
      <>
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 'max-content' }}
        />
        <Pagination
          total={total}
          current={page}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          onChange={(p, sz) => {
            setPage(p);
            if (sz) setPageSize(sz);
          }}
        />
      </>
    );
  };

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
        <ScreenHeader
          breadcrumb={[
            { label: 'Quản lý KCHT trên nền bản đồ (GIS)' },
            { label: 'Quản lý biểu tượng trên bản đồ' },
          ]}
          actions={headerActions}
        />
        <FilterTableLayout
          hideFilterToggle
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          loading={isLoading}
          error={isError}
          onRetry={fetchSymbols}
          filterContent={filterContent}
          statusTabs={statusTabs}
          onStatusTabChange={handleStatusTabChange}
        >
          {renderContent()}
        </FilterTableLayout>

        {/* ── Create / Edit AppDrawer ──────────────────────────────── */}
        <AppDrawer
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              {editingSymbol ? 'Cập nhật thông tin biểu tượng trên bản đồ' : 'Thêm mới thông tin biểu tượng trên bản đồ'}
            </span>
          }
          open={formOpen}
          onClose={() => setFormOpen(false)}
          drawerSize="md"
          footer={
            <div style={drawerFooterStyle}>
              <Button onClick={() => setFormOpen(false)} style={outlineButtonStyle}>
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                loading={submitting}
                style={primaryButtonStyle}
              >
                {editingSymbol ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '20px 24px' },
          }}
        >
          <style>{requiredMarkStyle}</style>
          <Form form={form} layout="vertical" initialValues={{ status: 'active' }}>
            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Mã biểu tượng</span>}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input
                    placeholder="VD: SYM-001"
                    style={{ borderRadius: radiusPill, height: 40 }}
                    disabled={!!editingSymbol}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Tên biểu tượng</span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên biểu tượng' },
                    { max: 255, message: 'Tối đa 255 ký tự' },
                  ]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input placeholder="Nhập tên biểu tượng" style={{ borderRadius: radiusPill, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="status"
              label={<span style={{ fontWeight: fontWeightMedium }}>Trạng thái</span>}
              style={{ marginBottom: spaceFormField }}
            >
              <Select options={STATUS_OPTIONS} style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
            </Form.Item>

            <Form.Item
              name="description"
              label={<span style={{ fontWeight: fontWeightMedium }}>Ghi chú</span>}
              rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}
              style={{ marginBottom: spaceFormField }}
            >
              <Input.TextArea
                placeholder="Nhập ghi chú"
                rows={2}
                maxLength={500}
                style={{ borderRadius: radiusTextArea }}
              />
            </Form.Item>

            <Form.Item
              name="image"
              label={<span style={{ fontWeight: fontWeightMedium }}>Hình ảnh</span>}
              rules={[{ required: true, message: 'Hình ảnh không được để trống' }]}
              style={{ marginBottom: spaceFormField }}
            >
              <UploadImageInput />
            </Form.Item>
          </Form>
        </AppDrawer>

        {/* ── View Detail AppDrawer ────────────────────────────────── */}
        <AppDrawer
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Chi tiết biểu tượng trên bản đồ{previewSymbol ? ` - ${previewSymbol.name}` : ''}
            </span>
          }
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          drawerSize="md"
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '20px 24px' },
          }}
        >
          {previewSymbol && (() => {
            const s = STATUS_MAP[previewSymbol.status] || { color: textTertiary, label: previewSymbol.status || '—' };
            return (
              <div>
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
                      <img
                        src={previewSymbol.image}
                        alt={previewSymbol.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ color: textTertiary, fontSize: fontSizeMd }}>Trống</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spaceMd }}>
                  <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Mã biểu tượng</div>
                    <div style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                      {previewSymbol.code || '—'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Trạng thái</div>
                    <div>
                      <span
                        style={{
                          ...badgeBaseStyle,
                          borderRadius: radiusPill,
                          padding: '2px 10px',
                          fontSize: fontSizeMd,
                          fontWeight: fontWeightMedium,
                          background: `${s.color}15`,
                          border: `1px solid ${s.color}40`,
                          color: s.color,
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Tên biểu tượng</div>
                    <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                      {previewSymbol.name}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Người tạo</div>
                    <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                      {previewSymbol.createdByName || previewSymbol.createdBy || 'SYSTEM'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Ngày tạo</div>
                    <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                      {previewSymbol.createdAt ? dayjs(previewSymbol.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Người cập nhật</div>
                    <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                      {previewSymbol.updatedByName || previewSymbol.updatedBy || 'SYSTEM'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Ngày cập nhật</div>
                    <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                      {previewSymbol.updatedAt ? dayjs(previewSymbol.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Ghi chú</div>
                    <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                      {previewSymbol.description || '—'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </AppDrawer>

        {/* ── Delete Confirmation Modal ────────────────────────────── */}
        <Modal
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Xác nhận xóa biểu tượng
            </span>
          }
          open={!!deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          footer={[
            <Button key="cancel" onClick={() => setDeleteTarget(null)} style={outlineButtonStyle}>
              Hủy
            </Button>,
            <Button
              key="delete"
              type="primary"
              danger
              loading={deleting}
              onClick={handleDeleteConfirm}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
            >
              Xác nhận xóa
            </Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <Alert
              message="Hành động này không thể hoàn tác"
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              style={{ marginBottom: spaceFormField, borderRadius: radiusPill }}
            />
            <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
              Bạn có chắc chắn muốn xóa biểu tượng{' '}
              <strong style={{ color: colors.sidebarBg }}>"{deleteTarget?.name}"</strong>?
            </p>
          </div>
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
}
