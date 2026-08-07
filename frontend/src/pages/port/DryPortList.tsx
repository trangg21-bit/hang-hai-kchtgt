import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Tag, Modal, Descriptions, Input, Space, Typography, Alert, Divider, DatePicker, Radio, Select,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, HistoryOutlined, ExclamationCircleOutlined,
  SendOutlined, FileOutlined,
  ClockCircleFilled, ArrowRightOutlined, UpOutlined, DownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';
import { dryPortCRUD, dryPortApproval, dryPortHistory } from '../../services/portService';
import type { DryPort } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterBar, StatusTabs, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { VIETNAM_PROVINCES, VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import toast from '../../components/ToastNotification';
import {
  statusOperational, statusAttention, statusCritical, statusDraft,
  actionPrimary,
  cardStyle, textPrimary, textSecondary, textTertiary,
  fontSizeMd, fontSizeLg, fontSizeXl, fontWeightMedium, fontWeightBold,
  radiusPill, radiusLg, borderDefault,
  spaceSm, spaceMd, spaceFormField, metaStyle,
  surfaceCard, shadowSm,
} from '../../tokens';
import { colors } from '../../theme';

const { Text } = Typography;

/* ───────────────────────────────────────────────
   Constants
   ─────────────────────────────────────────────── */
const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Nháp' },
  DRAFT: { color: statusDraft, label: 'Nháp' },
  PENDING: { color: statusAttention, label: 'Chờ duyệt' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
};

const OPERATIONAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  OPERATIONAL: { color: statusOperational, label: 'Đang hoạt động' },
  SUSPENDED: { color: statusAttention, label: 'Tạm ngừng' },
};

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: textSecondary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING', label: 'Chờ duyệt', color: statusAttention },
  { key: 'APPROVED', label: 'Đã duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

const COORD_SYS_LABELS: Record<number, string> = { 1: 'WGS-84', 2: 'VN-2000' };
const DISPLAY_RULE_LABELS: Record<number, string> = { 1: 'Mặc định', 2: 'Zoom ≥ 10', 3: 'Zoom ≥ 12' };

/* ── Helpers ────────────────────────────────────────────── */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm'); } catch { return dateStr; }
}

function provinceName(provinceId: number | null | undefined): string {
  if (provinceId == null || provinceId < 1 || provinceId > VIETNAM_PROVINCES.length) return '—';
  return VIETNAM_PROVINCES[provinceId - 1];
}

const historyFieldLabels: Record<string, string> = {
  dryPortCode: 'Mã cảng cạn', dryPortName: 'Tên cảng cạn', provinceId: 'Tỉnh/Thành phố',
  operatingUnit: 'Đơn vị vận hành', region: 'Vùng', detailedLocation: 'Địa chỉ chi tiết',
  transportCorridor: 'Hành lang vận tải', area: 'Diện tích', warehouseArea: 'Diện tích kho',
  yardArea: 'Diện tích bãi', teuCapacity: 'Công suất TEU', connectionMode: 'Phương thức kết nối',
  portStatus: 'Tình trạng', operationalStatus: 'Trạng thái hoạt động', remarks: 'Ghi chú',
  mapSymbolId: 'Biểu tượng', coordinateSystem: 'Hệ tọa độ', displayRule: 'Quy tắc hiển thị',
  announcementTime: 'Thời điểm công bố', announcementDecisionNumber: 'Số QĐ công bố',
  announcementDecisionDate: 'Ngày QĐ công bố', announcementOrg: 'Đơn vị công bố',
  approvalStatus: 'Trạng thái phê duyệt', orgUnitId: 'Đơn vị quản lý',
  'Lý do từ chối': 'Lý do từ chối',
  'Trạng thái': 'Hành động',
};
function historyFieldName(fn: string) { return historyFieldLabels[fn] || fn; }
function historyFieldValue(fn: string, val: string | null, orgMap?: Map<string, string>, symbolMap?: Map<string, string>): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if ((fn === 'mapSymbolId' || fn === 'symbolId') && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'approvalStatus') { const m: Record<string,string> = { DRAFT:'Nháp', PENDING:'Chờ duyệt', APPROVED:'Đã duyệt', REJECTED:'Từ chối' }; return m[val] || val; }
  if (fn === 'operationalStatus') { const m: Record<string,string> = { OPERATIONAL:'Đang hoạt động', SUSPENDED:'Tạm ngừng' }; return m[val] || val; }
  if (fn === 'portStatus') { const m: Record<string,string> = { '0':'Hiện hữu', '1':'Đang xây dựng', '2':'Đã quy hoạch' }; return m[val] || val; }
  if (fn === 'announcementTime' || fn === 'changedAt' || fn === 'createdAt') { try { return dayjs(val).format('DD/MM/YYYY HH:mm'); } catch { return val; } }
  if (fn === 'announcementDecisionDate') { try { return dayjs(val).format('DD/MM/YYYY'); } catch { return val; } }
  return val;
}
function getActionLabel(items: any[]): { label: string; color: string } {
  const fields = items.map((i: any) => i.fieldName || '');
  const oldVals = items.map((i: any) => i.oldValue || '');
  const newVals = items.map((i: any) => i.newValue || '');
  if (fields.includes('deletedAt') || newVals.includes('Đã xóa')) return { label: 'Xóa', color: 'red' };
  if (fields.includes('approvalStatus')) {
    const newStatus = newVals[fields.indexOf('approvalStatus')];
    if (newStatus === 'APPROVED') return { label: 'Phê duyệt', color: 'green' };
    if (newStatus === 'REJECTED') return { label: 'Từ chối', color: 'red' };
    if (newStatus === 'PENDING') return { label: 'Gửi phê duyệt', color: 'orange' };
  }
  const nullCount = oldVals.filter(v => v === '(null)' || v === 'null').length;
  if (nullCount > items.length / 2) return { label: 'Tạo mới', color: 'blue' };
  return { label: 'Chỉnh sửa', color: 'blue' };
}

