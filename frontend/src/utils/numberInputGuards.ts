/**
 * Luật nhập số dùng chung cho ô số NumberInputWithCount (đặt ở utils để mọi màn hình import
 * được và để unit test chạy trong include của vitest.config.ts).
 *
 * QUY TẮC DUY NHẤT cho mọi ô số:
 * 1. Giới hạn `maxDigits` CHỮ SỐ 0-9 (mặc định 20) — đếm chữ số, KHÔNG đếm dấu '-', '.' hay ','.
 *    Mọi màn hình muốn giới hạn khác thì truyền `maxDigits` (ví dụ 5 cho số lượng nhân sự).
 * 2. Chỉ ký tự 0-9 là hợp lệ. Hai ngoại lệ DUY NHẤT, đều phải bật tường minh:
 *    '-' (chỉ ở ĐẦU, khi `allowNegative`) và '.' / ',' (1 lần, khi `allowDecimal`).
 * 3. Mặc định là số NGUYÊN; chỉ khi `allowDecimal` mới nhập được dấu '.' hoặc ','.
 *    - CHƯA có dấu '.' / ',': vẫn nhập được đủ `maxDigits` chữ số (mặc định 20).
 *    - Dấu '.' / ',' chỉ được NHẬN khi phần nguyên đứng trước nó ≤ 16 chữ số. Nếu phần nguyên đang
 *      có hơn 16 chữ số thì phím '.' / ',' bị CHẶN — tuyệt đối không cắt bớt số người dùng đang nhập.
 *    - Khi giá trị đã có dấu '.' / ',': phần nguyên ≤ 16 chữ số, phần thập phân ≤ 4 chữ số
 *      (khớp normalizeDecimal20_4 trong utils/numberRuleHelper.ts).
 * 4. `allowNegative` mới cho nhập dấu '-' ở đầu để nhập giá trị âm.
 * 5. Khi dán chuỗi đã định dạng hàng nghìn (ví dụ 1.234.567 hoặc 1,234,567), các dấu phân tách
 *    hàng nghìn được loại bỏ tự động, giữ lại đúng giá trị số và dấu thập phân (nếu allowDecimal).
 */

/** Số chữ số tối đa mặc định khi màn hình không truyền `maxDigits`/`maxLength`. */
export const DEFAULT_MAX_DIGITS = 20;
/** Số chữ số tối đa sau dấu thập phân — khớp normalizeDecimal20_4 (utils/numberRuleHelper.ts). */
export const DECIMAL_MAX_FRACTION_DIGITS = 4;
/** Số chữ số tối đa của phần nguyên KHI CÓ dấu thập phân — khớp normalizeDecimal20_4. */
export const DECIMAL_MAX_INTEGER_DIGITS = 16;

export type NumberInputRules = {
  /** Số CHỮ SỐ 0-9 tối đa (mặc định 20). */
  maxDigits?: number;
  /** Cho phép 1 dấu '.' hoặc ',' để nhập số thập phân. Mặc định false. */
  allowDecimal?: boolean;
  /** Cho phép 1 dấu '-' ở đầu để nhập số âm. Mặc định false. */
  allowNegative?: boolean;
};

const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';

export const normalizeMaxDigits = (maxDigits?: number): number =>
  typeof maxDigits === 'number' && Number.isFinite(maxDigits) && maxDigits >= 1
    ? Math.floor(maxDigits)
    : DEFAULT_MAX_DIGITS;

const clampIndex = (index: number | null | undefined, value: string): number => {
  if (index === null || index === undefined || Number.isNaN(index)) return value.length;
  return Math.max(0, Math.min(index, value.length));
};

/** Đếm CHỮ SỐ 0-9 (bỏ qua '-', '.', ',', dấu phân tách, khoảng trắng...). */
export function countDigits(value: string | number | null | undefined): number {
  let count = 0;
  for (const ch of String(value ?? '')) {
    if (isDigit(ch)) count += 1;
  }
  return count;
}

/**
 * Tìm vị trí và ký tự dấu thập phân ('.' hoặc ',') trong chuỗi.
 * - Có cả '.' và ',': dấu đứng sau cùng là dấu thập phân (ví dụ: '1.234,56' -> ',', '1,234.56' -> '.').
 * - Chỉ có 1 dấu ',' duy nhất: ',' là dấu thập phân.
 * - Chỉ có 1 dấu '.' duy nhất: '.' là dấu thập phân.
 * - Có từ 2 dấu '.' hoặc 2 dấu ',' cùng loại: là dấu phân tách hàng nghìn.
 */
