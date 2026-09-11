import type { Rule } from 'antd/es/form';

/**
 * Chuẩn hóa số thập phân theo quy chuẩn:
 * - Chỉ chấp nhận chữ số và dấu "."
 * - Số sau dấu "." tối đa 4 chữ số
 * - Giới hạn 20 chữ số khi không có dấu "."
 * - Giới hạn chữ số phần nguyên khi có dấu "." là 16 (vẫn cho điền tối đa 4 chữ số sau dấu chấm)
 */
export const normalizeDecimal20_4 = (val: unknown): string => {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
  if (!s) return '';

  const dotIdx = s.indexOf('.');
  if (dotIdx === -1) {
    // Không có dấu "." -> giới hạn 20 chữ số
    return s.slice(0, 20);
  }

  // Có dấu "." -> chỉ giữ dấu "." đầu tiên, loại bỏ các dấu "." sau
  const intPart = s.slice(0, dotIdx).slice(0, 16);
  const decRaw = s.slice(dotIdx + 1).replace(/\./g, '');
  // Số sau dấu "." tối đa 4 chữ số
  const decPart = decRaw.slice(0, 4);

  return `${intPart}.${decPart}`;
};

export const parseNumber20 = (value: unknown): string => normalizeDecimal20_4(value);

export const getValueFromEvent20 = (val: unknown): string | null => {
  if (val === null || val === undefined || val === '') return null;
  return normalizeDecimal20_4(val) || null;
};

export const decimalNumberRule: Rule = {
  validator: (_: unknown, value: unknown) => {
    if (value === null || value === undefined || value === '') return Promise.resolve();
    const s = String(value).trim();
    if (!/^\d+(\.\d+)?$/.test(s) && !/^\d+\.$/.test(s) && !/^\.\d+$/.test(s)) {
      return Promise.reject(new Error('Chỉ chấp nhận chữ số và dấu "."'));
    }
    const dotIdx = s.indexOf('.');
    if (dotIdx !== -1) {
      const intPart = s.slice(0, dotIdx);
      const decPart = s.slice(dotIdx + 1);
      if (intPart.length > 16) {
        return Promise.reject(new Error('Giới hạn chữ số khi có dấu "." là 16'));
      }
      if (decPart.length > 4) {
        return Promise.reject(new Error('Số sau dấu "." tối đa 4 chữ số'));
      }
      const digitsCount = s.replace(/\./g, '').length;
      if (digitsCount > 20) {
        return Promise.reject(new Error('Giới hạn tối đa 20 chữ số'));
      }
    } else {
      const digitsCount = s.length;
      if (digitsCount > 20) {
        return Promise.reject(new Error('Giới hạn tối đa 20 chữ số'));
      }
    }
    return Promise.resolve();
  },
};

export const safeNumber = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const s = String(v).replace(/\.$/, '');
  if (!s || s === '.') return undefined;
  const num = Number(s);
  return isNaN(num) ? undefined : num;
};

/**
 * Chuẩn hóa và giữ nguyên chuỗi số thập phân 20 chữ số (tối đa 16 phần nguyên, 4 phần thập phân).
 * Trả về chuỗi string thay vì convert sang JS Number để bảo toàn 100% độ chính xác
 * khi vượt quá Number.MAX_SAFE_INTEGER trước khi gửi lên API backend.
 */
export const safeDecimal = (v: unknown): string | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const s = String(v).trim().replace(/\.$/, '');
  if (!s || s === '.') return undefined;
  const normalized = normalizeDecimal20_4(s);
  return normalized || undefined;
};

/**
 * Chuẩn hóa số nguyên 5 chữ số (trường số lượng):
 * - Chỉ chấp nhận chữ số
 * - Tối đa 5 chữ số
 */
export const parseNumber5 = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  return digits.slice(0, 5);
};

export const getValueFromEvent5 = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).replace(/\D/g, '').slice(0, 5);
  return str ? Number(str) : null;
};

export const integer5Rule: Rule = {
  validator: (_: unknown, value: unknown) => {
    if (value === null || value === undefined || value === '') return Promise.resolve();
    const s = String(value).trim();
    if (!/^\d+$/.test(s)) {
      return Promise.reject(new Error('Số lượng phải là số nguyên'));
    }
    if (s.length > 5) {
      return Promise.reject(new Error('Số lượng tối đa 5 chữ số'));
    }
    if (Number(s) < 1) {
      return Promise.reject(new Error('Số lượng phải lớn hơn 0'));
    }
    return Promise.resolve();
  },
};
