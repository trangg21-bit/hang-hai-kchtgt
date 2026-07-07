import { z } from 'zod';

// ── Create schema ───────────────────────────────────────────────────────

export const createCangCanSchema = z
  .object({
    maCangCan: z.string().min(1, 'Mã cảng cạn không được để trống').max(50, 'Mã cảng cạn tối đa 50 ký tự'),
    tenCangCan: z.string().min(1, 'Tên cảng cạn không được để trống').max(255, 'Tên cảng cạn tối đa 255 ký tự'),
    tinhThanhPho: z.string().max(100, 'Tỉnh/thành phố tối đa 100 ký tự').optional().or(z.literal('')),
    viDo: z.coerce.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').optional(),
    kinhDo: z.coerce.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').optional(),
    dienTich: z.coerce.number().positive('Diện tích phải lớn hơn 0'),
    congSuatTEU: z.coerce.number().optional(),
    trangThaiHoatDong: z.enum(['HIỆN_HÀNH', 'TẠM_NGƯNG']).optional(),
    trangThaiPheDuyet: z.enum(['CHỜ_PHE_DUYỆT', 'ĐƯỢC_PHE_DUYỆT', 'TỪ_CHỐI']).optional().default('CHỜ_PHE_DUYỆT'),
  })
  .refine(
    (data) => (data.viDo === undefined) === (data.kinhDo === undefined),
    {
      message: 'Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau',
      path: ['kinhDo'],
    },
  );

// ── Update schema (partial — id required) ──────────────────────────────

export const updateCangCanSchema = z
  .object({
    id: z.string().uuid('ID không được để trống'),
    maCangCan: z.string().max(50).optional(),
    tenCangCan: z.string().max(255, 'Tên cảng cạn tối đa 255 ký tự').optional(),
    tinhThanhPho: z.string().max(100, 'Tỉnh/thành phố tối đa 100 ký tự').optional(),
    viDo: z.coerce.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').optional(),
    kinhDo: z.coerce.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').optional(),
    dienTich: z.coerce.number().positive('Diện tích phải lớn hơn 0').optional(),
    congSuatTEU: z.coerce.number().optional(),
    trangThaiHoatDong: z.enum(['HIỆN_HÀNH', 'TẠM_NGƯNG']).optional(),
  })
  .refine(
    (data: any) => (data.viDo === undefined || data.viDo === null) === (data.kinhDo === undefined || data.kinhDo === null),
    {
      message: 'Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau',
      path: ['kinhDo'],
    },
  );

// ── List filter schema ──────────────────────────────────────────────────

export const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['HIỆN_HÀNH', 'TẠM_NGƯNG']).optional(),
  approvalStatus: z.enum(['CHỜ_PHE_DUYỆT', 'ĐƯỢC_PHE_DUYỆT', 'TỪ_CHỐI']).optional(),
  orgUnitId: z.string().uuid().optional(),
  sortBy: z.enum(['maCangCan', 'tenCangCan', 'createdAt', 'updatedAt']).default('createdAt'),
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
