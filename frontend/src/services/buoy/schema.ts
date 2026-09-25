// ── Buoy schema + label/status maps ─────────────────────────────────
// Status/type/label maps moved verbatim from the old routed BuoyList screen;
// APPROVAL_STYLE_MAP → buoyStatusBadge (semantic tokens, design §2.2).

import { z } from 'zod';
import {
  statusDraft,
  statusOperational,
  statusAttention,
  statusCritical,
  actionPrimary,
  textTertiary,
} from '../../tokens';
import type { BuoyStatus } from '../../types/buoy';
import { BUOY_STATUS_MAP } from '../../types/buoy';

// ── Re-exports from types/buoy.ts (import-then-export; Vite dev bug) ─

import { BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP } from '../../types/buoy';
export { BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP };

// ── Status badge (moved from BuoyList.tsx APPROVAL_STYLE_MAP) ────────

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục' },
  APPROVED_L1: { color: statusAttention, label: 'Chờ phê duyệt cấp Cục' },
  PUBLISHED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_L1: { color: statusCritical, label: 'Từ chối cấp Cảng vụ/Chi cục' },
  REJECTED_L2: { color: statusCritical, label: 'Từ chối cấp Cục' },
  APPROVED_L2: { color: statusOperational, label: 'Đã phê duyệt' },
  DELETED: { color: statusCritical, label: 'Đã xóa' },
};

/** Chuẩn hóa trạng thái legacy về 7 trạng thái chuẩn (chuẩn AGENTS.md). */
export function normalizeBuoyStatus(status: string | null | undefined): string {
  if (!status) return 'DRAFT';
  const s = String(status).trim().toUpperCase();
  if (s === 'APPROVED_L2' || s === 'APPROVED_LEVEL2' || s === 'APPROVED') return 'PUBLISHED';
  if (s === 'REJECTED') return 'REJECTED_L1';
  if (s === 'PROPOSED') return 'PENDING_APPROVAL';
  return s;
}

/** Trả về { color (semantic token), label (Tiếng Việt) } cho trạng thái duyệt phao tiêu. */
export function buoyStatusBadge(status: string | null | undefined): { color: string; label: string } {
  if (!status) return { color: textTertiary, label: '' };
  const normalized = normalizeBuoyStatus(status);
  return APPROVAL_STYLE_MAP[normalized] || APPROVAL_STYLE_MAP[status] || {
    color: textTertiary,
    label: BUOY_STATUS_MAP[status as BuoyStatus]?.label || status,
  };
}

// ── Status tabs (moved from BuoyList.tsx) ────────────────────────────

export const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Lưu tạm', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục', color: actionPrimary },
  { key: 'APPROVED_L1', label: 'Chờ phê duyệt cấp Cục', color: statusAttention },
  { key: 'PUBLISHED', label: 'Đã phê duyệt', color: statusOperational },
  { key: 'REJECTED_L1', label: 'Từ chối cấp Cảng vụ/Chi cục', color: statusCritical },
  { key: 'REJECTED_L2', label: 'Từ chối cấp Cục', color: statusCritical },
  { key: 'DELETED', label: 'Đã xóa', color: statusCritical },
];

/** Status filter options (from BUOY_STATUS_MAP, §2.2). */
export const BUOY_STATUS_OPTIONS: Array<{ value: string; label: string }> =
  Object.entries(BUOY_STATUS_MAP).map(([value, { label }]) => ({ value, label }));

// ── Label maps (moved verbatim from BuoyList.tsx) ────────────────────

export const COLOR_LABEL_MAP: Record<string, string> = {
  RED: 'Đỏ',
  GREEN: 'Xanh lá',
  BLACK_RED: 'Đen + Đỏ',
  BLACK_YELLOW: 'Đen + Vàng',
  WHITE: 'Trắng',
  YELLOW: 'Vàng',
  ORANGE: 'Cam',
};

export const SHAPE_LABEL_MAP: Record<string, string> = {
  CAN: 'Hình trụ',
  CONE: 'Hình nón',
  SPAR: 'Trụ',
  BELL: 'Chuông',
  BUCKET: 'Gáo',
  TUBULAR: 'Ống',
};

