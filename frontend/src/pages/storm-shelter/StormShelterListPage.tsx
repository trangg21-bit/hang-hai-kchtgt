import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Button, Modal, Input, Select, DatePicker,
  Drawer, Space, Typography, Form,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  FileOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { stormShelterCRUD, stormShelterApproval, portCRUD, buoyBerthCRUD } from '../../services/portService';
import type { StormShelterArea } from '../../types/port';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { organizationService } from '../../services/organizationService';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import { navigationChannelCRUD } from '../../services/navigationChannelService';
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
import StormShelterForm, { STORM_SHELTER_CLASSIFICATION_OPTIONS } from './StormShelterForm';
import StormShelterDetailContent from './StormShelterDetailContent';
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
  cellTitleStyle, cellSubtitleStyle, getRangePickerProps,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';
import { formatHistoryNumber } from '../../utils/numFmt';

// Cỡ chữ 13.5px đồng bộ chuẩn VTS CHK toàn bộ cell/table/input/button
const fontSizeMd = 13.5;

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' }, DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  CHO_PHE_DUYET: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PROPOSED: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED_LEVEL2: { color: statusOperational, label: 'Đã phê duyệt' },
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
  HIEN_HANH: { color: statusOperational, label: 'Hiện hành' },
  TAM_NGUNG: { color: statusCritical, label: 'Tạm ngừng' },
  DANG_KHAI_THAC: { color: statusOperational, label: 'Đang khai thác/vận hành' },
  CHUA_KHAI_THAC: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  DUNG_KHAI_THAC: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
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

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
}

const EXCLUDED_CHANGE_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'submittedForApprovalAt',
  'submittedForApprovalBy',
  'portAuthorityApprovedAt',
  'portAuthorityApprovedBy',
  'departmentApprovedAt',
  'departmentApprovedBy',
  'portAuthorityApprovalContent',
  'departmentApprovalContent',
  'rejectionReason',
  'attachments',
  'spatialId',
  'infrastructureList',
  'Danh sách hạ tầng',
  'Thời điểm gửi phê duyệt',
  'Người gửi phê duyệt',
  'Thời điểm Cảng vụ phê duyệt',
  'Cán bộ Cảng vụ phê duyệt',
  'Thời điểm Cục phê duyệt',
  'Cán bộ Cục phê duyệt',
  'Nội dung Cảng vụ phê duyệt',
  'Nội dung Cục phê duyệt',
  'Lý do từ chối',
  'Vị trí không gian',
]);

const NUMERIC_HISTORY_FIELDS = new Set([
  'area',
  'designWaterDepth',
  'currentWaterDepth',
  'bottomElevationDesign',
  'maxVesselDWT',
  'activeStormShelterCount',
  'publishedStormShelterCount',
  'underInvestmentStormShelterCount',
  'Diện tích (ha)',
  'Độ sâu khu nước theo thiết kế (m)',
  'Độ sâu khu nước hiện tại (m)',
  'Cao độ đáy bến thiết kế',
  'Cỡ tàu lớn nhất (DWT)',
  'Số lượng khu đang khai thác',
  'Số lượng khu đã công bố',
  'Số lượng khu đang thỏa thuận đầu tư',
  // Backward compatibility aliases:
  'Độ sâu theo thiết kế (m)',
  'Độ sâu hiện tại (m)',
  'Cỡ tàu khai thác (DWT)',
  'Số khu đang khai thác',
  'Số khu đã công bố',
  'Số khu thỏa thuận đầu tư',
]);

const histLabels: Record<string, string> = {
  stormShelterCode: 'Mã khu tránh, trú bão',
  stormShelterName: 'Tên khu tránh, trú bão',
  portId: 'Thuộc cảng biển',
  orgUnitId: 'Đơn vị quản lý',
  navigationChannelId: 'Thuộc luồng hàng hải',
  buoyStationId: 'Thuộc bến phao',
  classification: 'Phân loại',
  provinceId: 'Địa điểm (Tỉnh/Thành Phố)',
  province: 'Địa điểm (Tỉnh/Thành Phố)',
  detailedLocation: 'Địa điểm chi tiết',
  operationalStatus: 'Tình trạng',
  approvalStatus: 'Trạng thái',
  shapeDescription: 'Hình dạng',
  area: 'Diện tích (ha)',
  designWaterDepth: 'Độ sâu khu nước theo thiết kế (m)',
  currentWaterDepth: 'Độ sâu khu nước hiện tại (m)',
  bottomElevationDesign: 'Cao độ đáy bến thiết kế',
  maxVesselDWT: 'Cỡ tàu lớn nhất (DWT)',
  activeStormShelterCount: 'Số lượng khu đang khai thác',
  publishedStormShelterCount: 'Số lượng khu đã công bố',
  underInvestmentStormShelterCount: 'Số lượng khu đang thỏa thuận đầu tư',
  remarks: 'Ghi chú',
  openingAnnouncementDate: 'Thời điểm công bố mở',
  publicDecision: 'Quyết định công bố',
  investmentAgreement: 'Thỏa thuận đầu tư xây dựng',
  mapSymbolId: 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  spatialId: 'Vị trí không gian',
  'Trạng thái': 'Hành động',
  'Trạng thái phê duyệt': 'Hành động',
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  'Loại đối tượng GIS': 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  'Phạm vi khu nước neo buộc tàu': 'Phạm vi khu nước neo buộc tàu',
  'Danh sách khu nước neo buộc tàu': 'Phạm vi khu nước neo buộc tàu',
  'Tài liệu đính kèm': 'Tài liệu đính kèm',
  attachments: 'Tài liệu đính kèm',
  infrastructureList: 'Danh sách hạ tầng',
  submittedForApprovalAt: 'Thời điểm gửi phê duyệt',
  submittedForApprovalBy: 'Người gửi phê duyệt',
  portAuthorityApprovedAt: 'Thời điểm Cảng vụ phê duyệt',
  portAuthorityApprovedBy: 'Cán bộ Cảng vụ phê duyệt',
  departmentApprovedAt: 'Thời điểm Cục phê duyệt',
  departmentApprovedBy: 'Cán bộ Cục phê duyệt',
  portAuthorityApprovalContent: 'Nội dung Cảng vụ phê duyệt',
  departmentApprovalContent: 'Nội dung Cục phê duyệt',
  rejectionReason: 'Lý do từ chối',
  // Backward compatibility aliases:
  'Cảng biển': 'Thuộc cảng biển',
  'Luồng hàng hải': 'Thuộc luồng hàng hải',
  'Bến phao': 'Thuộc bến phao',
  'Tỉnh/Thành phố': 'Địa điểm (Tỉnh/Thành Phố)',
  'Địa điểm (Tỉnh/Thành phố)': 'Địa điểm (Tỉnh/Thành Phố)',
  'Biểu tượng bản đồ': 'Biểu tượng',
};

