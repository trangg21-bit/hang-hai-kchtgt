import { useState, useCallback, useEffect, useMemo } from 'react';
import { Input, Select, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { message } from '../../components/ToastNotification';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { userService } from '../../services/userService';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import EmptyState from '../../components/EmptyState';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { usePermissionStore } from '../../store/permissionStore';
import type { NavigationChannelResponse, ListParams, ApprovalStatus } from '../../types/navigationChannel';
import { CONDITION_STATUS_OPTIONS, CONDITION_STATUS_MAP } from '../../types/navigationChannel';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import {
  statusOperational,
  statusCritical,
  statusAttention,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  statusBadgeStyle,
  cellTitleStyle,
  cellSubtitleStyle,
  icons,
  filterInputStyle,
  filterLabelStyle,
  spaceFormField,
  spaceXs,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import NavigationChannelForm from './NavigationChannelForm';
import { canDeleteApprovalRecord, canEditApprovalRecord } from '../../utils/approvalEditPolicy';

// ── #8 Tình trạng — màu badge theo token ─────────────────────────────
const CONDITION_STATUS_STYLE_MAP: Record<string, { label: string; color: string }> = {
  OPERATIONAL: { label: 'Đang hoạt động', color: statusOperational },
  STOPPED: { label: 'Dừng hoạt động', color: statusCritical },
  MAINTENANCE: { label: 'Đang bảo trì', color: statusAttention },
  UNDER_CONSTRUCTION: { label: 'Đang xây dựng', color: statusDraft },
};

// ── #47 Trạng thái — tabs theo trạng thái phê duyệt ──────────────────
const STATUS_TAB_LIST = [
  { key: 'all', label: 'Tất cả', statuses: [] as string[] },
  // Nhãn theo 7 trạng thái chuẩn — approval-2-level-spec.md mục 3.1/3.10
  { key: 'DRAFT', label: 'Lưu tạm', statuses: ['DRAFT'] },
  { key: 'PENDING_APPROVAL', label: 'Chờ Cảng vụ duyệt', statuses: ['PENDING_APPROVAL'] },
  { key: 'APPROVED_LEVEL1', label: 'Chờ Cục duyệt', statuses: ['APPROVED_LEVEL1'] },
  { key: 'APPROVED', label: 'Đã duyệt', statuses: ['APPROVED'] },
  { key: 'REJECTED', label: 'Từ chối', statuses: ['REJECTED', 'REJECTED_LEVEL1', 'REJECTED_LEVEL2'] },
];

// ── F-039/F-040 — Gating nút Sửa theo trạng thái phê duyệt ─────────────
// Dùng chung `canEditApprovalRecord` (quy tắc 12 — approval-2-level-spec.md mục 3.9).
// Bảng EDITABLE_APPROVAL_STATUSES cũ của F-039 ngược quy tắc nền: cho sửa khi hồ sơ
// đang `PENDING_APPROVAL`/`APPROVED_LEVEL1` và cấm sửa khi `APPROVED` (mất T12).

const TAB_COLOR: Record<string, string> = {
  all: textSecondary,
  DRAFT: statusDraft,
  PENDING_APPROVAL: statusAttention,
  APPROVED_LEVEL1: actionPrimary,
  APPROVED: statusOperational,
  REJECTED: statusCritical,
};

export default function NavigationChannelList() {
  const isInIframe = window.self !== window.top;
  const hasPerm = useCallback((key: string) => usePermissionStore.getState().hasPermission(key), []);

  // ── Filters (DS/Lọc: #1/#2/#4/#5/#6/#8/#47/#48) ────────────────────
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterChannelCode, setFilterChannelCode] = useState('');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterSeaportId, setFilterSeaportId] = useState<string | undefined>();
  const [filterProvinceId, setFilterProvinceId] = useState<string | undefined>();
  const [filterConditionStatus, setFilterConditionStatus] = useState<string | undefined>();
  const [filterUpdatedBy, setFilterUpdatedBy] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [dataSource, setDataSource] = useState<NavigationChannelResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // ── Dropdown data ───────────────────────────────────────────────────
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [seaportOptions, setSeaportOptions] = useState<{ id: string; portCode?: string; portName?: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);

  // ── Modal (create / edit / detail) ──────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');

  useEffect(() => {
    if (isInIframe) return;
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        setOrganizations(orgs || []);
      } catch (err) {
        console.error('Không tải được cây đơn vị quản lý', err);
      }
      try {
        const ports = await vtsSystemCRUD.getScopedPortOptions();
        setSeaportOptions(ports || []);
      } catch (err) {
        console.error('Không tải được danh sách cảng biển', err);
      }
      try {
        const resp: any = await userService.list({ pageSize: 1000 });
        const users = resp?.data || resp?.content || [];
        setUserOptions(users.map((u: any) => ({ value: u.id, label: u.fullName || u.username || u.id })));
      } catch (err) {
        console.error('Không tải được danh sách cán bộ', err);
      }
    })();
  }, [isInIframe]);

  // ── Fetch list ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const activeTabDef = STATUS_TAB_LIST.find((t) => t.key === activeTab);
      const params: ListParams = {
        page: page - 1,
        size: pageSize,
        keyword: filterKeyword.trim() || undefined,
        channelCode: filterChannelCode.trim() || undefined,
        orgUnitId: filterOrgUnitId,
        seaportId: filterSeaportId,
        provinceId: filterProvinceId ? Number(filterProvinceId) : undefined,
        conditionStatus: filterConditionStatus as any,
        approvalStatus: activeTabDef && activeTabDef.statuses.length === 1 ? activeTabDef.statuses[0] : undefined,
        updatedFrom: filterUpdatedFrom || undefined,
        updatedTo: filterUpdatedTo || undefined,
        updatedBy: filterUpdatedBy,
        sortField,
        sortOrder: sortOrder || undefined,
      };
      const res = await navigationChannelCRUD.search(params);
      setDataSource(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setTotal(0);
      setDataSource([]);
      console.error('Lỗi tải danh sách luồng hàng hải', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, activeTab, filterKeyword, filterChannelCode, filterOrgUnitId, filterSeaportId, filterProvinceId, filterConditionStatus, filterUpdatedFrom, filterUpdatedTo, filterUpdatedBy, sortField, sortOrder]);

  // ── Tab counts ──────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        STATUS_TAB_LIST.map((tab) =>
          Promise.all(
            tab.statuses.map((s) =>
              navigationChannelCRUD.search({ approvalStatus: s, page: 0, size: 1 }).then((r) => r.total),
            ),
          ).then((totals) => totals.reduce((sum, n) => sum + n, 0)),
        ),
      );
      const next: Record<string, number> = {};
      STATUS_TAB_LIST.forEach((tab, i) => {
        next[tab.key] = results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<number>).value : 0;
      });
      setTabCounts(next);
    } catch (err) {
      console.error('Không tính được số lượng theo trạng thái', err);
    }
  }, []);

  useEffect(() => { if (!isInIframe) { void fetchData(); void fetchCounts(); } }, [fetchData, fetchCounts, isInIframe]);

  // ── Filter handlers ─────────────────────────────────────────────────
  const handleFilterApply = useCallback(() => { setPage(1); }, []);
  const handleFilterReset = useCallback(() => {
    setFilterKeyword('');
    setFilterChannelCode('');
    setFilterOrgUnitId(undefined);
    setFilterSeaportId(undefined);
    setFilterProvinceId(undefined);
    setFilterConditionStatus(undefined);
    setFilterUpdatedBy(undefined);
    setFilterUpdatedFrom('');
    setFilterUpdatedTo('');
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  const handleSort = useCallback((key: string, order: 'asc' | 'desc') => {
    setSortField(key);
    setSortOrder(order);
    setPage(1);
  }, []);

  const refreshAfterMutation = useCallback(() => {
    void fetchData();
    void fetchCounts();
  }, [fetchData, fetchCounts]);

  const openModal = useCallback((mode: 'create' | 'edit' | 'detail', id?: string) => {
    setModalMode(mode);
    setEditingId(id || null);
    setIsModalOpen(true);
  }, []);

  // Map user id → tên hiển thị cho cột "Cán bộ cập nhật" (backend NavigationChannel chưa trả updatedByName như các module khác)
  const userMap = useMemo(() => {
    const m = new Map<string, string>();
    userOptions.forEach((o) => { m.set(o.value, o.label); });
    return m;
  }, [userOptions]);

  // ── Columns (DS scope: #5/#4/#2/#1/#6/#8/#47/#48) ───────────────────
  const columns = useMemo(() => {
    const orgLabel = (orgUnitId?: string) => orgUnitId || '—';
    const seaportLabel = (seaportId?: string) => {
      if (!seaportId) return '—';
      const p = seaportOptions.find((o) => o.id === seaportId);
      return p ? (p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || seaportId) : seaportId;
    };
    const provinceLabel = (provinceId?: number) =>
      provinceId != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(provinceId))?.label || String(provinceId)) : '—';
    return [
      {
        key: 'stt',
        label: 'STT',
        width: 60,
        align: 'center' as const,
        fixed: 'left' as const,
        render: (_: unknown, __: unknown, idx?: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + (idx ?? 0) + 1}</span>,
      },
      {
        key: 'channelName',
        label: 'Tên/Mã luồng hàng hải',
        dataIndex: 'channelName',
        width: 260,
        fixed: 'left' as const,
        sortable: true,
        ellipsis: false,
        render: (v: string | undefined, record: NavigationChannelResponse) => (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <a
              title={v || ''}
              onClick={() => openModal('detail', record.id)}
              style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {v || '—'}
            </a>
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.channelCode || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'seaportId',
        label: 'Thuộc cảng biển',
        dataIndex: 'seaportId',
        width: 180,
        ellipsis: true,
        render: (v: string | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{seaportLabel(v)}</span>,
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 200,
        ellipsis: true,
        render: (v: string | undefined, record: NavigationChannelResponse) => (
          <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{record.orgUnitName || orgLabel(v)}</span>
        ),
      },
      {
        key: 'provinceId',
        label: 'Địa điểm Tỉnh/TP',
        dataIndex: 'provinceId',
        width: 150,
        render: (v: number | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{provinceLabel(v)}</span>,
      },
      {
        key: 'conditionStatus',
        label: 'Tình trạng',
        dataIndex: 'conditionStatus',
        width: 150,
        sortable: true,
        render: (v: string | undefined) => {
          if (!v) return <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>;
          const s = CONDITION_STATUS_STYLE_MAP[v] || { label: CONDITION_STATUS_MAP[v as keyof typeof CONDITION_STATUS_MAP] || v, color: textTertiary };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        },
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 160,
        render: (v: ApprovalStatus) => (v ? <ApprovalStatusBadge status={v} /> : '—'),
      },
      {
        key: 'updatedAt',
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedAt',
        width: 220,
        sortable: true,
        ellipsis: false,
        render: (v: string | undefined, record: NavigationChannelResponse) => {
          const name = record.updatedBy ? userMap.get(record.updatedBy) : undefined;
          return (
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name || record.updatedBy || ''}>
              <div style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name || record.updatedBy || '—'}
              </div>
              <div style={{ fontSize: fontSizeSm, color: textTertiary }}>{v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—'}</div>
            </div>
          );
        },
      },
    ];
  }, [page, pageSize, seaportOptions, openModal, userMap]);

  const rowActions = useCallback(
    (record: NavigationChannelResponse) => {
      const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
      if (hasPerm('navigationchannel:read')) {
        actions.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openModal('detail', record.id) });
      }
      if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'navigationchannel' })) {
        actions.push({ key: 'edit', label: 'Sửa', icon: icons.edit, onClick: () => openModal('edit', record.id) });
      }
      // Quy tắc 11 (approval-2-level-spec.md mục 3.6): chỉ xóa được hồ sơ Lưu tạm.
      // Trước đây gating ngược — chỉ hiện nút Xóa khi hồ sơ đã `APPROVED`.
      if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'navigationchannel' })) {
        actions.push({
          key: 'delete',
          label: 'Xóa',
          icon: icons.delete,
          danger: true,
          onClick: () => {
            void (async () => {
              try {
                await navigationChannelCRUD.delete(record.id);
                message.success('Xóa thành công');
                refreshAfterMutation();
              } catch (err) {
                message.error(`Lỗi xóa: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
              }
            })();
          },
        });
      }
      return actions;
    },
    [hasPerm, refreshAfterMutation, openModal],
  );

  // ── Filter panel (FilterTableLayout renders the sidebar) ────────────
  const filterContent = (
    <>
      <div style={{ marginBottom: spaceFormField, marginTop: 16 }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Đơn vị quản lý</div>
        <OrgUnitTreeSelect
          organizations={organizations}
          placeholder="Chọn đơn vị..."
          allowClear
          showSearch
          value={filterOrgUnitId}
          onChange={(v) => { setFilterOrgUnitId(v || undefined); setPage(1); }}
          style={filterInputStyle}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Thuộc cảng biển</div>
        <Select
          placeholder="Chọn cảng biển..."
          allowClear
          showSearch
          optionFilterProp="label"
          value={filterSeaportId}
          onChange={(v) => { setFilterSeaportId(v); setPage(1); }}
          options={seaportOptions.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id }))}
          style={filterInputStyle}
        />
      </div>
      <div style={{ marginBottom: spaceFormField }}>
        <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Tên luồng</div>
        <Input
          placeholder="Tìm theo tên luồng..."
          allowClear
          value={filterKeyword}
          onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply}
          style={filterInputStyle}
        />
      </div>

      {filterCollapsed && (
        <>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Mã luồng</div>
            <Input
              placeholder="Nhập mã luồng..."
              allowClear
              value={filterChannelCode}
              onChange={(e) => { setFilterChannelCode(e.target.value); setPage(1); }}
              onPressEnter={handleFilterApply}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Địa điểm Tỉnh/TP</div>
            <Select
              placeholder="Chọn tỉnh/thành phố..."
              allowClear
              showSearch
              optionFilterProp="label"
              value={filterProvinceId}
              onChange={(v) => { setFilterProvinceId(v); setPage(1); }}
              options={VIETNAM_PROVINCE_OPTIONS}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Tình trạng</div>
            <Select
              placeholder="Chọn tình trạng"
              allowClear
              value={filterConditionStatus}
              onChange={(v) => { setFilterConditionStatus(v); setPage(1); }}
              options={CONDITION_STATUS_OPTIONS}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Cán bộ cập nhật</div>
            <Select
              placeholder="Chọn cán bộ cập nhật"
              allowClear
              showSearch
              value={filterUpdatedBy}
              onChange={(v) => { setFilterUpdatedBy(v || undefined); setPage(1); }}
              options={userOptions}
              style={filterInputStyle}
            />
          </div>
          <div style={{ marginBottom: spaceFormField }}>
            <div style={{ ...filterLabelStyle, marginBottom: spaceXs }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              value={filterUpdatedFrom && filterUpdatedTo ? [dayjs(filterUpdatedFrom), dayjs(filterUpdatedTo)] : null}
              onChange={(range) => {
                setFilterUpdatedFrom(range && range[0] ? range[0].format('YYYY-MM-DD') : '');
                setFilterUpdatedTo(range && range[1] ? range[1].format('YYYY-MM-DD') : '');
                setPage(1);
              }}
              style={filterInputStyle}
            />
          </div>
        </>
      )}
    </>
  );

  const statusTabs = STATUS_TAB_LIST.map((tab) => ({
    key: tab.key,
    label: tab.label,
    count: tabCounts[tab.key] ?? 0,
    color: TAB_COLOR[tab.key],
    active: activeTab === tab.key,
  }));

  const headerActions = useMemo(
    () =>
      hasPerm('navigationchannel:create')
        ? [{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => openModal('create') }]
        : [],
    [hasPerm, openModal],
  );

  const tableData = useMemo(
    () => dataSource.map((item, idx) => ({ ...item, key: item.id, _rowIndex: (page - 1) * pageSize + idx + 1 })),
    [dataSource, page, pageSize],
  );

  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader
        breadcrumb={[{ label: 'KCHT hàng hải' }, { label: 'Luồng hàng hải' }]}
        actions={headerActions}
      />

      <FilterTableLayout
        filterContent={filterContent}
        statusTabs={statusTabs}
        onStatusTabChange={handleTabChange}
        onFilterApply={handleFilterApply}
        onFilterReset={handleFilterReset}
        filterCollapsed={filterCollapsed}
        onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        loading={isLoading}
        error={isError}
        onRetry={() => void fetchData()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <DataTable
            fill
            columns={columns}
            dataSource={tableData}
            rowKey="id"
            rowActions={rowActions}
            onSort={handleSort}
            scroll={{ x: 'max-content', y: 400 }}
            emptyState={<EmptyState description="Không có dữ liệu luồng hàng hải nào phù hợp với bộ lọc" />}
          />
          <div style={{ height: 55, overflow: 'visible', marginBottom: 8 }}>
            <Pagination
              total={total}
              current={page}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        </div>
      </FilterTableLayout>

      <NavigationChannelForm
        open={isModalOpen}
        editId={editingId}
        mode={modalMode}
        onCancel={() => { setIsModalOpen(false); setEditingId(null); }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingId(null);
          refreshAfterMutation();
        }}
      />
    </div>
    </ThemeTokenProvider>
  );
}
