import { describe, expect, it } from 'vitest';
import { getVmdPopupFields } from '../pages/gis/vmdPopupFields';
import { KCHT_GIS_TYPE_OPTIONS } from '../types/gisSearch';

const EXPECTED_FIELD_COUNTS: Record<string, number> = {
  SEAPORT: 24,
  PORT_TERMINAL: 23,
  PIER: 31,
  BUOY_BERTH: 29,
  STORM_SHELTER_AREA: 23,
  TRANSSHIPMENT_AREA: 26,
  ANCHORAGE_AREA: 25,
  SHIP_REPAIR_FACILITY: 19,
  LIGHTHOUSE: 29,
  BUOY_STATION: 19,
  VTS_SYSTEM: 13,
  VTS_OPERATION_CENTER: 12,
  RADAR_STATION_LEGACY: 17,
  AIS_SYSTEM: 17,
  CCTV: 17,
  SCADA: 17,
  TRANSMISSION: 17,
  VTS_ASSIST: 16,
  DIKE_REVETMENT: 19,
  NAVIGATION_CHANNEL: 17,
  COASTAL_RADIO_STATION: 14,
  INMARSAT_STATION: 14,
  COSPAS_SARSAT_STATION: 14,
  LRIT_STATION: 13,
  HANOI_STATION: 12,
  DRY_PORT: 18,
  BUOY: 28,
};

describe('VMD popup field configuration', () => {
  it('keeps the exact field count for every legacy infrastructure type', () => {
    Object.entries(EXPECTED_FIELD_COUNTS).forEach(([type, expectedCount]) => {
      expect(getVmdPopupFields(type), type).toHaveLength(expectedCount);
    });
  });

  it('keeps the buoy field labels and order from the legacy popup', () => {
    expect(getVmdPopupFields('BUOY').map(({ label }) => label)).toEqual([
      'Mã phao, tiêu',
      'Tên phao, tiêu',
      'Đơn vị quản lý',
      'Ngày cập nhật',
      'Cán bộ cập nhật',
      'Tình trạng',
      'Trạng thái',
      'Phân loại',
      'Thời điểm đưa vào sử dụng',
      'Thời điểm sửa chữa gần nhất',
      'Kết cấu',
      'Diện tích (m2)',
      'Chiều cao tâm sáng (hải đồ)',
      'Màu sắc bên ngoài của tháp đèn',
      'Nguồn cung cấp năng lượng cho đèn',
      'Thuộc nhà trạm quản lý vận hành phao, tiêu',
      'Phân loại phao',
      'Phân loại tiêu',
      'Hình dáng',
      'Chiều cao thân phao (m)',
      'Đèn biển',
      'Chiều cao tháp đèn',
      'Phạm vi chiếu sáng',
      'Màu sắc',
      'Kiểu chớp',
      'Đường kính phao (m)',
      'Chủng loại đèn (Thiết bị báo hiệu)',
      'Chu kỳ',
    ]);
  });

  it('does not apply legacy fields to the new water-area type', () => {
    expect(getVmdPopupFields('WATER_AREA')).toEqual([]);
  });

  it('covers every current GIS infrastructure type that existed in VMD', () => {
    KCHT_GIS_TYPE_OPTIONS.forEach(({ value }) => {
      if (value !== 'WATER_AREA') {
        expect(getVmdPopupFields(value), value).not.toHaveLength(0);
      }
    });
  });
});

