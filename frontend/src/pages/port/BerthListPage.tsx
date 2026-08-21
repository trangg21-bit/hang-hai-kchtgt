import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Tag, Modal, Input, Select, Alert, Divider, DatePicker,
  Drawer, Radio, Space, Typography, Table, Form,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HistoryOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  FileOutlined,
  ClockCircleFilled,
  UpOutlined,
  DownOutlined,
  SearchOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  berthCRUD,
  berthApproval,
  portCRUD,
} from '../../services/portService';
import type { Berth } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, StatusTabs, DataTable, type ScreenHeaderAction } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';

import ErrorState from '../../components/ErrorState';
import toast from '../../components/ToastNotification';
import BerthForm from './BerthForm';
import BerthDetailContent from './BerthDetailContent';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  cardStyle,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  fontSizeMd,
  fontSizeLg,
  fontSizeXl,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  radiusPill,
  radiusMd,
  radiusLg,
  radiusSm,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceLg,
  spaceXl,
  spaceFormField,
  shadowSm,
  surfaceCard,
  surfacePage,
  metaStyle,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  historyBadgeStyle, historyGroupGridStyle, historyTimeStyle, historyMetaRowStyle,
  historyInfoCardStyle, historyAccentBarStyle, historyInfoTitleStyle,
  historyChangeRowStyle, historyCreateRowStyle, historyFieldLabelStyle,
  historyOldValueStyle, historyNewValueStyle, historyArrowStyle,
} from '../../tokens';
import { colors } from '../../theme';

// ── Field name translation ───────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  berthCode: 'Mã bến cảng', berthName: 'Tên bến cảng', portId: 'Cảng biển chủ',
  waterway: 'Tuyến đường thủy', operator: 'Đơn vị vận hành', provinceId: 'Tỉnh/Thành phố',
  detailedLocation: 'Địa điểm chi tiết', structureType: 'Loại kết cấu',
  operationalFunction: 'Công năng khai thác', totalArea: 'Tổng diện tích',
  designThroughput: 'Năng lực thiết kế', currentThroughput: 'Năng lực hiện tại',
  maxVesselSize: 'Cỡ tàu tối đa', plannedThroughput: 'Năng lực quy hoạch',
  latestCargoVolume: 'Sản lượng gần nhất', openingAnnouncementDate: 'Ngày công bố mở',
  openingDecision: 'Quyết định mở', investmentAgreement: 'Thỏa thuận đầu tư',
  length: 'Chiều dài', width: 'Chiều rộng', berthType: 'Loại bến',
  channelDepth: 'Độ sâu luồng', operationalStatus: 'Trạng thái hoạt động',
  approvalStatus: 'Trạng thái phê duyệt', orgUnitId: 'Đơn vị quản lý',
  mapSymbolId: 'Biểu tượng bản đồ', spatialId: 'Vị trí không gian',
  coordinateSystem: 'Hệ quy chiếu', displayRule: 'Quy tắc hiển thị',
  submittedForApprovalAt: 'Ngày gửi phê duyệt', submittedForApprovalBy: 'Người gửi phê duyệt',
  portAuthorityApprovedAt: 'Ngày duyệt Cảng vụ', portAuthorityApprovedBy: 'Người duyệt Cảng vụ',
  departmentApprovedAt: 'Ngày duyệt Cục', departmentApprovedBy: 'Người duyệt Cục',
  rejectionReason: 'Lý do từ chối', activityStatus: 'Trạng thái hoạt động',
};

const translateField = (fn: string) => FIELD_LABELS[fn] || fn;

// ── Constants ────────────────────────────────────────────────────────

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Nháp' },
  DRAFT: { color: statusDraft, label: 'Nháp' },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ Cục duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
};

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Bến nước' }, { value: 2, label: 'Bến bờ' },
  { value: 3, label: 'Bến phao' }, { value: 4, label: 'Khác' },
];

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'APPROVED_LEVEL1', label: 'Chờ Cảng vụ duyệt', color: actionPrimary },
  { key: 'APPROVED_LEVEL2', label: 'Chờ Cục duyệt', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined, DRAFT: 'DRAFT', APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED_LEVEL2: 'APPROVED_LEVEL2', APPROVED: 'APPROVED', REJECTED: 'REJECTED',
};

// ── Helper: format date ──────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

// ── History helpers ───────────────────────────────────────────────────

