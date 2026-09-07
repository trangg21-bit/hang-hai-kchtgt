import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Row,
  Col,
  Modal,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { mapLayerService } from '../../services/mapLayerService';
import type { MapLayer, CreateMapLayerPayload, UpdateMapLayerPayload } from '../../types/mapLayer';
import {
  MAP_LAYER_TYPE_OPTIONS,
  MapLayer as MapLayerEnum,
} from '../../types/mapLayer';
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
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  radiusPill,
  radiusMd,
  radiusTextArea,
  fontSizeSm,
  fontSizeMd,
  fontWeightMedium,
  fontWeightBold,
  spaceFormField,
  spaceSm,
  spaceMd,
  drawerTitleStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  surfaceCard,
  badgeBaseStyle,
  icons,
  colors,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

const LAYER_TYPE_LABEL_MAP: Record<string, string> = {
  [MapLayerEnum.LayerType.POINT]: 'Đối tượng điểm',
  [MapLayerEnum.LayerType.LINE]: 'Đối tượng đường',
  [MapLayerEnum.LayerType.POLYGON]: 'Đối tượng vùng',
  [MapLayerEnum.LayerType.BASEMAP]: 'Bản đồ nền',
  [MapLayerEnum.LayerType.OVERLAY]: 'Lớp phủ',
};

const LAYER_TYPE_COLOR_MAP: Record<string, string> = {
  [MapLayerEnum.LayerType.POINT]: '#0284C7',
  [MapLayerEnum.LayerType.LINE]: '#0E6FD6',
  [MapLayerEnum.LayerType.POLYGON]: '#1BAF7A',
  [MapLayerEnum.LayerType.BASEMAP]: '#EDA100',
  [MapLayerEnum.LayerType.OVERLAY]: '#8B5CF6',
};

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
];

