import { useState, useEffect, useMemo, useRef } from 'react';
import { Drawer, Input, DatePicker, Button, Typography, Radio, Tag } from 'antd';
import { HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  actionPrimary, textPrimary, textSecondary, textTertiary,
  fontWeightBold, fontWeightMedium, fontSizeSm, fontSizeMd, fontSizeLg,
  radiusSm, spaceMd, spaceSm, spaceLg, spaceXs, spaceXl,
  statusOperational, statusCritical, statusAttention,
  surfacePage, drawerTitleStyle, drawerCloseBtnStyle, inputStyle, primaryButtonStyle,
  borderDefault, statusBadgeStyle,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';

/**
 * Dữ liệu lịch sử tiêu thụ bởi HistoryDrawer — khớp DTO Backend
 * com.hanghai.kchtg.common.dto.HistoryEntry (đã phân giải tên người + đơn vị).
 */
export interface HistoryEntry {
  id?: string;
  approvalLevel?: number | string;
  status?: string;
  approvedBy?: string;
  orgUnitName?: string;
  approvedDate?: string;
  reason?: string;
  changedField?: string;
  previousValue?: string;
  newValue?: string;
}

export interface HistoryFilters {
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

export type HistoryFetcher = (
  page: number,
  pageSize: number,
  filters: HistoryFilters,
) => Promise<HistoryEntry[]>;

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  entityName?: string;
  fetchHistory: HistoryFetcher;
  /** Map tên trường nghiệp vụ (En) → nhãn tiếng Việt hiển thị. */
  fieldNameMap?: Record<string, string>;
  /** Map mã trạng thái phê duyệt → nhãn tiếng Việt. */
  approvalStatusMap?: Record<string, string>;
  /** Map mã tình trạng (condition) → nhãn tiếng Việt. */
  conditionStatusMap?: Record<string, string>;
  /** Thứ tự ưu tiên hiển thị field trong mỗi khối thay đổi (tên field ĐÃ qua fieldNameMap). */
  fieldOrder?: string[];
  /** Vô hiệu hoá tab 'Tất cả' — mặc định ẩn nếu backend chưa có getAllHistory. */
  showAllTab?: boolean;
  onFetchAll?: () => Promise<HistoryEntry[]>;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

/** Map dự phòng trạng thái phê duyệt (hạ tầng) → tiếng Việt. */
const DEFAULT_APPROVAL_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PROPOSED: 'Chờ Cảng vụ duyệt',
  PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
  PENDING: 'Chờ Cảng vụ duyệt',
  APPROVED_LEVEL1: 'Chờ Cục duyệt',
  APPROVED_LEVEL2: 'Đã duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  REJECTED_LEVEL1: 'Từ chối',
  REJECTED_LEVEL2: 'Từ chối',
};

/** Map dự phòng tình trạng (condition) → tiếng Việt. */
const DEFAULT_CONDITION_STATUS_MAP: Record<string, string> = {
  OPERATIONAL: 'Đang hoạt động',
  STOPPED: 'Dừng hoạt động',
  MAINTENANCE: 'Đang bảo trì',
  UNDER_CONSTRUCTION: 'Đang xây dựng',
};

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

function historyTimestamp(item: any): string {
  return item.approvedDate || item.changedAt || item.createdAt || '';
}

function historyField(item: any): string {
  return item.changedField || item.fieldName || '';
}

function historyOldValue(item: any): string | null {
  return item.previousValue ?? item.oldValue ?? null;
}

function historyNewValue(item: any): string | null {
  return item.newValue ?? null;
}

function historyActor(item: any): string {
  const raw = item?.approvedByName || item?.changedByName || item?.performedByName || item?.userName
    || item?.actorName || item?.approvedBy || item?.changedBy || item?.performedBy || '';
  return raw || '—';
}

function normalizedHistoryFields(value: string): string[] {
  const fields = value.split(/[,;]+/).map((field: string) => field.trim()).filter(Boolean);
  const hasApprovalStatus = fields.some((field) => {
    const key = normalizeHistoryKey(field);
    return key === 'approvalstatus' || key === 'trang thai phe duyet';
  });
  if (hasApprovalStatus) {
    return fields.filter((field) => {
      const key = normalizeHistoryKey(field);
      return key !== 'approvedlevel1' && key !== 'approvedlevel2'
        && key !== 'da phe duyet cap 1' && key !== 'da phe duyet cap 2';
    });
  }
  return fields;
}

function parseHistoryAssignments(value: string | null): Map<string, string> {
  const result = new Map<string, string>();
  if (!value) return result;
  value.split(';').forEach((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return;
    result.set(normalizeHistoryKey(part.slice(0, separator)), part.slice(separator + 1).trim());
  });
  return result;
}

function historyChangeRows(
  item: any,
  fieldNameMap: Record<string, string>,
  approvalStatusMap: Record<string, string>,
  conditionStatusMap: Record<string, string>,
): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  const fields = normalizedHistoryFields(historyField(item));
  const oldValue = historyOldValue(item);
  const newValue = historyNewValue(item);
  const oldAssignments = parseHistoryAssignments(oldValue);
  const newAssignments = parseHistoryAssignments(newValue);

  if (fields.length > 1 && oldAssignments.size === 0 && newAssignments.size === 0) {
    return [{ field: fields.join(', '), oldValue, newValue }];
  }
  if (fields.length === 0) {
    return [{ field: '', oldValue, newValue }];
  }

  return fields.map((field, index) => {
    const displayField = historyFieldName(fieldNameMap, field);
    const oldAssigned = oldAssignments.get(normalizeHistoryKey(field))
      ?? oldAssignments.get(normalizeHistoryKey(displayField));
    const newAssigned = newAssignments.get(normalizeHistoryKey(field))
      ?? newAssignments.get(normalizeHistoryKey(displayField));
    const oldParts = oldValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
    const newParts = newValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
    return {
      field,
      oldValue: oldAssigned ?? (fields.length === 1 ? oldValue : oldParts[index] || null),
      newValue: newAssigned ?? (fields.length === 1 ? newValue : newParts[index] || null),
    };
  });
}

