import { z } from 'zod';
import { statusAttention, statusOperational, statusCritical } from '../../themetokenchk';

// ── Form schemas — clone từ services/cctv/schema.ts ────────────────
// Quản lý hệ thống thông tin liên lạc VHF

// ── Status enums ────────────────────────────────────────────────────
export const OPERATIONAL_STATUS_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'Chưa khai thác/vận hành', value: 0 },
  { label: 'Đang khai thác/vận hành', value: 1 },
  { label: 'Dừng khai thác/vận hành', value: 2 },
];

export const ATTACHED_INFRA_TYPE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'TTDH VTS', value: 1 },
  { label: 'Trạm Radar', value: 2 },
];

export const createSchema = z.object({
  deviceCode: z.string().trim().optional(),
  deviceName: z.string().trim().min(1, 'Tên thiết bị không được để trống'),
  detailedLocation: z.string().trim().optional().nullable(),
  manufacturer: z.string().trim().optional().nullable(),
  model: z.string().trim().optional().nullable(),
  quantity: z.number({ message: 'Số lượng không được để trống' }).min(1, 'Số lượng phải lớn hơn 0'),
  orgUnitId: z.string().trim().optional().nullable(),
  operatingUnitId: z.string().trim().optional().nullable(),
  provinceName: z.string().trim().optional().nullable(),
  attachedInfrastructureType: z.number().optional().nullable(),
  attachedInfrastructureId: z.string().trim().optional().nullable(),
  unitOfMeasure: z.number().optional().nullable(),
  yearOfUse: z.number().optional().nullable(),
  operationalStatus: z.string().optional().nullable(),
  specifications: z.string().trim().optional().nullable(),
  maintenanceInformation: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
  objectType: z.number().optional().nullable(),
  mapSymbolId: z.string().trim().optional().nullable(),
  coordinateSystem: z.number().optional().nullable(),
  displayRule: z.number().optional().nullable(),
  spatialId: z.string().trim().optional().nullable(),
  geometryType: z.enum(['POINT', 'LINE', 'POLYGON']).optional().nullable(),
  coordinates: z.string().trim().optional().nullable(),
});

export const updateSchema = createSchema.extend({
  id: z.string().min(1),
});

export type CreateFormValues = z.infer<typeof createSchema>;
export type UpdateFormValues = z.infer<typeof updateSchema>;

// ── Approval schemas (2 cấp: C1 Cảng vụ / C2 Cục) ───────────────────

export const approveSchema = z.object({
  decision: z.string().min(1),
  reason: z.string().trim().optional(),
});

export const rejectSchema = z.object({
  decision: z.string().min(1),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do từ chối'),
});

export const submitConfirmSchema = z.object({
  content: z.string().trim().optional(),
});

export const approveConfirmSchema = submitConfirmSchema;
export type ApproveFormValues = z.infer<typeof approveSchema>;
export type RejectFormValues = z.infer<typeof rejectSchema>;

// ── Delete confirm schema ───────────────────────────────────────────

export const deleteConfirmSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, { message: 'Bạn cần xác nhận để xóa' }),
});

export type DeleteFormValues = z.infer<typeof deleteConfirmSchema>;

// ── Badge / colour helpers ──────────────────────────────────────────

// Matches BeaconStation OPERATIONAL_STATUS_STYLE_MAP: 0/1/2
export const operationalStatusBadge = (status: number | undefined | null): { color: string; label: string } => {
  if (status === 0) return { color: statusAttention, label: 'Chưa khai thác/vận hành' };
  if (status === 1) return { color: statusOperational, label: 'Đang khai thác/vận hành' };
  if (status === 2) return { color: statusCritical, label: 'Dừng khai thác/vận hành' };
  return { color: 'default', label: String(status ?? '—') };
};
