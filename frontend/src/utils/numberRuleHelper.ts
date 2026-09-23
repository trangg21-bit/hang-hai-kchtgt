import type { Rule } from 'antd/es/form';
import { parseDotNumber } from './numFmt';

/**
 * Chuẩn hóa số thập phân theo quy chuẩn:
 * - Chấp nhận dấu thập phân "." hoặc "," và chuẩn hóa về "."
 * - Số sau dấu "." tối đa 4 chữ số
 * - Giới hạn 20 chữ số khi không có dấu "."
 * - Giới hạn chữ số phần nguyên khi có dấu "." là 16 (vẫn cho điền tối đa 4 chữ số sau dấu chấm)
 */
export const normalizeDecimal20_4 = (val: unknown): string => {
  if (val === null || val === undefined || val === '') return '';
  const raw = String(val).replace(/[^0-9.,]/g, '');
  const lastDot = raw.lastIndexOf('.');
  const lastComma = raw.lastIndexOf(',');
  const hasMixedSeparators = lastDot !== -1 && lastComma !== -1;
  const separatorCount = (raw.match(/[.,]/g) || []).length;
  const decimalIndex = hasMixedSeparators
    ? Math.max(lastDot, lastComma)
    : separatorCount === 1
      ? Math.max(lastDot, lastComma)
      : lastDot !== -1
        ? raw.indexOf('.')
        : -1;
  const hasDecimalSeparator = decimalIndex !== -1;
  const s = hasDecimalSeparator
    ? `${raw.slice(0, decimalIndex).replace(/[.,]/g, '')}.${raw.slice(decimalIndex + 1).replace(/[.,]/g, '')}`
    : raw.replace(/,/g, '').replace(/[^0-9.]/g, '');
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

export const parseNumber20 = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return normalizeDecimal20_4(parseDotNumber(String(value)));
};

export const getValueFromEvent20 = (val: unknown): string | null => {
  if (val === null || val === undefined || val === '') return null;
  return normalizeDecimal20_4(val) || null;
};

/** Như `normalizeDecimal20_4` nhưng GIỮ dấu '-' ở đầu — dùng cho trường có thể nhập số âm. */
export const normalizeDecimal20_4Signed = (val: unknown): string => {
  if (val === null || val === undefined || val === '') return '';
  const negative = String(val).trim().startsWith('-');
  const normalized = normalizeDecimal20_4(val);
  if (!normalized) return negative ? '-' : '';
  return negative ? `-${normalized}` : normalized;
};

export const parseNumber20Signed = (value: unknown): string => normalizeDecimal20_4Signed(value);

export const getValueFromEvent20Signed = (val: unknown): string | null => {
  if (val === null || val === undefined || val === '') return null;
  return normalizeDecimal20_4Signed(val) || null;
};

/** Kiểm tra phần thân của một số thập phân (đã bỏ dấu '-') — dùng chung cho 2 rule bên dưới. */
const checkDecimalBody = (s: string): string | null => {
  if (!/^\d+(\.\d+)?$/.test(s) && !/^\d+\.$/.test(s) && !/^\.\d+$/.test(s)) {
    return 'Chỉ chấp nhận chữ số và dấu "."';
  }
  const dotIdx = s.indexOf('.');
  if (dotIdx !== -1) {
    const intPart = s.slice(0, dotIdx);
    const decPart = s.slice(dotIdx + 1);
    if (intPart.length > 16) {
      return 'Giới hạn chữ số khi có dấu "." là 16';
    }
    if (decPart.length > 4) {
      return 'Số sau dấu "." tối đa 4 chữ số';
    }
    if (s.replace(/\./g, '').length > 20) {
      return 'Giới hạn tối đa 20 chữ số';
    }
  } else if (s.length > 20) {
    return 'Giới hạn tối đa 20 chữ số';
  }
  return null;
};

export const decimalNumberRule: Rule = {
  validator: (_: unknown, value: unknown) => {
    if (value === null || value === undefined || value === '') return Promise.resolve();
    const error = checkDecimalBody(String(value).trim());
    return error ? Promise.reject(new Error(error)) : Promise.resolve();
  },
};

/**
 * Như `decimalNumberRule` nhưng cho phép 1 dấu '-' ở ĐẦU (giá trị âm hợp lệ),
 * dùng cho các trường có thể âm như "Cao trình đỉnh (m)" của đê kè.
 */
export const decimalNumberRuleSigned: Rule = {
  validator: (_: unknown, value: unknown) => {
    if (value === null || value === undefined || value === '') return Promise.resolve();
    const s = String(value).trim();
    const error = checkDecimalBody(s.startsWith('-') ? s.slice(1) : s);
    return error ? Promise.reject(new Error(error)) : Promise.resolve();
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
 * Như `safeDecimal` nhưng GIỮ dấu '-' ở đầu — dùng cho trường cho phép số âm
 * (ví dụ "Cao trình đỉnh (m)" của đê kè). Backend đã chấp nhận số âm:
 * Decimal20_4Validator bỏ qua dấu âm/dương ở đầu khi đếm chữ số.
 */
export const safeDecimalSigned = (v: unknown): string | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const raw = String(v).trim().replace(/\.$/, '');
  if (!raw || raw === '-' || raw === '.') return undefined;
  const normalized = normalizeDecimal20_4Signed(raw);
  return normalized && normalized !== '-' ? normalized : undefined;
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

/**
 * Rule kiểm tra số nguyên không âm (>= 0) tối đa 5 chữ số (dành cho số lượng nhân sự, số lượng triền đà...):
 * - Bỏ trống: hợp lệ (nếu không required)
 * - Chỉ chấp nhận chữ số nguyên không âm (0, 1, 2...)
 * - Tối đa 5 chữ số
 */
export const integer5NonNegativeRule: Rule = {
  validator: (_: unknown, value: unknown) => {
    if (value === null || value === undefined || value === '') return Promise.resolve();
    const s = String(value).trim();
    if (!/^\d+$/.test(s)) {
      return Promise.reject(new Error('Số lượng phải là số nguyên'));
    }
    if (s.length > 5) {
      return Promise.reject(new Error('Số lượng tối đa 5 chữ số'));
    }
    return Promise.resolve();
  },
};
