import { z } from 'zod';

// ── Create Schema ──────────────────────────────────────────────────────────
export const cauCangCreateSchema = z.object({
  pierCode: z.string().min(1, 'Mã cầu không được để trống').max(50, 'Mã cầu tối đa 50 ký tự'),
  pierName: z.string().min(1, 'Tên cầu không được để trống').max(255, 'Tên cầu tối đa 255 ký tự'),
  berthId: z.string().uuid('Bến cảng chủ không được để trống'),
  portId: z.string().uuid().optional().or(z.literal('')),
  navigationChannelId: z.string().uuid().optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  detailedLocation: z.string().max(500, 'Địa điểm chi tiết tối đa 500 ký tự').optional().or(z.literal('')),
  constructionGrade: z.coerce.number().int().min(1).optional().or(z.literal('')),
  pierType: z.string().optional().or(z.literal('')),
  operationalFunction: z.string().optional().or(z.literal('')),
  conditionStatus: z.coerce.number().int().min(1).optional().or(z.literal('')),
  length: z.coerce.number().min(0, 'Chiều dài phải ≥ 0').optional().or(z.literal('')),
  width: z.coerce.number().min(0, 'Chiều rộng phải ≥ 0').optional().or(z.literal('')),
  taiTrong: z.coerce.number().min(0, 'Tải trọng phải ≥ 0').optional().or(z.literal('')),
  currentWaterDepth: z.string().max(20).optional().or(z.literal('')),
  designBedElevation: z.string().max(20).optional().or(z.literal('')),
  publishedVesselDWT: z.string().max(20).optional().or(z.literal('')),
  maintenanceApprovalDate: z.string().optional().or(z.literal('')),
  safetyAssessmentDate: z.string().optional().or(z.literal('')),
  lastInspectionDate: z.string().optional().or(z.literal('')),
  operatingPierCount: z.coerce.number().int().min(0).max(99999).optional().or(z.literal('')),
  publishedPierCount: z.coerce.number().int().min(0).max(99999).optional().or(z.literal('')),
  investmentAgreementPierCount: z.coerce.number().int().min(0).max(99999).optional().or(z.literal('')),
  cargoThroughput: z.coerce.number().min(0).optional().or(z.literal('')),
  receivesLargeVessel: z.union([z.boolean(), z.string()]).optional(),
  documentNumber: z.string().optional().or(z.literal('')),
  documentDate: z.string().optional().or(z.literal('')),
  openingAnnouncementDate: z.string().optional().or(z.literal('')),
  openingDecision: z.string().max(200, 'Quyết định công bố tối đa 200 ký tự').optional().or(z.literal('')),
  investmentAgreementDoc: z.string().max(2000, 'Văn bản thỏa thuận tối đa 2000 ký tự').optional().or(z.literal('')),
  operationalStatus: z.enum(['OPERATIONAL', 'SUSPENDED']).optional().default('OPERATIONAL'),
  bieuTuongId: z.string().optional().or(z.literal('')),
  loaiHinhHoc: z.string().optional(),
  toaDo: z.string().optional(),
});

export type CauCangCreateForm = z.infer<typeof cauCangCreateSchema>;

// ── Update Schema ──────────────────────────────────────────────────────────
export const cauCangUpdateSchema = z.object({
  id: z.string().uuid('ID không hợp lệ'),
  pierName: z.string().max(255, 'Tên cầu tối đa 255 ký tự').optional().or(z.literal('')),
  portId: z.string().uuid().optional().or(z.literal('')),
  berthId: z.string().uuid('ID bến cảng chủ không hợp lệ').optional(),
  navigationChannelId: z.string().uuid().optional().or(z.literal('')),
  length: z.coerce.number().min(0, 'Chiều dài phải ≥ 0').optional().or(z.literal('')),
  width: z.coerce.number().min(0, 'Chiều rộng phải ≥ 0').optional().or(z.literal('')),
  taiTrong: z.coerce.number().min(0, 'Tải trọng phải ≥ 0').optional().or(z.literal('')),
  loaiCau: z.enum(['CONTAINER', 'TONG_HOP', 'HANH_KHACH', 'CHUYEN_DUNG_XANG_DAU', 'CHUYEN_DUNG_ROI_QUANG', 'KHAC']).optional().or(z.literal('')),
  pierType: z.string().optional().or(z.literal('')),
  operationalCapacity: z.string().optional().or(z.literal('')),
  operationalFunction: z.string().optional().or(z.literal('')),
  operationalStatus: z.enum(['OPERATIONAL', 'SUSPENDED']).optional(),
  province: z.string().optional().or(z.literal('')),
  detailedLocation: z.string().max(500).optional().or(z.literal('')),
  constructionGrade: z.coerce.number().int().min(1).optional().or(z.literal('')),
  conditionStatus: z.coerce.number().int().min(1).optional().or(z.literal('')),
  currentWaterDepth: z.string().max(20).optional().or(z.literal('')),
  designBedElevation: z.string().max(20).optional().or(z.literal('')),
  publishedVesselDWT: z.string().max(20).optional().or(z.literal('')),
  maintenanceApprovalDate: z.string().optional().or(z.literal('')),
  safetyAssessmentDate: z.string().optional().or(z.literal('')),
  lastInspectionDate: z.string().optional().or(z.literal('')),
  operatingPierCount: z.coerce.number().int().min(0).max(99999).optional().or(z.literal('')),
  publishedPierCount: z.coerce.number().int().min(0).max(99999).optional().or(z.literal('')),
  investmentAgreementPierCount: z.coerce.number().int().min(0).max(99999).optional().or(z.literal('')),
  cargoThroughput: z.coerce.number().min(0).optional().or(z.literal('')),
  receivesLargeVessel: z.union([z.boolean(), z.string()]).optional(),
  documentNumber: z.string().optional().or(z.literal('')),
  documentDate: z.string().optional().or(z.literal('')),
  openingAnnouncementDate: z.string().optional().or(z.literal('')),
  openingDecision: z.string().max(200).optional().or(z.literal('')),
  investmentAgreementDoc: z.string().max(2000).optional().or(z.literal('')),
  bieuTuongId: z.string().optional().nullable(),
  loaiHinhHoc: z.string().optional(),
  toaDo: z.string().optional(),
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
  status: z.enum(['OPERATIONAL', 'SUSPENDED']).optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  berthId: z.string().uuid('ID bến cảng không hợp lệ').optional(),
  orgUnitId: z.string().uuid('ID tổ chức không hợp lệ').optional(),
  sortBy: z.enum(['pierCode', 'pierName', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CauCangListFilters = z.infer<typeof cauCangListFiltersSchema>;
