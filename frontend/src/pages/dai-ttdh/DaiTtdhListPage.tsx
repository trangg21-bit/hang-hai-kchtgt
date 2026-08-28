import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Input, Select, Alert, DatePicker,
  Drawer, Radio, Space, Form,
} from 'antd';
import {
  HistoryOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  daiTtdhCRUD,
} from '../../services/portService';
import type { DaiTtdh } from '../../types/port';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, DataTable, type ScreenHeaderAction } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import DaiTtdhForm from './DaiTtdhForm';
import DaiTtdhDetailContent from './DaiTtdhDetailContent';
import { DAI_TTDH_STATION_LEVEL_OPTIONS } from './DaiTtdhForm';
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
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  radiusPill,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceXl,
  spaceFormField,
  drawerProps, drawerTitleStyle, drawerCloseBtnStyle, drawerFooterStyle,
  primaryButtonStyle, outlineButtonStyle, requiredMarkStyle,
  historyBadgeStyle, historyGroupGridStyle, historyTimeStyle, historyMetaRowStyle,
  historyInfoCardStyle, historyAccentBarStyle, historyInfoTitleStyle,
  historyChangeRowStyle, historyCreateRowStyle, historyFieldLabelStyle,
  historyOldValueStyle, historyNewValueStyle, historyArrowStyle,
  icons, statusBadgeStyle,
  cellTitleStyle, cellSubtitleStyle,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalModal from '../../components/shared/ApprovalModal';

// ── Constants ────────────────────────────────────────────────────────

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
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
  { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: 'APPROVED_LEVEL2', label: 'Chờ phê duyệt cấp cục', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp cục', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined, DRAFT: 'DRAFT',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED_LEVEL2: 'APPROVED_LEVEL2',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
};

// ── Helper: format date ──────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

// ── History helpers ───────────────────────────────────────────────────

const historyFieldLabels: Record<string, string> = {
  securityLevel: 'Cấp bảo mật', daiTtdhCode: 'Mã đài', daiTtdhName: 'Tên đài',
  orgUnitId: 'Đơn vị quản lý', operatingUnitId: 'Đơn vị khai thác',
  stationLevel: 'Phân loại đài',
  provinceId: 'Tỉnh/Thành phố', detailedLocation: 'Địa điểm chi tiết', operationalStatus: 'Tình trạng hoạt động',
  coverageArea: 'Vùng phủ sóng', servicesProvided: 'Dịch vụ cung cấp', remarks: 'Ghi chú',
  mapSymbolId: 'Biểu tượng', approvalStatus: 'Trạng thái',
  submittedForApprovalAt: 'Ngày gửi phê duyệt', submittedForApprovalBy: 'Người gửi phê duyệt',
  portAuthorityApprovedAt: 'Ngày duyệt Cảng vụ', portAuthorityApprovedBy: 'Người duyệt Cảng vụ',
  portAuthorityApprovalContent: 'Nội dung phê duyệt Cảng vụ',
  departmentApprovedAt: 'Ngày duyệt Cục', departmentApprovedBy: 'Người duyệt Cục',
  departmentApprovalContent: 'Nội dung phê duyệt Cục', rejectionReason: 'Lý do từ chối',
  'Trạng thái': 'Hành động',
};

function historyFieldName(fn: string): string { return historyFieldLabels[fn] || fn; }

