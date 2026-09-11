/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button, Modal, Input, Select, DatePicker,
  Space, Typography, Form, Drawer,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  daiTtdhCRUD,
  daiTtdhApproval,
} from '../../services/portService';
import type { DaiTtdh } from '../../types/port';
import { AppDrawer } from '../../components/shared/AppDrawer';
import { organizationService } from '../../services/organizationService';
import { FilterOrgUnitTreeSelect, resolveOrgLevel2Name, resolveDefaultOrgUnitId } from '../../components/org-unit';
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
import DaiTtdhForm, { DAI_TTDH_STATION_LEVEL_OPTIONS, DAI_TTDH_SERVICES_OPTIONS } from './DaiTtdhForm';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../../services/operatingOrganizationsData';
import DaiTtdhDetailContent from './DaiTtdhDetailContent';
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
  historyOldValueStyle, historyNewValueStyle, historyArrowStyle,
  icons, statusBadgeStyle,
  cellTitleStyle, cellSubtitleStyle,
} from '../../themetokenchk';
import { colors } from '../../themetokenchk';

// ── Cỡ chữ 13.5px đồng bộ chuẩn VTS CHK (theo PierListPage / PortListPage) ─────
const fontSizeMd = 13.5;

// ── Constants ────────────────────────────────────────────────────────

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
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
  { key: 'APPROVED_LEVEL1', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: 'APPROVED_LEVEL2', label: 'Chờ phê duyệt cấp cục', color: statusAttention },
  { key: 'APPROVED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_LEVEL1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_LEVEL2', label: 'Từ chối cấp cục', color: statusCritical },
];

const TAB_QUERY_MAP: Record<string, string | undefined> = {
  all: undefined,
  DRAFT: 'DRAFT',
  APPROVED_LEVEL1: 'APPROVED_LEVEL1',
  APPROVED_LEVEL2: 'APPROVED_LEVEL2',
  APPROVED: 'APPROVED',
  REJECTED_LEVEL1: 'REJECTED_LEVEL1',
  REJECTED_LEVEL2: 'REJECTED_LEVEL2',
};

// ── Helper: format date ──────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

// ── History helpers (chuẩn VTS CHK — Pier pattern) ─────────────────────

const histLabels: Record<string, string> = {
  daiTtdhCode: 'Mã đài',
  daiTtdhName: 'Tên đài',
  orgUnitId: 'Đơn vị quản lý',
  operatingUnitId: 'Đơn vị khai thác',
  stationLevel: 'Phân loại đài',
  provinceId: 'Địa điểm (Tỉnh/Thành phố)',
  detailedLocation: 'Địa điểm chi tiết',
  operationalStatus: 'Tình trạng hoạt động',
  coverageArea: 'Vùng phủ sóng',
  servicesProvided: 'Dịch vụ cung cấp',
  remarks: 'Ghi chú',
  mapSymbolId: 'Biểu tượng',
  approvalStatus: 'Trạng thái',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  submittedForApprovalAt: 'Ngày gửi phê duyệt',
  submittedForApprovalBy: 'Người gửi phê duyệt',
  portAuthorityApprovedAt: 'Ngày duyệt Cảng vụ',
  portAuthorityApprovedBy: 'Người duyệt Cảng vụ',
  portAuthorityApprovalContent: 'Nội dung phê duyệt Cảng vụ',
  departmentApprovedAt: 'Ngày duyệt Cục',
  departmentApprovedBy: 'Người duyệt Cục',
  departmentApprovalContent: 'Nội dung phê duyệt Cục',
  rejectionReason: 'Lý do từ chối',
  createdBy: 'Người tạo',
  createdAt: 'Ngày tạo',
  updatedBy: 'Người cập nhật',
  updatedAt: 'Ngày cập nhật',
  'Tọa độ GIS': 'Tọa độ GIS',
  coordinates: 'Tọa độ GIS',
  gisLocation: 'Tọa độ GIS',
  spatialId: 'Tọa độ GIS',
  'Loại đối tượng GIS': 'Loại đối tượng GIS',
  geometryType: 'Loại đối tượng GIS',
  objectType: 'Loại đối tượng GIS',
  'Tài liệu đính kèm': 'Tài liệu đính kèm',
  attachments: 'Tài liệu đính kèm',
  attachmentList: 'Tài liệu đính kèm',
  'Trạng thái': 'Hành động',
};

function histField(fn: string): string {
  if (histLabels[fn]) return histLabels[fn];
  const targetKey = normalizeHistoryKey(fn);
  for (const [k, v] of Object.entries(histLabels)) {
    if (normalizeHistoryKey(k) === targetKey || normalizeHistoryKey(v) === targetKey) return v;
  }
  return fn;
}

