import { describe, it, expect } from 'vitest';
import { parseDotNumber, formatDotNumber, fmtInputNumber } from './numFmt';

describe('numFmt — parseDotNumber & formatDotNumber', () => {
  describe('parseDotNumber — Xử lý số nguyên khi gõ quá 4 chữ số trên chuỗi đã format', () => {
    it('parse đúng số nguyên 5 chữ số khi gõ tiếp vào chuỗi đã format 4 chữ số (1.234 -> 1.2345)', () => {
      // Khi gõ "1234", formatter hiển thị "1.234"
      expect(formatDotNumber('1234')).toBe('1.234');
      // Người dùng gõ tiếp chữ số thứ 5 ("5"), DOM nhận "1.2345"
      // parseDotNumber PHẢI trả về "12345", KHÔNG ĐƯỢC biến thành số thập phân "1.2345"
      expect(parseDotNumber('1.2345')).toBe('12345');
      // Giá trị sau đó được format đúng thành "12.345"
      expect(formatDotNumber('12345')).toBe('12.345');
    });

    it('parse đúng số nguyên 50.000 khi gõ "50000" (5.000 -> 5.0000)', () => {
      expect(formatDotNumber('5000')).toBe('5.000');
      expect(parseDotNumber('5.0000')).toBe('50000');
      expect(formatDotNumber('50000')).toBe('50.000');
    });

    it('parse đúng số nguyên 6 chữ số khi gõ tiếp vào chuỗi (12.345 -> 12.3456)', () => {
      expect(parseDotNumber('12.3456')).toBe('123456');
      expect(formatDotNumber('123456')).toBe('123.456');
    });

    it('parse đúng số nguyên 7 chữ số khi gõ tiếp vào chuỗi (123.456 -> 123.4567)', () => {
      expect(parseDotNumber('123.4567')).toBe('1234567');
      expect(formatDotNumber('1234567')).toBe('1.234.567');
    });

    it('parse đúng số nguyên nhiều nhóm hàng nghìn (1.234.567, 1.234.5678)', () => {
      expect(parseDotNumber('1.234.567')).toBe('1234567');
      expect(parseDotNumber('1.234.5678')).toBe('12345678');
      expect(parseDotNumber('99.999.999.999.999.999.999')).toBe('99999999999999999999');
    });

    it('parse đúng số âm khi có dấu phân tách hàng nghìn', () => {
      expect(parseDotNumber('-1.234')).toBe('-1234');
      expect(parseDotNumber('-1.2345')).toBe('-12345');
      expect(parseDotNumber('-5.0000')).toBe('-50000');
      expect(parseDotNumber('-50.0000')).toBe('-500000');
    });

    it('parse chuỗi số nguyên thuần túy không có dấu phân tách', () => {
      expect(parseDotNumber('12345')).toBe('12345');
      expect(parseDotNumber('50000')).toBe('50000');
      expect(parseDotNumber('100000')).toBe('100000');
      expect(parseDotNumber('12345678901234567890')).toBe('12345678901234567890');
    });
  });

  describe('parseDotNumber — Xử lý số thập phân chuẩn vi-VN (dấu phẩy ",") và paste JS float', () => {
    it('parse số thập phân dùng dấu phẩy "," theo chuẩn vi-VN', () => {
      expect(parseDotNumber('12,5')).toBe('12.5');
      expect(parseDotNumber('1.234,5')).toBe('1234.5');
      expect(parseDotNumber('1.234,5678')).toBe('1234.5678');
      expect(parseDotNumber('12.345,67')).toBe('12345.67');
      expect(parseDotNumber('0,5')).toBe('0.5');
      expect(parseDotNumber('-12,5')).toBe('-12.5');
    });

    it('parse số thập phân JS float/paste có 1 dấu chấm "." không phải nhóm hàng nghìn', () => {
      expect(parseDotNumber('0.5')).toBe('0.5');
      expect(parseDotNumber('0.1234')).toBe('0.1234');
      expect(parseDotNumber('.5')).toBe('0.5');
      expect(parseDotNumber('12.')).toBe('12.');
      expect(parseDotNumber('12.5')).toBe('12.5');
      expect(parseDotNumber('12.50')).toBe('12.50');
      expect(parseDotNumber('1234.5')).toBe('1234.5');
      expect(parseDotNumber('-0.5')).toBe('-0.5');
      expect(parseDotNumber('-12.5')).toBe('-12.5');
    });

    it('xử lý chuỗi rỗng / null / undefined / đơn vị tiền tệ', () => {
      expect(parseDotNumber('')).toBe('');
      expect(parseDotNumber(null)).toBe('');
      expect(parseDotNumber(undefined)).toBe('');
      expect(parseDotNumber('1.234 VNĐ')).toBe('1234');
      expect(parseDotNumber('1.2345 VND')).toBe('12345');
    });
  });

  describe('fmtInputNumber & formatDotNumber — Format số chuẩn vi-VN', () => {
    it('format số nguyên với dấu chấm hàng nghìn', () => {
      expect(fmtInputNumber('1234')).toBe('1.234');
      expect(fmtInputNumber('12345')).toBe('12.345');
      expect(fmtInputNumber('123456')).toBe('123.456');
      expect(fmtInputNumber('1234567')).toBe('1.234.567');
      expect(fmtInputNumber('50000')).toBe('50.000');
    });

    it('format số thập phân với dấu chấm hàng nghìn và dấu phẩy thập phân', () => {
      expect(fmtInputNumber('1234.5')).toBe('1.234,5');
      expect(fmtInputNumber('12345.67')).toBe('12.345,67');
      expect(fmtInputNumber('0.5')).toBe('0,5');
    });
  });
});
