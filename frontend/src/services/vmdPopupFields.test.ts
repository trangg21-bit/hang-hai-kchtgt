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

describe('resolveVmdPopupFields and getPopupValueByPath', () => {
  it('prevents name collision where portName overrides anchorageName for Khu neo đậu', async () => {
    const { resolveVmdPopupFields, getPopupValueByPath } = await import('../pages/gis/vmdPopupFields');
    const mockAnchorageData = {
      id: 'mock-1',
      anchorageCode: 'ND01',
      anchorageName: 'Neo đậu 01 TB',
      portName: 'Cảng biển nhỏ',
      shapeDescription: 'Hình chữ nhật',
      currentWaterDepth: -12.5,
      designWaterDepth: -15.0,
      maxDraft: 11.2,
      maxTonnage: 30000,
      area: 25.5,
      operationalStatus: 'OPERATIONAL',
      approvalStatus: 'APPROVED',
    };

    const resolvedFields = resolveVmdPopupFields('ANCHORAGE_AREA', 'Khu neo đậu', mockAnchorageData);

    // Check "Tên khu neo đậu"
    const nameField = resolvedFields.find((f) => f.label === 'Tên khu neo đậu');
    expect(nameField).toBeDefined();
    const resolvedName = getPopupValueByPath(mockAnchorageData, nameField!.key);
    expect(resolvedName).toBe('Neo đậu 01 TB');

    // Check "Mã khu neo đậu"
    const codeField = resolvedFields.find((f) => f.label === 'Mã khu neo đậu');
    expect(codeField).toBeDefined();
    const resolvedCode = getPopupValueByPath(mockAnchorageData, codeField!.key);
    expect(resolvedCode).toBe('ND01');

    // Check alias mappings for zobjDataSub.*
    const shapeField = resolvedFields.find((f) => f.label === 'Hình dạng');
    expect(shapeField).toBeDefined();
    expect(getPopupValueByPath(mockAnchorageData, shapeField!.key)).toBe('Hình chữ nhật');

    const depthField = resolvedFields.find((f) => f.label.includes('Độ sâu khu nước hiện tại'));
    expect(depthField).toBeDefined();
    expect(getPopupValueByPath(mockAnchorageData, depthField!.key)).toBe(-12.5);

    const designDepthField = resolvedFields.find((f) => f.label.includes('Độ sâu khu nước theo thiết kế'));
    expect(designDepthField).toBeDefined();
    expect(getPopupValueByPath(mockAnchorageData, designDepthField!.key)).toBe(-15.0);

    const vesselDwtField = resolvedFields.find((f) => f.label.includes('Cỡ tàu khai thác theo công bố'));
    expect(vesselDwtField).toBeDefined();
    expect(getPopupValueByPath(mockAnchorageData, vesselDwtField!.key)).toBe(30000);

    const areaField = resolvedFields.find((f) => f.label.includes('Diện tích'));
    expect(areaField).toBeDefined();
    expect(getPopupValueByPath(mockAnchorageData, areaField!.key)).toBe(25.5);
  });

  it('prevents name collision for Pier (Cầu cảng) having both portName and berthName', async () => {
    const { resolveVmdPopupFields, getPopupValueByPath } = await import('../pages/gis/vmdPopupFields');
    const mockPierData = {
      id: 'pier-1',
      pierCode: 'CC-01',
      pierName: 'Cầu cảng A1',
      berthName: 'Bến cảng Tiên Sa',
      portName: 'Cảng biển Đà Nẵng',
      structureType: 'GRAVITY',
      approvalStatus: 'APPROVED',
    };

    const resolvedFields = resolveVmdPopupFields('PIER', 'Cầu cảng', mockPierData);
    const nameField = resolvedFields.find((f) => f.label === 'Tên cầu cảng');
    expect(nameField).toBeDefined();
    expect(getPopupValueByPath(mockPierData, nameField!.key)).toBe('Cầu cảng A1');
  });
});
