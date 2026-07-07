import { z } from "zod";

// ── List filters schema ──────────────────────────────────────────
export const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
  approvalStatus: z.enum(["CHO_PHE_DUYET", "DUOC_PHE_DUYET", "TU_CHOI"]).optional(),
  cangBienId: z.string().uuid().optional().or(z.literal("")),
  orgUnitId: z.string().uuid().optional().or(z.literal("")),
  sortBy: z.enum(["maBen", "tenBen", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListFilters = z.infer<typeof listFiltersSchema>;

// ── Create form schema ───────────────────────────────────────────
export const createSchema = z.object({
  maBen: z.string().min(1, "Mã bến không được để trống").max(50, "Mã bến tối đa 50 ký tự"),
  tenBen: z.string().min(1, "Tên bến không được để trống").max(255, "Tên bến tối đa 255 ký tự"),
  cangBienId: z.string().uuid("Cảng biển chủ không được để trống"),
  tuyenDuongThuy: z.string().max(255, "Tuyến đường thủy tối đa 255 ký tự").optional().or(z.literal("")),
  viDo: z.coerce.number().min(-90, "Vĩ độ phải từ -90 đến 90").max(90, "Vĩ độ phải từ -90 đến 90").optional().or(z.nan()),
  kinhDo: z.coerce.number().min(-180, "Kinh độ phải từ -180 đến 180").max(180, "Kinh độ phải từ -180 đến 180").optional().or(z.nan()),
  chieuDai: z.coerce.number().optional().or(z.nan()),
  chieuRong: z.coerce.number().optional().or(z.nan()),
  loaiBen: z.string().max(100, "Loại bến tối đa 100 ký tự").optional().or(z.literal("")),
  doSauLuong: z.coerce.number().optional().or(z.nan()),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional().default("HIỆN_HÀNH"),
});

export type CreateForm = z.infer<typeof createSchema>;

// ── Update form schema ───────────────────────────────────────────
export const updateSchema = z.object({
  id: z.string().uuid("ID không được để trống"),
  tenBen: z.string().max(255, "Tên bến tối đa 255 ký tự").optional().or(z.literal("")),
  cangBienId: z.string().uuid().optional(),
  tuyenDuongThuy: z.string().max(255, "Tuyến đường thủy tối đa 255 ký tự").optional().or(z.literal("")),
  viDo: z.coerce.number().min(-90, "Vĩ độ phải từ -90 đến 90").max(90, "Vĩ độ phải từ -90 đến 90").optional().or(z.nan()),
  kinhDo: z.coerce.number().min(-180, "Kinh độ phải từ -180 đến 180").max(180, "Kinh độ phải từ -180 đến 180").optional().or(z.nan()),
  chieuDai: z.coerce.number().optional().or(z.nan()),
  chieuRong: z.coerce.number().optional().or(z.nan()),
  loaiBen: z.string().max(100, "Loại bến tối đa 100 ký tự").optional().or(z.literal("")),
  doSauLuong: z.coerce.number().optional().or(z.nan()),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
});

export type UpdateForm = z.infer<typeof updateSchema>;

// ── Approve schema ───────────────────────────────────────────────
export const approveSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: "Bạn cần xác nhận hành động này",
  }),
});

export const rejectSchema = z.object({
  reason: z.string()
    .min(10, "Lý do từ chối tối thiểu 10 ký tự")
    .max(500, "Lý do từ chối tối đa 500 ký tự")
    .min(1, "Lý do từ chối không được để trống"),
  confirmed: z.boolean().refine((val) => val === true, {
    message: "Bạn cần xác nhận hành động này",
  }),
});

export type ApproveForm = z.infer<typeof approveSchema>;
export type RejectForm = z.infer<typeof rejectSchema>;

// ── Delete confirm schema ────────────────────────────────────────
export const deleteSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: "Bạn cần xác nhận để xóa",
  }),
});

export type DeleteForm = z.infer<typeof deleteSchema>;
