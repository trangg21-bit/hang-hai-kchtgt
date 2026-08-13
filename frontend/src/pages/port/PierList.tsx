import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Tag, Modal, Input, Select, Alert, Divider, DatePicker,
  Drawer, Radio, Space, Typography, Form,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  CloseCircleOutlined, EyeOutlined, HistoryOutlined, ExclamationCircleOutlined,
  ClockCircleFilled, UpOutlined, DownOutlined, SearchOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { pierCRUD, pierApproval, berthCRUD, portCRUD } from '../../services/portService';
import type { Pier } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { trangThaiPheDuyetBadge } from '../../services/port/schema';
import { usePermissionStore } from '../../store/permissionStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import PierForm from './PierForm';
import PierDetailContent from './PierDetailContent';
import {
  statusOperational, statusAttention, statusCritical, statusDraft,
  actionPrimary, cardStyle, textPrimary, textSecondary, textTertiary,
  borderDefault, fontSizeMd, fontSizeLg, fontSizeXl,
  fontWeightMedium, fontWeightBold, radiusPill, radiusLg, radiusSm,
  spaceMd, spaceSm, spaceXs, spaceLg, spaceXl, spaceFormField,
  shadowSm, surfaceCard,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
} from '../../tokens';
import { colors } from '../../theme';

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Nháp' }, DRAFT: { color: statusDraft, label: 'Nháp' },
  PENDING: { color: statusAttention, label: 'Chờ phê duyệt' },
  CHO_PHE_DUYET: { color: statusAttention, label: 'Chờ phê duyệt' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ phê duyệt' },
  APPROVED: { color: statusOperational, label: 'Được phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Được phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
};
const OPERATIONAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
  NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/Vận hành' },
  SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
};
const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING', label: 'Chờ phê duyệt', color: statusAttention },
  { key: 'APPROVED', label: 'Được phê duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];
const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined, DRAFT: 'DRAFT', PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED',
};

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'; try { return dayjs(d).format('DD/MM/YYYY HH:mm'); } catch { return d; }
}

const histLabels: Record<string, string> = {
  pierCode: 'Mã cầu', pierName: 'Tên cầu', berthId: 'Bến cảng', portId: 'Cảng biển',
  length: 'Chiều dài', width: 'Chiều rộng', loaiCau: 'Loại cầu',
  operationalStatus: 'Tình trạng', approvalStatus: 'Trạng thái PĐ', orgUnitId: 'Đơn vị quản lý',
};
function histField(fn: string): string { return histLabels[fn] || fn; }
function histVal(fn: string, val: string | null, orgMap?: Map<string, string>): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const f = orgMap.get(val); return f ? f.split(' - ').pop() || f : val; }
  if (fn === 'approvalStatus') { const m: Record<string,string> = { DRAFT:'Nháp', PENDING:'Chờ duyệt', APPROVED:'Đã duyệt', REJECTED:'Từ chối' }; return m[val?.toUpperCase()] || val; }
  if (fn === 'operationalStatus') { const m: Record<string,string> = { OPERATIONAL:'Đang KT', HIEN_HANH:'Hiện hành', SUSPENDED:'Dừng KT', TAM_NGUNG:'Tạm ngừng' }; return m[val] || val; }
  return val;
}
function actLabel(items: any[]): { label: string; color: string } {
  const f = items.map((i: any) => i.fieldName || ''), n = items.map((i: any) => i.newValue || '');
  if (f.includes('deletedAt') || n.includes('Đã xóa')) return { label: 'Xóa', color: 'red' };
  if (f.includes('approvalStatus') && n[f.indexOf('approvalStatus')] === 'APPROVED') return { label: 'Phê duyệt', color: 'green' };
  if (f.includes('approvalStatus') && n[f.indexOf('approvalStatus')] === 'REJECTED') return { label: 'Từ chối', color: 'red' };
  if (f.includes('approvalStatus') && n[f.indexOf('approvalStatus')] === 'PENDING') return { label: 'Gửi phê duyệt', color: 'orange' };
  return items.filter((i: any) => i.oldValue === '(null)' || i.oldValue === 'null').length > items.length / 2 ? { label: 'Tạo mới', color: 'blue' } : { label: 'Chỉnh sửa', color: 'blue' };
}

