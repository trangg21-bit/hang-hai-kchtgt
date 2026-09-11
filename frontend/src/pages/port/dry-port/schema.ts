import type { CSSProperties } from 'react';
import {
  statusDraft,
  statusAttention,
  statusOperational,
  statusCritical,
  radiusPill,
  fontSizeMd,
  fontWeightMedium,
} from '../../../themetokenchk';

export const REGION_OPTIONS = [
  { value: 'Miền Bắc', label: 'Miền Bắc' },
  { value: 'Miền Trung', label: 'Miền Trung' },
  { value: 'Miền Nam', label: 'Miền Nam' },
];

export const PORT_STATUS_OPTIONS = [
  { value: 1, label: 'Đang khai thác/vận hành' },
  { value: 0, label: 'Chưa khai thác/vận hành' },
  { value: 2, label: 'Dừng khai thác/vận hành' },
];

export const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

export const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

export const COORD_SYS_LABELS: Record<number, string> = {
  1: 'WGS-84',
  2: 'VN-2000',
};

export interface StatusBadgeInfo {
  label: string;
  color: string;
  style: CSSProperties;
}

const createBadgeStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  borderRadius: radiusPill,
  fontSize: fontSizeMd,
  fontWeight: fontWeightMedium,
  background: `${color}18`,
  border: `1px solid ${color}40`,
  color,
  whiteSpace: 'nowrap',
});

/**
 * Ánh xạ trạng thái phê duyệt chuẩn 6 tab màu semantic:
 * 1. Tất cả (#0E6FD6)
 * 2. Lưu tạm (#93A3B3)
 * 3. Chờ Cảng vụ duyệt (#EDA100)
 * 4. Chờ Cục duyệt (#0284C7)
 * 5. Đã duyệt (#1BAF7A)
 * 6. Từ chối (#E34948)
 */
export function trangThaiPheDuyetBadge(status: string | null | undefined): StatusBadgeInfo {
  if (!status) {
    return { label: '', color: statusDraft, style: createBadgeStyle(statusDraft) };
  }
  const upper = String(status).toUpperCase().trim();
  let label = status;
  let color = '#93A3B3';
  switch (upper) {
    case 'DRAFT':
    case 'NHAP':
    case 'LƯU TẠM':
    case 'LUU TAM':
      label = 'Lưu tạm';
      color = '#93A3B3';
      break;
    case 'PENDING':
    case 'PENDING_APPROVAL':
    case 'PORT_AUTHORITY':
    case 'CHỜ CẢNG VỤ DUYỆT':
    case 'CHỜ PHÊ DUYỆT CẤP CẢNG VỤ/CHI CỤC':
      label = 'Chờ Cảng vụ duyệt';
      color = '#EDA100';
      break;
    case 'APPROVED_LEVEL1':
    case 'CHỜ CỤC DUYỆT':
    case 'CHỜ PHÊ DUYỆT CẤP CỤC':
      label = 'Chờ Cục duyệt';
      color = '#0284C7';
      break;
    case 'APPROVED':
    case 'APPROVED_LEVEL2':
    case 'ĐÃ PHÊ DUYỆT':
    case 'ĐÃ DUYỆT':
      label = 'Đã phê duyệt';
      color = '#1BAF7A';
      break;
    case 'REJECTED':
    case 'REJECTED_LEVEL1':
    case 'REJECTED_LEVEL2':
    case 'TỪ CHỐI':
    case 'TU CHOI':
      label = 'Từ chối';
      color = '#E34948';
      break;
    default:
      label = status;
      color = '#93A3B3';
      break;
  }
  return { label, color, style: createBadgeStyle(color) };
}

export function trangThaiHoatDongBadge(
  status: number | string | null | undefined,
  opStatus?: string | null | undefined,
): StatusBadgeInfo {
  if (opStatus === 'OPERATIONAL' || status === 1 || status === '1') {
    return { label: 'Đang khai thác/vận hành', color: statusOperational, style: createBadgeStyle(statusOperational) };
  }
  if (opStatus === 'SUSPENDED' || status === 2 || status === '2') {
    return { label: 'Dừng khai thác/vận hành', color: statusCritical, style: createBadgeStyle(statusCritical) };
  }
  return { label: 'Chưa khai thác/vận hành', color: statusAttention, style: createBadgeStyle(statusAttention) };
}

export function ddToDms(dd: number | null | undefined): { d: number | null; m: number | null; s: number | null } {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  const abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) {
    d += 1;
    mFloat = 0;
  }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) {
    m += 1;
    sFloat = 0;
    if (m >= 60) {
      m = 0;
      d += 1;
    }
  }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) {
    s = 0;
    m += 1;
    if (m >= 60) {
      m = 0;
      d += 1;
    }
  }
  return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
}

export function dmsToDd(d: number | null | undefined, m: number | null | undefined, s: number | null | undefined): number | undefined {
  if (d == null && m == null && s == null) return undefined;
  const deg = d ?? 0;
  const min = (m ?? 0) / 60;
  const sec = (s ?? 0) / 3600;
  return Math.round((deg + min + sec) * 1e7) / 1e7;
}

export function buildCoordinatesWkt(
  geomType: string | undefined,
  coords: Array<{ latitude: number; longitude: number }>,
): string | undefined {
  if (!geomType || coords.length === 0) return undefined;
  if (geomType === 'POINT') return `POINT(${coords[0].longitude} ${coords[0].latitude})`;
  if (geomType === 'LINE') return `LINESTRING(${coords.map((c) => `${c.longitude} ${c.latitude}`).join(', ')})`;
  if (geomType === 'POLYGON') {
    const ring = [...coords];
    if (ring[0].latitude !== ring[ring.length - 1].latitude || ring[0].longitude !== ring[ring.length - 1].longitude) {
      ring.push(ring[0]);
    }
    return `POLYGON((${ring.map((c) => `${c.longitude} ${c.latitude}`).join(', ')}))`;
  }
  return undefined;
}