export const LIGHT_CHAR_LABEL_MAP: Record<string, string> = {
  FL: 'FL - Chớp đơn',
  'FL(2)': 'FL(2) - Chớp nhóm 2',
  'FL(3)': 'FL(3) - Chớp nhóm 3',
  Iso: 'Iso - Đồng pha',
  Q: 'Q - Chớp nhanh',
  VQ: 'VQ - Chớp rất nhanh',
  Oc: 'Oc - Huyền phù',
  F: 'F - Cố định',
};

export const BUOY_FIELD_MAP: Record<string, string> = {
  name: 'Tên phao tiêu', code: 'Mã phao tiêu', type: 'Loại phao',
  latitude: 'Vĩ độ', longitude: 'Kinh độ', color: 'Màu sắc', shape: 'Hình dạng',
  lightCharacteristic: 'Đặc tính ánh sáng', range: 'Phạm vi (HL)',
  description: 'Mô tả', unitId: 'Đơn vị quản lý',
  lastInspectionDate: 'KT gần nhất', nextInspectionDate: 'KT kế tiếp',
  isActive: 'Hoạt động', status: 'Trạng thái', approvalStatus: 'Trạng thái duyệt',
  rejectionReason: 'Lý do từ chối', approvalLevel: 'Cấp duyệt',
  provinceId: 'Tỉnh/TP', spatialId: 'Vị trí GIS',
};

// ── Form/action options (moved verbatim from BuoyForm.tsx) ───────────

export const COLOR_OPTIONS = [
  { value: 'RED', label: 'Đỏ' },
  { value: 'GREEN', label: 'Xanh lá' },
  { value: 'BLACK_RED', label: 'Đen + Đỏ' },
  { value: 'BLACK_YELLOW', label: 'Đen + Vàng' },
  { value: 'WHITE', label: 'Trắng' },
  { value: 'YELLOW', label: 'Vàng' },
  { value: 'ORANGE', label: 'Cam' },
];

export const SHAPE_OPTIONS = [
  { value: 'CAN', label: 'Hình trụ (CAN)' },
  { value: 'CONE', label: 'Hình nón (CONE)' },
  { value: 'SPAR', label: 'Trụ (SPAR)' },
  { value: 'BELL', label: 'Chuông (BELL)' },
  { value: 'BUCKET', label: 'Gáo (BUCKET)' },
  { value: 'TUBULAR', label: 'Ống (TUBULAR)' },
];

export const LIGHT_CHAR_OPTIONS = [
  { value: 'FL', label: 'FL - Chớp đơn' },
  { value: 'FL(2)', label: 'FL(2) - Chớp nhóm 2' },
  { value: 'FL(3)', label: 'FL(3) - Chớp nhóm 3' },
  { value: 'Iso', label: 'Iso - Đồng pha' },
  { value: 'Q', label: 'Q - Chớp nhanh' },
  { value: 'VQ', label: 'VQ - Chớp rất nhanh' },
  { value: 'Oc', label: 'Oc - Huyền phù' },
  { value: 'F', label: 'F - Cố định' },
];

// ── Options cho các Select theo đặc tả CSV 'QL Phao tiêu' (SelectAppParams) ──

export const CLASSIFICATION_OPTIONS = [
  { value: 'Phao', label: 'Phao' },
  { value: 'Tiêu', label: 'Tiêu' },
  { value: 'Chập Tiêu', label: 'Chập Tiêu' },
  { value: 'Đèn kè', label: 'Đèn kè' },
];

export const CLASSIFICATION_LABEL_MAP: Record<string, string> = {
  '1': 'Phao',
  '2': 'Tiêu',
  '3': 'Chập Tiêu',
  '4': 'Đèn kè',
  Phao: 'Phao',
  'Tiêu': 'Tiêu',
  'Chập Tiêu': 'Chập Tiêu',
  'Đèn kè': 'Đèn kè',
};

export const CLASSIFICATION_BUOY_OPTIONS = [
  { value: 'Báo hiệu hàng hải', label: 'Báo hiệu hàng hải' },
  { value: 'Tàu đèn', label: 'Tàu đèn' },
  { value: 'Thiết bị khác', label: 'Thiết bị khác' },
  { value: 'Phao thép', label: 'Phao thép' },
  { value: 'Phao nhựa', label: 'Phao nhựa' },
];