const historyFieldLabels: Record<string, string> = {
  berthCode: 'Mã bến cảng', berthName: 'Tên bến cảng', portId: 'Cảng biển chủ',
  waterway: 'Tuyến đường thủy', operator: 'Đơn vị vận hành', provinceId: 'Tỉnh/Thành phố',
  detailedLocation: 'Địa điểm chi tiết', structureType: 'Loại kết cấu',
  operationalFunction: 'Công năng khai thác', totalArea: 'Tổng diện tích',
  designThroughput: 'Năng lực thiết kế', currentThroughput: 'Năng lực hiện tại',
  maxVesselSize: 'Cỡ tàu tối đa', plannedThroughput: 'Năng lực quy hoạch',
  latestCargoVolume: 'Sản lượng gần nhất', openingAnnouncementDate: 'Ngày công bố mở',
  openingDecision: 'Quyết định mở', investmentAgreement: 'Thỏa thuận đầu tư',
  length: 'Chiều dài', width: 'Chiều rộng',
  operationalStatus: 'Tình trạng', approvalStatus: 'Trạng thái',
  orgUnitId: 'Đơn vị quản lý', mapSymbolId: 'Biểu tượng bản đồ',
  spatialId: 'Vị trí không gian', coordinateSystem: 'Hệ quy chiếu',
  'Trạng thái': 'Hành động',
};
function historyFieldName(fn: string): string { return historyFieldLabels[fn] || fn; }
function historyFieldValue(fn: string, val: string | null, orgMap?: Map<string, string>, symbolMap?: Map<string, string>, portMap?: Map<string, string>): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'portId' && portMap) return portMap.get(val) || val;
  if (fn === 'approvalStatus') { const m: Record<string,string> = { DRAFT:'Nháp', APPROVED_LEVEL1:'Chờ Cảng vụ duyệt', APPROVED_LEVEL2:'Chờ Cục duyệt', APPROVED:'Đã phê duyệt', REJECTED:'Từ chối' }; return m[val.toUpperCase()] || val; }
  if (fn === 'operationalStatus') { const m: Record<string,string> = { OPERATIONAL:'Đang khai thác/Vận hành', NOT_YET_OPERATIONAL:'Chưa khai thác/Vận hành', SUSPENDED:'Dừng khai thác/Vận hành', DANG_KHAI_THAC:'Đang khai thác/Vận hành', CHUA_KHAI_THAC:'Chưa khai thác/Vận hành', DUNG_KHAI_THAC:'Dừng khai thác/Vận hành' }; return m[val.toUpperCase()] || val; }
  if (fn === 'structureType') { const m: Record<string,string> = { '1':'Bến liền bờ', '2':'Bến phao', '3':'Bến nổi' }; return m[val] || val; }
  if (fn === 'provinceId') return VIETNAM_PROVINCES[Number(val)-1] || val;
  if (fn === 'coordinateSystem') { const m: Record<string,string> = { '1':'WGS-84', '2':'VN-2000' }; return m[val] || val; }
  if (fn === 'openingAnnouncementDate' || fn.endsWith('At')) { try { return dayjs(val).format('DD/MM/YYYY HH:mm'); } catch { return val; } }
  return val;
}
function getActionLabel(items: any[]): { label: string; color: string } {
  const fields = items.map((i: any) => i.fieldName || '');
  const oldVals = items.map((i: any) => i.oldValue || '');
  const newVals = items.map((i: any) => i.newValue || '');
  if (fields.includes('deletedAt') || newVals.includes('Đã xóa')) return { label: 'Xóa', color: 'red' };
  if (fields.includes('approvalStatus')) {
    const ns = newVals[fields.indexOf('approvalStatus')];
    if (ns === 'APPROVED') return { label: 'Phê duyệt', color: 'green' };
    if (ns === 'REJECTED') return { label: 'Từ chối', color: 'red' };
    if (ns === 'APPROVED_LEVEL1') return { label: 'Gửi phê duyệt', color: 'orange' };
  }
  const nullCount = oldVals.filter(v => v === '(null)' || v === 'null').length;
  if (nullCount > items.length / 2) return { label: 'Tạo mới', color: 'blue' };
  return { label: 'Chỉnh sửa', color: 'blue' };
}

const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

// ── Component ────────────────────────────────────────────────────────

