import { z } from "zod";

// ── List filters schema ──────────────────────────────────────────
export const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["DANG_KHAI_THAC", "CHUA_KHAI_THAC", "DUNG_KHAI_THAC"]).optional(),
  approvalStatus: z.enum(["NHAP", "CHO_PHE_DUYET", "CHO_PD_CAP_CUC", "DA_PHE_DUYET", "TU_CHOI"]).optional(),
  portId: z.string().uuid().optional().or(z.literal("")),
  orgUnitId: z.string().uuid().optional().or(z.literal("")),
  sortBy: z.enum(["berthCode", "berthName", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListFilters = z.infer<typeof listFiltersSchema>;

// ── Create form schema ───────────────────────────────────────────
export const createSchema = z.object({
  berthName: z.string().min(1, "Tên bến không được để trống").max(255, "Tên bến tối đa 255 ký tự"),
  portId: z.string().uuid("Cảng biển chủ không được để trống"),
  orgUnitId: z.string().uuid().optional().or(z.literal("")),
  saveAction: z.enum(["DRAFT", "SUBMIT", "SAVE_AND_APPROVE"]).optional(),
  tuyenDuongThuy: z.string().max(255, "Tuyến đường thủy tối đa 255 ký tự").optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90, "Vĩ độ phải từ -90 đến 90").max(90, "Vĩ độ phải từ -90 đến 90").optional().or(z.nan()),
  longitude: z.coerce.number().min(-180, "Kinh độ phải từ -180 đến 180").max(180, "Kinh độ phải từ -180 đến 180").optional().or(z.nan()),
  length: z.coerce.number().optional().or(z.nan()),
  width: z.coerce.number().optional().or(z.nan()),
  berthType: z.string().max(100, "Loại bến tối đa 100 ký tự").optional().or(z.literal("")),
  doSauLuong: z.coerce.number().optional().or(z.nan()),
  operationalCapacity: z.string().optional().or(z.literal("")),
  operationalStatus: z.enum(["DANG_KHAI_THAC", "CHUA_KHAI_THAC", "DUNG_KHAI_THAC"]).optional(),
  bieuTuongId: z.string().uuid().optional().or(z.literal("")),
  loaiHinhHoc: z.string().optional(),
  toaDo: z.string().optional(),
  // Extended fields
  location: z.string().max(100, "Địa điểm tối đa 100 ký tự").optional().or(z.literal("")),
  diaDiemChiTiet: z.string().max(500, "Địa điểm chi tiết tối đa 500 ký tự").optional().or(z.literal("")),
  heQuyChieu: z.coerce.number().int().optional().or(z.nan()),
  quyTacHienThi: z.coerce.number().int().optional().or(z.nan()),
  donViKhaiThac: z.string().max(255, "Đơn vị khai thác tối đa 255 ký tự").optional().or(z.literal("")),
  tongDienTich: z.coerce.number().optional().or(z.nan()),
  nangLucThongQuaThietKe: z.coerce.number().optional().or(z.nan()),
  nangLucThongQuaHienTrang: z.coerce.number().optional().or(z.nan()),
  coTauTiepNhanLonNhat: z.coerce.number().optional().or(z.nan()),
  quyHoachNangLucThongQua: z.coerce.number().optional().or(z.nan()),
  sanLuongHangHoaNamGanNhat: z.coerce.number().optional().or(z.nan()),
  thoiDiemCongBoMo: z.string().optional().or(z.literal("")),
  quyetDinhCongBo: z.string().max(500, "Quyết định công bố tối đa 500 ký tự").optional().or(z.literal("")),
  vanBanThoaThuanDauTu: z.string().max(2000, "Văn bản thỏa thuận đầu tư tối đa 2000 ký tự").optional().or(z.literal("")),
  structureType: z.coerce.number().int().optional().or(z.nan()),
});

export type CreateForm = z.infer<typeof createSchema>;

// ── Update form schema ───────────────────────────────────────────
export const updateSchema = z.object({
  id: z.string().uuid("ID không được để trống"),
  berthName: z.string().max(255, "Tên bến tối đa 255 ký tự").optional().or(z.literal("")),
  portId: z.string().uuid().optional(),
  orgUnitId: z.string().uuid().optional().or(z.literal("")),
  saveAction: z.enum(["DRAFT", "SUBMIT", "SAVE_AND_APPROVE"]).optional(),
  tuyenDuongThuy: z.string().max(255, "Tuyến đường thủy tối đa 255 ký tự").optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90, "Vĩ độ phải từ -90 đến 90").max(90, "Vĩ độ phải từ -90 đến 90").optional().or(z.nan()),
  longitude: z.coerce.number().min(-180, "Kinh độ phải từ -180 đến 180").max(180, "Kinh độ phải từ -180 đến 180").optional().or(z.nan()),
  length: z.coerce.number().optional().or(z.nan()),
  width: z.coerce.number().optional().or(z.nan()),
  berthType: z.string().max(100, "Loại bến tối đa 100 ký tự").optional().or(z.literal("")),
  doSauLuong: z.coerce.number().optional().or(z.nan()),
  operationalCapacity: z.string().optional().or(z.literal("")),
  operationalStatus: z.enum(["DANG_KHAI_THAC", "CHUA_KHAI_THAC", "DUNG_KHAI_THAC"]).optional(),
  bieuTuongId: z.string().uuid().optional().nullable(),
  loaiHinhHoc: z.string().optional(),
  toaDo: z.string().optional(),
  // Extended fields
  location: z.string().max(100, "Địa điểm tối đa 100 ký tự").optional().or(z.literal("")),
  diaDiemChiTiet: z.string().max(500, "Địa điểm chi tiết tối đa 500 ký tự").optional().or(z.literal("")),
  heQuyChieu: z.coerce.number().int().optional().or(z.nan()),
  quyTacHienThi: z.coerce.number().int().optional().or(z.nan()),
  donViKhaiThac: z.string().max(255, "Đơn vị khai thác tối đa 255 ký tự").optional().or(z.literal("")),
  tongDienTich: z.coerce.number().optional().or(z.nan()),
  nangLucThongQuaThietKe: z.coerce.number().optional().or(z.nan()),
  nangLucThongQuaHienTrang: z.coerce.number().optional().or(z.nan()),
  coTauTiepNhanLonNhat: z.coerce.number().optional().or(z.nan()),
  quyHoachNangLucThongQua: z.coerce.number().optional().or(z.nan()),
  sanLuongHangHoaNamGanNhat: z.coerce.number().optional().or(z.nan()),
  thoiDiemCongBoMo: z.string().optional().or(z.literal("")),
  quyetDinhCongBo: z.string().max(500, "Quyết định công bố tối đa 500 ký tự").optional().or(z.literal("")),
  vanBanThoaThuanDauTu: z.string().max(2000, "Văn bản thỏa thuận đầu tư tối đa 2000 ký tự").optional().or(z.literal("")),
  structureType: z.coerce.number().int().optional().or(z.nan()),
});

