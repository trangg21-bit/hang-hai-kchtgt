import type { InputNumberProps } from 'antd';
import InputNumber from './LocalizedInputNumber';
import { fontSizeMd, textSecondary } from '../../themetokenchk';
import {
  buildPastedValue,
  countDigits,
  decideKeyInput,
  DEFAULT_MAX_DIGITS,
} from '../../utils/numberInputGuards';
import { fmtInputNumber, parseDotNumber } from '../../utils/numFmt';

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
  /**
   * Định dạng hiển thị chuỗi số (mặc định theo chuẩn vi-VN: dấu chấm '.' hàng nghìn, dấu phẩy ',' thập phân).
   */
  formatter?: InputNumberProps<string | number>['formatter'];
  /** Chuẩn hoá giá trị khi AntD đọc chuỗi hiển thị (mặc định parseDotNumber chuẩn vi-VN). */
  parser?: InputNumberProps<string | number>['parser'];
};

const ALLOWED_NAV_KEYS = [
  'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Tab', 'Enter', 'Escape', 'Home', 'End',
];

/**
 * Ô số dùng chung: đếm và giới hạn CHỮ SỐ, định dạng hiển thị real-time chuẩn vi-VN
 * (dấu chấm '.' phân tách hàng nghìn, dấu phẩy ',' phân tách phần thập phân).
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
  const isYearInput = Number(inputProps.min) >= 1800 && Number(inputProps.max) <= 2200;
  const isDecimalAllowed = allowDecimal === true || (typeof inputProps.step === 'number' && inputProps.step > 0 && inputProps.step < 1);
  const effectiveFormatter = formatter ?? (isYearInput ? undefined : fmtInputNumber);
  const effectiveParser = (parser ?? (isYearInput ? undefined : parseDotNumber)) as (
    displayValue: string | undefined,
  ) => string | number;

  const digitLimit = maxDigits ?? maxLength ?? DEFAULT_MAX_DIGITS;
  const valStr = value === null || value === undefined ? '' : String(value);
  const digitsCount = countDigits(valStr);

  return (
    <InputNumber
      stringMode
      decimalSeparator=","
      formatter={effectiveFormatter}
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
          const currentVal = inputEl ? inputEl.value : valStr;

          // Nếu bấm phím '.' trên bàn phím số (numpad) hoặc bàn phím khi cho phép số thập phân:
          // Tự động chuyển thành dấu phẩy ',' theo chuẩn hiển thị vi-VN
          if (e.key === '.' && isDecimalAllowed) {
            e.preventDefault();
            if (inputEl) {
              const current = inputEl.value;
              const start = inputEl.selectionStart ?? current.length;
              const end = inputEl.selectionEnd ?? start;
              const outside = current.slice(0, start) + current.slice(end);
              if (!outside.includes(',')) {
                const success = document.execCommand?.('insertText', false, ',');
                if (!success) {
                  const next = current.slice(0, start) + ',' + current.slice(end);
                  const nativeSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value',
                  )?.set;
                  if (nativeSetter) {
                    nativeSetter.call(inputEl, next);
                    inputEl.setSelectionRange(start + 1, start + 1);
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }
              }
            }
            return;
          }
          const decision = decideKeyInput({
            key: e.key,
            currentValue: currentVal,
            selectionStart: inputEl?.selectionStart,
            selectionEnd: inputEl?.selectionEnd,
            maxDigits: digitLimit,
            allowDecimal: isDecimalAllowed,
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
          allowDecimal: isDecimalAllowed,
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