function historyFieldName(fieldNameMap: Record<string, string>, fn: string): string {
  return fieldNameMap[fn] || fn;
}

function historyFieldValue(
  fn: string,
  val: string | null,
  approvalStatusMap: Record<string, string>,
  conditionStatusMap: Record<string, string>,
): string {
  if (!val || val === '(null)' || val === 'null' || val === '') return '(trống)';
  const displayValue = val.split(';').map((part) => {
    const separator = part.indexOf('=');
    return separator >= 0 ? part.slice(separator + 1).trim() : part.trim();
  }).filter(Boolean).join('; ');
  const fieldKeys = fn.split(/[,;]+/).map(normalizeHistoryKey);
  const isApprovalField = fn === 'approvalStatus'
    || fieldKeys.includes('approvalstatus')
    || fieldKeys.includes('trang thai phe duyet');
  if (isApprovalField) {
    return displayValue.split(';').map((value) => {
      const normalizedValue = String(value || '').trim();
      const fromMap = approvalStatusMap[normalizedValue] || approvalStatusMap[normalizedValue.toUpperCase()];
      if (fromMap) return fromMap;
      const normText = normalizeHistoryKey(normalizedValue);
      if (normText.includes('cho') && (normText.includes('cang vu') || normText.includes('chi cuc') || normText.includes('phe duyet'))) {
        return 'Chờ Cảng vụ duyệt';
      }
      if (normText.includes('cho') && normText.includes('chiet khau')) return 'Chờ Cục duyệt';
      if (normText.includes('da duyet') || normText.includes('approve')) return 'Đã duyệt';
      if (normText.includes('tu choi') || normText.includes('reject') || normText.includes('tra ve')) return 'Từ chối';
      return value;
    }).join('; ');
  }
  const isConditionField = fn === 'conditionStatus'
    || fn === 'operationalStatus'
    || fieldKeys.includes('conditionstatus')
    || fieldKeys.includes('tinh trang')
    || fieldKeys.includes('trang thai hoat dong');
  if (isConditionField) {
    return displayValue.split(';').map((value) => {
      const normalizedValue = String(value || '').trim();
      const fromMap = conditionStatusMap[normalizedValue] || conditionStatusMap[normalizedValue.toUpperCase()];
      if (fromMap) return fromMap;
      const normText = normalizeHistoryKey(normalizedValue);
      if (normText.includes('hoat dong')) return 'Đang hoạt động';
      if (normText.includes('dung') || normText.includes('ngung')) return 'Dừng hoạt động';
      if (normText.includes('bao tri') || normText.includes('maintenance')) return 'Đang bảo trì';
      if (normText.includes('xay dung') || normText.includes('under_construction')) return 'Đang xây dựng';
      return value;
    }).join('; ');
  }
  return displayValue;
}

