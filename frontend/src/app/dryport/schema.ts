import { z } from 'zod';

// ── Create schema ───────────────────────────────────────────────────────

export const createCangCanSchema = z
  .object({
    dryPortCode: z.string().min(1, 'Mã cảng cạn không được để trống').max(50, 'Mã cảng cạn tối đa 50 ký tự'),
    dryPortName: z.string().min(1, 'Tên cảng cạn không được để trống').max(255, 'Tên cảng cạn tối đa 255 ký tự'),
    province: z.string().max(100, 'Tỉnh/thành phố tối đa 100 ký tự').optional().or(z.literal('')),
    latitude: z.coerce.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').optional(),
    longitude: z.coerce.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').optional(),
    area: z.coerce.number().optional(),
    congSuatTEU: z.coerce.number().optional(),
    operationalStatus: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
    approvalStatus: z.enum(['CHO_PHE_DUYET', 'DUOC_PHE_DUYET', 'TU_CHOI']).optional().default('CHO_PHE_DUYET'),
    bieuTuongId: z.string().uuid().optional().or(z.literal('')),
    loaiHinhHoc: z.string().optional(),
    toaDo: z.string().optional(),
  })
  .refine(
    (data) => (data.latitude === undefined) === (data.longitude === undefined),
    {
      message: 'Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau',
      path: ['longitude'],
    },
  );

// ── Update schema (partial — id required) ──────────────────────────────

export const updateCangCanSchema = z
  .object({
    id: z.string().uuid('ID không được để trống'),
    dryPortCode: z.string().max(50).optional(),
    dryPortName: z.string().max(255, 'Tên cảng cạn tối đa 255 ký tự').optional(),
    province: z.string().max(100, 'Tỉnh/thành phố tối đa 100 ký tự').optional(),
    latitude: z.coerce.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').optional(),
    longitude: z.coerce.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').optional(),
    area: z.coerce.number().optional(),
    congSuatTEU: z.coerce.number().optional(),
    operationalStatus: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
    bieuTuongId: z.string().uuid().optional().nullable(),
    loaiHinhHoc: z.string().optional(),
    toaDo: z.string().optional(),
  })
  .refine(
    (data: any) => (data.latitude === undefined || data.latitude === null) === (data.longitude === undefined || data.longitude === null),
    {
      message: 'Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau',
      path: ['longitude'],
    },
  );

// ── List filter schema ──────────────────────────────────────────────────

export const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
  approvalStatus: z.enum(['CHO_PHE_DUYET', 'DUOC_PHE_DUYET', 'TU_CHOI']).optional(),
  orgUnitId: z.string().uuid().optional(),
  sortBy: z.enum(['dryPortCode', 'dryPortName', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Approve / Reject schemas ────────────────────────────────────────────

export const approveSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần xác nhận hành động này',
  }),
});

export const rejectSchema = z.object({
  reason: z.string()
    .min(10, 'Lý do từ chối tối thiểu 10 ký tự')
    .max(500, 'Lý do từ chối tối đa 500 ký tự')
    .min(1, 'Lý do từ chối không được để trống'),
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần xác nhận hành động này',
  }),
});

// ── Delete schema ───────────────────────────────────────────────────────

export const deleteSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'Bạn cần xác nhận để xóa',
  }),
});

// ── Infer types from Zod schemas ────────────────────────────────────────

export type CreateCangCanForm = z.infer<typeof createCangCanSchema>;
export type UpdateCangCanForm = z.infer<typeof updateCangCanSchema>;
export type ListFilters = z.infer<typeof listFiltersSchema>;
export type ApproveForm = z.infer<typeof approveSchema>;
export type RejectForm = z.infer<typeof rejectSchema>;
export type DeleteForm = z.infer<typeof deleteSchema>;
