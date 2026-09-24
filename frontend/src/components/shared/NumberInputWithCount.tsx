import type { InputNumberProps } from 'antd';
import InputNumber from './LocalizedInputNumber';
import { fontSizeMd, textSecondary } from '../../themetokenchk';
import {
  buildPastedValue,
  countDigits,
  decideKeyInput,
  DEFAULT_MAX_DIGITS,
} from '../../utils/numberInputGuards';

export type NumberInputWithCountProps = InputNumberProps<string | number> & {
  /** Số CHỮ SỐ 0-9 tối đa cho phép nhập (mặc định 20). Chỉ đếm chữ số — '-' và dấu thập phân không tính. */
  maxDigits?: number;
  /** @deprecated Dùng `maxDigits`. Vẫn được nhận để các màn hình cũ không phải sửa. */
  maxLength?: number;
  /**
   * Cho phép 1 dấu ',' hoặc '.' để nhập số thập phân (mặc định false = chỉ số nguyên).
   * - CHƯA có dấu thập phân: vẫn nhập được đủ `maxDigits` chữ số (mặc định 20).
   * - Dấu thập phân chỉ được nhận khi phần nguyên đang có ≤ 16 chữ số; nếu đang có hơn 16 chữ số thì
   *   phím bị chặn — không cắt bớt số người dùng đang nhập.
   * - Khi giá trị đã có dấu thập phân: phần nguyên ≤ 16 chữ số, phần thập phân ≤ 4 chữ số.
   */
  allowDecimal?: boolean;
  /** Cho phép 1 dấu '-' ở ĐẦU để nhập giá trị âm (mặc định false). */
  allowNegative?: boolean;
};

const ALLOWED_NAV_KEYS = [
  'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Tab', 'Enter', 'Escape', 'Home', 'End',
];

/**
 * Ô số dùng chung: đếm và giới hạn CHỮ SỐ, hỗ trợ số thập phân (dấu ',' hoặc '.') và số âm.
 * Chi tiết luật nhập xem `utils/numberInputGuards.ts`.
 */
export function NumberInputWithCount({
  maxDigits,
  maxLength,
  allowDecimal,
  allowNegative,
  formatter,
  parser,
  value,
  onKeyDown,
  onPaste,
  ...inputProps
}: NumberInputWithCountProps) {
  const digitLimit = maxDigits ?? maxLength ?? DEFAULT_MAX_DIGITS;
  const valStr = value === null || value === undefined ? '' : String(value);
  const digitsCount = countDigits(valStr);
  const effectiveFormatter = formatter;

  return (
    <InputNumber
      stringMode
      formatter={effectiveFormatter}
      parser={parser}
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
          const currentVal = inputEl ? inputEl.value : valStr;
          const decision = decideKeyInput({
            key: e.key,
            currentValue: currentVal,
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

          // Khi người dùng bấm dấu '.' trên bàn phím (đặc biệt bàn phím số numpad)
          // mà ô số đang dùng dấu phẩy (decimalSeparator = ','):
          // Tự động chèn ',' để người dùng gõ '.' hay ',' đều vào được dấu thập phân.
          const currentSep = (inputProps.decimalSeparator as string | undefined) ?? ',';
          if (allowDecimal && e.key === '.' && currentSep === ',') {
            e.preventDefault();
            if (document.execCommand && document.execCommand('insertText', false, ',')) {
              return;
            }
            if (inputEl) {
              const start = inputEl.selectionStart ?? inputEl.value.length;
              const end = inputEl.selectionEnd ?? start;
              const nativeSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value',
              )?.set;
              const nextVal = inputEl.value.slice(0, start) + ',' + inputEl.value.slice(end);
              if (nativeSetter) {
                nativeSetter.call(inputEl, nextVal);
                inputEl.setSelectionRange(start + 1, start + 1);
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
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

        const displayCombined = effectiveFormatter
          ? effectiveFormatter(combined, { userTyping: true, input: combined })
          : combined;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;
        if (inputEl && nativeInputValueSetter) {
          nativeInputValueSetter.call(inputEl, displayCombined);
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        onPaste?.(e);
      }}
      suffix={<span style={{ color: textSecondary, fontSize: fontSizeMd }}>{digitsCount}/{digitLimit}</span>}
    />
  );
}

export default NumberInputWithCount;

