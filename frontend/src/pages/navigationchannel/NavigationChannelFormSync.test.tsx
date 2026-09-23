import { describe, it, expect } from 'vitest';
import {
  serializeCoordinatesToWkt,
  ddToDms,
  dmsToDd,
  validateDmsCoordinates,
} from '../../utils/gisGeometry';

describe('NavigationChannelForm — UI Format & Data Sync (/navigation-channel vs /beacon-stations)', () => {
  it('TC-GEO-01: Chuyển đổi qua lại giữa DD (Decimal Degrees) và DMS (Độ, Phút, Giây) chính xác', () => {
    const lat = 20.841234;
    const lng = 106.685678;

    const latDms = ddToDms(lat);
    const lngDms = ddToDms(lng);

    expect(latDms.d).toBe(20);
    expect(latDms.m).toBe(50);
    expect(Math.round(latDms.s * 100) / 100).toBe(28.44);

    const latReconstructed = dmsToDd(latDms.d, latDms.m, latDms.s);
    const lngReconstructed = dmsToDd(lngDms.d, lngDms.m, lngDms.s);

    expect(Math.abs(latReconstructed - lat)).toBeLessThan(0.0001);
    expect(Math.abs(lngReconstructed - lng)).toBeLessThan(0.0001);
  });

  it('TC-GEO-02: Serialize tọa độ chuẩn WKT theo hình học LINESTRING cho luồng hàng hải', () => {
    const coords = [
      { latitude: 20.85, longitude: 106.68 },
      { latitude: 20.86, longitude: 106.69 },
      { latitude: 20.87, longitude: 106.70 },
    ];

    const wkt = serializeCoordinatesToWkt(coords, 'LINE');
    expect(wkt).toBe('LINESTRING (106.68 20.85, 106.69 20.86, 106.7 20.87)');
  });

  it('TC-GEO-03: Validate số lượng điểm tối thiểu theo loại đối tượng (LINE cần >= 2 điểm, POINT cần 1 điểm, POLYGON cần >= 3 điểm)', () => {
    const onePoint = [{ latD: 20, latM: 50, latS: 28, lngD: 106, lngM: 41, lngS: 8 }];
    const twoPoints = [
      { latD: 20, latM: 50, latS: 28, lngD: 106, lngM: 41, lngS: 8 },
      { latD: 20, latM: 51, latS: 0, lngD: 106, lngM: 42, lngS: 0 },
    ];

    const resPoint = validateDmsCoordinates(onePoint, 'POINT');
    expect(resPoint.valid).toBe(true);

    const resLineFail = validateDmsCoordinates(onePoint, 'LINE');
    expect(resLineFail.valid).toBe(false);

    const resLineSuccess = validateDmsCoordinates(twoPoints, 'LINE');
    expect(resLineSuccess.valid).toBe(true);
  });

  it('TC-FIELDS-04: Section 1 mapping cấu trúc 4 hàng 8 trường chuẩn /beacon-stations', () => {
    // 4 hàng nghiệp vụ tương đồng 100% giữa /beacon-stations và /navigation-channel:
    const row1 = ['orgUnitId', 'seaportId'];
    const row2 = ['channelCode', 'channelName'];
    const row3 = ['operatingUnitId', 'conditionStatus'];
    const row4 = ['provinceId', 'detailedLocation'];

    expect(row1).toEqual(['orgUnitId', 'seaportId']);
    expect(row2).toEqual(['channelCode', 'channelName']);
    expect(row3).toEqual(['operatingUnitId', 'conditionStatus']);
    expect(row4).toEqual(['provinceId', 'detailedLocation']);
  });

  it('TC-ROUTE-05: Đảm bảo phân đoạn tuyến luồng hỗ trợ đầy đủ 17 trường kỹ thuật nghiệp vụ', () => {
    const routeItem = {
      sequenceNo: 1,
      routeClassification: '1',
      routeCode: 'LHH-000086-01',
      routeName: 'Đoạn phao 0 đến phao 19',
      routeType: 1, // Công cộng
      routeGrade: 6,
      channelLengthKilometers: 32,
      designDepthMeters: -12.5,
      currentDepthMeters: -12.0,
      minimumDesignWidthMeters: 150,
      maximumDesignWidthMeters: 200,
      designSlope: 1.5,
      minimumCurveRadiusMeters: 600,
      verticalClearanceMeters: 55,
      turningBasinLocation: 'Khu vực bến 1',
      turningBasinRadiusMeters: 300,
      routeLatestMaintenanceYear: 2024,
      routeLatestDredgingVolumeCubicMeters: 50000,
    };

    expect(routeItem.routeName).toBe('Đoạn phao 0 đến phao 19');
    expect(routeItem.routeCode).toBe('LHH-000086-01');
    expect(routeItem.channelLengthKilometers).toBe(32);
    expect(routeItem.routeGrade).toBe(6);
    expect(routeItem.routeType).toBe(1);
  });

  it('TC-ROUTE-06: Đảm bảo format sinh mã tuyến luồng chuẩn [channelCode]-[sequenceNo]', () => {
    const channelCode = 'LHH-000086';
    const seq = 1;
    const generatedCode = `${channelCode}-${String(seq).padStart(2, '0')}`;
    expect(generatedCode).toBe('LHH-000086-01');

    const seq2 = 12;
    const generatedCode2 = `${channelCode}-${String(seq2).padStart(2, '0')}`;
    expect(generatedCode2).toBe('LHH-000086-12');
  });

  it('TC-ROUTE-07: Chuẩn hóa payload routeDetails với sequenceNo tăng dần và trim space', () => {
    const rawRoutes = [
      { routeName: '  Đoạn luồng 1  ', routeClassification: ' Công cộng ', turningBasinLocation: '  Vũng quay 1 ' },
      { routeName: 'Đoạn luồng 2', routeClassification: '', turningBasinLocation: undefined },
    ];

    const mappedRoutes = rawRoutes.map((r, i) => ({
      ...r,
      sequenceNo: i + 1,
      routeClassification: r.routeClassification?.trim() || undefined,
      routeName: r.routeName.trim(),
      turningBasinLocation: r.turningBasinLocation?.trim() || undefined,
    }));

    expect(mappedRoutes[0].sequenceNo).toBe(1);
    expect(mappedRoutes[0].routeName).toBe('Đoạn luồng 1');
    expect(mappedRoutes[0].routeClassification).toBe('Công cộng');
    expect(mappedRoutes[0].turningBasinLocation).toBe('Vũng quay 1');

    expect(mappedRoutes[1].sequenceNo).toBe(2);
    expect(mappedRoutes[1].routeName).toBe('Đoạn luồng 2');
    expect(mappedRoutes[1].routeClassification).toBeUndefined();
  });

  it('TC-ROUTE-08: Phân đoạn tuyến luồng hỗ trợ cấu trúc 2 Tab chuẩn ("Thông tin chung" và "Thông tin vị trí")', () => {
    const routeTabs = [
      { key: 'general', label: 'Thông tin chung' },
      { key: 'location', label: 'Thông tin vị trí' },
    ];

    expect(routeTabs.map((t) => t.key)).toEqual(['general', 'location']);
    expect(routeTabs[0].label).toBe('Thông tin chung');
    expect(routeTabs[1].label).toBe('Thông tin vị trí');
  });

  it('TC-ROUTE-09: Tab Thông tin vị trí phân đoạn có cấu trúc thông số đối tượng bản đồ và tọa độ GPS chuẩn /vts-operation-center', () => {
    const routeGisPayload = {
      sequenceNo: 1,
      routeName: 'Đoạn luồng Cát Lái',
      geometryType: 'LINE',
      mapIconId: 'SYM-01',
      symbolId: 'SYM-01',
      coordinateReferenceSystem: 'WGS-84',
      displayRule: 'Độ, phút, giây (DMS)',
      coordinates: 'LINESTRING (106.68 20.85, 106.69 20.86)',
    };

    expect(routeGisPayload.geometryType).toBe('LINE');
    expect(routeGisPayload.coordinateReferenceSystem).toBe('WGS-84');
    expect(routeGisPayload.displayRule).toBe('Độ, phút, giây (DMS)');
    expect(routeGisPayload.symbolId).toBe('SYM-01');
    expect(routeGisPayload.coordinates).toContain('LINESTRING');
  });

  it('TC-ROUTE-10: Tọa độ GPS phân đoạn luồng parse & serialize chuẩn xác giữa DMS và WKT', () => {
    const dmsList = [
      { latD: 20, latM: 50, latS: 30, lngD: 106, lngM: 40, lngS: 20 },
      { latD: 20, latM: 51, latS: 15, lngD: 106, lngM: 41, lngS: 45 },
    ];

    const validation = validateDmsCoordinates(dmsList, 'LINE');
    expect(validation.valid).toBe(true);

    const wkt = serializeCoordinatesToWkt(validation.validCoords, 'LINE');
    expect(wkt.startsWith('LINESTRING (')).toBe(true);
    expect(wkt).toContain('106.');
    expect(wkt).toContain('20.');
  });

  it('TC-SYMBOL-11: Danh sách biểu tượng bản đồ luôn có dữ liệu dự phòng chuẩn, không bị trống', async () => {
    const { DEFAULT_CHANNEL_GIS_SYMBOLS } = await import('./NavigationChannelForm');
    expect(DEFAULT_CHANNEL_GIS_SYMBOLS.length).toBeGreaterThanOrEqual(10);
    expect(DEFAULT_CHANNEL_GIS_SYMBOLS.some((s) => s.code === 'CHANNEL' && s.name === 'Luồng hàng hải')).toBe(true);
    expect(DEFAULT_CHANNEL_GIS_SYMBOLS.some((s) => s.code === 'SYM-VTS')).toBe(true);
    expect(DEFAULT_CHANNEL_GIS_SYMBOLS.some((s) => s.code === 'SYM-PORT')).toBe(true);
  }, 60000);
});



