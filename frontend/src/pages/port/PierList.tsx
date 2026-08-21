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
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { trangThaiPheDuyetBadge } from '../../services/port/schema';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
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
  historyBadgeStyle, historyGroupGridStyle, historyTimeStyle, historyMetaRowStyle,
  historyInfoCardStyle, historyAccentBarStyle, historyInfoTitleStyle,
  historyChangeRowStyle, historyCreateRowStyle, historyFieldLabelStyle,
  historyOldValueStyle, historyNewValueStyle, historyArrowStyle,
} from '../../tokens';
import { colors } from '../../theme';

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Nháp' }, DRAFT: { color: statusDraft, label: 'Nháp' },
  PENDING: { color: statusAttention, label: 'Chờ phê duyệt' },
  CHO_PHE_DUYET: { color: statusAttention, label: 'Chờ phê duyệt' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ phê duyệt' },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ Cục duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
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
  { key: 'APPROVED_LEVEL1', label: 'Chờ Cảng vụ duyệt', color: actionPrimary },
  { key: 'APPROVED_LEVEL2', label: 'Chờ Cục duyệt', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];
const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined, DRAFT: 'DRAFT', APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED_LEVEL2: 'APPROVED_LEVEL2', APPROVED: 'APPROVED', REJECTED: 'REJECTED',
};

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Kết cấu bệ cọc cao' }, { value: 2, label: 'Kết cấu cường từ' },
  { value: 3, label: 'Kết cấu trọng lực' }, { value: 4, label: 'Kết cấu khác' },
];
const CONSTRUCTION_GRADE_OPTIONS = [
  { value: 1, label: 'Cấp đặc biệt' }, { value: 2, label: 'Cấp 1' },
  { value: 3, label: 'Cấp 2' }, { value: 4, label: 'Cấp 3' }, { value: 5, label: 'Cấp 4' },
];

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'; try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
}

