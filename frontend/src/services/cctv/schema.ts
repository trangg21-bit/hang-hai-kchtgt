import { z } from 'zod';

// ── Status enums ────────────────────────────────────────────────────

// Matches BeaconStation: 0=Chưa khai thác, 1=Đang khai thác, 2=Dừng khai thác
export const TRANG_THAI_HOAT_DONG_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'Chưa khai thác/vận hành', value: 0 },
  { label: 'Đang khai thác/vận hành', value: 1 },
  { label: 'Dừng khai thác/vận hành', value: 2 },
];

export const TRANG_THAI_PHE_DUYET_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' },
  { label: 'Đã phê duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'TU_CHOI' },
];

// ── Attached infrastructure type ────────────────────────────────────

export const ATTACHED_INFRA_TYPE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'TTDH VTS', value: 1 },
  { label: 'Trạm Radar', value: 2 },
];

// ── List filter schema ──────────────────────────────────────────────

export const listFiltersSchema = z.object({
  search: z.string().optional(),
  operationalStatus: z.coerce.number().int().min(0).max(2).optional().or(z.nan()),
  approvalStatus: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']).optional(),
  yearOfUse: z.coerce.number().int().optional().or(z.nan()),
  sortBy: z.enum(['deviceCode', 'deviceName', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListFilters = z.infer<typeof listFiltersSchema>;

// ── Create schema ───────────────────────────────────────────────────

export const createSchema = z.object({
  deviceCode: z
    .string()
    .min(1, 'Mã thiết bị không được để trống')
    .max(200, 'Mã thiết bị tối đa 200 ký tự'),
  deviceName: z
    .string()
    .min(1, 'Tên thiết bị không được để trống')
    .max(255, 'Tên thiết bị tối đa 255 ký tự'),
  detailedLocation: z.string().max(500, 'Địa điểm chi tiết tối đa 500 ký tự').optional().or(z.literal('')),
  manufacturer: z.string().max(50, 'Hãng sản xuất tối đa 50 ký tự').optional().or(z.literal('')),
  model: z.string().max(255, 'Model tối đa 255 ký tự').optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(1, 'Số lượng phải lớn hơn 0').positive('Số lượng phải > 0'),
  orgUnitId: z.string().uuid().optional().or(z.literal('')),
  operatingUnitId: z.string().uuid().optional().or(z.literal('')),
  provinceId: z.string().uuid().optional().or(z.literal('')),
  attachedInfrastructureType: z.coerce.number().int().optional().or(z.nan()),
  attachedInfrastructureId: z.string().uuid().optional().or(z.literal('')),
  unitOfMeasure: z.coerce.number().int().optional().or(z.nan()),
  yearOfUse: z.coerce.number().int().min(1900).max(2100).optional().or(z.nan()),
  operationalStatus: z.coerce.number().int().min(0).max(2).optional().or(z.nan()),
  specifications: z.string().max(2000, 'Thông số kỹ thuật tối đa 2000 ký tự').optional().or(z.literal('')),
  maintenanceInformation: z.string().max(2000, 'Thông tin bảo trì tối đa 2000 ký tự').optional().or(z.literal('')),
  note: z.string().max(2000, 'Ghi chú tối đa 2000 ký tự').optional().or(z.literal('')),
  objectType: z.coerce.number().int().optional().or(z.nan()),
  mapSymbolId: z.string().uuid().optional().or(z.literal('')),
  coordinateSystem: z.coerce.number().int().optional().or(z.nan()),
  displayRule: z.coerce.number().int().optional().or(z.nan()),
  spatialId: z.string().uuid().optional().or(z.literal('')),
});

export type CreateFormValues = z.infer<typeof createSchema>;

// ── Update schema ───────────────────────────────────────────────────

export const updateSchema = z.object({
  id: z.string().uuid('ID không hợp lệ'),
  deviceCode: z.string(), // readonly
  deviceName: z.string().max(255, 'Tên thiết bị tối đa 255 ký tự').optional().or(z.literal('')),
  detailedLocation: z.string().max(500, 'Địa điểm chi tiết tối đa 500 ký tự').optional().or(z.literal('')),
  manufacturer: z.string().max(50, 'Hãng sản xuất tối đa 50 ký tự').optional().or(z.literal('')),
  model: z.string().max(255, 'Model tối đa 255 ký tự').optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(1, 'Số lượng phải lớn hơn 0').positive('Số lượng phải > 0'),
  orgUnitId: z.string().uuid().optional().nullable(),
  operatingUnitId: z.string().uuid().optional().nullable(),
  provinceId: z.string().uuid().optional().nullable(),
  attachedInfrastructureType: z.coerce.number().int().optional().or(z.nan()),
  attachedInfrastructureId: z.string().uuid().optional().nullable(),
  unitOfMeasure: z.coerce.number().int().optional().or(z.nan()),
  yearOfUse: z.coerce.number().int().min(1900).max(2100).optional().or(z.nan()),
  operationalStatus: z.coerce.number().int().min(0).max(2).optional().or(z.nan()),
  specifications: z.string().max(2000, 'Thông số kỹ thuật tối đa 2000 ký tự').optional().nullable(),
  maintenanceInformation: z.string().max(2000, 'Thông tin bảo trì tối đa 2000 ký tự').optional().nullable(),
  note: z.string().max(2000, 'Ghi chú tối đa 2000 ký tự').optional().nullable(),
  objectType: z.coerce.number().int().optional().or(z.nan()),
  mapSymbolId: z.string().uuid().optional().nullable(),
  coordinateSystem: z.coerce.number().int().optional().or(z.nan()),
  displayRule: z.coerce.number().int().optional().or(z.nan()),
  spatialId: z.string().uuid().optional().nullable(),
});

export type UpdateFormValues = z.infer<typeof updateSchema>;

// ── Approval / Reject schemas ───────────────────────────────────────

export const approveConfirmSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, { message: 'Bạn cần xác nhận hành động này' }),
});

export const rejectSchema = z.object({
  reason: z
    .string()
    .min(1, 'Lý do từ chối không được để trống')
    .min(10, 'Lý do từ chối tối thiểu 10 ký tự')
    .max(500, 'Lý do từ chối tối đa 500 ký tự'),
  confirmed: z.boolean().refine((val) => val === true, { message: 'Bạn cần xác nhận hành động này' }),
});

export type ApproveFormValues = z.infer<typeof approveConfirmSchema>;
export type RejectFormValues = z.infer<typeof rejectSchema>;

// ── Delete confirm schema ───────────────────────────────────────────

export const deleteConfirmSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, { message: 'Bạn cần xác nhận để xóa' }),
});

