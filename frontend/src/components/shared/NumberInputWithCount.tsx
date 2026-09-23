import type { InputNumberProps } from 'antd';
import InputNumber from './LocalizedInputNumber';
import { fontSizeMd, textSecondary } from '../../themetokenchk';
import {
  buildPastedValue,
  countDigits,
  decideKeyInput,
  DEFAULT_MAX_DIGITS,
} from '../../utils/numberInputGuards';

export type NumberInputWithCountProps = Omit<InputNumberProps<string | number>, 'formatter'> & {
  /** Số CHỮ SỐ 0-9 tối đa cho phép nhập (mặc định 20). Chỉ đếm chữ số — '-' và '.' không tính. */
  maxDigits?: number;
  /** @deprecated Dùng `maxDigits`. Vẫn được nhận để các màn hình cũ không phải sửa. */
  maxLength?: number;
  /**
   * Cho phép 1 dấu '.' để nhập số thập phân (mặc định false = chỉ số nguyên).
   * - CHƯA có dấu '.': vẫn nhập được đủ `maxDigits` chữ số (mặc định 20).
   * - Dấu '.' chỉ được nhận khi phần nguyên đang có ≤ 16 chữ số; nếu đang có hơn 16 chữ số thì
   *   phím '.' bị chặn — không cắt bớt số người dùng đang nhập.
   * - Khi giá trị đã có dấu '.': phần nguyên ≤ 16 chữ số, phần thập phân ≤ 4 chữ số.
   */
  allowDecimal?: boolean;
  /** Cho phép 1 dấu '-' ở ĐẦU để nhập giá trị âm (mặc định false). */
  allowNegative?: boolean;
  /**
   * @deprecated KHÔNG còn tác dụng — bị bỏ qua có chủ đích.
   * Ô số không bao giờ tự thêm dấu phân tách hàng nghìn ('.' hoặc ','): giá trị hiển thị luôn
   * đúng bằng chuỗi đã nhập. Cần nhập thập phân thì dùng `allowDecimal`.
   */
  formatter?: InputNumberProps<string | number>['formatter'];
  /** Chuẩn hoá giá trị khi AntD đọc chuỗi hiển thị (mặc định: giữ nguyên chuỗi đã nhập). */
  parser?: InputNumberProps<string | number>['parser'];
};

const ALLOWED_NAV_KEYS = [
  'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Tab', 'Enter', 'Escape', 'Home', 'End',
];

/** Giữ nguyên chuỗi người dùng nhập — không phân tách hàng nghìn, không đổi định dạng. */
const keepRawValue = (displayValue: string | undefined): string => displayValue ?? '';

/**
 * Ô số dùng chung: đếm và giới hạn CHỮ SỐ, không tự thêm dấu phân tách hàng nghìn.
 * Chi tiết luật nhập xem `utils/numberInputGuards.ts`.
 */
export function NumberInputWithCount({
  maxDigits,
  maxLength,
  allowDecimal,
  allowNegative,
  parser,
  value,
  onKeyDown,
  onPaste,
  formatter: ignoredFormatter,
  ...inputProps
}: NumberInputWithCountProps) {
  // `formatter` cũ bị BỎ QUA có chủ đích (xem JSDoc) — không truyền xuống InputNumber.
  void ignoredFormatter;

  const digitLimit = maxDigits ?? maxLength ?? DEFAULT_MAX_DIGITS;
  const valStr = value === null || value === undefined ? '' : String(value);
  const digitsCount = countDigits(valStr);
  const effectiveParser = (parser ?? keepRawValue) as (
    displayValue: string | undefined,
  ) => string | number;

  return (
    <InputNumber
      stringMode
      parser={effectiveParser}
      {...inputProps}
      value={value}
      onKeyDown={(e) => {
        // Cho phép các tổ hợp phím tắt Ctrl/Meta/Alt (copy/paste/cut/select all...)
        if (e.ctrlKey || e.metaKey || e.altKey) {
          onKeyDown?.(e);
          return;
        }
        if (ALLOWED_NAV_KEYS.includes(e.key)) {
          onKeyDown?.(e);
          return;
        }

        // Chỉ tự kiểm tra phím ký tự in được; các phím chức năng khác để AntD xử lý.
        if (e.key.length === 1) {
          const inputEl = e.currentTarget as HTMLInputElement;
          const decision = decideKeyInput({
            key: e.key,
            currentValue: inputEl ? inputEl.value : valStr,
            selectionStart: inputEl?.selectionStart,
            selectionEnd: inputEl?.selectionEnd,
            maxDigits: digitLimit,
            allowDecimal,
            allowNegative,
          });
          if (decision === 'block') {
            e.preventDefault();
            return;
          }
        }

        onKeyDown?.(e);
      }}
      onPaste={(e) => {
        e.preventDefault();
        const rawText = e.clipboardData.getData('text');
        const inputEl = e.currentTarget as HTMLInputElement;
        const currentStr = inputEl ? inputEl.value : valStr;
        const start = inputEl ? (inputEl.selectionStart ?? 0) : currentStr.length;
        const end = inputEl ? (inputEl.selectionEnd ?? start) : start;

        const combined = buildPastedValue({
          currentValue: currentStr,
          pastedText: rawText,
          selectionStart: start,
          selectionEnd: end,
          maxDigits: digitLimit,
          allowDecimal,
          allowNegative,
        });

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;
        if (inputEl && nativeInputValueSetter) {
          nativeInputValueSetter.call(
            inputEl,
            effectiveFormatter(combined, { userTyping: true, input: combined }),
          );
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        onPaste?.(e);
      }}
      suffix={<span style={{ color: textSecondary, fontSize: fontSizeMd }}>{digitsCount}/{digitLimit}</span>}
    />
  );
}

export default NumberInputWithCount;
