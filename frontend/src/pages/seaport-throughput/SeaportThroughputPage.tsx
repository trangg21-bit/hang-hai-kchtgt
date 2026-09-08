/**
 * SeaportThroughputPage — màn hình Danh sách Sản lượng cảng biển (M-028 / F-301 seaport_throughput).
 *
 * Dùng bộ shared list-view (ScreenHeader / FilterTableLayout + StatusTabs / DataTable / Pagination);
 * bộ lọc đơn vị dạng cây (OrgUnitTreeSelect, value = orgUnitId); 6 tab trạng thái + Pill Badge;
 * Drawer tạo/sửa/xem chi tiết; phê duyệt 2 cấp + từ chối (lý do bắt buộc); lịch sử tập trung.
 * EN identifiers, VI labels/messages.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatePicker, Input, Modal, Form } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { ScreenHeader, FilterTableLayout, DataTable, Pagination } from '../../components/list-view';
import { SidebarFilterField } from '../../components/list-view';
import { FilterOrgUnitTreeSelect } from '../../components/org-unit';
import CommonHistoryDrawer from '../../components/shared/CommonHistoryDrawer';
import toast from '../../components/ToastNotification';
import { usePermissionStore, type PermissionState } from '../../store/permissionStore';
import seaportThroughputService, {
  type SeaportThroughputRecord,
  type SeaportApprovalStatus,
} from '../../services/seaportThroughputService';
import { organizationService, type Organization } from '../../services/organizationService';
import {
  TAB_DEFS,
  STATUS_META,
  HISTORY_FIELD_LABELS,
  EDITABLE_STATUSES,
  type ThroughputTabKey,
} from './seaportThroughputMeta';
import SeaportThroughputDrawer, { type SeaportDrawerMode } from './SeaportThroughputDrawer';
import {
  textPrimary,
  textSecondary,
  fontSizeMd,
  fontWeightBold,
  spaceFormField,
  filterInputStyle,
  statusBadgeStyle,
  getSidebarDatePickerProps,
  getSidebarRangePickerProps,
} from '../../themetokenchk';

const PAGE_SIZE = 10;
const HISTORY_PAGE_SIZE = 8;

/** Các trạng thái con cần đếm cho từng tab (tab Từ chối gộp 2 cấp). */
const COUNT_STATUSES: Array<{ key: ThroughputTabKey; statuses: SeaportApprovalStatus[] }> = [
  { key: 'DRAFT', statuses: ['DRAFT'] },
  { key: 'PENDING_APPROVAL', statuses: ['PENDING_APPROVAL'] },
  { key: 'APPROVED_LEVEL1', statuses: ['APPROVED_LEVEL1'] },
  { key: 'APPROVED', statuses: ['APPROVED'] },
  { key: 'REJECTED', statuses: ['REJECTED_LEVEL1', 'REJECTED_LEVEL2'] },
];

interface ListFilters {
  keyword: string;
  orgUnitId?: string;
  reportMonth?: string;
  updatedFrom?: string;
  updatedTo?: string;
}

const monthLabel = (value: string | undefined): string =>
  value ? dayjs(value, 'YYYY-MM').format('MM/YYYY') : '—';

const dateTimeLabel = (value: string | undefined): string =>
  value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';

/** Lấy các trạng thái con của một tab (tab Từ chối gộp 2 cấp). */
const statusesOfTab = (tab: ThroughputTabKey): SeaportApprovalStatus[] | undefined => {
  if (tab === 'all' || tab === 'REJECTED') return undefined;
  return [tab];
};

interface ActionRecord {
  id: string;
  status: SeaportApprovalStatus;
  orgUnitName?: string;
  reportMonth?: string;
  record: SeaportThroughputRecord;
}

