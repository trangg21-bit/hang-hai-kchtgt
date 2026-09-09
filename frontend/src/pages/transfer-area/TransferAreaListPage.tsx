import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Input, Select, DatePicker,
  Drawer, Space, Typography, Form,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { transferAreaCRUD, transferAreaApproval, portCRUD } from '../../services/portService';
import type { TransferArea } from '../../types/port';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { symbolService } from '../../services/symbolService';
import api from '../../services/api';
import { userService } from '../../services/userService';
import type { Organization } from '../../services/organizationService';
import { usePermissionStore } from '../../store/permissionStore';
import { useAuthStore } from '../../store/authStore';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, DataTable } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import toast from '../../components/ToastNotification';
import TransferAreaForm from './TransferAreaForm';
import TransferAreaDetailContent from './TransferAreaDetailContent';
import { ThemeTokenProvider, type ThemeToken } from '../../context/ThemeTokenContext';
import { canEditApprovalRecord, canDeleteApprovalRecord, normalizeApprovalStatus } from '../../utils/approvalEditPolicy';
import ApprovalModal from '../../components/shared/ApprovalModal';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import * as themeTokenChk from '../../themetokenchk';
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
  historyGroupGridStyle, historyTimeStyle, historyMetaRowStyle,
  historyInfoCardStyle, historyAccentBarStyle, historyInfoTitleStyle,
  historyChangeRowStyle, historyCreateRowStyle, historyFieldLabelStyle,
  historyOldValueStyle, historyNewValueStyle, historyArrowStyle, icons, statusBadgeStyle,
  cellTitleStyle, cellSubtitleStyle,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';

// ── Cỡ chữ 13.5px đồng bộ chuẩn VTS CHK (theo PierListPage / PortListPage) ──
const fontSizeMd = 13.5;

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  CHO_PHE_DUYET: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PROPOSED: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
};

const OPERATIONAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
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

const OPERATIONAL_FUNCTIONS_OPTIONS = [
  { value: 'CONTAINER', label: 'Hàng Container' },
  { value: 'GENERAL_CARGO', label: 'Hàng tổng hợp (Bách hóa)' },
  { value: 'BULK_CARGO', label: 'Hàng chuyên dụng hàng rời, quặng' },
  { value: 'OIL_GAS', label: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng' },
  { value: 'OTHER', label: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu...)' },
  { value: 'PASSENGER', label: 'Hành khách' },
];

const OPERATIONAL_FUNCTIONS_LABEL_MAP: Record<string, string> = {
  CONTAINER: 'Hàng Container',
  GENERAL_CARGO: 'Hàng tổng hợp (Bách hóa)',
  BULK_CARGO: 'Hàng chuyên dụng hàng rời, quặng',
  OIL_GAS: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng',
  OTHER: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu...)',
  PASSENGER: 'Hành khách',
};

function formatOperationalFunctions(v?: string | null): string {
  if (!v) return '';
  const parts = v.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map((code) => OPERATIONAL_FUNCTIONS_LABEL_MAP[code] || code).join(', ');
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
}

const histLabels: Record<string, string> = {
  transferAreaCode: 'Mã khu chuyển tải',
  transferAreaName: 'Tên khu chuyển tải',
  portId: 'Thuộc cảng biển',
  orgUnitId: 'Đơn vị quản lý',
  provinceId: 'Tỉnh/Thành phố',
  detailedLocation: 'Địa điểm chi tiết',
  operationalFunctions: 'Công năng khai thác',
  operationalStatus: 'Tình trạng',
  approvalStatus: 'Trạng thái',
  shapeDescription: 'Hình dạng',
  area: 'Diện tích (ha)',
  designWaterDepth: 'Độ sâu thiết kế (m)',
  currentWaterDepth: 'Độ sâu hiện tại (m)',
  bottomElevationDesign: 'Cao độ đáy thiết kế (m)',
  maxVesselDWT: 'Cỡ tàu khai thác tối đa (DWT)',
  activeTransferCount: 'Số lượng khu chuyển tải đang khai thác',
  publishedTransferCount: 'Số lượng khu chuyển tải đã công bố',
  underInvestmentTransferCount: 'Số lượng khu chuyển tải đang thỏa thuận đầu tư',
  remarks: 'Ghi chú',
  openingAnnouncementDate: 'Thời điểm công bố mở',
  publicDecision: 'Quyết định công bố/văn bản cho phép khai thác',
  investmentAgreement: 'Văn bản thỏa thuận đầu tư',
  activityStartDate: 'Từ ngày',
  activityEndDate: 'Đến ngày',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  mapSymbolId: 'Biểu tượng',
  'Tọa độ GIS': 'Tọa độ GIS',
  'Loại đối tượng GIS': 'Loại đối tượng GIS',
  'Tài liệu đính kèm': 'Tài liệu đính kèm',
  'Phạm vi khu nước neo buộc tàu': 'Phạm vi khu nước neo buộc tàu',
  'Trạng thái': 'Hành động',
};

function histField(fn: string): string { return histLabels[fn] || fn; }

function histVal(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>,
  portMap?: Map<string, string>,
): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  if (fn === 'operationalFunctions') return formatOperationalFunctions(val);
  if (fn === 'orgUnitId' && orgMap) { const f = orgMap.get(val); return f ? f.split(' - ').pop() || f : val; }
  if (fn === 'portId' && portMap) return portMap.get(val) || val;
  if (fn === 'mapSymbolId' && symbolMap) return symbolMap.get(val) || val;
  if (fn === 'approvalStatus') {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm',
      PENDING: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      CHO_PHE_DUYET: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
      APPROVED: 'Đã phê duyệt',
      DA_PHE_DUYET: 'Đã phê duyệt',
      REJECTED: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL2: 'Từ chối cấp cục',
    };
    return m[val?.toUpperCase()] || val;
  }
  if (fn === 'operationalStatus') {
    const m: Record<string, string> = {
      OPERATIONAL: 'Đang khai thác/vận hành',
      NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
      SUSPENDED: 'Dừng khai thác/vận hành',
    };
    return m[val?.toUpperCase()] || val;
  }
  if (fn === 'provinceId') {
    const num = Number(val);
    return num > 0 && num <= VIETNAM_PROVINCES.length ? VIETNAM_PROVINCES[num - 1] : val;
  }
  if (fn === 'coordinateSystem') { const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' }; return m[val] || val; }
  if (fn.endsWith('At') || fn.endsWith('Date')) {
    try {
      let d = dayjs(val);
      if (!d.isValid()) { d = dayjs((val || '').replace(/\.\d+$/, '')); }
      return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : val;
    } catch { return val; }
  }
  return val;
}