const histLabels: Record<string, string> = {
  pierCode: 'Mã cầu', pierName: 'Tên cầu', berthId: 'Bến cảng', portId: 'Cảng biển',
  length: 'Chiều dài', width: 'Chiều rộng', pierType: 'Loại cầu',
  operationalStatus: 'Tình trạng', approvalStatus: 'Trạng thái', orgUnitId: 'Đơn vị quản lý',
  designLoad: 'Tải trọng thiết kế', operationalFunction: 'Công năng khai thác',
  mapSymbolId: 'Biểu tượng bản đồ', navigationChannelId: 'Luồng hàng hải',
  province: 'Tỉnh/Thành phố', detailedLocation: 'Địa điểm chi tiết',
  constructionGrade: 'Cấp công trình', structureType: 'Loại kết cấu',
  conditionStatus: 'Tình trạng kỹ thuật', currentWaterDepth: 'Độ sâu hiện tại',
  designBedElevation: 'Cao độ đáy thiết kế', publishedVesselDWT: 'Trọng tải tàu công bố',
  maintenanceApprovalDate: 'Ngày duyệt bảo trì', safetyAssessmentDate: 'Ngày đánh giá an toàn',
  lastInspectionDate: 'Ngày kiểm tra gần nhất', operatingPierCount: 'Số cầu đang khai thác',
  publishedPierCount: 'Số cầu công bố', investmentAgreementPierCount: 'Số cầu thỏa thuận đầu tư',
  cargoThroughput: 'Sản lượng hàng hóa', receivesLargeVessel: 'Nhận tàu lớn',
  documentNumber: 'Số văn bản', documentDate: 'Ngày văn bản',
  openingAnnouncementDate: 'Ngày công bố mở', openingDecision: 'Quyết định mở',
  investmentAgreementDoc: 'Thỏa thuận đầu tư', waterAreaNeutralScope: 'Phạm vi khu nước',
  coordinateSystem: 'Hệ quy chiếu', displayRule: 'Quy tắc hiển thị',
  spatialId: 'Vị trí không gian', 'Trạng thái': 'Hành động',
};
function histField(fn: string): string { return histLabels[fn] || fn; }
function histVal(fn: string, val: string | null, orgMap?: Map<string, string>, symbolMap?: Map<string, string>, portMap?: Map<string, string>, berthMap?: Map<string, string>): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const f = orgMap.get(val); return f ? f.split(' - ').pop() || f : val; }
  if (fn === 'portId' && portMap) return portMap.get(val) || val;
  if (fn === 'berthId' && berthMap) return berthMap.get(val) || val;
  if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'approvalStatus') { const m: Record<string,string> = { DRAFT:'Nháp', PENDING:'Chờ duyệt', PENDING_APPROVAL:'Chờ phê duyệt', APPROVED:'Đã phê duyệt', REJECTED:'Từ chối' }; return m[val?.toUpperCase()] || val; }
  if (fn === 'operationalStatus') { const m: Record<string,string> = { OPERATIONAL:'Đang khai thác/Vận hành', NOT_YET_OPERATIONAL:'Chưa khai thác/Vận hành', SUSPENDED:'Dừng khai thác/Vận hành', HIEN_HANH:'Hiện hành', TAM_NGUNG:'Tạm ngừng', DANG_KHAI_THAC:'Đang khai thác/Vận hành', CHUA_KHAI_THAC:'Chưa khai thác/Vận hành', DUNG_KHAI_THAC:'Dừng khai thác/Vận hành' }; return m[val?.toUpperCase()] || val; }
  if (fn === 'pierType') { const m: Record<string,string> = { CONTAINER:'Container', TONG_HOP:'Tổng hợp', HANH_KHACH:'Hành khách', CHUYEN_DUNG_XANG_DAU:'Chuyên dùng xăng dầu', CHUYEN_DUNG_ROI_QUANG:'Chuyên dùng rời/quặng', KHAC:'Khác' }; return m[val?.toUpperCase()] || val; }
  if (fn === 'province') return VIETNAM_PROVINCES[Number(val)-1] || val;
  if (fn === 'coordinateSystem') { const m: Record<string,string> = { '1':'WGS-84', '2':'VN-2000' }; return m[val] || val; }
  if (fn === 'receivesLargeVessel') { return val === 'true' ? 'Có' : val === 'false' ? 'Không' : val; }
  if (fn.endsWith('At') || fn.endsWith('Date')) { try { let d = dayjs(val); if (!d.isValid()) { d = dayjs((val || '').replace(/\.\d+$/, '')); } return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : val; } catch { return val; } }
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
  const userPermissions = useAuthStore((s) => s.user?.permissions) || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation');
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [orgUnit, setOrgUnit] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [filterBerthId, setFilterBerthId] = useState<string | undefined>();
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterPierType, setFilterPierType] = useState<string | undefined>();
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [filterWaterwayId, setFilterWaterwayId] = useState<string | undefined>();
  const [filterConstructionGrade, setFilterConstructionGrade] = useState<number | undefined>();
  const [filterStructureType, setFilterStructureType] = useState<number | undefined>();
  const [filterOperationalFunction, setFilterOperationalFunction] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
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
  const [waterwayMap, setWaterwayMap] = useState<Map<string, string>>(new Map());
  const portMap = useMemo(() => {
    const m = new Map<string, string>();
    portOptions.forEach((o) => m.set(o.value, o.label));
    return m;
  }, [portOptions]);
  const berthMap = useMemo(() => {
    const m = new Map<string, string>();
    berthOptions.forEach((o) => m.set(o.value, o.label));
    return m;
  }, [berthOptions]);
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
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('draft');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<Pier | null>(null);
  const [approvalContent, setApprovalContent] = useState('');
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
      const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory.filter((r: any) => r.fieldName !== 'CREATE') : []);
    } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); }
  }, []);

  const HISTORY_FIELD_ORDER = ['orgUnitId', 'portId', 'berthId', 'pierCode', 'pierName', 'pierType', 'length', 'width', 'designLoad', 'operationalFunction', 'operationalStatus', 'province', 'detailedLocation', 'coordinateSystem', 'displayRule', 'mapSymbolId', 'constructionGrade', 'structureType', 'conditionStatus', 'currentWaterDepth', 'designBedElevation', 'publishedVesselDWT', 'maintenanceApprovalDate', 'safetyAssessmentDate', 'lastInspectionDate', 'operatingPierCount', 'publishedPierCount', 'investmentAgreementPierCount', 'cargoThroughput', 'receivesLargeVessel', 'documentNumber', 'documentDate', 'openingAnnouncementDate', 'openingDecision', 'investmentAgreementDoc', 'waterAreaNeutralScope', 'navigationChannelId'];

  const renderPierHistoryTimeline = (records: any[]) => {
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...records].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime());
    const q = historySearch.toLowerCase().trim();
    const groups: { tsSec: number; ts: string; actor: string; items: any[] }[] = [];
    for (const r of sorted) {
      if (q) {
        const fn = (r.fieldName || '').toLowerCase();
        const ov = (r.oldValue || '').toLowerCase();
        const nv = (r.newValue || '').toLowerCase();
        const lb = histField(r.fieldName || '').toLowerCase();
        const od = histVal(r.fieldName, r.oldValue, orgMap, symbolMap, portMap, berthMap).toLowerCase();
        const nd = histVal(r.fieldName, r.newValue, orgMap, symbolMap, portMap, berthMap).toLowerCase();
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
            return `${parts.length} hạng mục`;
          }
          if (/^-?\d+(\.\d+)?$/.test(t)) {
            const n = Number(t);
            return Number.isInteger(n) ? n.toLocaleString('vi-VN') : t;
          }
          return histVal(fn, raw, orgMap, symbolMap, portMap, berthMap);
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
                    <div style={historyFieldLabelStyle}>{fn ? `${histField(fn)}:` : '—'}</div>
                    <span title={nv ?? '—'} style={historyNewValueStyle}>{renderCell(change.newValue) ?? (nv ?? '—')}</span>
                  </div>
                ) : (
                  <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                    <div style={historyFieldLabelStyle}>{fn ? `${histField(fn)}:` : '—'}</div>
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

  useEffect(() => {
    (async () => { try { const r = await organizationService.list({ pageSize: 1000 }); const data = r.data || []; setOrganizations(data); if (data.length > 0) { try { const p = await api.get('/users/me'); const uOrgId = (p.data?.data ?? p.data)?.orgUnitId; const matchedOrgId = uOrgId ? (data.find((o: any) => o.id === uOrgId) ? uOrgId : data[0].id) : '__all__'; setOrgUnit(matchedOrgId); defaultOrgUnitRef.current = matchedOrgId; appliedFiltersRef.current = { ...appliedFiltersRef.current, orgUnit: matchedOrgId }; setSearchInput(''); } catch { setOrgUnit(data[0].id); defaultOrgUnitRef.current = data[0].id; appliedFiltersRef.current = { ...appliedFiltersRef.current, orgUnit: data[0].id }; setSearchInput(''); } } } catch {} })();
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
    (async () => { try { const params: any = { page: 1, pageSize: 1000 }; if (orgUnit && orgUnit !== '__all__') params.orgUnitId = orgUnit; if (filterPortId) params.portId = filterPortId; params.approvalStatus = 'APPROVED'; const r = await berthCRUD.search(params); setBerthOptions((r.data || []).map((b: any) => ({ value: b.id, label: b.berthName }))); } catch {} })();
  }, [orgUnit, filterPortId]);

  useEffect(() => {
    lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 })
      .then((r: any) => { const m = new Map<string, string>(); (r.data || []).forEach((l: any) => { m.set(l.id, l.name || l.code); }); setWaterwayMap(m); })
      .catch(() => {});
  }, []);

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
        navigationChannelId: f.waterwayId,
        constructionGrade: f.constructionGrade,
        structureType: f.structureType,
        operationalFunction: f.operationalFunction || undefined,
        updatedFrom: f.updatedFrom,
        updatedTo: f.updatedTo,
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
      waterwayId: filterWaterwayId, constructionGrade: filterConstructionGrade, structureType: filterStructureType,
      operationalFunction: filterOperationalFunction, updatedFrom: filterUpdatedFrom, updatedTo: filterUpdatedTo,
    };
    setPage(1);
    setRefreshKey(k => k + 1);
  }, [searchInput, orgUnit, filterBerthId, filterPortId, filterPierType, filterProvince, filterOperationalStatus, filterApprovalStatus,
    filterWaterwayId, filterConstructionGrade, filterStructureType, filterOperationalFunction, filterUpdatedFrom, filterUpdatedTo]);
  const handleFilterReset = useCallback(() => {
    const oid = defaultOrgUnitRef.current || '__all__';
    appliedFiltersRef.current = { orgUnit: oid, search: '', berthId: undefined, portId: undefined, pierType: undefined, province: undefined, operationalStatus: undefined, approvalStatus: undefined, waterwayId: undefined, constructionGrade: undefined, structureType: undefined, operationalFunction: '', updatedFrom: undefined, updatedTo: undefined };
    setOrgUnit(oid); setSearchInput('');
    setFilterPortId(undefined); setFilterBerthId(undefined); setFilterPierType(undefined);
    setFilterProvince(undefined); setFilterOperationalStatus(undefined); setFilterApprovalStatus(undefined);
    setFilterWaterwayId(undefined); setFilterConstructionGrade(undefined); setFilterStructureType(undefined);
    setFilterOperationalFunction(''); setFilterUpdatedFrom(undefined); setFilterUpdatedTo(undefined);
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
    const expectedText = (deletingRecord.pierName || 'XÓA').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expectedText && input !== 'xóa') { toast.error('Vui lòng nhập đúng tên cầu hoặc gõ "XÓA" để xác nhận'); return; }
    try { await pierCRUD.delete(deletingRecord.id); toast.success('Đã xóa cầu cảng'); setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText(''); void fetchData(); void fetchCounts(orgUnit); }
    catch (ex: unknown) { toast.error(ex instanceof Error ? ex.message : 'Xóa thất bại'); }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts, orgUnit]);

  const handleApprove = useCallback(async (record: Pier) => {
    const cap = record.approvalStatus === 'APPROVED_LEVEL2' ? 'CUC' : 'CANG_VU';
    try { await pierApproval.approve(record.id, cap, approvalContent); toast.success(cap === 'CUC' ? 'Đã phê duyệt cấp Cục' : 'Đã phê duyệt cấp Cảng vụ'); setApproveModalOpen(false); setApprovingRecord(null); setApprovalContent(''); void fetchData(); void fetchCounts(orgUnit); }
    catch (ex: unknown) { toast.error(ex instanceof Error ? ex.message : 'Phê duyệt thất bại'); }
  }, [fetchData, fetchCounts, orgUnit, approvalContent]);

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
      await pierApproval.reject(rejectingRecord.id, rejectingRecord.approvalStatus === 'APPROVED_LEVEL2' ? 'CUC' : 'CANG_VU', rejectReason.trim());
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
          value={orgUnit}
          onChange={(v) => { setOrgUnit(v); setPage(1); }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên hoặc mã cầu cảng</div>
        <Input style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Tìm theo tên hoặc mã cầu cảng"
          value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onPressEnter={handleFilterApply}
          allowClear prefix={<SearchOutlined style={{ color: textTertiary }} />} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Loại kết cấu cầu cảng</div>
        <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn loại kết cấu" allowClear
          value={filterStructureType} onChange={v => setFilterStructureType(v)}
          options={STRUCTURE_TYPE_OPTIONS} />
      </div>
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
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc luồng hàng hải</div>
        <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn luồng hàng hải" allowClear showSearch
          value={filterWaterwayId} onChange={v => setFilterWaterwayId(v)}
          options={Array.from(waterwayMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
          filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn tình trạng" allowClear
          value={filterOperationalStatus} onChange={v => setFilterOperationalStatus(v)}
          options={[{ value: 'OPERATIONAL', label: 'Đang khai thác/Vận hành' }, { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/Vận hành' }, { value: 'SUSPENDED', label: 'Dừng khai thác/Vận hành' }]} />
      </div>
      {filterCollapsed && (<>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn tỉnh/thành phố" allowClear showSearch
            value={filterProvince} onChange={v => setFilterProvince(v)}
            filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân cấp công trình</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn phân cấp" allowClear
            value={filterConstructionGrade} onChange={v => setFilterConstructionGrade(v)}
            options={CONSTRUCTION_GRADE_OPTIONS} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Công năng khai thác</div>
          <Input style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Tìm theo công năng..." allowClear
            value={filterOperationalFunction} onChange={e => setFilterOperationalFunction(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Trạng thái</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn trạng thái" allowClear
            value={filterApprovalStatus} onChange={v => { setFilterApprovalStatus(v); setActiveTab('all'); }}
            options={[{ value: 'DRAFT', label: 'Nháp' }, { value: 'APPROVED_LEVEL1', label: 'Chờ Cảng vụ duyệt' }, { value: 'APPROVED_LEVEL2', label: 'Chờ Cục duyệt' }, { value: 'APPROVED', label: 'Đã phê duyệt' }, { value: 'REJECTED', label: 'Từ chối' }]} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
          <DatePicker.RangePicker format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} allowClear
            value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
            onChange={(dates) => { setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined); setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined); }}
            style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
        </div>
      </>)}
    </>
  );

  const rowActions = useCallback((record: Pier) => {
    const actions: any[] = [{ key: 'view', label: 'Chi tiết', icon: <EyeOutlined />, onClick: () => openDetailDrawer(record) }];
    const st = record.approvalStatus || '';
    if (hasPerm('pier:update')) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => { setEditPierId(record.id); setCreateDrawerVisible(true); } });
    if (hasPerm('pier:history')) actions.push({ key: 'history', label: 'Lịch sử', icon: <HistoryOutlined />, onClick: () => openHistory(record) });
    if (['DRAFT','NHAP'].includes(st) && hasPerm('pier:update')) actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: <CheckCircleOutlined />, onClick: () => handleSubmitApproval(record) });
    if (hasPerm('pier:approve') && ['APPROVED_LEVEL1','APPROVED_LEVEL2'].includes(st)) {
      actions.push({ key: 'approve', label: st === 'APPROVED_LEVEL2' ? 'Cục phê duyệt' : 'Cảng vụ phê duyệt', icon: <CheckCircleOutlined />, onClick: () => { setApprovingRecord(record); setApprovalContent(''); setApproveModalOpen(true); } });
      actions.push({ key: 'reject', label: 'Từ chối', icon: <CloseCircleOutlined />, danger: true, onClick: () => openRejectModal(record) });
    }
    if (hasPerm('pier:delete') && ['DRAFT','NHAP'].includes(st)) actions.push({ key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => openDeleteModal(record) });
    return actions;
  }, [hasPerm, openDetailDrawer, openHistory, handleSubmitApproval, openRejectModal, openDeleteModal]);

  const auditColumns = useMemo(() => {
    if (!isAuditViewer) return [];
    return [
      { label: 'Cán bộ gửi Phê duyệt', dataIndex: 'submittedForApprovalAt', key: 'submittedForApprovalAt', width: 230,
        render: (v: string | null, record: Pier) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.submittedForApprovalBy || '') || record.submittedForApprovalBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
      { label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'portAuthorityApprovedAt', key: 'portAuthorityApprovedAt', width: 350,
        render: (v: string | null, record: Pier) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.portAuthorityApprovedBy || '') || record.portAuthorityApprovedBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
      { label: 'Cán bộ phê duyệt cấp Cục', dataIndex: 'departmentApprovedAt', key: 'departmentApprovedAt', width: 260,
        render: (v: string | null, record: Pier) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.departmentApprovedBy || '') || record.departmentApprovedBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
    ];
  }, [isAuditViewer, userMap]);

  const columns = useMemo(() => [
    { label: 'STT', key: 'stt', width: 60, fixed: 'left' as const, align: 'center' as const,
      render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + i + 1}</span> },
    { label: 'Đơn vị quản lý', dataIndex: 'orgUnitId', key: 'orgUnitId', width: 260, fixed: 'left' as const, sortable: true,
      render: (v: string | null, r: Pier) => <span style={{ fontWeight: fontWeightBold }}>{resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(v || '') || '—'}</span> },
    { label: <span>Tên/Mã cầu cảng</span>, dataIndex: 'pierName', key: 'pierName', width: 210, fixed: 'left' as const, sortable: true, ellipsis: false,
      render: (v: string, record: Pier) => (
        <div>
          <a title={v || '—'} onClick={(e) => { e.stopPropagation(); openDetailDrawer(record); }} style={{ fontWeight: fontWeightBold, color: actionPrimary, cursor: 'pointer', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v || '—'}</a>
          <span style={{ opacity: 0.85 }}>{record.pierCode || '—'}</span>
        </div>
      ) },
    { label: 'Loại kết cấu cầu cảng', dataIndex: 'structureType', key: 'structureType', width: 200,
      render: (v?: number) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v != null ? (STRUCTURE_TYPE_OPTIONS.find(o => o.value === v)?.label || v.toString()) : '—'}</span> },
    { label: 'Thuộc cảng biển', dataIndex: 'portId', key: 'portId', width: 160,
      render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{portMap.get(v || '') || v || '—'}</span> },
    { label: 'Thuộc bến cảng', dataIndex: 'berthName', key: 'berthName', width: 170,
      render: (v: string, r: Pier) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || r.tenBenCang || berthOptions.find(b => b.value === r.berthId)?.label || r.berthId || '—'}</span> },
    { label: 'Thuộc luồng hàng hải', dataIndex: 'navigationChannelId', key: 'navigationChannelId', width: 240, ellipsis: true,
      render: (v?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v ? (waterwayMap.get(v) || v) : '—'}</span> },
    { label: 'Địa điểm (Tỉnh/TP)', dataIndex: 'province', key: 'province', width: 250, sortable: true,
      render: (v?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
    { label: 'Phân cấp công trình', dataIndex: 'constructionGrade', key: 'constructionGrade', width: 180,
      render: (v?: number) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v != null ? (CONSTRUCTION_GRADE_OPTIONS.find(o => o.value === v)?.label || v.toString()) : '—'}</span> },
    { label: 'Công năng khai thác', dataIndex: 'operationalFunction', key: 'operationalFunction', width: 200, ellipsis: true,
      render: (v?: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v || '—'}</span> },
    { label: 'Tình trạng', dataIndex: 'operationalStatus', key: 'operationalStatus', width: 190, sortable: true,
      render: (v: string) => { const b = v && OPERATIONAL_STYLE_MAP[v]; return b ? <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${b.color}15`, color: b.color }}>{b.label}</span> : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>; } },
    { label: 'Cán bộ cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', width: 200, sortable: true,
      render: (v: string, record: Pier) => (
        <div>
          <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || '—'}</span><br />
          <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
        </div>
      ) },
    ...auditColumns,
    { label: 'Trạng thái', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 180, fixed: 'right' as const, sortable: true,
      render: (v: string) => {
        const badge = v ? trangThaiPheDuyetBadge(v) : null;
        if (!badge || badge.color === 'default') { const s = v && APPROVAL_STYLE_MAP[v]; return s ? <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${s.color}15`, color: s.color }}>{s.label}</span> : <span style={{ fontSize: fontSizeMd, color: textTertiary }}>—</span>; }
        const bc = badge.color === 'green' ? statusOperational : badge.color === 'red' ? statusCritical : badge.color === 'orange' ? statusAttention : textTertiary;
        return <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${bc}15`, color: bc }}>{badge.label}</span>;
      } },
  ].map(col => ({ ...col, sortOrder: col.sortable && col.key === sortField ? sortOrder : undefined })), [page, pageSize, organizations, orgMap, berthOptions, portMap, waterwayMap, userMap, auditColumns, sortField, sortOrder, openDetailDrawer]);

  const headerActions = useMemo(() => {
    const actions: Array<{ key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon?: React.ReactNode; onClick: () => void }> = [];
    if (hasPerm('pier:create')) {
      actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary', icon: <PlusOutlined />, onClick: () => setCreateDrawerVisible(true) });
    }
    return actions;
  }, [hasPerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <ScreenHeader breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý cầu cảng' }]}
        actions={headerActions} />
      <FilterTableLayout filterContent={filterContent}
        statusTabs={TAB_STATUS_LIST.map(t => ({ key: t.key, label: t.label, color: t.color, count: tabCounts[t.key] ?? 0, active: activeTab === t.key }))}
        onStatusTabChange={handleTabChange} onFilterApply={handleFilterApply} onFilterReset={handleFilterReset}
        filterCollapsed={filterCollapsed} onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
        loading={isLoading} error={isError} onRetry={() => void fetchData()}>
        <style>{`.list-view-table .ant-table-cell { padding-block: 8.5px !important; }`}</style>
        {isError ? null : !isLoading && dataSource.length === 0 ? (
          <DataTable dataSource={[]} rowKey="id" emptyState={<div style={{ padding: '40px 0', textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📭</div><div style={{ fontSize: fontSizeLg, color: textSecondary, marginBottom: 8 }}>Không tìm thấy cầu cảng nào phù hợp</div></div>} />
        ) : !isLoading && !isError && dataSource.length > 0 ? (
          <DataTable columns={columns} dataSource={[...dataSource].sort((a: any, b: any) => { if (!sortField) return 0; const av = a[sortField] ?? ''; const bv = b[sortField] ?? ''; const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'vi'); return sortOrder === 'ascend' ? c : -c; })}
            rowKey="id" rowActions={rowActions} loading={false} onSort={(k: string, o: 'asc' | 'desc') => { setSortField(k); setSortOrder(o === 'asc' ? 'ascend' : 'descend'); setPage(1); }}
            scroll={{ x: 1900, y: 500 }} />
        ) : null}
        <Pagination total={total} current={page} pageSize={pageSize} onChange={(p, ps) => { setPage(p); setPageSize(ps); }} />
      </FilterTableLayout>

      <Drawer {...drawerProps} title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editPierId ? 'Chỉnh sửa thông tin Cầu cảng' : 'Thêm mới Cầu cảng'}</span>} open={createDrawerVisible} destroyOnHidden
        onClose={() => { setCreateDrawerVisible(false); createForm.resetFields(); }}
        afterOpenChange={(open) => { if (!open) setEditPierId(undefined); }}
        extra={<Button type="text" onClick={() => { setCreateDrawerVisible(false); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={<div style={drawerFooterStyle}>{editPierId ? <Button htmlType="button" type="primary" onClick={() => { setActionType('update'); pierFormRef.current?.submit('UPDATE'); }} loading={submitting && actionType === 'update'} style={primaryButtonStyle}>Cập nhật</Button> : <><Button htmlType="button" onClick={() => { setActionType('draft'); pierFormRef.current?.submit('DRAFT'); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>Lưu tạm</Button><Button htmlType="button" type="primary" onClick={() => { setActionType('submit'); pierFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button><Button htmlType="button" type="primary" onClick={() => { setActionType('approve'); pierFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: '#1BAF7A', borderColor: '#1BAF7A' }}>Lưu và phê duyệt</Button></>}</div>}
        styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}>
        <Form form={createForm} layout="vertical">
          <style>{requiredMarkStyle}</style>
          <PierForm ref={pierFormRef} form={createForm} id={editPierId} onFinish={() => { setCreateDrawerVisible(false); void fetchData(); void fetchCounts(orgUnit); }} onSubmittingChange={setSubmitting} />
        </Form>
      </Drawer>

      <Drawer {...drawerProps} title={<span style={drawerTitleStyle}>Chi tiết cầu cảng{detailRecord ? ` - ${detailRecord.pierName}` : ''}</span>} open={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setDetailRecord(null); }}
        extra={<Button type="text" onClick={() => { setDetailDrawerVisible(false); setDetailRecord(null); }} style={drawerCloseBtnStyle}>✕</Button>}
        styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }} footer={null}>
        {detailRecord && <PierDetailContent selectedRecord={detailRecord} orgMap={orgMap} portMap={portMap} berthOptions={berthOptions} symbolMap={symbolMap} symbolImageMap={symbolImageMap} detailFiles={detailFiles} ddToDms={dd2dms} approvalStyleMap={APPROVAL_STYLE_MAP} operationalStyleMap={OPERATIONAL_STYLE_MAP} userMap={userMap} />}
      </Drawer>

      <Modal title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa cầu cảng</span>} open={deleteModalOpen}
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
            Vui lòng nhập <strong>tên cầu</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Cầu cảng: <strong style={{ color: textPrimary }}>{deletingRecord.pierName}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên cầu hoặc XÓA" value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)} onPressEnter={handleConfirmDelete}
            style={{ borderRadius: radiusPill, height: 40 }} autoFocus />
        </div>
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
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>{approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? 'Xác nhận Cục phê duyệt' : 'Xác nhận Cảng vụ phê duyệt'}</span>}
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
            Phê duyệt <strong>{approvingRecord?.pierCode} — {approvingRecord?.pierName}</strong>?{approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? ' (cấp Cục)' : ' (cấp Cảng vụ)'}
          </p>
          <div style={{ marginTop: spaceMd }}>
            <div style={{ marginBottom: spaceXs, color: textSecondary, fontSize: fontSizeMd, fontWeight: fontWeightMedium }}>Nội dung phê duyệt</div>
            <Input.TextArea rows={3} placeholder="Nhập nội dung phê duyệt (không bắt buộc)..." value={approvalContent}
              onChange={(e) => setApprovalContent(e.target.value)}
              style={{ fontSize: fontSizeMd }} />
          </div>
        </div>
      </Modal>

      <Drawer
        {...drawerProps}
        size={880}
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Cầu cảng' : (historyTarget ? `Lịch sử thay đổi — ${historyTarget.pierName}` : 'Lịch sử thay đổi')}
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
              onChange={async e => { const mode = e.target.value; setHistoryMode(mode); setHistoryLoading(true); setHistoryRecords([]); if (mode === 'all') { try { const res = await api.get('/v1/piers/history/all'); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory.filter((r: any) => r.fieldName !== 'CREATE') : []); setHistoryEntityNames(d?.entityNames || {}); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } else { try { const res = await api.get(`/v1/piers/${historyTarget?.id}/history`); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory.filter((r: any) => r.fieldName !== 'CREATE') : []); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } }}>
              <Radio.Button value="current" style={{ fontWeight: fontWeightBold, color: historyMode !== 'current' ? textSecondary : actionPrimary }}>Bản ghi hiện tại</Radio.Button>
              <Radio.Button value="all" style={{ fontWeight: fontWeightBold, color: historyMode !== 'all' ? textSecondary : actionPrimary }}>Tất cả bản ghi</Radio.Button>
            </Radio.Group>
          </div>
        )}
        {!historyLoading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
              onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
            {historyMode === 'all' && <Select placeholder="Chọn cầu cảng" allowClear showSearch value={historyEntityFilter || undefined}
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
        ) : renderPierHistoryTimeline(historyRecords)}
        </div>
      </Drawer>
    </div>
  );
}
