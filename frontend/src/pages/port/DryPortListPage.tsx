import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button, Modal, Input, Space, Typography, DatePicker, Radio, Select,
  Form,
} from 'antd';
import {
  HistoryOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import { dryPortCRUD, dryPortApproval, dryPortHistory } from '../../services/portService';
import type { DryPort } from '../../types/port';
import DryPortDetailContent from './DryPortDetailContent';
import DryPortForm, { type DryPortFormHandle } from './DryPortForm';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import { userService } from '../../services/userService';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { symbolService } from '../../services/symbolService';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { ScreenHeader, FilterTableLayout, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { VIETNAM_PROVINCES } from '../../types/common';
import toast from '../../components/ToastNotification';
import AppDrawer from '../../components/shared/AppDrawer';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  fontSizeMd,
  fontSizeLg,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  radiusPill,
  borderDefault,
  spaceSm,
  spaceMd,
  spaceFormField,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyInfoTitleStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
  spaceXs,
  spaceXl,
  drawerTitleStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  statusBadgeStyle,
  cellTitleStyle,
  cellSubtitleStyle,
  icons,
  colors,
  getRangePickerProps,
  formatUserDisplayName,
  isUuidString,
} from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider, type ThemeToken } from '../../context/ThemeTokenContext';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalModal from '../../components/shared/ApprovalModal';

/* ───────────────────────────────────────────────
   Constants
   ─────────────────────────────────────────────── */
const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
};

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: 'APPROVED_LEVEL2', label: 'Chờ phê duyệt cấp cục', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp cục', color: statusCritical },
];

const PORT_STATUS_OPTIONS = [
  { value: 1, label: 'Đang khai thác/vận hành' },
  { value: 0, label: 'Chưa khai thác/vận hành' },
  { value: 2, label: 'Dừng khai thác/vận hành' },
];

const REGION_OPTIONS = [
  { value: 'Miền Bắc', label: 'Miền Bắc' },
  { value: 'Miền Trung', label: 'Miền Trung' },
  { value: 'Miền Nam', label: 'Miền Nam' },
];

/* ── Chuyển độ thập phân → DMS (Độ/Phút/Giây) ── */
const ddToDms = (dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } => {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  const abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
};

/* ── Helpers ────────────────────────────────────────────── */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
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
  if (val === null || val === undefined || val === '' || val === 'null') return '—';
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
  if (field === 'approvalStatus') return APPROVAL_STYLE_MAP[val]?.label || val;
  return val;
}

function formatHistoryValue(field: string, val: string | null | undefined): string {
  if (val === null || val === undefined || val === '' || val === 'null') return '—';
  if (field === 'approvalStatus') return APPROVAL_STYLE_MAP[val]?.label || val;
  return val;
}

