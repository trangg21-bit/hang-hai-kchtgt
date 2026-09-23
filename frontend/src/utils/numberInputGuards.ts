/**
 * Luật nhập số dùng chung cho ô số NumberInputWithCount (đặt ở utils để mọi màn hình import
 * được và để unit test chạy trong include của vitest.config.ts).
 *
 * QUY TẮC DUY NHẤT cho mọi ô số:
 * 1. Giới hạn `maxDigits` CHỮ SỐ 0-9 (mặc định 20) — đếm chữ số, KHÔNG đếm dấu '-' hay '.'.
 *    Mọi màn hình muốn giới hạn khác thì truyền `maxDigits` (ví dụ 5 cho số lượng nhân sự).
 * 2. Chỉ ký tự 0-9 là hợp lệ. Hai ngoại lệ DUY NHẤT, đều phải bật tường minh:
 *    '-' (chỉ ở ĐẦU, khi `allowNegative`) và '.' (1 lần, khi `allowDecimal`).
 * 3. Mặc định là số NGUYÊN; chỉ khi `allowDecimal` mới nhập được dấu '.'.
 *    - CHƯA có dấu '.': vẫn nhập được đủ `maxDigits` chữ số (mặc định 20).
 *    - Dấu '.' chỉ được NHẬN khi phần nguyên đứng trước nó ≤ 16 chữ số. Nếu phần nguyên đang
 *      có hơn 16 chữ số thì phím '.' bị CHẶN — tuyệt đối không cắt bớt số người dùng đang nhập.
 *    - Khi giá trị đã có dấu '.': phần nguyên ≤ 16 chữ số, phần thập phân ≤ 4 chữ số
 *      (khớp normalizeDecimal20_4 trong utils/numberRuleHelper.ts).
 * 4. `allowNegative` mới cho nhập dấu '-' ở đầu để nhập giá trị âm.
 * 5. TUYỆT ĐỐI không tự thêm dấu '.' hay ',' đóng vai trò phân tách hàng nghìn: khi dán cũng
 *    như khi gõ, mọi ký tự không thuộc tập hợp lệ (',', khoảng trắng, chữ cái...) đều bị bỏ.
 */

/** Số chữ số tối đa mặc định khi màn hình không truyền `maxDigits`/`maxLength`. */
export const DEFAULT_MAX_DIGITS = 20;
/** Số chữ số tối đa sau dấu '.' — khớp normalizeDecimal20_4 (utils/numberRuleHelper.ts). */
export const DECIMAL_MAX_FRACTION_DIGITS = 4;
/** Số chữ số tối đa của phần nguyên KHI CÓ dấu '.' — khớp normalizeDecimal20_4. */
export const DECIMAL_MAX_INTEGER_DIGITS = 16;

export type NumberInputRules = {
  /** Số CHỮ SỐ 0-9 tối đa (mặc định 20). */
  maxDigits?: number;
  /** Cho phép 1 dấu '.' để nhập số thập phân. Mặc định false. */
  allowDecimal?: boolean;
  /** Cho phép 1 dấu '-' ở đầu để nhập số âm. Mặc định false. */
  allowNegative?: boolean;
};

const isDigit = (ch: string): boolean => ch >= '0' && ch <= '9';

const normalizeMaxDigits = (maxDigits?: number): number =>
  typeof maxDigits === 'number' && Number.isFinite(maxDigits) && maxDigits >= 1
    ? Math.floor(maxDigits)
    : DEFAULT_MAX_DIGITS;

const clampIndex = (index: number | null | undefined, value: string): number => {
  if (index === null || index === undefined || Number.isNaN(index)) return value.length;
  return Math.max(0, Math.min(index, value.length));
};

/** Đếm CHỮ SỐ 0-9 (bỏ qua '-', '.', dấu phân tách, khoảng trắng...). */
export function countDigits(value: string | number | null | undefined): number {
  let count = 0;
  for (const ch of String(value ?? '')) {
    if (isDigit(ch)) count += 1;
  }
  return count;
}

/**
 * Chuẩn hoá một chuỗi về đúng giá trị hợp lệ của ô số:
 * - chỉ giữ chữ số 0-9, tối đa `maxDigits` chữ số;
 * - dấu '-' chỉ giữ khi `allowNegative` và nằm ở đầu;
 * - dấu '.' chỉ giữ khi `allowDecimal`, tối đa 1 lần, và CHỈ KHI phần nguyên đứng trước nó
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

  // Dấu '.' chỉ được chấp nhận khi phần nguyên đứng trước nó có 1..16 chữ số. Nhờ vậy giá trị
  // KHÔNG có dấu '.' vẫn được nhập đủ maxDigits chữ số, và dấu '.' bị TỪ CHỐI (chứ không cắt
  // bớt phần nguyên) khi phần nguyên đã vượt 16 chữ số.
  const digitsAndDots = source.replace(/[^0-9.]/g, '');
  const firstDotIndex = allowDecimal ? digitsAndDots.indexOf('.') : -1;
  const digitsBeforeFirstDot = firstDotIndex === -1 ? 0 : countDigits(digitsAndDots.slice(0, firstDotIndex));
  const dotAccepted = firstDotIndex !== -1 && digitsBeforeFirstDot > 0 && digitsBeforeFirstDot <= integerLimit;

  let out = '';
  let totalDigits = 0;
  let integerDigits = 0;
  let fractionDigits = 0;
  let dotUsed = false;

  for (const ch of source) {
    if (ch === '.') {
      if (dotAccepted && !dotUsed) {
        dotUsed = true;
        out += ch;
      }
      continue; // dấu '.' không hợp lệ bị BỎ, không đụng tới các chữ số đang có
    }
    if (!isDigit(ch)) continue;
    if (totalDigits >= maxDigits) continue;
    if (dotUsed) {
      if (fractionDigits >= DECIMAL_MAX_FRACTION_DIGITS) continue;
      fractionDigits += 1;
    } else if (dotAccepted) {
      // Kết quả sẽ có dấu '.' nên phần nguyên giới hạn ở 16 chữ số
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
 * Nguyên tắc: ký tự được nhận khi và chỉ khi chuỗi sau khi chèn ký tự đó ĐÃ là một giá trị
 * hợp lệ — nhờ vậy mọi trường hợp (vượt số chữ số, dấu '.' thứ hai, '-' sai vị trí, ký tự
 * không hợp lệ) đều bị chặn thay vì bị cắt ngầm.
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
  if (!isDigit(key) && key !== '.' && key !== '-') return 'block';

  const start = clampIndex(params.selectionStart, currentValue);
  const end = Math.max(start, clampIndex(params.selectionEnd ?? start, currentValue));
  const candidate = currentValue.slice(0, start) + key + currentValue.slice(end);

  return sanitizeNumberInput(candidate, params) === candidate ? 'allow' : 'block';
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