function resolveHistoryActionMeta(
  item: any,
  changes: Array<{ field: string; oldValue: string | null; newValue: string | null }>,
): { label: string; color: string; bg: string } {
  const rawStatus = String(item.status ?? item.action ?? '').toUpperCase();
  const rawReason = String(item.reason ?? item.ghiChu ?? item.note ?? '').toLowerCase();
  const level = Number(item.approvalLevel || 0);

  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
    return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || (item.changedField && item.changedField.includes('đính kèm'))) {
    return { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c718' };
  }
  if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xóa tệp') || rawReason.includes('xoa tep')) {
    return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c18' };
  }
  if (rawStatus === 'APPROVED' || rawReason.includes('duyệt') || rawReason.includes('phe duyet')) {
    const levelLabel = level >= 2 ? ' (Cấp 2)' : level === 1 ? ' (Cấp 1)' : '';
    const isCreate = rawReason.includes('tạo mới và phê duyệt') || rawReason.includes('tao moi va phe duyet');
    return {
      label: `${isCreate ? 'Tạo mới & duyệt' : 'Phê duyệt'}${levelLabel}`,
      color: statusOperational,
      bg: `${statusOperational}18`,
    };
  }
  if (rawStatus === 'REJECTED' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
    return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
  }
  if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawReason.includes('cập nhật') || rawReason.includes('cap nhat') || rawReason.includes('chỉnh sửa')) {
    const isCreate = changes.length > 0 && changes.every((c) => !c.oldValue || c.oldValue === '(null)' || c.oldValue === '');
    return { label: isCreate ? 'Thêm mới' : 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  }
  if (rawStatus === 'DELETED' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
    return { label: 'Xóa mềm', color: textTertiary, bg: `${textTertiary}18` };
  }
  if (rawStatus === 'SUBJECT' || rawStatus === 'PROPOSED' || rawStatus === 'PENDING_APPROVAL' || rawStatus === 'SUBMITTED' || rawReason.includes('gửi phê duyệt') || rawReason.includes('gui phe duyet')) {
    return { label: 'Gửi phê duyệt', color: statusAttention, bg: `${statusAttention}18` };
  }
  return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
}

function renderHistoryValueTag(
  field: string,
  val: string | null,
  approvalStatusMap: Record<string, string>,
  conditionStatusMap: Record<string, string>,
): React.ReactElement {
  if (!val) return <span style={{ color: textTertiary }}>—</span>;
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);
  const approveLabels = Object.values(approvalStatusMap).map((v) => normalizeHistoryKey(v));

  const isApproval = normKey === 'approvalstatus' || normKey === 'trang thai phe duyet'
    || approveLabels.includes(normVal) || normVal.includes('duyet') || normVal.includes('tu choi');
  if (isApproval && (normVal.includes('xong') || normVal.includes('duyet') || normVal.includes('approve') || normVal === 'da duyet')) {
    return <span style={statusBadgeStyle(statusOperational)}>{val}</span>;
  }
  if (isApproval && (normVal.includes('cho') || normVal.includes('pending') || normVal.includes('chờ'))) {
    return <span style={statusBadgeStyle(statusAttention)}>{val}</span>;
  }
  if (isApproval && (normVal.includes('tu choi') || normVal.includes('reject') || normVal.includes('tra ve'))) {
    return <span style={statusBadgeStyle(statusCritical)}>{val}</span>;
  }

  const isCondition = normKey === 'conditionstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang');
  if (isCondition) {
    if (normVal.includes('hoat dong') || normVal.includes('good') || normVal.includes('operational')) {
      return <span style={statusBadgeStyle(statusOperational)}>{val}</span>;
    }
    if (normVal.includes('bao tri') || normVal.includes('warning') || normVal.includes('maintenance')) {
      return <span style={statusBadgeStyle(statusAttention)}>{val}</span>;
    }
    if (normVal.includes('hong') || normVal.includes('ngung') || normVal.includes('dung') || normVal.includes('damaged') || normVal.includes('critical')) {
      return <span style={statusBadgeStyle(statusCritical)}>{val}</span>;
    }
    if (normVal.includes('xay dung') || normVal.includes('under_construction')) {
      return <span style={statusBadgeStyle(actionPrimary)}>{val}</span>;
    }
  }

  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

