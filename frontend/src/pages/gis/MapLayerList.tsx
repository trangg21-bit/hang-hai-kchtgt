import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { mapLayerService } from '../../services/mapLayerService';
import type { MapLayer } from '../../types/mapLayer';
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
import { AppDrawer } from '../../components/shared/AppDrawer';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { CommonHistoryDrawer, type CommonHistoryEntry } from '../../components/shared/CommonHistoryDrawer';
import MapLayerForm, { type MapLayerFormRef } from './MapLayerForm';
import MapLayerDetailContent from './MapLayerDetailContent';
import { userService } from '../../services/userService';
import toast from '../../components/ToastNotification';
import {
  actionPrimary,
  statusOperational,
  statusDraft,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  radiusPill,
  fontWeightMedium,
  fontWeightBold,
  spaceFormField,
  spaceSm,
  drawerTitleStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  icons,
  colors,
  isUuidString,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

const fontSizeMd = 13.5;

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

  // ── Filter states ────────────────────────────────────────────────
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterVisible, setFilterVisible] = useState<boolean | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');

  // ── Pagination states ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [dataSource, setDataSource] = useState<MapLayer[]>([]);
  const [allLayers, setAllLayers] = useState<MapLayer[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Drawer & Modal states ────────────────────────────────────────
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MapLayer | null>(null);
  const [detailRecord, setDetailRecord] = useState<MapLayer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createFormRef = useRef<MapLayerFormRef>(null);
  const editFormRef = useRef<MapLayerFormRef>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // ── Delete confirmation ─────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MapLayer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── History drawer ──────────────────────────────────────────────
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<MapLayer | null>(null);
  const [historyRecords, setHistoryRecords] = useState<CommonHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Fetch data ──────────────────────────────────────────────────
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

  // Load Users for displaying creator/updater names without UUID fallback
  useEffect(() => {
    userService.list({ pageSize: 1000 }).then(res => {
      const map = new Map<string, string>();
      (res?.items || []).forEach(u => {
        const humanName = u.fullName || u.username;
        if (humanName && !isUuidString(humanName)) {
          map.set(u.id, humanName);
        }
      });
      setUserMap(map);
    }).catch(() => {});
  }, []);

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

  // ── Filter handlers ─────────────────────────────────────────────
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
    } else if (key === 'active') {
      setFilterStatus('ACTIVE');
    } else if (key === 'inactive') {
      setFilterStatus('INACTIVE');
    }
    setPage(1);
  }, []);

  // ── Drawers open/close ──────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    createForm.resetFields();
    createForm.setFieldsValue({
      layerType: MapLayerEnum.LayerType.POINT,
      visible: true,
      opacity: 100,
      order: 1,
      status: 'ACTIVE',
    });
    setCreateDrawerOpen(true);
  }, [createForm]);

  const openEditDrawer = useCallback((record: MapLayer) => {
    setEditingRecord(record);
    const opVal = typeof record.opacity === 'number'
      ? record.opacity <= 1
        ? Math.round(record.opacity * 100)
        : record.opacity
      : 100;
    editForm.setFieldsValue({
      code: record.code,
      name: record.name,
      layerType: record.layerType,
      source: record.source,
      visible: record.visible ?? true,
      opacity: opVal,
      order: record.order ?? 1,
      styleConfig: record.styleConfig,
      status: record.status || 'ACTIVE',
    });
    setEditDrawerOpen(true);
  }, [editForm]);

  const openDetailDrawer = useCallback((record: MapLayer) => {
    setDetailRecord(record);
    setDetailDrawerOpen(true);
  }, []);

  // ── History drawer ──────────────────────────────────────────────
  const openHistoryDrawer = useCallback(async (record: MapLayer) => {
    setHistoryTarget(record);
    setHistoryDrawerOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);

    try {
      const entries: CommonHistoryEntry[] = [];

      // Mốc tạo mới
      if (record.createdAt) {
        entries.push({
          id: `create-${record.id}`,
          action: 'CREATE',
          status: 'Tạo mới',
          actor: 'Quản trị viên GIS',
          timestamp: record.createdAt,
          description: `Khởi tạo lớp bản đồ "${record.name}"`,
          changes: [
            { field: 'Mã lớp', oldValue: null, newValue: record.code },
            { field: 'Tên lớp', oldValue: null, newValue: record.name },
            { field: 'Loại lớp', oldValue: null, newValue: LAYER_TYPE_LABEL_MAP[record.layerType] || record.layerType },
            { field: 'Hiển thị', oldValue: null, newValue: record.visible ? 'Bật' : 'Tắt' },
            { field: 'Trạng thái', oldValue: null, newValue: record.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động' },
          ],
        });
      }

      // Mốc cập nhật gần nhất
      if (record.updatedAt && record.updatedAt !== record.createdAt) {
        entries.push({
          id: `update-${record.id}`,
          action: 'UPDATE',
          status: 'Cập nhật',
          actor: 'Quản trị viên GIS',
          timestamp: record.updatedAt,
          description: `Cập nhật thông tin lớp bản đồ "${record.name}"`,
          changes: [
            { field: 'Tên lớp', oldValue: '—', newValue: record.name },
            { field: 'Trạng thái', oldValue: '—', newValue: record.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động' },
          ],
        });
      }

      setHistoryRecords(entries);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Delete confirmation ─────────────────────────────────────────
  const openDeleteModal = useCallback((record: MapLayer) => {
    setDeleteTarget(record);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mapLayerService.delete(deleteTarget.id);
      toast.success('Đã xóa lớp bản đồ thành công');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      void fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchData]);

  // ── DataTable Columns ───────────────────────────────────────────
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
      width: 280,
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
              fontSize: fontSizeMd - 0.5,
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
      align: 'center' as const,
      render: (type: string) => {
        const color = LAYER_TYPE_COLOR_MAP[type] || actionPrimary;
        const label = LAYER_TYPE_LABEL_MAP[type] || type;
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
    {
      key: 'visible',
      label: 'Hiển thị',
      dataIndex: 'visible',
      width: 120,
      align: 'center' as const,
      render: (visible: boolean) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: fontSizeMd,
            color: visible ? statusOperational : textTertiary,
            fontWeight: fontWeightMedium,
          }}
        >
          {visible ? <EyeOutlined style={{ color: statusOperational }} /> : <EyeInvisibleOutlined />}
          {visible ? 'Hiển thị' : 'Ẩn'}
        </span>
      ),
    },
    {
      key: 'opacity',
      label: 'Độ trong suốt',
      dataIndex: 'opacity',
      width: 130,
      align: 'center' as const,
      render: (val: number) => {
        const percent = val > 1 ? val : Math.round((val ?? 1) * 100);
        return <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{percent}%</span>;
      },
    },
    {
      key: 'order',
      label: 'Thứ tự',
      dataIndex: 'order',
      width: 90,
      align: 'center' as const,
      render: (order: number) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightMedium }}>
          {order ?? '—'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Thời gian cập nhật',
      dataIndex: 'updatedAt',
      width: 180,
      ellipsis: false,
      render: (date: string | null, record: MapLayer) => {
        const d = date || record.createdAt;
        return (
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>
            {d ? dayjs(d).format('DD/MM/YYYY HH:mm:ss') : '—'}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
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
  ], [page, pageSize, openDetailDrawer]);

  // ── Row Actions ──────────────────────────────────────────────────
  const rowActions = useCallback((record: MapLayer) => [
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
      key: 'history',
      label: 'Lịch sử',
      icon: icons.history,
      onClick: () => void openHistoryDrawer(record),
    },
    {
      key: 'delete',
      label: 'Xóa',
      icon: icons.delete,
      danger: true,
      onClick: () => openDeleteModal(record),
    },
  ], [openDetailDrawer, openEditDrawer, openHistoryDrawer, openDeleteModal]);

  // ── Header Actions ───────────────────────────────────────────────
  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('map:manage')) {
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

  // ── Sidebar Filter Content ───────────────────────────────────────
  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: spaceSm }}>
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
          Loại lớp bản đồ
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
          placeholder="Tất cả"
          allowClear
          value={filterVisible}
          onChange={(val) => setFilterVisible(val)}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
          options={[
            { value: true, label: 'Đang hiển thị' },
            { value: false, label: 'Đang ẩn' },
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
    { key: 'active', label: 'Hoạt động', count: tabCounts.active, color: statusOperational, active: activeStatusTab === 'active' },
    { key: 'inactive', label: 'Không hoạt động', count: tabCounts.inactive, color: statusDraft, active: activeStatusTab === 'inactive' },
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

        {/* ── Create AppDrawer ─────────────────────────────────────── */}
        <AppDrawer
          width="min(920px, 96vw)"
          rootClassName="chk-drawer-scope"
          className="chk-drawer-scope"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới lớp bản đồ</span>}
          open={createDrawerOpen}
          destroyOnHidden
          onClose={() => setCreateDrawerOpen(false)}
          footer={
            <div style={drawerFooterStyle}>
              <Button onClick={() => setCreateDrawerOpen(false)} style={outlineButtonStyle}>
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={() => createFormRef.current?.submit()}
                loading={submitting}
                style={primaryButtonStyle}
              >
                Tạo mới
              </Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '20px 24px' },
          }}
        >
          <Form form={createForm} layout="vertical">
            <MapLayerForm
              ref={createFormRef}
              form={createForm}
              onFinish={() => {
                setCreateDrawerOpen(false);
                void fetchData();
              }}
              onSubmittingChange={setSubmitting}
            />
          </Form>
        </AppDrawer>

        {/* ── Edit AppDrawer ───────────────────────────────────────── */}
        <AppDrawer
          width="min(920px, 96vw)"
          rootClassName="chk-drawer-scope"
          className="chk-drawer-scope"
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Chỉnh sửa lớp bản đồ — {editingRecord?.name || ''}
            </span>
          }
          open={editDrawerOpen}
          destroyOnHidden
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingRecord(null);
          }}
          footer={
            <div style={drawerFooterStyle}>
              <Button
                onClick={() => {
                  setEditDrawerOpen(false);
                  setEditingRecord(null);
                }}
                style={outlineButtonStyle}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={() => editFormRef.current?.submit()}
                loading={submitting}
                style={primaryButtonStyle}
              >
                Lưu thay đổi
              </Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '20px 24px' },
          }}
        >
          {editingRecord && (
            <Form form={editForm} layout="vertical">
              <MapLayerForm
                ref={editFormRef}
                form={editForm}
                id={editingRecord.id}
                initialRecord={editingRecord}
                onFinish={() => {
                  setEditDrawerOpen(false);
                  setEditingRecord(null);
                  void fetchData();
                }}
                onSubmittingChange={setSubmitting}
              />
            </Form>
          )}
        </AppDrawer>

        {/* ── View Detail AppDrawer ────────────────────────────────── */}
        <AppDrawer
          width="min(920px, 96vw)"
          rootClassName="chk-drawer-scope"
          className="chk-drawer-scope"
          title={
            <span style={drawerTitleStyle}>
              Chi tiết lớp bản đồ{detailRecord ? ` - ${detailRecord.name}` : ''}
            </span>
          }
          open={detailDrawerOpen}
          onClose={() => {
            setDetailDrawerOpen(false);
            setDetailRecord(null);
          }}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '20px 24px' },
          }}
        >
          {detailRecord && (
            <MapLayerDetailContent selectedRecord={detailRecord} userMap={userMap} />
          )}
        </AppDrawer>

        {/* ── History Drawer ──────────────────────────────────────── */}
        <CommonHistoryDrawer
          open={historyDrawerOpen}
          onClose={() => {
            setHistoryDrawerOpen(false);
            setHistoryTarget(null);
          }}
          entityName={historyTarget?.name || 'lớp bản đồ'}
          records={historyRecords}
          loading={historyLoading}
        />

        {/* ── Delete Confirmation Modal ────────────────────────────── */}
        <DeleteConfirmModal
          open={deleteModalOpen}
          onCancel={() => {
            if (!deleting) {
              setDeleteModalOpen(false);
              setDeleteTarget(null);
            }
          }}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
          itemType="lớp bản đồ"
          itemName={deleteTarget?.name}
          itemCode={deleteTarget?.code}
        />
      </div>
    </ThemeTokenProvider>
  );
}