export const CLASSIFICATION_BUOY_LABEL_MAP: Record<string, string> = {
  '1': 'Báo hiệu hàng hải',
  '2': 'Tàu đèn',
  '3': 'Thiết bị khác',
  '4': 'Phao thép',
  '5': 'Phao nhựa',
  'Báo hiệu hàng hải': 'Báo hiệu hàng hải',
  'Tàu đèn': 'Tàu đèn',
  'Thiết bị khác': 'Thiết bị khác',
  'Phao thép': 'Phao thép',
  'Phao nhựa': 'Phao nhựa',
};

export const CLASSIFICATION_MARK_OPTIONS = [
  { value: 'Báo hiệu thị giác', label: 'Báo hiệu thị giác' },
  { value: 'Báo hiệu vô tuyến', label: 'Báo hiệu vô tuyến' },
  { value: 'Báo hiệu âm thanh', label: 'Báo hiệu âm thanh' },
  { value: 'Tiêu BTCT', label: 'Tiêu BTCT' },
  { value: 'Tiêu thép', label: 'Tiêu thép' },
  { value: 'Tiêu composite', label: 'Tiêu composite' },
];

export const CLASSIFICATION_MARK_LABEL_MAP: Record<string, string> = {
  '1': 'Báo hiệu thị giác',
  '2': 'Báo hiệu vô tuyến',
  '3': 'Báo hiệu âm thanh',
  '4': 'Tiêu BTCT',
  '5': 'Tiêu thép',
  '6': 'Tiêu composite',
  'Báo hiệu thị giác': 'Báo hiệu thị giác',
  'Báo hiệu vô tuyến': 'Báo hiệu vô tuyến',
  'Báo hiệu âm thanh': 'Báo hiệu âm thanh',
  'Tiêu BTCT': 'Tiêu BTCT',
  'Tiêu thép': 'Tiêu thép',
  'Tiêu composite': 'Tiêu composite',
};

export function formatClassification(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (Array.isArray(val)) {
    return val.map((v) => CLASSIFICATION_LABEL_MAP[String(v).trim()] || String(v).trim()).filter(Boolean).join(', ');
  }
  const str = String(val).trim();
  if (!str) return '';
  return str.split(',').map((v) => CLASSIFICATION_LABEL_MAP[v.trim()] || v.trim()).filter(Boolean).join(', ');
}

export function formatClassificationBuoy(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (Array.isArray(val)) {
    return val.map((v) => CLASSIFICATION_BUOY_LABEL_MAP[String(v).trim()] || String(v).trim()).filter(Boolean).join(', ');
  }
  const str = String(val).trim();
  if (!str) return '';
  return str.split(',').map((v) => CLASSIFICATION_BUOY_LABEL_MAP[v.trim()] || v.trim()).filter(Boolean).join(', ');
}

export function formatClassificationMark(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (Array.isArray(val)) {
    return val.map((v) => CLASSIFICATION_MARK_LABEL_MAP[String(v).trim()] || String(v).trim()).filter(Boolean).join(', ');
  }
  const str = String(val).trim();
  if (!str) return '';
  return str.split(',').map((v) => CLASSIFICATION_MARK_LABEL_MAP[v.trim()] || v.trim()).filter(Boolean).join(', ');
}

export const CONDITION_OPTIONS = [
  { value: 'Chưa khai thác/vận hành', label: 'Chưa khai thác/vận hành' },
  { value: 'Đang khai thác/vận hành', label: 'Đang khai thác/vận hành' },
  { value: 'Dừng khai thác/vận hành', label: 'Dừng khai thác/vận hành' },
];

export const CONDITION_STYLE: Record<string, { color: string; label: string }> = {
  'Đang khai thác/vận hành': { color: statusOperational, label: 'Đang khai thác/vận hành' },
  'Chưa khai thác/vận hành': { color: statusAttention, label: 'Chưa khai thác/vận hành' },
  'Dừng khai thác/vận hành': { color: statusCritical, label: 'Dừng khai thác/vận hành' },
};

/**
 * Chuẩn hóa tình trạng phao tiêu về đúng 3 trạng thái chuẩn vi-VN:
 * - 'Đang khai thác/vận hành'
 * - 'Chưa khai thác/vận hành'
 * - 'Dừng khai thác/vận hành'
 */
