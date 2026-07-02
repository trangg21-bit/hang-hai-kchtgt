import { z } from 'zod';

// ── CangBien status enums (match BE CangBienStatus / ApprovalStatus) ─

export const TRANG_THAI_HOAT_DONG_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Hiện hành', value: 'HIEN_HANH' },
  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
];

export const TRANG_THAI_PHE_DUYET_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' },
  { label: 'Được phê duyệt', value: 'DUOC_PHE_DUYET' },
  { label: 'Từ chối', value: 'TU_CHOI' },
];

export type TrangThaiHoatDong = (typeof TRANG_THAI_HOAT_DONG_OPTIONS[number])['value'];
export type TrangThaiPheDuyet = (typeof TRANG_THAI_PHE_DUYET_OPTIONS[number])['value'];

// ── List filter schema ─

export const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
  approvalStatus: z.enum(['CHO_PHE_DUYET', 'DUOC_PHE_DUYET', 'TU_CHOI']).optional(),
  sortBy: z.enum(['maCang', 'tenCang', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListFilters = z.infer<typeof listFiltersSchema>;

// ── Create schema (matches CreateCangBienRequest) ─

export const createSchema = z.object({
  maCang: z
    .string()
    .min(1, 'Mã cảng không được để trống')
    .max(50, 'Mã cảng tối đa 50 ký tự'),
  tenCang: z
    .string()
    .min(1, 'Tên cảng không được để trống')
    .max(255, 'Tên cảng tối đa 255 ký tự'),
  tinhThanhPho: z.string().max(100, 'Tỉnh/thành phố tối đa 100 ký tự').optional().or(z.literal('')),
  viDo: z.coerce.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').optional().or(z.nan()),
  kinhDo: z.coerce.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').optional().or(z.nan()),
  dienTich: z.coerce.number().positive('Diện tích phải lớn hơn 0'),
  khaNangTiepNhan: z.coerce.number().optional().or(z.nan()),
  trangThaiHoatDong: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
  trangThaiPheDuyet: z.enum(['CHO_PHE_DUYET', 'DUOC_PHE_DUYET', 'TU_CHOI']).default('CHO_PHE_DUYET'),
}).refine(
  (data) => (data.viDo === undefined || Number.isNaN(data.viDo)) === (data.kinhDo === undefined || Number.isNaN(data.kinhDo)),
  {
    message: 'Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau',
    path: ['kinhDo'],
  },
);

export type CreateFormValues = z.infer<typeof createSchema>;

// ── Update schema (matches UpdateCangBienRequest) ─

export const updateSchema = z.object({
  id: z.string().uuid('ID không hợp lệ'),
  maCang: z.string(), // readonly, carried through
  tenCang: z.string().max(255, 'Tên cảng tối đa 255 ký tự').optional().or(z.literal('')),
  tinhThanhPho: z.string().max(100, 'Tỉnh/thành phố tối đa 100 ký tự').optional().or(z.literal('')),
  viDo: z.coerce.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').optional().or(z.nan()),
  kinhDo: z.coerce.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').optional().or(z.nan()),
  dienTich: z.coerce.number().positive('Diện tích phải lớn hơn 0').optional().or(z.nan()),
  khaNangTiepNhan: z.coerce.number().optional().or(z.nan()),
  trangThaiHoatDong: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
}).refine(
  (data) => (data.viDo === undefined || Number.isNaN(data.viDo)) === (data.kinhDo === undefined || Number.isNaN(data.kinhDo)),
  {
    message: 'Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau',
    path: ['kinhDo'],
  },
);

export type UpdateFormValues = z.infer<typeof updateSchema>;

// ── Approval / Reject schemas ─

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

// ── Delete confirm schema ─

export const deleteConfirmSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, { message: 'Bạn cần xác nhận để xóa' }),
});

export type DeleteFormValues = z.infer<typeof deleteConfirmSchema>;

// ── Badge / colour helpers ─

export const trangThaiHoatDongBadge = (status: string): { color: string; label: string } => {
  switch (status) {
    case 'HIEN_HANH':
      return { color: 'green', label: 'Hiện hành' };
    case 'TAM_NGUNG':
      return { color: 'orange', label: 'Tạm ngừng' };
    default:
      return { color: 'default', label: status };
  }
};

export const trangThaiPheDuyetBadge = (status: string): { color: string; label: string } => {
  switch (status) {
    case 'CHO_PHE_DUYET':
      return { color: 'orange', label: 'Chờ phê duyệt' };
    case 'DUOC_PHE_DUYET':
      return { color: 'green', label: 'Được phê duyệt' };
    case 'TU_CHOI':
      return { color: 'red', label: 'Từ chối' };
    default:
      return { color: 'default', label: status };
  }
};