function histField(fn: string): string { return histLabels[fn] || fn; }

function histVal(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>,
  portMap?: Map<string, string>,
  buoyStationMap?: Map<string, string>,
  waterwayMap?: Map<string, string>,
): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  const v = val.trim();
  if ((fn === 'orgUnitId' || fn === 'Đơn vị quản lý') && orgMap) {
    const f = orgMap.get(v);
    return f ? f.split(' - ').pop() || f : v;
  }
  if ((fn === 'portId' || fn === 'Thuộc cảng biển' || fn === 'Cảng biển') && portMap) return portMap.get(v) || v;
  if ((fn === 'buoyStationId' || fn === 'Thuộc bến phao' || fn === 'Bến phao') && buoyStationMap) return buoyStationMap.get(v) || v;
  if ((fn === 'mapSymbolId' || fn === 'Biểu tượng' || fn === 'Biểu tượng bản đồ') && symbolMap) return symbolMap.get(v) || v;
  if ((fn === 'navigationChannelId' || fn === 'Thuộc luồng hàng hải' || fn === 'Luồng hàng hải') && waterwayMap) return waterwayMap.get(v) || v;
  if (fn === 'approvalStatus' || fn === 'Trạng thái' || fn === 'Trạng thái phê duyệt') {
    const m: Record<string, string> = {
      DRAFT: 'Lưu tạm',
      NHAP: 'Lưu tạm',
      PENDING: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      CHO_PHE_DUYET: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp cục',
      APPROVED_LEVEL2: 'Đã phê duyệt',
      APPROVED: 'Đã phê duyệt',
      DA_PHE_DUYET: 'Đã phê duyệt',
      REJECTED: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL2: 'Từ chối cấp cục',
      TU_CHOI: 'Từ chối cấp Cảng vụ/Chi cục',
    };
    return m[v.toUpperCase()] || v;
  }
  if (fn === 'operationalStatus' || fn === 'Tình trạng' || fn === 'Tình trạng hoạt động') {
    const m: Record<string, string> = {
      OPERATIONAL: 'Đang khai thác/vận hành',
      NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
      SUSPENDED: 'Dừng khai thác/vận hành',
      HIEN_HANH: 'Hiện hành',
      TAM_NGUNG: 'Tạm ngừng',
      DANG_KHAI_THAC: 'Đang khai thác/vận hành',
      CHUA_KHAI_THAC: 'Chưa khai thác/vận hành',
      DUNG_KHAI_THAC: 'Dừng khai thác/vận hành',
    };
    return m[v.toUpperCase()] || v;
  }
  if (fn === 'provinceId' || fn === 'province' || fn === 'Địa điểm (Tỉnh/Thành Phố)' || fn === 'Địa điểm (Tỉnh/Thành phố)' || fn === 'Tỉnh/Thành phố') {
    const num = Number(v);
    if (!isNaN(num) && num >= 1 && num <= VIETNAM_PROVINCES.length) {
      return VIETNAM_PROVINCES[num - 1];
    }
    return v;
  }
  if (fn === 'geometryType' || fn === 'Loại đối tượng' || fn === 'Loại đối tượng GIS') {
    const m: Record<string, string> = {
      POINT: 'Điểm',
      LINE: 'Đường',
      POLYGON: 'Vùng',
    };
    return m[v.toUpperCase()] || v;
  }
  if (fn === 'coordinateSystem' || fn === 'Hệ quy chiếu') {
    const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
    return m[v] || v;
  }
  if (fn.endsWith('At') || fn.endsWith('Date') || fn.includes('Thời điểm') || fn.includes('Ngày')) {
    try {
      let d = dayjs(v);
      if (!d.isValid()) { d = dayjs(v.replace(/\.\d+$/, '')); }
      return d.isValid() ? (fn.includes('openingAnnouncementDate') || fn.includes('Thời điểm công bố') || fn.includes('Ngày') ? d.format('DD/MM/YYYY') : d.format('DD/MM/YYYY HH:mm')) : v;
    } catch { return v; }
  }
  return v;
}

function historyTimestamp(item: any): string {
  return item.approvedDate || item.changedAt || item.createdAt || '';
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

function splitHistoryFileNames(value: string | null | undefined): string[] {
  const text = String(value || '').trim();
  if (!text || ['—', '-', '(null)', 'null', '(trống)', 'undefined', '[]', 'chưa có', 'chua co'].includes(text.toLowerCase())) return [];
  const stripPrefix = (name: string): string => name.trim().replace(/^(thêm|xóa|cũ|mới|them|xoa|cu|moi)\s*:?\s+/i, '').trim();
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((it: any) => {
          if (it === null || it === undefined) return '';
          if (typeof it === 'string') return stripPrefix(it);
          if (typeof it === 'object' && it.fileName) return stripPrefix(it.fileName);
          if (typeof it === 'object' && it.name) return stripPrefix(it.name);
          return stripPrefix(String(it));
        }).filter(Boolean);
      }
    } catch {
      // Fallback
    }
  }
  return text
    .split(/[,\n;]/)
    .map((item) => stripPrefix(item))
    .filter((item) => item && !['—', '-', '(null)', 'null', '(trống)', 'undefined'].includes(item.toLowerCase()));
}

function consolidateHistoryChanges(changes: Array<{ field: string; oldValue: string | null; newValue: string | null }>): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  if (!Array.isArray(changes) || changes.length <= 1) return changes || [];
  const result: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];
  const attachmentChanges: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];

  for (const c of changes) {
    const norm = normalizeHistoryKey(c.field);
    if (norm.includes('dinh kem') || norm.includes('attachment') || norm.includes('tep tin') || norm.includes('file')) {
      attachmentChanges.push(c);
    } else {
      const existing = result.find(r => normalizeHistoryKey(r.field) === norm);
      if (existing) {
        existing.newValue = c.newValue;
      } else {
        result.push({ ...c });
      }
    }
  }

  if (attachmentChanges.length > 0) {
    if (attachmentChanges.length === 1) {
      result.push(attachmentChanges[0]);
    } else {
      const allOldFiles: string[] = [];
      const allNewFiles: string[] = [];
      for (const ac of attachmentChanges) {
        splitHistoryFileNames(ac.oldValue).forEach(f => {
          if (!allOldFiles.includes(f)) allOldFiles.push(f);
        });
        splitHistoryFileNames(ac.newValue).forEach(f => {
          if (!allNewFiles.includes(f)) allNewFiles.push(f);
        });
      }
      const netOld = allOldFiles.filter(f => !allNewFiles.includes(f));
      const netNew = allNewFiles.filter(f => !allOldFiles.includes(f));
      if (netOld.length > 0 || netNew.length > 0) {
        result.push({
          field: 'Tài liệu đính kèm',
          oldValue: netOld.length > 0 ? netOld.join(', ') : '—',
          newValue: netNew.length > 0 ? netNew.join(', ') : '—',
        });
      }
    }
  }

  return result;
}

