import { describe, it, expect } from 'vitest';
import { parseNumber5, getValueFromEvent5, integer5Rule } from '../utils/numberRuleHelper';

describe('VHF Quantity Input Rules (5-digit integer)', () => {
  describe('parseNumber5', () => {
    it('chỉ giữ chữ số, loại bỏ ký tự không phải số và dấu chấm', () => {
      expect(parseNumber5('123')).toBe('123');
      expect(parseNumber5('12.34')).toBe('1234');
      expect(parseNumber5('abc99')).toBe('99');
      expect(parseNumber5('-5')).toBe('5');
    });

    it('giới hạn tối đa 5 chữ số', () => {
      expect(parseNumber5('12345')).toBe('12345');
      expect(parseNumber5('123456')).toBe('12345');
      expect(parseNumber5('9999999999')).toBe('99999');
    });

    it('xử lý chuỗi rỗng và giá trị null/undefined', () => {
      expect(parseNumber5('')).toBe('');
      expect(parseNumber5(null)).toBe('');
      expect(parseNumber5(undefined)).toBe('');
    });
  });

  describe('getValueFromEvent5', () => {
    it('chuyển đổi chuỗi chữ số hợp lệ thành kiểu số nguyên', () => {
      expect(getValueFromEvent5('123')).toBe(123);
      expect(getValueFromEvent5('5')).toBe(5);
      expect(getValueFromEvent5('99999')).toBe(99999);
    });

    it('giới hạn tối đa 5 chữ số khi chuyển sang số', () => {
      expect(getValueFromEvent5('123456')).toBe(12345);
    });

    it('trả về null khi giá trị rỗng hoặc null', () => {
      expect(getValueFromEvent5('')).toBeNull();
      expect(getValueFromEvent5(null)).toBeNull();
      expect(getValueFromEvent5(undefined)).toBeNull();
    });
  });

  describe('integer5Rule validator', () => {
    const validator = integer5Rule.validator as (rule: unknown, val: unknown) => Promise<void>;

    it('chấp nhận giá trị rỗng', async () => {
      await expect(validator({}, '')).resolves.toBeUndefined();
      await expect(validator({}, null)).resolves.toBeUndefined();
      await expect(validator({}, undefined)).resolves.toBeUndefined();
    });

    it('chấp nhận số nguyên từ 1 đến 5 chữ số', async () => {
      await expect(validator({}, '1')).resolves.toBeUndefined();
      await expect(validator({}, '123')).resolves.toBeUndefined();
      await expect(validator({}, '99999')).resolves.toBeUndefined();
      await expect(validator({}, 10)).resolves.toBeUndefined();
    });

    it('từ chối khi chứa ký tự không phải số nguyên (dấu chấm, chữ cái)', async () => {
      await expect(validator({}, '12.34')).rejects.toThrow('Số lượng phải là số nguyên');
      await expect(validator({}, '12a')).rejects.toThrow('Số lượng phải là số nguyên');
    });

    it('từ chối khi vượt quá 5 chữ số', async () => {
      await expect(validator({}, '123456')).rejects.toThrow('Số lượng tối đa 5 chữ số');
    });

    it('từ chối khi số lượng <= 0', async () => {
      await expect(validator({}, '0')).rejects.toThrow('Số lượng phải lớn hơn 0');
    });
  });
});
