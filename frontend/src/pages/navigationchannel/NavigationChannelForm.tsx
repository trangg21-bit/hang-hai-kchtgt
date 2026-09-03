import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Card,
  Table,
  Spin,
  Empty,
  Breadcrumb,
  Modal,
  Row,
  Col,
  Tabs,
  Upload,
  Space,
} from 'antd';
import type { UploadFile } from 'antd';
import { PlusOutlined, DeleteOutlined, FileOutlined, InboxOutlined, EnvironmentOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from '../../components/ToastNotification';
import { navigationChannelCRUD, navigationChannelApproval } from '../../services/navigationChannelService';
import { organizationService } from '../../services/organizationService';
import { vtsSystemCRUD } from '../../services/vtsSystemService';
import { symbolService } from '../../services/symbolService';
import { userService } from '../../services/userService';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { OrgUnitTreeSelect } from '../../components/org-unit';
import type {
  NavigationChannelResponse,
  CreateNavigationChannelRequest,
  UpdateNavigationChannelRequest,
  ApprovalRequest,
  ApprovalStatus,
  ConditionStatus,
  ChannelRouteDetailRequest,
} from '../../types/navigationChannel';
import { CONDITION_STATUS_OPTIONS, GIS_GEOMETRY_TYPE_OPTIONS } from '../../types/navigationChannel';
import { VIETNAM_PROVINCE_OPTIONS } from '../../types/common';
import { useAuthStore } from '../../store/authStore';
import ApprovalActionBar from '../../components/shared/ApprovalActionBar';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import AppDrawer from '../../components/shared/AppDrawer';
import DetailTable from '../../components/shared/DetailTable';
import {
  inputStyle,
  selectStyle,
  formFieldStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  spaceLg,
  spaceMd,
  spaceSm,
  spaceXs,
  spaceXl,
  spaceFormField,
  textPrimary,
  textSecondary,
  textTertiary,
  fontWeightBold,
  fontWeightMedium,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  cardStyle,
  drawerTabBarStyle,
  drawerTabContentStyle,
  radiusPill,
  radiusMd,
  surfaceCard,
  borderDefault,
  actionPrimary,
  statusCritical,
  statusAttention,
  statusOperational,
  statusDraft,
  tableRowHoverBgFixed,
  readonlyInputStyle,
  statusBadgeStyle,
  ddToDms,
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
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';

export interface NavigationChannelFormProps {
  open?: boolean;
  editId?: string | null;
  mode?: 'create' | 'edit' | 'detail';
  onCancel?: () => void;
  onSuccess?: () => void;
}

const trimString = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;

// Loại tuyến luồng — mapping có sẵn trong codebase cũ (channelRouteType 1/2)
const ROUTE_TYPE_OPTIONS = [
  { value: 1, label: 'Công cộng' },
  { value: 2, label: 'Chuyên dùng' },
];

// ── CHK: label chuẩn (navy, đậm, 13px) ────────────────────────────────
const labelProps = (text: string) => ({
  label: <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>{text}</span>,
});

// ── GPS DMS (chuẩn VTS CHK) ───────────────────────────────────────────
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

type DmsPoint = {
  latD: number | null; latM: number | null; latS: number | null;
  lngD: number | null; lngM: number | null; lngS: number | null;
};
const emptyDmsPoint = (): DmsPoint => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null });

// Parse WKT (coordinates) — MULTIPOINT regex ĐÚNG bắt đủ N điểm (recipe #19)
const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    if (wkt.startsWith('LINESTRING(')) { const m = wkt.match(/LINESTRING\s*\(([^)]+)\)/); if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); }
    if (wkt.startsWith('POLYGON((')) { const m = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/); if (m) { const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude)); if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude) pts.pop(); return pts; } }
    const mm = wkt.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/); if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = wkt.match(/POINT\s*\(([\d.\-]+)\s+([\d.\-]+)\)/); if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

const dmsUnitStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: tableRowHoverBgFixed, border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, height: 32, fontSize: fontSizeSm, color: textTertiary };
const dmsUnitEndStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '0 3px', background: tableRowHoverBgFixed, border: `1px solid ${borderDefault}`, borderLeft: 0, height: 32, borderRadius: '0 999px 999px 0', fontSize: fontSizeSm, color: textTertiary };

/** Nhóm 3 ô nhập Độ/Phút/Giây dùng chung cho bảng tọa độ GPS (chuẩn VTS CHK: viên thuốc 999px). */
const renderDmsGroup = (
  dVal: number | null | undefined,
  mVal: number | null | undefined,
  sVal: number | null | undefined,
  maxDeg: number,
  onChange: (d: number | null | undefined, m: number | null | undefined, s: number | null | undefined) => void,
) => {
  return (
    <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}>
      <InputNumber value={dVal} min={0} max={maxDeg} placeholder="Độ" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(v, mVal, sVal)} style={{ flex: 1, minWidth: 0, borderRadius: '999px 0 0 999px', height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>°</span>
      <InputNumber value={mVal} min={0} max={59} placeholder="Phút" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal, v, sVal)} style={{ flex: 1, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitStyle}>'</span>
      <InputNumber value={sVal} min={0} max={59.99} step={0.01} placeholder="Giây" onFocus={(e) => e.currentTarget.select()} onChange={(v) => onChange(dVal, mVal, v)} style={{ flex: 1.2, minWidth: 0, height: 32 }} controls={false} />
      <span style={dmsUnitEndStyle}>"</span>
    </Space.Compact>
  );
};

// ── History helpers (chuẩn VTS CHK) ───────────────────────────────────
const historyFieldLabels: Record<string, string> = {
  orgUnitId: 'Đơn vị quản lý', seaportId: 'Thuộc cảng biển', operatingUnitId: 'Đơn vị vận hành',
  channelCode: 'Mã luồng hàng hải', channelName: 'Tên luồng hàng hải',
  provinceId: 'Địa điểm (Tỉnh/TP)', detailedLocation: 'Địa điểm chi tiết', conditionStatus: 'Tình trạng',
  managementStation: 'Trạm quản lý luồng', stationCount: 'Số lượng trạm', stationStaffCount: 'Số lượng nhân sự tại trạm',
  stationAreaSquareMeters: 'Diện tích trạm (m²)', latestStationRepairMonth: 'Sửa chữa trạm gần nhất',
  latestMaintenanceYear: 'Năm bảo trì gần nhất', latestDredgingVolumeCubicMeters: 'KL nạo vét (m³)',
  buoyCount: 'Số lượng phao', beaconCount: 'Số lượng tiêu', notes: 'Ghi chú',
  announcementDecisionNumber: 'Quyết định công bố số', announcementDecisionDate: 'Ngày ra quyết định',
  announcementDecisionIssuer: 'Đơn vị ra quyết định',
  protectionScopeMeters: 'Phạm vi bảo vệ luồng (m)', protectionNotes: 'Ghi chú phạm vi bảo vệ',
  geometryType: 'Loại đối tượng', mapIconId: 'Biểu tượng', coordinateReferenceSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị', mapSymbolId: 'Biểu tượng', approvalStatus: 'Trạng thái',
  submittedAt: 'Ngày gửi phê duyệt', submittedBy: 'Người gửi phê duyệt',
  level1ApprovedAt: 'Ngày duyệt Cảng vụ', level1ApprovedBy: 'Người duyệt Cảng vụ',
  level1ApprovalContent: 'Nội dung duyệt Cảng vụ',
  level2ApprovedAt: 'Ngày duyệt Cục', level2ApprovedBy: 'Người duyệt Cục',
  level2ApprovalContent: 'Nội dung duyệt Cục', rejectionReason: 'Lý do từ chối',
  updatedAt: 'Ngày cập nhật', updatedBy: 'Cán bộ cập nhật',
  'Trạng thái': 'Hành động',
};

function historyFieldName(fn: string): string { return historyFieldLabels[fn] || fn; }

