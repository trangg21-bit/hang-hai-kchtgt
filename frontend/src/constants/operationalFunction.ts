/**
 * Công năng khai thác (operationalFunction) — nguồn dữ liệu dùng chung duy nhất.
 * Áp dụng cho module Quản lý cầu cảng (Pier) và các module KCHT dùng chung danh mục này.
 *
 * Quy ước lưu trữ: cột/field `operationalFunction` giữ kiểu String và lưu MÃ ổn định
 * tiếng Anh (value). Nhãn tiếng Việt hiển thị qua map — KHÔNG hardcode chuỗi tiếng Việt
 * ở nhiều nơi khác nhau. Danh sách này đồng bộ với nhóm mã mà Khu chuyển tải (transfer-area)
 * và backend đang dùng (CONTAINER, GENERAL_CARGO, BULK_CARGO, OIL_GAS, OTHER, PASSENGER).
 *
 * Tương thích dữ liệu cũ: nếu một dòng cũ chưa được chuẩn hóa (lưu tên tiếng Việt tự do),
 * hàm formatOperationalFunction hiển thị lại nguyên giá trị cũ thay vì che giấu (map[c] || c).
 */

export interface OperationalFunctionOption {
  value: string;
  label: string;
}

export const OPERATIONAL_FUNCTION_OPTIONS: OperationalFunctionOption[] = [
  { value: 'CONTAINER', label: 'Hàng Container' },
  { value: 'GENERAL_CARGO', label: 'Hàng tổng hợp (bách hóa)' },
  { value: 'BULK_CARGO', label: 'Hàng chuyên dụng hàng rời, quặng' },
  { value: 'OIL_GAS', label: 'Hàng chuyên dụng xăng dầu, khí hóa lỏng' },
  { value: 'OTHER', label: 'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu ...)' },
  { value: 'PASSENGER', label: 'Hàng khách' },
];

export const OPERATIONAL_FUNCTION_LABEL_MAP: Record<string, string> =
  OPERATIONAL_FUNCTION_OPTIONS.reduce<Record<string, string>>((acc, o) => {
    acc[o.value] = o.label;
    return acc;
  }, {});

/** Trả về nhãn Công năng khai thác để hiển thị; giữ nguyên giá trị cũ nếu chưa khớp option (dữ liệu legacy). */
export function formatOperationalFunction(
  v?: string | null,
  emptyText = '',
): string {
  if (!v) return emptyText;
  const t = v.trim();
  if (t === '-' || t === '—' || t === '–' || t === 'null' || t === '(null)') return emptyText;
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s !== '-' && s !== '—' && s !== '–')
    .map((code) => OPERATIONAL_FUNCTION_LABEL_MAP[code] || code)
    .join(', ');
}

/**
 * Chuyển chuỗi lưu trữ (mã nối dấu phẩy, có thể là label tự do từ dữ liệu cũ)
 * thành mảng token để Select mode="multiple" hiển thị tag.
 */
export function splitOperationalFunctionCodes(
  v?: string | null,
): string[] {
  if (!v) return [];
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Bộ lọc: chuyển giá trị legacy thành mã tương ứng (nếu có), nếu không thì trả nguyên. Chỉ áp dụng khi chọn option hợp lệ. */
export function normalizeOperationalFunction(v?: string | null): string | undefined {
  if (!v) return undefined;
  return OPERATIONAL_FUNCTION_LABEL_MAP[v] ? v : undefined;
}
