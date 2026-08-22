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
import type { BeaconStatus } from '../../types/beacon';
import { BEACON_STATUS_MAP } from '../../types/beacon';

// ── Re-exports from types/beacon.ts (import-then-export; Vite dev bug) ─

import { BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP } from '../../types/beacon';
export { BUOY_TYPE_OPTIONS, BUOY_TYPE_MAP };

// ── Status badge (moved from BuoyList.tsx APPROVAL_STYLE_MAP) ────────

const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Nháp' },
  PENDING_APPROVAL: { color: actionPrimary, label: 'Chờ phê duyệt' },
  APPROVED_L1: { color: statusAttention, label: 'Đã phê duyệt L1' },
  PUBLISHED: { color: statusOperational, label: 'Đã công bố' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
};

/** Trả về { color (semantic token), label (Tiếng Việt) } cho trạng thái duyệt phao tiêu. */
export function buoyStatusBadge(status: string | null | undefined): { color: string; label: string } {
  if (!status) return { color: textTertiary, label: '—' };
  return APPROVAL_STYLE_MAP[status] || {
    color: textTertiary,
    label: BEACON_STATUS_MAP[status as BeaconStatus]?.label || status,
  };
}

// ── Status tabs (moved from BuoyList.tsx) ────────────────────────────

export const TAB_STATUS_LIST = [
  { key: 'all', label: 'Tất cả', color: actionPrimary },
  { key: 'DRAFT', label: 'Nháp', color: statusDraft },
  { key: 'PENDING_APPROVAL', label: 'Chờ phê duyệt', color: actionPrimary },
  { key: 'APPROVED_L1', label: 'Đã phê duyệt L1', color: statusAttention },
  { key: 'PUBLISHED', label: 'Đã công bố', color: statusOperational },
  { key: 'REJECTED', label: 'Từ chối', color: statusCritical },
];

/** Status filter options (from BEACON_STATUS_MAP, §2.2). */
export const BUOY_STATUS_OPTIONS: Array<{ value: string; label: string }> =
  Object.entries(BEACON_STATUS_MAP).map(([value, { label }]) => ({ value, label }));

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

export const CLASSIFICATION_BUOY_OPTIONS = [
  { value: 'Báo hiệu hàng hải', label: 'Báo hiệu hàng hải' },
  { value: 'Tàu đèn', label: 'Tàu đèn' },
  { value: 'Thiết bị khác', label: 'Thiết bị khác' },
  { value: 'Phao thép', label: 'Phao thép' },
  { value: 'Phao nhựa', label: 'Phao nhựa' },
];

export const CLASSIFICATION_MARK_OPTIONS = [
  { value: 'Báo hiệu thị giác', label: 'Báo hiệu thị giác' },
  { value: 'Báo hiệu vô tuyến', label: 'Báo hiệu vô tuyến' },
  { value: 'Báo hiệu âm thanh', label: 'Báo hiệu âm thanh' },
  { value: 'Tiêu BTCT', label: 'Tiêu BTCT' },
  { value: 'Tiêu thép', label: 'Tiêu thép' },
  { value: 'Tiêu composite', label: 'Tiêu composite' },
];

export const CONDITION_OPTIONS = [
  { value: 'Chưa khai thác/vận hành', label: 'Chưa khai thác/vận hành' },
  { value: 'Đang khai thác/vận hành', label: 'Đang khai thác/vận hành' },
  { value: 'Dừng khai thác/vận hành', label: 'Dừng khai thác/vận hành' },
];

export const BEACON_LIGHT_OPTIONS = [
  { value: 'Đèn LED', label: 'Đèn LED' },
  { value: 'Đèn sợi đốt', label: 'Đèn sợi đốt' },
  { value: 'Đèn chớp', label: 'Đèn chớp' },
  { value: 'Đèn phản quang', label: 'Đèn phản quang' },
  { value: 'Không có đèn', label: 'Không có đèn' },
];

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
  shape: z.string().optional().or(z.literal('')),
  lightCharacteristic: z.string().optional().or(z.literal('')),
  range: z.coerce
    .number()
    .min(0.01, 'Phạm vi chiếu sáng phải lớn hơn 0 hải lý'),
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
  shape: z.string().optional().or(z.literal('')),
  lightCharacteristic: z.string().optional().or(z.literal('')),
  range: z.coerce
    .number()
    .min(0.01, 'Phạm vi chiếu sáng phải lớn hơn 0 hải lý'),
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
