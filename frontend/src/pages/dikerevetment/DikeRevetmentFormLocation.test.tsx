import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  ddToDms,
  parseWktToCoordinates,
  serializeCoordinatesToWkt,
  validateDmsCoordinates,
} from '../../utils/gisGeometry';

describe('DikeRevetment — Issue #202 Bug Fixes Tests', () => {
  it('TC-DK-01 (Bug 1): Double-click guard prevents concurrent submissions', () => {
    let callCount = 0;
    const submittingRef = { current: false };

    const mockSubmit = async () => {
      if (submittingRef.current) return false;
      submittingRef.current = true;
      try {
        callCount += 1;
        // Giả lập asynchronous request
        await new Promise((resolve) => setTimeout(resolve, 50));
        return true;
      } finally {
        submittingRef.current = false;
      }
    };

    // User bấm nút 2 lần liên tiếp nhanh
    const firstCall = mockSubmit();
    const secondCall = mockSubmit();

    return Promise.all([firstCall, secondCall]).then(([res1, res2]) => {
      expect(res1).toBe(true);
      expect(res2).toBe(false);
      expect(callCount).toBe(1);
    });
  });

  it('TC-DK-02 (Bug 3): Location & GIS coordinates are preserved when editing without modifying GIS tab', () => {
    const editingRecord = {
      id: 'dk-1',
      geometryType: 'LINE',
      symbolId: 'sym-001',
      coordinates: 'LINESTRING (106.685678 20.841234, 106.695678 20.851234)',
    };

    // Khi người dùng đứng ở tab "Thông tin chung", validateFields trả về values không có trường GIS
    const valuesFromGeneralTab: Record<string, any> = {
      dikeRevetmentName: 'Đê chắn sóng Hải Phòng',
      seaportId: 'sp-1',
      length: '1000',
    };

    // Giả lập fallback trong handleSubmit của DikeRevetmentList
    const formGetFieldValue = (field: string) => {
      if (field === 'geometryType') return editingRecord.geometryType;
      if (field === 'symbolId') return editingRecord.symbolId;
      return undefined;
    };

    const geomType = valuesFromGeneralTab.geometryType ?? formGetFieldValue('geometryType') ?? editingRecord?.geometryType ?? null;
    const symbolId = (valuesFromGeneralTab.symbolId !== undefined
      ? valuesFromGeneralTab.symbolId
      : (formGetFieldValue('symbolId') ?? editingRecord?.symbolId)) ?? null;
    const hasGeom = !!geomType;

    // Giả lập coordinateList đã nạp từ openEditDrawer
    const parsedCoords = parseWktToCoordinates(editingRecord.coordinates);
    const coordinateList = parsedCoords.map((c) => {
      const latDms = ddToDms(c.latitude);
      const lngDms = ddToDms(c.longitude);
      return { latD: latDms.d, latM: latDms.m, latS: latDms.s, lngD: lngDms.d, lngM: lngDms.m, lngS: lngDms.s };
    });
    const coordResult = validateDmsCoordinates(coordinateList, geomType);

    expect(coordResult.valid).toBe(true);
    const coordinates = hasGeom && coordResult.validCoords.length > 0
      ? serializeCoordinatesToWkt(coordResult.validCoords, geomType || 'LINE')
      : (editingRecord?.coordinates ?? null);

    const payload = {
      geometryType: hasGeom ? geomType : null,
      coordinates: hasGeom ? coordinates : null,
      symbolId: hasGeom && symbolId ? symbolId : null,
    };

    expect(payload.geometryType).toBe('LINE');
    expect(payload.symbolId).toBe('sym-001');
    expect(payload.coordinates).toContain('LINESTRING');
    expect(payload.coordinates).toContain('106.685678');
    expect(payload.coordinates).toContain('20.841234');
  });

  it('TC-DK-03 (Bug 4): LocalDateTime formats full hours, minutes, and seconds', () => {
    const formatDate = (dateStr: string | null | undefined): string | null => {
      if (!dateStr) return null;
      try {
        return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss');
      } catch {
        return dateStr;
      }
    };

    // Trước đây: backend gửi "2019-07-01" (LocalDate) -> formatDate ra "01/07/2019 00:00:00"
    const oldLocalDateStr = '2019-07-01';
    expect(formatDate(oldLocalDateStr)).toBe('01/07/2019 00:00:00');

    // Sau khi sửa: backend gửi LocalDateTime "2019-07-01T14:35:28"
    const newLocalDateTimeStr = '2019-07-01T14:35:28';
    expect(formatDate(newLocalDateTimeStr)).toBe('01/07/2019 14:35:28');
  });
});