function getDryPortActionMeta(item: any): { label: string; color: string; bg: string } {
  const rawAction = (item?.action || '').toString().trim().toUpperCase();
  const rawStatus = (item?.status || item?.approvalStatus || '').toString().trim().toUpperCase();
  const rawReason = (item?.approvalReason || item?.reason || item?.content || item?.note || '').toString().trim().toLowerCase();
  const level = typeof item?.approvalLevel === 'number' ? item.approvalLevel : parseInt(item?.approvalLevel, 10);
  const changes = Array.isArray(item?.changes) ? item.changes : [];

  if (rawAction === 'CREATE') {
    return { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawReason.includes('phê duyệt cấp cảng vụ') || rawReason.includes('phe duyet cap cang vu')) {
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (rawReason.includes('phê duyệt cấp cục') || rawReason.includes('phe duyet cap cuc')) {
    return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawReason.includes('từ chối cấp cảng vụ') || rawReason.includes('tu choi cap cang vu')) {
    return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
  }
  if (rawReason.includes('từ chối cấp cục') || rawReason.includes('tu choi cap cuc')) {
    return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
  }

  const approvalChange = changes.find((c: any) => {
    const k = normalizeHistoryKey(c.field || '');
    return k === 'approvalstatus' || k === 'trang thai phe duyet' || k === 'trang thai';
  });
  if (approvalChange) {
    const nv = normalizeHistoryKey(approvalChange.newValue || '');
    if (nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu'))) return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    if (nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc'))) return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    if (nv.includes('approved_level1') || nv.includes('cap 1') || nv.includes('cuc duyet')) return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    if (nv.includes('approved') || nv.includes('da duyet') || nv.includes('da phe duyet')) return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    if (nv.includes('tu choi') || nv.includes('rejected')) return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    if (nv.includes('cho cang vu duyet') || nv.includes('cho phe duyet') || nv.includes('pending') || nv.includes('proposed') || nv.includes('luu tam')) return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
  }
  if (rawStatus === 'SUBMITTED' || rawStatus === 'PENDING' || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet')) {
    return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
  }
  if (rawStatus === 'DELETED' || rawStatus === 'DELETE' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
    return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
  }
  if (level === 1 || String(item.approvalLevel).includes('LEVEL_1')) {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (level === 2 || String(item.approvalLevel).includes('LEVEL_2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
    return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
  }
  return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
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
  const [filterCollapsed, setFilterCollapsed] = useState(true);

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
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistorySearchInput(''); setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryMode('current');
    try {
      const d = await dryPortHistory.getHistory(r.id, { page: 0, size: 200 });
      setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []);
    } catch { toast.error('Không thể tải lịch sử thay đổi'); }
    finally { setHistoryLoading(false); }
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
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      if (q) {
        const fn = (r.fieldName || '').toLowerCase();
        const ov = (r.oldValue || '').toLowerCase();
        const nv = (r.newValue || '').toLowerCase();
        const lb = historyFieldName(r.fieldName || '').toLowerCase();
        const od = historyFieldValue(r.fieldName, r.oldValue, orgMap, symbolMap).toLowerCase();
        const nd = historyFieldValue(r.fieldName, r.newValue, orgMap, symbolMap).toLowerCase();
        if (!fn.includes(q) && !ov.includes(q) && !nv.includes(q) && !lb.includes(q) && !od.includes(q) && !nd.includes(q)) continue;
      }
      if (historyEntityFilter && r.entityId !== historyEntityFilter) continue;
      if (historyFrom || historyTo) {
        const cd = (r.changedAt || r.createdAt || '').substring(0, 16);
        if (historyFrom && cd < historyFrom.replace(' ', 'T')) continue;
        if (historyTo && cd > historyTo.replace(' ', 'T') + ':59') continue;
      }
      const ts = r.changedAt || r.createdAt || '';
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === (r.changedBy || '')) prev.items.push(r);
      else groups.push({ tsSec: sec, ts, actor: r.changedBy || '', items: [r] });
    }

    if (groups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyFrom ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
        </div>
      );
    }

    const fmtTime = (ts: string) => {
      const d = new Date(ts);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}  ·  ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };

    return (
      <div>{groups.map((g, gi) => {
        const actionMeta = getDryPortActionMeta({ ...g.items[0], changes: g.items });
        const isCreate = actionMeta.label === 'Tạo mới';
        const barColor = actionMeta.color;
        const unitName = orgMap.get(historyTarget?.orgUnitId || '') || '—';
        const informationTitle = 'Thông tin chi tiết';

        const orderedChanges = [...g.items].sort((a, b) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.fieldName || a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.fieldName || b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });

        return (
          <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
            <div style={{ minWidth: 0, paddingTop: spaceXs }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                <Typography.Text style={historyTimeStyle}>
                  {g.ts ? fmtTime(g.ts) : '—'}
                </Typography.Text>
                <span style={{ flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>{actionMeta.label}</span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                <Typography.Text style={historyMetaRowStyle}>
                  Cán bộ cập nhật: {formatUserDisplayName(g.actor, null, userMap)}
                </Typography.Text>
                <Typography.Text style={historyMetaRowStyle}>
                  Đơn vị: {unitName}
                </Typography.Text>
              </div>
            </div>
            <div style={historyInfoCardStyle}>
              <div style={historyAccentBarStyle(barColor)} />
              <Typography.Text style={historyInfoTitleStyle}>
                {informationTitle}
              </Typography.Text>
              {orderedChanges.length > 0 ? <div>{orderedChanges.map((change, ri: number) => {
                const fn = change.fieldName || change.field;
                const ov = formatHistoryValue(fn, change.oldValue);
                const nv = formatHistoryValue(fn, change.newValue);
                return isCreate ? (
                  <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                    <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                    <span title={nv ?? '—'} style={historyNewValueStyle}>{nv ?? '—'}</span>
                  </div>
                ) : (
                  <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                    <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                    <span title={ov ?? '—'} style={historyOldValueStyle}>{ov ?? '—'}</span>
                    <span style={historyArrowStyle}>→</span>
                    <span title={nv ?? '—'} style={historyNewValueStyle}>{nv ?? '—'}</span>
                  </div>
                );
              })}</div> : <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>}
            </div>
          </div>
        );
      })}</div>
    );
  };

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
  const [formEditId, setFormEditId] = useState<string | undefined>();
  const [editingName, setEditingName] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'approve'>('draft');

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const createFormRef = useRef<DryPortFormHandle>(null);
  const updateFormRef = useRef<DryPortFormHandle>(null);

  const currentUser = useAuthStore((s) => s.user);
  const isSystemAdmin = currentUser?.permissions?.includes('*') || false;
  const isAuditViewer = currentUser?.permissions?.includes('admin:manage') || currentUser?.permissions?.includes('admin:operation') || false;

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
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map(tab =>
          tab.key === 'all'
            ? dryPortCRUD.findAll({ page: 1, size: 1, orgUnitId: orgId && orgId !== '__all__' ? orgId : undefined })
            : dryPortCRUD.findAll({ page: 1, size: 1, approvalStatus: tab.key, orgUnitId: orgId && orgId !== '__all__' ? orgId : undefined }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((r, i) => { counts[TAB_STATUS_LIST[i]?.key || 'all'] = r.status === 'fulfilled' ? r.value.total : 0; });
      setTabCounts(counts);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false);
    try {
      const res = await dryPortCRUD.findAll({
        page, size: pageSize,
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
      setDataSource(res.data); setTotal(res.total);
    } catch {
      setIsError(true);
    } finally { setIsLoading(false); }
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
      const [res1, res2] = await Promise.allSettled([
        api.get(`/v1/documents/entity/dryport/${record.id}`, { params: { page: 0, size: 50 } }),
        api.get(`/v1/documents/entity/dry-port/${record.id}`, { params: { page: 0, size: 50 } }),
      ]);
      const atts1 = res1.status === 'fulfilled' ? (res1.value.data?.data?.content || res1.value.data?.data || []) : [];
      const atts2 = res2.status === 'fulfilled' ? (res2.value.data?.data?.content || res2.value.data?.data || []) : [];
      const combined = [
        ...(Array.isArray(atts1) ? atts1 : []),
        ...(Array.isArray(atts2) ? atts2 : []).filter((b: any) => !(Array.isArray(atts1) ? atts1 : []).some((a: any) => a.id === b.id)),
      ];
      setDetailFiles(combined);
    } catch {
      setDetailFiles([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEmbeddedAction || !linkedRecordId) return;
    let cancelled = false;
    dryPortCRUD.findById(linkedRecordId)
      .then((record) => {
        if (cancelled) return;
        if (linkedAction === 'detail') {
          void openDetailModal(record);
        } else {
          setFormEditId(linkedRecordId);
          setEditingName(record.dryPortName || '');
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
    if (provinceId == null || provinceId < 1 || provinceId > VIETNAM_PROVINCES.length) return '—';
    return VIETNAM_PROVINCES[provinceId - 1] || '—';
  }, []);

  const openDeleteModal = useCallback((record: DryPort) => {
    setDeletingRecord(record); setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await dryPortCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa cảng cạn');
      setDeleteModalOpen(false); setDeletingRecord(null);
      void fetchData(); void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Xóa thất bại'); }
    finally { setDeleteLoading(false); }
  }, [deletingRecord, fetchData, fetchCounts, filterOrgUnitId]);

  const openApproveModal = useCallback((record: DryPort) => {
    setApprovingRecord(record); setApproveModalOpen(true);
  }, []);

  const handleConfirmApprove = useCallback(async () => {
    if (!approvingRecord) return;
    try { await dryPortApproval.approve(approvingRecord.id); toast.success('Đã phê duyệt'); void fetchData(); void fetchCounts(filterOrgUnitId); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
    finally { setApproveModalOpen(false); setApprovingRecord(null); }
  }, [approvingRecord, fetchData, fetchCounts, filterOrgUnitId]);

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
      void fetchData(); void fetchCounts(filterOrgUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Từ chối thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, filterOrgUnitId]);

  const headerActions = useMemo(() => {
    const actions: any[] = [];
    if (hasPerm('dryport:create')) {
      actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary' as const, icon: icons.create, onClick: () => { setFormEditId(undefined); setCreateDrawerOpen(true); } });
    }
    return actions;
  }, [hasPerm]);

  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'approvalStatus') return APPROVAL_STYLE_MAP[r.approvalStatus || '']?.label ?? r.approvalStatus ?? '';
    if (field === 'updatedBy') return userMap.get(r.updatedBy || '') ?? r.updatedBy ?? '';
    return r[field] ?? '';
  }, [userMap]);

  const columns = useMemo(() => {
    const base: any[] = [
      {
        key: 'sequenceNo', label: 'STT', width: 60, fixed: 'left' as const, align: 'center' as const,
        render: (_: unknown, __: DryPort, idx?: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + (idx ?? 0) + 1}</span>
      },
      {
        key: 'dryPortName', label: 'Tên/Mã Cảng cạn', dataIndex: 'dryPortName', width: 210, fixed: 'left' as const, sortable: true, sortOrder: sortField === 'dryPortName' ? sortOrder : undefined, ellipsis: false,
        render: (_: unknown, record: DryPort) => (
          <div>
            <a title={record.dryPortName} onClick={() => openDetailModal(record)} style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.dryPortName || '—'}</a>
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.dryPortCode || '—'}</span>
          </div>
        )
      },
      {
        key: 'orgUnitName', label: 'Đơn vị quản lý', dataIndex: 'orgUnitName', width: 260, sortable: true, sortOrder: sortField === 'orgUnitName' ? sortOrder : undefined,
        render: (v: string | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary, fontWeight: fontWeightBold }}>{v || '—'}</span>
      },
      {
        key: 'operatingUnit', label: 'Đơn vị khai thác', dataIndex: 'operatingUnit', width: 220, sortable: true,
        render: (v: string | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      },
      {
        key: 'region', label: 'Khu vực', dataIndex: 'region', width: 200, sortable: true,
        render: (v: string | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      },
      {
        key: 'transportCorridor', label: 'Hành lang vận tải', dataIndex: 'transportCorridor', width: 220, sortable: true,
        render: (v: string | null | undefined) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span>
      },
      {
        key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 260, sortable: true,
        render: (status: string) => {
          const s = APPROVAL_STYLE_MAP[status || ''] || { color: textTertiary, label: status || '—' };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        }
      },
    ];

    if (isAuditViewer) {
      base.push(
        {
          key: 'updatedBy', label: 'Cán bộ cập nhật', width: 190, ellipsis: false, sortable: true,
          sortOrder: sortField === 'updatedBy' ? sortOrder : undefined,
          render: (_: unknown, record: DryPort) => {
            const name = formatUserDisplayName(record.updatedBy, (record as any).updatedByName, userMap, record.createdBy, (record as any).createdByName);
            const date = record.updatedAt || record.createdAt;
            return (
              <div style={{ lineHeight: '1.35' }}>
                <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>{date ? formatDate(date) : '—'}</div>
              </div>
            );
          }
        },
      );
    }
    return base;
  }, [page, pageSize, sortField, sortOrder, isAuditViewer, userMap, openDetailModal]);

  const rowActions = useCallback((record: DryPort) => {
    const actions: { key: string; label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
    const status = record.approvalStatus || '';
    const isDraft = status === 'DRAFT' || status === 'NHAP';
    const isPending = status === 'PENDING' || status === 'PENDING_APPROVAL';
    actions.push({ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailModal(record) });
    if (canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'dryport', extraUpdatePerms: ['dryport:update'], extraApprovePerms: ['dryport:approve'] })) {
      actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => { setFormEditId(record.id); setEditingName(record.dryPortName); setUpdateDrawerOpen(true); } });
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
        approvalStyleMap={APPROVAL_STYLE_MAP}
      />
    );
  };

  const closeCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
    createForm.resetFields();
    void fetchData();
    void fetchCounts(filterOrgUnitId);
  }, [fetchData, fetchCounts, filterOrgUnitId, createForm]);

  const closeUpdateDrawer = useCallback(() => {
    setUpdateDrawerOpen(false);
    setFormEditId(undefined);
    updateForm.resetFields();
    void fetchData();
    void fetchCounts(filterOrgUnitId);
    notifyEmbeddedActionClosed();
  }, [fetchData, fetchCounts, filterOrgUnitId, notifyEmbeddedActionClosed, updateForm]);

  return (
    <ThemeTokenProvider tokens={themeTokenChk as unknown as ThemeToken}>
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

        <ScreenHeader breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý cảng cạn' }]} actions={headerActions} />
        <FilterTableLayout
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          loading={isLoading}
          error={isError}
          onRetry={fetchData}
          filterContent={<>
            <div style={{ marginBottom: 12, marginTop: spaceMd }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
                Đơn vị quản lý
              </div>
              <OrgUnitTreeSelect
                organizations={organizations}
                placeholder="Chọn đơn vị..."
                allowClear
                showPath
                allLabel="Tất cả"
                treeDefaultExpandAll={false}
                value={filterOrgUnitId}
                onChange={(val) => { setFilterOrgUnitId(val); setPage(1); }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên cảng cạn</div>
              <Input placeholder="Tìm theo mã, tên, địa chỉ..." allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleFilterApply}
                style={{ borderRadius: radiusPill, height: 40 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
              <Select placeholder="Chọn tình trạng" allowClear
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                options={PORT_STATUS_OPTIONS}
                style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
            </div>
            {filterCollapsed && (<>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã cảng cạn</div>
                <Input placeholder="Tìm theo mã cảng cạn" allowClear
                  value={filterCode}
                  onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Khu vực</div>
                <Select placeholder="Chọn khu vực" allowClear
                  value={filterRegion}
                  onChange={(val) => { setFilterRegion(val); setPage(1); }}
                  options={REGION_OPTIONS}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Hành lang vận tải</div>
                <Input placeholder="Tìm theo hành lang vận tải" allowClear
                  value={filterTransportCorridor}
                  onChange={(e) => { setFilterTransportCorridor(e.target.value); setPage(1); }}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành Phố)</div>
                <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  value={filterProvince}
                  onChange={(val) => { setFilterProvince(val); setPage(1); }}
                  options={VIETNAM_PROVINCES.map((p, i) => ({ value: i + 1, label: p }))}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Khoảng ngày cập nhật</div>
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
            </>)}
          </>}
          statusTabs={TAB_STATUS_LIST.map((tab) => ({
            key: tab.key,
            label: tab.label,
            count: tabCounts[tab.key] ?? 0,
            color: tab.color,
            active: activeTab === tab.key,
          }))}
          onStatusTabChange={(key: string) => { setActiveTab(key); setPage(1); }}
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

        {/* ── Create Drawer ──────────────────────────────────────────── */}
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
              {isSystemAdmin && (
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
              )}
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
          footer={
            <div style={drawerFooterStyle}>
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
          {updateDrawerOpen && formEditId && (
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
                  const m = e.target.value; setHistoryMode(m); setHistoryEntityFilter('');
                  if (m === 'current' && historyTarget) {
                    setHistoryLoading(true);
                    dryPortHistory.getHistory(historyTarget.id, { page: 0, size: 200 })
                      .then((d: any) => setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []))
                      .catch(() => toast.error('Không thể tải lịch sử'))
                      .finally(() => setHistoryLoading(false));
                  } else if (m === 'all') {
                    setHistoryLoading(true);
                    dryPortHistory.getAllHistory({ page: 0, size: 200 })
                      .then((d: any) => {
                        setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []);
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
            {rejectError && <div style={{ color: statusCritical, fontSize: fontSizeSm, marginTop: 4 }}>{rejectError}</div>}
          </div>
        </Modal>

        {/* ── Approve Modal ─────────────────────────────────────────── */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? 'c2' : 'c1'}
          onConfirm={() => { if (approvingRecord) void handleConfirmApprove(); }}
          onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        />
      </div>
    </ThemeTokenProvider>
  );
}