function renderHistoryValueTag(field: string, val: string | null) {
  if (val === null || val === undefined || val === '—' || val === '' || val === '-' || val === '–') {
    return <span style={{ color: textTertiary }}>—</span>;
  }
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);
  const rawValue = String(val ?? '').trim();

  // ── Tài liệu đính kèm: hiển thị từng tên tệp kèm icon FileOutlined ──
  if (normKey.includes('dinh kem') || normKey.includes('attachment') || normKey.includes('tep tin') || normKey.includes('file')) {
    const fileNames = splitHistoryFileNames(rawValue);
    if (fileNames.length === 0) return <span style={{ color: textTertiary }}>—</span>;
    if (fileNames.length === 1) {
      return (
        <span title={fileNames[0]} style={{ display: 'inline-flex', alignItems: 'center', gap: spaceXs, minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
          <FileOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
          <span>{fileNames[0]}</span>
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: spaceXs, minWidth: 0, maxWidth: '100%' }}>
        {fileNames.map((fileName, fi) => (
          <span key={fi} title={fileName} style={{ display: 'inline-flex', alignItems: 'center', gap: spaceXs, minWidth: 0, maxWidth: '100%' }}>
            <FileOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
            <span style={{ color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{fileName}</span>
          </span>
        ))}
      </span>
    );
  }

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

  // Tình trạng (operationalStatus) không dùng badge — hiển thị text bình thường theo yêu cầu người dùng
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

export default function StormShelterListPage() {
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const userPermissions = useAuthStore((s) => s.user?.permissions) || [];
  const isAuditViewer = userPermissions.includes('admin:manage') || userPermissions.includes('admin:operation');
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);

  const [orgUnit, setOrgUnit] = useState<string | undefined>(undefined);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [filterPortId, setFilterPortId] = useState<string | undefined>();
  const [filterBuoyStationId, setFilterBuoyStationId] = useState<string | undefined>();
  const [filterNavigationChannelId, setFilterNavigationChannelId] = useState<string | undefined>();
  const [filterClassification, setFilterClassification] = useState<string | undefined>();
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
  const [filterOperationalStatus, setFilterOperationalStatus] = useState<string | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('all');
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [dataSource, setDataSource] = useState<StormShelterArea[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [, setError] = useState<Error | null>(null);
  const [sortField, setSortField] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [symbolImageMap, setSymbolImageMap] = useState<Map<string, string>>(new Map());
  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    organizations.forEach(o => m.set(o.id, o.name));
    return m;
  }, [organizations]);
  const [portOptions, setPortOptions] = useState<{ value: string; label: string }[]>([]);
  const [buoyStationOptions, setBuoyStationOptions] = useState<{ value: string; label: string }[]>([]);
  const [buoyStationMap, setBuoyStationMap] = useState<Map<string, string>>(new Map());
  const [waterwayOptions, setWaterwayOptions] = useState<{ value: string; label: string }[]>([]);
  const [waterwayMap, setWaterwayMap] = useState<Map<string, string>>(new Map());

  const portMap = useMemo(() => {
    const m = new Map<string, string>();
    portOptions.forEach((o) => m.set(o.value, o.label));
    return m;
  }, [portOptions]);

  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editStormShelterId, setEditStormShelterId] = useState<string | undefined>();
  const [editBaseStatus, setEditBaseStatus] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const stormShelterFormRef = useRef<any>(null);

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<StormShelterArea | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<StormShelterArea | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<StormShelterArea | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<StormShelterArea | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('draft');

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<StormShelterArea | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<StormShelterArea | null>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load master data
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
  }, []);

  useEffect(() => {
    if (orgUnit !== undefined && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [orgUnit, initialLoadDone]);

  // Luồng hàng hải (bộ lọc: chỉ lấy đã phê duyệt)
  useEffect(() => {
    navigationChannelCRUD.search({ approvalStatus: 'APPROVED', page: 0, size: 1000 })
      .then((r) => {
        const items = r.items || [];
        setWaterwayOptions(items.map(n => ({
          value: n.id,
          label: n.channelName || n.channelCode || '',
        })));
      })
      .catch(() => {});
  }, []);

  // Luồng hàng hải (map hiển thị tên bảng & lịch sử)
  useEffect(() => {
    navigationChannelCRUD.search({ page: 0, size: 1000 })
      .then((r) => {
        const m = new Map<string, string>();
        (r.items || []).forEach(n => { m.set(n.id, n.channelName || n.channelCode || ''); });
        setWaterwayMap(m);
      })
      .catch(() => {});
  }, []);

  // Cảng biển
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

  // Bến phao (bộ lọc: chỉ lấy đã phê duyệt, lọc theo orgUnit và portId)
  useEffect(() => {
    (async () => {
      try {
        const params: any = { page: 1, pageSize: 1000, approvalStatus: 'APPROVED' };
        if (orgUnit && orgUnit !== '__all__') params.orgUnitId = orgUnit;
        if (filterPortId) params.portId = filterPortId;
        const r = await buoyBerthCRUD.search(params);
        setBuoyStationOptions((r.data || []).map((b: any) => ({
          value: b.id,
          label: b.buoyBerthName || b.buoyBerthCode || b.id,
        })));
      } catch {}
    })();
  }, [orgUnit, filterPortId]);

  // Bến phao (map hiển thị tên bảng & lịch sử)
  useEffect(() => {
    (async () => {
      try {
        const r = await buoyBerthCRUD.search({ page: 1, pageSize: 1000 });
        const m = new Map<string, string>();
        (r.data || []).forEach((b: any) => { m.set(b.id, b.buoyBerthName || b.buoyBerthCode || ''); });
        setBuoyStationMap(m);
      } catch {}
    })();
  }, []);

  const fetchCounts = useCallback(async (oid: string | undefined) => {
    try {
      const rs = await Promise.allSettled(
        TAB_STATUS_LIST.map(t =>
          t.key === 'all'
            ? stormShelterCRUD.search({ orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 })
            : stormShelterCRUD.search({ approvalStatus: TAB_QUERY_MAP[t.key], orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 })
        )
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
    setIsLoading(true); setIsError(false); setError(null);
    try {
      const r = await stormShelterCRUD.search({
        orgUnitId: (orgUnit && orgUnit !== '__all__') ? orgUnit : undefined,
        stormShelterName: nameInput.trim() || undefined,
        stormShelterCode: codeInput.trim() || undefined,
        portId: filterPortId,
        navigationChannelId: filterNavigationChannelId,
        buoyStationId: filterBuoyStationId,
        classification: filterClassification,
        provinceId: filterProvince ? (VIETNAM_PROVINCES.indexOf(filterProvince) + 1) : undefined,
        operationalStatus: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page, pageSize,
      });
      setDataSource(r.data); setTotal(r.total);
    } catch (ex: unknown) {
      setIsError(true); setError(ex instanceof Error ? ex : new Error('Không thể tải danh sách khu tránh, trú bão'));
    } finally {
      setIsLoading(false);
    }
  }, [
    orgUnit, nameInput, codeInput, filterPortId, filterNavigationChannelId,
    filterBuoyStationId, filterClassification, filterProvince, filterOperationalStatus,
    filterUpdatedFrom, filterUpdatedTo, activeTab, page, pageSize,
  ]);

  useEffect(() => { if (initialLoadDone) void fetchData(); }, [fetchData, initialLoadDone]);
  useEffect(() => { void fetchCounts(orgUnit); }, [orgUnit, fetchCounts]);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    void fetchData();
  }, [fetchData]);

  const handleFilterReset = useCallback(() => {
    const oid = defaultOrgUnitRef.current || '__all__';
    setOrgUnit(oid);
    setNameInput('');
    setCodeInput('');
    setFilterPortId(undefined);
    setFilterBuoyStationId(undefined);
    setFilterNavigationChannelId(undefined);
    setFilterClassification(undefined);
    setFilterProvince(undefined);
    setFilterOperationalStatus(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => { setActiveTab(key); setPage(1); }, []);

  const openDetailDrawer = useCallback(async (record: StormShelterArea) => {
    setDetailDrawerVisible(true); setDetailRecord(record); setDetailFiles([]);
    try {
      const r = await api.get(`/v1/storm-shelter/${record.id}/attachments`);
      setDetailFiles(r.data?.data || []);
    } catch { setDetailFiles([]); }
    try {
      const fresh = await stormShelterCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch {}
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerVisible(false);
    setDetailRecord(null);
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

  const openDeleteModal = useCallback((record: StormShelterArea) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await stormShelterCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa khu tránh, trú bão');
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

  const handleApprove = useCallback(async (record: StormShelterArea, content?: string) => {
    try {
      if (record.approvalStatus === 'PENDING_APPROVAL' || record.approvalStatus === 'PROPOSED' || record.approvalStatus === 'CHO_PHE_DUYET') {
        await stormShelterApproval.approveC1(record.id, content);
      } else {
        await stormShelterApproval.approveC2(record.id, content);
      }
      toast.success(record.approvalStatus === 'PENDING_APPROVAL' ? 'Đã phê duyệt cấp Cảng vụ/Chi cục' : 'Đã phê duyệt cấp Cục');
      setApproveModalOpen(false); setApprovingRecord(null); void fetchData(); void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Phê duyệt thất bại');
    }
  }, [fetchData, fetchCounts, orgUnit]);

  const handleSubmitApproval = useCallback((record: StormShelterArea) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmitApproval = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await stormShelterCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' } as any);
      toast.success('Đã gửi phê duyệt');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Gửi thất bại');
    }
  }, [submittingRecord, fetchData, fetchCounts, orgUnit]);

  const openRejectModal = useCallback((record: StormShelterArea) => {
    setRejectingRecord(record); setRejectReason(''); setRejectError(''); setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) { setRejectError('Vui lòng nhập lý do từ chối'); return; }
    try {
      await stormShelterApproval.rejectStage(rejectingRecord.id, reason, rejectingRecord.approvalStatus);
      toast.success('Từ chối thành công');
      setRejectModalOpen(false); setRejectingRecord(null); setRejectReason(''); setRejectError('');
      void fetchData(); void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, orgUnit]);

  const openHistory = useCallback(async (r: StormShelterArea) => {
    setHistoryTarget(r); setHistoryOpen(true); setHistoryLoading(true); setHistoryRecords([]);
    setHistoryFilters({ keyword: '' });
    try {
      const res = await api.get(`/v1/storm-shelter/${r.id}/history`);
      const d = res.data?.data;
      const list = Array.isArray(d?.changeHistory) ? d.changeHistory.filter((x: any) => x.fieldName !== 'CREATE') : [];
      setHistoryRecords(list);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const filteredHistory = useMemo(() => {
    const q = (historyFilters.keyword || '').trim().toLowerCase();
    const from = historyFilters.fromDate || '';
    const to = historyFilters.toDate || '';
    return (Array.isArray(historyRecords) ? historyRecords : []).filter((r: any) => {
      const fn = String(r?.fieldName || r?.changedField || '').trim();
      if (EXCLUDED_CHANGE_FIELDS.has(fn)) return false;
      if (q) {
        const label = histField(fn) || fn;
        const rawHits = [fn, label, r?.oldValue, r?.newValue, r?.previousValue, r?.value, r?.reason, r?.ghiChu, r?.note]
          .filter((v) => v !== null && v !== undefined)
          .map((v) => String(v).toLowerCase());
        const resolvedOld = histVal(fn, r?.oldValue, orgMap, symbolMap, portMap, buoyStationMap, waterwayMap);
        const resolvedNew = histVal(fn, r?.newValue, orgMap, symbolMap, portMap, buoyStationMap, waterwayMap);
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
  }, [historyRecords, historyFilters, orgMap, symbolMap, portMap, buoyStationMap, waterwayMap]);

  const hasActiveHistoryFilter = !!(historyFilters.keyword?.trim() || historyFilters.fromDate || historyFilters.toDate);

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'portId', 'stormShelterCode', 'stormShelterName', 'navigationChannelId',
    'buoyStationId', 'classification', 'provinceId', 'province', 'detailedLocation', 'operationalStatus', 'approvalStatus',
    'shapeDescription', 'area', 'designWaterDepth', 'currentWaterDepth', 'bottomElevationDesign',
    'maxVesselDWT', 'activeStormShelterCount', 'publishedStormShelterCount', 'underInvestmentStormShelterCount',
    'remarks', 'openingAnnouncementDate', 'publicDecision', 'investmentAgreement',
    'coordinateSystem', 'displayRule', 'mapSymbolId', 'spatialId',
    'Tọa độ GPS', 'Tọa độ GIS', 'Loại đối tượng', 'Loại đối tượng GIS', 'Phạm vi khu nước neo buộc tàu', 'Danh sách khu nước neo buộc tàu', 'Tài liệu đính kèm',
    // Vietnamese label aliases:
    'Đơn vị quản lý', 'Thuộc cảng biển', 'Cảng biển', 'Mã khu tránh, trú bão', 'Tên khu tránh, trú bão',
    'Thuộc luồng hàng hải', 'Luồng hàng hải', 'Thuộc bến phao', 'Bến phao', 'Phân loại',
    'Địa điểm (Tỉnh/Thành Phố)', 'Địa điểm (Tỉnh/Thành phố)', 'Tỉnh/Thành phố', 'Địa điểm chi tiết',
    'Tình trạng', 'Trạng thái', 'Hình dạng', 'Diện tích (ha)',
    'Độ sâu khu nước theo thiết kế (m)', 'Độ sâu theo thiết kế (m)',
    'Độ sâu khu nước hiện tại (m)', 'Độ sâu hiện tại (m)',
    'Cao độ đáy bến thiết kế', 'Cỡ tàu lớn nhất (DWT)', 'Cỡ tàu khai thác (DWT)',
    'Số lượng khu đang khai thác', 'Số khu đang khai thác',
    'Số lượng khu đã công bố', 'Số khu đã công bố',
    'Số lượng khu đang thỏa thuận đầu tư', 'Số khu thỏa thuận đầu tư',
    'Ghi chú', 'Thời điểm công bố mở', 'Quyết định công bố', 'Thỏa thuận đầu tư xây dựng',
    'Hệ quy chiếu', 'Quy tắc hiển thị', 'Biểu tượng', 'Biểu tượng bản đồ',
  ];

  const renderStormShelterHistoryTimeline = (records: any[]) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...safeRecords].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const isUpdateAction = (status: string, reason?: string) => {
      const s = String(status || '').toUpperCase();
      const r = String(reason || '').toLowerCase();
      return s === 'UPDATED' || s === 'UPDATE' || s === 'EDIT' || s === 'ATTACHMENT_UPLOADED' || s === 'ATTACHMENT_DELETED'
        || r.includes('cập nhật') || r.includes('chỉnh sửa') || r.includes('tải lên') || r.includes('xóa tệp') || r.includes('xóa tài liệu');
    };
    const groups: { tsSec: number; ts: string; actor: string; status?: any; approvalLevel?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const actor = historyActor(r);
      const prev = groups[groups.length - 1];
      const isBothUpdate = prev && isUpdateAction(prev.status, prev.items[0]?.reason) && isUpdateAction(r.status, r.reason);
      const isSameGroup = prev && Math.abs(prev.tsSec - sec) <= 2 && prev.actor === actor && (prev.status === r.status || isBothUpdate);
      if (isSameGroup) {
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
    const fmtTime = (ts: string) => { try { return dayjs(ts).format('HH:mm DD/MM/YYYY'); } catch { return ts || '—'; } };
    return (
      <div>{groups.map((g, gi) => {
        const rec0 = g.items[0] || {};
        const orgId = rec0.orgUnitId || historyTarget?.orgUnitId;
        const orgName = orgId ? orgMap.get(orgId) : undefined;
        const unitName = (orgName ? (orgName.split(' - ').pop() || orgName) : (rec0.orgUnitName || rec0.unitName)) || '—';
        const rawChanges = g.items.flatMap((item: any) => historyChangeRows(item));
        const changes = consolidateHistoryChanges(rawChanges).sort((a: any, b: any) => {
          const ia = HISTORY_FIELD_ORDER.indexOf(a.field);
          const ib = HISTORY_FIELD_ORDER.indexOf(b.field);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }).filter((c: any) => c.field && !EXCLUDED_CHANGE_FIELDS.has(c.field));
        const actionMeta = resolveHistoryActionMeta(g, changes);
        const isCreate = actionMeta.label === 'Thêm mới' || changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
        const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
        const barColor = actionMeta.color;
        const formatHistoryValue = (fn: string, raw: string | null) => {
          if (raw === null || raw === undefined || raw === '(null)' || raw === 'null' || raw === '') return null;
          const t = String(raw).trim();
          if (!t || t === '(null)' || t === 'null') return null;
          if (t.startsWith('[') && t.endsWith(']')) {
            if (t === '[]') return 'Không có';
            const parts = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
            return `${parts.length} hạng mục`;
          }
          const resolved = histVal(fn, t, orgMap, symbolMap, portMap, buoyStationMap, waterwayMap);
          if (resolved !== t) {
            return resolved;
          }
          if (NUMERIC_HISTORY_FIELDS.has(fn)) {
            if (/^-?\d+(\.\d+)?$/.test(t) || t === '100000000000000000000' || t === '10000000000000000000' || t.includes('100.000.000.000.000.000.000') || t.includes('100,000,000,000,000,000,000')) {
              return formatHistoryNumber(t);
            }
          }
          return resolved;
        };
        const validChanges = changes.filter((c: any) => {
          if (!c.field || EXCLUDED_CHANGE_FIELDS.has(c.field)) return false;
          const ov = formatHistoryValue(c.field, c.oldValue);
          const nv = formatHistoryValue(c.field, c.newValue);
          if (ov == null && nv == null) return false;
          if (ov === nv) return false;
          if (typeof ov === 'string' && typeof nv === 'string' && ov.trim() === nv.trim()) return false;
          return true;
        });
        const reasons = g.items.map((i: any) => i.reason || i.ghiChu || i.note).filter(Boolean);
        if (validChanges.length === 0 && reasons.length === 0) return null;
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
              {validChanges.length > 0 ? (
                <div>
                  {validChanges.map((change, ri: number) => {
                    const fn = change.field;
                    const ov = formatHistoryValue(fn, change.oldValue);
                    const nv = formatHistoryValue(fn, change.newValue);
                    const renderCell = (rawVal: string | null) => {
                      if ((fn === 'mapSymbolId' || fn === 'Biểu tượng bản đồ' || fn === 'Biểu tượng') && rawVal && rawVal !== '(null)') {
                        const img = symbolImageMap.get(rawVal);
                        const name = symbolMap.get(rawVal) || rawVal;
                        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}{name}</span>;
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

  const filterContent = (
    <>
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
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tên khu tránh, trú bão</div>
        <Input
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          placeholder="Tìm theo tên khu tránh, trú bão"
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onPressEnter={handleFilterApply}
          allowClear
          prefix={<SearchOutlined style={{ color: textTertiary }} />}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Tình trạng</div>
        <Select
          style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          placeholder="Chọn tình trạng"
          allowClear
          value={filterOperationalStatus}
          onChange={v => setFilterOperationalStatus(v)}
          options={[
            { value: 'OPERATIONAL', label: 'Đang khai thác/vận hành' },
            { value: 'NOT_YET_OPERATIONAL', label: 'Chưa khai thác/vận hành' },
            { value: 'SUSPENDED', label: 'Dừng khai thác/vận hành' },
          ]}
        />
      </div>
      {filterCollapsed && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc cảng biển</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn cảng biển"
              allowClear
              showSearch
              value={filterPortId}
              onChange={v => {
                setFilterPortId(v);
                setFilterBuoyStationId(undefined);
              }}
              options={portOptions}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc luồng hàng hải</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn luồng hàng hải"
              allowClear
              showSearch
              value={filterNavigationChannelId}
              onChange={v => setFilterNavigationChannelId(v)}
              options={waterwayOptions}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Thuộc bến phao</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn bến phao"
              allowClear
              showSearch
              value={filterBuoyStationId}
              onChange={v => setFilterBuoyStationId(v)}
              options={buoyStationOptions}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Mã khu tránh, trú bão</div>
            <Input
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Tìm theo mã khu tránh, trú bão"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              onPressEnter={handleFilterApply}
              allowClear
              prefix={<SearchOutlined style={{ color: textTertiary }} />}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Phân loại</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn phân loại"
              allowClear
              showSearch
              value={filterClassification}
              onChange={v => setFilterClassification(v)}
              options={STORM_SHELTER_CLASSIFICATION_OPTIONS}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành phố)</div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn tỉnh/thành phố"
              allowClear
              showSearch
              value={filterProvince}
              onChange={v => setFilterProvince(v)}
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
              options={VIETNAM_PROVINCES.map(p => ({ value: p, label: p }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>Ngày cập nhật</div>
            <DatePicker.RangePicker
              {...getRangePickerProps({ width: '100%', borderRadius: radiusPill, height: 40 })}
              allowClear
              value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
              onChange={(dates) => {
                setFilterUpdatedFrom(dates?.[0] ? dates[0].startOf('day').format('YYYY-MM-DD 00:00:00') : undefined);
                setFilterUpdatedTo(dates?.[1] ? dates[1].endOf('day').format('YYYY-MM-DD 23:59:59') : undefined);
                setPage(1);
              }}
            />
          </div>
        </>
      )}
    </>
  );

  const rowActions = useCallback((record: StormShelterArea) => {
    const actions: any[] = [{ key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) }];
    const st = record.approvalStatus || '';
    const editable = canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'stormshelter', extraApprovePerms: ['stormshelter:approve'] });
    if (editable) {
      actions.push({
        key: 'edit', label: 'Chỉnh sửa', icon: icons.edit,
        onClick: () => { setEditStormShelterId(record.id); setEditBaseStatus(record.approvalStatus); setCreateDrawerVisible(true); },
      });
    }
    if (['DRAFT', 'NHAP'].includes(st) && hasPerm('stormshelter:update')) {
      actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    }
    if (['REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && hasPerm('stormshelter:update')) {
      actions.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    }
    if (hasPerm('stormshelter:history')) {
      actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
    }
    if (hasPerm('stormshelter:approvec1') && st === 'PENDING_APPROVAL') {
      actions.push({ key: 'approve_c1', label: 'Phê duyệt cấp Cảng vụ/Chi cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
      actions.push({ key: 'reject_c1', label: 'Từ chối cấp Cảng vụ/Chi cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
    }
    if (hasPerm('stormshelter:approvec2') && st === 'APPROVED_LEVEL1') {
      actions.push({ key: 'approve_c2', label: 'Phê duyệt cấp Cục', icon: icons.approve, onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); } });
      actions.push({ key: 'reject_c2', label: 'Từ chối cấp Cục', icon: icons.reject, danger: true, onClick: () => openRejectModal(record) });
    }
    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'stormshelter', extraDeletePerms: ['pier:delete', 'port:delete'] })) {
      actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
    }
    return actions;
  }, [hasPerm, openDetailDrawer, openHistory, handleSubmitApproval, openRejectModal, openDeleteModal]);

  const auditColumns = useMemo(() => {
    if (!isAuditViewer) return [];
    return [
      {
        label: 'Cán bộ gửi Phê duyệt', dataIndex: 'submittedForApprovalAt', key: 'submittedForApprovalAt', width: 230, sortable: true,
        render: (v: string | null, record: StormShelterArea) => {
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
        render: (v: string | null, record: StormShelterArea) => {
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
        render: (v: string | null, record: StormShelterArea) => {
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
    if (field === 'orgUnitId') return resolveOrgLevel2Name(organizations, r.orgUnitId) || r.orgUnitName || orgMap.get(r.orgUnitId || '') || '';
    if (field === 'stormShelterName') return r.stormShelterName ?? '';
    if (field === 'stormShelterCode') return r.stormShelterCode ?? '';
    if (field === 'portId') return r.portName || portMap.get(r.portId) || r.portId || '';
    if (field === 'navigationChannelId') return (r as any).navigationChannelName || waterwayMap.get(r.navigationChannelId) || r.navigationChannelId || '';
    if (field === 'buoyStationId') return r.buoyStationName || buoyStationMap.get(r.buoyStationId) || r.buoyStationId || '';
    if (field === 'provinceId' || field === 'province') return r.provinceId ? (VIETNAM_PROVINCES[Number(r.provinceId) - 1] || '') : ((r as any).province || '');
    if (field === 'classification') return r.classification ?? '';
    if (field === 'operationalStatus') {
      return OPERATIONAL_STYLE_MAP[r.operationalStatus]?.label || r.operationalStatus || '';
    }
    if (field === 'approvalStatus') return (APPROVAL_STYLE_MAP[r.approvalStatus] || APPROVAL_STYLE_MAP[r.approvalStatus?.toUpperCase()])?.label || r.approvalStatus || '';
    if (field === 'updatedAt' || field === 'updatedByName') {
      const t = r.updatedAt || r.createdAt;
      return t ? new Date(t).getTime() : 0;
    }
    if (field === 'submittedForApprovalAt') {
      const t = r.submittedForApprovalAt;
      return t ? new Date(t).getTime() : 0;
    }
    if (field === 'portAuthorityApprovedAt') {
      const t = r.portAuthorityApprovedAt;
      return t ? new Date(t).getTime() : 0;
    }
    if (field === 'departmentApprovedAt') {
      const t = r.departmentApprovedAt;
      return t ? new Date(t).getTime() : 0;
    }
    return r[field] ?? '';
  }, [organizations, orgMap, portMap, buoyStationMap, waterwayMap]);

  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        label: 'STT', key: 'stt', width: 60, fixed: 'left' as const, align: 'center' as const,
        render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + i + 1}</span>,
      },
      {
        label: <span>Tên/Mã khu tránh, trú bão</span>, dataIndex: 'stormShelterName', key: 'stormShelterName', width: 220, fixed: 'left' as const, sortable: true, ellipsis: false,
        render: (v: string, record: StormShelterArea) => (
          <div>
            <a title={v || ''} onClick={(e) => { e.stopPropagation(); openDetailDrawer(record); }} style={{ ...cellTitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>{v || ''}</a>
            <span style={{ ...cellSubtitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.stormShelterCode || ''}</span>
          </div>
        ),
      },
      {
        label: 'Đơn vị quản lý', dataIndex: 'orgUnitId', key: 'orgUnitId', width: 260, sortable: true,
        render: (v: string | null, r: StormShelterArea) => <span style={{ fontWeight: fontWeightBold }}>{resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(v || '') || ''}</span>,
      },
      {
        label: 'Thuộc cảng biển', dataIndex: 'portId', key: 'portId', width: 200, sortable: true,
        render: (v: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{portMap.get(v || '') || v || ''}</span>,
      },
      {
        label: 'Thuộc luồng hàng hải', dataIndex: 'navigationChannelId', key: 'navigationChannelId', width: 280, ellipsis: true, sortable: true,
        render: (v?: string, r?: StormShelterArea) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{(r as any)?.navigationChannelName || (v ? (waterwayMap.get(v) || v) : '')}</span>,
      },
      {
        label: 'Thuộc bến phao', dataIndex: 'buoyStationId', key: 'buoyStationId', width: 220, sortable: true,
        render: (v: string, r: StormShelterArea) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{r.buoyStationName || (v ? buoyStationMap.get(v) || v : '')}</span>,
      },
      {
        label: 'Địa điểm (Tỉnh/Thành phố)', dataIndex: 'provinceId', key: 'provinceId', width: 230, sortable: true,
        render: (v?: number) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{v ? (VIETNAM_PROVINCES[Number(v) - 1] || String(v)) : ''}</span>,
      },
      {
        label: 'Tình trạng', dataIndex: 'operationalStatus', key: 'operationalStatus', width: 240, ellipsis: false, sortable: true,
        render: (v: string) => { const b = v && OPERATIONAL_STYLE_MAP[v]; return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : null; },
      },
      {
        label: 'Trạng thái', dataIndex: 'approvalStatus', key: 'approvalStatus', width: 320, ellipsis: false, sortable: true,
        render: (v: string) => {
          const s = v && (APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v.toUpperCase()]);
          return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : null;
        },
      },
      {
        label: 'Cán bộ cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', width: 200, sortable: true,
        render: (v: string, record: StormShelterArea) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || ''}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ),
      },
    ];
    const tailColumns: any[] = [];
    const allColumns = [...baseColumns, ...tailColumns, ...auditColumns];
    return allColumns.map(col => ({ ...col, sortOrder: col.sortable && col.key === sortField ? sortOrder : undefined }));
  }, [page, pageSize, organizations, orgMap, portMap, buoyStationMap, waterwayMap, userMap, auditColumns, sortField, sortOrder, openDetailDrawer]);

  const headerActions = useMemo(() => {
    const actions: Array<{ key: string; label: string; variant: 'primary' | 'outline' | 'subtle'; icon?: React.ReactNode; onClick: () => void }> = [];
    if (hasPerm('stormshelter:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary',
        icon: icons.create,
        onClick: () => {
          setEditStormShelterId(undefined);
          setEditBaseStatus(undefined);
          createForm.resetFields();
          setCreateDrawerVisible(true);
        },
      });
    }
    return actions;
  }, [hasPerm, createForm]);

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd } as unknown as ThemeToken}>
      <div className="storm-shelter-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .storm-shelter-page-wrapper,
          .storm-shelter-page-wrapper .ant-table,
          .storm-shelter-page-wrapper .ant-table-cell,
          .storm-shelter-page-wrapper .ant-table-thead > tr > th,
          .storm-shelter-page-wrapper .ant-table-tbody > tr > td,
          .storm-shelter-page-wrapper .ant-input,
          .storm-shelter-page-wrapper .ant-select,
          .storm-shelter-page-wrapper .ant-select-selection-item,
          .storm-shelter-page-wrapper .ant-select-item-option-content,
          .storm-shelter-page-wrapper .ant-picker,
          .storm-shelter-page-wrapper .ant-picker-input > input,
          .storm-shelter-page-wrapper .ant-btn,
          .storm-shelter-page-wrapper .ant-pagination,
          .storm-shelter-page-wrapper .ant-pagination-item,
          .storm-shelter-page-wrapper .ant-pagination-total-text,
          .storm-shelter-page-wrapper .ant-breadcrumb,
          .storm-shelter-page-wrapper .ant-form-item-label > label,
          .storm-shelter-page-wrapper .ant-tabs-tab,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-drawer-content,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-tabs-tab,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-input,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-select,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-btn,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-table,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-table-cell,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-table-thead > tr > th,
          .storm-shelter-page-wrapper .storm-shelter-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
          /* ── Drawer tạo/sửa/chi tiết ── */
          .storm-shelter-drawer-scope,
          .storm-shelter-drawer-scope .ant-drawer-content,
          .storm-shelter-drawer-scope .ant-tabs-tab,
          .storm-shelter-drawer-scope .ant-drawer-content .ant-form-item-label > label,
          .storm-shelter-drawer-scope .chk-detail-label,
          .storm-shelter-drawer-scope .chk-detail-value,
          .storm-shelter-drawer-scope .ant-table,
          .storm-shelter-drawer-scope .ant-table-cell,
          .storm-shelter-drawer-scope .ant-table-thead > tr > th,
          .storm-shelter-drawer-scope .ant-table-tbody > tr > td,
          .storm-shelter-drawer-scope .ant-input,
          .storm-shelter-drawer-scope .ant-select,
          .storm-shelter-drawer-scope .ant-btn {
            font-size: 13.5px !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed]) {
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
          .storm-shelter-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .storm-shelter-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          /* ── Responsive Drawers ── */
          .storm-shelter-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
          @media (max-width: 1024px) {
            .storm-shelter-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .storm-shelter-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
          }
          @media (max-width: 640px) {
            .storm-shelter-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
              padding: 8px 0 !important;
            }
            .storm-shelter-drawer-scope .chk-detail-label {
              width: 100% !important;
            }
            .storm-shelter-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
          .storm-shelter-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label {
            height: auto !important;
            min-height: 44px !important;
            align-items: flex-start !important;
          }
          .storm-shelter-drawer-scope .ant-form-item.cn-op-2line-label .ant-form-item-label > label {
            height: auto !important;
            white-space: normal !important;
            line-height: 1.45 !important;
            overflow-wrap: break-word;
          }
        `}</style>
        <ScreenHeader
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý khu tránh, trú bão' }]}
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

        {/* ── Single Drawer: Thêm mới & Chỉnh sửa (chuẩn Pier/Anchorage) ── */}
        <Drawer
          {...drawerProps}
          rootClassName="storm-shelter-drawer-scope"
          className="storm-shelter-drawer-scope"
          width="min(920px, 96vw)"
          title={<span style={{ ...drawerTitleStyle, fontSize: 16 }}>{editStormShelterId ? 'Chỉnh sửa thông tin Khu tránh, trú bão' : 'Thêm mới Khu tránh, trú bão'}</span>}
          open={createDrawerVisible}
          destroyOnHidden
          onClose={() => { setCreateDrawerVisible(false); createForm.resetFields(); }}
          afterOpenChange={(open) => { if (!open) { setEditStormShelterId(undefined); setEditBaseStatus(undefined); } }}
          extra={<Button type="text" onClick={() => { setCreateDrawerVisible(false); createForm.resetFields(); }} style={drawerCloseBtnStyle}>✕</Button>}
          footer={<div style={drawerFooterStyle}>{(() => {
            const st = !editStormShelterId ? 'DRAFT' : (editBaseStatus ? normalizeApprovalStatus(editBaseStatus) : 'DRAFT');
            if (st === 'APPROVED') {
              return (
                <Button htmlType="button" type="primary" onClick={() => { setActionType('approve'); stormShelterFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                  Lưu và phê duyệt
                </Button>
              );
            }
            if (st === 'REJECTED_LEVEL1' || st === 'REJECTED_LEVEL2' || st.startsWith('REJECTED')) {
              return (
                <Button htmlType="button" type="primary" onClick={() => { setActionType('submit'); stormShelterFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>
                  Lưu và gửi phê duyệt
                </Button>
              );
            }
            return (
              <>
                <Button htmlType="button" onClick={() => { setActionType('draft'); stormShelterFormRef.current?.submit('DRAFT'); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>
                  Lưu tạm
                </Button>
                <Button htmlType="button" type="primary" onClick={() => { setActionType('submit'); stormShelterFormRef.current?.submit('SUBMIT'); }} loading={submitting && actionType === 'submit'} style={primaryButtonStyle}>
                  Lưu và gửi phê duyệt
                </Button>
                <Button htmlType="button" type="primary" onClick={() => { setActionType('approve'); stormShelterFormRef.current?.submit('APPROVED'); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>
                  Lưu và phê duyệt
                </Button>
              </>
            );
          })()}</div>}
          styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}
        >
          <Form form={createForm} layout="vertical">
            <style>{requiredMarkStyle}</style>
            <StormShelterForm
              ref={stormShelterFormRef}
              form={createForm}
              id={editStormShelterId}
              onFinish={() => {
                setCreateDrawerVisible(false);
                void fetchData();
                void fetchCounts(orgUnit);
              }}
              onSubmittingChange={setSubmitting}
            />
          </Form>
        </Drawer>

        {/* ── Detail Drawer ── */}
        <Drawer
          {...drawerProps}
          rootClassName="storm-shelter-drawer-scope"
          className="storm-shelter-drawer-scope"
          size={1000}
          title={<span style={drawerTitleStyle}>Chi tiết khu tránh, trú bão{detailRecord ? ` - ${detailRecord.stormShelterName}` : ''}</span>}
          open={detailDrawerVisible}
          destroyOnClose
          onClose={closeDetailDrawer}
          extra={<Button type="text" onClick={closeDetailDrawer} style={drawerCloseBtnStyle}>✕</Button>}
          styles={{ header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 }, body: { padding: '0 24px 12px 24px' } }}
          footer={null}
        >
          {detailRecord && (
            <StormShelterDetailContent
              selectedRecord={detailRecord}
              orgMap={orgMap}
              organizations={organizations}
              symbolMap={symbolMap}
              symbolImageMap={symbolImageMap}
              portOptions={portOptions}
              portMap={portMap}
              buoyStationMap={buoyStationMap}
              waterwayOptions={waterwayOptions.length > 0 ? waterwayOptions : Array.from(waterwayMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
              buoyStationOptions={buoyStationOptions.length > 0 ? buoyStationOptions : Array.from(buoyStationMap.entries()).map(([id, name]) => ({ value: id, label: name }))}
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

        {/* ── Modal Xóa (DeleteConfirmModal) ── */}
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
          itemType="khu tránh, trú bão"
          itemName={deletingRecord?.stormShelterName}
          itemCode={deletingRecord?.stormShelterCode}
        />

        {/* ── Modal Từ chối ── */}
        <Modal
          styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
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
            <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho khu tránh, trú bão:</p>
            {rejectingRecord && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectingRecord.stormShelterCode} — {rejectingRecord.stormShelterName}</strong></p>}
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

        {/* ── Modal Gửi phê duyệt ── */}
        <Modal
          styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Gửi phê duyệt</span>}
          open={submitModalOpen}
          onCancel={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
          footer={[
            <Button key="cancel" onClick={() => { setSubmitModalOpen(false); setSubmittingRecord(null); }}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
            <Button key="submit" type="primary" onClick={confirmSubmitApproval}
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}>Xác nhận</Button>,
          ]}
          width={480}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: fontSizeMd, color: textPrimary }}>
              Xác nhận gửi phê duyệt khu tránh, trú bão <strong>{submittingRecord?.stormShelterName}</strong>?
            </p>
          </div>
        </Modal>

        {/* ── Modal Phê duyệt 2 cấp (ApprovalModal) ── */}
        <ApprovalModal
          visible={approveModalOpen}
          level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' || approvingRecord?.approvalStatus === 'APPROVED_LEVEL2' ? 'c2' : 'c1'}
          onConfirm={(content) => { if (approvingRecord) handleApprove(approvingRecord, content); }}
          onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
        />

        {/* ── History Drawer ── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="storm-shelter-drawer-scope"
          className="storm-shelter-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  Lịch sử thay đổi — {historyTarget?.stormShelterName || historyTarget?.stormShelterCode || ''}
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
              renderStormShelterHistoryTimeline(filteredHistory)
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