export type UpdateForm = z.infer<typeof updateSchema>;

// ── Approve schema ───────────────────────────────────────────────
export const approveSchema = z.object({
  cap: z.enum(["CANG_VU", "CUC"], { required_error: "Vui lòng chọn cấp phê duyệt" }),
  confirmed: z.boolean().refine((val) => val === true, {
    message: "Bạn cần xác nhận hành động này",
  }),
});

export type ApproveForm = z.infer<typeof approveSchema>;

// ── Reject schema ────────────────────────────────────────────────
export const rejectSchema = z.object({
  cap: z.enum(["CANG_VU", "CUC"], { required_error: "Vui lòng chọn cấp" }),
  lyDo: z.string()
    .min(10, "Lý do từ chối tối thiểu 10 ký tự")
    .max(500, "Lý do từ chối tối đa 500 ký tự"),
  confirmed: z.boolean().refine((val) => val === true, {
    message: "Bạn cần xác nhận hành động này",
  }),
});

export type RejectForm = z.infer<typeof rejectSchema>;

// ── Delete confirm schema ────────────────────────────────────────
export const deleteSchema = z.object({
  confirmationText: z.string().refine((val) => val === "XÓA", {
    message: 'Vui lòng nhập "XÓA" để xác nhận',
  }),
});
