import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Select,
} from 'antd';
import {
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { spatialObjectCategoryService } from '../../services/spatialObjectCategoryService';
import type { SpatialObjectCategory } from '../../services/spatialObjectCategoryService';
import { symbolService } from '../../services/symbolService';
import type { Symbol as MapSymbolItem } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterTableLayout, DataTable, type ScreenHeaderAction, type DataTableColumn } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { CommonHistoryDrawer, type CommonHistoryEntry } from '../../components/shared/CommonHistoryDrawer';
import PointObjectForm, { type PointObjectFormRef } from './PointObjectForm';
import PointObjectDetailContent from './PointObjectDetailContent';
import { userService } from '../../services/userService';
import { toast } from '../../components/ToastNotification';
import {
  statusOperational,
  statusCritical,
  textSecondary,
  textTertiary,
  borderDefault,
  radiusPill,
  radiusMd,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  spaceFormField,
  spaceSm,
  drawerTitleStyle,
  drawerFooterStyle,
  DRAWER_WIDTH,
  primaryButtonStyle,
  outlineButtonStyle,
  surfacePage,
  icons,
  colors,
  formatUserDisplayName,
  isUuidString,
  getRangePickerProps,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

const fontSizeMd = 13.5;

export default function PointObjectList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // ── Filter states ────────────────────────────────────────────────
  const [filterCode, setFilterCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterIconId, setFilterIconId] = useState<string | undefined>();
  const [updatedDateRange, setUpdatedDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');
  const [tabCounts, setTabCounts] = useState<{ all: number; active: number; locked: number; deleted: number }>({
    all: 0,
    active: 0,
    locked: 0,
    deleted: 0,
  });

  // ── Sort states ──────────────────────────────────────────────────
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>();

  // ── Pagination states ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [dataSource, setDataSource] = useState<SpatialObjectCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Reference data ──────────────────────────────────────────────
  const [symbols, setSymbols] = useState<MapSymbolItem[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  // ── Drawer & Modal states ────────────────────────────────────────
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SpatialObjectCategory | null>(null);
  const [detailRecord, setDetailRecord] = useState<SpatialObjectCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createFormRef = useRef<PointObjectFormRef>(null);
  const editFormRef = useRef<PointObjectFormRef>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // ── Delete confirmation ─────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpatialObjectCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── History drawer ──────────────────────────────────────────────
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<SpatialObjectCategory | null>(null);
  const [historyRecords, setHistoryRecords] = useState<CommonHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load Map Symbols for select dropdown
  useEffect(() => {
    symbolService.list({ pageSize: 1000 }).then((res) => setSymbols(res.data || [])).catch(() => {});
    userService.list({ pageSize: 1000 }).then((res) => {
      const users = res.data || (res as any).content || [];
      const map = new Map<string, string>();
      users.forEach((u: any) => {
        const name = u.fullName || u.username || '';
        if (name && !isUuidString(name)) map.set(u.id, name);
      });
      setUserMap(map);
    }).catch(() => {});
  }, []);

  // ── Fetch data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      let isDeleted: boolean | undefined = undefined;
      let status: number | undefined = undefined;
      if (activeStatusTab === 'active') {
        status = 1;
        isDeleted = false;
      } else if (activeStatusTab === 'locked') {
        status = 0;
        isDeleted = false;
      } else if (activeStatusTab === 'deleted') {
        isDeleted = true;
      }

      const res = await spatialObjectCategoryService.list({
        page,
        pageSize,
        code: filterCode.trim() || undefined,
        name: filterName.trim() || undefined,
        iconId: filterIconId,
        status,
        isDeleted,
        geometryType: 1, // Point
        fromUpdatedDate: updatedDateRange?.[0] ? updatedDateRange[0].startOf('day').toISOString() : undefined,
        toUpdatedDate: updatedDateRange?.[1] ? updatedDateRange[1].endOf('day').toISOString() : undefined,
        sortField,
        sortOrder,
      });
      setDataSource(res?.content || []);
      setTotal(res?.totalElements || 0);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách danh mục đối tượng điểm'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterCode, filterName, filterIconId, activeStatusTab, updatedDateRange, sortField, sortOrder]);

  // ── Fetch counts for status tabs ────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const [resAll, resActive, resLocked, resDeleted] = await Promise.all([
        spatialObjectCategoryService.list({ page: 1, pageSize: 1, geometryType: 1 }),
        spatialObjectCategoryService.list({ page: 1, pageSize: 1, geometryType: 1, status: 1, isDeleted: false }),
        spatialObjectCategoryService.list({ page: 1, pageSize: 1, geometryType: 1, status: 0, isDeleted: false }),
        spatialObjectCategoryService.list({ page: 1, pageSize: 1, geometryType: 1, isDeleted: true }),
      ]);
      const activeCount = resActive?.totalElements || 0;
      const lockedCount = resLocked?.totalElements || 0;
      const deletedCount = resDeleted?.totalElements || 0;
      const allCount = resAll?.totalElements || (activeCount + lockedCount + deletedCount);
      setTabCounts({
        all: allCount,
        active: activeCount,
        locked: lockedCount,
        deleted: deletedCount,
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

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchData();
  }, [fetchData]);

  const handleFilterReset = useCallback(() => {
    setFilterCode('');
    setFilterName('');
    setFilterIconId(undefined);
    setUpdatedDateRange(null);
    setPage(1);
  }, []);

  const handleStatusTabChange = useCallback((key: string) => {
    setActiveStatusTab(key);
    setPage(1);
  }, []);

  // ── Drawers open/close ──────────────────────────────────────────
  const openCreateDrawer = useCallback(() => {
    createForm.resetFields();
    createForm.setFieldsValue({ status: 1 });
    setCreateDrawerOpen(true);
  }, [createForm]);

  const openEditDrawer = useCallback((record: SpatialObjectCategory) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      code: record.code,
      name: record.name,
      iconId: record.iconId,
      status: record.status ?? 1,
    });
    setEditDrawerOpen(true);
  }, [editForm]);

  const openDetailDrawer = useCallback((record: SpatialObjectCategory) => {
    setDetailRecord(record);
    setDetailDrawerOpen(true);
  }, []);

  // ── History drawer ──────────────────────────────────────────────
  const openHistoryDrawer = useCallback(async (record: SpatialObjectCategory) => {
    setHistoryTarget(record);
    setHistoryDrawerOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);

    try {
      const sym = symbols.find((s) => s.id === record.iconId);
      const entries: CommonHistoryEntry[] = [];

      // Mốc tạo mới
      if (record.createdAt) {
        entries.push({
          id: `create-${record.id}`,
          action: 'CREATE',
          status: 'Tạo mới',
          actor: formatUserDisplayName(record.createdBy, (record as any).createdByName, userMap) || 'Quản trị viên',
          timestamp: record.createdAt,
          description: `Khởi tạo danh mục đối tượng điểm "${record.name}"`,
          changes: [
            { field: 'Mã đối tượng', oldValue: null, newValue: record.code },
            { field: 'Tên đối tượng', oldValue: null, newValue: record.name },
            { field: 'Loại hình học', oldValue: null, newValue: 'Điểm (Point)' },
            { field: 'Biểu tượng', oldValue: null, newValue: sym ? `${sym.name} (${sym.code})` : record.iconId || '(Không có)' },
            { field: 'Trạng thái', oldValue: null, newValue: record.status === 1 ? 'Sử dụng' : 'Khóa' },
          ],
        });
      }

      // Mốc cập nhật gần nhất
      if (record.updatedAt && record.updatedAt !== record.createdAt) {
        entries.push({
          id: `update-${record.id}`,
          action: 'UPDATE',
          status: 'Cập nhật',
          actor: formatUserDisplayName(record.updatedBy, (record as any).updatedByName, userMap, record.createdBy, (record as any).createdByName) || 'Quản trị viên',
          timestamp: record.updatedAt,
          description: `Cập nhật thông tin danh mục đối tượng điểm "${record.name}"`,
          changes: [
            { field: 'Tên đối tượng', oldValue: '—', newValue: record.name },
            { field: 'Trạng thái', oldValue: '—', newValue: record.status === 1 ? 'Sử dụng' : 'Khóa' },
          ],
        });
      }

      setHistoryRecords(entries);
    } finally {
      setHistoryLoading(false);
    }
  }, [symbols, userMap]);

  // ── Delete confirmation ─────────────────────────────────────────
  const openDeleteModal = useCallback((record: SpatialObjectCategory) => {
    setDeleteTarget(record);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await spatialObjectCategoryService.delete(deleteTarget.id);
      toast.success('Đã xóa danh mục đối tượng điểm thành công');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      void fetchData();
      void fetchCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchData, fetchCounts]);

  // ── DataTable Columns ───────────────────────────────────────────
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: 'stt',
      label: 'STT',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      type: 'mono' as const,
      render: (_: unknown, __: SpatialObjectCategory, idx?: number) => (
        <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{(page - 1) * pageSize + (idx ?? 0) + 1}</span>
      ),
    },
    {
      key: 'name',
      label: 'Tên đối tượng điểm',
      dataIndex: 'name',
      width: 280,
      sortable: true,
      sortOrder: sortField === 'name' ? (sortOrder === 'asc' ? 'ascend' : sortOrder === 'desc' ? 'descend' : null) : null,
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
      key: 'icon',
      label: 'Biểu tượng',
      dataIndex: 'iconId',
      width: 160,
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
      key: 'geometryType',
      label: 'Loại hình học',
      width: 150,
      align: 'center' as const,
      render: () => (
        <span style={{ fontSize: fontSizeMd, color: colors.sidebarBg, fontWeight: fontWeightMedium }}>
          Điểm (Point)
        </span>
      ),
    },
    {
      key: 'updatedBy',
      label: 'Cán bộ cập nhật',
      dataIndex: 'updatedBy',
      width: 220,
      sortable: true,
      sortOrder: sortField === 'updatedBy' || sortField === 'updatedAt' ? (sortOrder === 'asc' ? 'ascend' : sortOrder === 'desc' ? 'descend' : null) : null,
      ellipsis: false,
      render: (v: string | null, record: SpatialObjectCategory) => {
        const name = formatUserDisplayName(v, (record as any).updatedByName, userMap, record.createdBy, (record as any).createdByName);
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
            <div style={{ fontSize: fontSizeSm, color: textSecondary, whiteSpace: 'nowrap' }}>
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
      width: 140,
      align: 'center' as const,
      ellipsis: false,
      render: (status: number, record: SpatialObjectCategory) => {
        const isDeleted = Boolean(record.deletedAt);
        const isOperational = status === 1;
        const color = isDeleted ? statusCritical : (isOperational ? statusOperational : statusCritical);
        const label = isDeleted ? 'Đã xóa' : (isOperational ? 'Sử dụng' : 'Khóa');
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
  ], [page, pageSize, symbols, userMap, openDetailDrawer, sortField, sortOrder]);

  // ── Row Actions ──────────────────────────────────────────────────
  const rowActions = useCallback((record: SpatialObjectCategory) => {
    const isDeleted = Boolean(record.deletedAt);
    const actions: any[] = [];
    if (hasPerm('data:read')) {
      actions.push({
        key: 'view',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => openDetailDrawer(record),
      });
    }
    if (!isDeleted && (hasPerm('data:update') || hasPerm('data:write'))) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => openEditDrawer(record),
      });
    }
    if (hasPerm('pointobject:history') || hasPerm('gispoint:history') || hasPerm('data:history')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => void openHistoryDrawer(record),
      });
    }
    if (!isDeleted && hasPerm('data:delete')) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: icons.delete,
        danger: true,
        onClick: () => openDeleteModal(record),
      });
    }
    return actions;
  }, [hasPerm, openDetailDrawer, openEditDrawer, openHistoryDrawer, openDeleteModal]);

  // ── Header Actions ───────────────────────────────────────────────
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

  // ── Sidebar Filter Content ───────────────────────────────────────
  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: spaceSm }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Mã đối tượng
        </div>
        <Input
          placeholder="Nhập mã đối tượng..."
          allowClear
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
        />
      </div>

      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Tên đối tượng
        </div>
        <Input
          placeholder="Nhập tên đối tượng..."
          allowClear
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
        />
      </div>

      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Biểu tượng liên kết
        </div>
        <Select
          placeholder="Chọn biểu tượng"
          allowClear
          showSearch
          optionFilterProp="label"
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
          Ngày cập nhật
        </div>
        <DatePicker.RangePicker
          {...getRangePickerProps({
            value: updatedDateRange,
            onChange: (dates: any) => setUpdatedDateRange(dates as any),
            style: { width: '100%', borderRadius: radiusPill, height: 40 },
          })}
        />
      </div>
    </>
  );

  const statusTabs = [
    { key: 'all', label: 'Tất cả', count: tabCounts.all, color: '#0E6FD6', active: activeStatusTab === 'all' },
    { key: 'active', label: 'Sử dụng', count: tabCounts.active, color: statusOperational, active: activeStatusTab === 'active' },
    { key: 'locked', label: 'Khóa', count: tabCounts.locked, color: statusCritical, active: activeStatusTab === 'locked' },
    { key: 'deleted', label: 'Đã xóa', count: tabCounts.deleted, color: statusCritical, active: activeStatusTab === 'deleted' },
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
          onSort={(field, order) => {
            setSortField(order ? field : undefined);
            setSortOrder(order || undefined);
            setPage(1);
          }}
          scroll={{ x: 'max-content' }}
        />
        <Pagination
          total={total}
          current={page}
          pageSize={pageSize}
          pageSizeOptions={[20, 50, 100]}
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

        {/* ── Create AppDrawer ─────────────────────────────────────── */}
        <AppDrawer
          width={DRAWER_WIDTH}
          rootClassName="chk-drawer-scope"
          className="chk-drawer-scope"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới danh mục đối tượng điểm</span>}
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
            <PointObjectForm
              ref={createFormRef}
              form={createForm}
              onFinish={() => {
                setCreateDrawerOpen(false);
                void fetchData();
                void fetchCounts();
              }}
              onSubmittingChange={setSubmitting}
            />
          </Form>
        </AppDrawer>

        {/* ── Edit AppDrawer ───────────────────────────────────────── */}
        <AppDrawer
          width={DRAWER_WIDTH}
          rootClassName="chk-drawer-scope"
          className="chk-drawer-scope"
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Chỉnh sửa danh mục đối tượng điểm — {editingRecord?.name || ''}
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
              <PointObjectForm
                ref={editFormRef}
                form={editForm}
                id={editingRecord.id}
                initialRecord={editingRecord}
                onFinish={() => {
                  setEditDrawerOpen(false);
                  setEditingRecord(null);
                  void fetchData();
                  void fetchCounts();
                }}
                onSubmittingChange={setSubmitting}
              />
            </Form>
          )}
        </AppDrawer>

        {/* ── View Detail AppDrawer ────────────────────────────────── */}
        <AppDrawer
          width={DRAWER_WIDTH}
          rootClassName="chk-drawer-scope"
          className="chk-drawer-scope"
          title={
            <span style={drawerTitleStyle}>
              Chi tiết đối tượng điểm{detailRecord ? ` - ${detailRecord.name}` : ''}
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
            <PointObjectDetailContent
              selectedRecord={detailRecord}
              symbols={symbols}
              userMap={userMap}
            />
          )}
        </AppDrawer>

        {/* ── History Drawer ──────────────────────────────────────── */}
        <CommonHistoryDrawer
          open={historyDrawerOpen}
          onClose={() => {
            setHistoryDrawerOpen(false);
            setHistoryTarget(null);
          }}
          entityName={historyTarget?.name || 'đối tượng điểm'}
          records={historyRecords}
          loading={historyLoading}
          userMap={userMap}
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
          itemType="đối tượng điểm"
          itemName={deleteTarget?.name}
          itemCode={deleteTarget?.code}
        />
      </div>
    </ThemeTokenProvider>
  );
}