function histVal(
  fn: string,
  val: string | null,
  orgMap?: Map<string, string>,
  symbolMap?: Map<string, string>,
  userMap?: Map<string, string>,
  operatingUnitMap?: Map<string, string>,
): string {
  if (!val || val === '(null)' || val === 'null' || val === '-' || val === '—' || val === '–') return '';
  const trimmedVal = val.trim();
  const valLower = trimmedVal.toLowerCase();
  const normKey = normalizeHistoryKey(fn);

  if (
    normKey === 'loai doi tuong gis' ||
    normKey === 'loai hinh hoc' ||
    normKey === 'geometrytype' ||
    normKey === 'objecttype'
  ) {
    const m: Record<string, string> = {
      POINT: 'Đối tượng điểm',
      LINE: 'Đối tượng đường',
      LINESTRING: 'Đối tượng đường',
      POLYGON: 'Đối tượng vùng',
      MULTIPOINT: 'Tập hợp điểm',
    };
    return m[trimmedVal.toUpperCase()] || trimmedVal;
  }

  if (
    normKey === 'operatingunitid' ||
    normKey === 'operating_unit_id' ||
    normKey === 'donvikhaitac' ||
    normKey === 'don vi khai thac' ||
    normKey === 'don vi van hanh'
  ) {
    if (operatingUnitMap) {
      const mapped = operatingUnitMap.get(trimmedVal) || operatingUnitMap.get(valLower);
      if (mapped) return mapped;
    }
    const found = DEFAULT_OPERATING_ORGANIZATIONS.find(
      (o) => o.id === trimmedVal || o.id.toLowerCase() === valLower || o.code === trimmedVal || o.code.toLowerCase() === valLower
    );
    if (found) return found.name;
    return trimmedVal;
  }

  if (
    normKey === 'orgunitid' ||
    normKey === 'org_unit_id' ||
    normKey === 'donviquanly' ||
    normKey === 'don vi quan ly' ||
    normKey === 'don vi'
  ) {
    if (orgMap) {
      const full = orgMap.get(trimmedVal) || orgMap.get(valLower);
      if (full) return full.split(' - ').pop() || full;
    }
    return trimmedVal;
  }

  if (
    normKey === 'submittedforapprovalby' ||
    normKey === 'portauthorityapprovedby' ||
    normKey === 'departmentapprovedby' ||
    normKey === 'createdby' ||
    normKey === 'updatedby' ||
    normKey === 'approvedby' ||
    normKey.includes('nguoi gui phe duyet') ||
    normKey.includes('nguoi duyet') ||
    normKey.includes('nguoi tao') ||
    normKey.includes('nguoi cap nhat')
  ) {
    if (userMap) {
      const u = userMap.get(trimmedVal) || userMap.get(valLower);
      if (u) return u;
    }
    return trimmedVal;
  }

  if (
    normKey === 'servicesprovided' ||
    normKey === 'services_provided' ||
    normKey === 'dichvucungcap' ||
    normKey === 'dich vu cung cap'
  ) {
    const parts = trimmedVal.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    const mappedParts = parts.map((code) => {
      const opt = DAI_TTDH_SERVICES_OPTIONS.find(
        (o) => o.value === code || o.value.toLowerCase() === code.toLowerCase()
      );
      return opt ? opt.label : code;
    });
    return mappedParts.join(', ');
  }

  if (
    normKey === 'stationlevel' ||
    normKey === 'station_level' ||
    normKey === 'phanloaidai' ||
    normKey === 'phan loai dai' ||
    normKey === 'loaidai' ||
    normKey === 'loai dai'
  ) {
    const num = Number(trimmedVal);
    if (Number.isFinite(num)) {
      const opt = DAI_TTDH_STATION_LEVEL_OPTIONS.find((o) => o.value === num);
      if (opt) return opt.label;
    }
    const m: Record<string, string> = {
      '0': 'Đài thông tin duyên hải loại I',
      '1': 'Đài thông tin duyên hải loại II',
      '2': 'Đài thông tin duyên hải loại III',
      '3': 'Đài thông tin duyên hải loại IV',
      '4': 'Đài thông tin duyên hải loại V',
      LOAI_I: 'Đài thông tin duyên hải loại I',
      LOAI_II: 'Đài thông tin duyên hải loại II',
      LOAI_III: 'Đài thông tin duyên hải loại III',
      LOAI_IV: 'Đài thông tin duyên hải loại IV',
      LOAI_V: 'Đài thông tin duyên hải loại V',
    };
    return m[trimmedVal.toUpperCase()] || trimmedVal;
  }

  if (
    normKey === 'approvalstatus' ||
    normKey === 'approval_status' ||
    normKey === 'trangthai' ||
    normKey === 'trang thai' ||
    normKey === 'trang thai phe duyet'
  ) {
    const m: Record<string, string> = {
      NHAP: 'Lưu tạm',
      DRAFT: 'Lưu tạm',
      CHO_PHE_DUYET: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      PENDING_APPROVAL: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      PENDING: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL1: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
      APPROVED_LEVEL2: 'Chờ phê duyệt cấp cục',
      DA_PHE_DUYET: 'Đã phê duyệt',
      APPROVED: 'Đã phê duyệt',
      TU_CHOI: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL1: 'Từ chối cấp Cảng vụ/Chi cục',
      REJECTED_LEVEL2: 'Từ chối cấp cục',
    };
    return m[trimmedVal.toUpperCase()] || trimmedVal;
  }

  if (
    normKey === 'operationalstatus' ||
    normKey === 'operational_status' ||
    normKey === 'tinhtranghoatdong' ||
    normKey === 'tinh trang hoat dong' ||
    normKey === 'tinhtrang' ||
    normKey === 'tinh trang'
  ) {
    const m: Record<string, string> = {
      OPERATIONAL: 'Đang khai thác/vận hành',
      NOT_YET_OPERATIONAL: 'Chưa khai thác/vận hành',
      SUSPENDED: 'Dừng khai thác/vận hành',
      DANG_KHAI_THAC: 'Đang khai thác/vận hành',
      CHUA_KHAI_THAC: 'Chưa khai thác/vận hành',
      DUNG_KHAI_THAC: 'Dừng khai thác/vận hành',
    };
    return m[trimmedVal.toUpperCase()] || trimmedVal;
  }

  if (
    normKey === 'provinceid' ||
    normKey === 'province_id' ||
    normKey === 'province' ||
    normKey === 'tinhthanhpho' ||
    normKey === 'tinh thanh pho' ||
    normKey === 'dia diem (tinh/thanh pho)'
  ) {
    const num = Number(trimmedVal);
    if (Number.isFinite(num) && num >= 1 && num <= VIETNAM_PROVINCES.length) {
      return VIETNAM_PROVINCES[num - 1];
    }
    return trimmedVal;
  }

  if (
    normKey === 'mapsymbolid' ||
    normKey === 'map_symbol_id' ||
    normKey === 'bieutuong' ||
    normKey === 'bieu tuong' ||
    normKey === 'ky hieu ban do'
  ) {
    if (symbolMap) return symbolMap.get(trimmedVal) || trimmedVal;
    return trimmedVal;
  }

  if (
    normKey === 'coordinatesystem' ||
    normKey === 'coordinate_system' ||
    normKey === 'hequychieu' ||
    normKey === 'he quy chieu'
  ) {
    const m: Record<string, string> = { '1': 'WGS-84', '2': 'VN-2000' };
    return m[trimmedVal] || trimmedVal;
  }

  if (normKey.endsWith('at') || normKey.endsWith('date') || normKey.includes('ngay')) {
    try {
      let d = dayjs(trimmedVal);
      if (!d.isValid()) d = dayjs(trimmedVal.replace(/\.\d+$/, ''));
      return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : trimmedVal;
    } catch { return trimmedVal; }
  }

  // Fallback UUID resolution for ANY field
  if (operatingUnitMap) {
    const opName = operatingUnitMap.get(trimmedVal) || operatingUnitMap.get(valLower);
    if (opName) return opName;
  }
  const defOp = DEFAULT_OPERATING_ORGANIZATIONS.find(
    (o) => o.id === trimmedVal || o.id.toLowerCase() === valLower || o.code === trimmedVal || o.code.toLowerCase() === valLower
  );
  if (defOp) return defOp.name;

  if (orgMap) {
    const orgName = orgMap.get(trimmedVal) || orgMap.get(valLower);
    if (orgName) return orgName.split(' - ').pop() || orgName;
  }

  if (userMap) {
    const userName = userMap.get(trimmedVal) || userMap.get(valLower);
    if (userName) return userName;
  }

  return trimmedVal;
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
  const fields = normalizedHistoryFields(String(item.changedField || item.fieldName || item.field || '').trim());
  const oldValue = item.previousValue ?? item.oldValue ?? null;
  const newValue = item.newValue ?? null;
  const oldAssignments = parseHistoryAssignments(oldValue);
  const newAssignments = parseHistoryAssignments(newValue);
  if (fields.length === 0) return [{ field: '', oldValue, newValue }];
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

function parseGisWktCoordinates(value: string): { typeName: string; points: Array<{ x: string; y: string }> } | null {
  const str = (value || '').trim();
  const typeMatch = /^(POINT|MULTIPOINT|LINESTRING|LINE|POLYGON)\s*\(/i.exec(str);
  if (!typeMatch) return null;
  const type = typeMatch[1].toUpperCase();
  const typeName = type === 'POINT' ? 'Điểm'
    : type === 'LINESTRING' || type === 'LINE' ? 'Đường'
      : type === 'POLYGON' ? 'Vùng' : 'Tập hợp điểm';
  let inner = str.slice(str.indexOf('(') + 1);
  if (inner.endsWith(')')) inner = inner.slice(0, -1);
  if (type === 'POLYGON') {
    inner = inner.trim();
    if (inner.startsWith('(') && inner.endsWith(')')) inner = inner.slice(1, -1);
  }
  const points = inner
    .split(',')
    .map((s) => s.replace(/[()]/g, '').trim().split(/\s+/).filter(Boolean))
    .filter((p) => p.length >= 2)
    .map((p) => ({ x: p[0], y: p[1] }));
  if (points.length === 0) return null;
  return { typeName, points };
}

function formatGisDms(xStr: string, yStr: string): string {
  const x = Number(xStr);
  const y = Number(yStr);
  const toDms = (val: number, isLat: boolean): string => {
    if (!Number.isFinite(val)) return '';
    const abs = Math.abs(val);
    const d = Math.floor(abs);
    const mFloat = (abs - d) * 60;
    const m = Math.floor(mFloat);
    const s = Math.round((mFloat - m) * 600) / 10;
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    return `${d}°${String(m).padStart(2, '0')}'${s.toFixed(1).padStart(4, '0')}"${dir}`;
  };
  if (!Number.isFinite(x) || !Number.isFinite(y)) return `${xStr}, ${yStr}`;
  let lat = y;
  let lng = x;
  if (Math.abs(x) <= 90 && Math.abs(y) > 90) { lat = x; lng = y; }
  return `${toDms(lat, true)}, ${toDms(lng, false)}`;
}

function splitHistoryFileNames(value: string): string[] {
  const text = (value || '').trim();
  if (!text || ['—', '-', '(null)', 'null', '(trống)', 'undefined', '[]', 'chua co'].includes(text.toLowerCase())) return [];
  const stripPrefix = (name: string): string => name.trim().replace(/^(them|xoa|cu|moi)\s*:?\s+/i, '').trim();
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((it: any) => {
          if (it === null || it === undefined) return '';
          if (typeof it === 'string') return it;
          if (typeof it === 'object') return it?.originalName || it?.fileName || it?.name || it?.storagePath || '';
          return String(it);
        }).map(stripPrefix).filter(Boolean);
      }
    } catch { /* fall through */ }
  }
  return text.split(/[,;\n]+/).map(stripPrefix).filter((n) => n && !['—', '-', '(null)', 'null', '(trống)', 'undefined'].includes(n.toLowerCase()));
}