const SeaportThroughputPage: React.FC = () => {
  const hasPermission = usePermissionStore((s: PermissionState) => s.hasPermission);
  const canCreate = hasPermission('seaportthroughput:create');
  const canUpdate = hasPermission('seaportthroughput:update');
  const canDelete = hasPermission('seaportthroughput:delete');
  const canSubmit = hasPermission('seaportthroughput:submit');
  const canApprove = hasPermission('seaportthroughput:approve');
  const canApproveLevel2 = hasPermission('seaportthroughput:approve_level2');
  const canReject = hasPermission('seaportthroughput:reject');

  // ── Organizations (cây đơn vị — DataScope) ───────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const orgNameMap = useMemo(() => {
    const m = new Map<string, string>();
    const walk = (items: Organization[]) => {
      for (const o of items) {
        if (o.id && o.name) m.set(o.id, o.name);
        if (Array.isArray((o as unknown as { children?: Organization[] }).children)) {
          walk((o as unknown as { children: Organization[] }).children);
        }
      }
    };
    walk(organizations);
    return m;
  }, [organizations]);

  useEffect(() => {
    let cancelled = false;
    organizationService
      .list({ pageSize: 1000 })
      .then((resp) => {
        if (!cancelled) setOrganizations(resp.data || []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Filters & list state ─────────────────────────────────────────
  const [filters, setFilters] = useState<ListFilters>({ keyword: '' });
  const [keywordInput, setKeywordInput] = useState('');
  const [orgFilter, setOrgFilter] = useState<string | undefined>();
  const [monthFilter, setMonthFilter] = useState<Dayjs | null>(null);
  const [rangeFilter, setRangeFilter] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [activeTab, setActiveTab] = useState<ThroughputTabKey>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [items, setItems] = useState<SeaportThroughputRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({
    all: 0,
    DRAFT: 0,
    PENDING_APPROVAL: 0,
    APPROVED_LEVEL1: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    const base: ListFilters = { ...filters };
    try {
      // 1) Nội dung trang hiện tại theo tab
      let fetchedItems: SeaportThroughputRecord[] = [];
      let fetchedTotal = 0;
      const isRejected = activeTab === 'REJECTED';
      if (isRejected) {
        const [r1, r2] = await Promise.all([
          seaportThroughputService.list({ ...base, approvalStatus: 'REJECTED_LEVEL1', page: 1, size: 100 }),
          seaportThroughputService.list({ ...base, approvalStatus: 'REJECTED_LEVEL2', page: 1, size: 100 }),
        ]);
        const merged = [...r1.items, ...r2.items].sort((a, b) =>
          String(b.updatedDate ?? '').localeCompare(String(a.updatedDate ?? '')),
        );
        fetchedTotal = r1.total + r2.total;
        fetchedItems = merged.slice((page - 1) * pageSize, page * pageSize);
      } else {
        const statuses = statusesOfTab(activeTab);
        const res = await seaportThroughputService.list({
          ...base,
          approvalStatus: statuses ? statuses[0] : undefined,
          page,
          size: pageSize,
        });
        fetchedItems = res.items;
        fetchedTotal = res.total;
      }
      // 2) Số lượng từng tab con (Tất cả = tổng)
      const countResults = await Promise.all(
        COUNT_STATUSES.map((c) =>
          c.statuses.length === 1
            ? seaportThroughputService
                .list({ ...base, approvalStatus: c.statuses[0], page: 1, size: 1 })
                .then((r) => ({ key: c.key, value: r.total }))
            : Promise.all(
                c.statuses.map((s) =>
                  seaportThroughputService.list({ ...base, approvalStatus: s, page: 1, size: 1 }).then((r) => r.total),
                ),
              ).then((totals) => ({ key: c.key, value: totals.reduce((a, b) => a + b, 0) })),
        ),
      );
      const nextCounts = { ...counts };
      countResults.forEach((c) => {
        nextCounts[c.key] = c.value;
      });
      const subTotal = COUNT_STATUSES.reduce((acc, c) => acc + nextCounts[c.key], 0);
      nextCounts.all = subTotal;
      setCounts(nextCounts);
      setItems(fetchedItems);
      setTotal(fetchedTotal);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, page, pageSize, counts]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const applyFilters = () => {
    const next: ListFilters = {
      keyword: keywordInput.trim(),
      orgUnitId: orgFilter,
      reportMonth: monthFilter ? monthFilter.format('YYYY-MM') : undefined,
      updatedFrom: rangeFilter?.[0] ? rangeFilter[0].format('YYYY-MM-DD') : undefined,
      updatedTo: rangeFilter?.[1] ? rangeFilter[1].format('YYYY-MM-DD') : undefined,
    };
    setFilters(next);
    setPage(1);
  };

  const resetFilters = () => {
    setKeywordInput('');
    setOrgFilter(undefined);
    setMonthFilter(null);
    setRangeFilter(null);
    setFilters({ keyword: '' });
    setPage(1);
  };

  // ── Drawer state ─────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<SeaportDrawerMode>('create');
  const [drawerRecord, setDrawerRecord] = useState<SeaportThroughputRecord | null>(null);

  const openCreate = () => {
    setDrawerMode('create');
    setDrawerRecord(null);
    setDrawerOpen(true);
  };

  const openView = (record: SeaportThroughputRecord) => {
    setDrawerMode('view');
    setDrawerRecord(record);
    setDrawerOpen(true);
  };

  const openEdit = (record: SeaportThroughputRecord) => {
    setDrawerMode('edit');
    setDrawerRecord(record);
    setDrawerOpen(true);
  };

  // ── Approval / delete modal state ────────────────────────────────
  const [actionTarget, setActionTarget] = useState<ActionRecord | null>(null);
  const [actionKind, setActionKind] = useState<'approve1' | 'approve2' | 'reject1' | 'reject2' | 'delete'>('approve1');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [actionContent, setActionContent] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<SeaportThroughputRecord | null>(null);
  const [historyRecords, setHistoryRecords] = useState<unknown[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate: string; toDate: string }>({
    keyword: '',
    fromDate: '',
    toDate: '',
  });
  const [historyPage, setHistoryPage] = useState(0);

  const reloadAfterMutation = useCallback(() => {
    void loadData();
  }, [loadData]);

  const openHistory = (record: SeaportThroughputRecord) => {
    setHistoryRecord(record);
    setHistoryRecords([]);
    setHistoryPage(0);
    setHistoryFilters({ keyword: '', fromDate: '', toDate: '' });
    setHistoryOpen(true);
  };

  const fetchHistoryPage = useCallback(
    async (nextPage: number, nextSize: number, extra?: { keyword?: string; fromDate?: string; toDate?: string }) => {
      if (!historyRecord) return [];
      const resp = (await seaportThroughputService.history(historyRecord.id).catch(() => undefined)) as
        | { changeHistory?: unknown[] }
        | undefined;
      if (!resp) return [];
      let rows = resp.changeHistory ?? [];
      const keyword = (extra?.keyword ?? '').trim().toLowerCase();
      if (keyword) {
        rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(keyword));
      }
      const from = extra?.fromDate ? dayjs(extra.fromDate) : undefined;
      const to = extra?.toDate ? dayjs(extra.toDate) : undefined;
      if (from || to) {
        rows = rows.filter((r) => {
          const t = dayjs((r as { createdAt?: string; timestamp?: string }).createdAt ?? (r as { timestamp?: string }).timestamp);
          if (!t.isValid()) return true;
          if (from && t.isBefore(from, 'day')) return false;
          if (to && t.isAfter(to, 'day')) return false;
          return true;
        });
      }
      return rows.slice(nextPage * nextSize, (nextPage + 1) * nextSize);
    },
    [historyRecord],
  );

  const loadMoreHistory = useCallback(async () => {
    if (!historyRecord) return;
    setHistoryLoadingMore(true);
    try {
      const next = await fetchHistoryPage(historyPage + 1, HISTORY_PAGE_SIZE, historyFilters);
      if (next.length > 0) {
        setHistoryRecords((prev) => [...prev, ...next]);
        setHistoryPage((p) => p + 1);
      }
    } finally {
      setHistoryLoadingMore(false);
    }
  }, [historyRecord, historyPage, fetchHistoryPage, historyFilters]);

  // ── Row actions ──────────────────────────────────────────────────
  const rowActions = (record: SeaportThroughputRecord) => {
    const status = record.approvalStatus;
    const actions: Array<{
      key: string;
      label: string;
      icon?: React.ReactNode;
      danger?: boolean;
      onClick: () => void;
    }> = [
      { key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => openView(record) },
    ];
    const editable = EDITABLE_STATUSES.includes(status);
    if (editable && canUpdate) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => openEdit(record) });
    }
    if (editable && canSubmit) {
      actions.push({
        key: 'submit',
        label: 'Gửi phê duyệt',
        icon: <SendOutlined />,
        onClick: () => {
          Modal.confirm({
            title: 'Gửi phê duyệt',
            content: 'Bạn có chắc chắn gửi phê duyệt số liệu sản lượng này?',
            okText: 'Gửi phê duyệt',
            cancelText: 'Hủy',
            onOk: async () => {
              try {
                await seaportThroughputService.submit(record.id);
                toast.success('Đã gửi phê duyệt');
                reloadAfterMutation();
              } catch {
                // interceptor toast
              }
            },
          });
        },
      });
    }
    if (status === 'PENDING_APPROVAL' && (canApprove || canReject)) {
      actions.push(
        ...(canApprove
          ? [
              {
                key: 'approve1',
                label: 'Phê duyệt cấp Cảng vụ/Chi cục',
                icon: <CheckCircleOutlined />,
                onClick: () => {
                  setActionTarget({ id: record.id, status, orgUnitName: record.orgUnitName, reportMonth: record.reportMonth, record });
                  setActionKind('approve1');
                  setActionContent('');
                  setActionReason('');
                },
              },
            ]
          : []),
        ...(canReject
          ? [
              {
                key: 'reject1',
                label: 'Từ chối cấp Cảng vụ/Chi cục',
                icon: <CloseCircleOutlined />,
                danger: true,
                onClick: () => {
                  setActionTarget({ id: record.id, status, orgUnitName: record.orgUnitName, reportMonth: record.reportMonth, record });
                  setActionKind('reject1');
                  setActionContent('');
                  setActionReason('');
                },
              },
            ]
          : []),
      );
    }
    if (status === 'APPROVED_LEVEL1' && (canApproveLevel2 || canReject)) {
      actions.push(
        ...(canApproveLevel2
          ? [
              {
                key: 'approve2',
                label: 'Ban hành (Cục)',
                icon: <CheckCircleOutlined />,
                onClick: () => {
                  setActionTarget({ id: record.id, status, orgUnitName: record.orgUnitName, reportMonth: record.reportMonth, record });
                  setActionKind('approve2');
                  setActionContent('');
                  setActionReason('');
                },
              },
            ]
          : []),
        ...(canReject
          ? [
              {
                key: 'reject2',
                label: 'Từ chối cấp Cục',
                icon: <CloseCircleOutlined />,
                danger: true,
                onClick: () => {
                  setActionTarget({ id: record.id, status, orgUnitName: record.orgUnitName, reportMonth: record.reportMonth, record });
                  setActionKind('reject2');
                  setActionContent('');
                  setActionReason('');
                },
              },
            ]
          : []),
      );
    }
    actions.push({
      key: 'history',
      label: 'Lịch sử',
      icon: <HistoryOutlined />,
      onClick: () => openHistory(record),
    });
    if (status === 'DRAFT' && canDelete) {
      actions.push({
        key: 'delete',
        label: 'Xóa',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: 'Xóa số liệu sản lượng',
            content: 'Bạn có chắc chắn xóa số liệu sản lượng này?',
            okText: 'Xóa',
            okButtonProps: { danger: true },
            cancelText: 'Hủy',
            onOk: async () => {
              try {
                await seaportThroughputService.softDelete(record.id);
                toast.success('Đã xóa số liệu sản lượng');
                reloadAfterMutation();
              } catch {
                // interceptor toast
              }
            },
          });
        },
      });
    }
    return actions;
  };

  const isRejectAction = actionKind === 'reject1' || actionKind === 'reject2';
  const isApproveAction = actionKind === 'approve1' || actionKind === 'approve2';

  const runAction = async () => {
    if (!actionTarget) return;
    if (isRejectAction && !actionReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối');
      return;
    }
    setActionBusy(true);
    try {
      const { id } = actionTarget;
      if (actionKind === 'approve1') await seaportThroughputService.approveLevel1(id, actionContent);
      if (actionKind === 'approve2') await seaportThroughputService.approveLevel2(id, actionContent);
      // Reject: endpoint chung /reject — backend suy cấp từ trạng thái bản ghi (design §3).
      if (actionKind === 'reject1' || actionKind === 'reject2') {
        await seaportThroughputService.reject(id, actionReason.trim());
      }
      if (actionKind === 'delete') await seaportThroughputService.softDelete(id);
      toast.success(
        actionKind === 'delete'
          ? 'Đã xóa số liệu sản lượng'
          : isRejectAction
            ? 'Đã từ chối phê duyệt'
            : 'Đã phê duyệt số liệu sản lượng',
      );
      setActionTarget(null);
      setActionReason('');
      setActionContent('');
      reloadAfterMutation();
    } catch {
      // interceptor toast
    } finally {
      setActionBusy(false);
    }
  };

  const closeActionModal = () => {
    if (actionBusy) return;
    setActionTarget(null);
    setActionReason('');
    setActionContent('');
    setRejectError('');
  };

  // ── Table columns ────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        title: 'Đơn vị quản lý',
        dataIndex: 'orgUnitName',
        key: 'orgUnitName',
        width: 260,
        ellipsis: true,
        render: (_: unknown, record: SeaportThroughputRecord) =>
          record.orgUnitName || orgNameMap.get(record.orgUnitId) || '—',
      },
      {
        title: 'Thời gian tổng hợp',
        dataIndex: 'reportMonth',
        key: 'reportMonth',
        width: 170,
        render: (value: string | undefined) => monthLabel(value),
      },
      {
        title: 'Cán bộ cập nhật',
        dataIndex: 'updatedByName',
        key: 'updatedByName',
        width: 180,
        ellipsis: true,
        render: (_: unknown, record: SeaportThroughputRecord) => record.updatedByName || record.updatedBy || '—',
      },
      {
        title: 'Ngày cập nhật',
        dataIndex: 'updatedDate',
        key: 'updatedDate',
        width: 170,
        render: (value: string | undefined) => dateTimeLabel(value),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 200,
        render: (status: SeaportApprovalStatus) => {
          const meta = STATUS_META[status];
          return meta ? <span style={statusBadgeStyle(meta.color)}>{meta.label}</span> : '—';
        },
      },
    ],
    [orgNameMap],
  );

  const statusTabs = useMemo(
    () =>
      TAB_DEFS.map((t) => ({
        key: t.key,
        label: t.label,
        count: counts[t.key],
        color: t.color,
        active: t.key === activeTab,
      })),
    [counts, activeTab],
  );

  const filterContent = (
    <div>
      <SidebarFilterField label="Tìm kiếm từ khóa">
        <Input
          allowClear
          placeholder="Nhập từ khóa..."
          value={keywordInput}
          style={{ ...filterInputStyle, borderRadius: 999, height: 40 }}
          onChange={(e) => setKeywordInput(e.target.value)}
          onPressEnter={() => applyFilters()}
        />
      </SidebarFilterField>
      <SidebarFilterField label="Đơn vị quản lý">
        <FilterOrgUnitTreeSelect
          organizations={organizations}
          value={orgFilter}
          onChange={(v?: string) => setOrgFilter(v)}
          placeholder="Tất cả"
        />
      </SidebarFilterField>
      <SidebarFilterField label="Thời gian tổng hợp">
        <DatePicker
          {...getSidebarDatePickerProps({ style: { width: '100%' } })}
          picker="month"
          format="MM/YYYY"
          placeholder="Tất cả"
          value={monthFilter}
          onChange={(v) => setMonthFilter(v)}
        />
      </SidebarFilterField>
      <SidebarFilterField label="Ngày cập nhật">
        <DatePicker.RangePicker
          {...getSidebarRangePickerProps({ style: { width: '100%' } })}
          format="DD/MM/YYYY"
          value={rangeFilter}
          onChange={(v) => setRangeFilter(v)}
        />
      </SidebarFilterField>
    </div>
  );

  const actionModalTitle = isRejectAction
    ? actionKind === 'reject1'
      ? 'Từ chối phê duyệt cấp Cảng vụ/Chi cục'
      : 'Từ chối phê duyệt cấp Cục'
    : actionKind === 'approve2'
      ? 'Ban hành số liệu sản lượng'
      : 'Phê duyệt số liệu sản lượng';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <ScreenHeader
        breadcrumbs={[{ label: 'Danh mục chức năng', path: '/' }, { label: 'Sản lượng cảng biển' }]}
        title="Sản lượng cảng biển"
        actions={
          canCreate
            ? [
                {
                  key: 'add',
                  label: 'Thêm mới',
                  icon: <PlusOutlined />,
                  variant: 'primary',
                  onClick: openCreate,
                },
              ]
            : undefined
        }
      />
      <div style={{ flex: 1, minHeight: 0, padding: '0 16px 16px' }}>
        <FilterTableLayout
          hideFilterToggle
          filterContent={filterContent}
          statusTabs={statusTabs}
          onStatusTabChange={(key) => {
            setActiveTab(key as ThroughputTabKey);
            setPage(1);
          }}
          onFilterApply={applyFilters}
          onFilterReset={resetFilters}
          loading={loading}
          error={error}
          onRetry={() => void loadData()}
        >
          <DataTable
            columns={columns}
            dataSource={items}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            scroll={{ x: 'max-content' }}
          />
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </FilterTableLayout>
      </div>

      {/* ── Drawer tạo / sửa / xem ─────────────────────────────── */}
      <SeaportThroughputDrawer
        open={drawerOpen}
        mode={drawerMode}
        record={drawerRecord}
        organizations={organizations}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          reloadAfterMutation();
        }}
      />

      {/* ── Modal phê duyệt / từ chối / xóa ────────────────────── */}
      <Modal
        open={Boolean(actionTarget)}
        title={<span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{actionModalTitle}</span>}
        okText={actionKind === 'delete' ? 'Xóa' : isRejectAction ? 'Từ chối' : isApproveAction ? (actionKind === 'approve2' ? 'Ban hành' : 'Phê duyệt') : ''}
        cancelText="Hủy"
        okButtonProps={{ danger: actionKind === 'delete' || isRejectAction }}
        confirmLoading={actionBusy}
        onOk={() => void runAction()}
        onCancel={closeActionModal}
      >
        {actionTarget ? (
          <div style={{ color: textSecondary, fontSize: fontSizeMd, marginBottom: spaceFormField }}>
            Đơn vị: {actionTarget.orgUnitName || '—'} — Kỳ: {monthLabel(actionTarget.reportMonth)}
          </div>
        ) : null}
        {isRejectAction ? (
          <Form layout="vertical" requiredMark={false}>
            <Form.Item
              label="Lý do từ chối"
              required
              validateStatus={rejectError ? 'error' : undefined}
              help={rejectError || undefined}
              style={{ marginBottom: spaceFormField }}
            >
              <Input.TextArea
                rows={3}
                value={actionReason}
                placeholder="Nhập lý do từ chối"
                onChange={(e) => {
                  setActionReason(e.target.value);
                  if (rejectError) setRejectError('');
                }}
              />
            </Form.Item>
          </Form>
        ) : isApproveAction ? (
          <Form layout="vertical" requiredMark={false}>
            <Form.Item label="Nội dung phê duyệt" style={{ marginBottom: spaceFormField }}>
              <Input.TextArea
                rows={3}
                value={actionContent}
                placeholder="Nhập nội dung phê duyệt (không bắt buộc)"
                onChange={(e) => setActionContent(e.target.value)}
              />
            </Form.Item>
          </Form>
        ) : null}
      </Modal>

      {/* ── Lịch sử thay đổi (bảng infrastructure_history tập trung) ── */}
      <CommonHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entityName={historyRecord ? `Sản lượng cảng biển — ${historyRecord.orgUnitName || ''} (${monthLabel(historyRecord.reportMonth)})` : undefined}
        records={historyRecords as never}
        loading={historyLoading}
        serverFiltered
        onFilterChange={setHistoryFilters}
        onLoadMore={() => void loadMoreHistory()}
        loadingMore={historyLoadingMore}
        fieldLabelMap={HISTORY_FIELD_LABELS}
        formatValue={(field, value) => {
          if (field === 'orgUnitId') return orgNameMap.get(String(value)) || String(value);
          if (field === 'reportMonth') return monthLabel(String(value));
          return String(value ?? '');
        }}
      />

      {/* Trigger tải lịch sử khi mở drawer lần đầu / đổi bộ lọc */}
      <HistoryLoader
        open={historyOpen}
        recordId={historyRecord?.id}
        historyFilters={historyFilters}
        setHistoryRecords={setHistoryRecords}
        setHistoryLoading={setHistoryLoading}
        setHistoryPage={setHistoryPage}
        fetchPage={fetchHistoryPage}
        orgUnitName={historyRecord?.orgUnitName}
      />
    </div>
  );
};

/** Helper riêng: nạp trang đầu lịch sử khi mở hoặc khi bộ lọc đổi (giữ logic tách khỏi render). */
interface HistoryLoaderProps {
  open: boolean;
  recordId?: string;
  historyFilters: { keyword: string; fromDate: string; toDate: string };
  setHistoryRecords: (records: unknown[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  setHistoryPage: (page: number) => void;
  fetchPage: (page: number, size: number, filters?: { keyword?: string; fromDate?: string; toDate?: string }) => Promise<unknown[]>;
  orgUnitName?: string;
}

const HistoryLoader: React.FC<HistoryLoaderProps> = ({
  open,
  recordId,
  historyFilters,
  setHistoryRecords,
  setHistoryLoading,
  setHistoryPage,
  fetchPage,
}) => {
  useEffect(() => {
    if (!open || !recordId) return;
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryPage(0);
    (async () => {
      try {
        const rows = await fetchPage(0, HISTORY_PAGE_SIZE, historyFilters);
        if (!cancelled) setHistoryRecords(rows);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, recordId, historyFilters, setHistoryRecords, setHistoryLoading, setHistoryPage, fetchPage]);
  return null;
};

export default SeaportThroughputPage;