export default function PierList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [orgUnit, setOrgUnit] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterBerthId, setFilterBerthId] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterPierType, setFilterPierType] = useState<string | undefined>();
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<Pier[]>([]); const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false); const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());
  const orgMap = useMemo(() => { const m = new Map<string, string>(); organizations.forEach(o => m.set(o.id, o.name)); return m; }, [organizations]);
  const [berthOptions, setBerthOptions] = useState<{ value: string; label: string }[]>([]);
  const portMap = useMemo(() => new Map<string, string>(), []);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editPierId, setEditPierId] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const pierFormRef = useRef<any>(null);
  const editPierFormRef = useRef<any>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Pier | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Pier | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<Pier | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<Pier | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<Pier | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Pier | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, boolean>>({});
  const [historyVisible, setHistoryVisible] = useState(10);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const appliedFiltersRef = useRef<{
    orgUnit?: string; search: string; berthId?: string; portId?: string; pierType?: string;
    province?: string; operationalStatus?: string; approvalStatus?: string;
  }>({ orgUnit: undefined, search: '', berthId: undefined, portId: undefined, pierType: undefined, province: undefined, operationalStatus: undefined, approvalStatus: undefined });

  const openHistory = useCallback(async (r: Pier) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistoryExpanded({}); setHistoryVisible(10); setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryMode('current');
    try {
      const res = await api.get(`/v1/piers/${r.id}/history`);
      const d = res.data?.data; setHistoryRecords([...(Array.isArray(d?.changeHistory) ? d.changeHistory : []), ...(Array.isArray(d?.approvalLog) ? d.approvalLog : [])]);
    } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => {
    (async () => { try { const r = await organizationService.list({ pageSize: 1000 }); const data = r.data || []; setOrganizations(data); if (data.length > 0) { try { const p = await api.get('/users/me'); const uOrgId = (p.data?.data ?? p.data)?.orgUnitId; const matchedOrgId = (uOrgId && data.find((o: any) => o.id === uOrgId)) ? uOrgId : data[0].id; setOrgUnit(matchedOrgId); defaultOrgUnitRef.current = matchedOrgId; appliedFiltersRef.current = { ...appliedFiltersRef.current, orgUnit: matchedOrgId }; setSearchInput(''); } catch { setOrgUnit(data[0].id); defaultOrgUnitRef.current = data[0].id; appliedFiltersRef.current = { ...appliedFiltersRef.current, orgUnit: data[0].id }; setSearchInput(''); } } } catch {} })();
    (async () => { try { const r = await userService.list({ pageSize: 1000 }); const u = r.data || (r as any).content || []; const m = new Map<string, string>(); u.forEach((x: any) => m.set(x.id, x.fullName || x.username || x.id)); setUserMap(m); } catch {} })();
    (async () => { try { const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' }); const s = r.data || (r as any).content || []; const m = new Map<string, string>(); const imgMap = new Map<string, string>(); s.forEach((x: any) => { m.set(x.id, x.name); if (x.image) imgMap.set(x.id, x.image); }); setSymbolMap(m); setSymbolImageMap(imgMap); } catch {} })();
    (async () => { try { const r = await portCRUD.findAll({ page: 1, size: 1000 }); (r.data || []).forEach((p: any) => portMap.set(p.id, p.portName)); } catch {} })();
  }, []);

  useEffect(() => {
    if (orgUnit !== undefined && !initialLoadDone) {
      setInitialLoadDone(true);
      setRefreshKey(k => k + 1);
    }
  }, [orgUnit, initialLoadDone]);

  useEffect(() => {
    (async () => { try { const params: any = { page: 1, pageSize: 1000 }; if (orgUnit && orgUnit !== '__all__') params.orgUnitId = orgUnit; if (filterPortId) params.portId = filterPortId; const r = await berthCRUD.search(params); setBerthOptions((r.data || []).map((b: any) => ({ value: b.id, label: b.berthName }))); } catch {} })();
  }, [orgUnit, filterPortId]);

  useEffect(() => {
    (async () => { try { const p: any = { page: 1, pageSize: 1000 }; if (orgUnit && orgUnit !== '__all__') p.orgUnitId = orgUnit; const r = await portCRUD.search(p); setPortOptions((r.data || []).map((x: any) => ({ value: x.id, label: x.portName }))); } catch {} })();
  }, [orgUnit]);

  const fetchCounts = useCallback(async (oid: string | undefined) => {
    try {
      const rs = await Promise.allSettled(TAB_STATUS_LIST.map(t => t.key === 'all' ? pierCRUD.search({ orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 }) : pierCRUD.search({ approvalStatus: TAB_QUERY_MAP[t.key], orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 })));
      const c: Record<string, number> = {}; rs.forEach((r, i) => { c[TAB_STATUS_LIST[i]?.key || 'all'] = r.status === 'fulfilled' ? r.value.total : 0; }); setTabCounts(c);
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false); setError(null);
    const f = appliedFiltersRef.current;
    console.log('fetchData called with:', { orgUnit: f.orgUnit, search: f.search, berthId: f.berthId, portId: f.portId, province: f.province, status: f.operationalStatus, approval: f.approvalStatus, activeTab, page, pageSize });
    try {
      const r = await pierCRUD.search({
        orgUnitId: (f.orgUnit && f.orgUnit !== '__all__') ? f.orgUnit : undefined,
        search: f.search.trim() || undefined,
        berthId: f.berthId,
        portId: f.portId || undefined,
        pierType: f.pierType,
        province: f.province || undefined,
        status: f.operationalStatus,
        approvalStatus: f.approvalStatus || TAB_QUERY_MAP[activeTab],
        page, pageSize,
      });
      setDataSource(r.data); setTotal(r.total);
    } catch (ex: unknown) { setIsError(true); setError(ex instanceof Error ? ex : new Error('Không thể tải danh sách cầu cảng')); }
    finally { setIsLoading(false); }
  }, [activeTab, page, pageSize, refreshKey]);

  useEffect(() => { if (initialLoadDone) void fetchData(); }, [fetchData, initialLoadDone]);
  useEffect(() => { void fetchCounts(orgUnit); }, [orgUnit, fetchCounts]);

  const handleFilterApply = useCallback(() => {
    appliedFiltersRef.current = {
      orgUnit, search: searchInput, berthId: filterBerthId, portId: filterPortId, pierType: filterPierType,
      province: filterProvince, operationalStatus: filterOperationalStatus, approvalStatus: filterApprovalStatus,
    };
    setFilterSearch(searchInput); setPage(1);
    setRefreshKey(k => k + 1);
  }, [searchInput, orgUnit, filterBerthId, filterPortId, filterPierType, filterProvince, filterOperationalStatus, filterApprovalStatus]);
  const handleFilterReset = useCallback(() => {
    const oid = defaultOrgUnitRef.current || '__all__';
    appliedFiltersRef.current = { orgUnit: oid, search: '', berthId: undefined, portId: undefined, pierType: undefined, province: undefined, operationalStatus: undefined, approvalStatus: undefined };
    setOrgUnit(oid); setSearchInput(''); setFilterSearch('');
    setFilterPortId(undefined); setFilterBerthId(undefined); setFilterPierType(undefined);
    setFilterProvince(undefined); setFilterOperationalStatus(undefined); setFilterApprovalStatus(undefined);
    setActiveTab('all'); setPage(1); setRefreshKey(k => k + 1);
  }, []);
  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setFilterApprovalStatus(undefined); appliedFiltersRef.current.approvalStatus = undefined; setPage(1); }, []);

  const openDetailDrawer = useCallback(async (record: Pier) => {
    setDetailDrawerVisible(true); setDetailRecord(record); setDetailFiles([]); setDetailLoading(true);
    try { const r = await api.get(`/v1/piers/${record.id}/attachments`); setDetailFiles(r.data?.data || []); } catch { setDetailFiles([]); }
    try { setDetailRecord(await pierCRUD.findById(record.id)); } catch {} finally { setDetailLoading(false); }
  }, []);

  const dd2dms = (dd: number) => { if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 }; const a = Math.abs(dd); return { d: Math.floor(a), m: Math.floor((a - Math.floor(a)) * 60), s: +((a - Math.floor(a) - Math.floor((a - Math.floor(a)) * 60) / 60) * 3600).toFixed(2) }; };

  const openDeleteModal = useCallback((record: Pier) => { setDeletingRecord(record); setDeleteConfirmText(''); setDeleteModalOpen(true); }, []);
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    if (deleteConfirmText.trim() !== (deletingRecord.pierName || 'XÓA') && deleteConfirmText.trim() !== 'XÓA') { toast.error('Vui lòng nhập đúng tên cầu hoặc gõ "XÓA" để xác nhận'); return; }
    try { await pierCRUD.delete(deletingRecord.id); toast.success('Đã xóa cầu cảng'); setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); void fetchData(); void fetchCounts(orgUnit); }
    catch (ex: unknown) { toast.error(ex instanceof Error ? ex.message : 'Xóa thất bại'); }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts, orgUnit]);

  const handleApprove = useCallback(async (record: Pier) => {
    try { await pierApproval.approve(record.id); toast.success('Đã phê duyệt'); setApproveModalOpen(false); setApprovingRecord(null); void fetchData(); void fetchCounts(orgUnit); }
    catch (ex: unknown) { toast.error(ex instanceof Error ? ex.message : 'Phê duyệt thất bại'); }
  }, [fetchData, fetchCounts, orgUnit]);

  const handleSubmitApproval = useCallback((record: Pier) => { setSubmittingRecord(record); setSubmitModalOpen(true); }, []);
  const confirmSubmitApproval = useCallback(async () => {
    if (!submittingRecord) return;
    try { await pierCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' } as any); toast.success('Đã gửi phê duyệt'); setSubmitModalOpen(false); setSubmittingRecord(null); void fetchData(); void fetchCounts(orgUnit); }
    catch (ex: unknown) { toast.error(ex instanceof Error ? ex.message : 'Gửi thất bại'); }
  }, [submittingRecord, fetchData, fetchCounts, orgUnit]);

  const openRejectModal = useCallback((record: Pier) => { setRejectingRecord(record); setRejectReason(''); setRejectError(''); setRejectModalOpen(true); }, []);
  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    if (!rejectReason || rejectReason.trim().length < 10) {
      setRejectError('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      await pierApproval.reject(rejectingRecord.id, rejectReason.trim());
      toast.success('Từ chối thành công');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setRejectError('');
      void fetchData(); void fetchCounts(orgUnit);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, orgUnit]);

  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Đơn vị quản lý</div>
        <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn đơn vị"
          value={orgUnit} onChange={v => setOrgUnit(v)}
          options={[{ value: '__all__', label: 'Tất cả' }, ...organizations.map(o => ({ value: o.id, label: o.name }))]}
          showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tìm kiếm</div>
        <Input style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Tìm mã hoặc tên cầu cảng"
          value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onPressEnter={handleFilterApply}
          allowClear prefix={<SearchOutlined style={{ color: textTertiary }} />} />
      </div>
      {filterCollapsed && (<>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn cảng biển" allowClear
            value={filterPortId} onChange={v => { setFilterPortId(v); setFilterBerthId(undefined); }}
            options={portOptions} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc bến</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn bến cảng" allowClear
            value={filterBerthId} onChange={v => setFilterBerthId(v)}
            options={berthOptions} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn tỉnh/thành phố" allowClear showSearch
            value={filterProvince} onChange={v => setFilterProvince(v)}
            filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn tình trạng" allowClear
            value={filterOperationalStatus} onChange={v => setFilterOperationalStatus(v)}
            options={[{ value: 'OPERATIONAL', label: 'Đang khai thác/Vận hành' }, { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/Vận hành' }, { value: 'SUSPENDED', label: 'Dừng khai thác/Vận hành' }]} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Trạng thái</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn trạng thái" allowClear
            value={filterApprovalStatus} onChange={v => { setFilterApprovalStatus(v); setActiveTab('all'); }}
            options={[{ value: 'DRAFT', label: 'Nháp' }, { value: 'PENDING', label: 'Chờ phê duyệt' }, { value: 'APPROVED', label: 'Được phê duyệt' }, { value: 'REJECTED', label: 'Từ chối' }]} />
        </div>
      </>)}
    </>
  );

  const rowActions = useCallback((record: Pier) => {
    const actions: any[] = [{ key: 'view', label: 'Chi tiết', icon: <EyeOutlined />, onClick: () => openDetailDrawer(record) }];
    const st = record.approvalStatus || '';
    if (hasPerm('pier:update')) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => { setEditPierId(record.id); setCreateDrawerVisible(true); } });
    if (hasPerm('pier:history')) actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => openHistory(record) });
    if (['DRAFT','NHAP'].includes(st) && hasPerm('pier:update')) actions.push({ key: 'submit', label: 'Gửi phê duyệt', icon: <CheckCircleOutlined />, onClick: () => handleSubmitApproval(record) });
    if (hasPerm('pier:approve') && ['PENDING','CHO_PHE_DUYET','PENDING_APPROVAL'].includes(st)) {
      actions.push({ key: 'approve', label: 'Phê duyệt', icon: <CheckCircleOutlined />, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, danger: true, onClick: () => openRejectModal(record) });
    }
    if (hasPerm('pier:delete') && ['DRAFT','NHAP'].includes(st)) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => openDeleteModal(record) });
    return actions;
  }, [hasPerm, openDetailDrawer, openHistory, handleSubmitApproval, openRejectModal, openDeleteModal]);

  const columns = useMemo(() => [
    { label: 'STT', key: 'stt', width: 60, fixed: 'left' as const, align: 'center' as const,
      render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + i + 1}</span> },
    { label: 'Mã cầu cảng', dataIndex: 'pierCode', key: 'pierCode', width: 220, fixed: 'left' as const, sortable: true,
      render: (v: string) => <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: '#1677ff15', color: '#1677ff' }}>{v || '—'}</span> },
    { label: 'Tên cầu cảng', dataIndex: 'pierName', key: 'pierName', width: 200, fixed: 'left' as const, sortable: true,
      render: (v: string) => <a style={{ fontWeight: fontWeightBold, color: actionPrimary, cursor: 'pointer' }}>{v || '—'}</a> },
    { label: 'Thuộc cảng biển', dataIndex: 'portId', key: 'portId', width: 170,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{portMap.get(v || '') || v || '—'}</span> },
    { label: 'Thuộc bến cảng', dataIndex: 'berthName', key: 'berthName', width: 170,
      render: (v: string, r: Pier) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || r.tenBenCang || berthOptions.find(b => b.value === r.berthId)?.label || r.berthId || '—'}</span> },
    { label: 'Địa điểm', dataIndex: 'province', key: 'province', width: 150,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
    { label: 'Kích thước', key: 'size', width: 130,
      render: (_: any, r: Pier) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{r.length != null || r.width != null ? `${r.length ?? '—'} × ${r.width ?? '—'} m` : '—'}</span> },
    { label: 'Tình trạng', dataIndex: 'operationalStatus', key: 'operationalStatus', width: 200,
      render: (v: string) => { const b = v && OPERATIONAL_STYLE_MAP[v]; return b ? <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${b.color}15`, color: b.color }}>{b.label}</span> : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>; } },
    { label: 'Ngày cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', width: 160, sortable: true,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{formatDate(v)}</span> },
    { label: 'Trạng thái', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 170,
      render: (v: string) => {
        const badge = v ? trangThaiPheDuyetBadge(v) : null;
        if (!badge || badge.color === 'default') { const s = v && APPROVAL_STYLE_MAP[v]; return s ? <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span> : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>; }
        const bc = badge.color === 'green' ? statusOperational : badge.color === 'red' ? statusCritical : badge.color === 'orange' ? statusAttention : textTertiary;
        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${bc}15`, color: bc }}>{badge.label}</span>;
      } },
  ].map(col => ({ ...col, sortOrder: col.sortable && col.key === sortField ? sortOrder : undefined })), [page, pageSize, orgMap, berthOptions, portMap, sortField, sortOrder]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Cầu cảng' }]}
        actions={[{ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => setCreateDrawerVisible(true) }]} />
      <FilterTableLayout filterContent={filterContent}
        statusTabs={TAB_STATUS_LIST.map(t => ({ key: t.key, label: t.label, color: t.color, count: tabCounts[t.key] ?? 0, active: activeTab === t.key }))}
        onStatusTabChange={handleTabChange} onFilterApply={handleFilterApply} onFilterReset={handleFilterReset}
        filterCollapsed={filterCollapsed} onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        loading={isLoading} error={isError} onRetry={() => void fetchData()}>
        <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
        {isError ? null : !isLoading && dataSource.length === 0 ? (
          <DataTable dataSource={[]} rowKey="id" emptyState={<div style={{ padding: '40px 0', textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📭</div><div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>{filterSearch ? 'Không tìm thấy cầu cảng nào phù hợp' : 'Chưa có cầu cảng nào'}</div></div>} />
        ) : !isLoading && !isError && dataSource.length > 0 ? (
          <DataTable columns={columns} dataSource={[...dataSource].sort((a: any, b: any) => { if (!sortField) return 0; const av = a[sortField] ?? ''; const bv = b[sortField] ?? ''; const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'vi'); return sortOrder === 'ascend' ? c : -c; })}
            rowKey="id" rowActions={rowActions} loading={false} onSort={(k: string, o: 'asc' | 'desc') => { setSortField(k); setSortOrder(o === 'asc' ? 'ascend' : 'descend'); setPage(1); }}
            onRow={(record: any) => ({ onClick: () => openDetailDrawer(record), style: { cursor: 'pointer' } })}
            scroll={{ x: 1900, y: 500 }} />
        ) : null}
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      <Drawer {...drawerProps} title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editPierId ? 'Chỉnh sửa Cầu cảng' : 'Thêm mới Cầu cảng'}</span>} open={createDrawerVisible}
        onClose={() => { setCreateDrawerVisible(false); createForm.resetFields(); }}
        afterOpenChange={(open) => { if (!open) setEditPierId(undefined); }}
        extra={<Button type="text" onClick={() => { setCreateDrawerVisible(false); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={<div style={drawerFooterStyle}>{editPierId ? <Button htmlType="button" type="primary" onClick={() => pierFormRef.current?.submit('UPDATE')} style={primaryButtonStyle}>Cập nhật</Button> : <><Button htmlType="button" onClick={() => pierFormRef.current?.submit('DRAFT')} style={outlineButtonStyle}>Lưu tạm</Button><Button htmlType="button" type="primary" onClick={() => pierFormRef.current?.submit('SUBMIT')} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button><Button htmlType="button" type="primary" onClick={() => pierFormRef.current?.submit('APPROVED')} style={{ ...primaryButtonStyle, background: '#1BAF7A', borderColor: '#1BAF7A' }}>Lưu và phê duyệt</Button></>}</div>}
        styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}>
        <Form form={createForm} layout="vertical" initialValues={{ coordinateSystem: 1 }}>
          <style>{requiredMarkStyle}</style>
          <PierForm ref={pierFormRef} form={createForm} id={editPierId} onFinish={() => { setCreateDrawerVisible(false); void fetchData(); void fetchCounts(orgUnit); }} />
        </Form>
      </Drawer>

      <Drawer {...drawerProps} title={<span style={drawerTitleStyle}>Chi tiết cầu cảng{detailRecord ? ` - ${detailRecord.pierName}` : ''}</span>} open={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setDetailRecord(null); }}
        extra={<Button type="text" onClick={() => { setDetailDrawerVisible(false); setDetailRecord(null); }} style={drawerCloseBtnStyle}>✕</Button>}
        styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }} footer={null}>
        {detailRecord && <PierDetailContent selectedRecord={detailRecord} orgMap={orgMap} portMap={portMap} berthOptions={berthOptions} symbolMap={symbolMap} symbolImageMap={symbolImageMap} detailFiles={detailFiles} ddToDms={dd2dms} approvalStyleMap={APPROVAL_STYLE_MAP} operationalStyleMap={OPERATIONAL_STYLE_MAP} pierTypeMap={{} as any} userMap={userMap} />}
      </Drawer>

      <Modal title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa cầu cảng</span>} open={deleteModalOpen}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}>
        <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: 24 }}>
          Bạn sắp xóa cầu cảng <strong>{deletingRecord?.pierName}</strong>. Hành động này không thể hoàn tác.
        </p>
        <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
          Vui lòng nhập <strong>tên cầu</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
        </p>
        <Input placeholder="Nhập tên cầu hoặc XÓA" value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={handleConfirmDelete}
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} />
      </Modal>

      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }} title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen} onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cầu cảng:</p>
          {rejectingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectingRecord.pierCode} — {rejectingRecord.pierName}</strong></p>}
          <Input.TextArea placeholder="Nhập lý do từ chối..." value={rejectReason}
            onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
            rows={3} style={{ borderRadius: 8, fontSize: fontSizeMd, borderColor: rejectError ? statusCritical : undefined }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {rejectError ? <span style={{ color: statusCritical, fontSize: fontSizeMd }}>{rejectError}</span> : <span />}
            <span style={{ color: rejectReason.trim().length < 10 ? statusCritical : textTertiary, fontSize: fontSizeMd }}>
              {rejectReason.length}/10
            </span>
          </div>
        </div>
      </Modal>

      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Gửi phê duyệt</span>}
        open={submitModalOpen} onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={confirmSubmitApproval}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Xác nhận gửi phê duyệt cầu cảng <strong>{submittingRecord?.pierName}</strong>?
          </p>
        </div>
      </Modal>

      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận phê duyệt</span>}
        open={approveModalOpen} onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={() => { if (approvingRecord) { handleApprove(approvingRecord); } }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: statusOperational, borderColor: statusOperational }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Phê duyệt <strong>{approvingRecord?.pierCode} — {approvingRecord?.pierName}</strong>?
          </p>
        </div>
      </Modal>

      <Modal title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}><Space size={spaceSm}><HistoryOutlined style={{ color: actionPrimary, fontSize: 20 }} /><span style={{ color: actionPrimary, fontWeight: fontWeightBold, fontSize: fontSizeXl }}>{historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Cầu cảng' : (historyTarget ? `Lịch sử thay đổi — ${historyTarget.pierName}` : 'Lịch sử thay đổi')}</span></Space></div>}
        open={historyOpen} onCancel={() => setHistoryOpen(false)} footer={null} width={880}
        styles={{ body: { padding: spaceMd, maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}>
        <div style={{ flexShrink: 0 }}>
        {!historyLoading && (<div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceSm, alignItems: 'center' }}><Radio.Group value={historyMode} size="small" onChange={e => setHistoryMode(e.target.value)}><Radio.Button value="current" style={{ borderRadius: `${radiusPill}px 0 0 ${radiusPill}px`, fontWeight: fontWeightBold }}>Bản ghi hiện tại</Radio.Button><Radio.Button value="all" style={{ borderRadius: `0 ${radiusPill}px ${radiusPill}px 0`, fontWeight: fontWeightBold }}>Tất cả bản ghi</Radio.Button></Radio.Group></div>)}
        {!historyLoading && (<div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}><Input.Search placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch} onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} /><DatePicker placeholder="Từ ngày" value={historyFrom ? dayjs(historyFrom) : null} onChange={d => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')} style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} /><DatePicker placeholder="Đến ngày" value={historyTo ? dayjs(historyTo) : null} onChange={d => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm') : '')} style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} /></div>)}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {historyLoading ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div></div>
        ) : (() => {
          const ts = (t: string) => Math.floor(new Date(t).getTime() / 1000);
          const sorted = [...historyRecords].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime());
          const q = historySearch.toLowerCase().trim();
          const gs: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
          for (const r of sorted) {
            if (q) { const fn = (r.fieldName || r.fieldChanged || '').toLowerCase(); const ov = (r.oldValue || '').toLowerCase(); const nv = (r.newValue || '').toLowerCase(); const lb = histField(r.fieldName || r.fieldChanged).toLowerCase(); const od = histVal(r.fieldName || r.fieldChanged, String(r.oldValue || ''), orgMap).toLowerCase(); const nd = histVal(r.fieldName || r.fieldChanged, String(r.newValue || ''), orgMap).toLowerCase(); if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue; }
            if (historyFrom || historyTo) { const cd = (r.changedAt || r.createdAt || '').substring(0, 16); if (historyFrom && cd < historyFrom.replace(' ', 'T')) continue; if (historyTo && cd > historyTo.replace(' ', 'T') + ':59') continue; }
            const t = r.changedAt || r.createdAt || ''; const sec = t ? ts(t) : 0;
            const prev = gs[gs.length - 1];
            if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r); else gs.push({ tsSec: sec, ts: t, actor: r.changedBy || '', items: [r] });
          }
          if (gs.length === 0) return <div style={{ textAlign: 'center', padding: `${spaceXl}px 0`, color: textTertiary }}>Không tìm thấy kết quả phù hợp</div>;
          if (Object.keys(historyExpanded).length === 0) { const init: Record<number, boolean> = {}; gs.forEach((_, i) => { init[i] = false; }); setTimeout(() => setHistoryExpanded(init), 0); }
          const fmt = (t: string) => { const d = new Date(t); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}  ·  ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; };
          const vis = gs.slice(0, historyVisible);
          return <div style={{ maxHeight: '62vh', overflowY: 'auto' }} onScroll={e => { const el = e.currentTarget; if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && historyVisible < gs.length) setHistoryVisible(p => Math.min(p + 10, gs.length)); }}>
            {vis.map((g, gi) => (<div key={gi} style={{ display: 'flex', gap: spaceSm, marginBottom: gi < vis.length - 1 ? spaceSm : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: surfaceCard, border: `1px solid ${actionPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClockCircleFilled style={{ color: actionPrimary, fontSize: 14 }} /></div>{gi < gs.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 24, background: borderDefault, marginTop: 4 }} />}</div>
              <div style={{ ...cardStyle, flex: 1, padding: `${spaceSm}px ${spaceFormField}px`, borderRadius: radiusLg, boxShadow: shadowSm }}>
                <div onClick={() => setHistoryExpanded(p => ({ ...p, [gi]: !p[gi] }))} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, cursor: 'pointer' }}>
                  <span style={{ fontSize: 15, color: textPrimary, fontWeight: fontWeightBold }}>{g.ts ? fmt(g.ts) : '—'}</span>
                  {g.actor && <span style={{ fontSize: 13, color: textSecondary }}>— {g.actor}</span>}
                  {(() => { const a = actLabel(g.items); return <Tag color={a.color} style={{ fontSize: 11, marginLeft: spaceSm, borderRadius: radiusPill }}>{a.label}</Tag>; })()}
                  <span style={{ fontSize: 13, fontWeight: fontWeightBold, color: actionPrimary, background: `${actionPrimary}12`, borderRadius: radiusPill, padding: '2px 10px', marginLeft: 'auto' }}>{g.items.length}</span>
                  {historyExpanded[gi] ? <UpOutlined style={{ fontSize: 12, color: textTertiary }} /> : <DownOutlined style={{ fontSize: 12, color: textTertiary }} />}
                </div>
                {historyExpanded[gi] && <><Divider style={{ margin: `${spaceSm}px 0` }} /><table style={{ width: '100%' }}><tbody>{g.items.map((r: any, ri: number) => {
                  const fn = r.fieldName || r.fieldChanged;
                  const ov = r.oldValue != null && r.oldValue !== undefined && r.oldValue !== '(null)' && r.oldValue !== 'null' ? histVal(fn, String(r.oldValue), orgMap) : null;
                  const nv = r.newValue != null && r.newValue !== undefined && r.newValue !== '(null)' && r.newValue !== 'null' ? histVal(fn, String(r.newValue), orgMap) : null;
                  return <tr key={r.id || ri}><td style={{ padding: '4px 8px 4px 0', fontSize: 13, fontWeight: fontWeightMedium, color: textPrimary, whiteSpace: 'nowrap', width: 1 }}>{fn ? histField(fn) : '—'}</td><td style={{ padding: '4px 0', fontSize: 13 }}><Space size={spaceXs}>{ov ? (<Typography.Text delete style={{ fontSize: fontSizeMd, color: statusCritical }}>{ov}</Typography.Text>) : (<span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>)}<ArrowRightOutlined style={{ fontSize: 10, color: textTertiary }} />{nv ? (<Typography.Text strong style={{ fontSize: fontSizeMd, color: statusOperational }}>{nv}</Typography.Text>) : (<span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>)}</Space></td></tr>;
                })}</tbody></table></>}
              </div>
            </div>))}
          </div>;
        })()}
        </div>
      </Modal>
    </div>
  );
}
