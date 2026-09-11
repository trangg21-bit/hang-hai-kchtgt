import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Input, Select, DatePicker,
  Radio, Space, Typography, Form,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  shipRepairYardCRUD,
  portCRUD,
  pierCRUD,
} from '../../services/portService';
import type { ShipRepairYard } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import { FilterOrgUnitTreeSelect, resolveOrgLevel2Name, resolveDefaultOrgUnitId } from '../../components/org-unit';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, DataTable, type ScreenHeaderAction } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import AppDrawer from '../../components/shared/AppDrawer';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import ShipRepairYardForm from './ShipRepairYardForm';
import ShipRepairYardDetailContent from './ShipRepairYardDetailContent';
import {
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  fontSizeMd,
  fontSizeLg,
  fontWeightMedium,
  fontWeightBold,
  radiusPill,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceXl,
  spaceFormField,
  drawerTitleStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  icons, statusBadgeStyle, cellTitleStyle, cellSubtitleStyle, getRangePickerProps,
  formatUserDisplayName, isUuidString,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { renderStandardHistoryCards, isBlankOrDash } from '../../utils/changeHistoryRenderer';
import { ThemeTokenProvider, type ThemeToken } from '../../context/ThemeTokenContext';
import { canEditApprovalRecord, canDeleteApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalModal from '../../components/shared/ApprovalModal';

// ── Constants ────────────────────────────────────────────────────────

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
};

const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp cục', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp cục', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined,
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
};

// ── Helper: format date ──────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

// ── History helpers ───────────────────────────────────────────────────

const historyFieldLabels: Record<string, string> = {
  securityLevel: 'Cấp bảo mật', shipRepairYardCode: 'Mã cơ sở sửa chữa, đóng tàu', shipRepairYardName: 'Tên cơ sở sửa chữa, đóng tàu', portId: 'Thuộc cảng biển',
  pierId: 'Thuộc cầu cảng',
  provinceId: 'Tỉnh/Thành phố', detailedLocation: 'Địa điểm chi tiết', operationalStatus: 'Tình trạng hoạt động',
  usageFunction: 'Công năng sử dụng', workshopArea: 'Diện tích nhà xưởng, kho bãi',
  vesselType: 'Loại tàu đóng mới, sửa chữa', vesselDwt: 'Cỡ tàu',
  businessType: 'Loại hình doanh nghiệp', activity: 'Hoạt động',
  slipwayCount: 'Số lượng triền đà', remarks: 'Ghi chú',
  orgUnitId: 'Đơn vị quản lý', mapSymbolId: 'Biểu tượng', approvalStatus: 'Trạng thái',
  submittedForApprovalAt: 'Ngày gửi phê duyệt', submittedForApprovalBy: 'Người gửi phê duyệt',
  portAuthorityApprovedAt: 'Ngày duyệt Cảng vụ', portAuthorityApprovedBy: 'Người duyệt Cảng vụ',
  portAuthorityApprovalContent: 'Nội dung phê duyệt Cảng vụ',
  departmentApprovedAt: 'Ngày duyệt Cục', departmentApprovedBy: 'Người duyệt Cục',
  departmentApprovalContent: 'Nội dung phê duyệt Cục', rejectionReason: 'Lý do từ chối',
  'Trạng thái': 'Trạng thái', 'Tọa độ GIS': 'Tọa độ GPS', 'Loại đối tượng GIS': 'Loại đối tượng',
  'Tài liệu đính kèm': 'File đính kèm', 'File đính kèm': 'File đính kèm', attachments: 'File đính kèm',
};

function historyFieldName(fn: string): string { return historyFieldLabels[fn] || fn; }

