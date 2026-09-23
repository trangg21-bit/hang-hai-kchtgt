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
  if (idx !== -1) return VIETNAM_PROVINCES[idx];

  // Dữ liệu KCHT kế thừa dùng mã thứ tự 1..63 thay vì mã hành chính.
  return Number.isInteger(numId) && numId >= 1 && numId <= VIETNAM_PROVINCES.length
    ? VIETNAM_PROVINCES[numId - 1]
    : undefined;
};

/**
 * Chuyển đổi mã tỉnh/thành phố hoặc chuỗi tên sang nhãn hiển thị chuẩn tiếng Việt.
 * Hỗ trợ: ID số (1, 31...), nhãn chuẩn ("Hà Nội"), tên kèm tiền tố ("Thành phố Hà Nội", "Tỉnh Hải Dương"),
 * hoặc fallback về chính chuỗi ban đầu nếu không tìm thấy (tránh rỗng làm mất dữ liệu lịch sử).
 */
export const getProvinceLabel = (provinceId?: string | number): string => {
  if (provinceId === undefined || provinceId === null) return '';
  const str = String(provinceId).trim();
  if (str === '' || str === '—' || str === '(null)' || str === 'null') return '';
  if (str === 'Chưa có' || str === '(trống)') return 'Chưa có';

  // 1. Khớp chính xác theo ID số dạng chuỗi (value: "1", "31", ...)
  const foundByVal = VIETNAM_PROVINCE_OPTIONS.find((o) => o.value === str);
  if (foundByVal) return foundByVal.label;

  // 2. Tra cứu bằng ID qua getProvinceNameById
  const nameById = getProvinceNameById(provinceId);
  if (nameById) return nameById;

  // 3. Khớp chính xác theo nhãn
  const foundByLabel = VIETNAM_PROVINCE_OPTIONS.find(
    (o) => o.label.toLowerCase() === str.toLowerCase()
  );
  if (foundByLabel) return foundByLabel.label;

  // 4. Bỏ tiền tố "Thành phố ", "Tỉnh ", "TP. ", "TP " rồi so khớp
  const normStr = str.toLowerCase().replace(/^(thành phố|tỉnh|tp\.?)\s+/i, '').trim();
  if (normStr) {
    const foundByNorm = VIETNAM_PROVINCE_OPTIONS.find((o) => {
      const normOpt = o.label.toLowerCase().replace(/^(thành phố|tỉnh|tp\.?)\s+/i, '').trim();
      return normOpt === normStr;
    });
    if (foundByNorm) return foundByNorm.label;
  }

  // 5. Fallback giữ nguyên chuỗi
  return str;
};