/* ───────────────────────────────────────────────
   Component
   ─────────────────────────────────────────────── */
export default function DryPortList() {
  const navigate = useNavigate();
  const hasPerm = usePermissionStore((s) => s.hasPermission);

  const [search, setSearch] = useState('');
  const [filterProvince, setFilterProvince] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [dataSource, setDataSource] = useState<DryPort[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DryPort | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DryPort | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<DryPort | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<DryPort | null>(null);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<DryPort | null>(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, boolean>>({});
  const [historySearch, setHistorySearch] = useState('');
  const historySearchRef = useRef('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyEntityName, setHistoryEntityName] = useState('');
  const [historyEntityId, setHistoryEntityId] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => map.set(o.id, o.code ? `${o.code} - ${o.name}` : o.name));
    return map;
  }, [organizations]);

  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    organizationService.list({ pageSize: 1000 }).then(r => setOrganizations(r.data || [])).catch(() => {});
    symbolService.list({ page: 1, pageSize: 1000, status: 'active' }).then(r => {
      const map = new Map<string, string>();
      (r.data || []).forEach((s: any) => map.set(s.id, s.name));
      setSymbolMap(map);
    }).catch(() => {});
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map(tab =>
          tab.key === 'all'
            ? dryPortCRUD.findAll({ page: 1, size: 1 })
            : dryPortCRUD.findAll({ page: 1, size: 1, approvalStatus: tab.key }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((r, i) => { counts[TAB_STATUS_LIST[i]?.key || 'all'] = r.status === 'fulfilled' ? r.value.total : 0; });
      setTabCounts(counts);
    } catch { /* ignore */ }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await dryPortCRUD.findAll({
        page, size: pageSize,
        search: search || undefined,
        approvalStatus: activeTab === 'all' ? undefined : activeTab,
      });
      setDataSource(res.data); setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cảng cạn'));
    } finally { setIsLoading(false); }
  }, [page, pageSize, search, activeTab]);

  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { void fetchCounts(); }, [fetchCounts]);

  const handleFilterSearch = useCallback((values: Record<string, any>) => {
    setSearch(values.search || '');
    setFilterProvince(values.provinceId || undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setFilterProvince(undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  const openDetailModal = useCallback(async (record: DryPort) => {
    setDetailModalOpen(true); setDetailRecord(record); setDetailFiles([]); setDetailLoading(true);
    setCollapsedSections({ general: false, capacity: false, announcement: false, location: false, files: false });
    try {
      const fresh = await dryPortCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch { /* keep current */ }
    try {
      const fileRes = await api.get(`/v1/documents/entity/dryport/${record.id}`, { params: { page: 0, size: 50 } });
      setDetailFiles(fileRes.data?.data?.content || fileRes.data?.data || []);
    } catch { setDetailFiles([]); }
    finally { setDetailLoading(false); }
  }, []);

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openDeleteModal = useCallback((record: DryPort) => {
    setDeletingRecord(record); setDeleteConfirmText(''); setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    if (deleteConfirmText.trim() !== deletingRecord.dryPortName) {
      toast.error('Tên cảng cạn không khớp');
      return;
    }
    try {
      await dryPortCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa cảng cạn');
      setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText('');
      void fetchData(); void fetchCounts();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Xóa thất bại'); }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts]);

  const openApproveModal = useCallback((record: DryPort) => {
    setApprovingRecord(record); setApproveModalOpen(true);
  }, []);

  const handleConfirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    try { await dryPortApproval.approve(approvingRecord.id); toast.success('Đã phê duyệt'); void fetchData(); void fetchCounts(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
    finally { setApproveModalOpen(false); setApprovingRecord(null); }
  }, [approvingRecord, fetchData, fetchCounts]);

  const openRejectModal = useCallback((record: DryPort) => {
    setRejectingRecord(record); setRejectReason(''); setRejectError(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { setRejectError('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { setRejectError('Lý do từ chối phải có ít nhất 10 ký tự'); return; }
    try {
      await dryPortApproval.reject(rejectingRecord.id, reason);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError('');
      void fetchData(); void fetchCounts();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Từ chối thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts]);

  const MANDATORY_FIELDS: { key: keyof DryPort; label: string }[] = [
    { key: 'orgUnitId', label: 'Đơn vị quản lý' },
    { key: 'dryPortName', label: 'Tên cảng cạn' },
    { key: 'provinceId', label: 'Tỉnh/Thành phố' },
    { key: 'detailedLocation', label: 'Địa chỉ chi tiết' },
    { key: 'teuCapacity', label: 'Công suất (TEU)' },
    { key: 'portStatus', label: 'Tình trạng' },
  ];

  const openSubmitModal = useCallback((record: DryPort) => {
    setSubmittingRecord(record); setSubmitModalOpen(true);
  }, []);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    setSubmitModalOpen(false);
    try {
      const fresh = await dryPortCRUD.findById(submittingRecord.id);
      const missing = MANDATORY_FIELDS
        .filter((f) => {
          const v = fresh[f.key];
          return v === null || v === undefined || v === '' || (typeof v === 'string' && !v.trim());
        })
        .map((f) => f.label);
      if (missing.length > 0) {
        toast.error(`Vui lòng hoàn thiện thông tin trước khi gửi. Thiếu: ${missing.join(', ')}`);
        setSubmittingRecord(null);
        return;
      }
      await dryPortCRUD.submit(submittingRecord.id);
      toast.success('Đã gửi phê duyệt');
      setSubmittingRecord(null);
      void fetchData(); void fetchCounts();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gửi duyệt thất bại'); }
  }, [submittingRecord, fetchData, fetchCounts]);

  const filterFields = useMemo(() => [
    { key: 'search', type: 'search' as const, label: 'Tìm kiếm', placeholder: 'Tìm theo mã, tên, địa chỉ...' },
    { key: 'provinceId', type: 'select' as const, label: 'Tỉnh/Thành phố', placeholder: 'Tất cả', options: VIETNAM_PROVINCE_OPTIONS },
  ], []);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('dryport:create')) {
      actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: <PlusOutlined />, onClick: () => navigate('/dry-port/create') });
    }
    return actions;
  }, [hasPerm, navigate]);

  const columns = useMemo(() => [
    { key: 'sequenceNo', label: 'STT', width: 55, type: 'mono' as const, align: 'center' as const,
      render: (_: unknown, __: DryPort, idx: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + idx + 1}</span> },
    { key: 'dryPortCode', label: 'Mã', dataIndex: 'dryPortCode', width: 130,
      render: (code: string) => <Tag color="cyan" style={{ fontSize: fontSizeMd }}>{code}</Tag> },
    { key: 'dryPortName', label: 'Tên cảng cạn', dataIndex: 'dryPortName', width: 220, ellipsis: true,
      render: (name: string) => <span style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary }}>{name || '—'}</span> },
    { key: 'provinceId', label: 'Tỉnh/TP', dataIndex: 'provinceId', width: 150, ellipsis: true,
      render: (v: number | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{provinceName(v)}</span> },
    { key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 130, align: 'center' as const,
      render: (status: string) => {
        const s = APPROVAL_STYLE_MAP[status || ''] || { color: textTertiary, label: status || '—' };
        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span>;
      }},
    {
      key: 'updatedAt',
      label: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      width: 160,
      align: 'center' as const,
      render: (v: string | null | undefined) => (
        <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
          {formatDate(v)}
        </span>
      ),
    },
  ], [page, pageSize]);

  const rowActions = useCallback((record: DryPort) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    const status = record.approvalStatus || '';
    const isDraft = status === 'DRAFT' || status === 'NHAP';
    const isPending = status === 'PENDING' || status === 'PENDING_APPROVAL';
    actions.push({ key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => openDetailModal(record) });
    if (hasPerm('dryport:update')) actions.push({ key: 'edit', label: isDraft ? 'Tiếp tục chỉnh sửa' : 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => navigate(`/dry-port/${record.id}/edit`) });
    if (isDraft) actions.push({ key: 'submit', label: 'Gửi phê duyệt', icon: <SendOutlined />, onClick: () => openSubmitModal(record) });
    if (isPending && hasPerm('dryport:approve')) {
      actions.push({ key: 'approve', label: 'Phê duyệt', icon: <CheckCircleOutlined />, onClick: () => openApproveModal(record) });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, onClick: () => openRejectModal(record), danger: true });
    }
    if ((isDraft || status === 'REJECTED') && hasPerm('dryport:delete')) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, onClick: () => openDeleteModal(record), danger: true });
    actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => { const eid = record.id; setHistoryModalOpen(true); setHistoryRecords([]); setHistoryLoading(true); setHistoryExpanded({}); setHistorySearch(''); historySearchRef.current = ''; setHistoryDateFrom(dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm')); setHistoryDateTo(dayjs().format('YYYY-MM-DD HH:mm')); setHistoryEntityName(record.dryPortName || ''); setHistoryEntityId(eid); setHistoryMode('current'); setHistoryEntityNames({}); setHistoryEntityFilter(''); dryPortHistory.getHistory(eid, { page: 0, size: 200 }).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setHistoryLoading(false)); } });
    return actions;
  }, [hasPerm, navigate, openDetailModal, openSubmitModal, openApproveModal, openRejectModal, openDeleteModal]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton rows={8} />;
    if (isError) return <ErrorState message={error?.message || 'Không thể tải danh sách cảng cạn'} onRetry={fetchData} />;
    if (dataSource.length === 0) return <EmptyState description={search || activeTab !== 'all' ? 'Không tìm thấy cảng cạn nào phù hợp' : 'Chưa có cảng cạn nào'} />;
    return (
      <div style={{ overflowX: 'auto' }}>
        <DataTable columns={columns} dataSource={dataSource} rowKey="id" rowActions={rowActions} scroll={{ x: 900 }} />
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </div>
    );
  };

  const renderDetailContent = () => {
    if (!detailRecord) return null;
    if (detailLoading) return <LoadingSkeleton rows={6} />;
    const r = detailRecord;
    const approvalLabel = APPROVAL_STYLE_MAP[r.approvalStatus || '']?.label || r.approvalStatus || '—';

    return (
      <div>
        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer' }}
          onClick={() => toggleSection('general')}>
          {collapsedSections['general'] ? '▶' : '▼'} Thông tin chung
        </Divider>
        {!collapsedSections['general'] && (
        <Descriptions column={2} size="small" bordered labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Mã cảng cạn">{r.dryPortCode || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tên cảng cạn">{r.dryPortName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Đơn vị quản lý" span={2}>{orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—'}</Descriptions.Item>
          <Descriptions.Item label="Đơn vị khai thác">{r.operatingUnit || '—'}</Descriptions.Item>
          <Descriptions.Item label="Khu vực">{r.region || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tỉnh/TP">{provinceName(r.provinceId)}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ chi tiết">{r.detailedLocation || '—'}</Descriptions.Item>
          <Descriptions.Item label="Hành lang vận tải">{r.transportCorridor || '—'}</Descriptions.Item>
          <Descriptions.Item label="Kết nối giao thông">{r.connectionMode || '—'}</Descriptions.Item>
          <Descriptions.Item label="Ghi chú" span={2}>{r.remarks || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tình trạng">
            <Tag color={r.portStatus === 1 ? statusOperational : textTertiary}>{r.portStatus === 1 ? 'Vận hành' : 'Chưa khai thác'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={APPROVAL_STYLE_MAP[r.approvalStatus || '']?.color || 'default'}>{approvalLabel}</Tag>
          </Descriptions.Item>
        </Descriptions>
        )}

        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('capacity')}>
          {collapsedSections['capacity'] ? '▶' : '▼'} Năng lực
        </Divider>
        {!collapsedSections['capacity'] && (
        <Descriptions column={2} size="small" bordered labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Công suất (TEU/năm)">{r.teuCapacity?.toLocaleString('vi-VN') || '—'}</Descriptions.Item>
          <Descriptions.Item label="Tổng diện tích (m²)">{r.area?.toLocaleString('vi-VN') || '—'}</Descriptions.Item>
          <Descriptions.Item label="Diện tích kho (m²)">{r.warehouseArea?.toLocaleString('vi-VN') || '—'}</Descriptions.Item>
          <Descriptions.Item label="Diện tích bãi (m²)">{r.yardArea?.toLocaleString('vi-VN') || '—'}</Descriptions.Item>
        </Descriptions>
        )}

        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('announcement')}>
          {collapsedSections['announcement'] ? '▶' : '▼'} Thông tin công bố
        </Divider>
        {!collapsedSections['announcement'] && (
        <Descriptions column={2} size="small" bordered labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Thời điểm công bố" span={2}>{r.announcementTime ? formatDate(r.announcementTime) : '—'}</Descriptions.Item>
          <Descriptions.Item label="Số QĐ công bố">{r.announcementDecisionNumber || '—'}</Descriptions.Item>
          <Descriptions.Item label="Ngày ra QĐ">{r.announcementDecisionDate ? dayjs(r.announcementDecisionDate).format('DD/MM/YYYY') : '—'}</Descriptions.Item>
          <Descriptions.Item label="Đơn vị ra QĐ" span={2}>{r.announcementOrg || '—'}</Descriptions.Item>
        </Descriptions>
        )}

        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('location')}>
          {collapsedSections['location'] ? '▶' : '▼'} Thông tin vị trí
        </Divider>
        {!collapsedSections['location'] && (
        <Descriptions column={2} size="small" bordered labelStyle={{ width: 180, whiteSpace: 'nowrap' }}>
          <Descriptions.Item label="Biểu tượng bản đồ">{symbolMap.get(r.mapSymbolId || '') || r.mapSymbolId || '—'}</Descriptions.Item>
          <Descriptions.Item label="Hệ quy chiếu">{COORD_SYS_LABELS[r.coordinateSystem || 0] || r.coordinateSystem || '—'}</Descriptions.Item>
          <Descriptions.Item label="Quy tắc hiển thị">{DISPLAY_RULE_LABELS[r.displayRule || 0] || r.displayRule || '—'}</Descriptions.Item>
          <Descriptions.Item label="Kinh độ">{r.longitude != null ? r.longitude : '—'}</Descriptions.Item>
          <Descriptions.Item label="Vĩ độ">{r.latitude != null ? r.latitude : '—'}</Descriptions.Item>
          <Descriptions.Item label="Tọa độ (WKT)" span={2}>{r.coordinates || '—'}</Descriptions.Item>
        </Descriptions>
        )}

        <Divider orientation="left" style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg, cursor: 'pointer', marginTop: spaceMd }}
          onClick={() => toggleSection('files')}>
          {collapsedSections['files'] ? '▶' : '▼'} File đính kèm
        </Divider>
        {!collapsedSections['files'] && (
          detailFiles.length === 0
            ? <EmptyState description="Chưa có file đính kèm" />
            : detailFiles.map((f: any) => (
                <div key={f.id} style={{ marginBottom: spaceSm }}>
                  <a href={`/api/v1/documents/${f.id}/file`} target="_blank" rel="noopener noreferrer"
                    style={{ color: actionPrimary, fontSize: fontSizeMd }}>
                    <FileOutlined style={{ marginRight: 8 }} />
                    {f.fileName || f.name} ({(f.fileSize / 1024).toFixed(1)} KB)
                  </a>
                </div>
              ))
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Cảng cạn' }]} actions={headerActions} />
      <FilterBar fields={filterFields} onSearch={handleFilterSearch} onReset={handleFilterReset} />
      <div style={{ ...cardStyle, marginBottom: spaceMd, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 16px' }}>
        <StatusTabs tabs={TAB_STATUS_LIST.map(t => ({ ...t, count: tabCounts[t.key] ?? 0, active: t.key === activeTab }))} onChange={handleTabChange} />
      </div>
      <div style={{ ...cardStyle, padding: '8px 16px' }}>{renderContent()}</div>

      {/* Detail Modal */}
      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }}
        title={
          <Space>
            <span style={{ color: actionPrimary, fontWeight: fontWeightBold, fontSize: 15 }}>
              {detailRecord ? `${detailRecord.dryPortCode} — ${detailRecord.dryPortName}` : 'Chi tiết cảng cạn'}
            </span>
            {detailRecord && (
              <>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium,
                  background: detailRecord.portStatus === 1 ? `${statusOperational}15` : `${textTertiary}15`,
                  color: detailRecord.portStatus === 1 ? statusOperational : textTertiary }}>
                  {detailRecord.portStatus === 1 ? 'Vận hành' : 'Chưa khai thác'}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusPill, fontSize: fontSizeMd, fontWeight: fontWeightMedium,
                  background: `${(APPROVAL_STYLE_MAP[detailRecord.approvalStatus || ''] || { color: textTertiary }).color}15`,
                  color: (APPROVAL_STYLE_MAP[detailRecord.approvalStatus || ''] || { color: textTertiary }).color }}>
                  {(APPROVAL_STYLE_MAP[detailRecord.approvalStatus || ''] || { label: detailRecord.approvalStatus || '—' }).label}
                </span>
              </>
            )}
          </Space>
        }
        open={detailModalOpen} onCancel={() => { setDetailModalOpen(false); setDetailRecord(null); }}
        width={700} destroyOnClose styles={{ body: { padding: spaceMd, maxHeight: '68vh', overflowY: 'auto' } }}
        footer={[
          <Button key="close" onClick={() => { setDetailModalOpen(false); setDetailRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Đóng</Button>,
          detailRecord && hasPerm('dryport:update') ? (
            <Button key="edit" type="primary" icon={<EditOutlined />}
              onClick={() => { setDetailModalOpen(false); navigate(`/dry-port/${detailRecord.id}/edit`); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Chỉnh sửa</Button>
          ) : null,
          detailRecord && hasPerm('dryport:history') ? (
            <Button key="history" icon={<HistoryOutlined />}
              onClick={() => { const r = detailRecord; const eid = r?.id; setDetailModalOpen(false); setHistoryModalOpen(true); setHistoryRecords([]); setHistoryLoading(true); setHistoryExpanded({}); setHistorySearch(''); historySearchRef.current = ''; setHistoryDateFrom(dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm')); setHistoryDateTo(dayjs().format('YYYY-MM-DD HH:mm')); setHistoryEntityName(r?.dryPortName || ''); setHistoryMode('current'); setHistoryEntityNames({}); if (eid) dryPortHistory.getHistory(eid, { page: 0, size: 200 }).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setHistoryLoading(false)); }}
             style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Lịch sử</Button>
          ) : null,
          detailRecord && (detailRecord.approvalStatus === 'DRAFT' || detailRecord.approvalStatus === 'NHAP' || detailRecord.approvalStatus === 'REJECTED') && hasPerm('dryport:delete') ? (
            <Button key="delete" danger icon={<DeleteOutlined />}
              onClick={() => { setDetailModalOpen(false); openDeleteModal(detailRecord); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xóa</Button>
          ) : null,
          detailRecord && (detailRecord.approvalStatus === 'PENDING' || detailRecord.approvalStatus === 'PENDING_APPROVAL') && hasPerm('dryport:approve') ? (
            <>
              <Button key="reject" danger icon={<CloseCircleOutlined />}
                onClick={() => { openRejectModal(detailRecord); }}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Từ chối</Button>
              <Button key="approve" icon={<CheckCircleOutlined />}
                onClick={() => { openApproveModal(detailRecord); }}
                style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, color: statusOperational, borderColor: statusOperational }}>Phê duyệt</Button>
            </>
          ) : null,
        ]}>{renderDetailContent()}</Modal>

      {/* Delete Modal */}
      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }} title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa cảng cạn</span>}
        open={deleteModalOpen} onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="delete" type="primary" danger onClick={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận xóa</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <Alert message="Hành động này không thể hoàn tác" type="warning" showIcon icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: spaceFormField, borderRadius: radiusPill }} />
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập <strong>tên cảng cạn</strong> để xác nhận xóa.</p>
          {deletingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>Cảng cạn: <strong style={{ color: textPrimary }}>{deletingRecord.dryPortName}</strong></p>}
          <Input placeholder='Nhập tên cảng cạn để xác nhận' value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
            onPressEnter={handleConfirmDelete} style={{ borderRadius: radiusPill, height: 40 }} autoFocus />
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận phê duyệt</span>}
        open={approveModalOpen} onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={handleConfirmApprove}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: statusOperational, borderColor: statusOperational }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Phê duyệt <strong>{approvingRecord?.dryPortCode} — {approvingRecord?.dryPortName}</strong>?
          </p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }} title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen} onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cảng cạn:</p>
          {rejectingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectingRecord.dryPortCode} — {rejectingRecord.dryPortName}</strong></p>}
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

      {/* Submit Modal */}
      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi phê duyệt</span>}
        open={submitModalOpen} onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.dryPortCode} — {submittingRecord?.dryPortName}</strong> để phê duyệt?
          </p>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal maskStyle={{ background: 'rgba(0, 0, 0, 0.4)' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm}>
              <HistoryOutlined style={{ color: actionPrimary, fontSize: 20 }} />
              <span style={{ color: actionPrimary, fontWeight: fontWeightBold, fontSize: fontSizeXl }}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Cảng cạn' : (historyEntityName ? `Lịch sử thay đổi — ${historyEntityName}` : 'Lịch sử thay đổi')}
              </span>
            </Space>
          </div>
        }
        open={historyModalOpen} onCancel={() => setHistoryModalOpen(false)} footer={null} width={880}
        styles={{ body: { padding: spaceMd, maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}>
<div style={{ flexShrink: 0 }}>
        {!historyLoading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceSm, alignItems: 'center' }}>
            <Radio.Group value={historyMode} size="small"
              onChange={e => { const mode = e.target.value; setHistoryMode(mode); setHistoryLoading(true); setHistoryRecords([]); if (mode === 'all') { dryPortHistory.getAll({ page: 0, size: 500 }).then((d: any) => { setHistoryRecords(d.changeHistory || []); setHistoryEntityNames(d.entityNames || {}); }).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setHistoryLoading(false)); } else { dryPortHistory.getHistory(historyEntityId, { page: 0, size: 200 }).then((d: any) => { setHistoryRecords(d.changeHistory || []); }).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setHistoryLoading(false)); } }}>
              <Radio.Button value="current" style={{ borderRadius: `${radiusPill}px 0 0 ${radiusPill}px`, fontWeight: fontWeightBold, color: historyMode !== 'current' ? textSecondary : undefined }}>Bản ghi hiện tại {historyMode === 'current' ? <Tag color="blue" style={{ borderRadius: radiusPill, fontSize: 11, marginLeft: 4 }}>{historyRecords.filter((r: any, i: number, arr: any[]) => { const s = Math.floor(new Date(r.changedAt || r.createdAt || 0).getTime()/1000); const a = r.changedBy || ''; return arr.findIndex((x: any) => Math.floor(new Date(x.changedAt || x.createdAt || 0).getTime()/1000) === s && (x.changedBy || '') === a) === i; }).length}</Tag> : <span style={{ marginLeft: 4 }}>...</span>}</Radio.Button>
              <Radio.Button value="all" style={{ borderRadius: `0 ${radiusPill}px ${radiusPill}px 0`, fontWeight: fontWeightBold, color: historyMode !== 'all' ? textSecondary : undefined }}>Tất cả bản ghi {historyMode === 'all' ? <Tag color="blue" style={{ borderRadius: radiusPill, fontSize: 11, marginLeft: 4 }}>{historyRecords.filter((r: any, i: number, arr: any[]) => { const s = Math.floor(new Date(r.changedAt || r.createdAt || 0).getTime()/1000); const a = r.changedBy || ''; return arr.findIndex((x: any) => Math.floor(new Date(x.changedAt || x.createdAt || 0).getTime()/1000) === s && (x.changedBy || '') === a) === i; }).length}</Tag> : <span style={{ marginLeft: 4 }}>...</span>}</Radio.Button>
            </Radio.Group>
          </div>
        )}
        {!historyLoading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input.Search placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
              onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
            {historyMode === 'all' && <Select placeholder="Chọn cảng cạn" allowClear showSearch value={historyEntityFilter || undefined}
              onChange={v => setHistoryEntityFilter(v || '')}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              style={{ width: 200, borderRadius: radiusPill, height: 40 }}
              options={Object.entries(historyEntityNames).map(([id, name]) => ({ value: id, label: name }))} />}
            <DatePicker placeholder="Từ ngày" value={historyDateFrom ? dayjs(historyDateFrom) : null}
              onChange={d => setHistoryDateFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <DatePicker placeholder="Đến ngày" value={historyDateTo ? dayjs(historyDateTo) : null}
              onChange={d => setHistoryDateTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
          </div>
        )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {historyLoading ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div></div>
        ) : (() => { const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000); const sorted = [...historyRecords].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime()); const q = historySearch.toLowerCase().trim(); const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = []; for (const r of sorted) { if (q) { const fn = (r.fieldName || '').toLowerCase(); const ov = (r.oldValue || '').toLowerCase(); const nv = (r.newValue || '').toLowerCase(); const lb = historyFieldName(r.fieldName || '').toLowerCase(); const od = historyFieldValue(r.fieldName, r.oldValue, orgMap, symbolMap).toLowerCase(); const nd = historyFieldValue(r.fieldName, r.newValue, orgMap, symbolMap).toLowerCase(); if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue; } if (historyEntityFilter && r.entityId !== historyEntityFilter) continue; if (historyDateFrom || historyDateTo) { const cd = (r.changedAt || r.createdAt || '').substring(0, 16); if (historyDateFrom && cd < historyDateFrom.replace(' ', 'T')) continue; if (historyDateTo && cd > historyDateTo.replace(' ', 'T') + ':59') continue; } const ts = r.changedAt || r.createdAt || ''; const sec = ts ? toSec(ts) : 0; const prev = groups[groups.length - 1]; if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r); else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] }); } if (groups.length === 0) return (<div style={{ textAlign: 'center', padding: '32px 0' }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyDateFrom ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div></div>); const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}  ·  ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; }; if (historySearchRef.current === 'initial') { historySearchRef.current = ''; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = true; }); setTimeout(() => setHistoryExpanded(init), 0); } else if (q.length > 0 && historySearchRef.current !== q) { historySearchRef.current = q; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = true; }); setTimeout(() => setHistoryExpanded(init), 0); } else if (q.length === 0 && historySearchRef.current !== '') { historySearchRef.current = ''; const init: Record<number, boolean> = {}; groups.forEach((_, i) => { init[i] = false; }); setTimeout(() => setHistoryExpanded(init), 0); } return (<div>{groups.map((g, gi) => (<div key={gi} style={{ display: 'flex', gap: spaceSm, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: surfaceCard, border: `1px solid ${actionPrimary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClockCircleFilled style={{ color: actionPrimary, fontSize: 14 }} /></div>{gi < groups.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 24, background: borderDefault, marginTop: 4 }} />}</div><div style={{ ...cardStyle, flex: 1, padding: `${spaceSm}px ${spaceFormField}px`, marginBottom: 0, borderRadius: radiusLg, boxShadow: shadowSm }}><div onClick={() => setHistoryExpanded(prev => ({ ...prev, [gi]: !prev[gi] }))} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, cursor: 'pointer' }}><Text style={{ fontSize: fontSizeLg, color: textPrimary, fontWeight: fontWeightBold }}>{g.ts ? fmtTime(g.ts) : '—'}</Text>{g.actor && <Text style={{ fontSize: fontSizeMd, color: textSecondary }}>— {g.actor}</Text>}{(() => { const a = getActionLabel(g.items); return <Tag color={a.color} style={{ fontSize: 11, marginLeft: spaceSm, borderRadius: radiusPill }}>{a.label}</Tag>; })()}<span style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: actionPrimary, background: `${actionPrimary}12`, borderRadius: radiusPill, padding: '2px 10px', marginLeft: 'auto' }}>{g.items.length}</span>{historyExpanded[gi] === false ? <DownOutlined style={{ fontSize: 12, color: textTertiary }} /> : <UpOutlined style={{ fontSize: 12, color: textTertiary }} />}</div>{historyExpanded[gi] !== false && <><Divider style={{ margin: `${spaceSm}px 0`, borderColor: borderDefault }} /><table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{g.items.map((r: any, ri: number) => { const fn = r.fieldName || ''; const ov = r.oldValue !== undefined && r.oldValue != null ? historyFieldValue(fn, r.oldValue, orgMap, symbolMap) : null; const nv = r.newValue !== undefined && r.newValue != null ? historyFieldValue(fn, r.newValue, orgMap, symbolMap) : null; return (<tr key={r.id || ri}><td style={{ padding: '4px 8px 4px 0', fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: textPrimary, whiteSpace: 'nowrap', verticalAlign: 'middle', width: 1 }}>{historyMode === 'all' ? <><Tag color="blue" style={{ marginRight: 4, fontSize: 10, cursor: 'pointer', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setHistoryEntityId(r.entityId); setHistoryEntityName(historyEntityNames[r.entityId] || ''); setHistoryMode('current'); setHistoryLoading(true); setHistoryRecords([]); historySearchRef.current = 'initial'; dryPortHistory.getHistory(r.entityId, { page: 0, size: 200 }).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setHistoryLoading(false)); }} onClick={(e) => { e.stopPropagation(); setHistoryEntityId(r.entityId); setHistoryEntityName(historyEntityNames[r.entityId] || ''); setHistoryMode('current'); setHistoryLoading(true); setHistoryRecords([]); historySearchRef.current = 'initial'; dryPortHistory.getHistory(r.entityId, { page: 0, size: 200 }).then((d: any) => setHistoryRecords(d.changeHistory || [])).catch(() => toast.error('Không thể tải lịch sử')).finally(() => setHistoryLoading(false)); }}>{historyEntityNames[r.entityId] || r.entityId?.substring(0,8)}</Tag> </> : null}{fn ? historyFieldName(fn) : '—'}</td><td style={{ padding: '4px 0', verticalAlign: 'middle' }}><Space size={4}>{ov ? <Text delete style={{ fontSize: fontSizeMd, color: statusCritical }}>{ov}</Text> : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}<ArrowRightOutlined style={{ fontSize: 10, color: textTertiary }} />{nv ? <Text strong style={{ fontSize: fontSizeMd, color: statusOperational }}>{nv}</Text> : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>}</Space></td></tr>); })}</tbody></table></>}</div></div>))}</div>); })()}
      </div>
      </Modal>
    </div>
  );
}