function historyFieldValue(fn: string, val: string | null, orgMap?: Map<string, string>, symbolMap?: Map<string, string>): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'operatingUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'stationLevel') { const m: Record<string,string> = { 0:'Loại I', 1:'Loại II', 2:'Loại III', 3:'Loại IV', 4:'Loại V' }; return m[val] || val; }
  if (fn === 'approvalStatus') { const m: Record<string,string> = { NHAP:'Lưu tạm', DRAFT:'Lưu tạm', CHO_PHE_DUYET:'Chờ phê duyệt cấp Cảng vụ/Chi cục', CHO_PD_CAP_CUC:'Chờ phê duyệt cấp cục', PENDING_APPROVAL:'Chờ phê duyệt cấp Cảng vụ/Chi cục', APPROVED_LEVEL1:'Chờ phê duyệt cấp Cảng vụ/Chi cục', APPROVED_LEVEL2:'Chờ phê duyệt cấp cục', DA_PHE_DUYET:'Đã phê duyệt', APPROVED:'Đã phê duyệt', TU_CHOI:'Từ chối cấp Cảng vụ/Chi cục', REJECTED:'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL1:'Từ chối cấp Cảng vụ/Chi cục', REJECTED_LEVEL2:'Từ chối cấp cục' }; return m[val.toUpperCase()] || val; }
  if (fn === 'operationalStatus') { const m: Record<string,string> = { OPERATIONAL:'Đang khai thác/vận hành', NOT_YET_OPERATIONAL:'Chưa khai thác/vận hành', SUSPENDED:'Dừng khai thác/vận hành' }; return m[val.toUpperCase()] || val; }
  if (fn === 'provinceId') { const m: Record<number,string> = { 1:'Hà Nội', 2:'Hà Giang', 3:'Cao Bằng', 4:'Bắc Kạn', 5:'Lào Cai', 6:'Tuyên Quang', 7:'Lạng Sơn', 8:'Quảng Ninh', 9:'Thái Nguyên', 10:'Yên Bái', 11:'Hà Nam', 12:'Hòa Bình', 13:'Nam Định', 14:'Ninh Bình', 15:'Thanh Hóa', 16:'Nghệ An', 17:'Hà Tĩnh', 18:'Quảng Bình', 19:'Quảng Trị', 20:'Thừa Thiên Huế', 21:'Đà Nẵng', 22:'Quảng Nam', 23:'Quảng Ngãi', 24:'Bình Định', 25:'Phú Yên', 26:'Khánh Hòa', 27:'Ninh Thuận', 28:'Bình Thuận', 29:'Kon Tum', 30:'Gia Lai', 31:'Đắk Lắk', 32:'Đắk Nông', 33:'Lâm Đồng', 34:'TP. Hồ Chí Minh', 35:'Bà Rịa - Vũng Tàu', 36:'Long An', 37:'Tiền Giang', 38:'An Giang', 39:'Bến Tre', 40:'Đồng Tháp', 41:'Vĩnh Long', 42:'Trà Vinh', 43:'Hậu Giang', 44:'Sóc Trăng', 45:'Kiên Giang', 46:'Cần Thơ', 47:'Bạc Liêu', 48:'Cà Mau', 49:'Điện Biên', 50:'Lai Châu', 51:'Sơn La', 52:'Yên Bái', 53:'Hòa Bình', 54:'Thái Bình', 55:'Hải Dương', 56:'Hải Phòng', 57:' Hưng Yên', 58:'Perth', 59:'Đắk Lắk', 60:'An Giang', 61:'Bà Rịa - Vũng Tàu', 62:'Bắc Giang', 63:'Bắc Kạn', 64:'Bắc Ninh', 65:'Bến Tre', 66:'Bình Định', 67:'Bình Dương', 68:'Bình Phước', 69:'Bình Thuận', 70:'Cà Mau', 71:'Cao Bằng', 72:'Đắk Lắk', 73:'Đắk Nông', 74:'Điện Biên', 75:'Đồng Nai', 76:'Đồng Tháp', 77:'Gia Lai', 78:'Hà Giang', 79:'Hà Nam', 80:'Hà Tĩnh', 81:'Hải Dương', 82:'Hậu Giang', 83:'Hòa Bình', 84:'Hưng Yên', 85:'Khánh Hòa', 86:'Kiên Giang', 87:'Kon Tum', 88:'Lai Châu', 89:'Lâm Đồng', 90:'Lạng Sơn', 91:'Lào Cai', 92:'Long An', 93:'Nam Định', 94:'Nghệ An', 95:'Ninh Bình', 96:'Ninh Thuận', 97:'Phú Thọ', 98:'Quảng Nam', 99:'Quảng Ngãi', 100:'Quảng Ninh', 101:'Quảng Trị', 102:'Sóc Trăng', 103:'Sơn La', 104:'Thanh Hóa', 105:'Thái Bình', 106:'Thái Nguyên', 107:'TP. Hồ Chí Minh', 108:'Tiền Giang', 109:'Tây Ninh', 110:'Tin Giang', 111:'Trà Vinh', 112:'Tuyên Quang', 113:'Vĩnh Long', 114:'Vĩnh Phúc', 115:'Yên Bái' }; return m[Number(val)-1] || val; }
  if (fn === 'openingAnnouncementDate' || fn.endsWith('At')) { try { return dayjs(val).format('DD/MM/YYYY HH:mm'); } catch { return val; } }
  return val;
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
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

function normalizedHistoryFields(value: string): string[] {
  const fields = value.split(/[,;]+/).map((field: string) => field.trim()).filter(Boolean);
  const hasApprovalStatus = fields.some((field) => {
    const key = normalizeHistoryKey(field);
    return key === 'approvalstatus' || key === 'trang thai phe duyet';
  });
  if (hasApprovalStatus) {
    return fields.filter((field) => {
      const key = normalizeHistoryKey(field);
      return key !== 'approvedlevel1' && key !== 'approvedlevel2' && key !== 'da phe duyet cap 1' && key !== 'da phe duyet cap 2';
    });
  }
  return fields;
}

function historyChangeRows(item: any): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  const fields = normalizedHistoryFields(String(item.changedField || item.fieldName || item.field || ''));
  const oldValue = item.previousValue ?? item.oldValue ?? null;
  const newValue = item.newValue ?? null;
  const oldAssignments = parseHistoryAssignments(oldValue);
  const newAssignments = parseHistoryAssignments(newValue);
  if (fields.length === 0) return [{ field: '', oldValue, newValue }];
  return fields.map((field, index) => {
    const displayField = historyFieldName(field);
    const oldAssigned = oldAssignments.get(normalizeHistoryKey(field)) ?? oldAssignments.get(normalizeHistoryKey(displayField));
    const newAssigned = newAssignments.get(normalizeHistoryKey(field)) ?? newAssignments.get(normalizeHistoryKey(displayField));
    const oldParts = oldValue?.split(';').map((part: string) => part.trim()).filter(Boolean) || [];
    const newParts = newValue?.split(';').map((part: string) => part.trim()).filter(Boolean) || [];
    return {
      field,
      oldValue: oldAssigned ?? (fields.length === 1 ? oldValue : oldParts[index] || null),
      newValue: newAssigned ?? (fields.length === 1 ? newValue : newParts[index] || null),
    };
  });
}

function renderHistoryValueTag(field: string, val: string | null) {
  if (val === null || val === undefined || val === '—') {
    return <span style={{ color: textTertiary }}>—</span>;
  }
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);
  if (normKey === 'approvalstatus' || normKey === 'trang thai phe duyet' || normKey.includes('phe duyet') || normKey.includes('trang thai')) {
    if (normVal === 'da duyet' || normVal === 'da phe duyet' || normVal === 'approved' || normVal === 'approved_level2') {
      return (<span style={statusBadgeStyle(statusOperational)}>{val}</span>);
    }
    if (normVal === 'tu choi' || normVal.includes('rejected') || normVal.includes('tra ve') || normVal.includes('tu choi')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
    if (normVal === 'cho cuc duyet' || normVal === 'approved_level1' || normVal.includes('cap 1') || normVal.includes('cuc duyet')) {
      return (<span style={statusBadgeStyle('#0082fb')}>{val}</span>);
    }
    if (normVal === 'cho cang vu duyet' || normVal === 'cho phe duyet' || normVal === 'cho duyet' || normVal === 'pending' || normVal === 'pending_approval' || normVal === 'proposed' || normVal.includes('cang vu')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    return (<span style={statusBadgeStyle(statusDraft)}>{val}</span>);
  }
  if (normKey === 'operationalstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    if (normVal.includes('hoat dong') || normVal.includes('operational')) {
      return (<span style={statusBadgeStyle(statusOperational)}>{val}</span>);
    }
    if (normVal.includes('chua khai thac') || normVal.includes('not yet') || normVal.includes('chua')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    if (normVal.includes('dung') || normVal.includes('suspended') || normVal.includes('ngung')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
  }
  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

/** Badge thao tác cho lịch sử (chuẩn VTS CHK): phân biệt Thêm mới / Cập nhật / Phê duyệt / Từ chối / Trình duyệt. */
function resolveHistoryActionMeta(group: any, changes: any[]): { label: string; color: string; bg: string } {
  const item = group.items?.[0] || {};
  const rawStatus = String(item.status ?? item.action ?? item.actionType ?? '').toUpperCase();
  const rawReason = String(item.reason ?? item.ghiChu ?? item.note ?? '').toLowerCase();
  const level = Number(item.approvalLevel || 0);
  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới')) {
    return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || String(item.changedField || '').includes('đính kèm')) {
    return { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c718' };
  }
  if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xóa tệp')) {
    return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c18' };
  }
  if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa')) {
    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
  }
  if (rawReason.includes('phê duyệt cấp cảng vụ')) return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  if (rawReason.includes('phê duyệt cấp cục')) return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  if (rawReason.includes('từ chối cấp cảng vụ')) return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
  if (rawReason.includes('từ chối cấp cục')) return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
  const approvalChange = changes.find((c: any) => {
    const k = normalizeHistoryKey(String(c.field || c.fieldName || ''));
    return k === 'approvalstatus' || k === 'trang thai phe duyet';
  });
  if (approvalChange) {
    const nv = normalizeHistoryKey(String(approvalChange.newValue || ''));
    if (nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu')) || nv.includes('tu choi cap cang vu')) return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    if (nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc')) || nv.includes('tu choi cap cuc')) return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    if (nv === 'cho cuc duyet' || nv.includes('approved_level1') || nv.includes('da phe duyet cap 1') || nv.includes('cuc duyet')) return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    if (nv === 'da duyet' || nv.includes('approved') || nv.includes('da phe duyet')) return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    if (nv.includes('tu choi') || nv.includes('rejected') || nv.includes('tra ve')) return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    if (nv.includes('cho cang vu duyet') || nv.includes('cho phe duyet') || nv.includes('pending') || nv.includes('proposed') || nv.includes('luu tam') || nv.includes('nhap')) return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
  }
  if (level === 1 || String(item.approvalLevel).includes('LEVEL_1') || rawStatus === 'UNDER_REVIEW') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('trả về')) return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (level === 2 || String(item.approvalLevel).includes('LEVEL_2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('trả về')) return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối')) return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
  if (rawStatus === 'SUBMITTED' || rawStatus === 'PENDING' || rawReason.includes('trình duyệt')) return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
  if (rawStatus === 'DELETED' || rawStatus === 'DELETE' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa')) return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
  return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
}

