import React, { useState, useMemo, useEffect } from 'react';
import { Input, DatePicker, Button, Typography, Space, Skeleton } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  FileOutlined,
  UserOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { AppDrawer } from './AppDrawer';
import dayjs from 'dayjs';
import { symbolService, type SymbolOption } from '../../services/symbolService';
import { getProvinceNameById } from '../../types/common';
import { colors, getRangePickerProps } from '../../themetokenchk';
import {
  actionPrimary,
  statusOperational,
  statusAttention,
  statusCritical,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  radiusSm,
  radiusPill,
  spaceXs,
  spaceSm,
  spaceMd,
  spaceLg,
  spaceXl,
  fontSizeSm,
  fontSizeMd,
  fontSizeLg,
  fontWeightMedium,
  fontWeightBold,
  inputStyle,
  primaryButtonStyle,
  statusBadgeStyle,
  getConditionStatusColor,
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
} from '../../themetokenchk';
import {
  deduplicateAttachmentHistoryChanges,
  isAttachmentField,
  parseAttachmentValues,
  normalizeAttachmentName,
} from '../../utils/historyAttachmentDedup';

export interface HistoryChangeItem {
  field: string;
  oldValue?: any;
  newValue?: any;
}

export interface CommonHistoryEntry {
  id?: string;
  action?: string;
  changedBy?: string;
  changedByName?: string;
  actor?: string;
  changedAt?: string;
  createdAt?: string;
  timestamp?: string;
  orgUnitName?: string;
  unitName?: string;
  note?: string;
  description?: string;
  changes?: HistoryChangeItem[];
  [key: string]: any;
}

export interface CommonHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  entityName?: string;
  /** Fallback tương thích ngược khi truyền entityTitle */
  entityTitle?: string;
  records: CommonHistoryEntry[];
  loading?: boolean;
  fieldLabelMap?: Record<string, string>;
  formatValue?: (fieldName: string, value: any) => string;
  width?: string | number;
  size?: 'default' | 'large' | '50%' | string;
  variant?: 'default' | 'berth';
  /**
   * Bật chế độ lọc ở server. Khi bật, drawer KHÔNG tự lọc `records` theo từ khóa
   * và khoảng ngày nữa mà báo điều kiện ra ngoài qua `onFilterChange` — bắt buộc
   * nếu màn có phân trang, vì lọc phía client chỉ soi được phần đã tải.
   */
  serverFiltered?: boolean;
  onFilterChange?: (filters: { keyword: string; fromDate: string; toDate: string }) => void;
  /** Gọi khi người dùng cuộn tới đáy để tải thêm một trang nhật ký. */
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

const DEFAULT_ACTION_MAP: Record<string, { label: string; color: string; bg: string }> = {
  CREATE: { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}15` },
  CREATED: { label: 'Tạo mới', color: statusOperational, bg: `${statusOperational}15` },
  ADD: { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}15` },
  INSERT: { label: 'Thêm mới', color: statusOperational, bg: `${statusOperational}15` },

  UPDATE: { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` },
  UPDATED: { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` },
  EDIT: { label: 'Chỉnh sửa', color: actionPrimary, bg: `${actionPrimary}15` },
  DRAFT_SAVED: { label: 'Lưu tạm', color: '#64748b', bg: '#64748b15' },
  STATUS_CHANGED: { label: 'Đổi trạng thái', color: '#8b5cf6', bg: '#8b5cf615' },
  EXPIRED: { label: 'Hết hiệu lực', color: '#ef4444', bg: '#ef444415' },

  DELETE: { label: 'Xóa', color: '#64748b', bg: '#64748b15' },
  DELETED: { label: 'Xóa', color: '#64748b', bg: '#64748b15' },
  SOFT_DELETE: { label: 'Xóa mềm', color: '#64748b', bg: '#64748b15' },

  ATTACH_FILE: { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  UPLOAD_ATTACHMENT: { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  ATTACHMENT_UPLOADED: { label: 'Tải lên tệp', color: '#0284c7', bg: '#0284c715' },
  REMOVE_FILE: { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },
  DELETE_ATTACHMENT: { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },
  ATTACHMENT_DELETED: { label: 'Xóa tệp', color: '#ea580c', bg: '#ea580c15' },

  APPROVE: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  APPROVED: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  APPROVE_L1: { label: 'Phê duyệt C1', color: statusAttention, bg: `${statusAttention}15` },
  APPROVE_L2: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  APPROVED_LEVEL1: { label: 'Phê duyệt C1', color: '#0284C7', bg: '#0284C715' },
  APPROVED_LEVEL2: { label: 'Phê duyệt C2', color: statusOperational, bg: `${statusOperational}15` },
  SUBMIT: { label: 'Gửi duyệt', color: '#EDA100', bg: '#EDA10015' },
  SUBMITTED: { label: 'Gửi duyệt', color: '#EDA100', bg: '#EDA10015' },
  PROPOSED: { label: 'Gửi duyệt', color: '#EDA100', bg: '#EDA10015' },
  UNDER_REVIEW: { label: 'Phê duyệt C1', color: '#0284C7', bg: '#0284C715' },

  REJECT: { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}15` },
  REJECTED: { label: 'Từ chối', color: statusCritical, bg: `${statusCritical}15` },
  REJECTED_LEVEL1: { label: 'Từ chối C1', color: statusCritical, bg: `${statusCritical}15` },
  REJECTED_LEVEL2: { label: 'Từ chối C2', color: statusCritical, bg: `${statusCritical}15` },

  INVALIDATE: { label: 'Vô hiệu hóa', color: '#7c3aed', bg: '#7c3aed15' },
  LOCK: { label: 'Khóa tài khoản', color: '#d97706', bg: '#d9770615' },
  UNLOCK: { label: 'Mở khóa', color: statusOperational, bg: `${statusOperational}15` },
  EXTEND: { label: 'Gia hạn', color: '#2563eb', bg: '#2563eb15' },
};

const DEFAULT_FIELD_MAP: Record<string, string> = {
  documentName: 'Tên văn bản',
  documentNumber: 'Số hiệu văn bản',
  documentType: 'Loại văn bản',
  issuingAuthority: 'Cơ quan ban hành',
  signer: 'Người ký',
  issueDate: 'Ngày ban hành',
  effectiveDate: 'Ngày có hiệu lực',
  expirationDate: 'Ngày hết hiệu lực',
  applicationArea: 'Phạm vi áp dụng',
  validityStatus: 'Trạng thái hiệu lực',
  description: 'Mô tả',
  code: 'Mã',
  name: 'Tên',
  systemName: 'Tên hệ thống',
  location: 'Vị trí',
  conditionStatus: 'Tình trạng',
  operationalStatus: 'Trạng thái hoạt động',
  approvalStatus: 'Trạng thái phê duyệt',
  province: 'Địa điểm (Tỉnh/TP)',
  provinceId: 'Địa điểm (Tỉnh/TP)',
  provinceName: 'Địa điểm (Tỉnh/TP)',
  operatingOrgId: 'Đơn vị khai thác',
  operatingOrgName: 'Đơn vị khai thác',
  operatingUnitId: 'Đơn vị khai thác',
  operatingUnitName: 'Đơn vị khai thác',
  portId: 'Thuộc cảng biển',
  portName: 'Thuộc cảng biển',
  vtsSystemId: 'Thuộc hệ thống VTS',
  vtsSystemName: 'Thuộc hệ thống VTS',
  vtsOperationCenterId: 'Thuộc TTDH VTS',
  vtsOperationCenterName: 'Thuộc TTDH VTS',
  radarStationId: 'Thuộc Trạm Radar',
  radarStationName: 'Thuộc Trạm Radar',
  coverage: 'Phạm vi phủ sóng',
  detailedLocation: 'Địa điểm chi tiết',
  locationDetail: 'Địa điểm chi tiết',
  unitOfMeasure: 'Đơn vị tính',
  quantity: 'Số lượng',
  commissioningYear: 'Năm đưa vào sử dụng',
  specifications: 'Thông số kỹ thuật',
  manufacturer: 'Hãng sản xuất',
  maintenanceInfo: 'Thông tin bảo trì',
  note: 'Ghi chú',
  notes: 'Ghi chú',
  orgUnitId: 'Đơn vị quản lý',
  orgUnitName: 'Tên đơn vị quản lý',
  facilityName: 'Tên cơ sở',
  stationName: 'Tên trạm',
  channelCode: 'Mã luồng',
  channelName: 'Tên luồng',
  pierName: 'Tên cầu cảng',
  berthName: 'Tên bến cảng',
  dryPortName: 'Tên cảng cạn',
  beaconName: 'Tên báo hiệu',
  beaconCode: 'Mã báo hiệu',
  attachments: 'Tài liệu đính kèm',
  attachmentList: 'Tài liệu đính kèm',
  'Tài liệu đính kèm': 'Tài liệu đính kèm',
  zones: 'Vùng VTS',
  zoneList: 'Vùng VTS',
  'Vùng VTS': 'Vùng VTS',
  fileName: 'Tên tệp tin',
  fileSize: 'Kích thước tệp',
  coordinates: 'Tọa độ GIS',
  geometryType: 'Loại đối tượng GIS',
  objectType: 'Loại đối tượng GIS',
  symbol: 'Biểu tượng',
  symbolId: 'Biểu tượng',
  mapSymbolId: 'Biểu tượng',
  mapIcon: 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
};

function formatCoordPointDms(xStr: string, yStr?: string): string {
  const x = Number(xStr);
  const y = yStr !== undefined && yStr !== '' ? Number(yStr) : NaN;

  const toDmsString = (val: number, isLat: boolean) => {
    if (isNaN(val)) return '';
    const abs = Math.abs(val);
    const d = Math.floor(abs);
    const minFloat = (abs - d) * 60;
    const m = Math.floor(minFloat);
    const s = Math.round((minFloat - m) * 60 * 10) / 10;
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    return `${d}° ${m}' ${s.toFixed(1)}" ${dir}`;
  };

  if (!isNaN(x) && !isNaN(y)) {
    let lat = y;
    let lng = x;
    if (x < 35 && y > 50) {
      lat = x;
      lng = y;
    }
    const latDms = toDmsString(lat, true);
    const lngDms = toDmsString(lng, false);
    return `${latDms}, ${lngDms}`;
  }

  if (!isNaN(x)) {
    const isLat = x <= 35 && x >= -35;
    return toDmsString(x, isLat);
  }

  return xStr;
}