/**
 * Drawer "Lịch sử thay đổi" dùng chung — đúng chuẩn màn `/vts-system-chk`:
 * cuộn vô hạn (20 bản ghi/lần), tìm kiếm nội dung, lọc khoảng ngày, gom nhóm
 * theo bước thao tác, nhãn trường + giá trị bằng tiếng Việt có badge màu ngữ nghĩa.
 */
export default function HistoryDrawer({
  open, onClose, entityName, fetchHistory, fieldNameMap = {},
  approvalStatusMap = DEFAULT_APPROVAL_STATUS_MAP, conditionStatusMap = DEFAULT_CONDITION_STATUS_MAP,
  showAllTab = false, onFetchAll, fieldOrder = [], pageSize = DEFAULT_PAGE_SIZE,
}: HistoryDrawerProps) {
  const [mode, setMode] = useState<'current' | 'all'>('current');
  const [records, setRecords] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupCount = useMemo(() => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const seen = new Set<string>();
    let count = 0;
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const key = `${ts ? toSec(ts) : 0}-${historyActor(r)}`;
      if (!seen.has(key)) { seen.add(key); count++; }
    }
    return count;
  }, [records]);

  const loadFirst = async () => {
    if (mode === 'all' && onFetchAll) {
      setLoading(true);
      try {
        const all = (await onFetchAll()) || [];
        setRecords(all);
        setHasMore(false);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setLoadingMore(false);
    setHasMore(true);
    setRecords([]);
    setPage(0);
    try {
      const items = (await fetchHistory(0, pageSize, { keyword: search, fromDate: dateFrom, toDate: dateTo })) || [];
      setRecords(items);
      setHasMore(items.length === pageSize);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setMode('current');
    setRecords([]);
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
    setHasMore(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (mode === 'current') {
        setLoading(true);
        setLoadingMore(false);
        setHasMore(true);
        setRecords([]);
        setPage(0);
        try {
          const items = (await fetchHistory(0, pageSize, { keyword: search, fromDate: dateFrom, toDate: dateTo })) || [];
          if (cancelled) return;
          setRecords(items);
          setHasMore(items.length === pageSize);
        } catch {
          // ignore
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else if (onFetchAll) {
        setLoading(true);
        try {
          const all = (await onFetchAll()) || [];
          if (cancelled) return;
          setRecords(all);
          setHasMore(false);
        } catch {
          // ignore
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    }, search.trim() ? 300 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, mode, search, dateFrom, dateTo, reloadToken, pageSize, fetchHistory, onFetchAll]);

  const loadMore = async () => {
    if (mode !== 'current' || loading || loadingMore || !hasMore || !fetchHistory) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const items = (await fetchHistory(nextPage, pageSize, { keyword: search, fromDate: dateFrom, toDate: dateTo })) || [];
      if (items.length > 0) setRecords((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === pageSize);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) loadMore();
  };

  const fmtTime = (ts: string) => {
    const d = dayjs(ts);
    return `${d.format('HH:mm')} ${d.format('DD/MM/YYYY')}`;
  };

  const renderTimeline = () => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const q = search.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const prev = groups[groups.length - 1];
      const actor = historyActor(r);
      if (prev && prev.tsSec === sec && prev.actor === actor && prev.status === (r as any).status && prev.approvalLevel === (r as any).approvalLevel) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, status: (r as any).status, approvalLevel: (r as any).approvalLevel, items: [r] });
      }
    }
    if (groups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || dateFrom || dateTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
        </div>
      );
    }
    return (
      <div>
        {groups.map((g, gi) => {
          const sortOrder = fieldOrder.length > 0 ? fieldOrder : Object.keys(fieldNameMap);
          const changes = g.items.flatMap((item: any) => historyChangeRows(item, fieldNameMap, approvalStatusMap, conditionStatusMap)).sort((a, b) => {
            const ia = sortOrder.indexOf(a.field);
            const ib = sortOrder.indexOf(b.field);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });
          const unitName = g.items[0]?.orgUnitName || g.items[0]?.unitName || '—';
          const isCreate = changes.length > 0 && changes.every((c) => !c.oldValue || c.oldValue === '(null)' || c.oldValue === '');
          const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
          const formatHistoryValue = (fn: string, raw: string | null) => {
            if (raw === null || raw === '(null)' || raw === '') return null;
            const t = raw.trim();
            if (t.startsWith('[') && t.endsWith(']')) {
              if (t === '[]') return 'Không có';
              const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
              return `${parts.length} công trình hạ tầng`;
            }
            if (/^-?\d+(\.\d+)?$/.test(t)) {
              const n = Number(t);
              return Number.isInteger(n) ? String(n) : t;
            }
            return historyFieldValue(fn, raw, approvalStatusMap, conditionStatusMap);
          };
          if (changes.length === 0) return null;
          const actionMeta = resolveHistoryActionMeta(g.items[0], changes);
          return (
            <div key={gi} style={{ display: 'grid', gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)', gap: spaceLg, alignItems: 'start', marginBottom: gi < groups.length - 1 ? spaceMd : 0 }}>
              <div style={{ minWidth: 0, paddingTop: spaceXs }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeLg - 1, color: textPrimary, fontWeight: fontWeightBold, lineHeight: 1.5, whiteSpace: 'nowrap' }}>
                    {g.ts ? fmtTime(g.ts) : '—'}
                  </Typography.Text>
                  <span style={{ flexShrink: 0 }}>
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>
                      {actionMeta.label}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: spaceXs }}>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                    Người cập nhật: <span style={{ color: textPrimary, fontWeight: fontWeightBold }}>{g.actor || '—'}</span>
                  </Typography.Text>
                  <Typography.Text style={{ display: 'block', fontSize: fontSizeSm + 1, color: textSecondary, fontWeight: fontWeightMedium, lineHeight: 1.4 }}>
                    Đơn vị: <span style={{ color: textPrimary }}>{unitName}</span>
                  </Typography.Text>
                </div>
              </div>
              <div style={{ position: 'relative', minWidth: 0, background: surfacePage, borderRadius: radiusSm, padding: `${spaceMd}px ${spaceLg}px`, paddingLeft: spaceLg, overflow: 'hidden', border: `1px solid ${borderDefault}` }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: spaceXs, background: `linear-gradient(180deg, ${actionMeta.color} 0%, ${actionMeta.color}40 100%)` }} />
                <Typography.Text style={{ display: 'block', color: colors.sidebarBg, fontSize: fontSizeMd, fontWeight: fontWeightBold, marginBottom: spaceSm }}>
                  {informationTitle}
                </Typography.Text>
                {(() => {
                  const validChanges = changes.filter((c: any) => {
                    if (!c.field) return false;
                    const ov = formatHistoryValue(c.field, c.oldValue);
                    const nv = formatHistoryValue(c.field, c.newValue);
                    if (ov == null && nv == null) return false;
                    if (ov === nv) return false;
                    return true;
                  });
                  const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);
                  if (validChanges.length > 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceSm }}>
                        {validChanges.map((change, ri: number) => {
                          const fn = change.field;
                          const ov = formatHistoryValue(fn, change.oldValue);
                          const nv = formatHistoryValue(fn, change.newValue);
                          return isCreate ? (
                            <div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(0, 1fr)', alignItems: 'flex-start', gap: spaceMd, fontSize: fontSizeMd, lineHeight: 1.6 }}>
                              <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fn ? `${historyFieldName(fieldNameMap, fn)}:` : '—'}</div>
                              <div style={{ minWidth: 0, overflowWrap: 'break-word' }}>{renderHistoryValueTag(fn, nv, approvalStatusMap, conditionStatusMap)}</div>
                            </div>
                          ) : (
                            <div key={`${fn}-${ri}`} style={{ display: 'grid', gridTemplateColumns: '170px minmax(120px, 1fr) 24px minmax(120px, 1fr)', alignItems: 'center', gap: spaceSm, fontSize: fontSizeMd, lineHeight: 1.6 }}>
                              <div style={{ fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'break-word' }}>{fn ? `${historyFieldName(fieldNameMap, fn)}:` : '—'}</div>
                              <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflowWrap: 'break-word' }}>{renderHistoryValueTag(fn, ov, approvalStatusMap, conditionStatusMap)}</div>
                              <div style={{ color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none' }}>→</div>
                              <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, overflowWrap: 'break-word' }}>{renderHistoryValueTag(fn, nv, approvalStatusMap, conditionStatusMap)}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  if (reasons.length > 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
                        {reasons.map((r: string, ri: number) => (
                          <div key={ri} style={{ fontSize: fontSizeMd, color: textPrimary }}>{r}</div>
                        ))}
                      </div>
                    );
                  }
                  return <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd, fontStyle: 'italic' }}>Không có thông tin chi tiết thay đổi</Typography.Text>;
                })()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={880}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: spaceMd }}>
          <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
          <span style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd, color: textPrimary }}>
            {entityName ? `Lịch sử thay đổi — ${entityName}` : 'Lịch sử thay đổi'}
          </span>
        </div>
      }
      extra={<Button type="text" aria-label="Đóng lịch sử thay đổi" onClick={onClose} style={drawerCloseBtnStyle}>✕</Button>}
      styles={{ header: drawerTitleStyle }}
      destroyOnClose
    >
      <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: spaceMd }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spaceMd, flexWrap: 'wrap' }}>
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} style={{ display: 'flex', flex: 1, minWidth: 0, background: surfacePage, borderRadius: radiusSm, overflow: 'hidden' }}>
            <Radio.Button value="current" style={{ flex: 1, minWidth: 0, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderRadius: 0, border: 'none', background: 'transparent', fontSize: fontSizeMd, padding: `0 ${spaceMd}px`, borderBottom: `2px solid ${actionPrimary}`, fontWeight: fontWeightBold, color: actionPrimary }}>
              Bản ghi hiện tại <Tag color="blue" style={{ borderRadius: radiusSm, fontSize: 11, marginLeft: 4 }}>{groupCount}</Tag>
            </Radio.Button>
            {showAllTab && onFetchAll ? (
              <Radio.Button value="all" style={{ flex: 1, minWidth: 0, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderRadius: 0, border: 'none', background: 'transparent', fontSize: fontSizeMd, padding: `0 ${spaceMd}px` }}>
                Tất cả
              </Radio.Button>
            ) : null}
          </Radio.Group>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm }}>
          <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <DatePicker placeholder="Từ ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={dateFrom ? dayjs(dateFrom) : null}
            onChange={(d) => setDateFrom(d ? d.startOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
            style={{ ...inputStyle, width: 170 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
          <DatePicker placeholder="Đến ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={dateTo ? dayjs(dateTo) : null}
            onChange={(d) => setDateTo(d ? d.endOf('minute').format('YYYY-MM-DDTHH:mm:ss') : '')}
            style={{ ...inputStyle, width: 170 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
          <Button type="primary" icon={<SearchOutlined />} loading={loading}
            onClick={() => setReloadToken((t) => t + 1)} style={primaryButtonStyle}>Tìm kiếm</Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} ref={scrollRef} onScroll={handleScroll}>
          {loading && records.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, padding: `${spaceMd}px 0` }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: 48, background: surfacePage, borderRadius: radiusSm, border: `1px solid ${borderDefault}` }} />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
            </div>
          ) : (
            <>
              {renderTimeline()}
              {loadingMore && <div style={{ textAlign: 'center', padding: `${spaceMd}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm...</div>}
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}