function renderHistoryValueTag(field: string, val: string | null) {
  if (val === null || val === undefined || val === '—' || val === '') {
    return '';
  }
  const normKey = normalizeHistoryKey(field);
  const normVal = normalizeHistoryKey(val);
  const rawValue = String(val ?? '').trim();

  // Tài liệu đính kèm
  if (normKey.includes('dinh kem') || normKey.includes('attachment') || normKey.includes('tep tin') || normKey.includes('file')) {
    const fileNames = splitHistoryFileNames(rawValue);
    if (fileNames.length === 0) return '';
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: spaceXs, minWidth: 0, maxWidth: '100%' }}>
        {fileNames.map((fileName, fi) => (
          <span key={fi} title={fileName} style={{ display: 'inline-flex', alignItems: 'center', gap: spaceXs, minWidth: 0, maxWidth: '100%' }}>
            <span style={{ color: actionPrimary }}>📄</span>
            <span style={{ color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{fileName}</span>
          </span>
        ))}
      </span>
    );
  }

  // GIS WKT
  const gisParsed = parseGisWktCoordinates(rawValue);
  const isGisField = normKey.includes('toa do') || normKey.includes('coordinate') || normKey.includes('gis') || normKey.includes('khong gian') || normKey === 'spatialid';
  if (gisParsed) {
    const { typeName, points } = gisParsed;
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: spaceXs, minWidth: 0, maxWidth: '100%' }}>
        <span style={{ fontSize: fontSizeSm, fontWeight: fontWeightBold, color: actionPrimary, whiteSpace: 'nowrap' }}>
          {typeName} ({points.length} điểm)
        </span>
        {points.map((pt, pi) => (
          <span key={pi} style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {points.length > 1 ? <span style={{ color: textSecondary, marginRight: spaceXs }}>#{pi + 1}:</span> : null}
            {formatGisDms(pt.x, pt.y)}
          </span>
        ))}
      </span>
    );
  }
  if (isGisField && /^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?$/.test(rawValue)) {
    const pair = rawValue.split(/\s+/);
    return (
      <span style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: 1.5, wordBreak: 'break-word' }}>
        {formatGisDms(pair[0], pair[1])}
      </span>
    );
  }

  if (normKey === 'approvalstatus' || normKey === 'trang thai phe duyet' || normKey.includes('phe duyet') || normKey.includes('trang thai')) {
    if (normVal === 'da duyet' || normVal === 'da phe duyet' || normVal === 'approved' || normVal === 'approved_level2') {
      return <span style={statusBadgeStyle(statusOperational)}>{val}</span>;
    }
    if (normVal === 'cho cuc duyet' || normVal === 'approved_level1' || normVal.includes('cap 1') || normVal.includes('cuc duyet')) {
      return <span style={statusBadgeStyle(statusAttention)}>{val}</span>;
    }
    if (normVal === 'cho cang vu duyet' || normVal === 'cho phe duyet' || normVal === 'cho duyet' || normVal === 'pending' || normVal === 'pending_approval' || normVal === 'proposed' || normVal.includes('cang vu')) {
      return <span style={statusBadgeStyle(actionPrimary)}>{val}</span>;
    }
    if (normVal === 'tu choi' || normVal.includes('rejected') || normVal.includes('tra ve')) {
      return <span style={statusBadgeStyle(statusCritical)}>{val}</span>;
    }
    return <span style={statusBadgeStyle(statusDraft)}>{val}</span>;
  }

  if (normKey === 'operationalstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    if (normVal.includes('hoat dong') || normVal.includes('operational')) {
      return <span style={statusBadgeStyle(statusOperational)}>{val}</span>;
    }
    if (normVal.includes('chua khai thac') || normVal.includes('not yet') || normVal.includes('chua')) {
      return <span style={statusBadgeStyle(statusAttention)}>{val}</span>;
    }
    if (normVal.includes('dung') || normVal.includes('suspended') || normVal.includes('ngung')) {
      return <span style={statusBadgeStyle(statusCritical)}>{val}</span>;
    }
  }

  return <span title={val} style={{ minWidth: 0, color: textPrimary, fontWeight: fontWeightMedium, overflowWrap: 'anywhere' }}>{val}</span>;
}

