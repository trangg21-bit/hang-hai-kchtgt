import { describe, it, expect } from 'vitest';
import { normalizeDecimal20_4, decimalNumberRule, safeNumber, safeDecimal } from '../pages/radarstation/radarStationRules';
import { fmtInputNumber, normalizeSafeNumber, fmtNum } from '../utils/numFmt';

describe('RadarStation Number Input Rules (Chuẩn Chiều cao tháp radar lấy theo Chiều cao tháp đèn của /beacon-stations)', () => {
  describe('normalizeDecimal20_4', () => {
    it('chỉ chấp nhận chữ số và dấu ".", loại bỏ ký tự khác', () => {
      expect(normalizeDecimal20_4('abc123xyz')).toBe('123');
      expect(normalizeDecimal20_4('12,345.67')).toBe('12345.67');
      expect(normalizeDecimal20_4('12.345,67')).toBe('12345.67');
      expect(normalizeDecimal20_4('1,5')).toBe('1.5');
      expect(normalizeDecimal20_4('12a.3b4c')).toBe('12.34');
      expect(normalizeDecimal20_4('-15.2')).toBe('15.2');
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

      // 18 chữ số nguyên + 2 chữ số thập phân -> phần nguyên cắt về 16
      const res2 = normalizeDecimal20_4('123456789012345678.99');
      expect(res2).toBe('1234567890123456.99');
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

  describe('decimalNumberRule validator', () => {
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

  describe('safeNumber & safeDecimal', () => {
    it('safeNumber chuyển đổi chuỗi số hợp lệ thành number', () => {
      expect(safeNumber('123.45')).toBe(123.45);
      expect(safeNumber('12.')).toBe(12);
      expect(safeNumber(45.67)).toBe(45.67);
    });

    it('safeNumber trả về undefined cho chuỗi rỗng hoặc không hợp lệ', () => {
      expect(safeNumber('')).toBeUndefined();
      expect(safeNumber(null)).toBeUndefined();
      expect(safeNumber(undefined)).toBeUndefined();
      expect(safeNumber('.')).toBeUndefined();
      expect(safeNumber('abc')).toBeUndefined();
    });

    it('safeDecimal giữ nguyên chuỗi số chính xác để submit API', () => {
      expect(safeDecimal('1100')).toBe('1100');
      expect(safeDecimal('1100.5')).toBe('1100.5');
      expect(safeDecimal('1100,5')).toBe('1100.5');
      expect(safeDecimal('1100.')).toBe('1100');
      expect(safeDecimal('')).toBeUndefined();
      expect(safeDecimal(null)).toBeUndefined();
      expect(safeDecimal(undefined)).toBeUndefined();
    });
  });

  describe('RadarStation display number formatting (fmtInputNumber, normalizeSafeNumber, fmtNum)', () => {
    it('fmtInputNumber hiển thị đúng "1100" thay vì "1100.00"', () => {
      expect(fmtInputNumber('1100.00')).toBe('1.100');
      expect(fmtInputNumber('1100')).toBe('1.100');
      expect(fmtInputNumber(1100)).toBe('1.100');
      expect(fmtInputNumber('1100.0')).toBe('1.100');
      expect(fmtInputNumber('1100.50')).toBe('1.100,5');
      expect(fmtInputNumber('1100.25')).toBe('1.100,25');
      expect(fmtInputNumber('1100.1234')).toBe('1.100,1234');
    });

    it('fmtInputNumber định dạng vi-VN ngay khi người dùng đang nhập', () => {
      expect(fmtInputNumber('1100.', { userTyping: true })).toBe('1.100,');
      expect(fmtInputNumber('1100.0', { userTyping: true })).toBe('1.100,0');
      expect(fmtInputNumber('1100.00', { userTyping: true })).toBe('1.100,00');
    });

    it('normalizeSafeNumber loại bỏ .00 / .0000 thừa khi nạp bản ghi từ backend', () => {
      expect(normalizeSafeNumber('1100.00')).toBe('1100');
      expect(normalizeSafeNumber('1100.0000')).toBe('1100');
      expect(normalizeSafeNumber('1100')).toBe('1100');
      expect(normalizeSafeNumber(1100)).toBe('1100');
      expect(normalizeSafeNumber('1100.50')).toBe('1100.5');
    });

    it('fmtNum loại bỏ đuôi .00 thừa trong chế độ xem chi tiết', () => {
      expect(fmtNum('1100.00')).toBe('1.100');
      expect(fmtNum('1100')).toBe('1.100');
      expect(fmtNum(1100)).toBe('1.100');
      expect(fmtNum('1100.50')).toBe('1.100,5');
      expect(fmtNum('1100.25')).toBe('1.100,25');
    });
  });
});
