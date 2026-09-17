import type { InputNumberProps } from 'antd';
import { InputNumber } from 'antd';
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

        // Chỉ cho phép nhập chữ số 0-9
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
        const pasteDigits = e.clipboardData.getData('text').replace(/\D/g, '');
        const inputEl = e.currentTarget as HTMLInputElement;
        const currentStr = inputEl ? inputEl.value : valStr;
        const start = inputEl ? (inputEl.selectionStart ?? 0) : currentStr.length;
        const end = inputEl ? (inputEl.selectionEnd ?? start) : start;

        // Tách chuỗi trước và sau vị trí paste, giữ lại chữ số
        const beforeDigits = currentStr.slice(0, start).replace(/\D/g, '');
        const afterDigits = currentStr.slice(end).replace(/\D/g, '');
        const combined = (beforeDigits + pasteDigits + afterDigits).slice(0, maxDigits);

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        if (inputEl && nativeInputValueSetter) {
          nativeInputValueSetter.call(inputEl, combined);
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        onPaste?.(e);
      }}
      suffix={<span style={{ color: textSecondary, fontSize: fontSizeMd }}>{digitsCount}/{maxDigits}</span>}
    />
  );
}

export default NumberInputWithCount;
