import { describe, it, expect } from 'vitest';
import {
  formatAssetCode,
  getAssetCodePrefix,
  getAssetCodePlaceholder,
} from './assetCode';

describe('assetCode utility', () => {
  describe('formatAssetCode', () => {
    it('giữ nguyên mã rỗng hoặc null', () => {
      expect(formatAssetCode('')).toBe('');
      expect(formatAssetCode(null)).toBe('');
      expect(formatAssetCode(undefined)).toBe('');
      expect(formatAssetCode('-')).toBe('-');
    });

    it('chuẩn hóa mã cũ TS- thành TSKCHT_ và padding 6 số (ví dụ TSKCHT_BC-000011)', () => {
      expect(formatAssetCode('TS-BC-11')).toBe('TSKCHT_BC-000011');
      expect(formatAssetCode('TS-BC-000011')).toBe('TSKCHT_BC-000011');
      expect(formatAssetCode('TS-BC-001')).toBe('TSKCHT_BC-000001');
      expect(formatAssetCode('TS-TD-1')).toBe('TSKCHT_TD-000001');
    });

    it('chuẩn hóa mã cũ có hậu tố hex UUID thành tiền tố TSKCHT_', () => {
      expect(formatAssetCode('TS-BC-C1CB45BE')).toBe('TSKCHT_BC-C1CB45BE');
      expect(formatAssetCode('TS-TD-17EB0DEA')).toBe('TSKCHT_TD-17EB0DEA');
    });

    it('chuẩn hóa mã TSKCHT_ sẵn có nhưng chưa đủ 6 chữ số', () => {
      expect(formatAssetCode('TSKCHT_BC-11')).toBe('TSKCHT_BC-000011');
      expect(formatAssetCode('tskcht_bc-11')).toBe('TSKCHT_BC-000011');
      expect(formatAssetCode('TSKCHT_TD-123')).toBe('TSKCHT_TD-000123');
      expect(formatAssetCode('TSKCHT_BC-000011')).toBe('TSKCHT_BC-000011');
    });
  });

  describe('getAssetCodePrefix & getAssetCodePlaceholder', () => {
    it('trả về prefix đúng cho từng loại tài sản', () => {
      expect(getAssetCodePrefix('PORT_TERMINAL')).toBe('TSKCHT_BC-');
      expect(getAssetCodePrefix('TRANSMISSION')).toBe('TSKCHT_TD-');
      expect(getAssetCodePrefix('VHF')).toBe('TSKCHT_VHF-');
      expect(getAssetCodePrefix('RADAR_STATION')).toBe('TSKCHT_RD-');
    });

    it('trả về placeholder chuẩn gợi ý mã', () => {
      expect(getAssetCodePlaceholder('PORT_TERMINAL')).toBe('Hệ thống tự sinh (TSKCHT_BC-000001)');
      expect(getAssetCodePlaceholder('TRANSMISSION')).toBe('Hệ thống tự sinh (TSKCHT_TD-000001)');
    });
  });
});
