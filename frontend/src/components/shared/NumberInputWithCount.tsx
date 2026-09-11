import type { InputNumberProps } from 'antd';
import { InputNumber } from 'antd';
import { textSecondary, fontSizeMd } from '../../themetokenchk';
import { normalizeDecimal20_4 } from '../../utils/numberRuleHelper';

export type NumberInputWithCountProps = InputNumberProps<string | number> & { maxLength: number };

/**
 * Hiển thị số ký tự / số chữ số đã nhập để giới hạn 5/20 chữ số dễ nhận biết.
 * Quy tắc nhập số thập phân (maxLength = 20):
 * - Chỉ chấp nhận chữ số và dấu "."
 * - Số sau dấu "." tối đa 4 chữ số
 * - Giới hạn 20 chữ số khi không có dấu "."
 * - Giới hạn chữ số phần nguyên khi có dấu "." là 16 (vẫn cho điền tối đa 4 chữ số sau dấu chấm)
 */
export function NumberInputWithCount({ maxLength, value, onKeyDown, onPaste, ...inputProps }: NumberInputWithCountProps) {
  const valStr = String(value ?? '');
  const digitsCount = valStr.replace(/\./g, '').length;
  const hasDot = valStr.includes('.');
  const maxDigits = maxLength === 20 ? 20 : maxLength;
  const htmlMaxLength = maxLength === 20 ? (hasDot ? 21 : 20) : maxLength;

  return (
    <InputNumber
      stringMode
      {...inputProps}
      value={value}
      maxLength={htmlMaxLength}
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

        // Trường số lượng (maxLength === 5): chỉ cho phép chữ số nguyên
        if (maxLength === 5) {
          if (e.key < '0' || e.key > '9') {
            e.preventDefault();
            return;
          }
          const inputEl = e.currentTarget as HTMLInputElement;
          const isReplacing = inputEl && inputEl.selectionStart !== null && inputEl.selectionStart !== inputEl.selectionEnd;
          if (!isReplacing && digitsCount >= 5) {
            e.preventDefault();
            return;
          }
          onKeyDown?.(e);
          return;
        }

        // Rule: Chỉ chấp nhận chữ số và dấu "."
        if (e.key !== '.' && (e.key < '0' || e.key > '9')) {
          e.preventDefault();
          return;
        }

        const inputEl = e.currentTarget as HTMLInputElement;
        const currentStr = inputEl ? inputEl.value : valStr;
        const start = inputEl ? (inputEl.selectionStart ?? 0) : currentStr.length;
        const end = inputEl ? (inputEl.selectionEnd ?? start) : start;
        const nextStr = currentStr.slice(0, start) + e.key + currentStr.slice(end);

        // Rule: Tối đa 1 dấu "."
        const dotCount = (nextStr.match(/\./g) || []).length;
        if (dotCount > 1) {
          e.preventDefault();
          return;
        }

        const nextHasDot = nextStr.includes('.');
        if (nextHasDot) {
          const dotIdx = nextStr.indexOf('.');
          const intPart = nextStr.slice(0, dotIdx);
          const decPart = nextStr.slice(dotIdx + 1);

          // Rule: Giới hạn chữ số khi có dấu "." là 16 (phần nguyên trước dấu "." tối đa 16 chữ số)
          if (intPart.length > 16) {
            e.preventDefault();
            return;
          }

          // Rule: Số sau dấu "." tối đa 4 chữ số
          if (decPart.length > 4) {
            e.preventDefault();
            return;
          }

          // Rule: Tổng chữ số tối đa 20 chữ số
          const nextDigitsCount = nextStr.replace(/\./g, '').length;
          if (nextDigitsCount > 20) {
            e.preventDefault();
            return;
          }
        } else {
          // Rule: Giới hạn 20 chữ số khi không có dấu "."
          const nextDigitsCount = nextStr.replace(/\./g, '').length;
          if (nextDigitsCount > 20) {
            e.preventDefault();
            return;
          }
        }

        onKeyDown?.(e);
      }}
      onPaste={(e) => {
        if (maxLength === 5) {
          e.preventDefault();
          const pasteText = e.clipboardData.getData('text').replace(/\D/g, '');
          const inputEl = e.currentTarget as HTMLInputElement;
          const currentStr = inputEl ? inputEl.value : valStr;
          const start = inputEl ? (inputEl.selectionStart ?? 0) : currentStr.length;
          const end = inputEl ? (inputEl.selectionEnd ?? start) : start;
          const rawCombined = (currentStr.slice(0, start) + pasteText + currentStr.slice(end)).replace(/\D/g, '').slice(0, 5);

          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          if (inputEl && nativeInputValueSetter) {
            nativeInputValueSetter.call(inputEl, rawCombined);
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } else if (maxLength === 20) {
          e.preventDefault();
          const pasteText = e.clipboardData.getData('text');
          const inputEl = e.currentTarget as HTMLInputElement;
          const currentStr = inputEl ? inputEl.value : valStr;
          const start = inputEl ? (inputEl.selectionStart ?? 0) : currentStr.length;
          const end = inputEl ? (inputEl.selectionEnd ?? start) : start;
          const rawCombined = currentStr.slice(0, start) + pasteText + currentStr.slice(end);
          const normalized = normalizeDecimal20_4(rawCombined);

          // Gán giá trị chuẩn hóa vào DOM input và dispatch event
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
          if (inputEl && nativeInputValueSetter) {
            nativeInputValueSetter.call(inputEl, normalized);
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        onPaste?.(e);
      }}
      suffix={<span style={{ color: textSecondary, fontSize: fontSizeMd }}>{digitsCount}/{maxDigits}</span>}
    />
  );
}

export default NumberInputWithCount;