export default function MapLayerList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterVisible, setFilterVisible] = useState<boolean | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [dataSource, setDataSource] = useState<MapLayer[]>([]);
  const [allLayers, setAllLayers] = useState<MapLayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MapLayer | null>(null);
  const [detailRecord, setDetailRecord] = useState<MapLayer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<MapLayer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await mapLayerService.list({ page: 1, pageSize: 1000 });
      const rawList = res.data || [];
      setAllLayers(rawList);

      const filtered = rawList.filter((l) => {
        if (keyword) {
          const matchName = l.name?.toLowerCase().includes(keyword.toLowerCase());
          const matchCode = l.code?.toLowerCase().includes(keyword.toLowerCase());
          if (!matchName && !matchCode) return false;
        }
        if (filterType && l.layerType !== filterType) return false;
        if (filterVisible !== undefined && l.visible !== filterVisible) return false;
        if (filterStatus && l.status !== filterStatus) return false;
        return true;
      });

      const start = (page - 1) * pageSize;
      setDataSource(filtered.slice(start, start + pageSize));
      setTotal(filtered.length);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách lớp bản đồ'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, keyword, filterType, filterVisible, filterStatus]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const active = allLayers.filter((l) => l.status === 'ACTIVE').length;
    const inactive = allLayers.filter((l) => l.status === 'INACTIVE').length;
    return {
      all: allLayers.length,
      active,
      inactive,
    };
  }, [allLayers]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchData();
  }, [fetchData]);

  const handleFilterReset = useCallback(() => {
    setKeyword('');
    setFilterType(undefined);
    setFilterVisible(undefined);
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

  const handleToggleVisible = useCallback(
    async (record: MapLayer) => {
      const newVisible = !record.visible;
      try {
        await mapLayerService.update(record.id, { visible: newVisible });
        toast.success(newVisible ? 'Đã bật hiển thị lớp bản đồ' : 'Đã tắt hiển thị lớp bản đồ');
        void fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Cập nhật hiển thị thất bại');
      }
    },
    [fetchData],
  );

  const openCreateDrawer = useCallback(() => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ visible: true, opacity: 1, order: 0, status: 'ACTIVE' });
    setDrawerOpen(true);
  }, [form]);

  const openEditDrawer = useCallback((record: MapLayer) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      layerType: record.layerType,
      source: record.source,
      visible: record.visible ?? true,
      opacity: record.opacity ?? 1,
      order: record.order ?? 0,
      styleConfig: record.styleConfig,
      status: record.status || 'ACTIVE',
    });
    setDrawerOpen(true);
  }, [form]);

  const openDetailDrawer = useCallback((record: MapLayer) => {
    setDetailRecord(record);
    setDetailDrawerOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingRecord) {
        const payload: UpdateMapLayerPayload = {
          name: values.name,
          layerType: values.layerType,
          source: values.source,
          visible: values.visible,
          opacity: values.opacity,
          order: values.order,
          styleConfig: values.styleConfig,
        };
        await mapLayerService.update(editingRecord.id, payload);
        toast.success('Đã cập nhật lớp bản đồ');
      } else {
        const payload: CreateMapLayerPayload = {
          name: values.name,
          code: values.code,
          layerType: values.layerType,
          source: values.source,
          visible: values.visible,
          opacity: values.opacity,
          order: values.order,
          styleConfig: values.styleConfig,
        };
        await mapLayerService.create(payload);
        toast.success('Đã tạo lớp bản đồ mới');
      }

      setDrawerOpen(false);
      void fetchData();
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  }, [editingRecord, form, fetchData]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mapLayerService.delete(deleteTarget.id);
      toast.success('Đã xóa lớp bản đồ');
      setDeleteTarget(null);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchData]);

  // ── DataTable Columns ─────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      type: 'mono' as const,
      render: (_: unknown, __: MapLayer, idx: number) => (
        <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{(page - 1) * pageSize + idx + 1}</span>
      ),
    },
    {
      key: 'name',
      label: 'Tên lớp bản đồ',
      dataIndex: 'name',
      width: 260,
      fixed: 'left' as const,
      ellipsis: false,
      render: (name: string, record: MapLayer) => (
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
      key: 'layerType',
      label: 'Loại lớp',
      dataIndex: 'layerType',
      width: 160,
      align: 'left' as const,
      ellipsis: false,
      render: (type: string) => {
        const label = LAYER_TYPE_LABEL_MAP[type] || type || '—';
        const color = LAYER_TYPE_COLOR_MAP[type] || actionPrimary;
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
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
    {
      key: 'opacity',
      label: 'Độ mờ',
      dataIndex: 'opacity',
      width: 100,
      align: 'center' as const,
      render: (v: number) => <span style={{ fontSize: fontSizeMd }}>{v != null ? `${(v * 100).toFixed(0)}%` : '100%'}</span>,
    },
    {
      key: 'order',
      label: 'Thứ tự',
      dataIndex: 'order',
      width: 90,
      align: 'center' as const,
      render: (v: number) => <span style={{ fontSize: fontSizeMd }}>{v ?? 0}</span>,
    },
    {
      key: 'visible',
      label: 'Hiển thị',
      dataIndex: 'visible',
      width: 110,
      align: 'center' as const,
      render: (visible: boolean, record: MapLayer) => (
        <Switch
          checked={visible}
          onChange={() => handleToggleVisible(record)}
          size="small"
        />
      ),
    },
    {
      key: 'updatedAt',
      label: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      width: 180,
      ellipsis: false,
      render: (text: string) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
          {text ? dayjs(text).format('DD/MM/YYYY HH:mm:ss') : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 160,
      align: 'center' as const,
      ellipsis: false,
      render: (status: string) => {
        const isOperational = status === 'ACTIVE';
        const color = isOperational ? statusOperational : statusDraft;
        const label = isOperational ? 'Hoạt động' : 'Không hoạt động';
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
  ], [page, pageSize, openDetailDrawer, handleToggleVisible]);

  // ── Row Actions ──────────────────────────────────────────────────
  const rowActions = useCallback((record: MapLayer) => {
    const actions = [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => openDetailDrawer(record),
      },
    ];
    if (hasPerm('gis.layer.edit') || hasPerm('map:manage')) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => openEditDrawer(record),
      });
    }
    if (hasPerm('gis.layer.delete') || hasPerm('map:manage')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: icons.delete,
        danger: true,
        onClick: () => setDeleteTarget(record),
      });
    }
    return actions;
  }, [hasPerm, openDetailDrawer, openEditDrawer]);

  // ── Header Actions ────────────────────────────────────────────────
  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('gis.layer.create') || hasPerm('map:manage')) {
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
          placeholder="Tìm theo mã, tên lớp..."
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
        />
      </div>

      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Loại lớp
        </div>
        <Select
          placeholder="Tất cả loại lớp"
          allowClear
          value={filterType}
          onChange={(val) => setFilterType(val)}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          options={MAP_LAYER_TYPE_OPTIONS}
        />
      </div>

      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Hiển thị trên bản đồ
        </div>
        <Select
          placeholder="Tất cả trạng thái"
          allowClear
          value={filterVisible}
          onChange={(val) => setFilterVisible(val)}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          options={[
            { value: true, label: 'Đang hiển thị (Bật)' },
            { value: false, label: 'Đang ẩn (Tắt)' },
          ]}
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
    { key: 'ACTIVE', label: 'Hoạt động', count: tabCounts.active, color: statusOperational, active: activeStatusTab === 'ACTIVE' },
    { key: 'INACTIVE', label: 'Không hoạt động', count: tabCounts.inactive, color: statusDraft, active: activeStatusTab === 'INACTIVE' },
  ];

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} type="table" />;
    if (isError) {
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách lớp bản đồ'}
          onRetry={fetchData}
        />
      );
    }
    if (dataSource.length === 0) {
      return <EmptyState description="Chưa có lớp bản đồ nào" />;
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
            { label: 'Quản lý lớp bản đồ' },
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
              {editingRecord ? 'Chỉnh sửa lớp bản đồ' : 'Thêm mới lớp bản đồ'}
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
                onClick={handleSubmit}
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
                  label={<span style={{ fontWeight: fontWeightMedium }}>Mã lớp</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập mã lớp' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input
                    placeholder="VD: LAY-PT-001"
                    style={{ borderRadius: radiusPill, height: 40 }}
                    disabled={!!editingRecord}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Tên lớp bản đồ</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập tên lớp' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input
                    placeholder="VD: Đối tượng điểm cảng biển"
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item
                  name="layerType"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Loại lớp</span>}
                  rules={[{ required: true, message: 'Vui lòng chọn loại lớp' }]}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Select
                    placeholder="Chọn loại lớp"
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                    options={MAP_LAYER_TYPE_OPTIONS}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="source"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Nguồn dữ liệu</span>}
                  style={{ marginBottom: spaceFormField }}
                >
                  <Input
                    placeholder="VD: WMS, GeoJSON, File Shape..."
                    style={{ borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item
                  name="opacity"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Độ mờ (0 - 1)</span>}
                  style={{ marginBottom: spaceFormField }}
                >
                  <InputNumber
                    placeholder="1"
                    min={0}
                    max={1}
                    step={0.1}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="order"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Thứ tự hiển thị</span>}
                  style={{ marginBottom: spaceFormField }}
                >
                  <InputNumber
                    placeholder="0"
                    min={0}
                    step={1}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="styleConfig"
              label={<span style={{ fontWeight: fontWeightMedium }}>Cấu hình style (JSON)</span>}
              style={{ marginBottom: spaceFormField }}
            >
              <Input.TextArea
                placeholder='{"color": "#ff0000", "width": 2}'
                rows={3}
                style={{ borderRadius: radiusTextArea }}
              />
            </Form.Item>

            <Row gutter={spaceMd}>
              <Col span={12}>
                <Form.Item
                  name="visible"
                  label={<span style={{ fontWeight: fontWeightMedium }}>Hiển thị trên bản đồ</span>}
                  valuePropName="checked"
                  style={{ marginBottom: spaceFormField }}
                >
                  <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
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
              Chi tiết lớp bản đồ{detailRecord ? ` - ${detailRecord.name}` : ''}
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
            const isOperational = detailRecord.status === 'ACTIVE';
            const color = isOperational ? statusOperational : statusDraft;
            const statusLabel = isOperational ? 'Hoạt động' : 'Không hoạt động';
            const layerLabel = LAYER_TYPE_LABEL_MAP[detailRecord.layerType] || detailRecord.layerType || '—';
            const layerColor = LAYER_TYPE_COLOR_MAP[detailRecord.layerType] || actionPrimary;

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spaceMd }}>
                <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                  <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Mã lớp</div>
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
                  <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Tên lớp bản đồ</div>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
                    {detailRecord.name}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                  <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Loại lớp</div>
                  <div>
                    <span
                      style={{
                        ...badgeBaseStyle,
                        borderRadius: radiusPill,
                        padding: '2px 10px',
                        fontSize: fontSizeMd,
                        fontWeight: fontWeightMedium,
                        background: `${layerColor}15`,
                        border: `1px solid ${layerColor}40`,
                        color: layerColor,
                      }}
                    >
                      {layerLabel}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                  <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Nguồn dữ liệu</div>
                  <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                    {detailRecord.source || '—'}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                  <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Độ mờ (Opacity)</div>
                  <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                    {detailRecord.opacity != null ? `${(detailRecord.opacity * 100).toFixed(0)}%` : '100%'}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                  <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Thứ tự hiển thị</div>
                  <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                    {detailRecord.order ?? 0}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                  <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Hiển thị trên bản đồ</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}>
                    {detailRecord.visible ? (
                      <>
                        <EyeOutlined style={{ color: statusOperational }} />
                        <span style={{ color: statusOperational, fontWeight: fontWeightMedium }}>Bật</span>
                      </>
                    ) : (
                      <>
                        <EyeInvisibleOutlined style={{ color: textTertiary }} />
                        <span style={{ color: textTertiary }}>Tắt</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                  <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Ngày cập nhật</div>
                  <div style={{ color: textPrimary, fontSize: fontSizeMd }}>
                    {detailRecord.updatedAt ? dayjs(detailRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
                  </div>
                </div>
                {detailRecord.styleConfig && (
                  <div style={{ gridColumn: '1 / -1', padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
                    <div style={{ color: textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>Cấu hình style (JSON)</div>
                    <pre
                      style={{
                        margin: 0,
                        padding: spaceSm,
                        background: '#0F172A',
                        color: '#38BDF8',
                        borderRadius: radiusMd,
                        fontSize: fontSizeSm,
                        overflowX: 'auto',
                      }}
                    >
                      {detailRecord.styleConfig}
                    </pre>
                  </div>
                )}
              </div>
            );
          })()}
        </AppDrawer>

        {/* ── Delete Confirmation Modal ────────────────────────────── */}
        <Modal
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Xác nhận xóa lớp bản đồ
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
              Bạn có chắc chắn muốn xóa lớp bản đồ{' '}
              <strong style={{ color: colors.sidebarBg }}>"{deleteTarget?.name}"</strong>?
            </p>
          </div>
        </Modal>
      </div>
    </ThemeTokenProvider>
  );
}
