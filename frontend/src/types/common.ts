export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  statusCounts?: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend';
}

export type Status = 'active' | 'locked' | 'inactive';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const VIETNAM_PROVINCES = [
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cần Thơ",
  "Cao Bằng",
  "Đà Nẵng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Dương",
  "Hải Phòng",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "TP. Hồ Chí Minh",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái"
];

/**
 * Mã tỉnh/thành phố khớp bảng `provinces` được tạo tại migration V108.
 * Dropdown vẫn hiển thị tên tiếng Việt nhưng gửi mã số cho API.
 */
const VIETNAM_PROVINCE_IDS = [
  89, 77, 24, 6, 95, 27, 83, 52, 74, 70, 60, 96, 92, 4, 48, 66, 67, 11, 75, 87, 64,
  2, 35, 1, 42, 30, 31, 93, 17, 33, 56, 91, 62, 12, 68, 20, 10, 80, 36, 40, 37, 58,
  25, 54, 44, 49, 51, 22, 45, 94, 14, 72, 34, 19, 38, 46, 82, 79, 84, 8, 86, 26, 15,
] as const;

export const VIETNAM_PROVINCE_OPTIONS = VIETNAM_PROVINCES.map((label, index) => ({
  label,
  value: String(VIETNAM_PROVINCE_IDS[index]),
}));

export const getProvinceIdByName = (name?: string): number | undefined => {
  if (!name) return undefined;
  const idx = VIETNAM_PROVINCES.indexOf(name as any);
  return idx !== -1 ? VIETNAM_PROVINCE_IDS[idx] : undefined;
};

export const getProvinceNameById = (id?: number | string): string | undefined => {
  if (id === undefined || id === null || id === '') return undefined;
  const numId = Number(id);
  const idx = VIETNAM_PROVINCE_IDS.indexOf(numId as any);
  return idx !== -1 ? VIETNAM_PROVINCES[idx] : undefined;
};
