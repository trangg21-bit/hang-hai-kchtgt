import type { InputNumberProps } from 'antd';
import InputNumber from './LocalizedInputNumber';
import { fontSizeMd, textSecondary } from '../../themetokenchk';
import { formatDotNumber, parseDotNumber } from '../../utils/numFmt';

export type NumberInputWithCountProps = InputNumberProps<string | number> & { maxLength: number };

/**
 * Hiển thị số ký tự / số chữ số đã nhập để giới hạn 5/20 chữ số dễ nhận biết.
 * Hỗ trợ định dạng phân cách hàng nghìn (dấu chấm '.') và chuẩn hóa parseDotNumber.
 */
export function NumberInputWithCount({
  maxLength,
  value,
  onKeyDown,
  onPaste,
  formatter,
  parser,
  ...inputProps
}: NumberInputWithCountProps) {
  const maxDigits = maxLength || 20;
  const valStr = String(value ?? '');
  // Đếm đúng số chữ số thực tế (loại bỏ các ký tự định dạng hiển thị như dấu chấm phân cách)
  const digitsCount = valStr.replace(/\D/g, '').length;

  const effectiveFormatter = formatter ?? formatDotNumber;
  const effectiveParser = (parser ?? parseDotNumber) as (displayValue: string | undefined) => string | number;
  const acceptsDecimal = inputProps.precision !== 0;

  return (
    <InputNumber
      stringMode
      formatter={effectiveFormatter}
      parser={effectiveParser}
      {...inputProps}
      value={value}
      onKeyDown={(e) => {
        // Cho phép các tổ hợp phím tắt Ctrl/Meta/Alt
        if (e.ctrlKey || e.metaKey || e.altKey) {
          onKeyDown?.(e);
          return;
        }

        // Cho phép các phím điều hướng và phím điều khiển chuẩn
        const allowedNavKeys = [
          'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
          'Tab', 'Enter', 'Escape', 'Home', 'End',
        ];
        if (allowedNavKeys.includes(e.key)) {
          onKeyDown?.(e);
          return;
        }

        if (acceptsDecimal && e.key === ',') {
          const inputEl = e.currentTarget as HTMLInputElement;
          if (!inputEl.value.includes(',')) {
            onKeyDown?.(e);
            return;
          }
        }

        // Chỉ cho phép nhập chữ số 0-9; dấu chấm hàng nghìn được formatter tự thêm.
        if (e.key < '0' || e.key > '9') {
          e.preventDefault();
          return;
        }

        const inputEl = e.currentTarget as HTMLInputElement;
        const isReplacing = inputEl && inputEl.selectionStart !== null && inputEl.selectionStart !== inputEl.selectionEnd;
        const currentDigits = (inputEl ? inputEl.value : valStr).replace(/\D/g, '');

        if (!isReplacing && currentDigits.length >= maxDigits) {
          e.preventDefault();
          return;
        }

        onKeyDown?.(e);
      }}
      onPaste={(e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const inputEl = e.currentTarget as HTMLInputElement;
        const currentStr = inputEl ? inputEl.value : valStr;
        const start = inputEl ? (inputEl.selectionStart ?? 0) : currentStr.length;
        const end = inputEl ? (inputEl.selectionEnd ?? start) : start;

        const candidate = `${currentStr.slice(0, start)}${pastedText}${currentStr.slice(end)}`;
        const parsed = String(effectiveParser(candidate));
        const negative = parsed.startsWith('-');
        const unsigned = parsed.replace(/^-/, '');
        const [integerPart = '', decimalPart] = unsigned.split('.');
        const limitedInteger = integerPart.slice(0, maxDigits);
        const remainingDigits = Math.max(0, maxDigits - limitedInteger.length);
        const limitedDecimal = decimalPart?.slice(0, remainingDigits);
        const combined = `${negative ? '-' : ''}${limitedInteger}${decimalPart !== undefined ? `.${limitedDecimal}` : ''}`;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
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
      suffix={<span style={{ color: textSecondary, fontSize: fontSizeMd }}>{digitsCount}/{maxDigits}</span>}
    />
  );
}

export default NumberInputWithCount;
