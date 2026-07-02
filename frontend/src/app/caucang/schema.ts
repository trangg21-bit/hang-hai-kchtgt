import { z } from 'zod';

// ── Create Schema ──────────────────────────────────────────────────────────
export const cauCangCreateSchema = z.object({
  maCau: z.string().min(1, 'Mã cầu không được để trống').max(50, 'Mã cầu tối đa 50 ký tự'),
  tenCau: z.string().min(1, 'Tên cầu không được để trống').max(255, 'Tên cầu tối đa 255 ký tự'),
  benCangId: z.string().uuid('Bến cảng chủ không được để trống'),
  chieuDai: z.coerce.number().min(0, 'Chiều dài phải ≥ 0').optional().or(z.literal('')),
  taiTrong: z.coerce.number().min(0, 'Tải trọng phải ≥ 0').optional().or(z.literal('')),
  loaiCau: z.string().max(100, 'Loại cầu tối đa 100 ký tự').optional().or(z.literal('')),
  trangThaiHoatDong: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional().default('HIEN_HANH'),
});

export type CauCangCreateForm = z.infer<typeof cauCangCreateSchema>;

// ── Update Schema ──────────────────────────────────────────────────────────
export const cauCangUpdateSchema = z.object({
  id: z.string().uuid('ID không hợp lệ'),
  tenCau: z.string().max(255, 'Tên cầu tối đa 255 ký tự').optional().or(z.literal('')),
  benCangId: z.string().uuid('ID bến cảng chủ không hợp lệ').optional(),
  chieuDai: z.coerce.number().min(0, 'Chiều dài phải ≥ 0').optional().or(z.literal('')),
  taiTrong: z.coerce.number().min(0, 'Tải trọng phải ≥ 0').optional().or(z.literal('')),
  loaiCau: z.string().max(100, 'Loại cầu tối đa 100 ký tự').optional().or(z.literal('')),
  trangThaiHoatDong: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
});

export type CauCangUpdateForm = z.infer<typeof cauCangUpdateSchema>;

// ── Approval Schema ────────────────────────────────────────────────────────
export const cauCangApproveSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần xác nhận hành động này',
  }),
});

export type CauCangApproveForm = z.infer<typeof cauCangApproveSchema>;

export const cauCangRejectSchema = z.object({
  reason: z.string()
    .min(10, 'Lý do từ chối tối thiểu 10 ký tự')
    .max(500, 'Lý do từ chối tối đa 500 ký tự'),
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần xác nhận hành động này',
  }),
});

export type CauCangRejectForm = z.infer<typeof cauCangRejectSchema>;

// ── Delete Schema ──────────────────────────────────────────────────────────
export const cauCangDeleteSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần xác nhận để xóa',
  }),
});

export type CauCangDeleteForm = z.infer<typeof cauCangDeleteSchema>;

// ── List Filters Schema ────────────────────────────────────────────────────
export const cauCangListFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
  approvalStatus: z.enum(['CHO_PHE_DUYET', 'DUOC_PHE_DUYET', 'TU_CHOI']).optional(),
  benCangId: z.string().uuid('ID bến cảng không hợp lệ').optional(),
  orgUnitId: z.string().uuid('ID tổ chức không hợp lệ').optional(),
  sortBy: z.enum(['maCau', 'tenCau', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CauCangListFilters = z.infer<typeof cauCangListFiltersSchema>;
