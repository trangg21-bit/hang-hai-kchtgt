import { describe, it, expect } from 'vitest';
import {
  normalizeDecimal20_4,
  normalizeDecimal20_4Signed,
  decimalNumberRule,
  decimalNumberRuleSigned,
  safeNumber,
  parseNumber20,
  parseNumber20Signed,
  getValueFromEvent20,
  getValueFromEvent20Signed,
  safeDecimal,
  safeDecimalSigned,
} from '../utils/numberRuleHelper';

describe('DikeRevetment Number Input & Limit Rules', () => {
  describe('normalizeDecimal20_4 & parseNumber20', () => {
    it('nhận dấu chấm hàng nghìn và dấu phẩy thập phân', () => {
      expect(normalizeDecimal20_4('abc123xyz')).toBe('123');
      expect(parseNumber20('12.345,67')).toBe('12345.67');
      expect(normalizeDecimal20_4('12a.3b4c')).toBe('12.34');
      expect(normalizeDecimal20_4('-15.2')).toBe('15.2');
    });

    it('giới hạn tối đa 20 chữ số khi không có dấu "."', () => {
      const twentyDigits = '12345678901234567890';
      const twentyFiveDigits = '1234567890123456789012345';
      expect(normalizeDecimal20_4(twentyDigits)).toBe(twentyDigits);
      expect(parseNumber20(twentyFiveDigits)).toBe(twentyDigits);
      expect(normalizeDecimal20_4(twentyFiveDigits).length).toBe(20);
    });

    it('số sau dấu "." tối đa 4 chữ số', () => {
      expect(normalizeDecimal20_4('12.3')).toBe('12.3');
      expect(normalizeDecimal20_4('12.3456')).toBe('12.3456');
      expect(parseNumber20('12,345678')).toBe('12.3456');
    });

    it('giới hạn chữ số phần nguyên khi có dấu "." là 16 và phần thập phân tối đa 4 chữ số', () => {
      // 16 chữ số nguyên + 4 chữ số thập phân = 20 chữ số
      expect(normalizeDecimal20_4('1234567890123456.1234')).toBe('1234567890123456.1234');
      // 18 chữ số nguyên + 4 chữ số thập phân -> phần nguyên bị cắt về 16
      const result = normalizeDecimal20_4('123456789012345678.1234');
      expect(result).toBe('1234567890123456.1234');
    });

    it('getValueFromEvent20 trả về string chuẩn hóa hoặc null', () => {
      expect(getValueFromEvent20('')).toBeNull();
      expect(getValueFromEvent20(null)).toBeNull();
      expect(getValueFromEvent20('12.345')).toBe('12.345');
    });
  });

  describe('decimalNumberRule validation', () => {
    const validator = (
      decimalNumberRule as unknown as { validator: (rule: unknown, val: unknown) => Promise<void> }
    ).validator;

    it('chấp nhận giá trị rỗng', async () => {
      await expect(validator({}, '')).resolves.toBeUndefined();
      await expect(validator({}, null)).resolves.toBeUndefined();
      await expect(validator({}, undefined)).resolves.toBeUndefined();
    });

    it('chấp nhận số hợp lệ tuân thủ các rule (16 chữ số nguyên và 4 chữ số thập phân)', async () => {
      await expect(validator({}, '123')).resolves.toBeUndefined();
      await expect(validator({}, '12345678901234567890')).resolves.toBeUndefined();
      await expect(validator({}, '12.34')).resolves.toBeUndefined();
      await expect(validator({}, '12,34')).resolves.toBeUndefined();
      await expect(validator({}, '12.3456')).resolves.toBeUndefined();
      await expect(validator({}, '1234567890123456.3456')).resolves.toBeUndefined();
    });

    it('từ chối ký tự không hợp lệ', async () => {
      await expect(validator({}, 'abc')).rejects.toThrow('Chỉ chấp nhận chữ số');
      await expect(validator({}, '-12.34')).rejects.toThrow('Chỉ chấp nhận chữ số');
    });

    it('từ chối khi số sau dấu "." vượt quá 4 chữ số', async () => {
      await expect(validator({}, '12.34567')).rejects.toThrow('Phần thập phân tối đa 4 chữ số');
    });

    it('từ chối khi phần nguyên khi có dấu "." vượt quá 16 chữ số', async () => {
      await expect(validator({}, '12345678901234567.3456')).rejects.toThrow('Giới hạn phần nguyên là 16 chữ số');
    });

    it('từ chối khi số chữ số khi không có dấu "." vượt quá 20', async () => {
      await expect(validator({}, '123456789012345678901')).rejects.toThrow('Giới hạn tối đa 20 chữ số');
    });
  });

  describe('decimalNumberRuleSigned & normalizeDecimal20_4Signed (Cao trình đỉnh — cho phép số âm)', () => {
    const signedValidator = (
      decimalNumberRuleSigned as unknown as { validator: (rule: unknown, val: unknown) => Promise<void> }
    ).validator;

    it('chấp nhận số âm hợp lệ, vẫn chấp nhận số dương và giá trị rỗng', async () => {
      await expect(signedValidator({}, '-12.34')).resolves.toBeUndefined();
      await expect(signedValidator({}, '-12,34')).resolves.toBeUndefined();
      await expect(signedValidator({}, '-0.5')).resolves.toBeUndefined();
      await expect(signedValidator({}, '-1234567890123456.1234')).resolves.toBeUndefined();
      await expect(signedValidator({}, '12.34')).resolves.toBeUndefined();
      await expect(signedValidator({}, '12,34')).resolves.toBeUndefined();
      await expect(signedValidator({}, '')).resolves.toBeUndefined();
      await expect(signedValidator({}, null)).resolves.toBeUndefined();
    });

    it('từ chối dấu "-" trần, dấu "-" sai vị trí và vẫn giữ nguyên các giới hạn chữ số', async () => {
      await expect(signedValidator({}, '-')).rejects.toThrow('Chỉ chấp nhận chữ số và dấu "."');
      await expect(signedValidator({}, '12-34')).rejects.toThrow('Chỉ chấp nhận chữ số và dấu "."');
      await expect(signedValidator({}, '--1')).rejects.toThrow('Chỉ chấp nhận chữ số và dấu "."');
      await expect(signedValidator({}, '-12a34')).rejects.toThrow('Chỉ chấp nhận chữ số và dấu "."');

      await expect(signedValidator({}, '-12345678901234567.3456')).rejects.toThrow(
        'Giới hạn chữ số khi có dấu "." là 16',
      );
      await expect(signedValidator({}, '-12.34567')).rejects.toThrow('Số sau dấu "." tối đa 4 chữ số');
      await expect(signedValidator({}, '-123456789012345678901')).rejects.toThrow(
        'Giới hạn tối đa 20 chữ số',
      );
    });

    it('normalizeDecimal20_4Signed / parseNumber20Signed GIỮ dấu "-" và chuẩn hóa như bản không dấu', () => {
      expect(normalizeDecimal20_4Signed('-12.5')).toBe('-12.5');
      expect(parseNumber20Signed('-12,345.67')).toBe('-12345.67');
      expect(normalizeDecimal20_4Signed('99999999999999999999.123456')).toBe('9999999999999999.1234');
      expect(normalizeDecimal20_4Signed('-99999999999999999999.123456')).toBe('-9999999999999999.1234');
      // bản không dấu vẫn loại bỏ dấu âm như cũ
      expect(normalizeDecimal20_4('-12.5')).toBe('12.5');
      expect(normalizeDecimal20_4Signed('abc')).toBe('');
      expect(normalizeDecimal20_4Signed('-')).toBe('-');
    });

    it('parseNumber20Signed đồng bộ 100% với parseNumber20 nhưng giữ nguyên số âm (Cao trình đỉnh vs Chiều dài)', () => {
      // Định dạng số phân tách hàng nghìn bằng dấu chấm và thập phân bằng dấu phẩy chuẩn vi-VN
      expect(parseNumber20('12.345,67')).toBe('12345.67');
      expect(parseNumber20Signed('-12.345,67')).toBe('-12345.67');
      expect(parseNumber20Signed('12.345,67')).toBe('12345.67');

      // Số có dấu chấm hàng nghìn không bị parse nhầm thành số thập phân
      expect(parseNumber20('1.234')).toBe('1234');
      expect(parseNumber20Signed('1.234')).toBe('1234');
      expect(parseNumber20Signed('-1.234')).toBe('-1234');

      // Số thập phân có dấu phẩy
      expect(parseNumber20('12,34')).toBe('12.34');
      expect(parseNumber20Signed('12,34')).toBe('12.34');
      expect(parseNumber20Signed('-12,34')).toBe('-12.34');

      // Số 4 chữ số thập phân (như trong ảnh test 9,9999)
      expect(parseNumber20('9,9999')).toBe('9.9999');
      expect(parseNumber20Signed('9,9999')).toBe('9.9999');
      expect(parseNumber20Signed('-9,9999')).toBe('-9.9999');

      // Trạng thái đang gõ dấu "-" hoặc số 0
      expect(parseNumber20Signed('-')).toBe('-');
      expect(parseNumber20Signed('-0')).toBe('-0');
      expect(parseNumber20Signed('-0,')).toBe('-0.');
      expect(parseNumber20('0,')).toBe('0.');
    });

    it('getValueFromEvent20Signed trả null cho chuỗi rỗng và giữ dấu âm khi có giá trị', () => {
      expect(getValueFromEvent20Signed('')).toBeNull();
      expect(getValueFromEvent20Signed(null)).toBeNull();
      expect(getValueFromEvent20Signed('-15.2')).toBe('-15.2');
      expect(getValueFromEvent20Signed('12.345')).toBe('12.345');
    });

    it('safeDecimalSigned giữ dấu âm khi dựng payload API (Cao trình đỉnh)', () => {
      expect(safeDecimalSigned('-12.5')).toBe('-12.5');
      expect(safeDecimalSigned('-12.')).toBe('-12');
      expect(safeDecimalSigned('12.5')).toBe('12.5');
      expect(safeDecimalSigned('-')).toBeUndefined();
      expect(safeDecimalSigned('')).toBeUndefined();
      expect(safeDecimalSigned(null)).toBeUndefined();
      // bản không dấu vẫn bỏ dấu âm như cũ — không đổi hành vi các trường khác
      expect(safeDecimal('-12.5')).toBe('12.5');
    });
  });

  describe('safeNumber conversion for API payload', () => {
    it('chuyển đổi chuỗi số hợp lệ thành number', () => {
      expect(safeNumber('123.45')).toBe(123.45);
      expect(safeNumber('12.')).toBe(12);
      expect(safeNumber(45.67)).toBe(45.67);
    });

    it('trả về undefined cho chuỗi rỗng hoặc không hợp lệ', () => {
      expect(safeNumber('')).toBeUndefined();
      expect(safeNumber(null)).toBeUndefined();
      expect(safeNumber(undefined)).toBeUndefined();
      expect(safeNumber('.')).toBeUndefined();
      expect(safeNumber('invalid')).toBeUndefined();
    });
  });

  describe('DikeRevetment display number formatting (fmtInputNumber, normalizeSafeNumber, fmtNum)', () => {
    it('fmtInputNumber hiển thị đúng "1100" thay vì "1100.00"', async () => {
      const { fmtInputNumber } = await import('../utils/numFmt');
      expect(fmtInputNumber('1100.00')).toBe('1.100');
      expect(fmtInputNumber('1100')).toBe('1.100');
      expect(fmtInputNumber(1100)).toBe('1.100');
      expect(fmtInputNumber('1100.0')).toBe('1.100');
      expect(fmtInputNumber('1100.50')).toBe('1.100,5');
      expect(fmtInputNumber('1100.25')).toBe('1.100,25');
      expect(fmtInputNumber('1100.1234')).toBe('1.100,1234');
    });

    it('fmtInputNumber định dạng vi-VN ngay khi người dùng đang nhập', async () => {
      const { fmtInputNumber } = await import('../utils/numFmt');
      expect(fmtInputNumber('1100.', { userTyping: true })).toBe('1.100,');
      expect(fmtInputNumber('1100.0', { userTyping: true })).toBe('1.100,0');
      expect(fmtInputNumber('1100.00', { userTyping: true })).toBe('1.100,00');
    });

    it('normalizeSafeNumber loại bỏ .00 / .0000 thừa khi nạp bản ghi từ backend', async () => {
      const { normalizeSafeNumber } = await import('../utils/numFmt');
      expect(normalizeSafeNumber('1100.00')).toBe('1100');
      expect(normalizeSafeNumber('1100.0000')).toBe('1100');
      expect(normalizeSafeNumber('1100')).toBe('1100');
      expect(normalizeSafeNumber(1100)).toBe('1100');
      expect(normalizeSafeNumber('1100.50')).toBe('1100.5');
    });

    it('fmtNum loại bỏ đuôi .00 thừa trong chế độ xem chi tiết', async () => {
      const { fmtNum } = await import('../utils/numFmt');
      expect(fmtNum('1100.00')).toBe('1.100');
      expect(fmtNum('1100')).toBe('1.100');
      expect(fmtNum(1100)).toBe('1.100');
      expect(fmtNum('1100.50')).toBe('1.100,5');
      expect(fmtNum('1100.25')).toBe('1.100,25');
    });
  });
});