export default function BerthList() {
  const hasPerm = usePermissionStore((s) => s.hasPermission);
  const userPermissions = useAuthStore((s) => s.user?.permissions) || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation');

  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterWaterwayId, setFilterWaterwayId] = useState<string | undefined>();
  const [filterOperationalFunction, setFilterOperationalFunction] = useState('');
  const [filterStructureType, setFilterStructureType] = useState<number | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [filterProvince, setFilterProvince] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<Berth[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

  // ── Organizations + Users for lookup ────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());
  const [waterwayMap, setWaterwayMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 })
      .then((r) => { const m = new Map<string, string>(); (r.data || []).forEach((l: any) => { m.set(l.id, l.name || l.code); }); setWaterwayMap(m); })
      .catch(() => {});
  }, []);
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => map.set(o.id, o.name));
    return map;
  }, [organizations]);

  // ── Port options ─────────────────────────────────────────────────
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const portMap = useMemo(() => {
    const map = new Map<string, string>();
    portOptions.forEach((o) => map.set(o.value, o.label));
    return map;
  }, [portOptions]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Drawer state ────────────────────────────────────────────────
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editBerthId, setEditBerthId] = useState<string | undefined>();
  const [editBerthName, setEditBerthName] = useState('');
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const berthFormRef = useRef<any>(null);
  const editBerthFormRef = useRef<any>(null);
  // ── Submit loading — nút được bấm mới hiện loading tròn (tham chiếu màn Cảng biển) ──
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('submit');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('submit');
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Berth | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Berth | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<Berth | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Submit/Approve modal ────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<Berth | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<Berth | null>(null);
  const [approvalContent, setApprovalContent] = useState('');

  // ── History modal ───────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<Berth | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState<Record<number, boolean>>({});
  const [historyVisible, setHistoryVisible] = useState(10);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  const historyGroupCount = useMemo(() => {
    const seen = new Set<string>();
    for (const r of historyRecords) {
      const s = Math.floor(new Date(r.changedAt || r.createdAt || 0).getTime() / 1000);
      seen.add(`${s}|${r.changedBy || ''}`);
    }
    return seen.size;
  }, [historyRecords]);

  const openHistory = useCallback(async (r: Berth) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistoryExpanded({}); setHistoryVisible(10); setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryMode('current');
    try {
      const res = await api.get(`/v1/berths/${r.id}/history`);
      const d = res.data?.data;
      const ch = Array.isArray(d?.changeHistory) ? d.changeHistory : [];
      setHistoryRecords(ch);
    } catch { toast.error('Không thể tải lịch sử'); }
    finally { setHistoryLoading(false); }
  }, []);

  const HISTORY_FIELD_ORDER = ['orgUnitId', 'portId', 'berthCode', 'berthName', 'waterway', 'berthType', 'length', 'width', 'channelDepth', 'operationalFunction', 'operationalStatus', 'provinceId', 'detailedLocation', 'coordinateSystem', 'displayRule', 'mapSymbolId', 'operator', 'totalArea', 'designThroughput', 'currentThroughput', 'maxVesselSize', 'plannedThroughput', 'latestCargoVolume', 'openingAnnouncementDate', 'openingDecision', 'investmentAgreement', 'structureType'];

  const renderBerthHistoryTimeline = (records: any[]) => {
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
        const od = historyFieldValue(r.fieldName, r.oldValue, orgMap, symbolMap, portMap).toLowerCase();
        const nd = historyFieldValue(r.fieldName, r.newValue, orgMap, symbolMap, portMap).toLowerCase();
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
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{q || historyFrom || historyTo ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
      </div>
    );
    const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; };
    return (
      <div>{groups.map((g, gi) => {
        const rec0 = g.items[0] || {};
        const orgId = rec0.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        const unitName = (orgName ? (orgName.split(' - ').pop() || orgName) : (rec0.orgUnitName || rec0.unitName)) || '—';
        const barColor = actionPrimary;
        const changes = g.items.map((item: any) => ({ field: item.fieldName || '—', oldValue: item.oldValue ?? null, newValue: item.newValue ?? null }));
        const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
        const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
        const orderedChanges = [...changes].sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }).filter((c: any) => c.field !== 'infrastructureList' && c.field !== 'attachments' && c.field !== 'spatialId');
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
          return historyFieldValue(fn, raw, orgMap, symbolMap, portMap);
        };
        if (orderedChanges.length === 0) return null;
        return (
          <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
            <div style={{ minWidth: 0, paddingTop: spaceXs }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                <Typography.Text style={historyTimeStyle}>
                  {g.ts ? fmtTime(g.ts) : '—'}
                </Typography.Text>
                <span style={{ flexShrink: 0 }}>
                {isCreate && <span style={historyBadgeStyle(statusOperational)}>Thêm mới</span>}
                {!isCreate && <span style={historyBadgeStyle(actionPrimary)}>Chỉnh sửa</span>}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                <Typography.Text style={historyMetaRowStyle}>
                  Người cập nhật: {g.actor || '—'}
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
                const fn = change.field;
                const ov = formatHistoryValue(fn, change.oldValue);
                const nv = formatHistoryValue(fn, change.newValue);
                const renderCell = (rawVal: string | null) => {
                  if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                    const img = symbolImageMap.get(rawVal);
                    const name = symbolMap.get(rawVal) || rawVal;
                    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}{name}</span>;
                  }
                  return null;
                };
                return isCreate ? (
                  <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                    <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                    <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                  </div>
                ) : (
                  <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                    <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                    <span title={ov ?? '—'} style={historyOldValueStyle}>{renderCell(change.oldValue) ?? (ov ?? '—')}</span>
                    <span style={historyArrowStyle}>→</span>
                    <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                  </div>
                );
              })}</div> : <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có thông tin chi tiết</Typography.Text>}
            </div>
          </div>
        );
      })}</div>
    );
  };

  // ── Load organizations ──────────────────────────────────────────
  // F-018: Đơn vị quản lý là bộ lọc bắt buộc (giống Cảng biển):
  // tự chọn mặc định = đơn vị của user đang đăng nhập, nếu không khớp thì lấy đơn vị đầu tiên
  useEffect(() => {
    const parentOrgUnits = (window.parent as any)?.kchtOrgUnits;
    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrganizations(parentOrgUnits);
      if (!defaultOrgApplied.current) {
        defaultOrgApplied.current = true;
        defaultOrgUnitId.current = parentOrgUnits[0].id;
        setManagingUnitId(parentOrgUnits[0].id);
      }
      setOrgUnitReady(true);
    } else {
      (async () => {
        try {
          const resp = await organizationService.list({ pageSize: 1000 });
          const data = resp.data || [];
          setOrganizations(data);
          if (data.length > 0 && !defaultOrgApplied.current) {
            defaultOrgApplied.current = true;
            try {
              const profileRes = await api.get('/users/me');
              const profile = profileRes.data?.data ?? profileRes.data;
              const userOrgId = profile?.orgUnitId;
              const match = userOrgId && data.find((o: any) => o.id === userOrgId);
              const defaultId = userOrgId ? (match ? userOrgId : data[0].id) : '__all__';
              defaultOrgUnitId.current = defaultId;
              setManagingUnitId(defaultId === '__all__' ? undefined : defaultId);
            } catch {
              defaultOrgUnitId.current = data[0].id;
              setManagingUnitId(data[0].id);
            }
          }
          setOrgUnitReady(true);
        } catch (err) {
          console.error('Failed to load organizations', err);
          setOrgUnitReady(true);
        }
      })();
    }
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch { console.error('Failed to load users'); }
    })();
    (async () => {
      try {
        const resp = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        const symbols = resp.data || (resp as any).content || [];
        const map = new Map<string, string>();
        const imgMap = new Map<string, string>();
        symbols.forEach((s: any) => { map.set(s.id, s.name); if (s.image) imgMap.set(s.id, s.image); });
        setSymbolMap(map);
        setSymbolImageMap(imgMap);
      } catch { console.error('Failed to load symbols'); }
    })();
  }, []);

  // ── Load port options ──────────────────────────────────────────
  useEffect(() => {
    if (!orgUnitReady) return;
    (async () => {
      try {
        const params: any = { page: 1, pageSize: 1000 };
        if (managingUnitId && managingUnitId !== '__all__') params.orgUnitId = managingUnitId;
        const res = await portCRUD.search(params);
        setPortOptions((res.data || []).map((p: any) => ({ value: p.id, label: p.portName })));
      } catch { /* ignore */ }
    })();
  }, [managingUnitId, orgUnitReady]);

  // ── Fetch tab counts ────────────────────────────────────────────
  const fetchCounts = useCallback(async (orgId: string | undefined) => {
    try {
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map((tab) =>
          tab.key === 'all'
            ? berthCRUD.search({ orgUnitId: (orgId && orgId !== '__all__') ? orgId : undefined, page: 1, pageSize: 1 })
            : berthCRUD.search({ approvalStatus: TAB_QUERY_MAP[tab.key], orgUnitId: (orgId && orgId !== '__all__') ? orgId : undefined, page: 1, pageSize: 1 }),
        ),
      );
      const counts: Record<string, number> = {};
      results.forEach((result, idx) => {
        const tabKey = TAB_STATUS_LIST[idx]?.key || 'all';
        counts[tabKey] = result.status === 'fulfilled' ? result.value.total : 0;
      });
      setTabCounts(counts);
    } catch { /* silent */ }
  }, []);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true); setIsError(false); setError(null);
    try {
      const res = await berthCRUD.search({
        orgUnitId: (managingUnitId && managingUnitId !== '__all__') ? managingUnitId : undefined,
        search: filterKeyword.trim() || undefined,
        portId: filterPortId,
        waterwayId: filterWaterwayId,
        operationalFunction: filterOperationalFunction || undefined,
        structureType: filterStructureType,
        operationalStatus: filterOperationalStatus,
        approvalStatus: filterApprovalStatus || TAB_QUERY_MAP[activeTab],
        provinceId: filterProvince ? VIETNAM_PROVINCES.indexOf(filterProvince) + 1 : undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page, pageSize,
      });
      setDataSource(res.data); setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách bến cảng'));
    } finally { setIsLoading(false); }
  }, [managingUnitId, filterKeyword, filterPortId, filterWaterwayId,
    filterOperationalFunction, filterOperationalStatus, filterApprovalStatus,
    filterStructureType, filterProvince, filterUpdatedFrom, filterUpdatedTo,
    activeTab, page, pageSize]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);
  useEffect(() => { if (orgUnitReady) void fetchCounts(managingUnitId); }, [managingUnitId, fetchCounts, orgUnitReady]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    // Reset về đơn vị quản lý mặc định (bắt buộc — giống Cảng biển)
    const defaultOrg = defaultOrgUnitId.current;
    setManagingUnitId(defaultOrg === '__all__' ? undefined : defaultOrg);
    setFilterKeyword(''); setFilterPortId(undefined); setFilterWaterwayId(undefined);
    setFilterOperationalFunction('');
    setFilterStructureType(undefined); setFilterOperationalStatus(undefined);
    setFilterApprovalStatus(undefined); setFilterProvince('');
    setFilterUpdatedFrom(undefined); setFilterUpdatedTo(undefined);
    setActiveTab('all'); setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key); setPage(1);
  }, []);

  // ── Detail drawer ────────────────────────────────────────────────
  const openDetailDrawer = useCallback(async (record: Berth) => {
    setDetailDrawerVisible(true); setDetailRecord(record); setDetailFiles([]); setDetailLoading(true);
    try {
      const res = await api.get(`/v1/berths/${record.id}/attachments`, { params: { page: 0, size: 50 } });
      setDetailFiles(res.data?.data || []);
    } catch { setDetailFiles([]); }
    try {
      const fresh = await berthCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch { /* keep initial data */ }
    finally { setDetailLoading(false); }
  }, []);

  const ddToDms = (dd: number): { d: number; m: number; s: number } => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const abs = Math.abs(dd);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
    return { d, m, s };
  };

  // ── Delete confirmation ─────────────────────────────────────────
  const openDeleteModal = useCallback((record: Berth) => {
    setDeletingRecord(record); setDeleteConfirmText(''); setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = (deletingRecord.berthName || 'XÓA').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expectedText && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên bến hoặc gõ "XÓA" để xác nhận'); return;
    }
    try {
      await berthCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa bến cảng');
      setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText('');
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Xóa thất bại'); }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts, managingUnitId]);

  // ── Approval handlers ───────────────────────────────────────────
  const handleApprove = useCallback(async (record: Berth) => {
    try {
      const cap = record.approvalStatus === 'APPROVED_LEVEL2' ? 'CUC' : 'CANG_VU';
      await berthApproval.approve(record.id, cap, approvalContent);
      toast.success('Đã phê duyệt bến cảng');
      setApproveModalOpen(false); setApprovingRecord(null); setApprovalContent('');
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
  }, [fetchData, fetchCounts, managingUnitId, approvalContent]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await berthCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' });
      toast.success('Đã gửi phê duyệt bến cảng');
      setSubmitModalOpen(false); setSubmittingRecord(null);
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại'); }
  }, [submittingRecord, fetchData, fetchCounts, managingUnitId]);

  const openRejectModal = useCallback((record: Berth) => {
    setRejectingRecord(record); setRejectReason(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { toast.error('Lý do từ chối tối đa 500 ký tự'); return; }
    try {
      await berthApproval.reject(rejectingRecord.id, 'CANG_VU', reason);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false); setRejectingRecord(null); setRejectReason('');
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Từ chối thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, managingUnitId]);

  // ── Drawer callbacks ─────────────────────────────────────────────
  const closeCreateDrawer = useCallback(() => { setCreateDrawerVisible(false); void fetchData(); void fetchCounts(managingUnitId); }, [fetchData, fetchCounts, managingUnitId]);
  const closeEditDrawer = useCallback(() => { setEditBerthId(undefined); void fetchData(); void fetchCounts(managingUnitId); }, [fetchData, fetchCounts, managingUnitId]);

  // ── Header actions ──────────────────────────────────────────────
  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('berth:create')) {
      actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary', icon: <PlusOutlined />, onClick: () => setCreateDrawerVisible(true) });
    }
    return actions;
  }, [hasPerm]);

  // ── Filter panel content ────────────────────────────────────────
  // F-018: Bộ lọc cơ bản (luôn hiển thị) + Nâng cao (toggle)
  const filterContent = (
    <>
      {/* ── Cơ bản: ĐVQL + Thuộc cảng biển + Tình trạng ──────────── */}
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Đơn vị quản lý <span style={{ color: statusCritical }}>*</span>
        </div>
        <OrgUnitTreeSelect
          organizations={organizations}
          placeholder="Chọn đơn vị..."
          allowClear
          showPath
          allLabel="Tất cả"
          treeDefaultExpandAll={false}
          value={managingUnitId}
          onChange={(v) => { setManagingUnitId(v); setPage(1); }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên hoặc mã bến cảng</div>
        <Input placeholder="Tìm theo tên hoặc mã bến cảng" allowClear value={filterKeyword}
          onChange={(e) => { setFilterKeyword(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply} style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Loại kết cấu</div>
        <Select placeholder="Chọn loại kết cấu" allowClear value={filterStructureType}
          onChange={(v) => { setFilterStructureType(v); setPage(1); }}
          options={STRUCTURE_TYPE_OPTIONS}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
        <Select placeholder="Chọn cảng biển" allowClear showSearch optionFilterProp="label"
          value={filterPortId} onChange={(v) => { setFilterPortId(v); setPage(1); }}
          options={portOptions.map(o => ({ label: o.label, value: o.value }))}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select placeholder="Chọn tình trạng" allowClear value={filterOperationalStatus}
          onChange={(v) => { setFilterOperationalStatus(v); setPage(1); }}
          options={[
            { value: 'OPERATIONAL', label: 'Đang khai thác/Vận hành' },
            { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/Vận hành' },
            { value: 'SUSPENDED', label: 'Dừng khai thác/Vận hành' },
          ]}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>

      {/* ── Nâng cao: toggle 8 trường ──────────────────────────── */}
      {filterCollapsed && (<>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc luồng hàng hải</div>
        <Select placeholder="Chọn luồng hàng hải" allowClear showSearch optionFilterProp="label"
          value={filterWaterwayId} onChange={(v) => { setFilterWaterwayId(v); setPage(1); }}
          options={Array.from(waterwayMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Công năng khai thác</div>
        <Input placeholder="Tìm theo công năng..." allowClear value={filterOperationalFunction}
          onChange={(e) => { setFilterOperationalFunction(e.target.value); setPage(1); }}
          style={{ borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/TP)</div>
        <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          value={filterProvince || undefined} onChange={(v) => { setFilterProvince(v || ''); setPage(1); }}
          options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Trạng thái</div>
        <Select placeholder="Chọn trạng thái" allowClear value={filterApprovalStatus}
          onChange={(v) => { setFilterApprovalStatus(v); setPage(1); }}
          options={[
            { value: 'DRAFT', label: 'Lưu tạm' },
            { value: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp Cảng vụ' },
            { value: 'APPROVED_LEVEL2', label: 'Chờ phê duyệt cấp Cục' },
            { value: 'APPROVED', label: 'Đã phê duyệt' },
            { value: 'REJECTED', label: 'Từ chối' },
          ]}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
        <DatePicker.RangePicker format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']} allowClear popupClassName="range-single-panel"
          value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
          onChange={(dates) => { setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined); setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined); setPage(1); }}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
      </>)}
    </>
  );

  // ── Status tabs config ──────────────────────────────────────────
  const statusTabs = TAB_STATUS_LIST.map((tab) => ({
    key: tab.key, label: tab.label, count: tabCounts[tab.key] ?? 0,
    color: tab.color, active: activeTab === tab.key,
  }));

  // ── rowActions callback (Port pattern) ──────────────────────────
  const rowActions = useCallback(
    (record: Berth) => {
      const actions: any[] = [
        { key: 'view', label: 'Chi tiết', icon: <EyeOutlined />, onClick: () => openDetailDrawer(record) },
      ];
      const st = record.approvalStatus || '';
      if (hasPerm('berth:update')) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => { setEditBerthId(record.id); setEditBerthName(record.berthName || ''); } });
      if (hasPerm('berth:history')) actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => openHistory(record) });
      if (['DRAFT','NHAP'].includes(st) && hasPerm('berth:update')) actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: <CheckCircleOutlined />, onClick: () => { setSubmittingRecord(record); setSubmitModalOpen(true); } });
      if (hasPerm('berth:approve') && ['APPROVED_LEVEL1','APPROVED_LEVEL2'].includes(st)) { actions.push({ key: 'approve', label: st === 'APPROVED_LEVEL2' ? 'Cục phê duyệt' : 'Cảng vụ phê duyệt', icon: <CheckCircleOutlined />, onClick: () => { setApprovingRecord(record); setApprovalContent(''); setApproveModalOpen(true); } }); actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, danger: true, onClick: () => openRejectModal(record) }); }
      if (hasPerm('berth:delete') && ['DRAFT','NHAP'].includes(st)) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => openDeleteModal(record) });
      return actions;
    },
    [hasPerm, openDetailDrawer, openHistory, openDeleteModal, openRejectModal],
  );

  // ── Table columns (F-018 section 10.2) ────────────────────────────
  const columns = useMemo(() => {
    const baseColumns: any[] = [
      { key: 'sequenceNo', label: 'STT', width: 60, fixed: 'left' as const, align: 'center' as const,
        render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + i + 1}</span> },
      { key: 'orgUnitId', label: 'Đơn vị quản lý', dataIndex: 'orgUnitId', width: 260, fixed: 'left' as const, sortable: true, sortOrder,
        render: (_v: string | null, record: Berth) => <span style={{ fontWeight: fontWeightBold }}>{resolveOrgLevel2Name(organizations, record.orgUnitId) || orgMap.get(record.orgUnitId || '') || '—'}</span> },
      { key: 'berthName', label: <span>Tên/Mã bến cảng</span>, dataIndex: 'berthName', width: 200, fixed: 'left' as const, sortable: true, sortOrder,
        render: (v: string, record: Berth) => (
          <div>
            <a onClick={() => openDetailDrawer(record)} style={{ fontWeight: fontWeightBold, color: actionPrimary, cursor: 'pointer', display: 'block' }}>{v}</a>
            <span style={{ opacity: 0.85 }}>{record.berthCode || '—'}</span>
          </div>
        ) },
      { key: 'structureType', label: 'Loại kết cấu', dataIndex: 'structureType', width: 130,
        render: (v: number | null) => (v != null ? (STRUCTURE_TYPE_OPTIONS.find(o => o.value === v)?.label || v.toString()) : '—') },
      { key: 'portId', label: 'Thuộc cảng biển', dataIndex: 'portId', width: 160,
        render: (v: string | null) => portOptions.find(o => o.value === v)?.label || v || '—' },
      { key: 'waterwayId', label: 'Thuộc luồng hàng hải', dataIndex: 'waterwayId', width: 240, ellipsis: true,
        render: (v?: string) => (v ? (waterwayMap.get(v) || v) : '—') },
      { key: 'provinceId', label: 'Địa điểm (Tỉnh/TP)', dataIndex: 'provinceId', width: 150, sortable: true, sortOrder,
        render: (v: number | null) => v ? VIETNAM_PROVINCES[v - 1] : '—' },
      { key: 'operationalFunction', label: 'Công năng khai thác', dataIndex: 'operationalFunction', width: 200,
        render: (v: string | null) => v || '—' },
      { key: 'operationalStatus', label: 'Tình trạng', dataIndex: 'operationalStatus', width: 190, sortable: true, sortOrder,
        render: (v: string | null) => {
          const m: Record<string, { color: string; label: string }> = {
            OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/Vận hành' },
            NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/Vận hành' },
            SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/Vận hành' },
          };
          const s = m[v || ''] || { color: textTertiary, label: v || '—' };
          return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span>;
        } },
    ];

    // Audit columns — only for Admin Cục / admin-operation (BR-018-05)
    const auditColumns: any[] = isAuditViewer ? [
      { key: 'updatedAt', label: <span>Cán bộ cập nhật</span>, dataIndex: 'updatedAt', width: 200, sortable: true, sortOrder,
        render: (v: string | null, record: Berth) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
      { key: 'submittedForApprovalAt', label: <span>Cán bộ gửi Phê duyệt</span>, dataIndex: 'submittedForApprovalAt', width: 210, sortable: true, sortOrder,
        render: (v: string | null, record: Berth) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.submittedForApprovalBy || '') || record.submittedForApprovalBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
      { key: 'portAuthorityApprovedAt', label: <span>Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>, dataIndex: 'portAuthorityApprovedAt', width: 320, sortable: true, sortOrder,
        render: (v: string | null, record: Berth) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.portAuthorityApprovedBy || '') || record.portAuthorityApprovedBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
      { key: 'portAuthorityApprovalContent', label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'portAuthorityApprovalContent', width: 260,
        render: (v: string | null) => v || '—' },
      { key: 'departmentApprovedAt', label: <span>Cán bộ phê duyệt cấp Cục</span>, dataIndex: 'departmentApprovedAt', width: 240, sortable: true, sortOrder,
        render: (v: string | null, record: Berth) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.departmentApprovedBy || '') || record.departmentApprovedBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
      { key: 'departmentApprovalContent', label: 'Nội dung phê duyệt cấp Cục', dataIndex: 'departmentApprovalContent', width: 240,
        render: (v: string | null) => v || '—' },
    ] : [];

    const tailColumns: any[] = [
      { key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 180, fixed: 'right' as const, sortable: true, sortOrder,
        render: (v: string) => {
          const s = APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v?.toUpperCase()] || { color: textTertiary, label: v || '—' };
          return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span>;
        } },
    ];

    const allColumns = [...baseColumns, ...auditColumns, ...tailColumns];
    return allColumns.map(col => ({
      ...col,
      sortOrder: col.sortable && col.key === sortField ? sortOrder : undefined,
    }));
  }, [page, pageSize, portOptions, organizations, orgMap, userMap, waterwayMap, sortField, sortOrder, isAuditViewer, openDetailDrawer]);

  // ── Detail drawer content ────────────────────────────────────────
  const renderDetailContent = () => {
    if (!detailRecord) return null;
    if (detailLoading) return <LoadingSkeleton rows={6} />;
    return (
      <BerthDetailContent
        selectedRecord={detailRecord}
        orgMap={orgMap}
        organizations={organizations}
        symbolMap={symbolMap}
        symbolImageMap={symbolImageMap}
        portOptions={portOptions}
        userMap={userMap}
        detailFiles={detailFiles}
        ddToDms={ddToDms}
        approvalStyleMap={APPROVAL_STYLE_MAP}
        structureTypeOptions={STRUCTURE_TYPE_OPTIONS}
      />
    );
  };

  // ── Table sort handler ───────────────────────────────────────────
  const handleTableChange = useCallback((_pagination: any, _filters: any, sorter: any) => {
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order || 'descend');
    }
  }, []);

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <style>{`.range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }`}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý bến cảng' }]}
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
        <style>{`.list-view-table .ant-table-cell { padding-block: 9.5px !important; }`}</style>
        {isError ? null : !isLoading && dataSource.length === 0 ? (
          <DataTable dataSource={[]} rowKey="id"
            emptyState={<div style={{ padding: '40px 0', textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📭</div><div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>Không tìm thấy bến cảng nào phù hợp</div></div>}
          />
        ) : !isLoading && !isError && dataSource.length > 0 ? (
          <DataTable columns={columns}
            dataSource={[...dataSource].sort((a: any, b: any) => { if (!sortField) return 0; const aVal = a[sortField] ?? ''; const bVal = b[sortField] ?? ''; const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi'); return sortOrder === 'ascend' ? cmp : -cmp; })}
            rowKey="id" rowActions={rowActions} loading={false}
            onSort={(key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); setPage(1); }}
            scroll={{ x: isAuditViewer ? 2600 : 1500, y: 550 }}
          />
        ) : null}
        <Pagination total={total} current={page} pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </FilterTableLayout>

      {/* ── Create Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới Bến cảng</span>}
        open={createDrawerVisible}
        destroyOnHidden
        onClose={() => { setCreateDrawerVisible(false); createForm.resetFields(); }}
        extra={<Button type="text" onClick={() => { setCreateDrawerVisible(false); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); berthFormRef.current?.submit('DRAFT'); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>Lưu tạm</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); berthFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); berthFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: '#1BAF7A', borderColor: '#1BAF7A' }}>Lưu và phê duyệt</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        afterOpenChange={(open) => { if (open) createForm.resetFields(); }}
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" initialValues={{}}>
          <BerthForm ref={berthFormRef} form={createForm} onFinish={() => { setCreateDrawerVisible(false); void fetchData(); void fetchCounts(managingUnitId); }} onSubmittingChange={setSubmitting} />
        </Form>
      </Drawer>

      {/* ── Edit Drawer ────────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa thông tin — {editBerthName || 'Bến cảng'}</span>}
        open={!!editBerthId}
        onClose={() => { setEditBerthId(undefined); setEditBerthName(''); updateForm.resetFields(); }}
        extra={<Button type="text" onClick={() => { setEditBerthId(undefined); setEditBerthName(''); updateForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'update'; setActionType('update'); editBerthFormRef.current?.submit('UPDATE'); }} loading={submitting && actionType === 'update'} style={primaryButtonStyle}>Cập nhật</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {editBerthId && (<>
          <style>{requiredMarkStyle}</style>
          <Form form={updateForm} layout="vertical" initialValues={{}}>
            <BerthForm ref={editBerthFormRef} form={updateForm} id={editBerthId} onFinish={() => { setEditBerthId(undefined); void fetchData(); void fetchCounts(managingUnitId); }} onSubmittingChange={setSubmitting} />
          </Form>
        </>)}
      </Drawer>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={drawerTitleStyle}>Chi tiết bến cảng{detailRecord ? ` - ${detailRecord.berthName}` : ''}</span>}
        open={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setDetailRecord(null); }}
        extra={<Button type="text" onClick={() => { setDetailDrawerVisible(false); setDetailRecord(null); }} style={drawerCloseBtnStyle}>✕</Button>}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        footer={null}
      >
        {renderDetailContent()}
      </Drawer>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa bến cảng</span>}
        open={deleteModalOpen}
        onCancel={() => { setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); }}
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
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
            Vui lòng nhập <strong>tên bến</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Bến: <strong style={{ color: textPrimary }}>{deletingRecord.berthName}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên bến hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40 }} autoFocus />
        </div>
      </Modal>

      {/* ── Reject Reason Modal ──────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho bến:</p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.berthName}</strong>
            </p>
          )}
          <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={3} maxLength={500} showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd }} />
        </div>
      </Modal>

      {/* ── Submit Modal ──────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận gửi Cảng vụ phê duyệt</span>}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="submit" type="primary" onClick={handleConfirmSubmit}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            Gửi <strong>{submittingRecord?.berthCode} — {submittingRecord?.berthName}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal ─────────────────────────────────────────── */}
      <Modal
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? 'Xác nhận Cục phê duyệt' : 'Xác nhận Cảng vụ phê duyệt'}</span>}
        open={approveModalOpen}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="approve" type="primary" onClick={() => approvingRecord && handleApprove(approvingRecord)}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? statusOperational : statusAttention, borderColor: approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? statusOperational : statusAttention }}>Xác nhận</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
            {approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? 'Cục' : 'Cảng vụ'} phê duyệt <strong>{approvingRecord?.berthCode} — {approvingRecord?.berthName}</strong>?
          </p>
          <div style={{ marginTop: spaceMd }}>
            <div style={{ marginBottom: spaceXs, color: textSecondary, fontSize: fontSizeMd, fontWeight: fontWeightMedium }}>Nội dung phê duyệt</div>
            <Input.TextArea rows={3} placeholder="Nhập nội dung phê duyệt (không bắt buộc)..." value={approvalContent}
              onChange={(e) => setApprovalContent(e.target.value)}
              style={{ fontSize: fontSizeMd }} />
          </div>
        </div>
      </Modal>

      {/* ── History Drawer ──────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        size={880}
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Bến cảng' : (historyTarget ? `Lịch sử thay đổi — ${historyTarget.berthName}` : 'Lịch sử thay đổi')}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>Tổng cộng {historyGroupCount}</span>
            </Space>
          </div>
        }
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        extra={<Button type="text" onClick={() => setHistoryOpen(false)} style={drawerCloseBtnStyle}>✕</Button>}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}>
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
        {!historyLoading && (
          <div style={{ display: 'none' }}>
            <Radio.Group value={historyMode} size="middle" style={{ display: 'flex', width: '100%', borderBottom: `1px solid ${borderDefault}` }}
              onChange={async e => { const mode = e.target.value; setHistoryMode(mode); setHistoryLoading(true); setHistoryRecords([]); if (mode === 'all') { try { const res = await api.get('/v1/berths/history/all'); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []); setHistoryEntityNames(d?.entityNames || {}); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } else { try { const res = await api.get(`/v1/berths/${historyTarget?.id}/history`); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } }}>
              <Radio.Button value="current" style={{ fontWeight: fontWeightBold, color: historyMode !== 'current' ? textSecondary : actionPrimary }}>Bản ghi hiện tại</Radio.Button>
              <Radio.Button value="all" style={{ fontWeight: fontWeightBold, color: historyMode !== 'all' ? textSecondary : actionPrimary }}>Tất cả bản ghi</Radio.Button>
            </Radio.Group>
          </div>
        )}
        {!historyLoading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
              onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
            {historyMode === 'all' && <Select placeholder="Chọn bến cảng" allowClear showSearch value={historyEntityFilter || undefined}
              onChange={v => setHistoryEntityFilter(v || '')}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              style={{ width: 200, borderRadius: radiusPill, height: 40 }}
              options={Object.entries(historyEntityNames).map(([id, name]) => ({ value: id, label: name }))} />}
            <DatePicker placeholder="Từ ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={historyFrom ? dayjs(historyFrom) : null}
              onChange={d => setHistoryFrom(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <DatePicker placeholder="Đến ngày" classNames={{ popup: { root: 'history-dt-popup' } }} value={historyTo ? dayjs(historyTo) : null}
              onChange={d => setHistoryTo(d ? d.format('YYYY-MM-DD HH:mm') : '')}
              style={{ width: 170, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY HH:mm" showTime={{ format: 'HH:mm' }} />
            <Button type="primary" icon={<SearchOutlined />} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Tìm kiếm</Button>
          </div>
        )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {historyLoading ? <LoadingSkeleton rows={5} /> : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div></div>
        ) : renderBerthHistoryTimeline(historyRecords)}
        </div>
      </Drawer>
    </div>
  );
}
