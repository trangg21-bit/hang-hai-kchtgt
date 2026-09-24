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

  it('maps every Radar popup field to the current RadarStationResponse DTO', async () => {
    const { resolveVmdPopupFields, getPopupValueByPath } = await import('../pages/gis/vmdPopupFields');
    const radarData = {
      code: 'RADAR-000044',
      stationName: 'Tên trạm radar trên bản đồ',
      orgUnitName: 'Cảng vụ hàng hải Hà Tĩnh',
      provinceId: 77,
      location: 'Địa điểm chi tiết 123@',
      updatedAt: '2026-09-24T10:14:41',
      updatedByName: 'Nguyễn Văn An',
      note: 'Ghi chú',
      conditionStatus: '0',
      approvalStatus: 'APPROVED',
      operatingUnitName: 'Ban Quản lý Cảng Bến Đầm',
      vtsSystemName: 'Tên hệ thống VTS',
      vtsOperationCenterName: 'Tên trung tâm điều hành VTS',
      unitOfMeasure: 'Bến',
      quantity: 77777,
      towerHeight: 5555.557,
      radarRange: 9999,
    };
    const fields = resolveVmdPopupFields('RADAR_STATION_LEGACY', 'Trạm radar', radarData);
    const valueByLabel = (label: string) => {
      const field = fields.find((candidate) => candidate.label === label);
      expect(field, label).toBeDefined();
      return getPopupValueByPath(radarData, field!.key);
    };

    expect(valueByLabel('Địa điểm chi tiết')).toBe('Địa điểm chi tiết 123@');
    expect(valueByLabel('Tình trạng')).toBe('0');
    expect(valueByLabel('Đơn vị khai thác')).toBe('Ban Quản lý Cảng Bến Đầm');
    expect(valueByLabel('Thuộc hệ thống VTS')).toBe('Tên hệ thống VTS');
    expect(valueByLabel('Thuộc trung tâm điều hành VTS')).toBe('Tên trung tâm điều hành VTS');
    expect(valueByLabel('Đơn vị tính')).toBe('Bến');
    expect(valueByLabel('Số lượng')).toBe(77777);
    expect(valueByLabel('Chiều cao tháp radar')).toBe(5555.557);
    expect(valueByLabel('Tầm hiệu lực tháp radar')).toBe(9999);
  });

  it.each([
    ['CCTV', 'Hệ thống CCTV'],
    ['SCADA', 'Hệ thống SCADA'],
    ['TRANSMISSION', 'Hệ thống truyền dẫn'],
    ['VTS_ASSIST', 'Hệ thống phụ trợ VTS'],
  ])('maps shared device DTO aliases for %s', async (infrastructureType, displayType) => {
    const { resolveVmdPopupFields, getPopupValueByPath } = await import('../pages/gis/vmdPopupFields');
    const deviceData = {
      deviceCode: 'DEVICE-01',
      deviceName: 'Thiết bị 01',
      detailedLocation: 'Phòng điều hành',
      operatingUnitName: 'Đơn vị khai thác',
      unitOfMeasure: 1,
      quantity: 2,
      yearOfUse: 2025,
      specifications: 'Thông số kỹ thuật',
      manufacturer: 'Nhà sản xuất',
      maintenanceInformation: 'Thông tin bảo trì',
    };
    const fields = resolveVmdPopupFields(infrastructureType, displayType, deviceData);
    const valueByLabel = (label: string) => {
      const field = fields.find((candidate) => candidate.label === label);
      expect(field, `${infrastructureType}: ${label}`).toBeDefined();
      return getPopupValueByPath(deviceData, field!.key);
    };

    expect(valueByLabel('Mã thiết bị')).toBe('DEVICE-01');
    expect(valueByLabel('Tên thiết bị')).toBe('Thiết bị 01');
    expect(valueByLabel('Đơn vị khai thác')).toBe('Đơn vị khai thác');
    expect(valueByLabel('Đơn vị tính')).toBe(1);
    expect(valueByLabel('Số lượng')).toBe(2);
    expect(valueByLabel('Năm đưa vào sử dụng')).toBe(2025);
    expect(valueByLabel('Thông số kỹ thuật')).toBe('Thông số kỹ thuật');
    expect(valueByLabel('Hãng sản xuất')).toBe('Nhà sản xuất');
    expect(valueByLabel('Thông tin bảo trì')).toBe('Thông tin bảo trì');
  });

  it.each([
    ['INMARSAT_STATION', 'Đài Thông tin Vệ tinh mặt đất Inmarsat Hải Phòng'],
    ['COSPAS_SARSAT_STATION', 'Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam'],
    ['LRIT_STATION', 'Đài Thông tin nhận dạng và truy theo tầm xa (LRIT)'],
  ])('maps shared station DTO aliases for %s', async (infrastructureType, displayType) => {
    const { resolveVmdPopupFields, getPopupValueByPath } = await import('../pages/gis/vmdPopupFields');
    const stationData = {
      stationCode: 'STATION-01',
      stationName: 'Đài thông tin 01',
      locationAddress: 'Số 1 đường biển',
      coverageArea: 'Biển Đông',
      servicesProvided: 'Thông tin an toàn hàng hải',
    };
    const fields = resolveVmdPopupFields(infrastructureType, displayType, stationData);
    const valueByLabel = (label: string) => {
      const field = fields.find((candidate) => candidate.label === label);
      expect(field, `${infrastructureType}: ${label}`).toBeDefined();
      return getPopupValueByPath(stationData, field!.key);
    };

    expect(valueByLabel('Mã đài')).toBe('STATION-01');
    expect(valueByLabel('Tên đài')).toBe('Đài thông tin 01');
    expect(valueByLabel('Địa điểm chi tiết')).toBe('Số 1 đường biển');
    expect(valueByLabel('Dịch vụ cung cấp')).toBe('Thông tin an toàn hàng hải');
  });
});