function historyFieldValue(fn: string, val: string | null, orgMap?: Map<string, string>, symbolMap?: Map<string, string>, portMap?: Map<string, string>, pierMap?: Map<string, string>): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  if (fn === 'orgUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'portId' && portMap) return portMap.get(val) || val;
  if (fn === 'pierId' && pierMap) return pierMap.get(val) || val;
  if (fn === 'approvalStatus') { const m: Record<string,string> = { NHAP:'Lưu tạm', DRAFT:'Lưu tạm', CHO_PHE_DUYET:'Chờ phê duyệt cấp Cảng vụ/Chi cục', CHO_PD_CAP_CUC:'Chờ phê duyệt cấp cục', PENDING_APPROVAL:'Chờ phê duyệt cấp Cảng vụ/Chi cục', APPROVED_LEVEL1:'Chờ phê duyệt cấp Cảng vụ/Chi cục', APPROVED_LEVEL2:'Chờ phê duyệt cấp cục', DA_PHE_DUYET:'Đã phê duyệt', APPROVED:'Đã phê duyệt', TU_CHOI:'Từ chối cấp Cảng vụ/Chi cục', REJECTED:'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL1:'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL2:'Từ chối cấp cục' }; return m[val.toUpperCase()] || val; }
  if (fn === 'operationalStatus') { const m: Record<string,string> = { OPERATIONAL:'Đang khai thác/vận hành', NOT_YET_OPERATIONAL:'Chưa khai thác/vận hành', SUSPENDED:'Dừng khai thác/vận hành', DANG_KHAI_THAC:'Đang khai thác/vận hành', CHUA_KHAI_THAC:'Chưa khai thác/vận hành', DUNG_KHAI_THAC:'Dừng khai thác/vận hành' }; return m[val.toUpperCase()] || val; }
  if (fn === 'provinceId') { const m: Record<number,string> = { 1:'Hà Nội', 2:'Hà Giang', 3:'Cao Bằng', 4:'Bắc Kạn', 5:'Lào Cai', 6:'Tuyên Quang', 7:'Lạng Sơn', 8:'Quảng Ninh', 9:'Thái Nguyên', 10:'Yên Bái', 11:'Hà Nam', 12:'Hòa Bình', 13:'Nam Định', 14:'Ninh Bình', 15:'Thanh Hóa', 16:'Nghệ An', 17:'Hà Tĩnh', 18:'Quảng Bình', 19:'Quảng Trị', 20:'Thừa Thiên Huế', 21:'Đà Nẵng', 22:'Quảng Nam', 23:'Quảng Ngãi', 24:'Bình Định', 25:'Phú Yên', 26:'Khánh Hòa', 27:'Ninh Thuận', 28:'Bình Thuận', 29:'Kon Tum', 30:'Gia Lai', 31:'Đắk Lắk', 32:'Đắk Nông', 33:'Lâm Đồng', 34:'TP. Hồ Chí Minh', 35:'Bà Rịa - Vũng Tàu', 36:'Long An', 37:'Tiền Giang', 38:'An Giang', 39:'Bến Tre', 40:'Đồng Tháp', 41:'Vĩnh Long', 42:'Trà Vinh', 43:'Hậu Giang', 44:'Sóc Trăng', 45:'Kiên Giang', 46:'Cần Thơ', 47:'Bạc Liêu', 48:'Cà Mau', 49:'Điện Biên', 50:'Lai Châu', 51:'Sơn La', 52:'Yên Bái', 53:'Hòa Bình', 54:'Thái Bình', 55:'Hải Dương', 56:'Hải Phòng', 57:' Hưng Yên' }; return m[Number(val)-1] || val; }
  if (fn.endsWith('At')) { try { return dayjs(val).format('DD/MM/YYYY HH:mm'); } catch { return val; } }
  return val;
}

// ── Component ────────────────────────────────────────────────────────

