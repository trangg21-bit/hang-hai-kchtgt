/**
 * Danh mục và hằng số chuẩn cho các ô Dropdown quản lý tài sản KCHT Hàng hải
 */

// 1. Tình trạng tài sản
export const AssetCondition = {
  DANG_SU_DUNG: 'Đang sử dụng',
  HONG_KHONG_SU_DUNG: 'Hỏng không sử dụng',
} as const;

export type AssetCondition = (typeof AssetCondition)[keyof typeof AssetCondition];

export const ASSET_CONDITION_OPTIONS = Object.values(AssetCondition).map((v) => ({
  value: v,
  label: v,
}));

// 2. Hiện trạng sử dụng
export const UsageStatus = {
  QUAN_LY_NHA_NUOC: 'Quản lý nhà nước',
  HDSN_KHONG_KINH_DOANH: 'Hoạt động sự nghiệp: Không kinh doanh',
  HDSN_KINH_DOANH: 'Hoạt động sự nghiệp: Kinh doanh',
  HDSN_CHO_THUE: 'Hoạt động sự nghiệp: Cho thuê',
  HDSN_LIEN_DOANH_LIEN_KET: 'Hoạt động sự nghiệp: Liên doanh, liên kết',
  HDSN_SU_DUNG_HON_HOP: 'Hoạt động sự nghiệp: Sử dụng hỗn hợp',
  SU_DUNG_KHAC: 'Sử dụng khác',
} as const;

export type UsageStatus = (typeof UsageStatus)[keyof typeof UsageStatus];

export const USAGE_STATUS_OPTIONS = Object.values(UsageStatus).map((v) => ({
  value: v,
  label: v,
}));

// 3. Nhóm tài sản
export const AssetGroup = {
  TS_CONG_CO_QUAN_TO_CHUC_DON_VI: 'Tài sản công tại cơ quan, tổ chức, đơn vị',
  TS_KET_CAU_HA_TANG: 'Tài sản kết cấu hạ tầng',
  TS_CONG_DOANH_NGHIEP: 'Tài sản công tại doanh nghiệp',
  TS_DU_AN_VON_NHA_NUOC: 'Tài sản của dự án sử dụng vốn nhà nước',
  TS_XAC_LAP_QUYEN_SO_HUU_TOAN_DAN: 'Tài sản được xác lập quyền sở hữu toàn dân',
  TIEN: 'Tiền',
  DAT_DAI_TAI_NGUYEN: 'Đất đai, tài nguyên',
} as const;

export type AssetGroup = (typeof AssetGroup)[keyof typeof AssetGroup];

export const ASSET_GROUP_OPTIONS = Object.values(AssetGroup).map((v) => ({
  value: v,
  label: v,
}));

// 4. Nguồn gốc
export const AssetOrigin = {
  GIAO_MOI: 'Giao mới',
  TIEP_NHAN: 'Tiếp nhận',
} as const;

export type AssetOrigin = (typeof AssetOrigin)[keyof typeof AssetOrigin];

export const ASSET_ORIGIN_OPTIONS = Object.values(AssetOrigin).map((v) => ({
  value: v,
  label: v,
}));

// 5. Đơn vị tính số lượng
export const ASSET_QUANTITY_UNITS = [
  'Bản quyền',
  'Bến',
  'Bộ',
  'Cái',
  'Chiếc',
  'Cổng',
  'Cầu',
  'Cột',
  'Đường truyền',
  'Hecta',
  'Hạng mục',
  'Hệ thống',
  'Kho',
  'Khu',
  'Ki-lô-mét',
  'Mét',
  'Mét vuông',
  'Nhà',
  'Phân hệ',
  'Phòng',
  'Quả',
  'Trạm',
  'Tháp',
  'Tuyến',
  'Tấn',
  'Trụ',
  'VND',
] as const;

export type AssetQuantityUnit = (typeof ASSET_QUANTITY_UNITS)[number];

export const ASSET_QUANTITY_UNIT_OPTIONS = ASSET_QUANTITY_UNITS.map((u) => ({
  value: u,
  label: u,
}));

// 6. Hình thức xử lý tài sản (Màn Tăng/Giảm nguyên giá)
export const DisposalMethod = {
  CHO_THUE: 'Cho thuê',
  SU_DUNG: 'Sử dụng',
  NHAN_DIEU_CHUYEN: 'Nhận điều chuyển',
  DIEU_CHUYEN_DI: 'Điều chuyển đi',
  CHUYEN_NHUONG: 'Chuyển nhượng',
  THANH_LY: 'Thanh lý',
  BAN: 'Bán',
  BI_MAT_BI_HUY_HOAI: 'Bị mất bị hủy hoại',
  KHAC: 'Khác',
} as const;

export type DisposalMethod = (typeof DisposalMethod)[keyof typeof DisposalMethod];

export const DISPOSAL_METHOD_OPTIONS = Object.values(DisposalMethod).map((m) => ({
  value: m,
  label: m,
}));

// 7. Lý do giảm nguyên giá (Bug 7) & Lý do tăng nguyên giá
export const DECREASE_REASONS = [
  'Thanh lý, nhượng bán',
  'Điều chuyển',
  'Giảm khác',
] as const;

export const DECREASE_REASON_OPTIONS = DECREASE_REASONS.map((r) => ({
  value: r,
  label: r,
}));

export const INCREASE_REASONS = [
  'Đầu tư nâng cấp hệ thống',
  'Mở rộng công suất truyền dẫn',
  'Đánh giá lại giá trị',
  'Tăng khác',
] as const;

export const INCREASE_REASON_OPTIONS = INCREASE_REASONS.map((r) => ({
  value: r,
  label: r,
}));