function resolveHistoryActionMeta(group: any, changes: any[]): { label: string; color: string; bg: string } {
  const item = group.items?.[0] || {};
  const rawStatus = String(item.status ?? item.action ?? item.actionType ?? '').toUpperCase();
  const rawReason = String(item.reason ?? item.ghiChu ?? item.note ?? '').toLowerCase();

  if (rawStatus === 'CREATED' || rawStatus === 'CREATE' || rawReason.includes('tạo mới') || rawReason.includes('thêm mới') || rawReason.includes('tao moi') || rawReason.includes('them moi')) {
    return { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}18` };
  }
  if (rawStatus === 'ATTACHMENT_UPLOADED' || rawReason.includes('tải lên') || rawReason.includes('tai len') || String(item.changedField || '').includes('đính kèm')) {
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
    const k = normalizeHistoryKey(String(c.field || c.fieldName || ''));
    return k === 'approvalstatus' || k === 'trang thai phe duyet';
  });

  if (approvalChange) {
    const nv = normalizeHistoryKey(String(approvalChange.newValue || ''));
    if (nv.includes('rejected_level1') || (nv.includes('tra ve') && nv.includes('cang vu')) || nv.includes('tu choi cap cang vu')) {
      return { label: 'Từ chối cấp Cảng vụ', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv.includes('rejected_level2') || (nv.includes('tra ve') && nv.includes('cuc')) || nv.includes('tu choi cap cuc')) {
      return { label: 'Từ chối cấp Cục', color: statusCritical, bg: `${statusCritical}18` };
    }
    if (nv === 'cho cuc duyet' || nv.includes('approved_level1') || nv.includes('da phe duyet cap 1') || nv.includes('cuc duyet')) {
      return { label: 'Phê duyệt cấp Cảng vụ', color: '#13C2C2', bg: '#13C2C218' };
    }
    if (nv === 'da duyet' || nv.includes('approved') || nv.includes('da phe duyet')) {
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
  if (rawReason.includes('cấp 2') || rawReason.includes('cap 2') || rawStatus === 'APPROVED' || rawStatus === 'APPROVE') {
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

// ── Component ────────────────────────────────────────────────────────

export default function DaiTtdhListPage() {
  const [searchParams] = useSearchParams();
  const linkedAction = searchParams.get('action');
  const linkedRecordId = searchParams.get('id');
  const isEmbeddedAction = window.self !== window.top
    && (linkedAction === 'detail' || linkedAction === 'edit')
    && !!linkedRecordId;

  const { user: authUser } = useAuthStore();
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);

  // ── Filter state ─────────────────────────────────────────────────
  const defaultOrgUnitRef = useRef<string | undefined>(undefined);
  const [orgUnit, setOrgUnit] = useState<string | undefined>(undefined);
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterStationLevel, setFilterStationLevel] = useState<number | undefined>();
  const [filterProvince, setFilterProvince] = useState<string | undefined>();
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
  const [operatingOrgs, setOperatingOrgs] = useState<Array<{ id: string; name: string; code?: string }>>(DEFAULT_OPERATING_ORGANIZATIONS);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => {
      map.set(o.id, o.name);
      map.set(o.id.toLowerCase(), o.name);
      if (o.code) {
        map.set(o.code, o.name);
        map.set(o.code.toLowerCase(), o.name);
      }
    });
    return map;
  }, [organizations]);

  const operatingUnitMap = useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_OPERATING_ORGANIZATIONS.forEach((o) => {
      if (o.id) {
        map.set(o.id, o.name);
        map.set(o.id.toLowerCase(), o.name);
      }
      if (o.code) {
        map.set(o.code, o.name);
        map.set(o.code.toLowerCase(), o.name);
      }
    });
    operatingOrgs.forEach((o) => {
      if (o.id) {
        map.set(o.id, o.name);
        map.set(o.id.toLowerCase(), o.name);
      }
      if (o.code) {
        map.set(o.code, o.name);
        map.set(o.code.toLowerCase(), o.name);
      }
    });
    return map;
  }, [operatingOrgs]);

  // ── Tab counts ──────────────────────────────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // ── Drawer state: Hợp nhất Create & Edit (Chuẩn PierListPage) ──
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [editDaiTtdhId, setEditDaiTtdhId] = useState<string | undefined>();
  const [editBaseStatus, setEditBaseStatus] = useState<string | undefined>();
  const [createForm] = Form.useForm();
  const daiTtdhFormRef = useRef<any>(null);

  // ── Submit loading tròn theo actionType ─────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('submit');

  // ── Detail drawer ───────────────────────────────────────────────
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DaiTtdh | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // ── Delete confirmation modal ───────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DaiTtdh | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Reject modal ────────────────────────────────────────────────
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRecord, setRejectingRecord] = useState<DaiTtdh | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // ── Submit/Approve modal ────────────────────────────────────────
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState<DaiTtdh | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<DaiTtdh | null>(null);

  // ── History drawer & reactive filter ────────────────────────────
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<DaiTtdh | null>(null);
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
        const resolvedOld = histVal(fn, r?.oldValue, orgMap, symbolMap, userMap, operatingUnitMap);
        const resolvedNew = histVal(fn, r?.newValue, orgMap, symbolMap, userMap, operatingUnitMap);
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
  }, [historyRecords, historyFilters, orgMap, symbolMap, userMap, operatingUnitMap]);

  const hasActiveHistoryFilter = !!(historyFilters.keyword?.trim() || historyFilters.fromDate || historyFilters.toDate);

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // ── Load initial lookups (User, Org, Symbol, Operating Unit) ────
  useEffect(() => {
    (async () => {
      try {
        const r = await organizationService.list({ pageSize: 1000 });
        const data = r.data || [];
        setOrganizations(data);
        const resolvedDefault = resolveDefaultOrgUnitId(authUser, data);
        setOrgUnit(resolvedDefault);
        defaultOrgUnitRef.current = resolvedDefault;
      } catch { /* ignore */ }
    })();

    (async () => {
      try {
        const r = await userService.list({ pageSize: 1000 });
        const u = r.data || (r as any).content || [];
        const m = new Map<string, string>();
        u.forEach((x: any) => {
          const name = x.fullName || x.username || x.id;
          m.set(x.id, name);
          m.set(x.id.toLowerCase(), name);
          if (x.username) m.set(x.username, name);
        });
        setUserMap(m);
      } catch { /* ignore */ }
    })();

    api.get('/common/options/operating-units').then((r) => {
      const list = r.data?.data;
      if (Array.isArray(list) && list.length) setOperatingOrgs(list);
    }).catch(() => {});

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
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (orgUnit !== undefined && !initialLoadDone) {
      setInitialLoadDone(true);
    }
  }, [orgUnit, initialLoadDone]);

  // ── Fetch counts ────────────────────────────────────────────────
  const fetchCounts = useCallback(async (oid: string | undefined) => {
    try {
      const rs = await Promise.allSettled(
        TAB_STATUS_LIST.map((t) =>
          t.key === 'all'
            ? daiTtdhCRUD.search({ orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 })
            : daiTtdhCRUD.search({ approvalStatus: TAB_QUERY_MAP[t.key], orgUnitId: (oid && oid !== '__all__') ? oid : undefined, page: 1, pageSize: 1 }),
        ),
      );
      const c: Record<string, number> = {};
      rs.forEach((r, i) => {
        c[TAB_STATUS_LIST[i]?.key || 'all'] = r.status === 'fulfilled' ? r.value.total : 0;
      });
      setTabCounts(c);
    } catch { /* ignore */ }
  }, []);

  // ── Fetch main data ─────────────────────────────────────────────
  const fetchData = useCallback(async (targetPage?: number) => {
    const pageToFetch = targetPage !== undefined ? targetPage : page;
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const r = await daiTtdhCRUD.search({
        orgUnitId: (orgUnit && orgUnit !== '__all__') ? orgUnit : undefined,
        daiTtdhName: filterName.trim() || undefined,
        daiTtdhCode: filterCode.trim() || undefined,
        stationLevel: filterStationLevel,
        provinceId: filterProvince ? (VIETNAM_PROVINCES.indexOf(filterProvince) + 1) : undefined,
        operationalStatus: filterOperationalStatus,
        approvalStatus: TAB_QUERY_MAP[activeTab],
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
        page: pageToFetch,
        pageSize,
      });
      setDataSource(r.data);
      setTotal(r.total);
    } catch (ex: unknown) {
      setIsError(true);
      setError(ex instanceof Error ? ex : new Error('Không thể tải danh sách đài TTDH'));
    } finally {
      setIsLoading(false);
    }
  }, [orgUnit, filterName, filterCode, filterStationLevel, filterProvince,
    filterOperationalStatus, activeTab, filterUpdatedFrom, filterUpdatedTo, page, pageSize]);

  useEffect(() => {
    if (initialLoadDone) void fetchData();
  }, [fetchData, initialLoadDone]);

  useEffect(() => {
    void fetchCounts(orgUnit);
  }, [orgUnit, fetchCounts]);

  // ── Filter handlers ─────────────────────────────────────────────
  const handleFilterApply = useCallback(() => {
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitRef.current;
    setOrgUnit(defaultOrg);
    setFilterName('');
    setFilterCode('');
    setFilterStationLevel(undefined);
    setFilterProvince(undefined);
    setFilterOperationalStatus(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setActiveTab('all');
    setPage(1);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setPage(1);
  }, []);

  // ── Detail drawer ────────────────────────────────────────────────
  const openDetailDrawer = useCallback(async (record: DaiTtdh) => {
    setDetailDrawerVisible(true);
    setDetailRecord(record);
    setDetailFiles([]);
    try {
      const res = await api.get(`/v1/dai-ttdh/${record.id}/attachments`, { params: { page: 0, size: 50 } });
      setDetailFiles(res.data?.data || []);
    } catch { setDetailFiles([]); }
    try {
      const fresh = await daiTtdhCRUD.findById(record.id);
      setDetailRecord(fresh);
    } catch { /* keep current */ }
  }, []);

  // ── Embedded iframe action support ──────────────────────────────
  const notifyEmbeddedActionClosed = useCallback(() => {
    if (isEmbeddedAction) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, window.location.origin);
    }
  }, [isEmbeddedAction]);

  useEffect(() => {
    if (!isEmbeddedAction || !linkedRecordId) return;
    let cancelled = false;
    daiTtdhCRUD.findById(linkedRecordId)
      .then((record) => {
        if (cancelled) return;
        if (linkedAction === 'detail') {
          void openDetailDrawer(record);
        } else {
          setEditDaiTtdhId(linkedRecordId);
          setEditBaseStatus(record.approvalStatus);
          setCreateDrawerVisible(true);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Không tải được chi tiết đài TTDH');
      });
    return () => { cancelled = true; };
  }, [isEmbeddedAction, linkedAction, linkedRecordId, openDetailDrawer]);

  const closeFormDrawer = useCallback(() => {
    setCreateDrawerVisible(false);
    createForm.resetFields();
    notifyEmbeddedActionClosed();
  }, [createForm, notifyEmbeddedActionClosed]);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerVisible(false);
    setDetailRecord(null);
    notifyEmbeddedActionClosed();
  }, [notifyEmbeddedActionClosed]);

  // ── Delete confirmation ─────────────────────────────────────────
  const openDeleteModal = useCallback((record: DaiTtdh) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      await daiTtdhCRUD.delete(deletingRecord.id);
      toast.success('Đã xóa đài TTDH');
      setDeleteModalOpen(false);
      setDeletingRecord(null);
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingRecord, fetchData, fetchCounts, orgUnit]);

  // ── Approval handlers (Chuẩn 2 cấp VTS CHK) ─────────────────────
  const handleApprove = useCallback(async (record: DaiTtdh, content?: string) => {
    try {
      if (record.approvalStatus === 'APPROVED_LEVEL1') {
        await daiTtdhApproval.approveC1(record.id, content);
      } else {
        await daiTtdhApproval.approveC2(record.id, content);
      }
      toast.success(record.approvalStatus === 'APPROVED_LEVEL1' ? 'Đã phê duyệt cấp Cảng vụ/Chi cục' : 'Đã phê duyệt cấp Cục');
      setApproveModalOpen(false);
      setApprovingRecord(null);
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Phê duyệt thất bại');
    }
  }, [fetchData, fetchCounts, orgUnit]);

  const handleSubmitApproval = useCallback((record: DaiTtdh) => {
    setSubmittingRecord(record);
    setSubmitModalOpen(true);
  }, []);

  const confirmSubmitApproval = useCallback(async () => {
    if (!submittingRecord) return;
    try {
      await daiTtdhCRUD.update({ id: submittingRecord.id, saveAction: 'SUBMIT' });
      toast.success('Đã gửi phê duyệt');
      setSubmitModalOpen(false);
      setSubmittingRecord(null);
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (ex: unknown) {
      toast.error(ex instanceof Error ? ex.message : 'Gửi phê duyệt thất bại');
    }
  }, [submittingRecord, fetchData, fetchCounts, orgUnit]);

  const openRejectModal = useCallback((record: DaiTtdh) => {
    setRejectingRecord(record);
    setRejectReason('');
    setRejectError('');
    setRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingRecord) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await daiTtdhApproval.rejectStage(rejectingRecord.id, reason, rejectingRecord.approvalStatus);
      toast.success('Từ chối thành công');
      setRejectModalOpen(false);
      setRejectingRecord(null);
      setRejectReason('');
      setRejectError('');
      setPage(1);
      void fetchData();
      void fetchCounts(orgUnit);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  }, [rejectingRecord, rejectReason, fetchData, fetchCounts, orgUnit]);

  // ── History drawer ──────────────────────────────────────────────
  const openHistory = useCallback(async (r: DaiTtdh) => {
    setHistoryTarget(r);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryRecords([]);
    setHistoryFilters({ keyword: '' });

    // Make sure userMap is loaded for mapping user IDs
    if (userMap.size === 0) {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users = resp.data || (resp as any).content || [];
        const m = new Map<string, string>();
        users.forEach((u: any) => {
          const name = u.fullName || u.username || u.id;
          m.set(u.id, name);
          m.set(u.id.toLowerCase(), name);
          if (u.username) m.set(u.username, name);
        });
        setUserMap(m);
      } catch { /* silent */ }
    }

    try {
      const res = await api.get(`/v1/dai-ttdh/${r.id}/history`);
      const d = res.data?.data;
      setHistoryRecords(Array.isArray(d?.changeHistory) ? d.changeHistory.filter((item: any) => item.fieldName !== 'CREATE') : []);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }, [userMap.size]);

  const HISTORY_FIELD_ORDER = [
    'orgUnitId', 'operatingUnitId', 'daiTtdhCode', 'daiTtdhName', 'stationLevel',
    'provinceId', 'detailedLocation', 'operationalStatus', 'coverageArea', 'servicesProvided',
    'remarks', 'coordinateSystem', 'displayRule', 'mapSymbolId', 'approvalStatus',
    'submittedForApprovalAt', 'submittedForApprovalBy',
    'portAuthorityApprovedAt', 'portAuthorityApprovedBy', 'portAuthorityApprovalContent',
    'departmentApprovedAt', 'departmentApprovedBy', 'departmentApprovalContent',
    'rejectionReason', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt',
    'Tọa độ GIS', 'Loại đối tượng GIS', 'Tài liệu đính kèm',
  ];

  const renderDaiTtdhHistoryTimeline = (records: any[]) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const toSec = (ts: string) => Math.floor(new Date(ts).getTime() / 1000);
    const sorted = [...safeRecords].sort((a: any, b: any) => new Date(historyTimestamp(b) || 0).getTime() - new Date(historyTimestamp(a) || 0).getTime());
    const groups: { tsSec: number; ts: string; actor: string; status?: any; items: any[] }[] = [];
    for (const r of sorted) {
      const ts = historyTimestamp(r);
      const sec = ts ? toSec(ts) : 0;
      const actor = historyActor(r);
      const prev = groups[groups.length - 1];
      if (prev && prev.tsSec === sec && prev.actor === actor && prev.status === r.status ) {
        prev.items.push(r);
      } else {
        groups.push({ tsSec: sec, ts, actor, status: r.status, items: [r] });
      }
    }
    if (groups.length === 0) return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
          {hasActiveHistoryFilter ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có thay đổi nào được ghi nhận'}
        </div>
      </div>
    );
    const fmtTime = (ts: string) => { try { return dayjs(ts).format('HH:mm DD/MM/YYYY'); } catch { return ts || ''; } };
    return (
      <div>
        {groups.map((g, gi) => {
          const rec0 = g.items[0] || {};
          const orgId = rec0.orgUnitId || historyTarget?.orgUnitId;
          const orgName = orgId ? orgMap.get(orgId) : undefined;
          const unitName = (orgName ? (orgName.split(' - ').pop() || orgName) : (rec0.orgUnitName || rec0.unitName)) || '';
          const changes = g.items.flatMap((item: any) => historyChangeRows(item)).sort((a: any, b: any) => {
            const getOrder = (field: string) => {
              const directIdx = HISTORY_FIELD_ORDER.indexOf(field);
              if (directIdx !== -1) return directIdx;
              const norm = normalizeHistoryKey(field);
              const normIdx = HISTORY_FIELD_ORDER.findIndex((f) => normalizeHistoryKey(f) === norm || normalizeHistoryKey(histField(f)) === norm);
              return normIdx === -1 ? 999 : normIdx;
            };
            return getOrder(a.field) - getOrder(b.field);
          }).filter((c: any) => c.field !== 'attachments' && c.field !== 'spatialId');
          const isCreate = changes.every((c: any) => c.oldValue === null || c.oldValue === '(null)' || c.oldValue === '');
          const informationTitle = isCreate ? 'Thông tin thêm mới:' : 'Thông tin thay đổi:';
          const actionMeta = resolveHistoryActionMeta(g, changes);
          const barColor = actionMeta.color;
          const formatHistoryValue = (fn: string, raw: string | null) => {
            if (raw === null || raw === '(null)' || raw === '') return null;
            return histVal(fn, raw, orgMap, symbolMap, userMap, operatingUnitMap);
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
                    <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: actionMeta.bg, color: actionMeta.color, whiteSpace: 'nowrap' }}>
                      {actionMeta.label}
                    </span>
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
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
                              {name}
                            </span>
                          );
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
        })}
      </div>
    );
  };

  // ── Filter sidebar content ──────────────────────────────────────
  const filterContent = (
    <>
      <div style={{ marginBottom: 12, marginTop: spaceMd }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Đơn vị quản lý
        </div>
        <FilterOrgUnitTreeSelect
          organizations={organizations}
          placeholder="Tất cả"
          allowClear
          value={orgUnit}
          onChange={(v) => { setOrgUnit(v); setPage(1); }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Tên đài
        </div>
        <Input
          style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          placeholder="Tìm theo tên đài"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          onPressEnter={handleFilterApply}
          allowClear
          prefix={<SearchOutlined style={{ color: textTertiary }} />}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
          Tình trạng
        </div>
        <Select
          style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
          placeholder="Chọn tình trạng"
          allowClear
          value={filterOperationalStatus}
          onChange={(v) => setFilterOperationalStatus(v)}
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
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Mã đài
            </div>
            <Input
              style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Tìm theo mã đài"
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              onPressEnter={handleFilterApply}
              allowClear
              prefix={<SearchOutlined style={{ color: textTertiary }} />}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Phân loại đài
            </div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn phân loại đài"
              allowClear
              showSearch
              optionFilterProp="label"
              value={filterStationLevel}
              onChange={(v) => setFilterStationLevel(v)}
              options={DAI_TTDH_STATION_LEVEL_OPTIONS}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Địa điểm (Tỉnh/Thành phố)
            </div>
            <Select
              style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}
              placeholder="Chọn tỉnh/thành phố"
              allowClear
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              value={filterProvince}
              onChange={(v) => setFilterProvince(v)}
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, marginBottom: spaceSm }}>
              Ngày cập nhật
            </div>
            <DatePicker.RangePicker
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              allowClear
              value={[filterUpdatedFrom ? dayjs(filterUpdatedFrom) : null, filterUpdatedTo ? dayjs(filterUpdatedTo) : null]}
              onChange={(dates) => {
                setFilterUpdatedFrom(dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined);
                setFilterUpdatedTo(dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined);
              }}
              style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
            />
          </div>
        </>
      )}
    </>
  );

  // ── Row actions (Thứ tự chuẩn PierListPage) ─────────────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Lịch sử → Phê duyệt/Từ chối → Xóa
  const rowActions = useCallback((record: DaiTtdh) => {
    const actions: any[] = [
      { key: 'view', label: 'Xem chi tiết', icon: icons.view, onClick: () => openDetailDrawer(record) },
    ];
    const st = record.approvalStatus || '';
    const editable = canEditApprovalRecord(record.approvalStatus, { hasPerm, resource: 'daittdh', extraApprovePerms: ['daittdh:approve'] });
    if (editable) {
      actions.push({
        key: 'edit',
        label: 'Chỉnh sửa',
        icon: icons.edit,
        onClick: () => {
          setEditDaiTtdhId(record.id);
          setEditBaseStatus(record.approvalStatus);
          setCreateDrawerVisible(true);
        },
      });
    }
    if (['DRAFT', 'NHAP'].includes(st) && hasPerm('daittdh:update')) {
      actions.push({ key: 'submit', label: 'Gửi Cảng vụ phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    }
    if (['REJECTED_LEVEL1', 'REJECTED_LEVEL2'].includes(st) && hasPerm('daittdh:update')) {
      actions.push({ key: 'resubmit', label: 'Gửi lại phê duyệt', icon: icons.submit, onClick: () => handleSubmitApproval(record) });
    }
    if (hasPerm('daittdh:history')) {
      actions.push({ key: 'history', label: 'Lịch sử', icon: icons.history, onClick: () => openHistory(record) });
    }
    if ((hasPerm('daittdh:approvec1') || hasPerm('daittdh:approve')) && st === 'APPROVED_LEVEL1') {
      actions.push({
        key: 'approve_c1',
        label: 'Phê duyệt cấp Cảng vụ/Chi cục',
        icon: icons.approve,
        onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); },
      });
      actions.push({
        key: 'reject_c1',
        label: 'Từ chối cấp Cảng vụ/Chi cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openRejectModal(record),
      });
    }
    if ((hasPerm('daittdh:approvec2') || hasPerm('daittdh:approve')) && st === 'APPROVED_LEVEL2') {
      actions.push({
        key: 'approve_c2',
        label: 'Phê duyệt cấp Cục',
        icon: icons.approve,
        onClick: () => { setApprovingRecord(record); setApproveModalOpen(true); },
      });
      actions.push({
        key: 'reject_c2',
        label: 'Từ chối cấp Cục',
        icon: icons.reject,
        danger: true,
        onClick: () => openRejectModal(record),
      });
    }
    if (canDeleteApprovalRecord(record.approvalStatus, { hasPerm, resource: 'daittdh' })) {
      actions.push({ key: 'delete', label: 'Xóa', icon: icons.delete, danger: true, onClick: () => openDeleteModal(record) });
    }
    return actions;
  }, [hasPerm, openDetailDrawer, openHistory, handleSubmitApproval, openRejectModal, openDeleteModal]);

  // ── Audit columns (Cán bộ cập nhật / gửi duyệt / phê duyệt) ──────
  const auditColumns = useMemo(() => {
    return [
      {
        label: 'Cán bộ gửi Phê duyệt',
        dataIndex: 'submittedForApprovalAt',
        key: 'submittedForApprovalAt',
        width: 230,
        sortable: true,
        render: (v: string | null, record: DaiTtdh) => {
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
        label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
        dataIndex: 'portAuthorityApprovedAt',
        key: 'portAuthorityApprovedAt',
        width: 350,
        sortable: true,
        render: (v: string | null, record: DaiTtdh) => {
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
        label: 'Cán bộ phê duyệt cấp Cục',
        dataIndex: 'departmentApprovedAt',
        key: 'departmentApprovedAt',
        width: 260,
        sortable: true,
        render: (v: string | null, record: DaiTtdh) => {
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
  }, [userMap]);

  // ── Sorting helper ──────────────────────────────────────────────
  const getSortValue = useCallback((r: any, field: string): string | number => {
    if (field === 'orgUnitId') return resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(r.orgUnitId || '') || '';
    if (field === 'operatingUnitId') return resolveOrgLevel2Name(organizations, r.operatingUnitId) || orgMap.get(r.operatingUnitId || '') || r.operatingUnitName || r.operatingUnitId || '';
    if (field === 'daiTtdhName') return r.daiTtdhName ?? '';
    if (field === 'provinceId') return r.provinceId ? (VIETNAM_PROVINCES[r.provinceId - 1] ?? '') : '';
    if (field === 'stationLevel') return DAI_TTDH_STATION_LEVEL_OPTIONS.find((o) => o.value === r.stationLevel)?.label ?? r.stationLevel ?? '';
    if (field === 'operationalStatus') return OPERATIONAL_STYLE_MAP[r.operationalStatus]?.label || r.operationalStatus || '';
    if (field === 'approvalStatus') return (APPROVAL_STYLE_MAP[r.approvalStatus] || APPROVAL_STYLE_MAP[r.approvalStatus?.toUpperCase()])?.label || r.approvalStatus || '';
    if (field === 'updatedAt') return r.updatedAt ?? '';
    if (field === 'submittedForApprovalAt') return r.submittedForApprovalAt ?? '';
    if (field === 'portAuthorityApprovedAt') return r.portAuthorityApprovedAt ?? '';
    if (field === 'departmentApprovedAt') return r.departmentApprovedAt ?? '';
    return r[field] ?? '';
  }, [organizations, orgMap]);

  // ── Columns ─────────────────────────────────────────────────────
  const columns = useMemo(() => {
    const baseColumns: any[] = [
      {
        label: 'STT',
        key: 'stt',
        width: 60,
        fixed: 'left' as const,
        align: 'center' as const,
        render: (_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{(page - 1) * pageSize + i + 1}</span>,
      },
      {
        label: <span>Tên/Mã đài</span>,
        dataIndex: 'daiTtdhName',
        key: 'daiTtdhName',
        width: 220,
        fixed: 'left' as const,
        sortable: true,
        ellipsis: false,
        render: (v: string, record: DaiTtdh) => (
          <div>
            <a
              title={v || ''}
              onClick={(e) => { e.stopPropagation(); openDetailDrawer(record); }}
              style={{ ...cellTitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
            >
              {v || ''}
            </a>
            <span style={{ ...cellSubtitleStyle, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {record.daiTtdhCode || ''}
            </span>
          </div>
        ),
      },
      {
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        key: 'orgUnitId',
        width: 260,
        sortable: true,
        render: (v: string | null, r: DaiTtdh) => (
          <span style={{ fontWeight: fontWeightBold }}>
            {resolveOrgLevel2Name(organizations, r.orgUnitId) || orgMap.get(v || '') || ''}
          </span>
        ),
      },
      {
        label: 'Đơn vị khai thác',
        dataIndex: 'operatingUnitId',
        key: 'operatingUnitId',
        width: 220,
        sortable: true,
        render: (_v: string | null, r: DaiTtdh) => (
          <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
            {resolveOrgLevel2Name(organizations, r.operatingUnitId) || orgMap.get(r.operatingUnitId || '') || r.operatingUnitName || r.operatingUnitId || ''}
          </span>
        ),
      },
      {
        label: 'Phân loại đài',
        dataIndex: 'stationLevel',
        key: 'stationLevel',
        width: 150,
        sortable: true,
        render: (v?: number) => {
          const s = DAI_TTDH_STATION_LEVEL_OPTIONS.find((o) => o.value === v);
          return <span style={{ fontSize: fontSizeMd, color: textPrimary }}>{s?.label ?? (v != null ? v.toString() : '')}</span>;
        },
      },
      {
        label: 'Địa điểm (Tỉnh/Thành phố)',
        dataIndex: 'provinceId',
        key: 'provinceId',
        width: 250,
        sortable: true,
        render: (v?: number) => (
          <span style={{ fontSize: fontSizeMd, color: textPrimary }}>
            {v ? VIETNAM_PROVINCES[v - 1] || v.toString() : ''}
          </span>
        ),
      },
      {
        label: 'Tình trạng',
        dataIndex: 'operationalStatus',
        key: 'operationalStatus',
        width: 210,
        ellipsis: false,
        sortable: true,
        render: (v: string) => {
          const b = v && OPERATIONAL_STYLE_MAP[v];
          return b ? <span style={statusBadgeStyle(b.color)}>{b.label}</span> : null;
        },
      },
      {
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 280,
        ellipsis: false,
        sortable: true,
        render: (v: string) => {
          const s = v && (APPROVAL_STYLE_MAP[v] || APPROVAL_STYLE_MAP[v.toUpperCase()]);
          return s ? <span style={statusBadgeStyle(s.color)}>{s.label}</span> : null;
        },
      },
      {
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 200,
        sortable: true,
        render: (v: string, record: DaiTtdh) => (
          <div>
            <span style={{ fontWeight: fontWeightBold }}>{userMap.get(record.updatedBy || '') || record.updatedBy || ''}</span><br />
            <span style={{ opacity: 0.85 }}>{formatDate(v)}</span>
          </div>
        ),
      },
    ];

    const allColumns = [...baseColumns, ...auditColumns];
    return allColumns.map((col) => ({
      ...col,
      sortOrder: col.sortable ? (col.key === sortField ? sortOrder : null) : undefined,
    }));
  }, [page, pageSize, organizations, orgMap, userMap, auditColumns, sortField, sortOrder, openDetailDrawer]);

  const headerActions = useMemo(() => {
    const actions: ScreenHeaderAction[] = [];
    if (hasPerm('daittdh:create')) {
      actions.push({
        key: 'create',
        label: 'Thêm mới',
        variant: 'primary',
        icon: icons.create,
        onClick: () => {
          setEditDaiTtdhId(undefined);
          setEditBaseStatus(undefined);
          createForm.resetFields();
          createForm.setFieldsValue({ operationalStatus: 'NOT_YET_OPERATIONAL' });
          setCreateDrawerVisible(true);
        },
      });
    }
    return actions;
  }, [hasPerm, createForm]);

  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd } as unknown as ThemeToken}>
      <div className="daittdh-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <style>{`
          .daittdh-page-wrapper,
          .daittdh-page-wrapper .ant-table,
          .daittdh-page-wrapper .ant-table-cell,
          .daittdh-page-wrapper .ant-table-thead > tr > th,
          .daittdh-page-wrapper .ant-table-tbody > tr > td,
          .daittdh-page-wrapper .ant-input,
          .daittdh-page-wrapper .ant-select,
          .daittdh-page-wrapper .ant-select-selection-item,
          .daittdh-page-wrapper .ant-select-item-option-content,
          .daittdh-page-wrapper .ant-picker,
          .daittdh-page-wrapper .ant-picker-input > input,
          .daittdh-page-wrapper .ant-btn,
          .daittdh-page-wrapper .ant-pagination,
          .daittdh-page-wrapper .ant-pagination-item,
          .daittdh-page-wrapper .ant-pagination-total-text,
          .daittdh-page-wrapper .ant-breadcrumb,
          .daittdh-page-wrapper .ant-form-item-label > label,
          .daittdh-page-wrapper .ant-tabs-tab,
          .daittdh-page-wrapper .daittdh-drawer-scope,
          .daittdh-page-wrapper .daittdh-drawer-scope .ant-drawer-content,
          .daittdh-page-wrapper .daittdh-drawer-scope .ant-tabs-tab,
          .daittdh-page-wrapper .daittdh-drawer-scope .ant-input,
          .daittdh-page-wrapper .daittdh-drawer-scope .ant-select,
          .daittdh-page-wrapper .daittdh-drawer-scope .ant-btn,
          .daittdh-page-wrapper .daittdh-drawer-scope .ant-table,
          .daittdh-page-wrapper .daittdh-drawer-scope .ant-table-cell,
          .daittdh-page-wrapper .daittdh-drawer-scope .ant-table-thead > tr > th,
          .daittdh-page-wrapper .daittdh-drawer-scope .ant-form-item-label > label {
            font-size: 13.5px !important;
          }
          /* Drawer tạo/sửa/chi tiết */
          .daittdh-drawer-scope,
          .daittdh-drawer-scope .ant-drawer-content,
          .daittdh-drawer-scope .ant-tabs-tab,
          .daittdh-drawer-scope .ant-drawer-content .ant-form-item-label > label,
          .daittdh-drawer-scope .chk-detail-label,
          .daittdh-drawer-scope .chk-detail-value,
          .daittdh-drawer-scope .ant-table,
          .daittdh-drawer-scope .ant-table-cell,
          .daittdh-drawer-scope .ant-table-thead > tr > th,
          .daittdh-drawer-scope .ant-table-tbody > tr > td,
          .daittdh-drawer-scope .ant-input,
          .daittdh-drawer-scope .ant-select,
          .daittdh-drawer-scope .ant-btn {
            font-size: 13.5px !important;
          }
          .daittdh-page-wrapper div:has(> button[aria-pressed]) {
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
          .daittdh-page-wrapper div:has(> button[aria-pressed]) > button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
          }
          .daittdh-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
            height: 6px !important;
            display: block !important;
          }
          .daittdh-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 999px !important;
          }
          .daittdh-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
            background: #cbd5e1 !important;
            border-radius: 999px !important;
          }
          .daittdh-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
            background: #94a3b8 !important;
          }
          .daittdh-drawer-scope .ant-drawer-content-wrapper {
            max-width: 100vw !important;
          }
          @media (max-width: 1024px) {
            .daittdh-drawer-scope .chk-detail-grid {
              grid-template-columns: 1fr !important;
              column-gap: 0 !important;
            }
            .daittdh-drawer-scope .chk-detail-row--full {
              grid-column: 1 !important;
            }
          }
          @media (max-width: 640px) {
            .daittdh-drawer-scope .chk-detail-row {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
              padding: 8px 0 !important;
            }
            .daittdh-drawer-scope .chk-detail-label {
              width: 100% !important;
            }
            .daittdh-drawer-scope .chk-detail-value {
              width: 100% !important;
            }
          }
        `}</style>

        <ScreenHeader
          breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý đài TTDH' }]}
          actions={headerActions}
        />

        <FilterTableLayout
          filterContent={filterContent}
          statusTabs={TAB_STATUS_LIST.map((t) => ({
            key: t.key,
            label: t.label,
            color: t.color,
            count: tabCounts[t.key] ?? 0,
            active: activeTab === t.key,
          }))}
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

        {/* ── Form Drawer: Hợp nhất Thêm mới & Chỉnh sửa (Chuẩn PierListPage) ── */}
        <Drawer
          {...drawerProps}
          rootClassName="daittdh-drawer-scope"
          className="daittdh-drawer-scope"
          width="min(920px, 96vw)"
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              {editDaiTtdhId ? 'Chỉnh sửa thông tin Đài TTDH' : 'Thêm mới Đài TTDH'}
            </span>
          }
          open={createDrawerVisible}
          destroyOnClose
          onClose={closeFormDrawer}
          afterOpenChange={(open) => {
            if (!open) {
              setEditDaiTtdhId(undefined);
              setEditBaseStatus(undefined);
            }
          }}
          extra={<Button type="text" onClick={closeFormDrawer} style={drawerCloseBtnStyle}>✕</Button>}
          footer={
            <div style={drawerFooterStyle}>
              {(() => {
                const st = !editDaiTtdhId ? 'DRAFT' : (editBaseStatus ? normalizeApprovalStatus(editBaseStatus) : 'DRAFT');
                if (st === 'APPROVED' || st === 'APPROVED_LEVEL2') {
                  return (
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('approve'); daiTtdhFormRef.current?.submit('APPROVED'); }}
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
                      onClick={() => { setActionType('submit'); daiTtdhFormRef.current?.submit('SUBMIT'); }}
                      loading={submitting && actionType === 'submit'}
                      style={primaryButtonStyle}
                    >
                      Lưu và gửi phê duyệt
                    </Button>
                  );
                }
                // Thêm mới hoặc Lưu tạm (DRAFT): đủ 3 nút chuẩn Bến cảng / Cầu cảng
                return (
                  <>
                    <Button
                      htmlType="button"
                      onClick={() => { setActionType('draft'); daiTtdhFormRef.current?.submit('DRAFT'); }}
                      loading={submitting && actionType === 'draft'}
                      style={outlineButtonStyle}
                    >
                      Lưu tạm
                    </Button>
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('submit'); daiTtdhFormRef.current?.submit('SUBMIT'); }}
                      loading={submitting && actionType === 'submit'}
                      style={primaryButtonStyle}
                    >
                      Lưu và gửi phê duyệt
                    </Button>
                    <Button
                      htmlType="button"
                      type="primary"
                      onClick={() => { setActionType('approve'); daiTtdhFormRef.current?.submit('APPROVED'); }}
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
            <DaiTtdhForm
              ref={daiTtdhFormRef}
              form={createForm}
              id={editDaiTtdhId}
              onFinish={() => {
                setCreateDrawerVisible(false);
                createForm.resetFields();
                setSortField('updatedAt');
                setSortOrder('descend');
                setPage(1);
                void fetchData(1);
                void fetchCounts(orgUnit);
              }}
              onSubmittingChange={setSubmitting}
            />
          </Form>
        </Drawer>

        {/* ── Detail Drawer ──────────────────────────────────────────── */}
        <Drawer
          {...drawerProps}
          rootClassName="daittdh-drawer-scope"
          className="daittdh-drawer-scope"
          size={1000}
          width="min(1000px, 96vw)"
          title={<span style={drawerTitleStyle}>Chi tiết đài TTDH{detailRecord ? ` - ${detailRecord.daiTtdhName}` : ''}</span>}
          open={detailDrawerVisible}
          onClose={closeDetailDrawer}
          extra={<Button type="text" onClick={closeDetailDrawer} style={drawerCloseBtnStyle}>✕</Button>}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          footer={null}
        >
          {detailRecord && (
            <DaiTtdhDetailContent
              selectedRecord={detailRecord}
              orgMap={orgMap}
              organizations={organizations}
              symbolMap={symbolMap}
              symbolImageMap={symbolImageMap}
              userMap={userMap}
              detailFiles={detailFiles}
              approvalStyleMap={APPROVAL_STYLE_MAP}
              operationalStyleMap={OPERATIONAL_STYLE_MAP}
              operationPlanList={(detailRecord as any)?.operationPlanList}
              maintenancePlanList={(detailRecord as any)?.maintenancePlanList}
              incidentList={(detailRecord as any)?.incidentList}
            />
          )}
        </Drawer>

        {/* ── Delete Confirmation Modal (DeleteConfirmModal chuẩn) ── */}
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
          itemType="đài TTDH"
          itemName={deletingRecord?.daiTtdhName}
          itemCode={deletingRecord?.daiTtdhCode}
        />

        {/* ── Reject Modal (chuẩn PierListPage) ───────────────────── */}
        <Modal
          styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
          title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
          open={rejectModalOpen}
          onCancel={() => {
            setRejectModalOpen(false);
            setRejectingRecord(null);
            setRejectReason('');
            setRejectError('');
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectingRecord(null);
                setRejectReason('');
                setRejectError('');
              }}
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
            <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>
              Vui lòng nhập lý do từ chối cho đài TTDH:
            </p>
            {rejectingRecord && (
              <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}>
                <strong style={{ color: textPrimary }}>{rejectingRecord.daiTtdhCode} — {rejectingRecord.daiTtdhName}</strong>
              </p>
            )}
            <Input.TextArea
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setRejectError('');
              }}
              rows={3}
              maxLength={500}
              showCount
              style={{ borderRadius: 8, fontSize: fontSizeMd, borderColor: rejectError ? statusCritical : undefined }}
            />
            {rejectError ? (
              <div style={{ marginTop: 4 }}>
                <span style={{ color: statusCritical, fontSize: fontSizeMd }}>{rejectError}</span>
              </div>
            ) : null}
          </div>
        </Modal>

        {/* ── Submit Modal (chuẩn PierListPage) ───────────────────── */}
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
              Xác nhận gửi phê duyệt đài TTDH <strong>{submittingRecord?.daiTtdhName}</strong>?
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

        {/* ── History Drawer (timeline theo chuẩn quản lý Cảng biển) ── */}
        <AppDrawer
          width="min(880px, 96vw)"
          rootClassName="daittdh-drawer-scope"
          className="daittdh-drawer-scope"
          mask
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space size={spaceSm} style={{ alignItems: 'center' }}>
                <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
                <span style={drawerTitleStyle}>
                  Lịch sử thay đổi — {historyTarget?.daiTtdhName || historyTarget?.daiTtdhCode || ''}
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
                  onClick={() => { /* Real-time client filter */ }}
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
              renderDaiTtdhHistoryTimeline(filteredHistory)
            )}
          </div>
        </AppDrawer>
      </div>
    </ThemeTokenProvider>
  );
}