export function normalizeBuoyCondition(v?: string | null): string {
  if (!v) return '';
  const s = String(v).trim();
  if (s === 'Đang khai thác/vận hành' || s === 'Chưa khai thác/vận hành' || s === 'Dừng khai thác/vận hành') {
    return s;
  }
  const lower = s.toLowerCase();
  if (lower.includes('dừng') || lower.includes('dung') || lower.includes('hỏng') || lower.includes('hong')) {
    return 'Dừng khai thác/vận hành';
  }
  if (lower.includes('bãi') || lower.includes('bai') || lower.includes('chưa') || lower.includes('chua')) {
    return 'Chưa khai thác/vận hành';
  }
  if (
    lower.includes('luồng') ||
    lower.includes('luong') ||
    lower.includes('hoạt động') ||
    lower.includes('hoat dong') ||
    lower.includes('gắn đèn') ||
    lower.includes('gan den') ||
    lower.includes('đang') ||
    lower.includes('dang')
  ) {
    return 'Đang khai thác/vận hành';
  }
  return s;
}

/**
 * Trả về { color, label } badge cho tình trạng phao tiêu, chuẩn hóa giá trị legacy về 3 trạng thái chuẩn.
 */
export function buoyConditionBadge(v?: string | null): { color: string; label: string } | null {
  const norm = normalizeBuoyCondition(v);
  if (!norm) return null;
  return CONDITION_STYLE[norm] || { color: textTertiary, label: norm };
}

export const BUOY_LIGHT_OPTIONS = [
  { value: 'Không có đèn', label: 'Không có đèn' },
  { value: 'Có đèn', label: 'Có đèn' },
];

/** Alias for backward compatibility */
export const BEACON_LIGHT_OPTIONS = BUOY_LIGHT_OPTIONS;

// ── Zod schemas (messages identical to current UI strings) ───────────

export const createSchema = z.object({
  code: z
    .string()
    .min(1, 'Mã phao tiêu không được để trống')
    .max(50, 'Tối đa 50 ký tự'),
  name: z
    .string()
    .min(1, 'Tên phao tiêu không được để trống')
    .max(255, 'Tối đa 255 ký tự'),
  color: z.string().optional().or(z.literal('')),
  shape: z.string().max(50, 'Hình dạng tối đa 50 ký tự').optional().or(z.literal('')),
  lightCharacteristic: z.string().optional().or(z.literal('')),
  range: z.coerce
    .number()
    .min(0, 'Phạm vi chiếu sáng không được âm')
    .optional()
    .nullable(),
  unitId: z.string().optional().or(z.literal('')),
  latitude: z.coerce
    .number()
    .min(-90, 'Vĩ độ phải từ -90° đến 90° (WGS84)')
    .max(90, 'Vĩ độ phải từ -90° đến 90° (WGS84)')
    .optional(),
  longitude: z.coerce
    .number()
    .min(-180, 'Kinh độ phải từ -180° đến 180° (WGS84)')
    .max(180, 'Kinh độ phải từ -180° đến 180° (WGS84)')
    .optional(),
  isActive: z.boolean().optional(),
  buoyStationId: z.string().optional().or(z.literal('')),
  classification: z.string().min(1, 'Vui lòng chọn phân loại'),
  classificationBuoy: z.string().optional().or(z.literal('')),
  classificationMark: z.string().optional().or(z.literal('')),
  provinceId: z.string().optional().or(z.literal('')),
  locationDetail: z.string().max(500, 'Địa điểm chi tiết tối đa 500 ký tự').optional().or(z.literal('')),
  condition: z.string().min(1, 'Vui lòng chọn tình trạng'),
  structure: z.string().max(2000, 'Kết cấu tối đa 2000 ký tự').optional().or(z.literal('')),
  area: z.coerce.number().min(0, 'Diện tích không được âm').optional(),
  bodyHeight: z.coerce.number().min(0, 'Chiều cao thân phao không được âm').optional(),
  diameter: z.coerce.number().min(0, 'Đường kính phao không được âm').optional(),
  beaconLight: z.string().optional().or(z.literal('')),
  towerHeight: z.coerce.number().min(0, 'Chiều cao tháp đèn không được âm').optional(),
  lightHeight: z.coerce.number().min(0.01, 'Chiều cao tâm sáng (hải đồ) là bắt buộc và phải lớn hơn 0'),
  lightModel: z.string().max(100, 'Chủng loại đèn tối đa 100 ký tự').optional().or(z.literal('')),
  towerColor: z.string().max(200, 'Màu sắc tháp đèn tối đa 200 ký tự').optional().or(z.literal('')),
  powerSupply: z.string().max(500, 'Nguồn năng lượng tối đa 500 ký tự').optional().or(z.literal('')),
  commissionedDate: z.string().optional().or(z.literal('')),
  lastRepairDate: z.string().optional().or(z.literal('')),
  lightColor: z.string().max(50, 'Màu sắc tối đa 50 ký tự').optional().or(z.literal('')),
  flashType: z.string().max(50, 'Kiểu chớp tối đa 50 ký tự').optional().or(z.literal('')),
  period: z.string().max(50, 'Chu kỳ tối đa 50 ký tự').optional().or(z.literal('')),
  action: z.enum(['draft', 'submit']).optional(),
});

