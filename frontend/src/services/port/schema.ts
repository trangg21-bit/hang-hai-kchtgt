import { z } from 'zod';

// ── Port status enums (match BE CangBienStatus / ApprovalStatus) ─

export const TRANG_THAI_HOAT_DONG_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Hiện hành', value: 'HIEN_HANH' },
  { label: 'Tạm ngừng', value: 'TAM_NGUNG' },
];

export const TRANG_THAI_PHE_DUYET_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Chờ phê duyệt', value: 'CHO_PHE_DUYET' },
  { label: 'Được phê duyệt', value: 'DUOC_PHE_DUYET' },
  { label: 'Từ chối', value: 'TU_CHOI' },
];

export type operationalStatus = (typeof TRANG_THAI_HOAT_DONG_OPTIONS[number])['value'];
export type approvalStatus = (typeof TRANG_THAI_PHE_DUYET_OPTIONS[number])['value'];

// ── List filter schema ─

export const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
  approvalStatus: z.enum(['CHO_PHE_DUYET', 'DUOC_PHE_DUYET', 'TU_CHOI']).optional(),
  sortBy: z.enum(['portCode', 'portName', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListFilters = z.infer<typeof listFiltersSchema>;

// ── Create schema (matches CreateCangBienRequest) ─

export const createSchema = z.object({
  portCode: z
    .string()
    .min(1, 'Mã cảng không được để trống')
    .max(50, 'Mã cảng tối đa 50 ký tự'),
  portName: z
    .string()
    .min(1, 'Tên cảng không được để trống')
    .max(255, 'Tên cảng tối đa 255 ký tự'),
  province: z.string().max(100, 'Tỉnh/thành phố tối đa 100 ký tự').optional().or(z.literal('')),
  latitude: z.coerce.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').optional().or(z.nan()),
  longitude: z.coerce.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').optional().or(z.nan()),
  area: z.coerce.number().positive('Diện tích phải lớn hơn 0'),
  khaNangTiepNhan: z.coerce.number().optional().or(z.nan()),
  operationalStatus: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
  approvalStatus: z.enum(['CHO_PHE_DUYET', 'DUOC_PHE_DUYET', 'TU_CHOI']).default('CHO_PHE_DUYET'),
  orgUnitId: z.string().uuid().optional().or(z.literal('')),
  portGroup: z.coerce.number().int().optional().or(z.nan()),
  bieuTuongId: z.string().uuid().optional().or(z.literal('')),
  loaiHinhHoc: z.string().optional(),
  toaDo: z.string().optional(),
  // Extended fields (V53)
  diaDiemChiTiet: z.string().max(500, 'Địa điểm chi tiết tối đa 500 ký tự').optional().or(z.literal('')),
  phanCap: z.coerce.number().int().optional().or(z.nan()),
  heQuyChieu: z.coerce.number().int().optional().or(z.nan()),
  quyTacHienThi: z.coerce.number().int().optional().or(z.nan()),
  // zobjDataSub fields
  phamViVungNuoc: z.string().max(2000, 'Phạm vi vùng nước tối đa 2000 ký tự').optional().or(z.literal('')),
  tongSoBenCang: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongSoKhuNeoDauChuyenTai: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongSoTuyenLuongCongCong: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongSoTuyenLuongChuyenDung: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongChieuDaiLuongCongCong: z.coerce.number().min(0).optional().or(z.nan()),
  tongChieuDaiLuongChuyenDung: z.coerce.number().min(0).optional().or(z.nan()),
  tongSoPhaoTieuBaoHieu: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongSoDeKe: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongChieuDaiDeKe: z.coerce.number().min(0).optional().or(z.nan()),
  tongSoDenBienDangTieu: z.coerce.number().int().min(0).optional().or(z.nan()),
  quantityBenPhao: z.coerce.number().int().min(0).optional().or(z.nan()),
  quantityKhuNeoDau: z.coerce.number().int().min(0).optional().or(z.nan()),
  quantityKhuChuyenTai: z.coerce.number().int().min(0).optional().or(z.nan()),
  cacKhuNuocKhac: z.string().max(2000, 'Các khu nước khác tối đa 2000 ký tự').optional().or(z.literal('')),
  remarks: z.string().max(2000, 'Ghi chú tối đa 2000 ký tự').optional().or(z.literal('')),
}).refine(
  (data) => (data.latitude === undefined || Number.isNaN(data.latitude)) === (data.longitude === undefined || Number.isNaN(data.longitude)),
  {
    message: 'Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau',
    path: ['longitude'],
  },
);

export type CreateFormValues = z.infer<typeof createSchema>;

// ── Update schema (matches UpdateCangBienRequest) ─

export const updateSchema = z.object({
  id: z.string().uuid('ID không hợp lệ'),
  portCode: z.string(), // readonly, carried through
  portName: z.string().max(255, 'Tên cảng tối đa 255 ký tự').optional().or(z.literal('')),
  province: z.string().max(100, 'Tỉnh/thành phố tối đa 100 ký tự').optional().or(z.literal('')),
  latitude: z.coerce.number().min(-90, 'Vĩ độ phải từ -90 đến 90').max(90, 'Vĩ độ phải từ -90 đến 90').optional().or(z.nan()),
  longitude: z.coerce.number().min(-180, 'Kinh độ phải từ -180 đến 180').max(180, 'Kinh độ phải từ -180 đến 180').optional().or(z.nan()),
  area: z.coerce.number().positive('Diện tích phải lớn hơn 0').optional().or(z.nan()),
  khaNangTiepNhan: z.coerce.number().optional().or(z.nan()),
  operationalStatus: z.enum(['HIEN_HANH', 'TAM_NGUNG']).optional(),
  orgUnitId: z.string().uuid().optional().nullable(),
  portGroup: z.coerce.number().int().optional().or(z.nan()),
  bieuTuongId: z.string().uuid().optional().nullable(),
  loaiHinhHoc: z.string().optional(),
  toaDo: z.string().optional(),
  // Extended fields (V53)
  diaDiemChiTiet: z.string().max(500, 'Địa điểm chi tiết tối đa 500 ký tự').optional().nullable(),
  phanCap: z.coerce.number().int().optional().or(z.nan()),
  heQuyChieu: z.coerce.number().int().optional().or(z.nan()),
  quyTacHienThi: z.coerce.number().int().optional().or(z.nan()),
  // zobjDataSub fields
  phamViVungNuoc: z.string().max(2000, 'Phạm vi vùng nước tối đa 2000 ký tự').optional().nullable(),
  tongSoBenCang: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongSoKhuNeoDauChuyenTai: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongSoTuyenLuongCongCong: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongSoTuyenLuongChuyenDung: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongChieuDaiLuongCongCong: z.coerce.number().min(0).optional().or(z.nan()),
  tongChieuDaiLuongChuyenDung: z.coerce.number().min(0).optional().or(z.nan()),
  tongSoPhaoTieuBaoHieu: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongSoDeKe: z.coerce.number().int().min(0).optional().or(z.nan()),
  tongChieuDaiDeKe: z.coerce.number().min(0).optional().or(z.nan()),
  tongSoDenBienDangTieu: z.coerce.number().int().min(0).optional().or(z.nan()),
  quantityBenPhao: z.coerce.number().int().min(0).optional().or(z.nan()),
  quantityKhuNeoDau: z.coerce.number().int().min(0).optional().or(z.nan()),
  quantityKhuChuyenTai: z.coerce.number().int().min(0).optional().or(z.nan()),
  cacKhuNuocKhac: z.string().max(2000, 'Các khu nước khác tối đa 2000 ký tự').optional().nullable(),
  remarks: z.string().max(2000, 'Ghi chú tối đa 2000 ký tự').optional().nullable(),
}).refine(
  (data) => (data.latitude === undefined || Number.isNaN(data.latitude)) === (data.longitude === undefined || Number.isNaN(data.longitude)),
  {
    message: 'Vĩ độ và kinh độ phải được cung cấp cùng nhau hoặc để trống cùng nhau',
    path: ['longitude'],
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
  const norm = String(status || '').normalize('NFC').toUpperCase().trim();
  if (
    norm === 'HIEN_HANH' ||
    norm === 'HIỆN_HÀNH'.normalize('NFC').toUpperCase() ||
    norm === 'ACTIVE' ||
    norm === 'RUNNING'
  ) {
    return { color: 'green', label: 'Hiện hành' };
  }
  if (
    norm === 'TAM_NGUNG' ||
    norm === 'TẠM_NGỪNG'.normalize('NFC').toUpperCase() ||
    norm === 'INACTIVE' ||
    norm === 'STOPPED'
  ) {
    return { color: 'orange', label: 'Tạm ngừng' };
  }
  return { color: 'default', label: status };
};

export const trangThaiPheDuyetBadge = (status: string): { color: string; label: string } => {
  const norm = String(status || '').normalize('NFC').toUpperCase().trim();
  if (
    norm === 'CHO_PHE_DUYET' ||
    norm === 'PENDING' ||
    norm === 'CHỜ_PHÊ_DUYỆT'.normalize('NFC').toUpperCase()
  ) {
    return { color: 'orange', label: 'Chờ phê duyệt' };
  }
  if (
    norm === 'DUOC_PHE_DUYET' ||
    norm === 'APPROVED' ||
    norm === 'ĐƯỢC_PHÊ_DUYỆT'.normalize('NFC').toUpperCase()
  ) {
    return { color: 'green', label: 'Được phê duyệt' };
  }
  if (
    norm === 'TU_CHOI' ||
    norm === 'REJECTED' ||
    norm === 'TỪ_CHỐI'.normalize('NFC').toUpperCase()
  ) {
    return { color: 'red', label: 'Từ chối' };
  }
  return { color: 'default', label: status };
};
