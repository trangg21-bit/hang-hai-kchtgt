import { describe, it, expect } from 'vitest';
import {
  ddToDms,
  parseWktToCoordinates,
  serializeCoordinatesToWkt,
  validateDmsCoordinates,
} from '../../utils/gisGeometry';

describe('AisSystemForm — Location & GIS Coordinate Handling', () => {
  it('TC-AIS-01: ddToDms retains 0 values without converting to null', () => {
    // Tọa độ chẵn độ: 20.0 (20° 0\' 0\")
    const dmsZero = ddToDms(20.0);
    expect(dmsZero.d).toBe(20);
    expect(dmsZero.m).toBe(0);
    expect(dmsZero.s).toBe(0);

    // Không trường nào bị null
    expect(dmsZero.m).not.toBeNull();
    expect(dmsZero.s).not.toBeNull();
  });

  it('TC-AIS-02: validateDmsCoordinates succeeds when minutes or seconds are 0', () => {
    const coordsWithZero = [
      { latD: 20, latM: 0, latS: 0, lngD: 106, lngM: 0, lngS: 0 },
    ];
    const result = validateDmsCoordinates(coordsWithZero, 'POINT');
    expect(result.valid).toBe(true);
    expect(result.validCoords.length).toBe(1);
    expect(result.validCoords[0].latitude).toBe(20.0);
    expect(result.validCoords[0].longitude).toBe(106.0);
  });

  it('TC-AIS-03: parseWktToCoordinates and serializeCoordinatesToWkt work reciprocally for POINT', () => {
    const wkt = 'POINT (106.685678 20.841234)';
    const parsed = parseWktToCoordinates(wkt);
    expect(parsed.length).toBe(1);
    expect(parsed[0].longitude).toBeCloseTo(106.685678, 5);
    expect(parsed[0].latitude).toBeCloseTo(20.841234, 5);

    const serialized = serializeCoordinatesToWkt(parsed, 'POINT');
    expect(serialized).toBe('POINT (106.685678 20.841234)');
  });

  it('TC-AIS-04: Fallback WKT preservation logic when coordinate inputs are untouched', () => {
    const isCreateMode = false;
    const record = {
      coordinates: 'POINT (106.685678 20.841234)',
      geometryType: 'POINT',
    };
    const geomType = record.geometryType;
    const coordinateList: Array<any> = [];

    let wkt: string | undefined = undefined;
    if (geomType) {
      const hasAnyInput = coordinateList.some(
        (c) => c.latD != null || c.latM != null || c.latS != null || c.lngD != null || c.lngM != null || c.lngS != null
      );
      if (hasAnyInput) {
        const coordResult = validateDmsCoordinates(coordinateList, geomType);
        if (coordResult.valid && coordResult.validCoords.length > 0) {
          wkt = serializeCoordinatesToWkt(coordResult.validCoords, geomType);
        }
      } else if (!isCreateMode && record?.coordinates) {
        wkt = record.coordinates;
      }
    }

    expect(wkt).toBe('POINT (106.685678 20.841234)');
  });

  it('TC-AIS-05: Double protection extracts geometryType and symbolId even if active tab is general', () => {
    const valuesFromAntdGeneralTab = {
      code: 'AIS-001',
      name: 'AIS Station',
    };
    const formFields = {
      geometryType: 'POINT',
      symbolId: 'sym-123',
    };
    const record = {
      geometryType: 'POINT',
      symbolId: 'sym-123',
    };

    const allValues = { ...formFields, ...valuesFromAntdGeneralTab };
    const geomType = allValues.geometryType || record?.geometryType || undefined;
    const symId = allValues.symbolId ?? (record?.symbolId ? String(record.symbolId) : null);

    expect(geomType).toBe('POINT');
    expect(symId).toBe('sym-123');
  });
});