export default function ShipRepairYardList() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterPierId, setFilterPierId] = useState<string | undefined>();
  const [filterProvince, setFilterProvince] = useState('');
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  // ── Pagination ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── Data ─────────────────────────────────────────────────────────
  const [dataSource, setDataSource] = useState<ShipRepairYard[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [, setError] = useState<Error | null>(null);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

  // ── Organizations + Users for lookup ────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      map.set(o.id, o.name);
    });
    return map;
  }, [organizations]);

  // ── Port options ─────────────────────────────────────────────────
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const portMap = useMemo(() => {
    const map = new Map<string, string>();
    portOptions.forEach((o) => {
      map.set(o.value, o.label);
    });
    return map;
  }, [portOptions]);

  // ── Pier options (Thuộc cầu cảng) ──
  const [pierOptions, setPierOptions] = useState<Array<{ value: string; label: string }>>([]);
  const pierMap = useMemo(() => {
    const map = new Map<string, string>();
    pierOptions.forEach((o) => { map.set(o.value, o.label); });
    return map;
  }, [pierOptions]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Drawer state ────────────────────────────────────────────────
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editShipRepairYardId, setEditShipRepairYardId] = useState<string | undefined>();
  const [editShipRepairYardName, setEditShipRepairYardName] = useState('');
  const [editBaseStatus, setEditBaseStatus] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const shipRepairYardFormRef = useRef<any>(null);
  // ── Submit loading — nút được bấm mới hiện loading tròn (tham chiếu màn Cảng biển) ──
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('submit');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('submit');
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ShipRepairYard | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<ShipRepairYard | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<ShipRepairYard | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Submit/Approve modal ────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<ShipRepairYard | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<ShipRepairYard | null>(null);

  // ── History modal ───────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<ShipRepairYard | null>(null);
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

  const openHistory = useCallback(async (r: ShipRepairYard) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistorySearchInput(''); setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryMode('current');
    try {
      const res = await api.get(`/v1/ship-repair-yard/${r.id}/history`);
      const d = res.data?.data;
      const ch = Array.isArray(d?.changeHistory) ? d.changeHistory : [];
      setHistoryRecords(ch);
    } catch { toast.error('Không thể tải lịch sử'); }
    finally { setHistoryLoading(false); }
  }, []);

  const HISTORY_FIELD_ORDER = ['orgUnitId', 'portId', 'pierId', 'shipRepairYardCode', 'shipRepairYardName', 'provinceId', 'detailedLocation', 'operationalStatus', 'usageFunction', 'workshopArea', 'vesselType', 'vesselDwt', 'businessType', 'activity', 'slipwayCount', 'remarks', 'mapSymbolId'];

  const renderShipRepairYardHistoryTimeline = (records: any[]) => {
    const q = historySearch.toLowerCase().trim();
    const from = historyFrom ? historyFrom.trim() : '';
    const to = historyTo ? historyTo.trim() : '';

    const filtered = (records || []).filter((r: any) => {
      if (q) {
        const fn = (r.fieldName || r.changedField || '').toLowerCase();
        const rawOld = (r.oldValue ?? r.previousValue ?? '').toLowerCase();
        const rawNew = (r.newValue || '').toLowerCase();
        const label = historyFieldName(r.fieldName || r.changedField || '').toLowerCase();
        const resolvedOld = historyFieldValue(r.fieldName || r.changedField || '', r.oldValue ?? r.previousValue ?? null, orgMap, symbolMap, portMap, pierMap).toLowerCase();
        const resolvedNew = historyFieldValue(r.fieldName || r.changedField || '', r.newValue, orgMap, symbolMap, portMap, pierMap).toLowerCase();
        if (!fn.includes(q) && !rawOld.includes(q) && !rawNew.includes(q) && !label.includes(q) && !resolvedOld.includes(q) && !resolvedNew.includes(q)) return false;
      }
      if (historyEntityFilter && r.entityId !== historyEntityFilter) return false;
      if (from || to) {
        const ts = String(r?.changedAt ?? r?.createdAt ?? r?.approvedDate ?? '');
        if (from && ts.substring(0, 10) < from) return false;
        if (to && ts.substring(0, 10) > to) return false;
      }
      return true;
    });

    return renderStandardHistoryCards({
      records: filtered,
      fieldLabels: historyFieldLabels,
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
        const formatted = historyFieldValue(fn, raw, orgMap, symbolMap, portMap, pierMap);
        return isBlankOrDash(formatted) ? '' : formatted;
      },
      resolveUnitName: (rec) => {
        const orgId = rec.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        return (orgName ? (orgName.split(' - ').pop() || orgName) : (rec.orgUnitName || rec.unitName)) || '';
      },
      emptyMessage: q || from || to ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận',
    });
  };

  // ── Load organizations ──────────────────────────────────────────
  useEffect(() => {
    const isIframe = window.self !== window.top;
    const parentOrgUnits = isIframe ? (window.parent as any)?.kchtOrgUnits : undefined;
    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrganizations(parentOrgUnits);
      if (!defaultOrgApplied.current) {
        defaultOrgApplied.current = true;
        const resolvedDefault = resolveDefaultOrgUnitId(authUser, parentOrgUnits);
        defaultOrgUnitId.current = resolvedDefault;
        setManagingUnitId(resolvedDefault);
      }
      setOrgUnitReady(true);
    } else {
      (async () => {
        try {
          const resp = await organizationService.list({ pageSize: 1000 });
          const data = resp.data || [];
          setOrganizations(data);
          if (!defaultOrgApplied.current) {
            defaultOrgApplied.current = true;
            const resolvedDefault = resolveDefaultOrgUnitId(authUser, data);
            defaultOrgUnitId.current = resolvedDefault;
            setManagingUnitId(resolvedDefault);
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
        users.forEach((u: any) => {
          const name = u.fullName || u.username || '';
          if (name && !isUuidString(name)) map.set(u.id, name);
        });
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

  // ── Load pier options (Thuộc cầu cảng) ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const params: any = { page: 1, pageSize: 1000 };
        if (filterPortId) params.portId = filterPortId;
        const res = await pierCRUD.search(params);
        setPierOptions((res.data || []).map((p: any) => ({ value: p.id, label: p.pierName })));
      } catch { /* ignore */ }
    })();
  }, [filterPortId]);

  // ── Fetch tab counts ────────────────────────────────────────────
  const fetchCounts = useCallback(async (orgId: string | undefined) => {
    try {
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map((tab) =>
          tab.key === 'all'
            ? shipRepairYardCRUD.search({ orgUnitId: (orgId && orgId !== '__all__') ? orgId : undefined, page: 1, pageSize: 1 })
            : shipRepairYardCRUD.search({ approvalStatus: TAB_QUERY_MAP[tab.key], orgUnitId: (orgId && orgId !== '__all__') ? orgId : undefined, page: 1, pageSize: 1 }),
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
      const res = await shipRepairYardCRUD.search({
        orgUnitId: (managingUnitId && managingUnitId !== '__all__') ? managingUnitId : undefined,
        shipRepairYardName: filterName.trim() || undefined,
        shipRepairYardCode: filterCode.trim() || undefined,
        portId: filterPortId,
        pierId: filterPierId,
        provinceId: filterProvince ? (VIETNAM_PROVINCES.indexOf(filterProvince) + 1) : undefined,
        operationalStatus: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page,
        pageSize,
      });
      setDataSource(res.data); setTotal(res.total);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách cơ sở sửa chữa, đóng tàu'));
    } finally { setIsLoading(false); }
  }, [managingUnitId, filterName, filterCode, filterPortId, filterPierId,
    filterProvince, filterOperationalStatus,
    filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize]);

  useEffect(() => { if (orgUnitReady) void fetchData(); }, [fetchData, orgUnitReady]);
  useEffect(() => { if (orgUnitReady) void fetchCounts(managingUnitId); }, [managingUnitId, fetchCounts, orgUnitReady]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    setManagingUnitId(defaultOrg === '__all__' ? undefined : defaultOrg);
    setFilterName(''); setFilterCode(''); setFilterPortId(undefined);
    setFilterPierId(undefined);
    setFilterProvince('');
    setFilterOperationalStatus(undefined);
    setFilterUpdatedFrom(undefined); setFilterUpdatedTo(undefined);
    setActiveTab('all'); setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key); setPage(1);
  }, []);

  // ── Detail drawer ────────────────────────────────────────────────
  const openDetailDrawer = useCallback(async (record: ShipRepairYard) => {
    setDetailDrawerVisible(true); setDetailRecord(record); setDetailFiles([]); setDetailLoading(true);
    try {
      const res = await api.get(`/v1/ship-repair-yard/${record.id}/attachments`, { params: { page: 0, size: 50 } });
      setDetailFiles(res.data?.data || []);
    } catch { setDetailFiles([]); }
    try {
      const fresh = await shipRepairYardCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch { /* keep initial data */ }
    finally { setDetailLoading(false); }
  }, []);

  // ── Delete confirmation ─────────────────────────────────────────
  const openDeleteModal = useCallback((record: ShipRepairYard) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await shipRepairYardCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa cơ sở sửa chữa, đóng tàu');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData();
      void fetchCounts(managingUnitId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts, managingUnitId]);

  // ── Approval handlers ───────────────────────────────────────────
  const handleApprove = useCallback(async (record: ShipRepairYard, content?: string) => {
    try {
      const cap = (record.approvalStatus === 'APPROVED_LEVEL1' || record.approvalStatus === 'APPROVED_LEVEL2') ? 'CUC' : 'CANG_VU';
      await shipRepairYardCRUD.approve(record.id, cap, content || 'Đã phê duyệt');
      toast.success('Đã phê duyệt cơ sở sửa chữa, đóng tàu');
      setApproveModalOpen(false); setApprovingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
  }, [fetchData, fetchCounts, managingUnitId]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await shipRepairYardCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' });
      toast.success('Đã gửi phê duyệt cơ sở sửa chữa, đóng tàu');
      setSubmitModalOpen(false); setSubmittingRecord(null);
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại'); }
  }, [submittingRecord, fetchData, fetchCounts, managingUnitId]);

  const openRejectModal = useCallback((record: ShipRepairYard) => {
    setRejectingRecord(record); setRejectReason(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { toast.error('Lý do từ chối tối đa 500 ký tự'); return; }
    try {
      const cap = (rejectingRecord.approvalStatus === 'APPROVED_LEVEL1' || rejectingRecord.approvalStatus === 'APPROVED_LEVEL2') ? 'CUC' : 'CANG_VU';
      await shipRepairYardCRUD.reject(rejectingRecord.id, cap, reason);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false); setRejectingRecord(null); setRejectReason('');
      setSortField('updatedAt');
      setSortOrder('descend');
      setPage(1);
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Từ chối thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, managingUnitId]);

  // ── Header actions ──────────────────────────────────────────────
  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('shiprepairyard:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary',
        icon: icons.create,
        onClick: () => {
          setEditShipRepairYardId(undefined);
          setEditShipRepairYardName('');
          setEditBaseStatus(undefined);
          createForm.resetFields();
          setCreateDrawerVisible(true);
        },
      });
    }
    return actions;
  }, [hasPerm, createForm]);

  // ── Filter panel content ────────────────────────────────────────
  const filterContent = (
    <>
      <style>{`.ship-repair-yard-filter .ant-select-selector { border-radius: 999px !important; } .ship-repair-yard-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; } .ship-repair-yard-filter .ant-select-content-item { max-width: 45% !important; } .ship-repair-yard-filter .ant-select-selection-item { border-radius: 999px !important; }`}</style>
      {/* ── Cơ bản: ĐVQL + Tên + Tình trạng ──────────────────── */}
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Đơn vị quản lý
        </div>
        <FilterOrgUnitTreeSelect
          organizations={organizations}
          placeholder="Tất cả"
          allowClear
          value={managingUnitId}
          onChange={(v) => { setManagingUnitId(v); setPage(1); }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên cơ sở sửa chữa, đóng tàu</div>
        <Input
          placeholder="Tìm theo tên cơ sở sửa chữa, đóng tàu"
          allowClear
          value={filterName}
          onChange={(e) => { setFilterName(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select
          placeholder="Chọn tình trạng"
          allowClear
          value={filterOperationalStatus}
          onChange={(v) => { setFilterOperationalStatus(v); setPage(1); }}
          options={[
            { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
            { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
            { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
          ]}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>

      {/* ── Bộ lọc nâng cao: hiển thị trực tiếp theo chuẩn AGENTS.md ───────── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã cơ sở sửa chữa, đóng tàu</div>
        <Input
          placeholder="Tìm theo mã cơ sở sửa chữa, đóng tàu"
          allowClear
          value={filterCode}
          onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
          onPressEnter={handleFilterApply}
          style={{ borderRadius: radiusPill, height: 40 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
        <Select
          placeholder="Chọn cảng biển"
          allowClear
          showSearch
          optionFilterProp="label"
          value={filterPortId}
          onChange={(v) => { setFilterPortId(v); setFilterPierId(undefined); setPage(1); }}
          options={portOptions}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cầu cảng</div>
        <Select
          placeholder="Chọn cầu cảng"
          allowClear
          showSearch
          optionFilterProp="label"
          value={filterPierId}
          onChange={(v) => { setFilterPierId(v); setPage(1); }}
          options={pierOptions}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành phố)</div>
        <Select
          placeholder="Chọn tỉnh/thành phố"
          allowClear
          showSearch
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          value={filterProvince || undefined}
          onChange={(v) => { setFilterProvince(v || ''); setPage(1); }}
          options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
        <DatePicker.RangePicker format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']} allowClear popupClassName="range-single-panel"
          value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
          onChange={(dates) => { setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined); setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined); setPage(1); }}
          style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
      </div>
    </>
  );

  // ── Status tabs config ──────────────────────────────────────────
  const statusTabs = TAB_STATUS_LIST.map((tab) => ({
    key: tab.key, label: tab.label, count: tabCounts[tab.key] ?? 0,
    color: tab.color, active: activeTab === tab.key,
  }));

  // ── rowActions callback (Port pattern) ──────────────────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Lịch sử → Phê duyệt/Từ chối → Xóa
  const rowActions = useCallback(
    (record: ShipRepairYard) => {
      const actions: any[] = [
        { key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) },
      ];
      const st = record.approvalStatus || '';
      // Chỉnh sửa chỉ áp dụng cho Lưu tạm (DRAFT) và Đã phê duyệt (APPROVED) — chuẩn VTS CHK
      if (canEditApprovalRecord(st, { hasPerm, resource: 'shiprepairyard', extraApprovePerms: ['shiprepairyard:approve'] })) {
        actions.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: icons.edit,
          onClick: () => {
            setEditShipRepairYardId(record.id);
            setEditShipRepairYardName(record.shipRepairYardName || '');
            setEditBaseStatus(record.approvalStatus);
            setCreateDrawerVisible(true);
          },
        });
      }
      if (['DRAFT','NHAP'].includes(st) && hasPerm('shiprepairyard:update')) {
        actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => { setSubmittingRecord(record); setSubmitModalOpen(true); } });
      }
      if (['REJECTED_LEVEL1','REJECTED_LEVEL2','REJECTED','TU_CHOI'].includes(st) && hasPerm('shiprepairyard:update')) {
        actions.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => { setSubmittingRecord(record); setSubmitModalOpen(true); } });
      }
      // Lịch sử — luôn hiển thị khi có quyền
      if (hasPerm('shiprepairyard:history')) {
        actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
      }
      // Phê duyệt / Từ chối — theo trạng thái 2 cấp
      if (['PENDING_APPROVAL','PENDING','CHO_PHE_DUYET','PROPOSED'].includes(st) && (hasPerm('shiprepairyard:approvec1') || hasPerm('shiprepairyard:approve'))) {
        actions.push({ key: 'approve_c1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
        actions.push({ key: 'reject_c1', label: 'Từ chối cấp Cảng vụ/Chi cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
      }
      if (['APPROVED_LEVEL1','APPROVED_LEVEL2'].includes(st) && (hasPerm('shiprepairyard:approvec2') || hasPerm('shiprepairyard:approve'))) {
        actions.push({ key: 'approve_c2', label: 'Phê duyệt cấp Cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
        actions.push({ key: 'reject_c2', label: 'Từ chối cấp Cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
      }
      // Xóa: chỉ trạng thái DRAFT/NHAP — luôn ở cuối cùng
      if (hasPerm('shiprepairyard:delete') && ['DRAFT','NHAP'].includes(st)) {
        actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
      }
      return actions;
    },
    [hasPerm, openDetailDrawer, openHistory, openDeleteModal, openRejectModal],
  );

  // ── Table columns (đối chiếu đúng cột CSV) ─────────────────────
  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'orgUnitId') return resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(r.orgUnitId || '') || '';
    if (field === 'shipRepairYardName') return r.shipRepairYardName ?? '';
    if (field === 'portId') return portOptions.find(o => o.value === r.portId)?.label ?? r.portId ?? '';
    if (field === 'pierId') return pierOptions.find(o => o.value === r.pierId)?.label ?? r.pierName ?? r.pierId ?? '';
    if (field === 'provinceId') return r.provinceId ? VIETNAM_PROVINCES[r.provinceId - 1] ?? '' : '';
    if (field === 'operationalStatus') {
      const m: Record<string, string> = {
        OPERATIONAL: 'Đang khai thác/vận hành',
        NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
        SUSPENDED: 'Dừng khai thác/vận hành',
      };
      return m[r.operationalStatus] || r.operationalStatus || '';
    }
    if (field === 'approvalStatus') return APPROVAL_STYLE_MAP[r.approvalStatus]?.label || r.approvalStatus || '';
    if (field === 'updatedAt' || field === 'updatedBy' || field === 'updatedByName') {
      const t = r.updatedAt || r.createdAt;
      return t ? new Date(t).getTime() : 0;
    }
    if (field === 'submittedForApprovalAt') return r.submittedForApprovalAt ? new Date(r.submittedForApprovalAt).getTime() : 0;
    if (field === 'portAuthorityApprovedAt') return r.portAuthorityApprovedAt ? new Date(r.portAuthorityApprovedAt).getTime() : 0;
    if (field === 'departmentApprovedAt') return r.departmentApprovedAt ? new Date(r.departmentApprovedAt).getTime() : 0;
    return r[field] ?? '';
  }, [organizations, orgMap, portOptions, pierOptions]);

  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        align: 'center' as const,
        render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + i + 1}</span>,
      },
      {
        key: 'shipRepairYardName',
        label: <span>Tên/Mã cơ sở sửa chữa, đóng tàu</span>,
        dataIndex: 'shipRepairYardName',
        width: 400,
        minWidth: 350,
        fixed: 'left' as const,
        sortable: true,
        ellipsis: false,
        render: (v: string, record: ShipRepairYard) => (
          <div>
            <a
              title={v}
              onClick={() => openDetailDrawer(record)}
              style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {v}
            </a>
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.shipRepairYardCode || ''}
            </span>
          </div>
        ),
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 260,
        sortable: true,
        render: (_v: string | null, record: ShipRepairYard) => (
          <span style={{ fontWeight: fontWeightBold }}>
            {resolveOrgLevel2Name(organizations, record.orgUnitId) || orgMap.get(record.orgUnitId || '') || ''}
          </span>
        ),
      },
      {
        key: 'portId',
        label: 'Thuộc cảng biển',
        dataIndex: 'portId',
        width: 200,
        sortable: true,
        render: (v: string | null) => portOptions.find(o => o.value === v)?.label || v || '',
      },
      {
        key: 'pierId',
        label: 'Thuộc cầu cảng',
        dataIndex: 'pierId',
        width: 200,
        sortable: true,
        render: (v: string | null, record: ShipRepairYard) => pierOptions.find(o => o.value === v)?.label || record.pierName || v || '',
      },
      {
        key: 'provinceId',
        label: 'Địa điểm (Tỉnh/Thành phố)',
        dataIndex: 'provinceId',
        width: 250,
        sortable: true,
        render: (v: number | null) => (v ? VIETNAM_PROVINCES[v - 1] : ''),
      },
      {
        key: 'operationalStatus',
        label: 'Tình trạng',
        dataIndex: 'operationalStatus',
        width: 210,
        sortable: true,
        render: (v: string | null) => {
          if (!v) return '';
          const m: Record<string, { color: string; label: string }> = {
            OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
            NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
            SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
          };
          const s = m[v] || { color: textTertiary, label: v };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        },
      },
    ];

    // Audit columns
    const auditColumns: any[] = [
      { key: 'updatedAt', label: <span>Cán bộ cập nhật</span>, dataIndex: 'updatedAt', width: 200, sortable: true,
        render: (v: string | null, record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record.updatedBy, (record as any).updatedByName, userMap, record.createdBy, (record as any).createdByName);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = formatDate(v);
          const cleanDate = (date === '—' || date === '-') ? '' : date;
          if (!name && !cleanDate) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && cleanDate && <br />}
              {cleanDate && <span style={{ opacity: 0.85 }}>{cleanDate}</span>}
            </div>
          );
        } },
      { key: 'submittedForApprovalAt', label: <span>Cán bộ gửi Phê duyệt</span>, dataIndex: 'submittedForApprovalAt', width: 210, sortable: true,
        render: (v: string | null, record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record.submittedForApprovalBy, (record as any).submittedForApprovalByName, userMap);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = formatDate(v);
          const cleanDate = (date === '—' || date === '-') ? '' : date;
          if (!name && !cleanDate) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && cleanDate && <br />}
              {cleanDate && <span style={{ opacity: 0.85 }}>{cleanDate}</span>}
            </div>
          );
        } },
      { key: 'portAuthorityApprovedAt', label: <span>Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>, dataIndex: 'portAuthorityApprovedAt', width: 340, sortable: true,
        render: (v: string | null, record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record.portAuthorityApprovedBy, (record as any).portAuthorityApprovedByName, userMap);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = formatDate(v);
          const cleanDate = (date === '—' || date === '-') ? '' : date;
          if (!name && !cleanDate) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && cleanDate && <br />}
              {cleanDate && <span style={{ opacity: 0.85 }}>{cleanDate}</span>}
            </div>
          );
        } },
      { key: 'departmentApprovedAt', label: <span>Cán bộ phê duyệt cấp Cục</span>, dataIndex: 'departmentApprovedAt', width: 240, sortable: true,
        render: (v: string | null, record: ShipRepairYard) => {
          const rawName = formatUserDisplayName(record.departmentApprovedBy, (record as any).departmentApprovedByName, userMap);
          const name = (rawName === '—' || rawName === '-') ? '' : rawName;
          const date = formatDate(v);
          const cleanDate = (date === '—' || date === '-') ? '' : date;
          if (!name && !cleanDate) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && cleanDate && <br />}
              {cleanDate && <span style={{ opacity: 0.85 }}>{cleanDate}</span>}
            </div>
          );
        } },
    ];

    const tailColumns: any[] = [
      { key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 260, sortable: true,
        render: (v: string) => {
          if (!v) return '';
          const s = APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v?.toUpperCase()] || { color: textTertiary, label: v };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        } },
    ];

    const allColumns = [...baseColumns, ...tailColumns, ...auditColumns];
    return allColumns.map(col => ({
      ...col,
      sortOrder: col.sortable ? ((col.key === sortField || col.dataIndex === sortField) ? sortOrder : null) : undefined,
    }));
  }, [
    openDetailDrawer,
    organizations,
    orgMap,
    userMap,
    page,
    pageSize,
    portOptions,
    pierOptions,
    sortField,
    sortOrder,
  ]);

  // ── Detail drawer content ────────────────────────────────────────
  const ddToDms = (dd: number): { d: number; m: number; s: number } => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const abs = Math.abs(dd);
    const d = Math.floor(abs);
    const m = Math.floor((abs - d) * 60);
    const s = parseFloat(((abs - d - m / 60) * 3600).toFixed(2));
    return { d, m, s };
  };

  const renderDetailContent = () => {
    if (!detailRecord) return null;
    if (detailLoading) return <LoadingSkeleton rows={6} />;
    return (
      <ShipRepairYardDetailContent
        selectedRecord={detailRecord}
        orgMap={orgMap}
        organizations={organizations}
        symbolMap={symbolMap}
        symbolImageMap={symbolImageMap}
        portOptions={portOptions}
        pierOptions={pierOptions}
        userMap={userMap}
        detailFiles={detailFiles}
        ddToDms={ddToDms}
        approvalStyleMap={APPROVAL_STYLE_MAP}
        operationPlanList={(detailRecord as any)?.operationPlanList}
        maintenancePlanList={(detailRecord as any)?.maintenancePlanList}
        incidentList={(detailRecord as any)?.incidentList}
      />
    );
  };

  // ── JSX ─────────────────────────────────────────────────────────

  return (
    <ThemeTokenProvider tokens={themeTokenChk as unknown as ThemeToken}>
    <div className="ship-repair-yard-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{`
        .range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }

        .ship-repair-yard-page-wrapper,
        .ship-repair-yard-page-wrapper .ant-table,
        .ship-repair-yard-page-wrapper .ant-table-cell,
        .ship-repair-yard-page-wrapper .ant-table-thead > tr > th,
        .ship-repair-yard-page-wrapper .ant-tabs-tab,
        .ship-repair-yard-page-wrapper .ant-btn,
        .ship-repair-yard-page-wrapper .ant-input,
        .ship-repair-yard-page-wrapper .ant-select,
        .ship-repair-yard-page-wrapper .ant-select-selection-item,
        .ship-repair-yard-page-wrapper .ant-select-item,
        .ship-repair-yard-page-wrapper .ant-pagination,
        .ship-repair-yard-drawer-scope,
        .ship-repair-yard-drawer-scope .ant-drawer-title,
        .ship-repair-yard-drawer-scope .ant-tabs-tab,
        .ship-repair-yard-drawer-scope .ant-btn,
        .ship-repair-yard-drawer-scope .ant-input,
        .ship-repair-yard-drawer-scope .ant-select,
        .ship-repair-yard-drawer-scope .ant-table,
        .ship-repair-yard-drawer-scope .ant-form-item-label > label,
        .ship-repair-yard-modal-scope,
        .ship-repair-yard-modal-scope .ant-modal-title,
        .ship-repair-yard-modal-scope .ant-btn,
        .ship-repair-yard-modal-scope .ant-input,
        .ship-repair-yard-modal-scope .ant-form-item-label > label {
          font-size: 13.5px !important;
        }

        .ship-repair-yard-page-wrapper div:has(> button[aria-pressed]) {
          justify-content: center !important;
          overflow-x: auto !important;
          max-width: 100% !important;
          padding-bottom: 2px !important;
          scroll-behavior: smooth !important;
        }
        .ship-repair-yard-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
          height: 4px;
        }
        .ship-repair-yard-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý cơ sở sửa chữa, đóng tàu' }]}
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
        hideFilterToggle={true}
        loading={isLoading}
        error={isError}
        onRetry={() => void fetchData()}
      >
        <DataTable columns={columns}
          dataSource={[...dataSource].sort((a: any, b: any) => { if (!sortField) return 0; const aVal = getSortValue(a, sortField); const bVal = getSortValue(b, sortField); const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi'); return sortOrder === 'ascend' ? cmp : -cmp; })}
          rowKey="id" rowActions={rowActions} loading={false}
          onSort={(key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); setPage(1); }}
            scroll={{ x: 'max-content' }}
        />
        <Pagination total={total} current={page} pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </FilterTableLayout>

      {/* ── Create / Edit Drawer (Hợp nhất 1 Drawer chuẩn Cầu cảng / VTS CHK) ── */}
      <AppDrawer
        width="min(920px, 96vw)"
        rootClassName="ship-repair-yard-drawer-scope"
        className="ship-repair-yard-drawer-scope"
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editShipRepairYardId ? `Chỉnh sửa thông tin — ${editShipRepairYardName || 'Cơ sở sửa chữa, đóng tàu'}` : 'Thêm mới Cơ sở sửa chữa, đóng tàu'}</span>}
        open={createDrawerVisible}
        destroyOnHidden
        onClose={() => {
          setCreateDrawerVisible(false);
          createForm.resetFields();
        }}
        footer={
          <div style={drawerFooterStyle}>
            {(() => {
              const st = !editShipRepairYardId ? 'DRAFT' : (editBaseStatus ? String(editBaseStatus).toUpperCase() : 'DRAFT');
              if (st === 'APPROVED') {
                return (
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); shipRepairYardFormRef.current?.submit('APPROVED'); }}
                    loading={submitting && actionType === 'approve'}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                );
              }
              if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2' || st === 'REJECTED' || st === 'TU_CHOI') {
                return (
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); shipRepairYardFormRef.current?.submit('SUBMIT'); }}
                    loading={submitting && actionType === 'submit'}
                    style={primaryButtonStyle}
                  >
                    Lưu và gửi phê duyệt
                  </Button>
                );
              }
              return (
                <>
                  <Button
                    htmlType="button"
                    onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); shipRepairYardFormRef.current?.submit('DRAFT'); }}
                    loading={submitting && actionType === 'draft'}
                    style={outlineButtonStyle}
                  >
                    Lưu tạm
                  </Button>
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); shipRepairYardFormRef.current?.submit('SUBMIT'); }}
                    loading={submitting && actionType === 'submit'}
                    style={primaryButtonStyle}
                  >
                    Lưu và gửi phê duyệt
                  </Button>
                  <Button
                    htmlType="button"
                    type="primary"
                    onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); shipRepairYardFormRef.current?.submit('APPROVED'); }}
                    loading={submitting && actionType === 'approve'}
                    style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                  >
                    Lưu và phê duyệt
                  </Button>
                </>
              );
            })()}
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        afterOpenChange={(open) => {
          if (!open) {
            setEditShipRepairYardId(undefined);
            setEditShipRepairYardName('');
            setEditBaseStatus(undefined);
            createForm.resetFields();
          }
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" initialValues={{}}>
          <ShipRepairYardForm
            ref={shipRepairYardFormRef}
            form={createForm}
            id={editShipRepairYardId}
            onFinish={() => {
              setCreateDrawerVisible(false);
              setSortField('updatedAt');
              setSortOrder('descend');
              setPage(1);
              void fetchData();
              void fetchCounts(managingUnitId);
            }}
            onSubmittingChange={setSubmitting}
          />
        </Form>
      </AppDrawer>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <AppDrawer
        width="min(1000px, 96vw)"
        rootClassName="ship-repair-yard-drawer-scope"
        className="ship-repair-yard-drawer-scope"
        title={<span style={drawerTitleStyle}>Chi tiết cơ sở sửa chữa, đóng tàu{detailRecord ? ` - ${detailRecord.shipRepairYardName}` : ''}</span>}
        open={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setDetailRecord(null); }}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px', overflow: 'hidden' },
        }}
        footer={null}
      >
        {renderDetailContent()}
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
        itemType="cơ sở sửa chữa, đóng tàu"
        itemName={deletingRecord?.shipRepairYardName}
        itemCode={deletingRecord?.shipRepairYardCode}
      />

      {/* ── Reject Reason Modal ──────────────────────────────────── */}
      <Modal
        rootClassName="ship-repair-yard-modal-scope"
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
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cơ sở sửa chữa, đóng tàu:</p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.shipRepairYardName}</strong>
            </p>
          )}
          <Input.TextArea placeholder="Nhập lý do từ chối (tối thiểu 10, tối đa 500 ký tự)..." value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} rows={3} maxLength={500} showCount
            style={{ borderRadius: 8, fontSize: fontSizeMd }} />
        </div>
      </Modal>

      {/* ── Submit Modal ──────────────────────────────────────────── */}
      <Modal
        rootClassName="ship-repair-yard-modal-scope"
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
            Gửi <strong>{submittingRecord?.shipRepairYardCode} — {submittingRecord?.shipRepairYardName}</strong> để Cảng vụ phê duyệt?
          </p>
        </div>
      </Modal>

      {/* ── Approve Modal (chuẩn VTS CHK) ─────────────────────────── */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? 'c2' : 'c1'}
        onConfirm={(content) => { if (approvingRecord) handleApprove(approvingRecord, content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

      {/* ── History Drawer ──────────────────────────────────────── */}
      <AppDrawer
        width="min(880px, 96vw)"
        rootClassName="ship-repair-yard-drawer-scope"
        className="ship-repair-yard-drawer-scope"
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Cơ sở sửa chữa, đóng tàu' : (historyTarget ? `Lịch sử thay đổi — ${historyTarget.shipRepairYardName}` : 'Lịch sử thay đổi')}
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
          body: { padding: '12px 24px 12px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}>
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
        {!historyLoading && (
          <div style={{ display: 'none' }}>
            <Radio.Group value={historyMode} size="middle" style={{ display: 'flex', width: '100%', borderBottom: `1px solid ${borderDefault}` }}
              onChange={async e => { const mode = e.target.value; setHistoryMode(mode); setHistoryLoading(true); setHistoryRecords([]); if (mode === 'all') { try { const res = await api.get('/v1/ship-repair-yard/history/all'); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []); setHistoryEntityNames(d?.entityNames || {}); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } else { try { const res = await api.get(`/v1/ship-repair-yard/${historyTarget?.id}/history`); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } }}>
              <Radio.Button value="current" style={{ fontWeight: fontWeightBold, color: historyMode !== 'current' ? textSecondary : actionPrimary }}>Bản ghi hiện tại</Radio.Button>
              <Radio.Button value="all" style={{ fontWeight: fontWeightBold, color: historyMode !== 'all' ? textSecondary : actionPrimary }}>Tất cả bản ghi</Radio.Button>
            </Radio.Group>
          </div>
        )}
        {!historyLoading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input
              placeholder="Tìm kiếm nội dung thay đổi..."
              allowClear
              value={historySearchInput}
              onChange={(e) => {
                const val = e.target.value;
                setHistorySearchInput(val);
                if (!val) setHistorySearch('');
              }}
              onPressEnter={() => setHistorySearch(historySearchInput.trim())}
              style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
            />
            {historyMode === 'all' && <Select placeholder="Chọn cơ sở sửa chữa, đóng tàu" allowClear showSearch value={historyEntityFilter || undefined}
              onChange={v => setHistoryEntityFilter(v || '')}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
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
          <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} /><div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div></div>
        ) : renderShipRepairYardHistoryTimeline(historyRecords)}
        </div>
      </AppDrawer>
    </div>
    </ThemeTokenProvider>
  );
}