export type CreateFormValues = z.infer<typeof createSchema>;

export const updateSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên phao tiêu không được để trống')
    .max(255, 'Tối đa 255 ký tự'),
  color: z.string().optional().or(z.literal('')),
  shape: z.string().max(50, 'Hình dạng tối đa 50 ký tự').optional().or(z.literal('')),
  lightCharacteristic: z.string().optional().or(z.literal('')),
  range: z.coerce
    .number()
    .min(0, 'Phạm vi chiếu sáng không được âm')
    .optional()
    .nullable(),
  unitId: z.string().optional().nullable().or(z.literal('')),
  latitude: z.coerce
    .number()
    .min(-90, 'Vĩ độ phải từ -90° đến 90° (WGS84)')
    .max(90, 'Vĩ độ phải từ -90° đến 90° (WGS84)')
    .optional(),
  longitude: z.coerce
    .number()
    .min(-180, 'Kinh độ phải từ -180° đến 180° (WGS84)')
    .max(180, 'Kinh độ phải từ -180° đến 180° (WGS84)')
    .optional(),
  isActive: z.boolean().optional(),
  buoyStationId: z.string().optional().or(z.literal('')),
  classification: z.string().min(1, 'Vui lòng chọn phân loại'),
  classificationBuoy: z.string().optional().or(z.literal('')),
  classificationMark: z.string().optional().or(z.literal('')),
  provinceId: z.string().optional().or(z.literal('')),
  locationDetail: z.string().max(500, 'Địa điểm chi tiết tối đa 500 ký tự').optional().or(z.literal('')),
  condition: z.string().min(1, 'Vui lòng chọn tình trạng'),
  structure: z.string().max(2000, 'Kết cấu tối đa 2000 ký tự').optional().or(z.literal('')),
  area: z.coerce.number().min(0, 'Diện tích không được âm').optional(),
  bodyHeight: z.coerce.number().min(0, 'Chiều cao thân phao không được âm').optional(),
  diameter: z.coerce.number().min(0, 'Đường kính phao không được âm').optional(),
  beaconLight: z.string().optional().or(z.literal('')),
  towerHeight: z.coerce.number().min(0, 'Chiều cao tháp đèn không được âm').optional(),
  lightHeight: z.coerce.number().min(0.01, 'Chiều cao tâm sáng (hải đồ) là bắt buộc và phải lớn hơn 0'),
  lightModel: z.string().max(100, 'Chủng loại đèn tối đa 100 ký tự').optional().or(z.literal('')),
  towerColor: z.string().max(200, 'Màu sắc tháp đèn tối đa 200 ký tự').optional().or(z.literal('')),
  powerSupply: z.string().max(500, 'Nguồn năng lượng tối đa 500 ký tự').optional().or(z.literal('')),
  commissionedDate: z.string().optional().or(z.literal('')),
  lastRepairDate: z.string().optional().or(z.literal('')),
  lightColor: z.string().max(50, 'Màu sắc tối đa 50 ký tự').optional().or(z.literal('')),
  flashType: z.string().max(50, 'Kiểu chớp tối đa 50 ký tự').optional().or(z.literal('')),
  period: z.string().max(50, 'Chu kỳ tối đa 50 ký tự').optional().or(z.literal('')),
});

export type UpdateFormValues = z.infer<typeof updateSchema>;

export const rejectSchema = z.object({
  rejectReason: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập lý do từ chối')
    .min(10, 'Lý do từ chối tối thiểu 10 ký tự')
    .max(500, 'Lý do từ chối tối đa 500 ký tự'),
});

export type RejectFormValues = z.infer<typeof rejectSchema>;

export const deleteConfirmSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập đúng tên phao tiêu hoặc gõ "XÓA" để xác nhận');