function parseCoordinatesPoints(raw: string | null): { typeName?: string; points: Array<{ x: string; y: string; index: number }> } | null {
  if (!raw || raw === '—' || raw === 'Chưa có' || raw === '(null)' || raw === '(trống)') return null;
  const str = raw.trim();

  if (/^(Đường|Vùng|Điểm)\s+bản\s+đồ\s*\(\d+\s+điểm/i.test(str)) {
    return { typeName: str, points: [] };
  }

  let typeName = '';
  let inner = str;

  if (/^POINT\s*\(/i.test(str)) {
    typeName = 'Điểm';
    inner = str.replace(/^POINT\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^LINESTRING\s*\(/i.test(str)) {
    typeName = 'Đường';
    inner = str.replace(/^LINESTRING\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^LINE\s*\(/i.test(str)) {
    typeName = 'Đường';
    inner = str.replace(/^LINE\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (/^POLYGON\s*\(\(/i.test(str)) {
    typeName = 'Vùng';
    inner = str.replace(/^POLYGON\s*\(\(/i, '').replace(/\)\)\s*$/, '');
  } else if (/^MULTIPOINT\s*\(/i.test(str)) {
    typeName = 'Tập hợp điểm';
    inner = str.replace(/^MULTIPOINT\s*\(/i, '').replace(/\)\s*$/, '');
  } else if (str.startsWith('(') && str.endsWith(')')) {
    inner = str.slice(1, -1);
  }

  const pointStrings = inner.split(',').map((s) => s.trim()).filter(Boolean);
  if (pointStrings.length === 0) return null;

  const points = pointStrings.map((ps, idx) => {
    const clean = ps.replace(/[()]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return { x: parts[0], y: parts[1], index: idx + 1 };
    }
    return { x: clean, y: '', index: idx + 1 };
  });

  return { typeName, points };
}

function renderCoordinatesDisplay(val: string | null) {
  if (!val || val === '—' || val === 'Chưa có' || val === '(null)' || val === '(trống)') {
    return val === 'Chưa có' ? <span style={{ color: textTertiary }}>Chưa có</span> : null;
  }
  const parsed = parseCoordinatesPoints(val);
  if (!parsed || parsed.points.length === 0) {
    return <span style={{ color: textPrimary }}>{parsed?.typeName || val}</span>;
  }
  const { typeName, points } = parsed;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spaceXs, width: '100%' }}>
      {typeName && (
        <span style={{ fontSize: fontSizeSm, fontWeight: fontWeightBold, color: actionPrimary }}>
          {typeName} ({points.length} điểm)
        </span>
      )}
      {points.map((pt) => (
        <div key={pt.index} style={{ fontSize: fontSizeSm, color: textPrimary, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {points.length > 1 && <span style={{ color: textSecondary, marginRight: spaceXs }}>#{pt.index}:</span>}
          <span>{formatCoordPointDms(pt.x, pt.y)}</span>
        </div>
      ))}
    </div>
  );
}

export function renderCommonHistoryValueTag(field: string, val: string, isOld: boolean = false) {
  if (!val || val === '—' || val === '-') {
    return '';
  }
  const normKey = field.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  const normVal = val.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

  // 1. Tình trạng hoạt động (ConditionStatus)
  if (normKey === 'conditionstatus' || normKey === 'tinh trang' || normKey.includes('tinh trang')) {
    const color = getConditionStatusColor(val);
    if (color && color !== textSecondary) {
      return (
        <span style={statusBadgeStyle(color)}>
          {val}
        </span>
      );
    }
  }

  // 2. Trạng thái phê duyệt (ApprovalStatus) & Trạng thái chung
  if (normKey.includes('trang thai') || normKey.includes('status') || normKey.includes('hieu luc')) {
    // Các giá trị PHỦ ĐỊNH phải xét TRƯỚC: "dừng hoạt động" cũng chứa "hoạt động"
    if (normVal.includes('dung hoat dong') || normVal.includes('ngung hoat dong')
        || normVal.includes('tam dung') || normVal.includes('khong hoat dong')
        || normVal === 'stopped' || normVal === 'not_operational') {
      return (
        <span style={statusBadgeStyle(statusCritical)}>
          {val}
        </span>
      );
    }
    if (normVal.includes('bao tri') || normVal.includes('bao duong') || normVal.includes('sua chua') || normVal.includes('maintenance')) {
      return (
        <span style={statusBadgeStyle(statusAttention)}>
          {val}
        </span>
      );
    }
    if (normVal.includes('xay dung') || normVal.includes('construction') || normVal.includes('under_construction')) {
      return (
        <span style={statusBadgeStyle(actionPrimary)}>
          {val}
        </span>
      );
    }
    if (normVal.includes('da phe duyet') || normVal.includes('con hieu luc') || normVal.includes('hoat dong') || normVal.includes('active') || normVal.includes('approved') || normVal.includes('valid')) {
      return (
        <span style={statusBadgeStyle(statusOperational)}>
          {val}
        </span>
      );
    }
    if (normVal.includes('tu choi') || normVal.includes('het hieu luc') || normVal.includes('hong') || normVal.includes('inactive') || normVal.includes('rejected') || normVal.includes('expired')) {
      return (
        <span style={statusBadgeStyle(statusCritical)}>
          {val}
        </span>
      );
    }
    if (normVal.includes('dang xem xet') || normVal.includes('chua co hieu luc') || normVal.includes('review') || normVal.includes('under_review') || normVal.includes('da phe duyet cap 1') || normVal.includes('cap 1') || normVal.includes('approved_level1')) {
      return (
        <span style={statusBadgeStyle(actionPrimary)}>
          {val}
        </span>
      );
    }
    if (normVal.includes('cho phe duyet') || normVal.includes('can bao duong') || normVal.includes('pending') || normVal.includes('draft') || normVal.includes('warning') || normVal.includes('proposed') || normVal.includes('cho')) {
      return (
        <span style={statusBadgeStyle(statusAttention)}>
          {val}
        </span>
      );
    }
  }

  return (
    <span
      title={typeof val === 'string' ? val : undefined}
      style={{
        color: isOld ? textSecondary : textPrimary,
        fontWeight: isOld ? 400 : fontWeightMedium,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        whiteSpace: 'normal',
        lineHeight: 1.5,
      }}
    >
      {val}
    </span>
  );
}

const drawerTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeLg,
};

export function isZoneField(f: string): boolean {
  const norm = (f || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  return norm.includes('vung vts') || norm.includes('zone');
}

function stripPrefixByField(val: string, fName: string): string {
  if (!val) return val;
  let res = val.trim();
  const escaped = fName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escaped}\\s*[:=]\\s*`, 'i');
  if (pattern.test(res)) {
    res = res.replace(pattern, '').trim();
  }
  const norm = res.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  if (norm.startsWith('vung vts=') || norm.startsWith('vung vts:') || norm.startsWith('vung vts =') || norm.startsWith('vung vts :')) {
    const idx = res.search(/[:=]/);
    if (idx >= 0) res = res.substring(idx + 1).trim();
  } else if (norm.startsWith('tai lieu dinh kem=') || norm.startsWith('tai lieu dinh kem:') || norm.startsWith('tai lieu dinh kem =') || norm.startsWith('tai lieu dinh kem :')) {
    const idx = res.search(/[:=]/);
    if (idx >= 0) res = res.substring(idx + 1).trim();
  } else if (norm.startsWith('zones=') || norm.startsWith('zone=') || norm.startsWith('attachments=') || norm.startsWith('attachment=')) {
    const idx = res.search(/[:=]/);
    if (idx >= 0) res = res.substring(idx + 1).trim();
  }
  return res;
}

function parseZoneChanges(field: string, prevRaw: string, newRaw: string): HistoryChangeItem[] {
  const cleanPrev = stripPrefixByField(prevRaw, field);
  const cleanNew = stripPrefixByField(newRaw, field);

  const splitItems = (str: string) => {
    if (!str || str === '—' || str === '-' || str === '(null)' || str === 'null' || str === '(trống)' || str === 'undefined') return [];
    return str.split(/[,\n]/).map((s) => stripPrefixByField(s.trim(), field)).filter(Boolean);
  };

  const prevItems = splitItems(cleanPrev);
  const newItems = splitItems(cleanNew);

  const hasKeywords = /(xóa|thêm|cũ:|mới:)/i.test(cleanPrev) || /(xóa|thêm|cũ:|mới:)/i.test(cleanNew);
  if (!hasKeywords) {
    if (prevItems.length > 0 && newItems.length === 0) {
      return prevItems.map((item) => ({ field, oldValue: item, newValue: '' }));
    }
    if (prevItems.length === 0 && newItems.length > 0) {
      return newItems.map((item) => ({ field, oldValue: '', newValue: item }));
    }
    const maxLen = Math.max(prevItems.length, newItems.length);
    if (maxLen > 0) {
      const res: HistoryChangeItem[] = [];
      for (let i = 0; i < maxLen; i++) {
        res.push({
          field,
          oldValue: prevItems[i] || '',
          newValue: newItems[i] || '',
        });
      }
      return res;
    }
    return [{ field, oldValue: cleanPrev !== '' ? cleanPrev : '', newValue: cleanNew !== '' ? cleanNew : '' }];
  }

  const removed: string[] = [];
  const modifiedOld: string[] = [];
  prevItems.forEach((item) => {
    const cItem = stripPrefixByField(item, field);
    if (/^xóa\s+/i.test(cItem)) {
      removed.push(cItem.replace(/^xóa\s+/i, '').trim());
    } else if (/^cũ:\s*/i.test(cItem)) {
      modifiedOld.push(cItem.replace(/^cũ:\s*/i, '').trim());
    } else if (cItem && cItem !== '—' && cItem !== '-') {
      removed.push(cItem);
    }
  });

  const added: string[] = [];
  const modifiedNew: string[] = [];
  newItems.forEach((item) => {
    const cItem = stripPrefixByField(item, field);
    if (/^thêm\s+/i.test(cItem)) {
      added.push(cItem.replace(/^thêm\s+/i, '').trim());
    } else if (/^mới:\s*/i.test(cItem)) {
      modifiedNew.push(cItem.replace(/^mới:\s*/i, '').trim());
    } else if (cItem && cItem !== '—' && cItem !== '-') {
      added.push(cItem);
    }
  });

  const results: HistoryChangeItem[] = [];

  // 1. Xóa vùng: giá trị cũ là tên vùng, giá trị mới là '' (như tài liệu đính kèm)
  removed.forEach((name) => {
    results.push({ field, oldValue: name, newValue: '' });
  });

  // 2. Chỉnh sửa vùng: giá trị cũ là tên cũ, giá trị mới là tên mới
  const modCount = Math.max(modifiedOld.length, modifiedNew.length);
  for (let i = 0; i < modCount; i++) {
    results.push({
      field,
      oldValue: modifiedOld[i] || '',
      newValue: modifiedNew[i] || '',
    });
  }

  // 3. Thêm mới vùng: giá trị cũ là '', giá trị mới là tên vùng
  added.forEach((name) => {
    results.push({ field, oldValue: '', newValue: name });
  });

  return results.length > 0 ? results : [{ field, oldValue: cleanPrev || '', newValue: cleanNew || '' }];
}

function parseAttachmentChanges(field: string, prevRaw: string, newRaw: string): HistoryChangeItem[] {
  const cleanPrev = stripPrefixByField(prevRaw, field);
  const cleanNew = stripPrefixByField(newRaw, field);

  const splitItems = (str: string) => {
    if (!str || str === '—' || str === '-' || str === '(null)' || str === 'null' || str === '(trống)' || str === 'undefined') return [];
    return str.split(/[,\n]/).map((s) => stripPrefixByField(s.trim(), field)).filter(Boolean);
  };

  const prevItems = splitItems(cleanPrev);
  const newItems = splitItems(cleanNew);

  const hasKeywords = /(xóa|thêm)/i.test(cleanPrev) || /(xóa|thêm)/i.test(cleanNew);
  if (!hasKeywords) {
    const prevFiles = parseAttachmentValues(cleanPrev).map(normalizeAttachmentName).filter(Boolean);
    const newFiles = parseAttachmentValues(cleanNew).map(normalizeAttachmentName).filter(Boolean);
    if (prevFiles.length > 0 && newFiles.length === 0) {
      return prevFiles.map((f) => ({ field, oldValue: f, newValue: '' }));
    }
    if (prevFiles.length === 0 && newFiles.length > 0) {
      return newFiles.map((f) => ({ field, oldValue: '', newValue: f }));
    }
    return [{
      field,
      oldValue: cleanPrev !== '' ? cleanPrev : '',
      newValue: cleanNew !== '' ? cleanNew : '',
    }];
  }

  const removed: string[] = [];
  prevItems.forEach((item) => {
    const c = stripPrefixByField(item, field);
    const cleaned = c.replace(/^xóa\s+/i, '').trim();
    if (cleaned && cleaned !== '—' && cleaned !== '-') removed.push(cleaned);
  });

  const added: string[] = [];
  newItems.forEach((item) => {
    const c = stripPrefixByField(item, field);
    const cleaned = c.replace(/^thêm\s+/i, '').trim();
    if (cleaned && cleaned !== '—' && cleaned !== '-') added.push(cleaned);
  });

  const results: HistoryChangeItem[] = [];
  removed.forEach((name) => {
    results.push({ field, oldValue: name, newValue: '' });
  });
  added.forEach((name) => {
    results.push({ field, oldValue: '', newValue: name });
  });

  return results.length > 0 ? results : [{ field, oldValue: cleanPrev || '', newValue: cleanNew || '' }];
}

export function parseHistoryEntryChanges(item: CommonHistoryEntry): HistoryChangeItem[] {
  if (item.changes && Array.isArray(item.changes) && item.changes.length > 0) {
    return item.changes;
  }
  if (!item.changedField) return [];

  const prevRaw = item.previousValue !== null && item.previousValue !== undefined ? String(item.previousValue).trim() : '';
  const newRaw = item.newValue !== null && item.newValue !== undefined ? String(item.newValue).trim() : '';

  // Phân rã chuỗi nhiều trường ngăn cách bằng chấm phẩy (VD: "Tên hệ thống=A; Vùng VTS=B")
  if (prevRaw.includes(';') || newRaw.includes(';')) {
    const parsePairs = (str: string) => {
      const map: Record<string, string> = {};
      let currentKey = '';
      str.split(';').forEach((part) => {
        const eqIdx = part.indexOf('=');
        if (eqIdx > 0) {
          currentKey = part.substring(0, eqIdx).trim();
          const v = part.substring(eqIdx + 1).trim();
          if (currentKey) map[currentKey] = v;
        } else if (currentKey && part.trim()) {
          map[currentKey] = map[currentKey] ? `${map[currentKey]}, ${part.trim()}` : part.trim();
        }
      });
      return map;
    };
    const prevMap = parsePairs(prevRaw);
    const newMap = parsePairs(newRaw);
    const allKeys = Array.from(new Set([...Object.keys(prevMap), ...Object.keys(newMap)]));
    if (allKeys.length > 0) {
      return allKeys.flatMap((k) => {
        const ov = prevMap[k] !== undefined ? prevMap[k] : '';
        const nv = newMap[k] !== undefined ? newMap[k] : '';
        if (isZoneField(k)) {
          return parseZoneChanges(k, ov, nv);
        }
        if (isAttachmentField(k)) {
          return parseAttachmentChanges(k, ov, nv);
        }
        return [{
          field: k,
          oldValue: ov,
          newValue: nv,
        }];
      });
    }
  }

  const fieldName = item.changedField.trim();
  if (isZoneField(fieldName)) {
    return parseZoneChanges(fieldName, prevRaw, newRaw);
  }
  if (isAttachmentField(fieldName)) {
    return parseAttachmentChanges(fieldName, prevRaw, newRaw);
  }

  const cleanOld = stripPrefixByField(prevRaw, fieldName);
  const cleanNew = stripPrefixByField(newRaw, fieldName);

  return [{
    field: fieldName,
    oldValue: cleanOld !== '' ? cleanOld : item.previousValue,
    newValue: cleanNew !== '' ? cleanNew : item.newValue,
  }];
}

export function mergeChangesByField(
  changes: HistoryChangeItem[],
  fieldLabelMap: Record<string, string> = {}
): HistoryChangeItem[] {
  if (changes.length <= 1) return changes;

  const groups = new Map<string, { field: string; items: HistoryChangeItem[] }>();

  changes.forEach((c) => {
    const rawField = c.field || '';
    const label = fieldLabelMap[rawField] || rawField;
    const norm = label.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
    let key = norm;
    if (isAttachmentField(rawField) || norm.includes('dinh kem') || norm.includes('attachment')) {
      key = '__attachments__';
    } else if (isZoneField(rawField) || norm.includes('vung vts') || norm.includes('zone')) {
      key = '__zones__';
    }
    if (!groups.has(key)) {
      groups.set(key, { field: rawField, items: [] });
    }
    groups.get(key)!.items.push(c);
  });

  const result: HistoryChangeItem[] = [];
  groups.forEach(({ field, items }, key) => {
    if (key === '__attachments__') {
      const oldValList: string[] = [];
      const newValList: string[] = [];
      items.forEach((item) => {
        parseAttachmentValues(item.oldValue).forEach((f) => {
          const trimmed = f.trim();
          if (trimmed && trimmed !== '—' && !oldValList.includes(trimmed)) oldValList.push(trimmed);
        });
        parseAttachmentValues(item.newValue).forEach((f) => {
          const trimmed = f.trim();
          if (trimmed && trimmed !== '—' && !newValList.includes(trimmed)) newValList.push(trimmed);
        });
      });
      const mergedOld = oldValList.length > 0 ? oldValList.join(', ') : '';
      const mergedNew = newValList.length > 0 ? newValList.join(', ') : '';
      if (mergedOld !== '' && mergedNew !== '' && mergedOld === mergedNew) {
        return;
      }
      result.push({
        field,
        oldValue: mergedOld,
        newValue: mergedNew,
      });
    } else if (key === '__zones__') {
      const oldValList: string[] = [];
      const newValList: string[] = [];
      items.forEach((item) => {
        const ov = String(item.oldValue ?? '').trim();
        if (ov && ov !== '—' && ov !== '-' && ov !== '(null)' && ov !== 'null' && !oldValList.includes(ov)) {
          oldValList.push(ov);
        }
        const nv = String(item.newValue ?? '').trim();
        if (nv && nv !== '—' && nv !== '-' && nv !== '(null)' && nv !== 'null' && !newValList.includes(nv)) {
          newValList.push(nv);
        }
      });
      const mergedOld = oldValList.length > 0 ? oldValList.join(', ') : '';
      const mergedNew = newValList.length > 0 ? newValList.join(', ') : '';
      if (mergedOld !== '' && mergedNew !== '' && mergedOld === mergedNew) {
        return;
      }
      result.push({
        field,
        oldValue: mergedOld,
        newValue: mergedNew,
      });
    } else {
      // Trường thông thường: Tuyệt đối không nối chuỗi các giá trị khác nhau
      result.push(items[0]);
    }
  });

  return result;
}

export const CommonHistoryDrawer: React.FC<CommonHistoryDrawerProps> = ({
  open,
  onClose,
  title = 'Lịch sử thay đổi',
  entityName,
  entityTitle,
  records,
  loading = false,
  fieldLabelMap = {},
  formatValue,
  width,
  variant = 'default',
  serverFiltered = false,
  onFilterChange,
  onLoadMore,
  loadingMore = false,
}) => {
  const effectiveEntityName = entityName || entityTitle;
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Ở chế độ lọc phía server, mỗi lần điều kiện đổi thì đẩy ra ngoài để màn cha
  // nạp lại từ trang đầu.
  useEffect(() => {
    if (!serverFiltered || !onFilterChange) return;
    onFilterChange({ keyword, fromDate: dateFrom, toDate: dateTo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverFiltered, keyword, dateFrom, dateTo]);

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 30) {
      onLoadMore();
    }
  };
  const [symbols, setSymbols] = useState<SymbolOption[]>([]);

  useEffect(() => {
    symbolService.getOptions().then((opts) => {
      setSymbols(opts || []);
    }).catch(() => setSymbols([]));
  }, []);

  const { symbolByCode, symbolById, symbolByName } = useMemo(() => {
    const byCode = new Map<string, SymbolOption>();
    const byId = new Map<string, SymbolOption>();
    const byName = new Map<string, SymbolOption>();

    (symbols || []).forEach((sym) => {
      if (sym.code) {
        byCode.set(sym.code.trim().toUpperCase(), sym);
        byCode.set(sym.code.trim().toLowerCase(), sym);
      }
      if (sym.id) {
        byId.set(String(sym.id).trim().toLowerCase(), sym);
      }
      if (sym.name) {
        byName.set(sym.name.trim().toLowerCase(), sym);
        const norm = sym.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
        byName.set(norm, sym);
      }
    });

    return { symbolByCode: byCode, symbolById: byId, symbolByName: byName };
  }, [symbols]);

  const renderSymbolValue = (val: string) => {
    if (!val || val === '—' || val === '-' || val === 'null' || val === '(null)' || val === '(trống)' || val === '— (Trống)' || val === 'Chưa có') {
      return '';
    }
    const trimmed = String(val).trim();
    const upper = trimmed.toUpperCase();
    const lower = trimmed.toLowerCase();
    const norm = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

    const sym = symbolByCode.get(upper) || symbolByCode.get(lower) || symbolById.get(lower) || symbolByName.get(lower) || symbolByName.get(norm);

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: textPrimary,
          fontWeight: fontWeightMedium,
          fontSize: fontSizeMd,
          lineHeight: 1.5,
        }}
      >
        {sym?.image && (
          <img
            src={sym.image.startsWith('data:') ? sym.image : `data:image/png;base64,${sym.image}`}
            alt=""
            style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
          />
        )}
        <span>{sym?.name || trimmed}</span>
      </span>
    );
  };

  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setKeyword('');
      setDateFrom('');
      setDateTo('');
    }
  }, [open]);

  const combinedFieldMap = useMemo(() => ({
    ...DEFAULT_FIELD_MAP,
    ...fieldLabelMap,
  }), [fieldLabelMap]);

  const resolveAction = (act?: string) => {
    if (!act) return { label: 'Cập nhật', color: actionPrimary, bg: `${actionPrimary}15` };
    const upper = act.toUpperCase();
    if (DEFAULT_ACTION_MAP[upper]) return DEFAULT_ACTION_MAP[upper];
    return { label: act, color: actionPrimary, bg: `${actionPrimary}15` };
  };

  const getRecordTimestamp = (r: CommonHistoryEntry): string => {
    return r.changedAt || r.createdAt || r.timestamp || r.approvedDate || '';
  };

  const getRecordActor = (r: CommonHistoryEntry): string => {
    return r.changedByName || r.actor || r.approvedByName || r.changedBy || r.approvedBy || '';
  };

  const getRecordAction = (r: CommonHistoryEntry): string => {
    return (r.action || r.status || r.actionType || '').toUpperCase();
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return '';
    const d = dayjs(ts);
    if (!d.isValid()) return ts;
    return `${d.format('HH:mm:ss')} ${d.format('DD/MM/YYYY')}`;
  };

  const resolveFieldValue = (field: string, val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    if (formatValue) {
      const custom = formatValue(field, val);
      if (custom !== undefined) return custom;
    }
    const fLower = (field || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
    if (fLower.includes('tinh') || fLower.includes('province') || fLower.includes('thanh pho') || fLower === 'provinceid') {
      const provName = getProvinceNameById(val);
      if (provName) return provName;
    }
    if (typeof val === 'boolean') return val ? 'Có' : 'Không';
    if (typeof val === 'object') return JSON.stringify(val);
    const s = String(val).trim();
    if (s === '(null)' || s === 'null' || s === '(trống)' || s === '— (Trống)' || s === 'Chưa có' || s === '-') return '';
    return s;
  };

  // Filter and group records
  const { filteredGroups, totalCount } = useMemo(() => {
    // Ở chế độ lọc phía server, từ khóa và khoảng ngày đã được áp ở CSDL — lọc
    // lại tại đây sẽ cắt mất bản ghi của các trang chưa tải về.
    const q = serverFiltered ? '' : keyword.toLowerCase().trim();
    const clientDateFrom = serverFiltered ? '' : dateFrom;
    const clientDateTo = serverFiltered ? '' : dateTo;

    const filtered = (records || []).filter((r) => {
      const act = getRecordAction(r);
      const reason = (r.reason || r.note || r.description || '').toLowerCase();
      // Nghiệp vụ: Lịch sử thay đổi chỉ hiển thị cập nhật trên hồ sơ đã duyệt, không hiển thị log Tạo mới / Lưu tạm
      if (act === 'CREATED' || act === 'CREATE' || act === 'DRAFT' || act === 'PROPOSED' || reason.startsWith('tạo mới')) {
        return false;
      }

      const ts = getRecordTimestamp(r);
      const actor = getRecordActor(r).toLowerCase();
      const note = (r.note || r.reason || r.description || '').toLowerCase();
      const actLabel = resolveAction(act).label.toLowerCase();

      // Keyword search
      if (q) {
        let match = actor.includes(q) || note.includes(q) || act.includes(q) || actLabel.includes(q);
        if (!match && r.changes && Array.isArray(r.changes)) {
          match = r.changes.some((c) => {
            const fName = (combinedFieldMap[c.field] || c.field).toLowerCase();
            const ov = String(c.oldValue || '').toLowerCase();
            const nv = String(c.newValue || '').toLowerCase();
            return fName.includes(q) || ov.includes(q) || nv.includes(q);
          });
        } else if (!match && r.changedField) {
          const fName = (combinedFieldMap[r.changedField] || r.changedField).toLowerCase();
          const ov = String(r.previousValue || '').toLowerCase();
          const nv = String(r.newValue || '').toLowerCase();
          match = fName.includes(q) || ov.includes(q) || nv.includes(q);
        }
        if (!match) return false;
      }

      // Date range filter
      if (clientDateFrom && ts) {
        if (dayjs(ts).isBefore(dayjs(clientDateFrom))) return false;
      }
      if (clientDateTo && ts) {
        if (dayjs(ts).isAfter(dayjs(clientDateTo))) return false;
      }

      return true;
    });

    // Sort newest first
    const sorted = [...filtered].sort((a, b) => {
      const timeA = new Date(getRecordTimestamp(a) || 0).getTime();
      const timeB = new Date(getRecordTimestamp(b) || 0).getTime();
      return timeB - timeA;
    });

    // Trích xuất các trường dữ liệu bị thay đổi trong một bản ghi lịch sử
    const getRecordFields = (entry: CommonHistoryEntry): string[] => {
      if (entry.changes && Array.isArray(entry.changes) && entry.changes.length > 0) {
        return entry.changes.map((c) => c.field).filter(Boolean);
      }
      if (entry.changedField) {
        return [entry.changedField];
      }
      return [];
    };

    const normalizeFieldName = (f: string): string => {
      const mapped = combinedFieldMap[f] || f;
      return mapped.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
    };

    // Group items: Chỉ gom các bản ghi thuộc CÙNG 1 LẦN THAO TÁC (cùng request backend)
    // Điều kiện:
    // 1. Phải cùng người thực hiện
    // 2. Phải cùng loại hành động (không gộp UPDATE với UPLOAD_ATTACHMENT, APPROVE...)
    // 3. Phải có timestamp hợp lệ ở cả 2 bản ghi và chênh lệch thời gian cực ngắn (<= 150ms do cùng 1 transaction lưu nhiều field)
    // 4. Không trùng trường dữ liệu thông thường (ngoại trừ tài liệu đính kèm)
    interface HistoryGroup {
      tsSec: number;
      ts: string;
      actor: string;
      action: string;
      unitName: string;
      items: CommonHistoryEntry[];
      fields: Set<string>;
    }

    const groups: HistoryGroup[] = [];
    for (const r of sorted) {
      const ts = getRecordTimestamp(r);
      const tsMs = ts ? new Date(ts).getTime() : 0;
      const tsSec = Math.floor(tsMs / 1000);
      const actor = getRecordActor(r);
      const action = getRecordAction(r);
      const unitName = r.orgUnitName || r.unitName || '';
      const prev = groups[groups.length - 1];

      const rFields = getRecordFields(r);
      // Kiểm tra xem nhóm trước đã chứa bất kỳ trường nào của bản ghi này chưa (trừ attachment)
      const hasDuplicateField = prev ? rFields.some((f) => {
        const norm = normalizeFieldName(f);
        if (isAttachmentField(f) || norm.includes('dinh kem') || norm.includes('attachment')) return false;
        return prev.fields.has(norm);
      }) : false;

      const prevMs = prev && prev.ts ? new Date(prev.ts).getTime() : 0;
      const timeDiffMs = (prevMs > 0 && tsMs > 0) ? Math.abs(prevMs - tsMs) : Number.MAX_SAFE_INTEGER;

      const isSameGroup = Boolean(
        prev &&
        prev.actor === actor &&
        prev.action === action &&
        prevMs > 0 &&
        tsMs > 0 &&
        timeDiffMs <= 150 &&
        !hasDuplicateField
      );

      if (isSameGroup) {
        prev.items.push(r);
        rFields.forEach((f) => prev.fields.add(normalizeFieldName(f)));
      } else {
        groups.push({
          tsSec,
          ts,
          actor,
          action,
          unitName,
          items: [r],
          fields: new Set(rFields.map(normalizeFieldName)),
        });
      }
    }

    return { filteredGroups: groups, totalCount: filtered.length };
  }, [records, keyword, dateFrom, dateTo, combinedFieldMap, serverFiltered]);

  return (
    <AppDrawer
      rootClassName={variant === 'berth' ? 'berth-drawer-scope' : 'vtssystemchk-theme-scope'}
      className={variant === 'berth' ? 'berth-drawer-scope' : 'vtssystemchk-theme-scope'}
      width={width || (variant === 'berth' ? 'min(880px, 96vw)' : undefined)}
      mask
      open={open}
      onClose={onClose}
      footer={null}
      styles={{
        header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
        body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Space size={spaceSm} style={{ alignItems: 'center' }}>
            <HistoryOutlined style={{ color: colors.sidebarBg, fontSize: fontSizeLg }} />
            <span style={drawerTitleStyle}>
              {effectiveEntityName ? `${title} — ${effectiveEntityName}` : title}
            </span>
            <span
              style={{
                display: 'inline-flex',
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: fontSizeLg - 1,
                fontWeight: fontWeightBold,
                background: `${colors.sidebarBg}15`,
                color: colors.sidebarBg,
                lineHeight: '20px',
              }}
            >
              Tổng cộng {totalCount}
            </span>
          </Space>
        </div>
      }
    >
      <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
      {/* ── Search & Filter Bar ────────────────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
          <Input
            placeholder="Tìm kiếm nội dung thay đổi..."
            allowClear
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              if (!val) setKeyword('');
            }}
            onPressEnter={() => setKeyword(searchInput.trim())}
            style={variant === 'berth' ? { flex: 1, borderRadius: radiusPill, height: 40 } : { ...inputStyle, borderRadius: radiusPill, height: 40, flex: 1 }}
          />
          {variant === 'berth' ? (
            <>
              <DatePicker
                placeholder="Từ ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={dateFrom ? dayjs(dateFrom) : null}
                onChange={(d) => setDateFrom(d ? d.startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '')}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
              <DatePicker
                placeholder="Đến ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={dateTo ? dayjs(dateTo) : null}
                onChange={(d) => setDateTo(d ? d.endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '')}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }}
                format="DD/MM/YYYY"
              />
            </>
          ) : (
            <DatePicker.RangePicker
              {...getRangePickerProps({
                value: (dateFrom && dateTo)
                  ? [dayjs(dateFrom), dayjs(dateTo)]
                  : (dateFrom ? [dayjs(dateFrom), null] : (dateTo ? [null, dayjs(dateTo)] : null)),
                onChange: (dates: any) => {
                  if (!dates || dates.length === 0 || (!dates[0] && !dates[1])) {
                    setDateFrom('');
                    setDateTo('');
                  } else {
                    setDateFrom(dates[0] ? dates[0].startOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                    setDateTo(dates[1] ? dates[1].endOf('day').format('YYYY-MM-DDTHH:mm:ss') : '');
                  }
                },
                style: { ...inputStyle, borderRadius: radiusPill, height: 40, width: 280 },
              })}
            />
          )}
          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={() => setKeyword(searchInput.trim())}
            style={variant === 'berth' ? { borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary } : { ...primaryButtonStyle, borderRadius: radiusPill, height: 40, background: actionPrimary, borderColor: actionPrimary }}
          >
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* ── Timeline Body ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: variant === 'berth' ? 0 : 4 }} onScroll={handleBodyScroll}>
        {loading ? (
          <div style={{ padding: spaceMd }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${spaceXl * 2}px 0` }}>
            <HistoryOutlined style={{ fontSize: 48, color: textTertiary, marginBottom: spaceMd }} />
            <div style={{ color: textTertiary, fontSize: fontSizeMd }}>
              {keyword || dateFrom || dateTo
                ? 'Không tìm thấy kết quả phù hợp'
                : 'Chưa có thay đổi nào được ghi nhận'}
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: variant === 'berth' ? 0 : 8 }}>
            {/* Trục Timeline dọc kết nối các mốc */}
            {variant !== 'berth' && filteredGroups.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: 13,
                  top: 20,
                  bottom: 24,
                  width: 2,
                  background: '#E2E8F0',
                  zIndex: 0,
                }}
              />
            )}
            {filteredGroups.map((group, gIdx) => {
              // Extract all changes from items in the group
              const groupChanges: HistoryChangeItem[] = [];
              const groupNotes: string[] = [];
              let primaryAction = group.items[0]?.action || group.items[0]?.status || 'UPDATE';

              group.items.forEach((item) => {
                if (item.action) primaryAction = item.action;
                else if (item.status) primaryAction = item.status;
                if (item.note) groupNotes.push(item.note);
                if (item.reason && !groupNotes.includes(item.reason)) groupNotes.push(item.reason);
                if (item.description && !groupNotes.includes(item.description)) groupNotes.push(item.description);
                if (item.changes && Array.isArray(item.changes) && item.changes.length > 0) {
                  groupChanges.push(...item.changes);
                } else if (item.changedField) {
                  groupChanges.push(...parseHistoryEntryChanges(item));
                }
              });

              const actionMeta = resolveAction(primaryAction);
              const isCreate = primaryAction.toUpperCase().includes('CREATE') || primaryAction.toUpperCase().includes('ADD');
              const rawUnit = group.unitName;
              const unitName = rawUnit && rawUnit !== '—' ? rawUnit : 'Cục Hàng hải Việt Nam';

              const validChanges = deduplicateAttachmentHistoryChanges(groupChanges).filter((change) => {
                const ov = resolveFieldValue(change.field, change.oldValue);
                const nv = resolveFieldValue(change.field, change.newValue);
                if (ov !== '—' && nv !== '—' && String(ov).trim() === String(nv).trim()) {
                  return false;
                }
                return true;
              });

              const orderedChanges = mergeChangesByField(validChanges, combinedFieldMap);

              return (
                <div
                  key={gIdx}
                  style={variant === 'berth' ? {
                    ...historyGroupGridStyle,
                    marginBottom: gIdx < filteredGroups.length - 1 ? spaceSm : 0,
                  } : {
                    display: 'grid',
                    gridTemplateColumns: '240px minmax(0, 1fr)',
                    gap: spaceLg,
                    alignItems: 'start',
                    marginBottom: gIdx < filteredGroups.length - 1 ? spaceLg : 0,
                    position: 'relative',
                  }}
                >
                  {/* Left Column: Metadata */}
                  {variant === 'berth' ? (
                    <div style={{ minWidth: 0, paddingTop: spaceXs, alignSelf: 'start' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
                        <Typography.Text style={historyTimeStyle}>
                          {group.ts ? formatTimestamp(group.ts) : ''}
                        </Typography.Text>
                        <span style={{ flexShrink: 0 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              padding: '2px 10px',
                              borderRadius: radiusPill,
                              fontSize: fontSizeSm + 1,
                              fontWeight: fontWeightMedium,
                              background: actionMeta.bg,
                              color: actionMeta.color,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {actionMeta.label}
                          </span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
                        <Typography.Text style={historyMetaRowStyle}>
                          Người cập nhật: {group.actor || ''}
                        </Typography.Text>
                        <Typography.Text style={historyMetaRowStyle}>
                          Đơn vị: {unitName}
                        </Typography.Text>
                      </div>
                    </div>
                  ) : (
                    <div style={{ minWidth: 0, paddingTop: spaceXs, display: 'flex', gap: spaceSm, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: actionMeta.color,
                          boxShadow: `0 0 0 3px ${actionMeta.bg}`,
                          marginTop: 5,
                          flexShrink: 0,
                          zIndex: 1,
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spaceSm, marginBottom: spaceXs }}>
                          <Typography.Text
                            style={{
                              display: 'block',
                              fontSize: fontSizeMd,
                              color: textPrimary,
                              fontWeight: fontWeightBold,
                              lineHeight: 1.5,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {group.ts ? formatTimestamp(group.ts) : ''}
                          </Typography.Text>
                          <span style={{ flexShrink: 0 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                padding: '1px 8px',
                                borderRadius: 999,
                                fontSize: fontSizeSm,
                                fontWeight: fontWeightMedium,
                                background: actionMeta.bg,
                                color: actionMeta.color,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {actionMeta.label}
                            </span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: fontSizeSm, color: textSecondary }}>
                            <UserOutlined style={{ fontSize: 12, color: textTertiary, flexShrink: 0 }} />
                            <span style={{ color: textPrimary, fontWeight: fontWeightMedium, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={group.actor || ''}>
                              {group.actor || ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: fontSizeSm, color: textSecondary }}>
                            <ApartmentOutlined style={{ fontSize: 12, color: textTertiary, flexShrink: 0 }} />
                            <span style={{ color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={unitName}>
                              {unitName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right Card: Changes & Notes */}
                  <div
                    style={variant === 'berth' ? { ...historyInfoCardStyle, alignSelf: 'stretch', height: '100%', boxSizing: 'border-box' } : {
                      position: 'relative',
                      minWidth: 0,
                      background: '#ffffff',
                      borderRadius: 8,
                      padding: '14px 18px 12px 18px',
                      paddingLeft: 18,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    {/* Left Accent Bar */}
                    <div
                      style={variant === 'berth' ? historyAccentBarStyle(actionMeta.color) : {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        borderRadius: 2,
                        background: actionMeta.color,
                      }}
                    />

                    {/* Change list */}
                    {orderedChanges.length > 0 ? (
                      <div>
                        {orderedChanges.map((change, cIdx) => {
                          const label = combinedFieldMap[change.field] || change.field;
                          const prevChange = cIdx > 0 ? orderedChanges[cIdx - 1] : null;
                          const prevLabel = prevChange ? (combinedFieldMap[prevChange.field] || prevChange.field) : null;
                          const isFirstInGroup = cIdx === 0 || label !== prevLabel;

                          const ov = resolveFieldValue(change.field, change.oldValue);
                          const nv = resolveFieldValue(change.field, change.newValue);

                          const renderFormattedContent = (content: string, isOld: boolean = false) => {
                            if (!content || content === '—' || content === '-' || content === 'null' || content === '(null)' || content === '(trống)' || content === '— (Trống)' || content === 'Chưa có') {
                              return '';
                            }
                            const str = String(content).trim();
                            const normLabel = (label || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
                            const normField = (change.field || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
                            const isSymbolField = normLabel.includes('bieu tuong') || normLabel.includes('symbol') || normLabel.includes('icon')
                              || normField.includes('bieu tuong') || normField === 'symbol' || normField === 'mapsymbolid' || normField === 'symbolid' || normField === 'mapsymbol' || normField === 'icon';

                            if (isSymbolField) {
                              return renderSymbolValue(str);
                            }

                            const isCoordField = normLabel.includes('toa do') || normLabel.includes('coordinate')
                              || normField.includes('toa do') || normField.includes('coordinate')
                              || /^POINT\s*\(/i.test(str) || /^LINESTRING\s*\(/i.test(str) || /^LINE\s*\(/i.test(str) || /^POLYGON\s*\(\(/i.test(str) || /^MULTIPOINT\s*\(/i.test(str);

                            if (isCoordField) {
                              return renderCoordinatesDisplay(str);
                            }

                            const isMultiItemField = isAttachmentField(change.field) || isZoneField(change.field)
                              || normLabel.includes('dinh kem') || normLabel.includes('vung') || normLabel.includes('danh sach')
                              || normLabel.includes('list') || normField.includes('attachments') || normField.includes('zones');

                            if (str.includes(',') && (isMultiItemField || str.length > 25)) {
                              const items = str.split(',').map((s) => s.trim()).filter(Boolean);
                              if (items.length > 1) {
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                                    {items.map((item, idx) => (
                                      <div key={idx} style={{ color: isOld ? textSecondary : textPrimary, fontWeight: isOld ? 400 : fontWeightMedium, lineHeight: '20px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                        {item}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            }
                            return renderCommonHistoryValueTag(label, content, isOld);
                          };

                          if (isCreate) {
                            return (
                              <div
                                key={cIdx}
                                style={variant === 'berth' ? {
                                  ...historyCreateRowStyle,
                                  paddingTop: cIdx > 0 ? spaceXs : 0,
                                } : {
                                  display: 'grid',
                                  gridTemplateColumns: '150px minmax(0, 1fr)',
                                  alignItems: 'flex-start',
                                  gap: spaceSm,
                                  fontSize: fontSizeMd,
                                  lineHeight: 1.6,
                                  padding: '4px 0',
                                  marginTop: isFirstInGroup && cIdx > 0 ? 6 : 0,
                                }}
                              >
                                <div style={variant === 'berth' ? historyFieldLabelStyle : { minWidth: 0, fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                  {label ? `${label}:` : ''}
                                </div>
                                <span title={nv ?? ''} style={variant === 'berth' ? historyNewValueStyle : { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.5, color: textPrimary }}>
                                  {renderFormattedContent(nv, false) ?? (nv ?? '')}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={cIdx}
                              style={variant === 'berth' ? {
                                ...historyChangeRowStyle,
                                paddingTop: cIdx > 0 ? spaceXs : 0,
                              } : {
                                display: 'grid',
                                gridTemplateColumns: '150px minmax(0, 1fr) 24px minmax(0, 1fr)',
                                alignItems: 'flex-start',
                                gap: spaceSm,
                                fontSize: fontSizeMd,
                                lineHeight: 1.6,
                                padding: '4px 0',
                                marginTop: isFirstInGroup && cIdx > 0 ? 6 : 0,
                              }}
                            >
                              <div style={variant === 'berth' ? historyFieldLabelStyle : { minWidth: 0, fontWeight: fontWeightMedium, color: textSecondary, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                {label ? `${label}:` : ''}
                              </div>
                              <span title={ov ?? ''} style={variant === 'berth' ? historyOldValueStyle : { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.5, color: textSecondary }}>
                                {renderFormattedContent(ov, true) ?? (ov ?? '')}
                              </span>
                              <span style={variant === 'berth' ? historyArrowStyle : { color: textTertiary, textAlign: 'center', fontWeight: fontWeightBold, userSelect: 'none', paddingTop: 2 }}>
                                →
                              </span>
                              <span title={nv ?? ''} style={variant === 'berth' ? historyNewValueStyle : { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.5 }}>
                                {renderFormattedContent(nv, false) ?? (nv ?? '')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : groupNotes.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Typography.Text
                          style={{
                            fontSize: fontSizeMd,
                            fontWeight: fontWeightMedium,
                            color: textSecondary,
                            marginBottom: 4,
                          }}
                        >
                          Chi tiết thao tác:
                        </Typography.Text>
                        {groupNotes.map((note, nIdx) => (
                          <div key={nIdx} style={{ display: 'flex', alignItems: 'center', gap: spaceSm, fontSize: fontSizeMd, color: textPrimary }}>
                            {note.includes('tệp') || note.includes('file') ? (
                              <FileOutlined style={{ color: actionPrimary, flexShrink: 0 }} />
                            ) : null}
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Typography.Text style={{ color: textTertiary, fontSize: fontSizeMd, fontStyle: 'italic' }}>
                        Không có thông tin chi tiết thay đổi
                      </Typography.Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {loadingMore && (
          <div style={{ padding: spaceMd, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>
            Đang tải thêm…
          </div>
        )}
      </div>
    </AppDrawer>
  );
};

export default CommonHistoryDrawer;