// ── Component ────────────────────────────────────────────────────────

export default function DaiTtdhList() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const userPermissions = useAuthStore((s: any) => s.user?.permissions) || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation');
  // ── Filter state ─────────────────────────────────────────────────
  const [managingUnitId, setManagingUnitId] = useState<string | undefined>();
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const defaultOrgApplied = useRef(false);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterStationLevel, setFilterStationLevel] = useState<number | undefined>();
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
  const [dataSource, setDataSource] = useState<DaiTtdh[]>([]);
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

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Drawer state ────────────────────────────────────────────────
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editDaiTtdhId, setEditDaiTtdhId] = useState<string | undefined>();
  const [editDaiTtdhName, setEditDaiTtdhName] = useState('');
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const daiTtdhFormRef = useRef<any>(null);
  const editDaiTtdhFormRef = useRef<any>(null);
  // ── Submit loading — nút được bấm mới hiện loading tròn (tham chiếu màn Cảng biển) ──
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve' | 'update'>('submit');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve' | 'update'>('submit');
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DaiTtdh | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DaiTtdh | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<DaiTtdh | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Submit/Approve modal ────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<DaiTtdh | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<DaiTtdh | null>(null);

  // ── History modal ───────────────────────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<DaiTtdh | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyMode, setHistoryMode] = useState<'current' | 'all'>('current');
  const [historyEntityNames, setHistoryEntityNames] = useState<Record<string, string>>({});
  const [historyEntityFilter, setHistoryEntityFilter] = useState('');

  const historyFieldCount = useMemo(() => historyRecords.length, [historyRecords]);

  const openHistory = useCallback(async (r: DaiTtdh) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistorySearch(''); setHistoryFrom(''); setHistoryTo('');
    setHistoryMode('current');
    try {
      const res = await api.get(`/v1/dai-ttdh/${r.id}/history`);
      const d = res.data?.data;
      const ch = Array.isArray(d?.changeHistory) ? d.changeHistory : [];
      setHistoryRecords(ch);
    } catch { toast.error('Không thể tải lịch sử'); }
    finally { setHistoryLoading(false); }
  }, []);

  const renderDaiTtdhHistoryTimeline = (records: any[]) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...safeRecords].sort((a: any, b: any) => new Date(b.changedAt || b.createdAt).getTime() - new Date(a.changedAt || a.createdAt).getTime());
    const grouped: Array<{ dateKey: string; items: any[] }> = [];
    for (const rec of sorted) {
      const key = (rec.changedAt || rec.createdAt || '').slice(0, 10);
      if (key && grouped.length > 0 && grouped[grouped.length - 1].dateKey === key) grouped[grouped.length - 1].items.push(rec);
      else grouped.push({ dateKey: key, items: [rec] });
    }
    const searchLower = historySearch.trim().toLowerCase();
    return (
      <div style={{ padding: '0 4px' }}>
        {grouped.map((g, gi) => {
          const items = g.items.filter((it: any) => {
            if (searchLower) {
              const hay = JSON.stringify({ ...it, _name: historyEntityNames[it.entityId] || '' }).toLowerCase();
              if (!hay.includes(searchLower)) return false;
            }
            if (historyFrom && toSec(it.changedAt || it.createdAt) < toSec(historyFrom)) return false;
            if (historyTo && toSec(it.changedAt || it.createdAt) > toSec(historyTo)) return false;
            if (historyMode === 'all' && historyEntityFilter && it.entityId !== historyEntityFilter) return false;
            return true;
          });
          if (items.length === 0) return null;
          return (
            <div key={gi} style={{ marginBottom: spaceXl }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spaceSm, marginBottom: spaceMd }}>
                <span style={historyBadgeStyle(actionPrimary)}>{g.dateKey || 'Không rõ ngày'}</span>
                <span style={historyTimeStyle}>{g.items.length} thay đổi</span>
              </div>
              {items.map((change: any, ci: number) => {
                const isCreate = change.actionType === 'CREATE' || change.action === 'CREATE' || change.changeType === 'CREATE';
                const changes = Array.isArray(change.changes) && change.changes.length > 0
                  ? change.changes.map((c: any) => ({ field: c.fieldName || c.field || '', oldValue: c.oldValue ?? c.before ?? null, newValue: c.newValue ?? c.after ?? null }))
                  : historyChangeRows(change);
                const actionMeta = resolveHistoryActionMeta({ items: [change] }, changes);
                const barColor = actionMeta.color;
                return (
                  <div key={ci} style={{ ...historyInfoCardStyle, marginBottom: spaceMd }}>
                    <div style={historyAccentBarStyle(barColor)} />
                    <div style={{ padding: `${spaceSm}px ${spaceMd}px` }}>
                      <div style={historyInfoTitleStyle}>
                        {historyMode === 'all' && (historyEntityNames[change.entityId] || 'Đài TTDH')}
                        <span style={{ marginLeft: 'auto', color: textTertiary, fontWeight: 400 }}>
                          {userMap.get(change.changedBy || change.createdBy || '') || change.changedBy || change.createdBy || '—'}
                        </span>
                      </div>
                      <div style={historyMetaRowStyle}>
                        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>{actionMeta.label}</span>
                        <span>{fmtHistoryTime(change.changedAt || change.createdAt)}</span>
                      </div>
                      <div style={historyGroupGridStyle}>
                        {changes.map((chg: any, ri: number) => {
                          const fn = chg.fieldName || chg.field || '';
                          const ov = historyFieldValue(fn, chg.oldValue ?? chg.before ?? null, orgMap, symbolMap);
                          const nv = historyFieldValue(fn, chg.newValue ?? chg.after ?? null, orgMap, symbolMap);
                          const renderCell = (rawVal: string | null) => {
                            if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                              const img = symbolImageMap.get(rawVal);
                              const name = symbolMap.get(rawVal) || rawVal;
                              return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}{name}</span>;
                            }
                            return null;
                          };
                          const renderVal = (rawVal: string | null, fmtVal: string | null) => renderCell(rawVal) ?? (fmtVal != null ? renderHistoryValueTag(fn, fmtVal) : <span style={{ color: textTertiary }}>—</span>);
                          return isCreate ? (
                            <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                              <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                              <span title={nv ?? '—'} style={historyNewValueStyle}>{renderVal(change.newValue, nv)}</span>
                            </div>
                          ) : (
                            <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                              <div style={historyFieldLabelStyle}>{fn ? `${historyFieldName(fn)}:` : '—'}</div>
                              <span title={ov ?? '—'} style={historyOldValueStyle}>{renderVal(change.oldValue, ov)}</span>
                              <span style={historyArrowStyle}>→</span>
                              <span title={nv ?? '—'} style={historyNewValueStyle}>{renderVal(change.newValue, nv)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {grouped.length === 0 && <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}><span style={{ color: textTertiary, fontSize: fontSizeMd }}>Không có dữ liệu lịch sử</span></div>}
      </div>
    );
  };

  const fmtHistoryTime = (ts?: string): string => (ts ? dayjs(ts).format('DD/MM/YYYY HH:mm:ss') : '—');

  // ── Load organizations ──────────────────────────────────────────
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
        users.forEach((u: any) => { map.set(u.id, u.fullName || u.username || u.id); });
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

  // ── Fetch tab counts ────────────────────────────────────────────
  const fetchCounts = useCallback(async (orgId: string | undefined) => {
    try {
      const results = await Promise.allSettled(
        TAB_STATUS_LIST.map((tab) =>
          tab.key === 'all'
            ? daiTtdhCRUD.search({ orgUnitId: (orgId && orgId !== '__all__') ? orgId : undefined, page: 1, pageSize: 1 })
            : daiTtdhCRUD.search({ approvalStatus: TAB_QUERY_MAP[tab.key], orgUnitId: (orgId && orgId !== '__all__') ? orgId : undefined, page: 1, pageSize: 1 }),
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
      const res = await daiTtdhCRUD.search({
        orgUnitId: (managingUnitId && managingUnitId !== '__all__') ? managingUnitId : undefined,
        daiTtdhName: filterName.trim() || undefined,
        daiTtdhCode: filterCode.trim() || undefined,
        stationLevel: filterStationLevel,
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
      setError(err instanceof Error ? err : new Error('Không thể tải danh sách đài TTDH'));
    } finally { setIsLoading(false); }
  }, [managingUnitId, filterName, filterCode, filterStationLevel,
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
    setFilterName(''); setFilterCode(''); setFilterStationLevel(undefined);
    setFilterProvince('');
    setFilterOperationalStatus(undefined);
    setFilterUpdatedFrom(undefined); setFilterUpdatedTo(undefined);
    setActiveTab('all'); setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key); setPage(1);
  }, []);

  // ── Detail drawer ────────────────────────────────────────────────
  const openDetailDrawer = useCallback(async (record: DaiTtdh) => {
    setDetailDrawerVisible(true); setDetailRecord(record); setDetailFiles([]); setDetailLoading(true);
    try {
      const res = await api.get(`/v1/dai-ttdh/${record.id}/attachments`, { params: { page: 0, size: 50 } });
      setDetailFiles(res.data?.data || []);
    } catch { setDetailFiles([]); }
    try {
      const fresh = await daiTtdhCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch { /* keep initial data */ }
    finally { setDetailLoading(false); }
  }, []);

  // ── Delete confirmation ─────────────────────────────────────────
  const openDeleteModal = useCallback((record: DaiTtdh) => {
    setDeletingRecord(record); setDeleteConfirmText(''); setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    const expectedText = (deletingRecord.daiTtdhName || 'XÓA').trim().toLowerCase();
    const input = deleteConfirmText.trim().toLowerCase();
    if (input !== expectedText && input !== 'xóa') {
      toast.error('Vui lòng nhập đúng tên đài hoặc gõ "XÓA" để xác nhận'); return;
    }
    try {
      await daiTtdhCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa đài TTDH');
      setDeleteModalOpen(false); setDeletingRecord(null); setDeleteConfirmText('');
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Xóa thất bại'); }
  }, [deletingRecord, deleteConfirmText, fetchData, fetchCounts, managingUnitId]);

  // ── Approval handlers ───────────────────────────────────────────
  const handleApprove = useCallback(async (record: DaiTtdh, content?: string) => {
    try {
      const cap = record.approvalStatus === 'APPROVED_LEVEL2' ? 'CUC' : 'CANG_VU';
      await daiTtdhCRUD.approve(record.id, cap, content || 'Đã phê duyệt');
      toast.success('Đã phê duyệt đài TTDH');
      setApproveModalOpen(false); setApprovingRecord(null);
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Phê duyệt thất bại'); }
  }, [fetchData, fetchCounts, managingUnitId]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await daiTtdhCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' });
      toast.success('Đã gửi phê duyệt đài TTDH');
      setSubmitModalOpen(false); setSubmittingRecord(null);
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Gửi phê duyệt thất bại'); }
  }, [submittingRecord, fetchData, fetchCounts, managingUnitId]);

  const openRejectModal = useCallback((record: DaiTtdh) => {
    setRejectingRecord(record); setRejectReason(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { toast.error('Vui lòng nhập lý do từ chối'); return; }
    if (reason.length < 10) { toast.error('Lý do từ chối tối thiểu 10 ký tự'); return; }
    if (reason.length > 500) { toast.error('Lý do từ chối tối đa 500 ký tự'); return; }
    try {
      await daiTtdhCRUD.reject(rejectingRecord.id, rejectingRecord.approvalStatus === 'APPROVED_LEVEL2' ? 'CUC' : 'CANG_VU', reason);
      toast.success('Đã từ chối phê duyệt');
      setRejectModalOpen(false); setRejectingRecord(null); setRejectReason('');
      void fetchData(); void fetchCounts(managingUnitId);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Từ chối thất bại'); }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, managingUnitId]);

  // ── Header actions ──────────────────────────────────────────────
  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('daittdh:create')) {
      actions.push({ key: 'create', label: 'Thêm mới', variant: 'primary', icon: icons.create, onClick: () => setCreateDrawerVisible(true) });
    }
    return actions;
  }, [hasPerm]);

  // ── Filter panel content ────────────────────────────────────────
  const filterContent = (
    <>
      <style>{`.dai-ttdh-filter .ant-select-selector { border-radius: 999px !important; } .dai-ttdh-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; } .dai-ttdh-filter .ant-select-content-item { max-width: 45% !important; } .dai-ttdh-filter .ant-select-selection-item { border-radius: 999px !important; }`}</style>
      {/* ── Cơ bản: ĐVQL + Tên + Tình trạng ──────────────────── */}
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
          value={managingUnitId}
          onChange={(v) => { setManagingUnitId(v); setPage(1); }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên đài</div>
        <Input
          placeholder="Tìm theo tên đài"
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

      {/* ── Nâng cao: đúng các trường CSV đánh dấu Bộ lọc ───────── */}
      {filterCollapsed && (<>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã đài</div>
          <Input
            placeholder="Tìm theo mã đài"
            allowClear
            value={filterCode}
            onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
            onPressEnter={handleFilterApply}
            style={{ borderRadius: radiusPill, height: 40 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân loại đài</div>
          <Select
            placeholder="Chọn phân loại đài"
            allowClear
            showSearch
            optionFilterProp="label"
            value={filterStationLevel}
            onChange={(v) => { setFilterStationLevel(v); setPage(1); }}
            options={DAI_TTDH_STATION_LEVEL_OPTIONS}
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

      </>)}
    </>
  );

  // ── Status tabs config ──────────────────────────────────────────
  const statusTabs = TAB_STATUS_LIST.map((tab) => ({
    key: tab.key, label: tab.label, count: tabCounts[tab.key] ?? 0,
    color: tab.color, active: activeTab === tab.key,
  }));

  // ── rowActions callback ──────────────────────────────────────────
  const rowActions = useCallback(
    (record: DaiTtdh) => {
      const actions: any[] = [
        { key: 'view', label: 'Chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) },
      ];
      const st = record.approvalStatus || '';
      // Chỉnh sửa chỉ áp dụng cho Lưu tạm (DRAFT) và Đã phê duyệt (APPROVED) — chuẩn VTS CHK
      if (canEditApprovalRecord(st, { hasPerm, resource: 'daittdh', extraApprovePerms: ['daittdh:approve'] })) actions.push({ key: 'edit', label: 'Chỉnh sửa', icon: icons.edit, onClick: () => { setEditDaiTtdhId(record.id); setEditDaiTtdhName(record.daiTtdhName || ''); } });
      if (hasPerm('daittdh:delete') && ['DRAFT','NHAP'].includes(st)) actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
      if (['DRAFT','NHAP'].includes(st) && hasPerm('daittdh:update')) actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => { setSubmittingRecord(record); setSubmitModalOpen(true); } });
      if (hasPerm('daittdh:approve') && ['APPROVED_LEVEL1','APPROVED_LEVEL2'].includes(st)) { actions.push({ key: 'approve', label: st === 'APPROVED_LEVEL2' ? 'Cục phê duyệt' : 'Cảng vụ phê duyệt', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } }); actions.push({ key: 'reject', label: 'Từ chối', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) }); }
      if (hasPerm('daittdh:history')) actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
      return actions;
    },
    [hasPerm, openDetailDrawer, openHistory, openDeleteModal, openRejectModal],
  );

  // ── Table columns (đối chiếu đúng cột CSV) ─────────────────────
  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'orgUnitId') return resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(r.orgUnitId || '') || '';
    if (field === 'provinceId') return r.provinceId ? VIETNAM_PROVINCES[r.provinceId - 1] ?? '' : '';
    if (field === 'stationLevel') return DAI_TTDH_STATION_LEVEL_OPTIONS.find(o => o.value === r.stationLevel)?.label ?? r.stationLevel ?? '';
    if (field === 'operationalStatus') {
      const m: Record<string, string> = {
        OPERATIONAL: 'Đang khai thác/vận hành',
        NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
        SUSPENDED: 'Dừng khai thác/vận hành',
      };
      return m[r.operationalStatus] || r.operationalStatus || '';
    }
    if (field === 'approvalStatus') return APPROVAL_STYLE_MAP[r.approvalStatus]?.label || r.approvalStatus || '';
    return r[field] ?? '';
  }, [organizations, orgMap]);

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
        key: 'daiTtdhName',
        label: <span>Tên/Mã đài</span>,
        dataIndex: 'daiTtdhName',
        width: 220,
        fixed: 'left' as const,
        sortable: true,
        sortOrder,
        ellipsis: false,
        render: (v: string, record: DaiTtdh) => (
          <div>
            <a
              title={v}
              onClick={() => openDetailDrawer(record)}
              style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {v}
            </a>
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.daiTtdhCode || '—'}</span>
          </div>
        ),
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 260,
        sortable: true,
        sortOrder,
        render: (_v: string | null, record: DaiTtdh) => (
          <span style={{ fontWeight: fontWeightBold }}>
            {resolveOrgLevel2Name(organizations, record.orgUnitId) || orgMap.get(record.orgUnitId || '') || '—'}
          </span>
        ),
      },
      {
        key: 'operatingUnitId',
        label: 'Đơn vị khai thác',
        dataIndex: 'operatingUnitId',
        width: 220,
        sortable: true,
        sortOrder,
        render: (_v: string | null, record: DaiTtdh) => record.operatingUnitName || record.operatingUnitId || '—',
      },
      {
        key: 'stationLevel',
        label: 'Phân loại đài',
        dataIndex: 'stationLevel',
        width: 150,
        sortable: true,
        sortOrder,
        render: (v: number | null) => {
          const s = DAI_TTDH_STATION_LEVEL_OPTIONS.find(o => o.value === v);
          return <span style={{ fontSize: fontSizeMd }}>{s?.label ?? (v ?? '—')}</span>;
        },
      },
      {
        key: 'provinceId',
        label: 'Địa điểm (Tỉnh/Thành phố)',
        dataIndex: 'provinceId',
        width: 250,
        sortable: true,
        sortOrder,
        render: (v: number | null) => (v ? VIETNAM_PROVINCES[v - 1] : '—'),
      },
      {
        key: 'operationalStatus',
        label: 'Tình trạng',
        dataIndex: 'operationalStatus',
        width: 210,
        sortable: true,
        sortOrder,
        render: (v: string | null) => {
          const m: Record<string, { color: string; label: string }> = {
            OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
            NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
            SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
          };
          const s = m[v || ''] || { color: textTertiary, label: v || '—' };
          return (
            <span style={statusBadgeStyle(s.color)}>
              {s.label}
            </span>
          );
        },
      },
    ];

    // Audit columns — chỉ hiển thị cho Admin Cục / admin-operation (giống Bến cảng)
    const auditColumns: any[] = isAuditViewer ? [
      { key: 'updatedAt', label: <span>Cán bộ cập nhật</span>, dataIndex: 'updatedAt', width: 200, sortable: true, sortOrder,
        render: (v: string | null, record: DaiTtdh) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
      { key: 'submittedForApprovalAt', label: <span>Cán bộ gửi Phê duyệt</span>, dataIndex: 'submittedForApprovalAt', width: 210, sortable: true, sortOrder,
        render: (v: string | null, record: DaiTtdh) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.submittedForApprovalBy || '') || record.submittedForApprovalBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
      { key: 'portAuthorityApprovedAt', label: <span>Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>, dataIndex: 'portAuthorityApprovedAt', width: 340, sortable: true, sortOrder,
        render: (v: string | null, record: DaiTtdh) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.portAuthorityApprovedBy || '') || record.portAuthorityApprovedBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
      { key: 'departmentApprovedAt', label: <span>Cán bộ phê duyệt cấp Cục</span>, dataIndex: 'departmentApprovedAt', width: 240, sortable: true, sortOrder,
        render: (v: string | null, record: DaiTtdh) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.departmentApprovedBy || '') || record.departmentApprovedBy || '—'}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ) },
    ] : [];

    const tailColumns: any[] = [
      { key: 'approvalStatus', label: 'Trạng thái', dataIndex: 'approvalStatus', width: 260, sortable: true, sortOrder,
        render: (v: string) => {
          const s = APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v?.toUpperCase()] || { color: textTertiary, label: v || '—' };
          return <span style={statusBadgeStyle(s.color)}>{s.label}</span>;
        } },
    ];

    const allColumns = [...baseColumns, ...tailColumns, ...auditColumns];
    return allColumns.map(col => ({
      ...col,
      sortOrder: col.sortable && col.key === sortField ? sortOrder : undefined,
    }));
  }, [
    openDetailDrawer,
    organizations,
    orgMap,
    userMap,
    isAuditViewer,
    page,
    pageSize,
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
      <DaiTtdhDetailContent
        selectedRecord={detailRecord}
        orgMap={orgMap}
        organizations={organizations}
        symbolMap={symbolMap}
        symbolImageMap={symbolImageMap}
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
    <ThemeTokenProvider tokens={themeTokenChk}>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 32px)' }}>
      <style>{`.range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child { display: none !important; }`}</style>
      <ScreenHeader
        breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý đài TTDH' }]}
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
        <DataTable columns={columns}
          dataSource={[...dataSource].sort((a: any, b: any) => { if (!sortField) return 0; const aVal = getSortValue(a, sortField); const bVal = getSortValue(b, sortField); const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi'); return sortOrder === 'ascend' ? cmp : -cmp; })}
          rowKey="id" rowActions={rowActions} loading={false}
          onSort={(key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); setPage(1); }}
          scroll={{ x: 'max-content', y: 550 }}
        />
        <Pagination total={total} current={page} pageSize={pageSize}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      </FilterTableLayout>

      {/* ── Create Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Thêm mới Đài TTDH</span>}
        open={createDrawerVisible}
        destroyOnHidden
        onClose={() => { setCreateDrawerVisible(false); createForm.resetFields(); }}
        extra={<Button type="text" onClick={() => { setCreateDrawerVisible(false); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); daiTtdhFormRef.current?.submit('DRAFT'); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>Lưu tạm</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); daiTtdhFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); daiTtdhFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
        afterOpenChange={(open) => {
          if (open) {
            createForm.resetFields();
            // Sinh mã tự động DTTDH-{seq} + Tình trạng mặc định "Chưa khai thác" (sau resetFields để không bị xóa)
            createForm.setFieldsValue({ operationalStatus: 'NOT_YET_OPERATIONAL' });
            daiTtdhCRUD.generateCode()
              .then((res: any) => { if (res?.daiTtdhCode) createForm.setFieldsValue({ daiTtdhCode: res.daiTtdhCode }); })
              .catch(() => {});
          }
        }}
      >
        <style>{requiredMarkStyle}</style>
        <Form form={createForm} layout="vertical" initialValues={{}}>
          <DaiTtdhForm ref={daiTtdhFormRef} form={createForm} onFinish={() => { setCreateDrawerVisible(false); void fetchData(); void fetchCounts(managingUnitId); }} onSubmittingChange={setSubmitting} />
        </Form>
      </Drawer>

      {/* ── Edit Drawer ────────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>Chỉnh sửa thông tin — {editDaiTtdhName || 'Đài TTDH'}</span>}
        open={!!editDaiTtdhId}
        onClose={() => { setEditDaiTtdhId(undefined); setEditDaiTtdhName(''); updateForm.resetFields(); }}
        extra={<Button type="text" onClick={() => { setEditDaiTtdhId(undefined); setEditDaiTtdhName(''); updateForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
        footer={
          <div style={drawerFooterStyle}>
            <Button onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); editDaiTtdhFormRef.current?.submit('DRAFT'); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>Lưu tạm</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'submit'; setActionType('submit'); editDaiTtdhFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>Lưu và gửi phê duyệt</Button>
            <Button type="primary" onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); editDaiTtdhFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
          </div>
        }
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {editDaiTtdhId && (<>
          <style>{requiredMarkStyle}</style>
          <Form form={updateForm} layout="vertical" initialValues={{}}>
            <DaiTtdhForm ref={editDaiTtdhFormRef} form={updateForm} id={editDaiTtdhId} onFinish={() => { setEditDaiTtdhId(undefined); void fetchData(); void fetchCounts(managingUnitId); }} onSubmittingChange={setSubmitting} />
          </Form>
        </>)}
      </Drawer>

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      <Drawer
        {...drawerProps}
        width={1000}
        title={<span style={drawerTitleStyle}>Chi tiết đài TTDH{detailRecord ? ` - ${detailRecord.daiTtdhName}` : ''}</span>}
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
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Xác nhận xóa đài TTDH</span>}
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
            Vui lòng nhập <strong>tên đài</strong> hoặc gõ <strong>"XÓA"</strong> để xác nhận xóa.
          </p>
          {deletingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              Đài TTDH: <strong style={{ color: textPrimary }}>{deletingRecord.daiTtdhName}</strong>
            </p>
          )}
          <Input placeholder="Nhập tên đài hoặc XÓA" value={deleteConfirmText}
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
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho đài TTDH:</p>
          {rejectingRecord && (
            <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
              <strong style={{ color: textPrimary }}>{rejectingRecord.daiTtdhName}</strong>
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
            Gửi <strong>{submittingRecord?.daiTtdhCode} — {submittingRecord?.daiTtdhName}</strong> để Cảng vụ phê duyệt?
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
      <Drawer
        {...drawerProps}
        size={880}
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
              <span style={drawerTitleStyle}>
                {historyMode === 'all' ? 'Tất cả lịch sử thay đổi — Đài TTDH' : (historyTarget ? `Lịch sử thay đổi — ${historyTarget.daiTtdhName}` : 'Lịch sử thay đổi')}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>Tổng cộng {historyFieldCount}</span>
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
              onChange={async e => { const mode = e.target.value; setHistoryMode(mode); setHistoryLoading(true); setHistoryRecords([]); if (mode === 'all') { try { const res = await api.get('/v1/dai-ttdh/history/all'); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []); setHistoryEntityNames(d?.entityNames || {}); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } else { try { const res = await api.get(`/v1/dai-ttdh/${historyTarget?.id}/history`); const d = res.data?.data; setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory : []); } catch { toast.error('Không thể tải lịch sử'); } finally { setHistoryLoading(false); } } }}>
              <Radio.Button value="current" style={{ fontWeight: fontWeightBold, color: historyMode !== 'current' ? textSecondary : actionPrimary }}>Bản ghi hiện tại</Radio.Button>
              <Radio.Button value="all" style={{ fontWeight: fontWeightBold, color: historyMode !== 'all' ? textSecondary : actionPrimary }}>Tất cả bản ghi</Radio.Button>
            </Radio.Group>
          </div>
        )}
        {!historyLoading && (
          <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
            <Input placeholder="Tìm kiếm nội dung thay đổi..." allowClear value={historySearch}
              onChange={e => setHistorySearch(e.target.value)} style={{ flex: 1, borderRadius: radiusPill, height: 40 }} />
            {historyMode === 'all' && <Select placeholder="Chọn đài TTDH" allowClear showSearch value={historyEntityFilter || undefined}
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
        ) : renderDaiTtdhHistoryTimeline(historyRecords)}
        </div>
      </Drawer>
    </div>
    </ThemeTokenProvider>
  );
}
