import { describe, it, expect } from 'vitest';
import {
  normalizeDecimal20_4,
  parseNumber20,
  getValueFromEvent20,
  decimalNumberRule,
  safeDecimal,
  parseNumber5,
  getValueFromEvent5,
  integer5NonNegativeRule,
} from '../pages/ship-repair-yard/shipRepairYardRules';

describe('ShipRepairYard Number Input Rules (/ship-repair-yard parity with /beacon-stations)', () => {
  describe('Trường "Diện tích nhà xưởng, kho bãi" (workshopArea) - Tối đa 20 chữ số', () => {
    describe('normalizeDecimal20_4 & parseNumber20', () => {
      it('chỉ chấp nhận chữ số và dấu ".", loại bỏ ký tự khác', () => {
        expect(normalizeDecimal20_4('abc123xyz')).toBe('123');
        expect(normalizeDecimal20_4('12,345.67')).toBe('12345.67');
        expect(normalizeDecimal20_4('12a.3b4c')).toBe('12.34');
        expect(normalizeDecimal20_4('-15.2')).toBe('15.2');
        expect(parseNumber20('abc99.88')).toBe('99.88');
      });

      it('giới hạn tối đa 20 chữ số khi không có dấu "."', () => {
        const twentyDigits = '12345678901234567890';
        const twentyFiveDigits = '1234567890123456789012345';
        expect(normalizeDecimal20_4(twentyDigits)).toBe(twentyDigits);
        expect(normalizeDecimal20_4(twentyFiveDigits)).toBe(twentyDigits);
        expect(normalizeDecimal20_4(twentyFiveDigits).length).toBe(20);
      });

      it('số sau dấu "." tối đa 4 chữ số', () => {
        expect(normalizeDecimal20_4('12.3')).toBe('12.3');
        expect(normalizeDecimal20_4('12.3456')).toBe('12.3456');
        expect(normalizeDecimal20_4('12.345678')).toBe('12.3456');
      });

      it('giới hạn chữ số phần nguyên khi có dấu "." là 16 và phần thập phân tối đa 4 chữ số', () => {
        // 16 chữ số nguyên + 4 chữ số thập phân = 20 chữ số
        expect(normalizeDecimal20_4('1234567890123456.1234')).toBe('1234567890123456.1234');

        // 18 chữ số nguyên + 4 chữ số thập phân -> phần nguyên bị cắt về 16, thập phân giữ 4
        expect(normalizeDecimal20_4('123456789012345678.1234')).toBe('1234567890123456.1234');

        // 16 chữ số nguyên + 6 chữ số thập phân -> thập phân bị cắt về 4
        expect(normalizeDecimal20_4('1234567890123456.123456')).toBe('1234567890123456.1234');
      });

      it('chỉ giữ dấu "." đầu tiên khi có nhiều dấu "."', () => {
        expect(normalizeDecimal20_4('12.34.56')).toBe('12.3456');
      });

      it('xử lý chuỗi rỗng và null/undefined', () => {
        expect(normalizeDecimal20_4('')).toBe('');
        expect(normalizeDecimal20_4(null)).toBe('');
        expect(normalizeDecimal20_4(undefined)).toBe('');
      });
    });

    describe('getValueFromEvent20', () => {
      it('chuẩn hóa và trả về chuỗi hoặc null', () => {
        expect(getValueFromEvent20('123.45')).toBe('123.45');
        expect(getValueFromEvent20('')).toBeNull();
        expect(getValueFromEvent20(null)).toBeNull();
        expect(getValueFromEvent20(undefined)).toBeNull();
      });
    });

    describe('decimalNumberRule validator', () => {
      const validator = decimalNumberRule.validator as (rule: unknown, val: unknown) => Promise<void>;

      it('chấp nhận giá trị rỗng', async () => {
        await expect(validator({}, '')).resolves.toBeUndefined();
        await expect(validator({}, null)).resolves.toBeUndefined();
        await expect(validator({}, undefined)).resolves.toBeUndefined();
      });

      it('chấp nhận số hợp lệ tuân thủ các rule (16 chữ số nguyên và 4 chữ số thập phân, hoặc 20 số nguyên)', async () => {
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

    describe('safeDecimal', () => {
      it('bảo toàn chuỗi số lớn đến 20 chữ số tránh bị float làm tròn', () => {
        expect(safeDecimal('1234567890123456.1234')).toBe('1234567890123456.1234');
        expect(safeDecimal('12345678901234567890')).toBe('12345678901234567890');
        expect(safeDecimal('123.')).toBe('123');
      });

      it('trả về undefined cho giá trị rỗng/null/undefined', () => {
        expect(safeDecimal('')).toBeUndefined();
        expect(safeDecimal(null)).toBeUndefined();
        expect(safeDecimal(undefined)).toBeUndefined();
      });
    });
  });

  describe('Trường "Số lượng triền đà" (slipwayCount) - Số nguyên tối đa 5 chữ số', () => {
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
        expect(getValueFromEvent5('0')).toBe(0);
        expect(getValueFromEvent5('5')).toBe(5);
        expect(getValueFromEvent5('99999')).toBe(99999);
      });

      it('giới hạn tối đa 5 chữ số khi chuyển sang số', () => {
        expect(getValueFromEvent5('123456')).toBe(12345);
      });

      it('trả về null khi giá trị rỗng hoặc null/undefined', () => {
        expect(getValueFromEvent5('')).toBeNull();
        expect(getValueFromEvent5(null)).toBeNull();
        expect(getValueFromEvent5(undefined)).toBeNull();
      });
    });

    describe('integer5NonNegativeRule validator', () => {
      const validator = integer5NonNegativeRule.validator as (rule: unknown, val: unknown) => Promise<void>;

      it('chấp nhận giá trị rỗng', async () => {
        await expect(validator({}, '')).resolves.toBeUndefined();
        await expect(validator({}, null)).resolves.toBeUndefined();
        await expect(validator({}, undefined)).resolves.toBeUndefined();
      });

      it('chấp nhận số 0 và số nguyên dương từ 1 đến 5 chữ số', async () => {
        await expect(validator({}, '0')).resolves.toBeUndefined();
        await expect(validator({}, 0)).resolves.toBeUndefined();
        await expect(validator({}, '1')).resolves.toBeUndefined();
        await expect(validator({}, '123')).resolves.toBeUndefined();
        await expect(validator({}, '99999')).resolves.toBeUndefined();
        await expect(validator({}, 12345)).resolves.toBeUndefined();
      });

      it('từ chối khi chứa ký tự không phải số nguyên (dấu chấm, chữ cái, dấu âm)', async () => {
        await expect(validator({}, '12.34')).rejects.toThrow('Số lượng phải là số nguyên');
        await expect(validator({}, '12a')).rejects.toThrow('Số lượng phải là số nguyên');
        await expect(validator({}, '-5')).rejects.toThrow('Số lượng phải là số nguyên');
      });

      it('từ chối khi vượt quá 5 chữ số', async () => {
        await expect(validator({}, '123456')).rejects.toThrow('Số lượng tối đa 5 chữ số');
      });
    });
  });
});
