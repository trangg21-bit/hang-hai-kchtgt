import { describe, it, expect } from 'vitest';
import {
  normalizeDecimal20_4,
  decimalNumberRule,
  safeNumber,
  parseNumber20,
  getValueFromEvent20,
} from '../utils/numberRuleHelper';

describe('DikeRevetment Number Input & Limit Rules', () => {
  describe('normalizeDecimal20_4 & parseNumber20', () => {
    it('chỉ chấp nhận chữ số và dấu ".", loại bỏ ký tự khác', () => {
      expect(normalizeDecimal20_4('abc123xyz')).toBe('123');
      expect(parseNumber20('12,345.67')).toBe('12345.67');
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
      expect(parseNumber20('12.345678')).toBe('12.3456');
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
    const validator = decimalNumberRule.validator as (rule: unknown, val: unknown) => Promise<void>;

    it('chấp nhận giá trị rỗng', async () => {
      await expect(validator({}, '')).resolves.toBeUndefined();
      await expect(validator({}, null)).resolves.toBeUndefined();
      await expect(validator({}, undefined)).resolves.toBeUndefined();
    });

    it('chấp nhận số hợp lệ tuân thủ các rule (16 chữ số nguyên và 4 chữ số thập phân)', async () => {
      await expect(validator({}, '123')).resolves.toBeUndefined();
      await expect(validator({}, '12345678901234567890')).resolves.toBeUndefined();
      await expect(validator({}, '12.34')).resolves.toBeUndefined();
      await expect(validator({}, '12.3456')).resolves.toBeUndefined();
      await expect(validator({}, '1234567890123456.3456')).resolves.toBeUndefined();
    });

    it('từ chối ký tự không hợp lệ', async () => {
      await expect(validator({}, 'abc')).rejects.toThrow('Chỉ chấp nhận chữ số và dấu "."');
      await expect(validator({}, '12,34')).rejects.toThrow('Chỉ chấp nhận chữ số và dấu "."');
      await expect(validator({}, '-12.34')).rejects.toThrow('Chỉ chấp nhận chữ số và dấu "."');
    });

    it('từ chối khi số sau dấu "." vượt quá 4 chữ số', async () => {
      await expect(validator({}, '12.34567')).rejects.toThrow('Số sau dấu "." tối đa 4 chữ số');
    });

    it('từ chối khi phần nguyên khi có dấu "." vượt quá 16 chữ số', async () => {
      await expect(validator({}, '12345678901234567.3456')).rejects.toThrow('Giới hạn chữ số khi có dấu "." là 16');
    });

    it('từ chối khi số chữ số khi không có dấu "." vượt quá 20', async () => {
      await expect(validator({}, '123456789012345678901')).rejects.toThrow('Giới hạn tối đa 20 chữ số');
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
});
