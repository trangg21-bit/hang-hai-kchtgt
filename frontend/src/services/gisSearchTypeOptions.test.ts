import { describe, expect, it } from 'vitest';
import {
  getKchtGisCategoryId,
  getKchtGisTypeByCategoryId,
  KCHT_GIS_TYPE_OPTIONS,
  normalizeKchtGisType,
} from '../types/gisSearch';

describe('danh mục loại KCHT GIS', () => {
  it('giữ đúng 22 loại duy nhất của source mới', () => {
    expect(KCHT_GIS_TYPE_OPTIONS).toHaveLength(22);
    expect(new Set(KCHT_GIS_TYPE_OPTIONS.map((option) => option.value)).size).toBe(22);
  });

  it('chuẩn hóa được các mã loại của dữ liệu cũ', () => {
    expect(normalizeKchtGisType('Port')).toBe('SEAPORT');
    expect(normalizeKchtGisType('Berth')).toBe('PORT_TERMINAL');
    expect(normalizeKchtGisType('DENBIEN')).toBe('LIGHTHOUSE');
    expect(normalizeKchtGisType('WaterZone')).toBe('WATER_AREA');
    expect(normalizeKchtGisType('TRAM_RADAR')).toBe('RADAR_STATION_LEGACY');
  });

  it('không làm mất loại khi lưu rồi mở lại popup chỉnh sửa', () => {
    for (const option of KCHT_GIS_TYPE_OPTIONS) {
      const categoryId = getKchtGisCategoryId(option.value);
      expect(categoryId).toBeDefined();
      expect(getKchtGisTypeByCategoryId(categoryId)).toBe(option.value);
    }
  });
});
