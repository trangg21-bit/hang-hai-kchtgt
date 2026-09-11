import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button, Modal, Input, Space, DatePicker, Radio, Select,
  Form,
} from 'antd';
import {
  HistoryOutlined, SearchOutlined, PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import {
  type DryPort,
  fetchDryPortList,
  fetchDryPortById,
  deleteDryPort,
  approveDryPort,
  rejectDryPort,
  fetchDryPortHistory,
  fetchDryPortAllHistory,
  fetchDryPortAttachmentList,
  PORT_STATUS_OPTIONS,
  REGION_OPTIONS,
  trangThaiPheDuyetBadge,
  trangThaiHoatDongBadge,
  ddToDms,
} from './dry-port';
import DryPortDetailContent from './DryPortDetailContent';
import DryPortForm, { type DryPortFormHandle } from './DryPortForm';
import { OrgUnitTreeSelect, FilterOrgUnitTreeSelect, resolveDefaultOrgUnitId } from '../../components/org-unit';
import { userService } from '../../services/userService';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterTableLayout, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { renderStandardHistoryCards, isBlankOrDash } from '../../utils/changeHistoryRenderer';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';
import AppDrawer from '../../components/shared/AppDrawer';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import {
  statusOperational,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeMd,
  fontSizeLg,
  fontSizeSm,
  fontWeightBold,
  radiusPill,
  borderDefault,
  spaceSm,
  spaceMd,
  spaceFormField,
  spaceXl,
  drawerTitleStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  cellTitleStyle,
  cellSubtitleStyle,
  icons,
  colors,
  getRangePickerProps,
  formatUserDisplayName,
  isUuidString,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalModal from '../../components/shared/ApprovalModal';

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

const HISTORY_FIELD_LABELS: Record<string, string> = {
  orgUnitId: 'Đơn vị quản lý',
  dryPortCode: 'Mã cảng cạn',
  dryPortName: 'Tên cảng cạn',
  provinceId: 'Địa điểm (Tỉnh/Thành Phố)',
  operatingUnit: 'Đơn vị khai thác',
  region: 'Khu vực',
  detailedLocation: 'Địa điểm chi tiết',
  transportCorridor: 'Hành lang vận tải',
  area: 'Tổng diện tích cảng (m2)',
  warehouseArea: 'Diện tích kho (m2)',
  yardArea: 'Diện tích bãi (m2)',
  teuCapacity: 'Công suất khai thác',
  connectionMode: 'Phương thức kết nối giao thông',
  portStatus: 'Tình trạng',
  operationalStatus: 'Trạng thái hoạt động',
  announcementTime: 'Thời điểm công bố mở',
  announcementDecisionNumber: 'Quyết định công bố số',
  announcementDecisionDate: 'Ngày ra quyết định công bố',
  announcementOrg: 'Đơn vị ra quyết định công bố',
  remarks: 'Ghi chú',
  mapSymbolId: 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  approvalStatus: 'Trạng thái phê duyệt',
};

function historyFieldName(field: string): string {
  return HISTORY_FIELD_LABELS[field] || field;
}

function normalizeHistoryKey(key: string): string {
  return (key || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function historyFieldValue(field: string, val: string | null | undefined, orgMap: Map<string, string>, symbolMap: Map<string, string>): string {
  if (val === null || val === undefined || val === '' || val === 'null') return '';
  if (field === 'orgUnitId') return orgMap.get(val) || val;
  if (field === 'mapSymbolId') return symbolMap.get(val) || val;
  if (field === 'provinceId') {
    const pIdx = parseInt(val, 10);
    if (!isNaN(pIdx) && pIdx >= 1 && pIdx <= VIETNAM_PROVINCES.length) return VIETNAM_PROVINCES[pIdx - 1];
    return val;
  }
  if (field === 'portStatus') {
    const s = parseInt(val, 10);
    return s === 1 ? 'Đang khai thác/vận hành' : s === 0 ? 'Chưa khai thác/vận hành' : s === 2 ? 'Dừng khai thác/vận hành' : val;
  }
  if (field === 'approvalStatus') return trangThaiPheDuyetBadge(val).label;
  return val;
}

/* ───────────────────────────────────────────────
   Main Component: DryPortListPage
   ─────────────────────────────────────────────── */
export default function DryPortListPage() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get('action');
  const linkedRecordId = searchParams.get('id');
  const isEmbeddedAction = window.self !== window.top
    && (linkedAction === 'detail' || linkedAction === 'edit')
    && !!linkedRecordId;
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>(undefined);
  const [filterProvince, setFilterProvince] = useState<number | undefined>();
  const [filterRegion, setFilterRegion] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [filterCode, setFilterCode] = useState<string | undefined>();
  const [filterTransportCorridor, setFilterTransportCorridor] = useState<string | undefined>();

  const [sortField, setSortField] = useState<string | undefined>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | undefined>('descend');

  const [dataSource, setDataSource] = useState<DryPort[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DryPort | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DryPort | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<DryPort | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<DryPort | null>(null);

  // ── History state ──
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<DryPort | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearchInput, setHistorySearchInput] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  const historyFieldCount = useMemo(() => historyRecords.length, [historyRecords]);

  const openHistory = useCallback(async (r: DryPort) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistorySearchInput('');
    setHistorySearch('');
    setHistoryFrom('');
    setHistoryTo('');
    setHistoryMode('current');
    try {
      const d = await fetchDryPortHistory(r.id, { page: 0, size: 200 });
      setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : Array.isArray(d) ? d : []);
    } catch {
      toast.error('Không thể tải lịch sử thay đổi');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'dryPortCode', 'dryPortName', 'provinceId', 'operatingUnit',
    'region', 'detailedLocation', 'transportCorridor', 'area', 'warehouseArea',
    'yardArea', 'teuCapacity', 'connectionMode', 'portStatus', 'operationalStatus',
    'announcementTime', 'announcementDecisionNumber', 'announcementDecisionDate',
    'announcementOrg', 'remarks', 'mapSymbolId', 'coordinateSystem', 'displayRule',
    'approvalStatus',
  ];

  const renderDryPortHistoryTimeline = (records: any[]) => {
    const q = historySearch.toLowerCase().trim();
    const filtered = (records || []).filter((r: any) => {
      if (q) {
        const fn = (r.fieldName || r.changedField || '').toLowerCase();
        const ov = (r.oldValue || r.previousValue || '').toLowerCase();
        const nv = (r.newValue || r.value || '').toLowerCase();
        const lb = historyFieldName(r.fieldName || r.changedField || '').toLowerCase();
        const od = historyFieldValue(r.fieldName || r.changedField, r.oldValue || r.previousValue, orgMap, symbolMap).toLowerCase();
        const nd = historyFieldValue(r.fieldName || r.changedField, r.newValue || r.value, orgMap, symbolMap).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) return false;
      }
      if (historyEntityFilter && r.entityId !== historyEntityFilter) return false;
      if (historyFrom || historyTo) {
        const cd = (r.changedAt || r.createdAt || r.approvedDate || '').substring(0, 16);
        if (historyFrom && cd < historyFrom.replace(' ', 'T')) return false;
        if (historyTo && cd > historyTo.replace(' ', 'T') + ':59') return false;
      }
      return true;
    });

    return renderStandardHistoryCards({
      records: filtered,
      fieldLabels: HISTORY_FIELD_LABELS,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => {
        if (fn === 'mapSymbolId' && raw && !isBlankOrDash(raw)) {
          const img = symbolImageMap.get(raw);
          const name = symbolMap.get(raw) || raw;
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
              {name}
            </span>
          );
        }
        const formatted = historyFieldValue(fn, raw, orgMap, symbolMap);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const orgId = rec.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : (rec.orgUnitName || rec.unitName)) || '';
      },
      emptyMessage: q || historyFrom ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
  const [formEditId, setFormEditId] = useState<string | undefined>();
  const [editingName, setEditingName] = useState<string | undefined>();
  const [editingRecord, setEditingRecord] = useState<DryPort | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const createFormRef = useRef<DryPortFormHandle>(null);
  const updateFormRef = useRef<DryPortFormHandle>(null);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => map.set(o.id, o.code ? `${o.code} - ${o.name}` : o.name));
    return map;
  }, [organizations]);

  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const defaultOrgApplied = useRef(false);
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const [orgUnitReady, setOrgUnitReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await organizationService.list({ pageSize: 1000 });
        const orgs = r.data || [];
        setOrganizations(orgs);
        if (orgs.length > 0 && !defaultOrgApplied.current) {
          defaultOrgApplied.current = true;
          try {
            const profileRes = await api.get('/users/me');
            const profile = profileRes.data?.data ?? profileRes.data;
            const userOrgId = profile?.orgUnitId;
            const defaultId = userOrgId ? (orgs.find((o: any) => o.id === userOrgId) ? userOrgId : orgs[0].id) : '__all__';
            defaultOrgUnitId.current = defaultId;
            setFilterOrgUnitId(defaultId === '__all__' ? undefined : defaultId);
          } catch {
            defaultOrgUnitId.current = orgs[0].id;
            setFilterOrgUnitId(orgs[0].id);
          }
        }
      } catch { /* ignore */ }
      finally { setOrgUnitReady(true); }
    })();
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => {
      const list = r.data || [];
      const map = new Map<string, string>();
      const imgMap = new Map<string, string>();
      list.forEach((s: any) => { map.set(s.id, s.name); if (s.image) imgMap.set(s.id, s.image); });
      setSymbolMap(map);
      setSymbolImageMap(imgMap);
    }).catch(() => { });
    userService.list({ pageSize: 1000 }).then(r => {
      const users = r.data || (r as any).content || [];
      const umap = new Map<string, string>();
      users.forEach((u: any) => {
        const name = u.fullName || u.username || '';
        if (name && !isUuidString(name)) umap.set(u.id, name);
      });
      setUserMap(umap);
    }).catch(() => { });
  }, []);

  const fetchCounts = useCallback(async (orgId: string | undefined) => {
    try {
      const orgParam = orgId && orgId !== '__all__' ? orgId : undefined;
      const [allRes, draftRes, appRes] = await Promise.allSettled([
        fetchDryPortList({ page: 1, size: 1, orgUnitId: orgParam }),
        fetchDryPortList({ page: 1, size: 1, approvalStatus: 'DRAFT', orgUnitId: orgParam }),
        fetchDryPortList({ page: 1, size: 1, approvalStatus: 'APPROVED', orgUnitId: orgParam }),
      ]);

      const getVal = (r: PromiseSettledResult<{ total: number }>) => (r.status === 'fulfilled' ? r.value.total : 0);
      const counts: Record<string, number> = {
        all: getVal(allRes),
        DRAFT: getVal(draftRes),
        APPROVED: getVal(appRes),
      };
      setTabCounts(counts);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchDryPortList({
        page,
        size: pageSize,
        search: debouncedSearch || undefined,
        orgUnitId: filterOrgUnitId === '__all__' ? undefined : filterOrgUnitId,
        provinceId: filterProvince,
        region: filterRegion,
        portStatus: filterStatus,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        code: filterCode,
        transportCorridor: filterTransportCorridor,
        approvalStatus: activeTab === 'all' ? undefined : activeTab,
      });
      setDataSource(res.data);
      setTotal(res.total);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filterOrgUnitId, filterProvince, filterRegion, filterStatus, filterUpdatedFrom, filterUpdatedTo, filterCode, filterTransportCorridor, activeTab]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);
  useEffect(() => { if (orgUnitReady) void fetchCounts(filterOrgUnitId); }, [filterOrgUnitId, fetchCounts, orgUnitReady]);

  const handleFilterApply = useCallback(() => {
    setDebouncedSearch(search);
    setActiveTab('all');
    setPage(1);
  }, [search]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    setSearch('');
    setFilterProvince(undefined);
    setFilterRegion(undefined);
    setFilterStatus(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterCode(undefined);
    setFilterTransportCorridor(undefined);
    setFilterOrgUnitId(defaultOrg === '__all__' ? undefined : defaultOrg);
    setActiveTab('all');
    setPage(1);
  }, []);

  const openDetailModal = useCallback(async (record: DryPort) => {
    setDetailRecord(record);
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailFiles([]);
    try {
      const atts = await fetchDryPortAttachmentList(record.id);
      setDetailFiles(atts);
    } catch {
      setDetailFiles([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEmbeddedAction || !linkedRecordId) return;
    let cancelled = false;
    fetchDryPortById(linkedRecordId)
      .then((record) => {
        if (cancelled) return;
        if (linkedAction === 'detail') {
          void openDetailModal(record);
        } else {
          setFormEditId(linkedRecordId);
          setEditingName(record.dryPortName || '');
          setEditingRecord(record);
          setUpdateDrawerOpen(true);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Không tải được chi tiết cảng cạn');
      });
    return () => { cancelled = true; };
  }, [isEmbeddedAction, linkedAction, linkedRecordId, openDetailModal]);

  const notifyEmbeddedActionClosed = useCallback(() => {
    if (isEmbeddedAction) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, window.location.origin);
    }
  }, [isEmbeddedAction]);

  const closeEmbeddedDetail = useCallback(() => {
    setDetailModalOpen(false);
    setDetailRecord(null);
    notifyEmbeddedActionClosed();
  }, [notifyEmbeddedActionClosed]);

  const provinceName = useCallback((provinceId: number | null | undefined): string => {
    if (provinceId == null || provinceId < 1 || provinceId > VIETNAM_PROVINCES.length) return '';
    return VIETNAM_PROVINCES[provinceId - 1] || '';
  }, []);

  const openDeleteModal = useCallback((record: DryPort) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await deleteDryPort(deletingRecord.id);
      toast.success('Đã xóa cảng cạn');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts, filterOrgUnitId]);

  const openApproveModal = useCallback((record: DryPort) => {
    setApprovingRecord(record);
    setApproveModalOpen(true);
  }, []);

  const handleConfirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    try {
      await approveDryPort(approvingRecord.id);
      toast.success('Đã phê duyệt');
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại');
    } finally {
      setApproveModalOpen(false);
      setApprovingRecord(null);
    }
  }, [approvingRecord, fetchData, fetchCounts, filterOrgUnitId]);

  const openRejectModal = useCallback((record: DryPort) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectError('');
    setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Vui lòng nhập lý do từ chối');
      return;
    }
    if (reason.length < 10) {
      setRejectError('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      await rejectDryPort(rejectingRecord.id, reason);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setRejectError('');
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, filterOrgUnitId]);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('dryport:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary' as const,
        icon: <PlusOutlined />,
        onClick: () => {
          setFormEditId(undefined);
          setEditingRecord(null);
          setCreateDrawerOpen(true);
        },
      });
    }
    return actions;
  }, [hasPerm]);

  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'approvalStatus') {
      const rank: Record<string, number> = { DRAFT: 1, PROPOSED: 1, PENDING: 2, PENDING_APPROVAL: 2, APPROVED_LEVEL1: 3, APPROVED: 4, REJECTED: 5, REJECTED_LEVEL1: 5, REJECTED_LEVEL2: 5 };
      return rank[String(r.approvalStatus || '').toUpperCase()] ?? 99;
    }
    if (field === 'portStatus') return r.portStatus ?? 0;
    if (field === 'updatedAt' || field === 'updatedBy' || field === 'updatedByName') return new Date(r.updatedAt || r.createdAt || 0).getTime();
    return r[field] ?? '';
  }, []);

  const columns = useMemo(() => {
    const base: any[] = [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        align: 'center' as const,
        render: (_: unknown, __: DryPort, idx?: number) => (
          <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + (idx ?? 0) + 1}</span>
        ),
      },
      {
        key: 'dryPortName',
        label: 'Tên/Mã Cảng cạn',
        dataIndex: 'dryPortName',
        width: 280,
        fixed: 'left' as const,
        sortable: true,
        sortOrder: sortField === 'dryPortName' ? sortOrder : undefined,
        render: (_: unknown, record: DryPort) => (
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <a
              title={record.dryPortName}
              onClick={() => openDetailModal(record)}
              style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {record.dryPortName || ''}
            </a>
            <span
              title={record.dryPortCode}
              style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {record.dryPortCode || ''}
            </span>
          </div>
        ),
      },
      {
        key: 'orgUnitName',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitName',
        width: 260,
        sortable: true,
        sortOrder: sortField === 'orgUnitName' ? sortOrder : undefined,
        render: (v: string | null | undefined) => (
          <span title={v || ''} style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {v || ''}
          </span>
        ),
      },
      {
        key: 'operatingUnit',
        label: 'Đơn vị khai thác',
        dataIndex: 'operatingUnit',
        width: 220,
        sortable: true,
        render: (v: string | null | undefined) => (
          <span title={v || ''} style={{ fontSize: fontSizeMd, color: textPrimary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {v || ''}
          </span>
        ),
      },
      {
        key: 'region',
        label: 'Khu vực',
        dataIndex: 'region',
        width: 170,
        sortable: true,
        render: (v: string | null | undefined) => (
          <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || ''}</span>
        ),
      },
      {
        key: 'transportCorridor',
        label: 'Hành lang vận tải',
        dataIndex: 'transportCorridor',
        width: 200,
        sortable: true,
        render: (v: string | null | undefined) => (
          <span title={v || ''} style={{ fontSize: fontSizeMd, color: textPrimary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {v || ''}
          </span>
        ),
      },
      {
        key: 'portStatus',
        label: 'Tình trạng',
        dataIndex: 'portStatus',
        width: 240,
        ellipsis: false,
        sortable: true,
        cellTitle: (record: DryPort) => {
          const badge = trangThaiHoatDongBadge(record.portStatus, (record as any).operationalStatus);
          return badge.label;
        },
        render: (_: unknown, record: DryPort) => {
          const badge = trangThaiHoatDongBadge(record.portStatus, (record as any).operationalStatus);
          return <span style={badge.style}>{badge.label}</span>;
        },
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 260,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'approvalStatus' ? sortOrder : undefined,
        cellTitle: (record: DryPort) => {
          const badge = trangThaiPheDuyetBadge(record.approvalStatus);
          return badge?.label || record.approvalStatus || '';
        },
        render: (status: string) => {
          const badge = trangThaiPheDuyetBadge(status);
          return badge?.label ? <span style={badge.style}>{badge.label}</span> : null;
        },
      },
      {
        key: 'updatedAt',
        dataIndex: 'updatedAt',
        label: 'Cán bộ cập nhật',
        width: 190,
        sortable: true,
        sortOrder: (sortField === 'updatedAt' || sortField === 'updatedBy') ? sortOrder : undefined,
        render: (_: unknown, record: DryPort) => {
          const rawName = formatUserDisplayName(record.updatedBy, (record as any).updatedByName, userMap, record.createdBy, (record as any).createdByName);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = record.updatedAt || record.createdAt;
          const cleanDate = date ? formatDate(date) : '';
          return (
            <div style={{ lineHeight: '1.35', minWidth: 0, overflow: 'hidden' }}>
              <div title={name} style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
              <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
                {cleanDate}
              </div>
            </div>
          );
        },
      },
    ];
    return base;
  }, [page, pageSize, sortField, sortOrder, userMap, openDetailModal]);

  const rowActions = useCallback((record: DryPort) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    const status = record.approvalStatus || '';
    const isDraft = status === 'DRAFT' || status === 'NHAP';
    const isPending = status === 'PENDING' || status === 'PENDING_APPROVAL';
    actions.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailModal(record) });
    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'dryport', extraUpdatePerms: ['dryport:update'], extraApprovePerms: ['dryport:approve'] })) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => {
          setFormEditId(record.id);
          setEditingName(record.dryPortName);
          setEditingRecord(record);
          setUpdateDrawerOpen(true);
        },
      });
    }
    if (hasPerm('dryport:history')) actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
    if (isDraft && hasPerm('dryport:approve')) actions.push({ key: 'approve', label: 'Phê duyệt', icon: icons.approve, onClick: () => openApproveModal(record) });
    if (isPending && hasPerm('dryport:approve')) {
      actions.push({ key: 'approve', label: 'Phê duyệt', icon: icons.approve, onClick: () => openApproveModal(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: icons.reject, onClick: () => openRejectModal(record), danger: true });
    }
    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'dryport' })) actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, onClick: () => openDeleteModal(record), danger: true });
    return actions;
  }, [hasPerm, openHistory, openDetailModal, openApproveModal, openRejectModal, openDeleteModal]);

  const renderDetailContent = () => {
    if (!detailRecord) return null;
    if (detailLoading) return <LoadingSkeleton rows={6} />;
    return (
      <DryPortDetailContent
        selectedRecord={detailRecord}
        organizations={organizations}
        symbolMap={symbolMap}
        symbolImageMap={symbolImageMap}
        userMap={userMap}
        detailFiles={detailFiles}
        ddToDms={ddToDms}
        provinceName={provinceName}
      />
    );
  };

  const closeCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
    createForm.resetFields();
    setSortField('updatedAt');
    setSortOrder('descend');
    setPage(1);
    void fetchData();
    void fetchCounts(filterOrgUnitId);
  }, [fetchData, fetchCounts, filterOrgUnitId, createForm]);

  const closeUpdateDrawer = useCallback(() => {
    setUpdateDrawerOpen(false);
    setSortField('updatedAt');
    setSortOrder('descend');
    setPage(1);
    void fetchData();
    void fetchCounts(filterOrgUnitId);
    notifyEmbeddedActionClosed();
  }, [fetchData, fetchCounts, filterOrgUnitId, notifyEmbeddedActionClosed]);

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5 }}>
      <div className="dry-port-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .dry-port-page-wrapper,
          .dry-port-page-wrapper .ant-table,
          .dry-port-page-wrapper .ant-table-cell,
          .dry-port-page-wrapper .ant-table-thead > tr > th,
          .dry-port-page-wrapper .ant-tabs-tab,
          .dry-port-page-wrapper .ant-btn,
          .dry-port-page-wrapper .ant-input,
          .dry-port-page-wrapper .ant-select,
          .dry-port-page-wrapper .ant-select-selection-item,
          .dry-port-page-wrapper .ant-select-item,
          .dry-port-page-wrapper .ant-pagination,
          .dry-port-drawer-scope,
          .dry-port-drawer-scope .ant-drawer-title,
          .dry-port-drawer-scope .ant-tabs-tab,
          .dry-port-drawer-scope .ant-btn,
          .dry-port-drawer-scope .ant-input,
          .dry-port-drawer-scope .ant-select,
          .dry-port-drawer-scope .ant-table,
          .dry-port-drawer-scope .ant-form-item-label > label,
          .dry-port-modal-scope,
          .dry-port-modal-scope .ant-modal-title,
          .dry-port-modal-scope .ant-btn,
          .dry-port-modal-scope .ant-input,
          .dry-port-modal-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }

          .dry-port-page-wrapper div:has(> button[aria-pressed]) {
            justify-content: center !important;
            overflow-x: auto !important;
            max-width: 100% !important;
            padding-bottom: 2px !important;
            scroll-behavior: smooth !important;
          }
          .dry-port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 4px;
          }
          .dry-port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[{ label: 'Quản lý tài sản KCHT hàng hải' }, { label: 'Quản lý cảng cạn' }]}
          actions={headerActions}
        />
        <FilterTableLayout
          hideFilterToggle={true}
          statusTabs={[
            { key: 'all', label: 'Tất cả', count: tabCounts['all'] ?? total, color: actionPrimary, active: !activeTab || activeTab === 'all' },
            { key: 'DRAFT', label: 'Lưu tạm', count: tabCounts['DRAFT'] ?? 0, color: statusDraft, active: activeTab === 'DRAFT' },
            { key: 'APPROVED', label: 'Đã phê duyệt', count: tabCounts['APPROVED'] ?? 0, color: statusOperational, active: activeTab === 'APPROVED' },
          ]}
          onStatusTabChange={(key) => {
            setActiveTab(key);
            setPage(1);
          }}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          loading={isLoading}
          error={isError}
          onRetry={fetchData}
          filterContent={
            <>
              <div style={{ marginBottom: 12, marginTop: spaceMd }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Đơn vị quản lý
                </div>
                <FilterOrgUnitTreeSelect
                organizations={organizations}
                value={filterOrgUnitId}
                onChange={(val) => { setFilterOrgUnitId(val); setPage(1); }}
              />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Tên cảng cạn
                </div>
                <Input
                  placeholder="Tìm theo mã, tên, địa chỉ..."
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Tình trạng
                </div>
                <Select
                  placeholder="Chọn tình trạng"
                  allowClear
                  value={filterStatus}
                  onChange={(val) => { setFilterStatus(val); setPage(1); }}
                  options={PORT_STATUS_OPTIONS}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Mã cảng cạn
                </div>
                <Input
                  placeholder="Tìm theo mã cảng cạn"
                  allowClear
                  value={filterCode}
                  onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Khu vực
                </div>
                <Select
                  placeholder="Chọn khu vực"
                  allowClear
                  value={filterRegion}
                  onChange={(val) => { setFilterRegion(val); setPage(1); }}
                  options={REGION_OPTIONS}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Hành lang vận tải
                </div>
                <Input
                  placeholder="Tìm theo hành lang vận tải"
                  allowClear
                  value={filterTransportCorridor}
                  onChange={(e) => { setFilterTransportCorridor(e.target.value); setPage(1); }}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Địa điểm (Tỉnh/Thành Phố)
                </div>
                <Select
                  placeholder="Chọn tỉnh/thành phố"
                  allowClear
                  showSearch
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  value={filterProvince}
                  onChange={(val) => { setFilterProvince(val); setPage(1); }}
                  options={VIETNAM_PROVINCES.map((p, i) => ({ value: i + 1, label: p }))}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                  Khoảng ngày cập nhật
                </div>
                <DatePicker.RangePicker
                  {...getRangePickerProps({
                    value: (filterUpdatedFrom && filterUpdatedTo)
                      ? [dayjs(filterUpdatedFrom), dayjs(filterUpdatedTo)]
                      : (filterUpdatedFrom ? [dayjs(filterUpdatedFrom), null] : (filterUpdatedTo ? [null, dayjs(filterUpdatedTo)] : null)),
                    onChange: (dates: any) => {
                      if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                        setFilterUpdatedFrom(undefined);
                        setFilterUpdatedTo(undefined);
                      } else {
                        setFilterUpdatedFrom(dates[0] ? dates[0].startOf('day').toISOString() : undefined);
                        setFilterUpdatedTo(dates[1] ? dates[1].endOf('day').toISOString() : undefined);
                      }
                      setPage(1);
                    },
                    style: { width: '100%', borderRadius: radiusPill, height: 40 },
                  })}
                />
              </div>
            </>
          }
        >
          <DataTable
            columns={columns}
            dataSource={[...dataSource].sort((a: any, b: any) => {
              if (!sortField) return 0;
              const aVal = getSortValue(a, sortField);
              const bVal = getSortValue(b, sortField);
              const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi');
              return sortOrder === 'ascend' ? cmp : -cmp;
            })}
            loading={isLoading}
            rowKey="id"
            rowActions={rowActions}
            onSort={(key: string, order: 'asc' | 'desc') => {
              setSortField(key);
              setSortOrder(order === 'asc' ? 'ascend' : 'descend');
              setPage(1);
            }}
            scroll={{ x: 'max-content' }}
          />
          <Pagination
            total={total}
            current={page}
            pageSize={pageSize}
            onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
          />
        </FilterTableLayout>

        {/* ── Detail Drawer ──────────────────────────────────────────── */}
        <AppDrawer
          width="min(1000px, 96vw)"
          rootClassName="dry-port-drawer-scope"
          className="dry-port-drawer-scope"
          title={<span style={drawerTitleStyle}>Chi tiết cảng cạn{detailRecord ? ` - ${detailRecord.dryPortName}` : ''}</span>}
          open={detailModalOpen}
          onClose={closeEmbeddedDetail}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
          }}
          footer={null}
        >
          {renderDetailContent()}
        </AppDrawer>

        {/* ── Create Drawer (3 buttons standard) ────────────────────── */}
        <AppDrawer
          width="min(920px, 96vw)"
          rootClassName="dry-port-drawer-scope"
          className="dry-port-drawer-scope"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới Cảng cạn</span>}
          open={createDrawerOpen}
          onClose={closeCreateDrawer}
          footer={
            <div style={drawerFooterStyle}>
              <Button
                onClick={() => {
                  setActionType('draft');
                  createFormRef.current?.submit('DRAFT');
                }}
                loading={submitting && actionType === 'draft'}
                style={outlineButtonStyle}
              >
                Lưu tạm
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setActionType('approve');
                  createFormRef.current?.submit('SAVE_AND_APPROVE');
                }}
                loading={submitting && actionType === 'approve'}
                style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
              >
                Lưu và phê duyệt
              </Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          {createDrawerOpen && (
            <>
              <style>{requiredMarkStyle}</style>
              <Form form={createForm} layout="vertical">
                <DryPortForm
                  ref={createFormRef}
                  form={createForm}
                  onFinish={() => closeCreateDrawer()}
                  onSubmittingChange={setSubmitting}
                />
              </Form>
            </>
          )}
        </AppDrawer>

        {/* ── Edit Drawer ────────────────────────────────────────────── */}
        <AppDrawer
          width="min(920px, 96vw)"
          rootClassName="dry-port-drawer-scope"
          className="dry-port-drawer-scope"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa thông tin — {editingName || 'Cảng cạn'}</span>}
          open={updateDrawerOpen}
          onClose={closeUpdateDrawer}
          afterOpenChange={(open) => {
            if (!open) {
              setFormEditId(undefined);
              setEditingRecord(null);
              setEditingName('');
              updateForm.resetFields();
            }
          }}
          footer={
            <div style={drawerFooterStyle}>
              {!(editingRecord?.approvalStatus === 'APPROVED' || editingRecord?.approvalStatus === 'APPROVED_LEVEL2') && (
                <Button
                  onClick={() => {
                    setActionType('draft');
                    updateFormRef.current?.submit('DRAFT');
                  }}
                  loading={submitting && actionType === 'draft'}
                  style={outlineButtonStyle}
                >
                  Lưu tạm
                </Button>
              )}
              <Button
                type="primary"
                onClick={() => {
                  setActionType('approve');
                  updateFormRef.current?.submit('SAVE_AND_APPROVE');
                }}
                loading={submitting && actionType === 'approve'}
                style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
              >
                Lưu và phê duyệt
              </Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          {formEditId && (
            <>
              <style>{requiredMarkStyle}</style>
              <Form form={updateForm} layout="vertical">
                <DryPortForm
                  ref={updateFormRef}
                  form={updateForm}
                  id={formEditId}
                  onFinish={() => closeUpdateDrawer()}
                  onSubmittingChange={setSubmitting}
                />
              </Form>
            </>
          )}
        </AppDrawer>

        {/* ── History Drawer ────────────────────────────────────────── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="dry-port-drawer-scope"
          className="dry-port-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  {historyTarget ? `Lịch sử thay đổi — ${historyTarget.dryPortName}` : 'Lịch sử thay đổi'}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>Tổng cộng {historyFieldCount}</span>
              </Space>
            </div>
          }
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          }}
        >
          <div style={{ flexShrink: 0 }}>
            {!historyLoading && (
              <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
                <Radio.Group value={historyMode} onChange={e => {
                  const m = e.target.value;
                  setHistoryMode(m);
                  setHistoryEntityFilter('');
                  if (m === 'current' && historyTarget) {
                    setHistoryLoading(true);
                    fetchDryPortHistory(historyTarget.id, { page: 0, size: 200 })
                      .then((d: any) => setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : Array.isArray(d) ? d : []))
                      .catch(() => toast.error('Không thể tải lịch sử'))
                      .finally(() => setHistoryLoading(false));
                  } else if (m === 'all') {
                    setHistoryLoading(true);
                    fetchDryPortAllHistory({ page: 0, size: 200 })
                      .then((d: any) => {
                        setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : Array.isArray(d) ? d : []);
                        if (d?.entityNames) setHistoryEntityNames(d.entityNames);
                      })
                      .catch(() => toast.error('Không thể tải lịch sử'))
                      .finally(() => setHistoryLoading(false));
                  }
                }} optionType="button" buttonStyle="solid"
                  options={[{ label: 'Bản ghi này', value: 'current' }, { label: 'Tất cả bản ghi', value: 'all' }]}
                  style={{ flexShrink: 0 }} />
                <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearchInput}
                  onChange={e => setHistorySearchInput(e.target.value)}
                  onPressEnter={() => setHistorySearch(historySearchInput.trim())}
                  style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
                {historyMode === 'all' && <Select placeholder="Lọc theo bản ghi" allowClear style={{ width: 180, borderRadius: radiusPill, height: 40 }}
                  value={historyEntityFilter || undefined} onChange={v => setHistoryEntityFilter(v || '')}
                  options={Object.entries(historyEntityNames).map(([id, name]) => ({ value: id, label: name }))} />}
                <DatePicker.RangePicker
                  {...getRangePickerProps({
                    value: (historyFrom && historyTo)
                      ? [dayjs(historyFrom), dayjs(historyTo)]
                      : (historyFrom ? [dayjs(historyFrom), null] : (historyTo ? [null, dayjs(historyTo)] : null)),
                    onChange: (dates: any) => {
                      if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                        setHistoryFrom('');
                        setHistoryTo('');
                      } else {
                        setHistoryFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DD HH:mm') : '');
                        setHistoryTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DD HH:mm') : '');
                      }
                    },
                    style: { width: 280, borderRadius: radiusPill, height: 40 },
                  })}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => setHistorySearch(historySearchInput.trim())}
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
                >
                  Tìm kiếm
                </Button>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {historyLoading ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
              </div>
            ) : renderDryPortHistoryTimeline(historyRecords)}
          </div>
        </AppDrawer>

        {/* ── Delete Confirmation Modal ────────────────────────────── */}
        <DeleteConfirmModal
          open={deleteModalOpen}
          onCancel={() => {
            if (!deleteLoading) {
              setDeleteModalOpen(false);
              setDeletingRecord(null);
            }
          }}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
          itemType="cảng cạn"
          itemName={deletingRecord?.dryPortName}
          itemCode={deletingRecord?.dryPortCode}
        />

        {/* ── Reject Reason Modal ──────────────────────────────────── */}
        <Modal
          rootClassName="dry-port-modal-scope"
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
          open={rejectModalOpen}
          onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
          footer={[
            <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
            <Button key="reject" type="primary" danger onClick={handleConfirmReject}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cảng cạn:</p>
            {rejectingRecord && (
              <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
                <strong style={{ color: textPrimary }}>{rejectingRecord.dryPortName}</strong>
              </p>
            )}
            <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }} rows={3} maxLength={500} showCount
              style={{ borderRadius: 8, fontSize: fontSizeMd }} />
            {rejectError && <div style={{ color: '#E34948', fontSize: fontSizeSm, marginTop: 4 }}>{rejectError}</div>}
          </div>
        </Modal>

        {/* ── Approve Modal ─────────────────────────────────────────── */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
          onConfirm={() => { if (approvingRecord) void handleConfirmApprove(); }}
          onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        />
      </div>
    </ThemeTokenProvider>
  );
}