/** Badge thao tác cho lịch sử (chuẩn VTS CHK): phân biệt Thêm mới / Cập nhật / Phê duyệt / Từ chối / Trình duyệt. */
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
    if (nv === 'cho cuc duyet' || nv.includes('da phe duyet cap 1') || nv.includes('approved_level1') || nv.includes('cuc duyet')) {
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
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
  }
  if (level === 2 || String(item.approvalLevel).includes('LEVEL_2') || rawReason.includes('cấp 2') || rawReason.includes('cap 2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
    if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || rawReason.includes('từ chối') || rawReason.includes('tu choi') || rawReason.includes('trả về') || rawReason.includes('tra ve')) {
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
  const raw = item?.approvedByName || item?.changedByName || item?.performedByName || item?.userName || item?.actorName || item?.approvedBy || item?.changedBy || item?.performedBy || '';
  return raw || '—';
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
    const displayField = historyFieldName(field);
    const oldAssigned = oldAssignments.get(normalizeHistoryKey(field)) ?? oldAssignments.get(normalizeHistoryKey(displayField));
    const newAssigned = newAssignments.get(normalizeHistoryKey(field)) ?? newAssignments.get(normalizeHistoryKey(displayField));
    const oldParts = oldValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
    const newParts = newValue?.split(';').map((part) => part.trim()).filter(Boolean) || [];
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
    if (normVal === 'cho cuc duyet' || normVal === 'approved_level1' || normVal.includes('cap 1') || normVal.includes('cuc duyet')) {
      return (<span style={statusBadgeStyle('#0082fb')}>{val}</span>);
    }
    if (normVal === 'cho cang vu duyet' || normVal === 'cho phe duyet' || normVal === 'cho duyet' || normVal === 'pending' || normVal === 'pending_approval' || normVal === 'proposed' || normVal.includes('cang vu')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    if (normVal === 'tu choi' || normVal.includes('rejected') || normVal.includes('tra ve')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
    return (<span style={statusBadgeStyle(statusDraft)}>{val}</span>);
  }

  if (normKey === 'conditionstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    if (normVal.includes('hoat dong tot') || normVal.includes('good') || normVal.includes('operational') || normVal.includes('hoat dong')) {
      return (<span style={statusBadgeStyle(statusOperational)}>{val}</span>);
    }
    if (normVal.includes('can bao duong') || normVal.includes('warning') || normVal.includes('maintenance') || normVal.includes('bao tri')) {
      return (<span style={statusBadgeStyle(statusAttention)}>{val}</span>);
    }
    if (normVal.includes('hong') || normVal.includes('ngung') || normVal.includes('dung') || normVal.includes('damaged') || normVal.includes('critical')) {
      return (<span style={statusBadgeStyle(statusCritical)}>{val}</span>);
    }
    if (normVal.includes('xay dung') || normVal.includes('under_construction')) {
      return (<span style={statusBadgeStyle(actionPrimary)}>{val}</span>);
    }
  }

  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

function historyFieldValue(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  seaportMap?: Map<string, string>,
  userMap?: Map<string, string>,
): string {
  if (!val || val === '(null)' || val === 'null') return '(trống)';
  if (fn === 'orgUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'operatingUnitId' && orgMap) { const full = orgMap.get(val); return full ? full.split(' - ').pop() || full : val; }
  if (fn === 'seaportId' && seaportMap) return seaportMap.get(val) || val;
  if (fn === 'provinceId') {
    const n = Number(val);
    if (!isNaN(n)) {
      const p = VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(n));
      if (p) return p.label;
    }
    return val;
  }
  if (fn === 'conditionStatus') {
    const m: Record<string, string> = { OPERATIONAL: 'Đang hoạt động', STOPPED: 'Dừng hoạt động', MAINTENANCE: 'Đang bảo trì', UNDER_CONSTRUCTION: 'Đang xây dựng' };
    return m[val.toUpperCase()] || val;
  }
  if (fn === 'approvalStatus') {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm', NHAP: 'Lưu tạm', PENDING_APPROVAL: 'Chờ Cảng vụ duyệt',
      APPROVED_LEVEL1: 'Chờ Cục duyệt', APPROVED: 'Đã duyệt', DA_PHE_DUYET: 'Đã duyệt',
      REJECTED: 'Từ chối', REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ', REJECTED_LEVEL2: 'Từ chối cấp Cục',
    };
    return m[val.toUpperCase()] || val;
  }
  if (fn === 'updatedBy' || fn === 'submittedBy' || fn === 'level1ApprovedBy' || fn === 'level2ApprovedBy') {
    if (userMap) return userMap.get(val) || val;
  }
  return val;
}

const HISTORY_FIELD_ORDER = [
  'orgUnitId', 'seaportId', 'operatingUnitId', 'channelCode', 'channelName', 'provinceId', 'detailedLocation',
  'conditionStatus', 'managementStation', 'stationCount', 'stationStaffCount', 'stationAreaSquareMeters',
  'latestStationRepairMonth', 'latestMaintenanceYear', 'latestDredgingVolumeCubicMeters', 'buoyCount', 'beaconCount',
  'notes', 'announcementDecisionNumber', 'announcementDecisionDate', 'announcementDecisionIssuer',
  'protectionScopeMeters', 'protectionNotes', 'geometryType', 'mapIconId', 'mapSymbolId',
  'coordinateReferenceSystem', 'displayRule',
];

// Parse tọa độ mảng {longitude, latitude} → {lat, lng} cho chi tiết / GIS view
const parseDetailCoords = (rec: NavigationChannelResponse | null): Array<{ lat: number; lng: number }> => {
  const arr = Array.isArray(rec?.coordinates) ? rec!.coordinates : [];
  return arr.map((c) => ({ lat: Number(c.latitude), lng: Number(c.longitude) })).filter((c) => !isNaN(c.lat) && !isNaN(c.lng));
};

export default function NavigationChannelForm({ open, editId, mode, onCancel, onSuccess }: NavigationChannelFormProps = {}) {
  return (
    <ThemeTokenProvider tokens={themeTokenChk}>
      <NavigationChannelFormInner open={open} editId={editId} mode={mode} onCancel={onCancel} onSuccess={onSuccess} />
    </ThemeTokenProvider>
  );
}

function NavigationChannelFormInner({ open, editId, mode, onCancel, onSuccess }: NavigationChannelFormProps = {}) {
  const navigate = useNavigate();
  const routeParams = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const currentUser = useAuthStore((s) => s.user);
  const userPermissions = currentUser?.permissions || [];

  const isIframe = window.self !== window.top;
  const isModalMode = open !== undefined;
  const id = isModalMode ? (editId || undefined) : routeParams.id;
  const isEditMode = isModalMode ? (mode === 'edit') : searchParams.get('mode') === 'edit';
  const isDetailMode = isModalMode ? (mode === 'detail') : (!!id && !isEditMode);
  const isCreateMode = isModalMode ? (mode === 'create') : !id;

  const [record, setRecord] = useState<NavigationChannelResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [seaportOptions, setSeaportOptions] = useState<{ id: string; portCode?: string; portName?: string }[]>([]);
  const [symbolOptions, setSymbolOptions] = useState<{ value: string; label: string }[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  const [routeRows, setRouteRows] = useState<ChannelRouteDetailRequest[]>([]);
  const [coordinateList, setCoordinateList] = useState<DmsPoint[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [activeTabKey, setActiveTabKey] = useState('basic-info');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gisModalOpen, setGisModalOpen] = useState(false);
  const [gpsPage, setGpsPage] = useState(1);
  const [filePage, setFilePage] = useState(1);

  const watchedGeometryType = Form.useWatch('geometryType', form);
  const [gisModalOpenDetail, setGisModalOpenDetail] = useState(false);

  // WKT cho GIS view-mode (chi tiết)
  const gisViewWkt = useMemo(() => {
    if (!record) return '';
    const pts = parseDetailCoords(record);
    if (pts.length === 0) return '';
    const rawWkt = (record as any)?.coordinates;
    if (typeof rawWkt === 'string' && rawWkt.startsWith('LINESTRING')) return `LINESTRING(${pts.map(p => `${p.lng} ${p.lat}`).join(', ')})`;
    if (typeof rawWkt === 'string' && rawWkt.startsWith('POLYGON')) return `POLYGON((${pts.map(p => `${p.lng} ${p.lat}`).join(', ')}))`;
    if (pts.length > 1) return `MULTIPOINT(${pts.map(p => `(${p.lng} ${p.lat})`).join(',')})`;
    return `POINT(${pts[0].lng} ${pts[0].lat})`;
  }, [record]);

  // ── Load dropdown data (org tree, seaports, symbols, users) ─────────
  useEffect(() => {
    if (isDetailMode) return;
    let isMounted = true;
    (async () => {
      try {
        const orgs = await organizationService.getTree();
        if (isMounted) setOrganizations(orgs || []);
      } catch (err) {
        console.error('Không tải được cây đơn vị quản lý', err);
        if (isMounted) setOrganizations([]);
      }
      try {
        const ports = await vtsSystemCRUD.getScopedPortOptions();
        if (isMounted) setSeaportOptions(ports || []);
      } catch (err) {
        console.error('Không tải được danh sách cảng biển', err);
        if (isMounted) setSeaportOptions([]);
      }
      try {
        const res: any = await symbolService.list({ pageSize: 200 });
        const items = Array.isArray(res) ? res : res?.items || [];
        if (isMounted) {
          setSymbolOptions(items.map((s: any) => ({ value: s.id || s.code || '', label: s.name || s.code || s.id || '' })));
        }
      } catch (err) {
        console.error('Không tải được danh sách biểu tượng', err);
        if (isMounted) setSymbolOptions([]);
      }
      try {
        const resp: any = await userService.list({ pageSize: 1000 });
        const users = resp?.data || resp?.content || [];
        const m = new Map<string, string>();
        users.forEach((u: any) => { m.set(u.id, u.fullName || u.username || u.id); });
        if (isMounted) setUserMap(m);
      } catch (err) {
        console.error('Không tải được danh sách cán bộ', err);
      }
    })();
    return () => { isMounted = false; };
  }, [isDetailMode]);

  // ── Load detail ────────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      const loadData = async () => {
        setIsLoading(true);
        setFormError(null);
        try {
          const cached = (window.parent as any)?.kchtDetailCache?.[id] as NavigationChannelResponse | undefined;
          const data = cached || await navigationChannelCRUD.getById(id);
          setRecord(data);
          // Tọa độ → 6 trường DMS riêng (chuẩn VTS CHK)
          const coords = Array.isArray(data.coordinates) ? data.coordinates : [];
          setCoordinateList(coords.map((c) => {
            const latDms = ddToDms(Number(c.latitude));
            const lngDms = ddToDms(Number(c.longitude));
            return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
          }));
          form.setFieldsValue({
            orgUnitId: data.orgUnitId,
            seaportId: data.seaportId,
            operatingUnitId: data.operatingUnitId,
            channelCode: data.channelCode,
            channelName: data.channelName,
            provinceId: data.provinceId != null ? String(data.provinceId) : undefined,
            detailedLocation: data.detailedLocation,
            conditionStatus: data.conditionStatus,
            managementStation: data.managementStation,
            stationCount: data.stationCount,
            stationStaffCount: data.stationStaffCount,
            stationAreaSquareMeters: data.stationAreaSquareMeters,
            latestStationRepairMonth: data.latestStationRepairMonth ? dayjs(data.latestStationRepairMonth) : null,
            latestMaintenanceYear: data.latestMaintenanceYear ? dayjs(String(data.latestMaintenanceYear)) : null,
            latestDredgingVolumeCubicMeters: data.latestDredgingVolumeCubicMeters,
            buoyCount: data.buoyCount,
            beaconCount: data.beaconCount,
            notes: data.notes,
            announcementDecisionNumber: data.announcementDecisionNumber,
            announcementDecisionDate: data.announcementDecisionDate ? dayjs(data.announcementDecisionDate) : null,
            announcementDecisionIssuer: data.announcementDecisionIssuer,
            protectionScopeMeters: data.protectionScopeMeters,
            protectionNotes: data.protectionNotes,
            geometryType: data.geometryType,
            mapIconId: data.mapIconId,
            coordinateReferenceSystem: data.coordinateReferenceSystem,
            displayRule: data.displayRule,
          });
          setRouteRows(data.routeDetails || []);
          setUploadedFiles(
            (data.attachments || []).map((a, i) => ({
              uid: a.id || `att-${i}`,
              name: a.fileName,
              size: a.fileSize,
              type: a.contentType,
              status: 'done',
              url: a.fileUrl,
              uploadedBy: (a as any).uploadedBy,
              uploadedAt: (a as any).uploadedAt,
            }) as UploadFile),
          );
        } catch (err) {
          setFormError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      form.resetFields();
      form.setFieldsValue({
        conditionStatus: '1',
      });
      setRecord(null);
      setRouteRows([]);
      setCoordinateList([]);
      setUploadedFiles([]);
    }
  }, [id, form]);

  // ── Fetch history (edit/detail — KHÔNG phải create) ────────────────
  useEffect(() => {
    if (id && !isCreateMode) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
          const hist = await navigationChannelApproval.getHistory(id);
          setHistory(Array.isArray(hist) ? hist : []);
        } catch (err) {
          setHistoryError(err instanceof Error ? err.message : 'Không tải được lịch sử');
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [id, isCreateMode]);

  // ── Đổi loại đối tượng: GIỮ tọa độ cũ, chỉ thêm dòng trống đủ số lượng ──
  useEffect(() => {
    if (!watchedGeometryType) return;
    const count = GEOMETRY_POINT_COUNT[watchedGeometryType] ?? 1;
    setCoordinateList((prev) => {
      if (!prev || prev.length >= count) return prev;
      const added = Array.from({ length: count - prev.length }, () => emptyDmsPoint());
      return [...prev, ...added];
    });
    setGpsError(null);
  }, [watchedGeometryType]);

  // ── Route detail (#22-#38) handlers ────────────────────────────────
  const updateRouteRow = useCallback((index: number, field: keyof ChannelRouteDetailRequest, value: any) => {
    setRouteRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const addRouteRow = useCallback(() => setRouteRows((prev) => [...prev, { sequenceNo: prev.length + 1 }]), []);
  const deleteRouteRow = useCallback((index: number) => setRouteRows((prev) => prev.filter((_, i) => i !== index)), []);

  const routeColumns = useMemo(() => {
    const inputCell = (style?: React.CSSProperties) => ({ ...inputStyle, width: '100%', ...(style || {}) });
    return [
      {
        title: 'STT',
        key: 'sequenceNo',
        width: 48,
        render: (_: any, __: any, index: number) => <span style={{ color: textSecondary, fontSize: fontSizeMd }}>{index + 1}</span>,
      },
      {
        title: 'Phân loại',
        dataIndex: 'routeClassification',
        width: 110,
        render: (text: string, _: any, index: number) => (
          <Input value={text} onChange={(e) => updateRouteRow(index, 'routeClassification', e.target.value)} placeholder="Phân loại" maxLength={100} showCount style={inputCell()} />
        ),
      },
      {
        title: 'Mã',
        dataIndex: 'routeCode',
        width: 120,
        render: (text: string) => (
          <Input value={text} disabled placeholder="Tự sinh" style={inputCell()} />
        ),
      },
      {
        title: 'Tên',
        dataIndex: 'routeName',
        width: 160,
        render: (text: string, _: any, index: number) => (
          <Input value={text} onChange={(e) => updateRouteRow(index, 'routeName', e.target.value)} placeholder="Nhập tên tuyến" maxLength={200} showCount style={inputCell()} />
        ),
      },
      {
        title: 'Loại tuyến',
        dataIndex: 'routeType',
        width: 130,
        render: (value: number | undefined, _: any, index: number) => (
          <Select value={value} onChange={(v) => updateRouteRow(index, 'routeType', v)} placeholder="Chọn loại" allowClear options={ROUTE_TYPE_OPTIONS} style={inputCell()} />
        ),
      },
      {
        title: 'Vị trí vũng quay tàu',
        dataIndex: 'turningBasinLocation',
        width: 150,
        render: (text: string, _: any, index: number) => (
          <Input value={text} onChange={(e) => updateRouteRow(index, 'turningBasinLocation', e.target.value)} placeholder="Vị trí" maxLength={200} showCount style={inputCell()} />
        ),
      },
      {
        title: 'Bán kính vũng quay (m)',
        dataIndex: 'turningBasinRadiusMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'turningBasinRadiusMeters', v)} placeholder="Bán kính" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Chiều cao tĩnh không (m)',
        dataIndex: 'verticalClearanceMeters',
        width: 150,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'verticalClearanceMeters', v)} placeholder="Chiều cao" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Chiều dài (km)',
        dataIndex: 'channelLengthKilometers',
        width: 130,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'channelLengthKilometers', v)} placeholder="Chiều dài" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Rộng TK lớn nhất (m)',
        dataIndex: 'maximumDesignWidthMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'maximumDesignWidthMeters', v)} placeholder="Rộng lớn nhất" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Rộng TK nhỏ nhất (m)',
        dataIndex: 'minimumDesignWidthMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'minimumDesignWidthMeters', v)} placeholder="Rộng nhỏ nhất" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Độ sâu TK (m)',
        dataIndex: 'designDepthMeters',
        width: 130,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'designDepthMeters', v)} placeholder="Độ sâu TK" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Độ sâu hiện tại (m)',
        dataIndex: 'currentDepthMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'currentDepthMeters', v)} placeholder="Độ sâu HT" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Mái dốc TK',
        dataIndex: 'designSlope',
        width: 110,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'designSlope', v)} placeholder="Mái dốc" style={inputCell()} />
        ),
      },
      {
        title: 'Bán kính cong NN (m)',
        dataIndex: 'minimumCurveRadiusMeters',
        width: 140,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'minimumCurveRadiusMeters', v)} placeholder="Bán kính cong" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'KL nạo vét (m³)',
        dataIndex: 'routeLatestDredgingVolumeCubicMeters',
        width: 130,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'routeLatestDredgingVolumeCubicMeters', v)} placeholder="KL nạo vét" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Năm bảo trì',
        dataIndex: 'routeLatestMaintenanceYear',
        width: 110,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'routeLatestMaintenanceYear', v)} placeholder="Năm" min={1990} max={2100} style={inputCell()} />
        ),
      },
      {
        title: 'Phân cấp',
        dataIndex: 'routeGrade',
        width: 100,
        render: (value: number | undefined, _: any, index: number) => (
          <InputNumber value={value} onChange={(v) => updateRouteRow(index, 'routeGrade', v)} placeholder="Cấp" min={0} style={inputCell()} />
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 60,
        fixed: 'right' as const,
        render: (_: any, __: any, index: number) => (
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteRouteRow(index)} />
        ),
      },
    ];
  }, [updateRouteRow, deleteRouteRow]);

  // ── GPS handlers (chuẩn VTS CHK — 6 trường DMS riêng) ──────────────
  const removeCoordinate = useCallback((i: number) => {
    setCoordinateList((p) => p.filter((_, idx) => idx !== i));
    setGpsError(null);
  }, []);

  const addGpsPoint = useCallback(() => {
    setCoordinateList((p) => [...p, emptyDmsPoint()]);
    setGpsError(null);
  }, []);

  const updateGpsPoint = useCallback((i: number, field: 'lat' | 'lng', dVal: number | null | undefined, mVal: number | null | undefined, sVal: number | null | undefined) => {
    setCoordinateList((p) => {
      const n = [...p];
      n[i] = {
        ...n[i],
        [field === 'lat' ? 'latD' : 'lngD']: dVal ?? null,
        [field === 'lat' ? 'latM' : 'lngM']: mVal ?? null,
        [field === 'lat' ? 'latS' : 'lngS']: sVal ?? null,
      };
      return n;
    });
    setGpsError(null);
  }, []);

  // DMS → WKT cho GisLocationSelector
  const gisWktValue = useMemo(() => {
    const valid = coordinateList
      .filter((c) => c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null)
      .map((c) => ({
        latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
        longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
      }));
    let wkt = '';
    if (valid.length === 1) {
      wkt = `POINT(${valid[0].longitude} ${valid[0].latitude})`;
    } else if (valid.length > 1) {
      const geom = watchedGeometryType;
      if (geom === 'LINE') wkt = `LINESTRING(${valid.map(c => `${c.longitude} ${c.latitude}`).join(',')})`;
      else if (geom === 'POLYGON') wkt = `POLYGON((${[...valid, valid[0]].map(c => `${c.longitude} ${c.latitude}`).join(',')}))`;
      else wkt = `MULTIPOINT(${valid.map(c => `(${c.longitude} ${c.latitude})`).join(',')})`;
    }
    return wkt;
  }, [coordinateList, watchedGeometryType]);

  const handleGisChange = useCallback((loc: { geometryType: string; coordinates: string }) => {
    const pts = parseGisCoordinates(loc);
    if (pts.length > 0) {
      setCoordinateList(pts.map((p) => {
        const latDms = ddToDms(p.latitude);
        const lngDms = ddToDms(p.longitude);
        return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
      }));
      setGpsError(null);
    }
  }, []);

  // ── Upload file (Dragger — chuẩn VTS CHK) ─────────────────────────
  const handleBeforeUpload = (file: File): false => {
    if (file.size > 10 * 1024 * 1024) { toast.error('File vượt quá 10MB'); return false; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(ext)) { toast.error('Định dạng không hỗ trợ'); return false; }
    setUploadedFiles((p) => [...p, { uid: `${Date.now()}`, name: file.name, status: 'done', originFileObj: file as any }]);
    return false;
  };

  // ── Submit (trim + map + call API) ─────────────────────────────────
  const handleSubmitForm = async (values: any) => {
    setIsSubmitting(true);
    try {
      const manualCoords = coordinateList
        .filter((c) => c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null)
        .map((c) => ({
          latitude: (c.latD ?? 0) + (c.latM ?? 0) / 60 + (c.latS ?? 0) / 3600,
          longitude: (c.lngD ?? 0) + (c.lngM ?? 0) / 60 + (c.lngS ?? 0) / 3600,
        }));
      if (values.geometryType && manualCoords.length < (GEOMETRY_POINT_COUNT[values.geometryType] ?? 1)) {
        toast.error(values.geometryType === 'POLYGON' ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ' : values.geometryType === 'LINE' ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ' : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ');
        setActiveTabKey('location');
        return;
      }
      const payload: CreateNavigationChannelRequest = {
        orgUnitId: values.orgUnitId,
        seaportId: values.seaportId,
        operatingUnitId: values.operatingUnitId,
        channelName: trimString(values.channelName) || '',
        provinceId: values.provinceId != null ? Number(values.provinceId) : undefined,
        detailedLocation: trimString(values.detailedLocation),
        conditionStatus: values.conditionStatus as ConditionStatus,
        managementStation: trimString(values.managementStation),
        stationCount: values.stationCount,
        stationStaffCount: values.stationStaffCount,
        stationAreaSquareMeters: values.stationAreaSquareMeters,
        latestStationRepairMonth: values.latestStationRepairMonth ? values.latestStationRepairMonth.format('YYYY-MM-DD') : undefined,
        latestMaintenanceYear: values.latestMaintenanceYear ? values.latestMaintenanceYear.year() : undefined,
        latestDredgingVolumeCubicMeters: values.latestDredgingVolumeCubicMeters,
        buoyCount: values.buoyCount,
        beaconCount: values.beaconCount,
        notes: trimString(values.notes),
        announcementDecisionNumber: trimString(values.announcementDecisionNumber),
        announcementDecisionDate: values.announcementDecisionDate ? values.announcementDecisionDate.format('YYYY-MM-DD') : undefined,
        announcementDecisionIssuer: trimString(values.announcementDecisionIssuer),
        protectionScopeMeters: values.protectionScopeMeters,
        protectionNotes: trimString(values.protectionNotes),
        geometryType: values.geometryType,
        mapIconId: values.mapIconId,
        coordinateReferenceSystem: trimString(values.coordinateReferenceSystem),
        displayRule: trimString(values.displayRule),
        routeDetails: routeRows.length > 0 ? routeRows.map((row, i) => ({
          ...row,
          sequenceNo: i + 1,
          routeClassification: trimString(row.routeClassification),
          routeName: trimString(row.routeName),
          turningBasinLocation: trimString(row.turningBasinLocation),
        })) : undefined,
        coordinates: manualCoords.length > 0 ? manualCoords.map((c, i) => ({
          longitude: c.longitude,
          latitude: c.latitude,
          sequenceNo: i + 1,
        })) : undefined,
        attachments: uploadedFiles.length > 0 ? uploadedFiles.map((f) => ({
          fileName: f.name,
          fileSize: f.size,
          contentType: f.type,
        })) : undefined,
      };

      if (isCreateMode) {
        await navigationChannelCRUD.create(payload);
        toast.success('Tạo mới thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/navigation-channel');
        }
      } else if (id && isEditMode) {
        const updatePayload: UpdateNavigationChannelRequest = { ...payload, id };
        const res = await navigationChannelCRUD.update(id, updatePayload);
        if (window.parent && (window.parent as any).kchtDetailCache) {
          (window.parent as any).kchtDetailCache[id] = res;
        }
        toast.success('Cập nhật thành công');
        if (isModalMode) {
          onSuccess?.();
        } else if (isIframe) {
          window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
        } else {
          navigate('/navigation-channel');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Approval actions (detail mode — giữ nguyên luồng cũ) ───────────
  const handleApprovalAction = useCallback(
    async (action: 'approveC1' | 'approveC2' | 'reject' | 'delete', payload?: Record<string, unknown>) => {
      if (!id || !record) return;
      setIsSubmitting(true);
      try {
        if (action === 'approveC1') {
          const req: ApprovalRequest = { status: 'APPROVED' };
          const res = await navigationChannelApproval.approveC1(id, req);
          if (window.parent && (window.parent as any).kchtDetailCache) (window.parent as any).kchtDetailCache[id] = res;
          toast.success('Phê duyệt C1 thành công');
          setRecord({ ...record, approvalStatus: 'APPROVED_LEVEL1' });
        } else if (action === 'approveC2') {
          const req: ApprovalRequest = { status: 'APPROVED' };
          const res = await navigationChannelApproval.approveC2(id, req);
          if (window.parent && (window.parent as any).kchtDetailCache) (window.parent as any).kchtDetailCache[id] = res;
          toast.success('Phê duyệt C2 thành công');
          setRecord({ ...record, approvalStatus: 'APPROVED' });
        } else if (action === 'reject') {
          const reason = payload?.lyDo ? String(payload.lyDo).trim() : undefined;
          const req: ApprovalRequest = { status: 'REJECTED', reason };
          let updatedRecord: NavigationChannelResponse;
          if (record.approvalStatus === 'APPROVED_LEVEL1') {
            updatedRecord = await navigationChannelApproval.rejectLevel2(id, req);
          } else {
            updatedRecord = await navigationChannelApproval.rejectLevel1(id, req);
          }
          if (window.parent && (window.parent as any).kchtDetailCache) (window.parent as any).kchtDetailCache[id] = updatedRecord;
          toast.success('Từ chối thành công');
          setRecord({ ...record, approvalStatus: updatedRecord.approvalStatus, rejectionReason: reason });
        } else if (action === 'delete') {
          await navigationChannelCRUD.delete(id);
          toast.success('Xóa thành công');
          if (isModalMode && onSuccess) {
            onSuccess();
          } else if (isIframe) {
            window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
          } else {
            navigate('/navigation-channel');
          }
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Lỗi thực hiện thao tác');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, record, isModalMode, onSuccess, isIframe, navigate],
  );

  const breadcrumbs = [
    { title: 'Trang chủ', onClick: () => navigate('/') },
    { title: 'Luồng hàng hải', onClick: () => navigate('/navigation-channel') },
    { title: isCreateMode ? 'Tạo mới' : isEditMode ? 'Chỉnh sửa' : 'Chi tiết' },
  ];

  const sectionTitle = (text: string) => (
    <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg, marginBottom: spaceMd }}>{text}</div>
  );

  // ── orgMap / seaportMap cho timeline lịch sử ────────────────────────
  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    const walk = (nodes: any[]) => {
      (nodes || []).forEach((n) => {
        if (n?.id && n?.name) m.set(n.id, n.name);
        if (n?.children?.length) walk(n.children);
      });
    };
    walk(organizations);
    return m;
  }, [organizations]);

  const seaportMap = useMemo(() => {
    const m = new Map<string, string>();
    seaportOptions.forEach((p) => { m.set(p.id, p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id); });
    return m;
  }, [seaportOptions]);

  // ── Timeline lịch sử (chuẩn VTS CHK — resolveHistoryActionMeta) ────
  const renderHistoryTimeline = (records: any[]) => {
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
    if (groups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
          <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
        </div>
      );
    }
    const fmtTime = (ts: string) => { const d = new Date(ts); return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`; };
    return (
      <div>{groups.map((g, gi) => {
        const rec0 = g.items[0] || {};
        const orgId = rec0.orgUnitId || record?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        const unitName = (orgName ? (orgName.split(' - ').pop() || orgName) : (rec0.orgUnitName || rec0.unitName || record?.orgUnitName)) || '—';
        const changes = g.items.flatMap((item: any) => historyChangeRows(item)).sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }).filter((c: any) => c.field !== 'infrastructureList' && c.field !== 'attachments' && c.field !== 'spatialId');
        const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
        const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
        const actionMeta = resolveHistoryActionMeta(g, changes);
        const barColor = actionMeta.color;
        const formatHistoryValue = (fn: string, raw: string | null) => {
          if (raw === null || raw === '(null)' || raw === '') return null;
          const t = raw.trim();
          if (/^-?\d+(\.\d+)?$/.test(t)) {
            const n = Number(t);
            return Number.isInteger(n) ? String(n) : t;
          }
          return historyFieldValue(fn, raw, orgMap, seaportMap, userMap);
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
                <div style={historyTimeStyle}>
                  {g.ts ? fmtTime(g.ts) : '—'}
                </div>
                <span style={{ flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>{actionMeta.label}</span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                <div style={historyMetaRowStyle}>
                  Người cập nhật: {g.actor || '—'}
                </div>
                <div style={historyMetaRowStyle}>
                  Đơn vị: {unitName}
                </div>
              </div>
            </div>
            <div style={historyInfoCardStyle}>
              <div style={historyAccentBarStyle(barColor)} />
              <div style={historyInfoTitleStyle}>
                {informationTitle}
              </div>
              {validChanges.length > 0 ? <div>{validChanges.map((change, ri: number) => {
                const fn = change.field;
                const renderCell = (rawVal: string | null) => {
                  const k = normalizeHistoryKey(fn);
                  if (k === 'approvalstatus' || k === 'trang thai phe duyet' || k === 'conditionstatus' || k === 'tinh trang') {
                    return renderHistoryValueTag(fn, rawVal);
                  }
                  if (rawVal === null || rawVal === undefined || rawVal === '') return <span style={{ color: textTertiary }}>—</span>;
                  return <span title={rawVal} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 260, verticalAlign: 'bottom', color: textPrimary }}>{rawVal}</span>;
                };
                const isApprovalRow = ['approvalstatus', 'trang thai phe duyet', 'submittedat', 'level1approvedat', 'level2approvedat', 'submittedby', 'level1approvedby', 'level2approvedby'].includes(normalizeHistoryKey(fn));
                return (
                  <div key={ri} style={isApprovalRow ? historyCreateRowStyle : historyChangeRowStyle}>
                    <span style={historyFieldLabelStyle}>{historyFieldName(fn)}</span>
                    <span style={historyOldValueStyle}>{renderCell(change.oldValue)}</span>
                    {!isApprovalRow && <span style={historyArrowStyle}>→</span>}
                    <span style={historyNewValueStyle}>{renderCell(change.newValue)}</span>
                  </div>
                );
              })}</div> : null}
              {reasons.length > 0 && (
                <div style={{ marginTop: spaceXs, fontSize: fontSizeMd, color: textSecondary }}>
                  {reasons.map((reason, ri) => (
                    <div key={ri} style={{ marginBottom: ri < reasons.length - 1 ? spaceXs : 0 }}>Lý do: {reason}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}</div>
    );
  };

  // ── Detail / read-only view (#1-#71, #47-#71 read-only) — chuẩn CHK ─
  if (isDetailMode) {
    const fmtDateTime = (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—');
    const fmtDate = (v?: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
    const fmtNumber = (v: number | null | undefined): string => (v != null ? Number(v).toLocaleString('vi-VN') : '—');
    const detailGrid = (rows: Array<[string, React.ReactNode]>) => (
      <div className="chk-detail-grid">
        {rows.map(([label, value], i) => (
          <div key={i} className="chk-detail-row">
            <span className="chk-detail-label">{label}</span>
            <span className="chk-detail-value">{value}</span>
          </div>
        ))}
      </div>
    );

    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isModalMode ? 0 : `${spaceLg}px ${spaceLg}px` }}>
        {!isModalMode && <Breadcrumb items={breadcrumbs.map((b) => ({ title: <span>{b.title}</span> }))} style={{ marginBottom: 16 }} />}
        <Spin spinning={isLoading}>
          {formError ? (
            <Card>
              <Empty description={formError} style={{ marginTop: 24 }} />
              <Button onClick={() => (isModalMode ? onCancel?.() : navigate('/navigation-channel'))} style={{ marginTop: spaceLg, ...outlineButtonStyle }}>
                Quay lại
              </Button>
            </Card>
          ) : record ? (
            <>
              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                {sectionTitle('Hồ sơ chính')}
                {detailGrid([
                  ['Mã luồng hàng hải', <span style={statusBadgeStyle(actionPrimary)}>{record.channelCode || '—'}</span>],
                  ['Tên luồng hàng hải', <span style={{ fontWeight: fontWeightBold }}>{record.channelName || '—'}</span>],
                  ['Đơn vị quản lý', <span style={{ fontWeight: fontWeightBold }}>{record.orgUnitName || record.orgUnitId || '—'}</span>],
                  ['Đơn vị vận hành', record.operatingUnitId || '—'],
                  ['Thuộc cảng biển', record.seaportName || record.seaportId || '—'],
                  ['Địa điểm (Tỉnh/TP)', record.provinceId != null ? (VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === String(record.provinceId))?.label || String(record.provinceId)) : '—'],
                  ['Địa điểm chi tiết', record.detailedLocation || '—'],
                  ['Tình trạng', record.conditionStatus ? <ApprovalStatusBadge status={record.conditionStatus} size="small" /> : '—'],
                  ['Trạm quản lý luồng', record.managementStation || '—'],
                  ['Số lượng trạm', fmtNumber(record.stationCount)],
                  ['Số lượng nhân sự tại trạm', fmtNumber(record.stationStaffCount)],
                  ['Diện tích trạm (m²)', fmtNumber(record.stationAreaSquareMeters)],
                  ['Sửa chữa trạm gần nhất', fmtDate(record.latestStationRepairMonth)],
                  ['Năm bảo trì gần nhất', fmtNumber(record.latestMaintenanceYear)],
                  ['KL nạo vét (m³)', fmtNumber(record.latestDredgingVolumeCubicMeters)],
                  ['Số lượng phao', fmtNumber(record.buoyCount)],
                  ['Số lượng tiêu', fmtNumber(record.beaconCount)],
                  ['Quyết định công bố số', record.announcementDecisionNumber || '—'],
                  ['Ngày ra quyết định', fmtDate(record.announcementDecisionDate)],
                  ['Đơn vị ra quyết định', record.announcementDecisionIssuer || '—'],
                  ['Ghi chú', <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{record.notes || '—'}</span>],
                ])}
              </Card>

              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                {sectionTitle('Phạm vi bảo vệ và bản đồ')}
                {detailGrid([
                  ['Phạm vi bảo vệ luồng (m)', fmtNumber(record.protectionScopeMeters)],
                  ['Ghi chú phạm vi bảo vệ', record.protectionNotes || '—'],
                  ['Loại đối tượng', (() => { const gt = record.geometryType || ''; const m: Record<string, string> = { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }; return m[gt] || gt || '—'; })()],
                  ['Biểu tượng', record.mapIconId || '—'],
                  ['Hệ quy chiếu', record.coordinateReferenceSystem || '—'],
                  ['Quy tắc hiển thị', record.displayRule || '—'],
                ])}
                {parseDetailCoords(record).length > 0 && (
                  <div style={{ marginTop: spaceMd }}>
                    <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                      <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                        Tọa độ GPS ({parseDetailCoords(record).length})
                      </span>
                      <Button
                        icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                        onClick={() => setGisModalOpenDetail(true)}
                        style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Xem vị trí trên bản đồ
                      </Button>
                    </div>
                    <DetailTable
                      dataSource={parseDetailCoords(record)}
                      emptyText="Chưa có tọa độ GPS nào"
                      columns={[
                        { title: 'STT', width: 50 },
                        { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lat); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                        { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_v: any, rec: any) => { const dms = ddToDms(rec.lng); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                      ]}
                    />
                  </div>
                )}
              </Card>

              {record.routeDetails && record.routeDetails.length > 0 && (
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Tuyến luồng')}
                  <DetailTable
                    dataSource={record.routeDetails}
                    rowKey={(row: any, index) => row.id || String(index)}
                    emptyText="Chưa có tuyến luồng nào"
                    columns={[
                      { title: 'STT', width: 50, render: (_: any, __: any, i: number) => i + 1 },
                      { title: 'Phân loại', dataIndex: 'routeClassification', width: 100 },
                      { title: 'Mã', dataIndex: 'routeCode', width: 110 },
                      { title: 'Tên', dataIndex: 'routeName', width: 180 },
                      { title: 'Loại tuyến', width: 110, render: (_: any, r: any) => (r.routeType === 1 ? 'Công cộng' : r.routeType === 2 ? 'Chuyên dùng' : '—') },
                      { title: 'Vị trí vũng quay tàu', dataIndex: 'turningBasinLocation', width: 150 },
                      { title: 'Bán kính vũng quay (m)', dataIndex: 'turningBasinRadiusMeters', width: 130 },
                      { title: 'Chiều cao tĩnh không (m)', dataIndex: 'verticalClearanceMeters', width: 140 },
                      { title: 'Chiều dài (km)', dataIndex: 'channelLengthKilometers', width: 110 },
                      { title: 'Rộng TK LN (m)', dataIndex: 'maximumDesignWidthMeters', width: 120 },
                      { title: 'Rộng TK NN (m)', dataIndex: 'minimumDesignWidthMeters', width: 120 },
                      { title: 'Độ sâu TK (m)', dataIndex: 'designDepthMeters', width: 110 },
                      { title: 'Độ sâu HT (m)', dataIndex: 'currentDepthMeters', width: 110 },
                      { title: 'Mái dốc TK', dataIndex: 'designSlope', width: 90 },
                      { title: 'Bán kính cong NN (m)', dataIndex: 'minimumCurveRadiusMeters', width: 130 },
                      { title: 'KL nạo vét (m³)', dataIndex: 'routeLatestDredgingVolumeCubicMeters', width: 120 },
                      { title: 'Năm bảo trì', dataIndex: 'routeLatestMaintenanceYear', width: 90 },
                      { title: 'Phân cấp', dataIndex: 'routeGrade', width: 80 },
                    ]}
                  />
                </Card>
              )}

              {record.attachments && record.attachments.length > 0 && (
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('File đính kèm')}
                  <DetailTable
                    dataSource={record.attachments.map((a) => ({ ...a }))}
                    emptyText="Chưa có tài liệu đính kèm"
                    columns={[
                      { title: 'STT', width: 50 },
                      { title: 'Tên tài liệu', dataIndex: 'fileName', key: 'fileName', render: (v: string) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{v || '—'}</span> },
                      { title: 'Dung lượng', dataIndex: 'fileSize', key: 'fileSize', width: 120, align: 'right' as const, render: (v: number) => v ? (v > 1024 * 1024 ? `${(v / (1024 * 1024)).toFixed(2)} MB` : `${(v / 1024).toFixed(1)} KB`) : '—' },
                      { title: 'Người tải lên', dataIndex: 'uploadedBy', key: 'uploadedBy', width: 180, render: (v: string) => userMap.get(v) || v || '—' },
                      { title: 'Ngày tải lên', dataIndex: 'uploadedAt', key: 'uploadedAt', width: 135, align: 'center' as const, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—' },
                    ]}
                  />
                </Card>
              )}

              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                {sectionTitle('Trạng thái và phê duyệt')}
                {detailGrid([
                  ['Trạng thái', record.approvalStatus ? <ApprovalStatusBadge status={record.approvalStatus} /> : '—'],
                  ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || '—'}</span>],
                  ['Ngày cập nhật', fmtDateTime(record.updatedAt)],
                  ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.submittedBy || '') || record.submittedBy || '—'}</span>],
                  ['Ngày gửi phê duyệt', fmtDateTime(record.submittedAt)],
                  ['Cán bộ duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.level1ApprovedBy || '') || record.level1ApprovedBy || '—'}</span>],
                  ['Ngày duyệt cấp Cảng vụ/Chi cục', fmtDateTime(record.level1ApprovedAt)],
                  ['Nội dung duyệt cấp 1', record.level1ApprovalContent || '—'],
                  ['Cán bộ duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.level2ApprovedBy || '') || record.level2ApprovedBy || '—'}</span>],
                  ['Ngày duyệt cấp Cục', fmtDateTime(record.level2ApprovedAt)],
                  ['Nội dung duyệt cấp 2', record.level2ApprovalContent || '—'],
                  ['Lý do từ chối', record.rejectionReason || '—'],
                ])}
              </Card>

              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                <ApprovalActionBar
                  currentStatus={record.approvalStatus as ApprovalStatus}
                  permissions={userPermissions}
                  entityPermissionPrefix="navigationchannel"
                  currentUserId={currentUser?.username}
                  nguoiPheDuyetC1={record.approverLevel1}
                  onAction={handleApprovalAction}
                  loading={isSubmitting}
                />
              </Card>

              <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                {sectionTitle('Thông tin liên quan')}
                {detailGrid([
                  ['Tên KCHT', record.relatedInfrastructureName || '—'],
                  ['Loại KCHT', record.relatedInfrastructureType || '—'],
                  ['Mã kế hoạch vận hành', record.operationPlanCode || '—'],
                  ['Tên kế hoạch vận hành', record.operationPlanName || '—'],
                  ['Ngày bắt đầu vận hành', fmtDate(record.operationStartDate)],
                  ['Ngày kết thúc vận hành', fmtDate(record.operationEndDate)],
                  ['Mã kế hoạch bảo trì', record.maintenancePlanCode || '—'],
                  ['Tên kế hoạch bảo trì', record.maintenancePlanName || '—'],
                  ['Bảo trì bắt đầu', record.maintenanceStartTime || '—'],
                  ['Bảo trì kết thúc', record.maintenanceEndTime || '—'],
                  ['Mã sự cố', record.incidentCode || '—'],
                  ['Loại sự cố', record.incidentType || '—'],
                  ['Địa điểm sự cố', record.incidentLocation || '—'],
                  ['Thời gian sự cố', fmtDateTime(record.incidentTime)],
                ])}
              </Card>

              <Card style={{ ...cardStyle }}>
                {sectionTitle('Lịch sử thay đổi')}
                {isLoadingHistory ? (
                  <div style={{ textAlign: 'center', padding: `${spaceLg}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải lịch sử...</div>
                ) : historyError ? (
                  <div style={{ textAlign: 'center', padding: `${spaceLg}px 0` }}>
                    <div style={{ color: statusCritical, fontSize: fontSizeMd, marginBottom: spaceSm }}>{historyError}</div>
                    <Button
                      onClick={() => {
                        if (!id) return;
                        setIsLoadingHistory(true);
                        setHistoryError(null);
                        navigationChannelApproval.getHistory(id)
                          .then((hist) => setHistory(Array.isArray(hist) ? hist : []))
                          .catch((err) => setHistoryError(err instanceof Error ? err.message : 'Không tải được lịch sử'))
                          .finally(() => setIsLoadingHistory(false));
                      }}
                      style={{ ...outlineButtonStyle }}
                    >
                      Tải lại
                    </Button>
                  </div>
                ) : (
                  renderHistoryTimeline(history)
                )}
              </Card>
            </>
          ) : (
            <Empty description="Không có dữ liệu" />
          )}
        </Spin>

        {/* ── GIS Location Selector Modal — xem vị trí trên bản đồ chuyên dụng (chuẩn VTS CHK) ── */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EnvironmentOutlined style={{ color: actionPrimary }} />
              <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
                Xem vị trí trên bản đồ chuyên dụng
              </span>
            </div>
          }
          open={gisModalOpenDetail}
          onCancel={() => setGisModalOpenDetail(false)}
          destroyOnClose
          width="94vw"
          style={{ top: 20, maxWidth: '1400px' }}
          footer={[
            <Button key="close" type="primary" onClick={() => setGisModalOpenDetail(false)} style={{ ...primaryButtonStyle, height: 36 }}>
              Đóng
            </Button>,
          ]}
        >
          <div style={{ padding: '8px 0' }}>
            <GisLocationSelector
              inline
              defaultGeometryType={(record?.geometryType as 'POINT' | 'LINE' | 'POLYGON') || 'POINT'}
              disabled
              height={520}
              value={{ geometryType: (record?.geometryType as 'POINT' | 'LINE' | 'POLYGON') || 'POINT', coordinates: gisViewWkt }}
            />
          </div>
        </Modal>
      </div>
    );
  }

  // ── Create / Edit form (#1-#46) — chuẩn CHK ────────────────────────
  const formFooter = (
    <div style={{ display: 'flex', justifyContent: 'center', gap: spaceSm }}>
      <Button
        type="primary"
        loading={isSubmitting}
        onClick={() => form.submit()}
        style={{ ...primaryButtonStyle, minWidth: 120 }}
      >
        {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
      </Button>
      <Button
        onClick={isIframe
          ? () => window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*')
          : isModalMode ? onCancel : () => navigate('/navigation-channel')}
        style={{ ...outlineButtonStyle, minWidth: 120 }}
      >
        Hủy
      </Button>
    </div>
  );

  const formContent = (
    <>
    <Form form={form} layout="vertical" onFinish={handleSubmitForm} style={{ maxWidth: 1100 }}>
      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        tabBarStyle={drawerTabBarStyle}
        items={[
          {
            key: 'basic-info',
            label: 'Thông tin chung',
            children: (
              <div style={drawerTabContentStyle}>
                {/* Hồ sơ chính */}
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Hồ sơ chính')}
                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item
                        name="orgUnitId"
                        {...labelProps('Đơn vị quản lý')}
                        required
                        style={formFieldStyle}
                        rules={[{ required: true, message: 'Đơn vị quản lý là bắt buộc' }]}
                      >
                        <OrgUnitTreeSelect organizations={organizations} placeholder="Chọn đơn vị quản lý..." showPath treeDefaultExpandAll={false} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="seaportId" {...labelProps('Thuộc cảng biển')} style={formFieldStyle}>
                        <Select
                          placeholder="Chọn cảng biển"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          options={seaportOptions.map((p) => ({ value: p.id, label: p.portCode ? `${p.portCode} - ${p.portName || ''}` : p.portName || p.id }))}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="operatingUnitId" {...labelProps('Đơn vị vận hành')} style={formFieldStyle}>
                        <Select
                          placeholder="Chọn đơn vị vận hành"
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          options={organizations.map((org) => ({ value: org.id, label: org.code ? `${org.code} - ${org.name}` : org.name }))}
                          style={selectStyle}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="channelCode" {...labelProps('Mã luồng hàng hải')} style={formFieldStyle}>
                        <Input disabled placeholder="Tự sinh khi lưu (LHH...)" style={readonlyInputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="channelName"
                        {...labelProps('Tên luồng hàng hải')}
                        required
                        style={formFieldStyle}
                        rules={[{ required: true, message: 'Tên luồng hàng hải là bắt buộc' }]}
                      >
                        <Input.TextArea rows={2} maxLength={100} showCount placeholder="Nhập tên luồng hàng hải" style={{ borderRadius: radiusPill, height: 'auto' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="provinceId" {...labelProps('Địa điểm (Tỉnh/TP)')} style={formFieldStyle}>
                        <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch optionFilterProp="label" options={VIETNAM_PROVINCE_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="detailedLocation" {...labelProps('Địa điểm chi tiết')} style={formFieldStyle}>
                        <Input.TextArea rows={2} maxLength={500} showCount placeholder="Nhập địa điểm chi tiết" style={{ borderRadius: radiusPill, height: 'auto' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="conditionStatus"
                        {...labelProps('Tình trạng')}
                        required
                        style={formFieldStyle}
                        rules={[{ required: true, message: 'Tình trạng là bắt buộc' }]}
                      >
                        <Select placeholder="Chọn tình trạng" options={CONDITION_STATUS_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="managementStation" {...labelProps('Trạm quản lý luồng')} style={formFieldStyle}>
                        <Input.TextArea rows={2} maxLength={500} showCount placeholder="Nhập trạm quản lý luồng" style={{ borderRadius: radiusPill, height: 'auto' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="stationCount" {...labelProps('Số lượng trạm')} style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập số lượng trạm" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="stationStaffCount" {...labelProps('Số lượng nhân sự tại trạm')} style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập số lượng nhân sự" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="stationAreaSquareMeters" {...labelProps('Diện tích trạm (m²)')} style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập diện tích trạm" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="latestStationRepairMonth" {...labelProps('Sửa chữa trạm gần nhất')} style={formFieldStyle}>
                        <DatePicker picker="month" format="MM/YYYY" placeholder="Chọn tháng/năm" style={{ ...selectStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="latestMaintenanceYear" {...labelProps('Năm bảo trì gần nhất')} style={formFieldStyle}>
                        <DatePicker picker="year" format="YYYY" placeholder="Chọn năm" style={{ ...selectStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="latestDredgingVolumeCubicMeters" {...labelProps('Khối lượng nạo vét (m³)')} style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập khối lượng nạo vét" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="buoyCount" {...labelProps('Số lượng phao')} style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập số lượng phao" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="beaconCount" {...labelProps('Số lượng tiêu')} style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập số lượng tiêu" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="announcementDecisionNumber" {...labelProps('Quyết định công bố số')} style={formFieldStyle}>
                        <Input maxLength={100} showCount placeholder="Nhập số quyết định công bố" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="announcementDecisionDate" {...labelProps('Ngày ra quyết định công bố')} style={formFieldStyle}>
                        <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" style={{ ...selectStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="announcementDecisionIssuer" {...labelProps('Đơn vị ra quyết định công bố')} style={formFieldStyle}>
                        <Input.TextArea rows={2} maxLength={500} showCount placeholder="Nhập đơn vị ra quyết định" style={{ borderRadius: radiusPill, height: 'auto' }} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="notes" {...labelProps('Ghi chú')} style={formFieldStyle}>
                        <Input.TextArea rows={3} maxLength={500} showCount placeholder="Nhập ghi chú" style={{ borderRadius: radiusPill, height: 'auto' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                {/* Tuyến luồng */}
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Tuyến luồng')}
                  <Button icon={<PlusOutlined />} onClick={addRouteRow} style={{ ...outlineButtonStyle, marginBottom: spaceSm }}>
                    Thêm tuyến luồng
                  </Button>
                  <Table
                    dataSource={routeRows}
                    columns={routeColumns}
                    rowKey={(_, index) => String(index)}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: 'Chưa có tuyến luồng nào' }}
                  />
                </Card>

                {/* Phạm vi bảo vệ luồng */}
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Phạm vi bảo vệ luồng')}
                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item name="protectionScopeMeters" {...labelProps('Phạm vi bảo vệ luồng (m)')} style={formFieldStyle}>
                        <InputNumber min={0} placeholder="Nhập phạm vi bảo vệ" style={{ ...inputStyle, width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="protectionNotes" {...labelProps('Ghi chú phạm vi bảo vệ')} style={formFieldStyle}>
                        <Input.TextArea rows={2} maxLength={500} showCount placeholder="Nhập ghi chú phạm vi bảo vệ" style={{ borderRadius: radiusPill, height: 'auto' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </div>
            ),
          },
          {
            key: 'location',
            label: `Thông tin vị trí (${coordinateList.length})`,
            children: (
              <div style={drawerTabContentStyle}>
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Thông tin vị trí')}
                  <Row gutter={[24, 0]}>
                    <Col span={12}>
                      <Form.Item name="geometryType" {...labelProps('Loại đối tượng')} style={formFieldStyle}>
                        <Select placeholder="Chọn loại đối tượng" options={GIS_GEOMETRY_TYPE_OPTIONS} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="mapIconId" {...labelProps('Biểu tượng')} style={formFieldStyle}>
                        <Select placeholder="Chọn biểu tượng" allowClear showSearch optionFilterProp="label" options={symbolOptions} style={selectStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="coordinateReferenceSystem" {...labelProps('Hệ quy chiếu')} style={formFieldStyle}>
                        <Input maxLength={50} showCount placeholder="Ví dụ: WGS 84" style={inputStyle} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="displayRule" {...labelProps('Quy tắc hiển thị')} style={formFieldStyle}>
                        <Input maxLength={500} showCount placeholder="Nhập quy tắc hiển thị" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                    <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                      Tọa độ GPS ({coordinateList.length})
                    </span>
                    <Space size={8}>
                      <Button
                        icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                        onClick={() => setGisModalOpen(true)}
                        disabled={!watchedGeometryType}
                        style={{ ...outlineButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Chọn tọa độ trên bản đồ
                      </Button>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={addGpsPoint}
                        disabled={!watchedGeometryType}
                        style={{ ...primaryButtonStyle, height: 32, fontSize: fontSizeSm, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Thêm tọa độ
                      </Button>
                    </Space>
                  </div>
                  {coordinateList.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, background: surfaceCard }}>
                      <span style={{ fontSize: fontSizeMd, color: textTertiary, display: 'block', marginBottom: spaceSm }}>Chưa có tọa độ nào.</span>
                      <Button type="dashed" icon={<PlusOutlined />} onClick={addGpsPoint} disabled={!watchedGeometryType} style={{ borderRadius: radiusPill }}>Thêm tọa độ</Button>
                    </div>
                  ) : (
                    <>
                      {gpsError && (
                        <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>⚠ {gpsError}</span>
                        </div>
                      )}
                      <Table
                        size="small"
                        tableLayout="fixed"
                        pagination={coordinateList.length > 10 ? {
                          current: gpsPage,
                          pageSize: 10,
                          total: coordinateList.length,
                          onChange: (p) => setGpsPage(p),
                          showSizeChanger: false,
                          size: 'small',
                        } : false}
                        dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
                        rowKey={(r, idx) => r._idx ?? String(idx)}
                        locale={{ emptyText: 'Chưa có tọa độ GPS nào' }}
                        columns={[
                          {
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            render: (_v, _r, idx) => (gpsPage - 1) * 10 + idx + 1,
                          },
                          {
                            title: 'Vĩ độ (Latitude - N)',
                            key: 'lat',
                            render: (_v, record: any) => renderDmsGroup(record.latD, record.latM, record.latS, 90, (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s)),
                          },
                          {
                            title: 'Kinh độ (Longitude - E)',
                            key: 'lng',
                            render: (_v, record: any) => renderDmsGroup(record.lngD, record.lngM, record.lngS, 180, (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s)),
                          },
                          {
                            title: '',
                            width: 50,
                            align: 'center',
                            render: (_v, record: any) => (
                              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCoordinate(record._idx)} />
                            ),
                          },
                        ]}
                      />
                    </>
                  )}
                </Card>
              </div>
            ),
          },
          {
            key: 'files',
            label: `File đính kèm (${uploadedFiles.length})`,
            children: (
              <div style={drawerTabContentStyle}>
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('File đính kèm')}
                  <div style={{ marginBottom: spaceMd }}>
                    <Upload.Dragger
                      beforeUpload={handleBeforeUpload}
                      showUploadList={false}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff,.tif"
                      multiple
                      style={{ background: surfaceCard, border: `1px dashed ${borderDefault}`, borderRadius: radiusMd, padding: '24px 16px' }}
                    >
                      <p style={{ marginBottom: 8 }}>
                        <InboxOutlined style={{ fontSize: 44, color: actionPrimary }} />
                      </p>
                      <p style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: textPrimary, marginBottom: 4 }}>
                        Kéo thả tệp vào đây hoặc nhấp để chọn tệp tải lên
                      </p>
                      <p style={{ fontSize: fontSizeSm, color: textTertiary, margin: 0 }}>
                        Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF. Mỗi file ≤ 10MB.
                      </p>
                    </Upload.Dragger>
                  </div>
                  <div style={{ marginBottom: spaceFormField, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
                    <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, lineHeight: '32px', display: 'inline-flex', alignItems: 'center', height: 32 }}>
                      Danh sách tệp đính kèm ({uploadedFiles.length})
                    </span>
                  </div>
                  <Table
                    size="small"
                    pagination={uploadedFiles.length > 10 ? {
                      current: filePage,
                      pageSize: 10,
                      total: uploadedFiles.length,
                      onChange: (p) => setFilePage(p),
                      showSizeChanger: false,
                      size: 'small',
                    } : false}
                    dataSource={uploadedFiles.map((f, i) => ({ ...f, key: f.uid, _idx: i, name: f.name }))}
                    rowKey={(r) => r.uid || r._idx}
                    locale={{ emptyText: 'Chưa có tài liệu đính kèm nào' }}
                    scroll={{ x: 720 }}
                    columns={[
                      {
                        title: 'STT',
                        width: 60,
                        align: 'center',
                        render: (_v, _r, idx) => (filePage - 1) * 10 + idx + 1,
                      },
                      {
                        title: 'Tên tài liệu',
                        key: 'name',
                        dataIndex: 'name',
                        render: (name: string) => (
                          <a
                            onClick={() => toast.info(`Đang tải xuống tệp: ${name}`)}
                            style={{ fontSize: fontSizeMd, color: actionPrimary, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: fontWeightMedium, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                          >
                            <FileOutlined />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                          </a>
                        ),
                      },
                      {
                        title: 'Dung lượng',
                        key: 'size',
                        width: 120,
                        align: 'right' as const,
                        render: (_v, rec: any) => rec.size ? (rec.size > 1024 * 1024 ? `${(rec.size / (1024 * 1024)).toFixed(2)} MB` : `${(rec.size / 1024).toFixed(1)} KB`) : '—',
                      },
                      {
                        title: 'Người tải lên',
                        key: 'uploadedBy',
                        width: 180,
                        render: (_v, rec: any) => (rec.uploadedBy ? (userMap.get(rec.uploadedBy) || rec.uploadedBy) : (currentUser?.fullName || currentUser?.username || '—')),
                      },
                      {
                        title: 'Ngày tải lên',
                        key: 'uploadedAt',
                        width: 160,
                        align: 'center' as const,
                        render: (_v, rec: any) => rec.uploadedAt ? dayjs(rec.uploadedAt).format('DD/MM/YYYY HH:mm') : '—',
                      },
                      {
                        title: '',
                        key: 'actions',
                        width: 80,
                        align: 'center',
                        render: (_v, record: any) => (
                          <Space size={4}>
                            <Button type="text" icon={<DownloadOutlined style={{ color: actionPrimary }} />} onClick={() => toast.info(`Đang tải xuống tệp: ${record.name}`)} />
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setUploadedFiles(uploadedFiles.filter(x => x.uid !== record.uid))} />
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </div>
            ),
          },
          ...(isCreateMode ? [] : [{
            key: 'history',
            label: 'Lịch sử & Phê duyệt',
            children: (
              <div style={drawerTabContentStyle}>
                <Card style={{ ...cardStyle, marginBottom: spaceMd }}>
                  {sectionTitle('Trạng thái và phê duyệt')}
                  <div className="chk-detail-grid">
                    {[
                      ['Trạng thái', record?.approvalStatus ? <ApprovalStatusBadge status={record.approvalStatus} /> : '—'],
                      ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{record ? (userMap.get(record.updatedBy || '') || record.updatedBy || '—') : '—'}</span>],
                      ['Ngày cập nhật', record?.updatedAt ? dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm') : '—'],
                      ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{record ? (userMap.get(record.submittedBy || '') || record.submittedBy || '—') : '—'}</span>],
                      ['Ngày gửi phê duyệt', record?.submittedAt ? dayjs(record.submittedAt).format('DD/MM/YYYY HH:mm') : '—'],
                      ['Cán bộ duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{record ? (userMap.get(record.level1ApprovedBy || '') || record.level1ApprovedBy || '—') : '—'}</span>],
                      ['Ngày duyệt cấp Cảng vụ/Chi cục', record?.level1ApprovedAt ? dayjs(record.level1ApprovedAt).format('DD/MM/YYYY HH:mm') : '—'],
                      ['Cán bộ duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{record ? (userMap.get(record.level2ApprovedBy || '') || record.level2ApprovedBy || '—') : '—'}</span>],
                      ['Ngày duyệt cấp Cục', record?.level2ApprovedAt ? dayjs(record.level2ApprovedAt).format('DD/MM/YYYY HH:mm') : '—'],
                    ].map(([label, value], i) => (
                      <div key={i} className="chk-detail-row">
                        <span className="chk-detail-label">{label}</span>
                        <span className="chk-detail-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card style={{ ...cardStyle }}>
                  {sectionTitle('Lịch sử thay đổi')}
                  {isLoadingHistory ? (
                    <div style={{ textAlign: 'center', padding: `${spaceLg}px 0`, color: textTertiary, fontSize: fontSizeMd }}>Đang tải lịch sử...</div>
                  ) : historyError ? (
                    <div style={{ textAlign: 'center', padding: `${spaceLg}px 0`, color: statusCritical, fontSize: fontSizeMd }}>{historyError}</div>
                  ) : (
                    renderHistoryTimeline(history)
                  )}
                </Card>
              </div>
            ),
          }]),
        ]}
      />
      {/* Footer — chế độ standalone hiển thị trong form; chế độ modal hiển thị trong footer AppDrawer */}
      {!isModalMode && formFooter}
    </Form>

    {/* GIS Location Selector Modal — chọn tọa độ trên bản đồ chuyên dụng (chuẩn VTS CHK) */}
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EnvironmentOutlined style={{ color: actionPrimary }} />
          <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg, fontSize: fontSizeLg }}>
            Chọn vị trí & tọa độ trên bản đồ chuyên dụng
          </span>
        </div>
      }
      open={gisModalOpen}
      onCancel={() => setGisModalOpen(false)}
      destroyOnClose
      width="94vw"
      style={{ top: 20, maxWidth: '1400px' }}
      footer={[
        <Button key="cancel" onClick={() => setGisModalOpen(false)} style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}>
          Hủy
        </Button>,
        <Button
          key="ok"
          type="primary"
          onClick={() => setGisModalOpen(false)}
          style={{ ...primaryButtonStyle, height: 36 }}
        >
          Xác nhận tọa độ
        </Button>,
      ]}
    >
      <div style={{ padding: '8px 0' }}>
        <GisLocationSelector
          inline
          defaultGeometryType={(watchedGeometryType as 'POINT' | 'LINE' | 'POLYGON') || 'LINE'}
          height={520}
          value={{ geometryType: (watchedGeometryType as 'POINT' | 'LINE' | 'POLYGON') || 'LINE', coordinates: gisWktValue }}
          onChange={handleGisChange}
        />
      </div>
    </Modal>
    </>
  );

  if (isModalMode) {
    return (
      <AppDrawer
        title={
          <span style={{ color: textPrimary, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>
            {isCreateMode ? 'Tạo mới Luồng hàng hải' : isEditMode ? 'Chỉnh sửa Luồng hàng hải' : 'Chi tiết Luồng hàng hải'}
          </span>
        }
        open={open ?? false}
        onClose={() => onCancel?.()}
        size={1080}
        footer={formFooter}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {formContent}
      </AppDrawer>
    );
  }

  return (
    <div style={{ padding: '16px 24px' }}>
      <Breadcrumb items={breadcrumbs.map((b) => ({ title: <span style={{ color: textSecondary }}>{b.title}</span> }))} style={{ marginBottom: spaceMd }} />
      {formContent}
    </div>
  );
}
