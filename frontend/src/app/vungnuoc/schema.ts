// ── VungNuoc Zod schemas ─────────────────────────────────────────────

import { z } from 'zod';

// ── Create schema ─────────────────────────────────────────────────────

export const vungNuocCreateSchema = z.object({
  maVungNuoc: z
    .string()
    .min(1, 'Mã vùng nước không được để trống')
    .max(50, 'Mã vùng nước tối đa 50 ký tự'),
  tenVungNuoc: z
    .string()
    .min(1, 'Tên vùng nước không được để trống')
    .max(255, 'Tên vùng nước tối đa 255 ký tự'),
  cangBienId: z.string().uuid('Cảng biển chủ phải là UUID hợp lệ'),
  dienTich: z.coerce.number().optional().nullable(),
  doSauMax: z.coerce.number().optional().nullable(),
  doSauTrungBinh: z.coerce.number().optional().nullable(),
  loaiVungNuoc: z.string().max(100, 'Loại vùng nước tối đa 100 ký tự').optional().nullable(),
  trangThaiHoatDong: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional().default('HIEN_HANH'),
});

export type VungNuocCreateValues = z.infer<typeof vungNuocCreateSchema>;

// ── Update schema ─────────────────────────────────────────────────────

export const vungNuocUpdateSchema = z.object({
  id: z.string().uuid('ID không được để trống'),
  tenVungNuoc: z
    .string()
    .max(255, 'Tên vùng nước tối đa 255 ký tự')
    .optional()
    .nullable(),
  cangBienId: z.string().uuid('Cảng biển chủ phải là UUID hợp lệ').optional().nullable(),
  dienTich: z.coerce.number().optional().nullable(),
  doSauMax: z.coerce.number().optional().nullable(),
  doSauTrungBinh: z.coerce.number().optional().nullable(),
  loaiVungNuoc: z.string().max(100, 'Loại vùng nước tối đa 100 ký tự').optional().nullable(),
  trangThaiHoatDong: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
});

export type VungNuocUpdateValues = z.infer<typeof vungNuocUpdateSchema>;

// ── Reject schema (for approve page) ──────────────────────────────────

export const rejectSchema = z.object({
  reason: z
    .string()
    .min(10, 'Lý do từ chối tối thiểu 10 ký tự')
    .max(500, 'Lý do từ chối tối đa 500 ký tự'),
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần xác nhận hành động này',
  }),
});

export type RejectValues = z.infer<typeof rejectSchema>;

// ── Approve confirm schema ────────────────────────────────────────────

export const approveConfirmSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần xác nhận hành động này',
  }),
});

export type ApproveConfirmValues = z.infer<typeof approveConfirmSchema>;

// ── Delete confirm schema ─────────────────────────────────────────────

export const deleteConfirmSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần xác nhận để xóa',
  }),
});

export type DeleteConfirmValues = z.infer<typeof deleteConfirmSchema>;

// ── List filters schema ───────────────────────────────────────────────

export const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
  approvalStatus: z.enum(['CHO_PHE_DUYET', 'DUOC_PHE_DUYET', 'TU_CHOI']).optional(),
  cangBienId: z.string().uuid().optional(),
  sortBy: z.enum(['maVungNuoc', 'tenVungNuoc', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListFilters = z.infer<typeof listFiltersSchema>;
