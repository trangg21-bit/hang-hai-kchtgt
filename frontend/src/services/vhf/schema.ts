import { z } from 'zod';
import { statusAttention, statusCritical, statusDraft, statusOperational } from '../../themetokenchk';

// ── Form schemas — clone từ services/cctv/schema.ts ────────────────
// Hệ thống thông tin liên lạc VHF

// ── Status enums ────────────────────────────────────────────────────
export const OPERATIONAL_STATUS_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'Chưa khai thác/vận hành', value: 0 },
  { label: 'Đang khai thác/vận hành', value: 1 },
  { label: 'Dừng khai thác/vận hành', value: 2 },
];

export const ATTACHED_INFRA_TYPE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'TTDH VTS', value: 1 },
  { label: 'Trạm radar', value: 2 },
];

export const createSchema = z.object({
  deviceCode: z.string().trim().optional(),
  deviceName: z.string().trim().min(1, 'Tên thiết bị không được để trống'),
  detailedLocation: z.string().trim().optional().nullable(),
  manufacturer: z.string().trim().optional().nullable(),
  model: z.string().trim().optional().nullable(),
  quantity: z.number({ message: 'Số lượng không được để trống' }).min(1, 'Số lượng phải lớn hơn 0'),
  orgUnitId: z.string().trim().optional().nullable(),
  seaportId: z.string().trim().min(1, 'Thuộc cảng biển không được để trống'),
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
// Hỗ trợ cả số (0, 1, 2) và chuỗi enum (NOT_YET_OPERATIONAL, OPERATIONAL, SUSPENDED, ACTIVE, INACTIVE)
export const operationalStatusBadge = (status: number | string | undefined | null): { color: string; label: string } => {
  if (status === undefined || status === null || status === '') {
    return { color: statusDraft, label: '—' };
  }
  const str = String(status).toUpperCase().trim();
  if (str === '0' || str === 'NOT_YET_OPERATIONAL') {
    return { color: statusAttention, label: 'Chưa khai thác/vận hành' };
  }
  if (str === '1' || str === 'OPERATIONAL' || str === 'ACTIVE') {
    return { color: statusOperational, label: 'Đang khai thác/vận hành' };
  }
  if (str === '2' || str === 'SUSPENDED' || str === 'INACTIVE') {
    return { color: statusCritical, label: 'Dừng khai thác/vận hành' };
  }
  return { color: statusDraft, label: String(status) };
};