export function findDecimalSeparator(str: string): { index: number; char: string } | null {
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  const commaCount = (str.match(/,/g) || []).length;
  const dotCount = (str.match(/\./g) || []).length;

  if (lastComma !== -1 && lastDot !== -1) {
    return lastComma > lastDot
      ? { index: lastComma, char: ',' }
      : { index: lastDot, char: '.' };
  }
  if (commaCount === 1) {
    return { index: lastComma, char: ',' };
  }
  if (commaCount > 1) {
    return null;
  }
  if (dotCount === 1) {
    // Dấu '.' đơn lẻ trong nhóm hàng nghìn vi-VN (1..3 chữ số khác 0 trước dấu chấm,
    // đúng 3 chữ số sau dấu chấm, ví dụ: "1.234", "12.345", "123.456", "-1.234")
    // là dấu phân tách hàng nghìn do formatter hiển thị, KHÔNG phải dấu thập phân.
    if (/^[+-]?[1-9]\d{0,2}\.\d{3}$/.test(str.trim())) {
      return null;
    }
    return { index: lastDot, char: '.' };
  }
  return null;
}

/**
 * Chuẩn hoá một chuỗi về đúng giá trị hợp lệ của ô số:
 * - chỉ giữ chữ số 0-9, tối đa `maxDigits` chữ số;
 * - dấu '-' chỉ giữ khi `allowNegative` và nằm ở đầu;
 * - dấu '.' hoặc ',' chỉ giữ khi `allowDecimal`, tối đa 1 lần, và CHỈ KHI phần nguyên đứng trước nó
 *   ≤ 16 chữ số; phần thập phân tối đa 4 chữ số;
 * - BỎ mọi ký tự khác, kể cả '.'/',' dùng làm phân tách hàng nghìn.
 */
export function sanitizeNumberInput(
  raw: string | number | null | undefined,
  rules: NumberInputRules = {},
): string {
  const maxDigits = normalizeMaxDigits(rules.maxDigits);
  const allowDecimal = rules.allowDecimal === true;
  const allowNegative = rules.allowNegative === true;
  const integerLimit = Math.min(DECIMAL_MAX_INTEGER_DIGITS, maxDigits);

  const source = String(raw ?? '');
  const negative = allowNegative && source.trimStart().startsWith('-');

  const dec = allowDecimal ? findDecimalSeparator(source) : null;
  const digitsBeforeDec = dec !== null ? countDigits(source.slice(0, dec.index)) : 0;
  const decAccepted = dec !== null && digitsBeforeDec > 0 && digitsBeforeDec <= integerLimit;

  let out = '';
  let totalDigits = 0;
  let integerDigits = 0;
  let fractionDigits = 0;
  let decUsed = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (dec !== null && i === dec.index) {
      if (decAccepted && !decUsed) {
        decUsed = true;
        out += ch;
      }
      continue;
    }
    if (!isDigit(ch)) continue;
    if (totalDigits >= maxDigits) continue;
    if (decUsed) {
      if (fractionDigits >= DECIMAL_MAX_FRACTION_DIGITS) continue;
      fractionDigits += 1;
    } else if (decAccepted) {
      if (integerDigits >= integerLimit) continue;
      integerDigits += 1;
    } else {
      integerDigits += 1;
    }
    totalDigits += 1;
    out += ch;
  }

  return negative ? `-${out}` : out;
}

/**
 * Quyết định một phím có được nhập vào ô số hay không, dựa trên giá trị THẬT đang hiển thị
 * trong <input> (KHÔNG dùng form value: form cập nhật muộn hơn thao tác gõ).
 *
 * Cho phép cả dấu '.' và ',' khi `allowDecimal = true`.
 */
