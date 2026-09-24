import { describe, it, expect } from 'vitest';
import {
  buildPastedValue,
  countDigits,
  decideKeyInput,
  sanitizeNumberInput,
} from './numberInputGuards';

/**
 * Luật nhập số của NumberInputWithCount:
 * 1. Giới hạn N CHỮ SỐ (đếm chữ số, không đếm '-' và '.'), tùy chỉnh qua maxDigits.
 * 2. Duy nhất 0-9 hợp lệ; '-' và '.' chỉ khi được bật tường minh.
 * 3. allowNegative → cho 1 dấu '-' ở đầu.
 * 4. Mặc định số nguyên; allowDecimal mới cho dấu '.'.
 * 5. Cấm tuyệt đối tự thêm '.'/',' làm phân tách hàng nghìn.
 */
describe('numberInputGuards — luật nhập số của NumberInputWithCount', () => {
  describe('Rule 1: giới hạn N CHỮ SỐ (đếm chữ số, không đếm dấu)', () => {
    it('đếm đúng chữ số, bỏ qua dấu "-", "." và dấu phân tách', () => {
      expect(countDigits('99999999999999999999')).toBe(20);
      expect(countDigits('-12.5')).toBe(3);
      expect(countDigits('1.234.567')).toBe(7);
      expect(countDigits('')).toBe(0);
    });

    it('mặc định 20 chữ số, giữ đủ 20 chữ số đã nhập', () => {
      expect(sanitizeNumberInput('99999999999999999999')).toBe('99999999999999999999');
      expect(sanitizeNumberInput('999999999999999999999')).toBe('99999999999999999999');
    });

    it('tùy chỉnh maxDigits (ví dụ 5 cho số lượng nhân sự)', () => {
      expect(sanitizeNumberInput('1234567', { maxDigits: 5 })).toBe('12345');
      expect(
        decideKeyInput({ key: '6', currentValue: '12345', selectionStart: 5, selectionEnd: 5, maxDigits: 5 }),
      ).toBe('block');
      expect(
        decideKeyInput({ key: '5', currentValue: '1234', selectionStart: 4, selectionEnd: 4, maxDigits: 5 }),
      ).toBe('allow');
    });
  });

  describe('Rule 2: duy nhất 0-9 là hợp lệ', () => {
    it('chặn mọi ký tự không phải số ở tầng phím', () => {
      ['a', 'e', ' ', '+', ',', '*', 'E'].forEach((key) => {
        expect(decideKeyInput({ key, currentValue: '12', selectionStart: 2, selectionEnd: 2 })).toBe('block');
      });
    });

    it('bỏ mọi ký tự lạ khi dán', () => {
      expect(sanitizeNumberInput('12abc34')).toBe('1234');
      expect(sanitizeNumberInput('12 34')).toBe('1234');
      expect(sanitizeNumberInput('1e5')).toBe('15');
    });
  });

  describe('Rule 3: allowNegative — dấu "-" chỉ ở đầu, phải bật tường minh', () => {
    it('mặc định KHÔNG cho nhập dấu "-"', () => {
      expect(decideKeyInput({ key: '-', currentValue: '', selectionStart: 0, selectionEnd: 0 })).toBe('block');
      expect(sanitizeNumberInput('-12')).toBe('12');
    });

    it('bật allowNegative mới cho 1 dấu "-" ở đầu', () => {
      expect(
        decideKeyInput({
          key: '-',
          currentValue: '',
          selectionStart: 0,
          selectionEnd: 0,
          allowNegative: true,
        }),
      ).toBe('allow');
      expect(sanitizeNumberInput('-12', { allowNegative: true })).toBe('-12');
      // dấu '-' thứ hai bị chặn
      expect(
        decideKeyInput({
          key: '-',
          currentValue: '-12',
          selectionStart: 1,
          selectionEnd: 1,
          allowNegative: true,
        }),
      ).toBe('block');
      // dấu '-' ở giữa chuỗi bị bỏ
      expect(sanitizeNumberInput('1-2-3', { allowNegative: true })).toBe('123');
    });
  });

  describe('Rule 4: mặc định số nguyên, allowDecimal mới cho dấu "."', () => {
    it('mặc định chặn dấu "." (đúng lỗi đã báo ở lightRange)', () => {
      expect(
        decideKeyInput({
          key: '.',
          currentValue: '99999999999999999999',
          selectionStart: 20,
          selectionEnd: 20,
        }),
      ).toBe('block');
      expect(sanitizeNumberInput('12.5')).toBe('125');
    });

    it('bật allowDecimal thì cho 1 dấu "." và tối đa 4 chữ số thập phân', () => {
      expect(
        decideKeyInput({
          key: '.',
          currentValue: '12',
          selectionStart: 2,
          selectionEnd: 2,
          allowDecimal: true,
        }),
      ).toBe('allow');
      expect(sanitizeNumberInput('12.5', { allowDecimal: true })).toBe('12.5');
      expect(sanitizeNumberInput('12.123456', { allowDecimal: true })).toBe('12.1234');
      // dấu '.' thứ hai bị chặn
      expect(
        decideKeyInput({
          key: '.',
          currentValue: '12.5',
          selectionStart: 4,
          selectionEnd: 4,
          allowDecimal: true,
        }),
      ).toBe('block');
    });

    it('CHƯA có dấu "." thì vẫn cho nhập đủ maxDigits chữ số (20)', () => {
      expect(sanitizeNumberInput('99999999999999999999', { allowDecimal: true })).toBe(
        '99999999999999999999',
      );
      expect(
        decideKeyInput({
          key: '9',
          currentValue: '9999999999999999999',
          selectionStart: 19,
          selectionEnd: 19,
          allowDecimal: true,
        }),
      ).toBe('allow');
    });

    it('phần nguyên đang > 16 chữ số thì CHẶN phím "." (không cắt bớt số đang nhập)', () => {
      expect(
        decideKeyInput({
          key: '.',
          currentValue: '99999999999999999999',
          selectionStart: 20,
          selectionEnd: 20,
          allowDecimal: true,
        }),
      ).toBe('block');
      // đúng 16 chữ số thì cho nhập dấu '.'
      expect(
        decideKeyInput({
          key: '.',
          currentValue: '9999999999999999',
          selectionStart: 16,
          selectionEnd: 16,
          allowDecimal: true,
        }),
      ).toBe('allow');
      // dán chuỗi 20 chữ số phần nguyên kèm '.' -> dấu '.' bị từ chối, GIỮ ĐỦ 20 chữ số
      expect(sanitizeNumberInput('99999999999999999999.5', { allowDecimal: true })).toBe(
        '99999999999999999999',
      );
    });

    it('khi giá trị ĐÃ có dấu ".": phần nguyên ≤ 16, phần thập phân ≤ 4', () => {
      expect(sanitizeNumberInput('1234567890123456.123456', { allowDecimal: true })).toBe(
        '1234567890123456.1234',
      );
      // chèn thêm chữ số vào phần nguyên khi đã có dấu '.' -> chặn, giữ nguyên giá trị
      expect(
        decideKeyInput({
          key: '7',
          currentValue: '1234567890123456.5',
          selectionStart: 16,
          selectionEnd: 16,
          allowDecimal: true,
        }),
      ).toBe('block');
    });

    it('kết hợp allowNegative + allowDecimal cho số âm thập phân', () => {
      expect(sanitizeNumberInput('-12.5', { allowNegative: true, allowDecimal: true })).toBe('-12.5');
      expect(sanitizeNumberInput('-12.5', { allowDecimal: true })).toBe('12.5');
    });

    it('hỗ trợ đầy đủ dấu phẩy "," làm dấu thập phân chuẩn vi-VN khi bật allowDecimal', () => {
      // Cho phép gõ dấu phẩy ',' vào ô số
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '12',
          selectionStart: 2,
          selectionEnd: 2,
          allowDecimal: true,
        }),
      ).toBe('allow');

      // Chặn dấu phẩy thứ hai
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '12,5',
          selectionStart: 4,
          selectionEnd: 4,
          allowDecimal: true,
        }),
      ).toBe('block');

      // Chặn dấu '.' khi đã có dấu ',' và ngược lại
      expect(
        decideKeyInput({
          key: '.',
          currentValue: '12,5',
          selectionStart: 4,
          selectionEnd: 4,
          allowDecimal: true,
        }),
      ).toBe('block');
      // Cho phép gõ dấu phẩy ',' khi giá trị đang hiển thị có 4, 5, 6 chữ số
      // (được formatter định dạng hàng nghìn vi-VN có 1 dấu chấm: 1.234, 12.345, 123.456)
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '1.234',
          selectionStart: 5,
          selectionEnd: 5,
          allowDecimal: true,
        }),
      ).toBe('allow');
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '12.345',
          selectionStart: 6,
          selectionEnd: 6,
          allowDecimal: true,
        }),
      ).toBe('allow');
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '123.456',
          selectionStart: 7,
          selectionEnd: 7,
          allowDecimal: true,
        }),
      ).toBe('allow');
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '-1.234',
          selectionStart: 6,
          selectionEnd: 6,
          allowDecimal: true,
          allowNegative: true,
        }),
      ).toBe('allow');
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '-12.345',
          selectionStart: 7,
          selectionEnd: 7,
          allowDecimal: true,
          allowNegative: true,
        }),
      ).toBe('allow');
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '-123.456',
          selectionStart: 8,
          selectionEnd: 8,
          allowDecimal: true,
          allowNegative: true,
        }),
      ).toBe('allow');

      // Vẫn chặn dấu ',' khi giá trị đã có dấu thập phân thực sự
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '12.5',
          selectionStart: 4,
          selectionEnd: 4,
          allowDecimal: true,
        }),
      ).toBe('block');
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '1.234,',
          selectionStart: 6,
          selectionEnd: 6,
          allowDecimal: true,
        }),
      ).toBe('block');
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '1.234,5',
          selectionStart: 7,
          selectionEnd: 7,
          allowDecimal: true,
        }),
      ).toBe('block');

      // Cho phép thay thế dấu ',' khi bôi đen
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '12,5',
          selectionStart: 2,
          selectionEnd: 3,
          allowDecimal: true,
        }),
      ).toBe('allow');

      // Chặn dấu ',' khi phần nguyên đang có > 16 chữ số
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '99999999999999999999',
          selectionStart: 20,
          selectionEnd: 20,
          allowDecimal: true,
        }),
      ).toBe('block');

      // Cho phép dấu ',' khi phần nguyên đúng 16 chữ số
      expect(
        decideKeyInput({
          key: ',',
          currentValue: '9999999999999999',
          selectionStart: 16,
          selectionEnd: 16,
          allowDecimal: true,
        }),
      ).toBe('allow');

      // Chặn thêm chữ số vào phần nguyên khi đã có 16 chữ số kèm dấu ','
      expect(
        decideKeyInput({
          key: '7',
          currentValue: '1234567890123456,5',
          selectionStart: 16,
          selectionEnd: 16,
          allowDecimal: true,
        }),
      ).toBe('block');

      // Chặn vượt quá 4 chữ số phần thập phân sau dấu ','
      expect(
        decideKeyInput({
          key: '5',
          currentValue: '12,1234',
          selectionStart: 7,
          selectionEnd: 7,
          allowDecimal: true,
        }),
      ).toBe('block');
      expect(
        decideKeyInput({
          key: '4',
          currentValue: '12,123',
          selectionStart: 6,
          selectionEnd: 6,
          allowDecimal: true,
        }),
      ).toBe('allow');

      // Chuẩn hóa và dán chuỗi với dấu phẩy ','
      expect(sanitizeNumberInput('12,5', { allowDecimal: true })).toBe('12,5');
      expect(sanitizeNumberInput('12,123456', { allowDecimal: true })).toBe('12,1234');
      expect(sanitizeNumberInput('1234567890123456,123456', { allowDecimal: true })).toBe(
        '1234567890123456,1234',
      );
      expect(sanitizeNumberInput('-12,5', { allowNegative: true, allowDecimal: true })).toBe('-12,5');
      expect(sanitizeNumberInput('1.234,56', { allowDecimal: true })).toBe('1234,56');
    });
  });

  describe('Rule 5: cấm tự thêm dấu "." / "," phân tách hàng nghìn', () => {
    it('bỏ dấu phân tách khi dán chuỗi đã định dạng', () => {
      expect(sanitizeNumberInput('1.234.567')).toBe('1234567');
      expect(sanitizeNumberInput('1,234,567')).toBe('1234567');
      expect(sanitizeNumberInput('99.999.999.999.999.999.999')).toBe('99999999999999999999');
    });

    it('chặn phím "," ở tầng phím', () => {
      expect(
        decideKeyInput({ key: ',', currentValue: '1234', selectionStart: 4, selectionEnd: 4 }),
      ).toBe('block');
    });

    it('dán vào ô số vẫn không sinh dấu phân tách', () => {
      expect(
        buildPastedValue({
          currentValue: '',
          pastedText: '1.234.567',
          selectionStart: 0,
          selectionEnd: 0,
          maxDigits: 20,
        }),
      ).toBe('1234567');

      expect(
        buildPastedValue({
          currentValue: '',
          pastedText: '99999999999999999999.5',
          selectionStart: 0,
          selectionEnd: 0,
          maxDigits: 20,
        }),
      ).toBe('99999999999999999999');

      expect(
        buildPastedValue({
          currentValue: '1234',
          pastedText: '99',
          selectionStart: 2,
          selectionEnd: 2,
          maxDigits: 20,
        }),
      ).toBe('129934');

      // dấu '-' chen vào giữa chuỗi bị bỏ — '-' chỉ hợp lệ ở đầu
      expect(
        buildPastedValue({
          currentValue: '12',
          pastedText: '-5.25',
          selectionStart: 2,
          selectionEnd: 2,
          maxDigits: 20,
          allowDecimal: true,
          allowNegative: true,
        }),
      ).toBe('125.25');
    });
  });

  describe('Không cắt ngầm: gõ ký tự không hợp lệ thì ký tự đó không vào ô', () => {
    it('bôi đen rồi gõ lại chính ký tự đó vẫn được phép', () => {
      expect(
        decideKeyInput({
          key: '.',
          currentValue: '12.5',
          selectionStart: 2,
          selectionEnd: 3,
          allowDecimal: true,
        }),
      ).toBe('allow');
    });

    it('vượt số chữ số thì chặn phím, không đổi giá trị đang có', () => {
      expect(
        decideKeyInput({
          key: '9',
          currentValue: '99999999999999999999',
          selectionStart: 20,
          selectionEnd: 20,
        }),
      ).toBe('block');
    });
  });
});