export type DeleteFormValues = z.infer<typeof deleteConfirmSchema>;

// ── Badge / colour helpers ──────────────────────────────────────────

// Matches BeaconStation OPERATIONAL_STATUS_STYLE_MAP: 0/1/2
export const trangThaiHoatDongBadge = (status: number | undefined | null): { color: string; label: string } => {
  if (status === 0) return { color: statusAttention, label: 'Chưa khai thác/vận hành' };
  if (status === 1) return { color: statusOperational, label: 'Đang khai thác/vận hành' };
  if (status === 2) return { color: statusCritical, label: 'Dừng khai thác/vận hành' };
  return { color: 'default', label: String(status ?? '—') };
};

export const trangThaiPheDuyetBadge = (status: string): { color: string; label: string } => {
  const norm = String(status || '').normalize('NFC').toUpperCase().trim();
  if (
    norm === 'CHO_PHE_DUYET' ||
    norm === 'PENDING' ||
    norm === 'PENDING_APPROVAL'
  ) {
    return { color: 'orange', label: 'Chờ phê duyệt' };
  }
  if (
    norm === 'DA_PHE_DUYET' ||
    norm === 'APPROVED' ||
    norm === 'DUC_PHI_DUYET'
  ) {
    return { color: 'green', label: 'Đã phê duyệt' };
  }
  if (
    norm === 'TU_CHOI' ||
    norm === 'REJECTED' ||
    norm === 'TU_CHOI'
  ) {
    return { color: 'red', label: 'Từ chối' };
  }
  if (norm === 'DRAFT') {
    return { color: 'default', label: 'Nháp' };
  }
  return { color: 'default', label: status };
};