export function decideKeyInput(params: {
  key: string;
  currentValue: string;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  maxDigits?: number;
  allowDecimal?: boolean;
  allowNegative?: boolean;
}): 'allow' | 'block' {
  const { key, currentValue } = params;

  if (key.length !== 1) return 'block';
  if (!isDigit(key) && key !== '.' && key !== ',' && key !== '-') return 'block';

  const start = clampIndex(params.selectionStart, currentValue);
  const end = Math.max(start, clampIndex(params.selectionEnd ?? start, currentValue));

  // 1. Phím '-' (dấu âm)
  if (key === '-') {
    if (!params.allowNegative) return 'block';
    if (start !== 0) return 'block';
    if (currentValue.startsWith('-') && end === 0) return 'block';
    return 'allow';
  }

  // 2. Phím '.' hoặc ',' (dấu thập phân)
  if (key === '.' || key === ',') {
    if (!params.allowDecimal) return 'block';

    const existingDec = findDecimalSeparator(currentValue);
    // Nếu đã có dấu thập phân và dấu đó không nằm trong vùng bôi đen bị thay thế
    if (existingDec !== null && !(existingDec.index >= start && existingDec.index < end)) {
      return 'block';
    }

    // Không cho đặt dấu thập phân trước hoặc ở giữa dấu '-'
    if (currentValue.startsWith('-') && start === 0 && end === 0) return 'block';

    const maxDigits = normalizeMaxDigits(params.maxDigits);
    const integerLimit = Math.min(DECIMAL_MAX_INTEGER_DIGITS, maxDigits);

    // Phần nguyên đứng trước vị trí chèn phải có 1..16 chữ số
    const intDigitsBefore = countDigits(currentValue.slice(0, start));
    if (intDigitsBefore < 1 || intDigitsBefore > integerLimit) {
      return 'block';
    }

    // Các chữ số đứng sau vùng chọn sẽ trở thành phần thập phân: không được vượt quá 4
    const fracDigitsAfter = countDigits(currentValue.slice(end));
    if (fracDigitsAfter > DECIMAL_MAX_FRACTION_DIGITS) {
      return 'block';
    }

    return 'allow';
  }

  // 3. Phím số 0-9
  const maxDigits = normalizeMaxDigits(params.maxDigits);
  const currentTotalDigits = countDigits(currentValue);
  const replacedDigits = countDigits(currentValue.slice(start, end));
  if (currentTotalDigits - replacedDigits + 1 > maxDigits) {
    return 'block';
  }

  // Nếu ô cho phép thập phân và ĐÃ có dấu thập phân
  const existingDec = params.allowDecimal ? findDecimalSeparator(currentValue) : null;
  const decRemains = existingDec !== null && !(existingDec.index >= start && existingDec.index < end);

  if (decRemains && existingDec !== null) {
    const integerLimit = Math.min(DECIMAL_MAX_INTEGER_DIGITS, maxDigits);
    if (start <= existingDec.index) {
      // Người dùng đang gõ vào phần NGUYÊN (trước dấu thập phân)
      const currentIntDigits = countDigits(currentValue.slice(0, existingDec.index));
      const replacedIntDigits = countDigits(currentValue.slice(start, Math.min(end, existingDec.index)));
      if (currentIntDigits - replacedIntDigits + 1 > integerLimit) {
        return 'block';
      }
    } else {
      // Người dùng đang gõ vào phần THẬP PHÂN (sau dấu thập phân)
      const currentFracDigits = countDigits(currentValue.slice(existingDec.index + 1));
      const replacedFracDigits = countDigits(currentValue.slice(Math.max(start, existingDec.index + 1), end));
      if (currentFracDigits - replacedFracDigits + 1 > DECIMAL_MAX_FRACTION_DIGITS) {
        return 'block';
      }
    }
  }

  return 'allow';
}

/**
 * Trộn chuỗi dán vào giá trị hiện tại rồi chuẩn hoá theo đúng luật của ô số
 * (xem `sanitizeNumberInput`).
 */
export function buildPastedValue(params: {
  currentValue: string;
  pastedText: string;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  maxDigits?: number;
  allowDecimal?: boolean;
  allowNegative?: boolean;
}): string {
  const { currentValue, pastedText } = params;
  const start = clampIndex(params.selectionStart, currentValue);
  const end = Math.max(start, clampIndex(params.selectionEnd ?? start, currentValue));
  const merged = currentValue.slice(0, start) + String(pastedText ?? '') + currentValue.slice(end);

  return sanitizeNumberInput(merged, params);
}
