import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
} from 'antd';
import {
  PlusOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { symbolService } from '../../services/symbolService';
import type { Symbol } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterTableLayout, DataTable, type ScreenHeaderAction, type DataTableColumn } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { CommonHistoryDrawer, type CommonHistoryEntry } from '../../components/shared/CommonHistoryDrawer';
import SymbolForm, { type SymbolFormRef } from './SymbolForm';
import SymbolDetailContent from './SymbolDetailContent';
import { userService } from '../../services/userService';
import { toast } from '../../components/ToastNotification';
import {
  statusOperational,
  statusDraft,
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

export default function SymbolList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  // ── Filter states ────────────────────────────────────────────────
  const [filterCode, setFilterCode] = useState('');
  const [filterName, setFilterName] = useState('');
  const [updatedDateRange, setUpdatedDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');
  const [tabCounts, setTabCounts] = useState<{ all: number; active: number; inactive: number; deleted: number }>({
    all: 0,
    active: 0,
    inactive: 0,
    deleted: 0,
  });

  // ── Sort states ──────────────────────────────────────────────────
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>();

  // ── Pagination states ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [dataSource, setDataSource] = useState<Symbol[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ── Drawer & Modal states ────────────────────────────────────────
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Symbol | null>(null);
  const [detailRecord, setDetailRecord] = useState<Symbol | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createFormRef = useRef<SymbolFormRef>(null);
  const editFormRef = useRef<SymbolFormRef>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // ── Delete confirmation ─────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Symbol | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── History drawer ──────────────────────────────────────────────
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Symbol | null>(null);
  const [historyRecords, setHistoryRecords] = useState<CommonHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Fetch data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      let isDeleted: boolean | undefined = undefined;
      let status: string | undefined = undefined;
      if (activeStatusTab === 'active') {
        status = 'ACTIVE';
        isDeleted = false;
      } else if (activeStatusTab === 'inactive') {
        status = 'INACTIVE';
        isDeleted = false;
      } else if (activeStatusTab === 'deleted') {
        isDeleted = true;
      }

      const res = await symbolService.list({
        page,
        pageSize,
        code: filterCode.trim() || undefined,
        name: filterName.trim() || undefined,
        status,
        isDeleted,
        fromUpdatedDate: updatedDateRange?.[0] ? updatedDateRange[0].startOf('day').toISOString() : undefined,
        toUpdatedDate: updatedDateRange?.[1] ? updatedDateRange[1].endOf('day').toISOString() : undefined,
        sortField,
        sortOrder,
      });
      setDataSource(res.data || []);
      setTotal(res.total || 0);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách biểu tượng'));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filterCode, filterName, activeStatusTab, updatedDateRange, sortField, sortOrder]);

  // ── Fetch counts for status tabs ────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const [resAll, resActive, resInactive, resDeleted] = await Promise.all([
        symbolService.list({ page: 1, pageSize: 1 }),
        symbolService.list({ page: 1, pageSize: 1, status: 'ACTIVE', isDeleted: false }),
        symbolService.list({ page: 1, pageSize: 1, status: 'INACTIVE', isDeleted: false }),
        symbolService.list({ page: 1, pageSize: 1, isDeleted: true }),
      ]);
      const activeCount = resActive?.total || 0;
      const inactiveCount = resInactive?.total || 0;
      const deletedCount = resDeleted?.total || 0;
      const allCount = resAll?.total || (activeCount + inactiveCount + deletedCount);
      setTabCounts({
        all: allCount,
        active: activeCount,
        inactive: inactiveCount,
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

  // Load Users for displaying creator/updater names without UUID fallback (Bug 2 & 6 fix)
  useEffect(() => {
    userService.list({ pageSize: 1000 }).then(res => {
      const users = res.data || (res as any).content || [];
      const map = new Map<string, string>();
      users.forEach((u: any) => {
        const humanName = u.fullName || u.username;
        if (humanName && !isUuidString(humanName)) {
          map.set(u.id, humanName);
        }
      });
      setUserMap(map);
    }).catch(() => {});
  }, []);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchData();
  }, [fetchData]);

  const handleFilterReset = useCallback(() => {
    setFilterCode('');
    setFilterName('');
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
    createForm.setFieldsValue({ status: 'active' });
    setCreateDrawerOpen(true);
  }, [createForm]);

  const openEditDrawer = useCallback((record: Symbol) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
      status: record.status || 'active',
      image: record.image,
    });
    setEditDrawerOpen(true);
  }, [editForm]);

  const openDetailDrawer = useCallback((record: Symbol) => {
    setDetailRecord(record);
    setDetailDrawerOpen(true);
  }, []);

  // ── History drawer ──────────────────────────────────────────────
  const openHistoryDrawer = useCallback(async (record: Symbol) => {
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
          actor: formatUserDisplayName(record.createdBy, record.createdByName, userMap) || 'Quản trị viên',
          timestamp: record.createdAt,
          description: `Khởi tạo biểu tượng bản đồ "${record.name}"`,
          changes: [
            { field: 'Mã biểu tượng', oldValue: null, newValue: record.code },
            { field: 'Tên biểu tượng', oldValue: null, newValue: record.name },
            { field: 'Trạng thái', oldValue: null, newValue: record.status === 'active' ? 'Sử dụng' : 'Không sử dụng' },
          ],
        });
      }

      // Mốc cập nhật gần nhất
      if (record.updatedAt && record.updatedAt !== record.createdAt) {
        entries.push({
          id: `update-${record.id}`,
          action: 'UPDATE',
          status: 'Cập nhật',
          actor: formatUserDisplayName(record.updatedBy, record.updatedByName, userMap, record.createdBy, record.createdByName) || 'Quản trị viên',
          timestamp: record.updatedAt,
          description: `Cập nhật thông tin biểu tượng bản đồ "${record.name}"`,
          changes: [
            { field: 'Tên biểu tượng', oldValue: '—', newValue: record.name },
            { field: 'Trạng thái', oldValue: '—', newValue: record.status === 'active' ? 'Sử dụng' : 'Không sử dụng' },
          ],
        });
      }

      // Mốc xóa
      if (record.deletedAt) {
        entries.push({
          id: `delete-${record.id}`,
          action: 'DELETE',
          status: 'Đã xóa',
          actor: formatUserDisplayName(record.deletedBy, record.deletedByName, userMap, record.updatedBy, record.updatedByName) || 'Quản trị viên',
          timestamp: record.deletedAt,
          description: `Xóa biểu tượng bản đồ "${record.name}"`,
          changes: [
            { field: 'Trạng thái', oldValue: record.status === 'active' ? 'Sử dụng' : 'Không sử dụng', newValue: 'Đã xóa' },
          ],
        });
      }

      setHistoryRecords(entries);
    } finally {
      setHistoryLoading(false);
    }
  }, [userMap]);

  // ── Delete confirmation ─────────────────────────────────────────
  const openDeleteModal = useCallback((record: Symbol) => {
    setDeleteTarget(record);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await symbolService.delete(deleteTarget.id);
      toast.success('Đã xóa biểu tượng bản đồ thành công');
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
      render: (_: unknown, __: Symbol, idx?: number) => (
        <span style={{ fontSize: fontSizeMd, color: textTertiary }}>{(page - 1) * pageSize + (idx ?? 0) + 1}</span>
      ),
    },
    {
      key: 'image',
      label: 'Biểu tượng',
      dataIndex: 'image',
      width: 140,
      align: 'center' as const,
      render: (imgSrc: string, record: Symbol) =>
        imgSrc ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              background: surfacePage,
              border: `1px solid ${borderDefault}`,
              borderRadius: radiusMd,
              padding: 2,
            }}
          >
            <img src={imgSrc} alt={record.name} style={{ maxHeight: 32, maxWidth: 36, objectFit: 'contain' }} />
          </div>
        ) : (
          <PictureOutlined style={{ fontSize: 24, color: textTertiary }} />
        ),
    },
    {
      key: 'name',
      label: 'Tên biểu tượng',
      dataIndex: 'name',
      width: 280,
      sortable: true,
      sortOrder: sortField === 'name' ? (sortOrder === 'asc' ? 'ascend' : sortOrder === 'desc' ? 'descend' : null) : null,
      ellipsis: false,
      render: (name: string, record: Symbol) => (
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
      key: 'description',
      label: 'Mô tả',
      dataIndex: 'description',
      width: 260,
      ellipsis: true,
      render: (v: string | null) => (
        <span style={{ fontSize: fontSizeMd, color: textSecondary }} title={v || ''}>
          {v || '—'}
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
      render: (_: unknown, record: Symbol) => {
        const name = formatUserDisplayName(record.updatedBy, record.updatedByName, userMap, record.createdBy, record.createdByName);
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
      width: 150,
      align: 'center' as const,
      ellipsis: false,
      render: (status: string, record: Symbol) => {
        const isDeleted = Boolean(record.deletedAt);
        const isOperational = status === 'active';
        const color = isDeleted ? statusCritical : (isOperational ? statusOperational : statusDraft);
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
  ], [page, pageSize, userMap, openDetailDrawer, sortField, sortOrder]);

  // ── Row Actions ──────────────────────────────────────────────────
  const rowActions = useCallback((record: Symbol) => {
    const isDeleted = Boolean(record.deletedAt);
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    if (hasPerm('symbol:read') || hasPerm('map:read') || hasPerm('data:read')) {
      actions.push({
        key: 'view',
        label: 'Xem chi tiết',
        icon: icons.view,
        onClick: () => openDetailDrawer(record),
      });
    }
    if (!isDeleted && (hasPerm('symbol:update') || hasPerm('map:update') || hasPerm('data:update'))) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => openEditDrawer(record),
      });
    }
    if (hasPerm('symbol:history') || hasPerm('map:history')) {
      actions.push({
        key: 'history',
        label: 'Lịch sử',
        icon: icons.history,
        onClick: () => void openHistoryDrawer(record),
      });
    }
    if (!isDeleted && (hasPerm('symbol:delete') || hasPerm('map:delete') || hasPerm('data:delete'))) {
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
          Mã biểu tượng
        </div>
        <Input
          placeholder="Nhập mã biểu tượng..."
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
          placeholder="Nhập tên biểu tượng..."
          allowClear
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
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
    { key: 'inactive', label: 'Khóa', count: tabCounts.inactive, color: statusDraft, active: activeStatusTab === 'inactive' },
    { key: 'deleted', label: 'Đã xóa', count: tabCounts.deleted, color: statusCritical, active: activeStatusTab === 'deleted' },
  ];

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} type="table" />;
    if (isError) {
      return (
        <ErrorState
          message={error?.message || 'Không thể tải danh sách biểu tượng'}
          onRetry={fetchData}
        />
      );
    }
    if (dataSource.length === 0) {
      return <EmptyState description="Chưa có biểu tượng nào trên bản đồ" />;
    }
    return (
      <>
        <DataTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          rowActions={rowActions}
          scroll={{ x: 'max-content' }}
          onSort={(field, order) => {
            setSortField(order ? (field as string) : undefined);
            setSortOrder(order || undefined);
            setPage(1);
          }}
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
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới biểu tượng trên bản đồ</span>}
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
            <SymbolForm
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
          width={DRAWER_WIDTH}
          rootClassName="chk-drawer-scope"
          className="chk-drawer-scope"
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Chỉnh sửa biểu tượng — {editingRecord?.name || ''}
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
              <SymbolForm
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
          width={DRAWER_WIDTH}
          rootClassName="chk-drawer-scope"
          className="chk-drawer-scope"
          title={
            <span style={drawerTitleStyle}>
              Chi tiết biểu tượng{detailRecord ? ` - ${detailRecord.name}` : ''}
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
            <SymbolDetailContent selectedRecord={detailRecord} userMap={userMap} />
          )}
        </AppDrawer>

        {/* ── History Drawer ──────────────────────────────────────── */}
        <CommonHistoryDrawer
          open={historyDrawerOpen}
          onClose={() => {
            setHistoryDrawerOpen(false);
            setHistoryTarget(null);
          }}
          entityName={historyTarget?.name || 'biểu tượng'}
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
          itemType="biểu tượng trên bản đồ"
          itemName={deleteTarget?.name}
          itemCode={deleteTarget?.code}
        />
      </div>
    </ThemeTokenProvider>
  );
}
