import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
  Row,
  Col,
  Modal,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { spatialObjectCategoryService } from '../../services/spatialObjectCategoryService';
import type { SpatialObjectCategory } from '../../services/spatialObjectCategoryService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as MapSymbolItem } from '../../services/symbolService';
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
  statusCritical,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  radiusPill,
  radiusMd,
  fontSizeSm,
  fontSizeMd,
  fontWeightMedium,
  fontWeightBold,
  spaceFormField,
  spaceSm,
  spaceMd,
  spaceLg,
  drawerTitleStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  surfaceCard,
  surfacePage,
  badgeBaseStyle,
  icons,
  colors,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

const STATUS_OPTIONS = [
  { value: 1, label: 'Sử dụng' },
  { value: 0, label: 'Khóa' },
];

export default function PointObjectList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [keyword, setKeyword] = useState('');
  const [filterIconId, setFilterIconId] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');
  const [tabCounts, setTabCounts] = useState<{ all: number; active: number; locked: number }>({ all: 0, active: 0, locked: 0 });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [dataSource, setDataSource] = useState<SpatialObjectCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [symbols, setSymbols] = useState<MapSymbolItem[]>([]);
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SpatialObjectCategory | null>(null);
  const [detailRecord, setDetailRecord] = useState<SpatialObjectCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<SpatialObjectCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load Map Symbols for select dropdown
  useEffect(() => {
    symbolService.list({ pageSize: 100 }).then((res) => setSymbols(res.data)).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await spatialObjectCategoryService.list({
        page,
        pageSize,
        search: keyword || undefined,
        status: filterStatus,
        geometryType: 1, // Point
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements || 0);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách danh mục đối tượng điểm'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, keyword, filterStatus]);

  // Fetch counts for status tabs
  const fetchCounts = useCallback(async () => {
    try {
      const [resAll, resActive, resLocked] = await Promise.all([
        spatialObjectCategoryService.list({ page: 1, pageSize: 1, geometryType: 1 }),
        spatialObjectCategoryService.list({ page: 1, pageSize: 1, geometryType: 1, status: 1 }),
        spatialObjectCategoryService.list({ page: 1, pageSize: 1, geometryType: 1, status: 0 }),
      ]);
      const activeCount = resActive?.totalElements || 0;
      const lockedCount = resLocked?.totalElements || 0;
      const allCount = resAll?.totalElements || (activeCount + lockedCount);
      setTabCounts({
        all: allCount,
        active: activeCount,
        locked: lockedCount,
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCounts();
    });
  }, [fetchCounts]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchData();
  }, [fetchData]);

  const handleFilterReset = useCallback(() => {
    setKeyword('');
    setFilterIconId(undefined);
    setFilterStatus(undefined);
    setActiveStatusTab('all');
    setPage(1);
  }, []);

  const handleStatusTabChange = useCallback((key: string) => {
    setActiveStatusTab(key);
    if (key === 'all') {
      setFilterStatus(undefined);
    } else if (key === 'active') {
      setFilterStatus(1);
    } else if (key === 'locked') {
      setFilterStatus(0);
    }
    setPage(1);
  }, []);

  const openCreateDrawer = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setDrawerOpen(true);
  }, [form]);

  const openEditDrawer = useCallback((record: SpatialObjectCategory) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      iconId: record.iconId,
      status: record.status ?? 1,
    });
    setDrawerOpen(true);
  }, [form]);

  const openDetailDrawer = useCallback((record: SpatialObjectCategory) => {
    setDetailRecord(record);
    setDetailDrawerOpen(true);
  }, []);

  const handleFormSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingRecord) {
        await spatialObjectCategoryService.update(editingRecord.id, {
          code: values.code,
          name: values.name,
          geometryType: 1,
          iconId: values.iconId,
          status: values.status,
        });
        toast.success('Đã cập nhật danh mục đối tượng điểm');
      } else {
        await spatialObjectCategoryService.create({
          code: values.code,
          name: values.name,
          geometryType: 1,
          iconId: values.iconId,
          status: values.status,
        });
        toast.success('Đã tạo danh mục đối tượng điểm mới');
      }

      setDrawerOpen(false);
      void fetchData();
      void fetchCounts();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, form, fetchData, fetchCounts]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await spatialObjectCategoryService.delete(deleteTarget.id);
      toast.success('Đã xóa danh mục đối tượng điểm');
      setDeleteTarget(null);
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchData, fetchCounts]);

  // ── DataTable Columns ─────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      type: 'mono' as const,
      render: (_: unknown, __: SpatialObjectCategory, idx: number) => (
        <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{(page - 1) * pageSize + idx + 1}</span>
      ),
    },
    {
      key: 'name',
      label: 'Tên đối tượng điểm',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      ellipsis: false,
      render: (name: string, record: SpatialObjectCategory) => (
        <div style={{ lineHeight: '1.4' }}>
          <div
            onClick={() => openDetailDrawer(record)}
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
      key: 'icon',
      label: 'Biểu tượng',
      dataIndex: 'iconId',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: SpatialObjectCategory) => {
        const sym = symbols.find((s) => s.id === record.iconId);
        const imgSrc = record.iconUrl || sym?.image;
        return imgSrc ? (
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
            <img src={imgSrc} alt={record.name} style={{ maxHeight: 26, maxWidth: 30, objectFit: 'contain' }} />
          </div>
        ) : (
          <span style={{ color: textTertiary }}>—</span>
        );
      },
    },
    {
      key: 'updatedBy',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedBy',
      width: 200,
      ellipsis: false,
      render: (v: string | null, record: SpatialObjectCategory) => {
        const name = v || record.createdBy || 'SYSTEM';
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
      render: (status: number) => {
        const isOperational = status === 1;
        const color = isOperational ? statusOperational : statusCritical;
        const label = isOperational ? 'Sử dụng' : 'Khóa';
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
              background: `${color}15`,
              border: `1px solid ${color}40`,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        );
      },
    },
  ], [page, pageSize, symbols, openDetailDrawer]);

  // ── Row Actions ──────────────────────────────────────────────────
  const rowActions = useCallback((record: SpatialObjectCategory) => [
    {
      key: 'view',
      label: 'Xem chi tiết',
      icon: icons.view,
      onClick: () => openDetailDrawer(record),
    },
    {
      key: 'edit',
      label: 'Chỉnh sửa',
      icon: icons.edit,
      onClick: () => openEditDrawer(record),
    },
    {
      key: 'delete',
      label: 'Xóa',
      icon: icons.delete,
      danger: true,
      onClick: () => setDeleteTarget(record),
    },
  ], [openDetailDrawer, openEditDrawer]);

  // ── Header actions ────────────────────────────────────────────────
  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('data:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary',
        icon: <PlusOutlined />,
        onClick: openCreateDrawer,
      });
    }
    return actions;
  }, [hasPerm, openCreateDrawer]);

  // ── Sidebar Filter Content ────────────────────────────────────────
  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Từ khóa tìm kiếm
        </div>
        <Input
          placeholder="Tìm theo mã, tên đối tượng..."
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Biểu tượng
        </div>
        <Select
          placeholder="Chọn biểu tượng"
          allowClear
          value={filterIconId}
          onChange={(val) => setFilterIconId(val)}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          options={symbols.map((s) => ({
            value: s.id,
            label: s.name ? `${s.name}${s.code ? ` (${s.code})` : ''}` : s.code,
          }))}
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
          onChange={(val) => setFilterStatus(val)}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          options={STATUS_OPTIONS}
        />
      </div>
    </>
  );

  const statusTabs = [
    { key: 'all', label: 'Tất cả', count: tabCounts.all, color: actionPrimary, active: activeStatusTab === 'all' },
    { key: 'active', label: 'Sử dụng', count: tabCounts.active, color: statusOperational, active: activeStatusTab === 'active' },
    { key: 'locked', label: 'Khóa', count: tabCounts.locked, color: statusCritical, active: activeStatusTab === 'locked' },
  ];

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} type="table" />;
    if (isError) {
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách đối tượng điểm'}
          onRetry={fetchData}
        />
      );
    }
    if (dataSource.length === 0) {
      return <EmptyState description="Chưa có danh mục đối tượng điểm nào" />;
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
            { label: 'Quản lý danh mục đối tượng điểm' },
          ]}
          actions={headerActions}
        />

        <FilterTableLayout
          hideFilterToggle
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          loading={isLoading}
          error={isError}
          onRetry={fetchData}
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
              {editingRecord ? 'Chỉnh sửa đối tượng điểm' : 'Thêm mới đối tượng điểm'}
            </span>
          }
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          drawerSize="md"
          footer={
            <div style={drawerFooterStyle}>
              <Button onClick={() => setDrawerOpen(false)} style={outlineButtonStyle}>
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={handleFormSubmit}
                loading={submitting}
                style={primaryButtonStyle}
              >
                {editingRecord ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '20px 24px' },
          }}
        >
          <style>{requiredMarkStyle}</style>
          <Form form={form} layout="vertical">
            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Mã đối tượng</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập mã đối tượng' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input
                    placeholder="VD: CANG_BIEN"
                    style={{ borderRadius: radiusPill, height: 40 }}
                    disabled={!!editingRecord}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Tên đối tượng điểm</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập tên đối tượng' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input
                    placeholder="VD: Cảng biển"
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item
                  name="iconId"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Biểu tượng</span>}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn biểu tượng"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    allowClear
                  >
                    {symbols.map((s) => (
                      <Select.Option key={s.id} value={s.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}>
                          {s.image && (
                            <img
                              src={s.image}
                              alt={s.name}
                              style={{ width: 20, height: 20, objectFit: 'contain' }}
                            />
                          )}
                          <span>{s.name} ({s.code})</span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Trạng thái</span>}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    options={STATUS_OPTIONS}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </AppDrawer>

        {/* ── View Detail AppDrawer ────────────────────────────────── */}
        <AppDrawer
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Chi tiết đối tượng điểm{detailRecord ? ` - ${detailRecord.name}` : ''}
            </span>
          }
          open={detailDrawerOpen}
          onClose={() => setDetailDrawerOpen(false)}
          drawerSize="md"
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '20px 24px' },
          }}
        >
          {detailRecord && (() => {
            const sym = symbols.find((s) => s.id === detailRecord.iconId);
            const imgSrc = detailRecord.iconUrl || sym?.image;
            const isOperational = detailRecord.status === 1;
            const color = isOperational ? statusOperational : statusCritical;
            const statusLabel = isOperational ? 'Sử dụng' : 'Khóa';

            return (
              <div>
                {imgSrc && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spaceLg }}>
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        background: surfacePage,
                        border: `1px solid ${borderDefault}`,
                        borderRadius: radiusMd,
                        padding: spaceSm,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={imgSrc}
                        alt={detailRecord.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spaceMd }}>
                  <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Mã đối tượng</div>
                    <div style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                      {detailRecord.code || '—'}
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
                          background: `${color}15`,
                          border: `1px solid ${color}40`,
                          color,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Tên đối tượng điểm</div>
                    <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                      {detailRecord.name}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Người cập nhật</div>
                    <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                      {detailRecord.updatedBy || detailRecord.createdBy || 'SYSTEM'}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Ngày cập nhật</div>
                    <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                      {detailRecord.updatedAt ? dayjs(detailRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
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
              Xác nhận xóa đối tượng điểm
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
              Bạn có chắc chắn muốn xóa đối tượng điểm{' '}
              <strong style={{ color: colors.sidebarBg }}>"{deleteTarget?.name}"</strong>?
            </p>
          </div>
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
}