function historyTimestamp(item: any): string {
  return item.approvedDate || item.changedAt || item.createdAt || '';
}

function historyActor(item: any): string {
  const raw = item?.approvedByName || item?.changedByName || item?.performedByName || item?.userName || item?.actorName || item?.approvedBy || item?.changedBy || item?.performedBy || '';
  return raw || '';
}

function normalizeHistoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
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

function historyChangeRows(item: any): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  const fields = normalizedHistoryFields(String(item.changedField || item.fieldName || '').trim());
  const oldValue = item.previousValue ?? item.oldValue ?? null;
  const newValue = item.newValue ?? null;
  const oldAssignments = parseHistoryAssignments(oldValue);
  const newAssignments = parseHistoryAssignments(newValue);

  if (fields.length > 1 && oldAssignments.size === 0 && newAssignments.size === 0) {
    return [{ field: fields.join(', '), oldValue, newValue }];
  }
  if (fields.length === 0) {
    return [{ field: '', oldValue, newValue }];
  }
  return fields.map((field, index) => {
    const displayField = histField(field);
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
  if (val === null || val === undefined || val === '—' || val === '-' || val === '') {
    return '';
  }
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);

  if (normKey === 'approvalstatus' || normKey === 'trang thai phe duyet' || normKey.includes('phe duyet') || normKey.includes('trang thai')) {
    if (normVal === 'da duyet' || normVal === 'da phe duyet' || normVal === 'approved') {
      return (<span style={statusBadgeStyle(statusOperational)}>{val}</span>);
    }
    if (normVal === 'cho cuc duyet' || normVal === 'approved_level2' || normVal.includes('cuc duyet') || normVal.includes('cap cuc')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    if (normVal === 'cho cang vu duyet' || normVal === 'cho phe duyet' || normVal === 'cho duyet' || normVal === 'pending' || normVal === 'pending_approval' || normVal === 'approved_level1' || normVal.includes('cang vu')) {
      return (<span style={statusBadgeStyle(actionPrimary)}>{val}</span>);
    }
    if (normVal === 'tu choi' || normVal.includes('rejected') || normVal.includes('tra ve')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
    return (<span style={statusBadgeStyle(statusDraft)}>{val}</span>);
  }

  if (normKey === 'operationalstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    if (normVal.includes('dang khai thac') || normVal.includes('operational')) {
      return (<span style={statusBadgeStyle(statusOperational)}>{val}</span>);
    }
    if (normVal.includes('chua khai thac') || normVal.includes('not_yet')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    if (normVal.includes('dung khai thac') || normVal.includes('suspended')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
  }

  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

function resolveHistoryActionMeta(group: any, changes: any[]): { label: string; color: string; bg: string } {
  const item = group.items?.[0] || {};
  const rawStatus = String(item.status ?? item.action ?? '').toUpperCase();
  const rawReason = String(item.reason ?? item.ghiChu ?? item.note ?? '').toLowerCase();
  const level = Number(item.approvalLevel || 0);

  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
    return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
  }

  if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || item.changedField?.includes('đính kèm')) {
    return { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c718' };
  }
  if (rawStatus === 'ATTACHMENT_DELETED' || rawReason.includes('xóa tài liệu') || rawReason.includes('xóa tệp') || rawReason.includes('xoa tep')) {
    return { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c18' };
  }

  if (rawStatus === 'UPDATED' || rawStatus === 'UPDATE' || rawStatus === 'EDIT' || rawReason.includes('cập nhật') || rawReason.includes('chỉnh sửa')) {
    return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
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
    const k = normalizeHistoryKey(c.field);
    return k === 'approvalstatus' || k === 'trang thai phe duyet';
  });

  if (approvalChange) {
    const nv = normalizeHistoryKey(approvalChange.newValue || '');
    if (nv.includes('cang vu tra ve') || nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu'))) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('cuc tra ve') || nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc'))) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv === 'cho cuc duyet' || nv.includes('da phe duyet cap 1') || nv.includes('approved_level2') || nv.includes('cuc duyet') || nv.includes('approved_level1')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (nv === 'da duyet' || nv.includes('da phe duyet') || nv.includes('approved')) {
      return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
    }
    if (nv.includes('tu choi') || nv.includes('rejected') || nv.includes('tra ve')) {
      return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('cho cang vu duyet') || nv.includes('cho phe duyet') || nv.includes('pending') || nv.includes('proposed') || nv.includes('luu tam') || nv.includes('nhap')) {
      return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
    }
  }

  if (level === 1 || String(item.approvalLevel).includes('LEVEL_1') || rawReason.includes('cấp 1') || rawReason.includes('cap 1') || rawStatus === 'UNDER_REVIEW') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (level === 2 || String(item.approvalLevel).includes('LEVEL_2') || rawReason.includes('cấp 2') || rawReason.includes('cap 2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cục', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi')) {
    return { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}18` };
  }
  if (rawStatus === 'SUBMITTED' || rawStatus === 'PENDING' || rawReason.includes('trình duyệt') || rawReason.includes('trinh duyet')) {
    return { label: 'Trình duyệt', color: statusAttention, bg: `${statusAttention}18` };
  }
  if (rawStatus === 'DELETED' || rawStatus === 'DELETE' || rawStatus === 'SOFT_DELETE' || rawReason.includes('xóa') || rawReason.includes('xoa')) {
    return { label: 'Xóa', color: '#64748b', bg: '#64748b18' };
  }

  return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}18` };
}

export default function TransferAreaListPage() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const userPermissions = useAuthStore((s) => s.user?.permissions) || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation') || userPermissions.includes('*');
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [orgUnit, setOrgUnit] = useState<string | undefined>(undefined);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterProvince, setFilterProvince] = useState<number | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterOperationalFunctions, setFilterOperationalFunctions] = useState<string[]>([]);
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<TransferArea[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    organizations.forEach(o => m.set(o.id, o.name));
    return m;
  }, [organizations]);
  const portMap = useMemo(() => {
    const m = new Map<string, string>();
    portOptions.forEach((o) => m.set(o.value, o.label));
    return m;
  }, [portOptions]);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editTransferAreaId, setEditTransferAreaId] = useState<string | undefined>();
  const [editBaseStatus, setEditBaseStatus] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const transferAreaFormRef = useRef<any>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<TransferArea | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<TransferArea | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<TransferArea | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<TransferArea | null>(null);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<TransferArea | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<TransferArea | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  const filteredHistory = useMemo(() => {
    const q = (historyFilters.keyword || '').trim().toLowerCase();
    const from = historyFilters.fromDate || '';
    const to = historyFilters.toDate || '';
    return (Array.isArray(historyRecords) ? historyRecords : []).filter((r: any) => {
      if (q) {
        const fn = String(r?.fieldName || r?.changedField || '').toLowerCase();
        const label = histField(fn) || fn;
        const rawHits = [fn, label, r?.oldValue, r?.newValue, r?.previousValue, r?.value, r?.reason, r?.ghiChu, r?.note]
          .filter((v) => v !== null && v !== undefined)
          .map((v) => String(v).toLowerCase());
        const resolvedOld = histVal(fn, r?.oldValue, orgMap, symbolMap, portMap);
        const resolvedNew = histVal(fn, r?.newValue, orgMap, symbolMap, portMap);
        if (resolvedOld) rawHits.push(String(resolvedOld).toLowerCase());
        if (resolvedNew) rawHits.push(String(resolvedNew).toLowerCase());
        if (!rawHits.some((text) => text.includes(q))) return false;
      }
      if (from || to) {
        const ts = r?.changedAt || r?.createdAt || r?.approvedDate || '';
        const day = ts ? dayjs(ts).format('YYYY-MM-DD') : '';
        if (!day) return false;
        if (from && day < from) return false;
        if (to && day > to) return false;
      }
      return true;
    });
  }, [historyRecords, historyFilters, orgMap, symbolMap, portMap]);
  const hasActiveHistoryFilter = !!(historyFilters.keyword?.trim() || historyFilters.fromDate || historyFilters.toDate);

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const openHistory = useCallback(async (r: TransferArea) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistoryFilters({ keyword: '' });
    try {
      const res = await api.get(`/v1/transfer-area/${r.id}/history`);
      const d = res.data?.data;
      setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory.filter((row: any) => row.fieldName !== 'CREATE') : []);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'portId', 'transferAreaCode', 'transferAreaName', 'operationalFunctions',
    'operationalStatus', 'provinceId', 'detailedLocation', 'shapeDescription', 'area',
    'designWaterDepth', 'currentWaterDepth', 'bottomElevationDesign', 'maxVesselDWT',
    'activeTransferCount', 'publishedTransferCount', 'underInvestmentTransferCount',
    'remarks', 'openingAnnouncementDate', 'publicDecision', 'investmentAgreement',
    'activityStartDate', 'activityEndDate', 'coordinateSystem', 'displayRule', 'mapSymbolId',
    'Phạm vi khu nước neo buộc tàu', 'Tọa độ GIS', 'Loại đối tượng GIS', 'Tài liệu đính kèm',
  ];

  const renderTransferAreaHistoryTimeline = (records: any[]) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...safeRecords].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const actor = historyActor(r);
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === actor && prev.status === r.status && prev.approvalLevel === r.approvalLevel) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, status: r.status, approvalLevel: r.approvalLevel, items: [r] });
      }
    }
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>{hasActiveHistoryFilter ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}</div>
      </div>
    );
    const fmtTime = (ts: string) => { try { return dayjs(ts).format('HH:mm DD/MM/YYYY'); } catch { return ts || ''; } };
    return (
      <div>{groups.map((g, gi) => {
        const rec0 = g.items[0] || {};
        const orgId = rec0.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        const unitName = (orgName ? (orgName.split(' - ').pop() || orgName) : (rec0.orgUnitName || rec0.unitName)) || '';
        const changes = g.items.flatMap((item: any) => historyChangeRows(item)).sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }).filter((c: any) => c.field !== 'attachments' && c.field !== 'spatialId');
        const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
        const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
        const actionMeta = resolveHistoryActionMeta(g, changes);
        const barColor = actionMeta.color;
        const formatHistoryValue = (fn: string, raw: string | null) => {
          if (raw === null || raw === '(null)' || raw === '') return null;
          const t = raw.trim();
          if (t.startsWith('[') && t.endsWith(']')) {
            if (t === '[]') return 'Không có';
            const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
            return `${parts.length} hạng mục`;
          }
          if (fn === 'operationalFunctions') {
            return formatOperationalFunctions(raw);
          }
          if (/^-?\d+(\.\d+)?$/.test(t)) {
            const n = Number(t);
            return Number.isInteger(n) ? n.toLocaleString('vi-VN') : t;
          }
          return histVal(fn, raw, orgMap, symbolMap, portMap);
        };
        const validChanges = changes.filter((c: any) => {
          if (!c.field) return false;
          const ov = formatHistoryValue(c.field, c.oldValue);
          const nv = formatHistoryValue(c.field, c.newValue);
          if (ov == null && nv == null) return false;
          if (ov === nv) return false;
          return true;
        });
        const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);
        if (validChanges.length === 0 && reasons.length === 0) return null;
        return (
          <div key={gi} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
            <div style={{ minWidth: 0, paddingTop: spaceXs }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                <Typography.Text style={historyTimeStyle}>
                  {g.ts ? fmtTime(g.ts) : ''}
                </Typography.Text>
                <span style={{ flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>{actionMeta.label}</span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                <Typography.Text style={historyMetaRowStyle}>
                  Người cập nhật: {g.actor || ''}
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
              {validChanges.length > 0 ? (
                <div>
                  {validChanges.map((change, ri: number) => {
                    const fn = change.field;
                    const ov = formatHistoryValue(fn, change.oldValue);
                    const nv = formatHistoryValue(fn, change.newValue);
                    const renderCell = (rawVal: string | null) => {
                      if (fn === 'mapSymbolId' && rawVal && rawVal !== '(null)') {
                        const img = symbolImageMap.get(rawVal);
                        const name = symbolMap.get(rawVal) || rawVal;
                        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> : null}{name}</span>;
                      }
                      return null;
                    };
                    const renderVal = (rawVal: string | null, fmtVal: string | null) => {
                      if (!fmtVal || fmtVal === '—' || fmtVal === '-' || fmtVal === '–' || fmtVal === '(null)' || fmtVal === 'null') return '';
                      return renderCell(rawVal) ?? renderHistoryValueTag(fn, fmtVal);
                    };
                    return isCreate ? (
                      <div key={`${fn}-${ri}`} style={{ ...historyCreateRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                        <div style={historyFieldLabelStyle}>{fn ? `${histField(fn)}:` : ''}</div>
                        <span title={nv ?? ''} style={historyNewValueStyle}>{renderVal(change.newValue, nv)}</span>
                      </div>
                    ) : (
                      <div key={`${fn}-${ri}`} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                        <div style={historyFieldLabelStyle}>{fn ? `${histField(fn)}:` : ''}</div>
                        <span title={ov ?? ''} style={historyOldValueStyle}>{renderVal(change.oldValue, ov)}</span>
                        <span style={historyArrowStyle}>→</span>
                        <span title={nv ?? ''} style={historyNewValueStyle}>{renderVal(change.newValue, nv)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs }}>
                  {reasons.map((r: string, ri: number) => (
                    <div key={ri} style={{ fontSize: fontSizeMd, color: textPrimary }}>{r}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}</div>
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await organizationService.list({ pageSize: 1000 });
        const data = r.data || [];
        setOrganizations(data);
        if (data.length > 0) {
          try {
            const p = await api.get('/users/me');
            const uOrgId = (p.data?.data ?? p.data)?.orgUnitId;
            const matchedOrgId = uOrgId ? (data.find((o: any) => o.id === uOrgId) ? uOrgId : data[0].id) : '__all__';
            setOrgUnit(matchedOrgId);
            defaultOrgUnitRef.current = matchedOrgId;
          } catch {
            setOrgUnit(data[0].id);
            defaultOrgUnitRef.current = data[0].id;
          }
        }
      } catch {}
    })();
    (async () => {
      try {
        const r = await userService.list({ pageSize: 1000 });
        const u = r.data || (r as any).content || [];
        const m = new Map<string, string>();
        u.forEach((x: any) => m.set(x.id, x.fullName || x.username || x.id));
        setUserMap(m);
      } catch {}
    })();
    (async () => {
      try {
        const r = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
        const s = r.data || (r as any).content || [];
        const m = new Map<string, string>();
        const imgMap = new Map<string, string>();
        s.forEach((x: any) => {
          m.set(x.id, x.name);
          if (x.image) imgMap.set(x.id, x.image);
        });
        setSymbolMap(m);
        setSymbolImageMap(imgMap);
      } catch {}
    })();
    (async () => {
      try {
        const r = await portCRUD.findAll({ page: 1, size: 1000 });
        (r.data || []).forEach((p: any) => portMap.set(p.id, p.portName));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (orgUnit !== undefined && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [orgUnit, initialLoadDone]);

  useEffect(() => {
    (async () => {
      try {
        const p: any = { page: 1, pageSize: 1000 };
        if (orgUnit && orgUnit !== '__all__') p.orgUnitId = orgUnit;
        const r = await portCRUD.search(p);
        setPortOptions((r.data || []).map((x: any) => ({ value: x.id, label: x.portName })));
      } catch {}
    })();
  }, [orgUnit]);

  const fetchCounts = useCallback(async (oid: string | undefined) => {
    try {
      const rs = await Promise.allSettled(
        TAB_STATUS_LIST.map((t) =>
          t.key === 'all'
            ? transferAreaCRUD.search({
                orgUnitId: oid && oid !== '__all__' ? oid : undefined,
                page: 1,
                pageSize: 1,
              })
            : transferAreaCRUD.search({
                approvalStatus: TAB_QUERY_MAP[t.key],
                orgUnitId: oid && oid !== '__all__' ? oid : undefined,
                page: 1,
                pageSize: 1,
              }),
        ),
      );
      const c: Record<string, number> = {};
      let childSum = 0;
      rs.forEach((r, i) => {
        const k = TAB_STATUS_LIST[i]?.key || 'all';
        const count = r.status === 'fulfilled' ? r.value.total : 0;
        c[k] = count;
        if (k !== 'all') childSum += count;
      });
      c['all'] = childSum;
      setTabCounts(c);
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const r = await transferAreaCRUD.search({
        orgUnitId: orgUnit && orgUnit !== '__all__' ? orgUnit : undefined,
        transferAreaName: filterName.trim() || undefined,
        transferAreaCode: filterCode.trim() || undefined,
        portId: filterPortId || undefined,
        provinceId: filterProvince,
        operationalStatus: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        operationalFunctions: filterOperationalFunctions.length > 0 ? filterOperationalFunctions.join(',') : undefined,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page,
        pageSize,
      });
      setDataSource(r.data);
      setTotal(r.total);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [
    orgUnit, filterName, filterCode, filterPortId, filterProvince, filterOperationalStatus,
    activeTab, filterOperationalFunctions, filterUpdatedFrom, filterUpdatedTo, page, pageSize,
  ]);

  useEffect(() => {
    if (initialLoadDone) void fetchData();
  }, [fetchData, initialLoadDone]);

  useEffect(() => {
    void fetchCounts(orgUnit);
  }, [orgUnit, fetchCounts]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchData();
  }, [fetchData]);

  const handleFilterReset = useCallback(() => {
    const oid = defaultOrgUnitRef.current || '__all__';
    setOrgUnit(oid);
    setFilterName('');
    setFilterCode('');
    setFilterPortId(undefined);
    setFilterProvince(undefined);
    setFilterOperationalStatus(undefined);
    setFilterOperationalFunctions([]);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  const openDetailDrawer = useCallback(async (record: TransferArea) => {
    setDetailDrawerVisible(true);
    setDetailRecord(record);
    setDetailFiles([]);
    try {
      const r = await transferAreaCRUD.listAttachments(record.id);
      setDetailFiles(r || []);
    } catch {
      setDetailFiles([]);
    }
    try {
      const fresh = await transferAreaCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch {}
  }, []);

  const dd2dms = (dd: number) => {
    if (dd == null || isNaN(dd)) return { d: 0, m: 0, s: 0 };
    const a = Math.abs(dd);
    return {
      d: Math.floor(a),
      m: Math.floor((a - Math.floor(a)) * 60),
      s: +((a - Math.floor(a) - Math.floor((a - Math.floor(a)) * 60) / 60) * 3600).toFixed(2),
    };
  };

  const openDeleteModal = useCallback((record: TransferArea) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await transferAreaCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa khu chuyển tải');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts, orgUnit]);

  const handleApprove = useCallback(async (record: TransferArea, content?: string) => {
    try {
      if (record.approvalStatus === 'APPROVED_LEVEL1') {
        await transferAreaApproval.approveC2(record.id, content);
      } else {
        await transferAreaApproval.approveC1(record.id, content);
      }
      toast.success(record.approvalStatus === 'APPROVED_LEVEL1' ? 'Đã phê duyệt cấp Cục' : 'Đã phê duyệt cấp Cảng vụ/Chi cục');
      setApproveModalOpen(false);
      setApprovingRecord(null);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Phê duyệt thất bại');
    }
  }, [fetchData, fetchCounts, orgUnit]);

  const handleSubmitApproval = useCallback((record: TransferArea) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmitApproval = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await transferAreaApproval.submit(submittingRecord.id);
      toast.success('Đã gửi phê duyệt');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Gửi thất bại');
    }
  }, [submittingRecord, fetchData, fetchCounts, orgUnit]);

  const openRejectModal = useCallback((record: TransferArea) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectError('');
    setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    if (!rejectReason || !rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await transferAreaApproval.rejectStage(rejectingRecord.id, rejectReason.trim(), rejectingRecord.approvalStatus);
      toast.success('Từ chối thành công');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setRejectError('');
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, orgUnit]);

  const headerActions = useMemo(() => {
    const acts: Array<{ key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon?: React.ReactNode; onClick: () => void }> = [];
    if (hasPerm('transferarea:create')) {
      acts.push({
        key: 'create',
        label: 'Thêm mới',
        icon: icons.create,
        variant: 'primary',
        onClick: () => {
          setEditTransferAreaId(undefined);
          setEditBaseStatus(undefined);
          createForm.resetFields();
          setCreateDrawerVisible(true);
        },
      });
    }
    return acts;
  }, [hasPerm, createForm]);

  const filterContent = (
    <>
      <style>{`.transfer-area-filter .ant-select-selector { border-radius: 999px !important; } .transfer-area-filter .ant-select-content { flex-wrap: nowrap !important; overflow: hidden; } .transfer-area-filter .ant-select-content-item { max-width: 45% !important; } .transfer-area-filter .ant-select-selection-item { border-radius: 999px !important; }`}</style>
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
          value={orgUnit}
          onChange={(v) => { setOrgUnit(v); setPage(1); }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên khu chuyển tải</div>
        <Input style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Tìm theo tên khu chuyển tải"
          value={filterName} onChange={e => setFilterName(e.target.value)}
          onPressEnter={handleFilterApply}
          allowClear prefix={<SearchOutlined style={{ color: textTertiary }} />} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn tình trạng" allowClear
          value={filterOperationalStatus} onChange={v => { setFilterOperationalStatus(v); setPage(1); }}
          options={[
            { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
            { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
            { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
          ]} />
      </div>
      {filterCollapsed && (<>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn cảng biển" allowClear
            value={filterPortId} onChange={v => { setFilterPortId(v); setPage(1); }}
            options={portOptions} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã khu chuyển tải</div>
          <Input style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Tìm theo mã khu chuyển tải"
            value={filterCode} onChange={e => setFilterCode(e.target.value)}
            onPressEnter={handleFilterApply}
            allowClear prefix={<SearchOutlined style={{ color: textTertiary }} />} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Công năng khai thác</div>
          <Select mode="multiple" className="transfer-area-filter" style={{ width: '100%', borderRadius: radiusPill, fontSize: fontSizeMd }} allowClear showSearch optionFilterProp="label" maxTagCount="responsive" placeholder="Công năng khai thác"
            options={OPERATIONAL_FUNCTIONS_OPTIONS} value={filterOperationalFunctions} onChange={v => { setFilterOperationalFunctions(v || []); setPage(1); }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm</div>
          <Select style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }} placeholder="Chọn tỉnh/thành phố" allowClear showSearch
            value={filterProvince} onChange={v => { setFilterProvince(v); setPage(1); }}
            filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            options={VIETNAM_PROVINCES.map((p, idx) => ({ value: idx + 1, label: p }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
          <DatePicker.RangePicker format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} allowClear
            value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
            onChange={(dates) => {
              setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined);
              setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined);
              setPage(1);
            }}
            style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
        </div>
      </>)}
    </>
  );

  const rowActions = useCallback((record: TransferArea) => {
    const actions: any[] = [{ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) }];
    const st = record.approvalStatus || '';
    const editable = canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'transferarea', extraApprovePerms: ['transferarea:approve'] });
    if (editable) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => {
          setEditTransferAreaId(record.id);
          setEditBaseStatus(record.approvalStatus);
          setCreateDrawerVisible(true);
        },
      });
    }
    if (['DRAFT', 'NHAP'].includes(st) && hasPerm('transferarea:update')) {
      actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    }
    if (['REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && hasPerm('transferarea:update')) {
      actions.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    }
    if (hasPerm('transferarea:history')) {
      actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
    }
    const canApproveC1 = hasPerm('transferarea:approvec1') || hasPerm('transferarea:approve');
    const canApproveC2 = hasPerm('transferarea:approvec2') || hasPerm('transferarea:approve');
    if (canApproveC1 && (st === 'PENDING_APPROVAL' || st === 'CHO_PHE_DUYET')) {
      actions.push({ key: 'approve_c1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
      actions.push({ key: 'reject_c1', label: 'Từ chối cấp Cảng vụ/Chi cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
    }
    if (canApproveC2 && st === 'APPROVED_LEVEL1') {
      actions.push({ key: 'approve_c2', label: 'Phê duyệt cấp Cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
      actions.push({ key: 'reject_c2', label: 'Từ chối cấp Cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
    }
    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'transferarea' })) {
      actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
    }
    return actions;
  }, [hasPerm, openDetailDrawer, openHistory, handleSubmitApproval, openRejectModal, openDeleteModal]);

  const auditColumns = useMemo(() => {
    if (!isAuditViewer) return [];
    return [
      {
        label: 'Cán bộ gửi Phê duyệt', dataIndex: 'submittedForApprovalAt', key: 'submittedForApprovalAt', width: 230, sortable: true,
        render: (v: string | null, record: TransferArea) => {
          const name = userMap.get(record.submittedForApprovalBy || '') || record.submittedForApprovalBy || '';
          const date = formatDate(v);
          if (!name && !date) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && date && <br />}
              {date && <span style={{ opacity: 0.85 }}>{date}</span>}
            </div>
          );
        },
      },
      {
        label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', dataIndex: 'portAuthorityApprovedAt', key: 'portAuthorityApprovedAt', width: 350, sortable: true,
        render: (v: string | null, record: TransferArea) => {
          const name = userMap.get(record.portAuthorityApprovedBy || '') || record.portAuthorityApprovedBy || '';
          const date = formatDate(v);
          if (!name && !date) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && date && <br />}
              {date && <span style={{ opacity: 0.85 }}>{date}</span>}
            </div>
          );
        },
      },
      {
        label: 'Cán bộ phê duyệt cấp Cục', dataIndex: 'departmentApprovedAt', key: 'departmentApprovedAt', width: 260, sortable: true,
        render: (v: string | null, record: TransferArea) => {
          const name = userMap.get(record.departmentApprovedBy || '') || record.departmentApprovedBy || '';
          const date = formatDate(v);
          if (!name && !date) return '';
          return (
            <div>
              {name && <span style={{ fontWeight: fontWeightBold }}>{name}</span>}
              {name && date && <br />}
              {date && <span style={{ opacity: 0.85 }}>{date}</span>}
            </div>
          );
        },
      },
    ];
  }, [isAuditViewer, userMap]);

  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'orgUnitId') return resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(r.orgUnitId || '') || '';
    if (field === 'portId') return portOptions.find(o => o.value === r.portId)?.label ?? r.portId ?? '';
    if (field === 'operationalFunctions') return formatOperationalFunctions(r.operationalFunctions);
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
    return r[field] ?? '';
  }, [organizations, orgMap, portOptions]);

  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        label: 'STT', key: 'stt', width: 60, fixed: 'left' as const, align: 'center' as const,
        render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + i + 1}</span>,
      },
      {
        label: 'Tên/Mã khu chuyển tải', key: 'transferAreaName', dataIndex: 'transferAreaName', width: 240, fixed: 'left' as const, sortable: true,
        render: (v: string, record: TransferArea) => (
          <div>
            <a title={v} onClick={() => openDetailDrawer(record)} style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v}
            </a>
            <span style={{ ...cellSubtitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.transferAreaCode || ''}
            </span>
          </div>
        ),
      },
      {
        label: 'Đơn vị quản lý', key: 'orgUnitId', dataIndex: 'orgUnitId', width: 260, sortable: true,
        render: (_v: string | null, record: TransferArea) => (
          <span style={{ fontWeight: fontWeightBold }}>
            {resolveOrgLevel2Name(organizations, record.orgUnitId) || orgMap.get(record.orgUnitId || '') || ''}
          </span>
        ),
      },
      {
        label: 'Thuộc cảng biển', key: 'portId', dataIndex: 'portId', width: 200, sortable: true,
        render: (v: string | null) => portOptions.find(o => o.value === v)?.label || v || '',
      },
      {
        label: 'Địa điểm (Tỉnh/Thành phố)', key: 'provinceId', dataIndex: 'provinceId', width: 220, sortable: true,
        render: (v: number | null) => (v ? VIETNAM_PROVINCES[v - 1] : ''),
      },
      {
        label: 'Công năng khai thác', key: 'operationalFunctions', dataIndex: 'operationalFunctions', width: 240, ellipsis: true, sortable: true,
        render: (v?: string) => (
          <span title={formatOperationalFunctions(v)} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
            {formatOperationalFunctions(v)}
          </span>
        ),
      },
      {
        label: 'Tình trạng', key: 'operationalStatus', dataIndex: 'operationalStatus', width: 210, sortable: true,
        render: (v: string | null) => {
          const s = v ? OPERATIONAL_STYLE_MAP[v] : null;
          return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : null;
        },
      },
      {
        label: 'Trạng thái', key: 'approvalStatus', dataIndex: 'approvalStatus', width: 260, sortable: true,
        render: (v: string) => {
          const s = v ? (APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v?.toUpperCase()]) : null;
          return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : null;
        },
      },
      {
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 200,
        sortable: true,
        render: (v: string, record: TransferArea) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || ''}</span>
            <br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ),
      },
    ];

    const allColumns = [...baseColumns, ...auditColumns];
    return allColumns.map((col) => ({
      ...col,
      sortOrder: col.sortable && col.key === sortField ? sortOrder : undefined,
    }));
  }, [
    page, pageSize, sortField, sortOrder, openDetailDrawer, organizations, orgMap, portOptions, userMap, auditColumns,
  ]);

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5 } as unknown as ThemeToken}>
      <div className="transfer-area-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .transfer-area-page-wrapper,
          .transfer-area-page-wrapper .ant-table,
          .transfer-area-page-wrapper .ant-table-cell,
          .transfer-area-page-wrapper .ant-table-thead > tr > th,
          .transfer-area-page-wrapper .ant-table-tbody > tr > td,
          .transfer-area-page-wrapper .ant-input,
          .transfer-area-page-wrapper .ant-select,
          .transfer-area-page-wrapper .ant-select-selection-item,
          .transfer-area-page-wrapper .ant-select-item-option-content,
          .transfer-area-page-wrapper .ant-picker,
          .transfer-area-page-wrapper .ant-picker-input > input,
          .transfer-area-page-wrapper .ant-btn,
          .transfer-area-page-wrapper .ant-pagination,
          .transfer-area-page-wrapper .ant-pagination-item,
          .transfer-area-page-wrapper .ant-pagination-total-text,
          .transfer-area-page-wrapper .ant-breadcrumb,
          .transfer-area-page-wrapper .ant-form-item-label > label,
          .transfer-area-page-wrapper .ant-tabs-tab,
          .transfer-area-page-wrapper .transfer-area-drawer-scope,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-drawer-content,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-tabs-tab,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-input,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-select,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-btn,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-table,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-table-cell,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-table-thead > tr > th,
          .transfer-area-page-wrapper .transfer-area-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
          /* ── Drawer tạo/sửa/chi tiết (antd Drawer render panel ở body portal, ngoài .transfer-area-page-wrapper) ── */
          .transfer-area-drawer-scope,
          .transfer-area-drawer-scope .ant-drawer-content,
          .transfer-area-drawer-scope .ant-tabs-tab,
          .transfer-area-drawer-scope .ant-drawer-content .ant-form-item-label > label,
          .transfer-area-drawer-scope .chk-detail-label,
          .transfer-area-drawer-scope .chk-detail-value,
          .transfer-area-drawer-scope .ant-table,
          .transfer-area-drawer-scope .ant-table-cell,
          .transfer-area-drawer-scope .ant-table-thead > tr > th,
          .transfer-area-drawer-scope .ant-table-tbody > tr > td,
          .transfer-area-drawer-scope .ant-input,
          .transfer-area-drawer-scope .ant-select,
          .transfer-area-drawer-scope .ant-btn {
            font-size: 13.5px !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed]) {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            justify-content: safe center !important;
            align-items: center !important;
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 #f8fafc !important;
            padding: 2px 16px 6px 16px !important;
            gap: 20px !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .transfer-area-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .transfer-area-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
          @media (max-width: 1024px) {
            .transfer-area-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .transfer-area-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
          }
          @media (max-width: 640px) {
            .transfer-area-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
              padding: 8px 0 !important;
            }
            .transfer-area-drawer-scope .chk-detail-label {
              width: 100% !important;
            }
            .transfer-area-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
          .transfer-area-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label {
            height: auto !important;
            min-height: 44px !important;
            align-items: flex-start !important;
          }
          .transfer-area-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label > label {
            height: auto !important;
            white-space: normal !important;
            line-height: 1.45 !important;
            overflow-wrap: break-word;
          }
        `}</style>
        <ScreenHeader
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý khu chuyển tải' }]}
          actions={headerActions}
        />
        <FilterTableLayout
          filterContent={filterContent}
          statusTabs={TAB_STATUS_LIST.map(t => ({ key: t.key, label: t.label, color: t.color, count: tabCounts[t.key] ?? 0, active: activeTab === t.key }))}
          onStatusTabChange={handleTabChange}
          onFilterApply={handleFilterApply}
          onFilterReset={handleFilterReset}
          filterCollapsed={filterCollapsed}
          onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
          loading={isLoading}
          error={isError}
          onRetry={() => void fetchData()}
        >
          <DataTable
            columns={columns}
            dataSource={[...dataSource].sort((a: any, b: any) => {
              if (!sortField) return 0;
              if (sortField === 'stt') {
                const arr = [...dataSource];
                return sortOrder === 'descend' ? (arr.reverse(), 0) : 0;
              }
              const av = getSortValue(a, sortField);
              const bv = getSortValue(b, sortField);
              const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'vi');
              return sortOrder === 'ascend' ? c : -c;
            })}
            rowKey="id"
            rowActions={rowActions}
            loading={false}
            onSort={(k: string, o: 'asc' | 'desc') => {
              setSortField(k);
              setSortOrder(o === 'asc' ? 'ascend' : 'descend');
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

        {/* ── Single Create / Edit Drawer (Merged pattern from PierListPage) ── */}
        <Drawer
          {...drawerProps}
          rootClassName="transfer-area-drawer-scope"
          className="transfer-area-drawer-scope"
          width="min(920px, 96vw)"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editTransferAreaId ? 'Chỉnh sửa thông tin Khu chuyển tải' : 'Thêm mới Khu chuyển tải'}</span>}
          open={createDrawerVisible}
          destroyOnHidden
          onClose={() => { setCreateDrawerVisible(false); createForm.resetFields(); }}
          afterOpenChange={(open) => { if (!open) { setEditTransferAreaId(undefined); setEditBaseStatus(undefined); } }}
          extra={<Button type="text" onClick={() => { setCreateDrawerVisible(false); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
          footer={
            <div style={drawerFooterStyle}>
              {(() => {
                const st = !editTransferAreaId ? 'DRAFT' : (editBaseStatus ? normalizeApprovalStatus(editBaseStatus) : 'DRAFT');
                if (st === 'APPROVED') {
                  return (
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('approve'); transferAreaFormRef.current?.submit('APPROVED'); }}
                      loading={submitting && actionType === 'approve'}
                      style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}
                    >
                      Lưu và phê duyệt
                    </Button>
                  );
                }
                if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2') {
                  return (
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('submit'); transferAreaFormRef.current?.submit('SUBMIT'); }}
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
                      onClick={() => { setActionType('draft'); transferAreaFormRef.current?.submit('DRAFT'); }}
                      loading={submitting && actionType === 'draft'}
                      style={outlineButtonStyle}
                    >
                      Lưu tạm
                    </Button>
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('submit'); transferAreaFormRef.current?.submit('SUBMIT'); }}
                      loading={submitting && actionType === 'submit'}
                      style={primaryButtonStyle}
                    >
                      Lưu và gửi phê duyệt
                    </Button>
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('approve'); transferAreaFormRef.current?.submit('APPROVED'); }}
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
        >
          <Form form={createForm} layout="vertical">
            <style>{requiredMarkStyle}</style>
            <TransferAreaForm
              ref={transferAreaFormRef}
              form={createForm}
              id={editTransferAreaId}
              onFinish={() => {
                setCreateDrawerVisible(false);
                void fetchData();
                void fetchCounts(orgUnit);
              }}
              onSubmittingChange={setSubmitting}
            />
          </Form>
        </Drawer>

        {/* ── Detail Drawer (1000px width matching Pier Detail) ── */}
        <Drawer
          {...drawerProps}
          rootClassName="transfer-area-drawer-scope"
          className="transfer-area-drawer-scope"
          size={1000}
          title={<span style={drawerTitleStyle}>Chi tiết khu chuyển tải{detailRecord ? ` - ${detailRecord.transferAreaName}` : ''}</span>}
          open={detailDrawerVisible}
          onClose={() => { setDetailDrawerVisible(false); setDetailRecord(null); }}
          extra={<Button type="text" onClick={() => { setDetailDrawerVisible(false); setDetailRecord(null); }} style={drawerCloseBtnStyle}>✕</Button>}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          footer={null}
        >
          {detailRecord && (
            <TransferAreaDetailContent
              selectedRecord={detailRecord}
              orgMap={orgMap}
              organizations={organizations}
              symbolMap={symbolMap}
              symbolImageMap={symbolImageMap}
              portOptions={portOptions}
              userMap={userMap}
              detailFiles={detailFiles}
              ddToDms={dd2dms}
              approvalStyleMap={APPROVAL_STYLE_MAP}
              operationalStyleMap={OPERATIONAL_STYLE_MAP}
              operationPlanList={(detailRecord as any)?.operationPlanList}
              maintenancePlanList={(detailRecord as any)?.maintenancePlanList}
              incidentList={(detailRecord as any)?.incidentList}
            />
          )}
        </Drawer>

        {/* ── DeleteConfirmModal (Shared component) ── */}
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
          itemType="khu chuyển tải"
          itemName={deletingRecord?.transferAreaName}
          itemCode={deletingRecord?.transferAreaCode}
        />

        {/* ── Reject Modal ── */}
        <Modal
          styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
          open={rejectModalOpen}
          onCancel={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
          footer={[
            <Button
              key="cancel"
              onClick={() => { setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError(''); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
            >
              Hủy
            </Button>,
            <Button
              key="reject"
              type="primary"
              danger
              onClick={handleConfirmReject}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
            >
              Xác nhận từ chối
            </Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho khu chuyển tải:</p>
            {rejectingRecord && (
              <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
                <strong style={{ color: textPrimary }}>{rejectingRecord.transferAreaCode} — {rejectingRecord.transferAreaName}</strong>
              </p>
            )}
            <Input.TextArea
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
              rows={3}
              maxLength={500}
              style={{ borderRadius: 8, fontSize: fontSizeMd, borderColor: rejectError ? statusCritical : undefined }}
            />
            {rejectError ? <div style={{ marginTop: 4 }}><span style={{ color: statusCritical, fontSize: fontSizeMd }}>{rejectError}</span></div> : null}
          </div>
        </Modal>

        {/* ── Submit Approval Modal ── */}
        <Modal
          styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Gửi phê duyệt</span>}
          open={submitModalOpen}
          onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
          footer={[
            <Button
              key="cancel"
              onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}
            >
              Hủy
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={confirmSubmitApproval}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
            >
              Xác nhận
            </Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
              Xác nhận gửi phê duyệt khu chuyển tải <strong>{submittingRecord?.transferAreaName}</strong>?
            </p>
          </div>
        </Modal>

        {/* ── Approval Modal (Shared component) ── */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
          onConfirm={(content) => { if (approvingRecord) handleApprove(approvingRecord, content); }}
          onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        />

        {/* ── History Drawer (Timeline matching Pier / Port standard) ── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="transfer-area-drawer-scope"
          className="transfer-area-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  Lịch sử thay đổi — {historyTarget?.transferAreaName || historyTarget?.transferAreaCode || ''}
                </span>
                <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                  Tổng cộng {Array.isArray(filteredHistory) ? filteredHistory.length : 0}
                </span>
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
          <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
          <div style={{ flexShrink: 0 }}>
            {!historyLoading && (
              <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
                <Input
                  placeholder="Tìm kiếm nội dung thay đổi..."
                  allowClear
                  value={historyFilters.keyword || ''}
                  onChange={(e) => setHistoryFilters((p) => ({ ...p, keyword: e.target.value }))}
                  style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
                />
                <DatePicker
                  placeholder="Từ ngày"
                  classNames={{ popup: { root: 'history-dt-popup' } }}
                  value={historyFilters.fromDate ? dayjs(historyFilters.fromDate) : null}
                  onChange={(d) => setHistoryFilters((p) => ({ ...p, fromDate: d ? d.format('YYYY-MM-DD') : '' }))}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <DatePicker
                  placeholder="Đến ngày"
                  classNames={{ popup: { root: 'history-dt-popup' } }}
                  value={historyFilters.toDate ? dayjs(historyFilters.toDate) : null}
                  onChange={(d) => setHistoryFilters((p) => ({ ...p, toDate: d ? d.format('YYYY-MM-DD') : '' }))}
                  style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                  format="DD/MM/YYYY"
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
                  onClick={() => {}}
                >
                  Tìm kiếm
                </Button>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {historyLoading ? (
              <div style={{ padding: `${spaceMd}px 0` }}>
                <LoadingSkeleton rows={5} />
              </div>
            ) : historyRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
              </div>
            ) : hasActiveHistoryFilter && filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
                <SearchOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
                <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Không tìm thấy kết quả phù hợp</div>
              </div>
            ) : (
              renderTransferAreaHistoryTimeline(filteredHistory)
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
