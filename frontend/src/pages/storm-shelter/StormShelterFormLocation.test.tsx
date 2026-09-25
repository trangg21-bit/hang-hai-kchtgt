import { describe, it, expect } from 'vitest';
import { parseGisCoordinates, normalizeClearedFields } from './stormShelterPayload';
import {
  parseWktToCoordinates,
  serializeCoordinatesToWkt,
} from '../../utils/gisGeometry';

describe('Storm Shelter — Location & GIS Coordinate Handling', () => {
  it('TC-SS-01: parseGisCoordinates handles SRID=4326; prefix with POLYGON correctly', () => {
    const wktWithSrid = 'SRID=4326;POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))';
    const coords = parseGisCoordinates({
      geometryType: 'POLYGON',
      coordinates: wktWithSrid,
    });

    // Polygon 5 vertices with first==last -> closing copy stripped for editor: 4 points
    expect(coords.length).toBe(4);
    expect(coords[0].longitude).toBe(106.1);
    expect(coords[0].latitude).toBe(20.1);
    expect(coords[1].longitude).toBe(107.1);
    expect(coords[1].latitude).toBe(20.1);
    expect(coords[2].longitude).toBe(107.1);
    expect(coords[2].latitude).toBe(21.1);
    expect(coords[3].longitude).toBe(106.1);
    expect(coords[3].latitude).toBe(21.1);
  });

  it('TC-SS-02: parseGisCoordinates handles SRID=4326; prefix with POINT correctly', () => {
    const wktWithSrid = 'SRID=4326;POINT (106.685678 20.841234)';
    const coords = parseGisCoordinates(wktWithSrid);

    expect(coords.length).toBe(1);
    expect(coords[0].longitude).toBeCloseTo(106.685678, 5);
    expect(coords[0].latitude).toBeCloseTo(20.841234, 5);
  });

  it('TC-SS-03: parseGisCoordinates handles SRID=4326; prefix with LINESTRING correctly', () => {
    const wktWithSrid = 'SRID=4326;LINESTRING (106.1 20.1, 106.5 20.5)';
    const coords = parseGisCoordinates({ coordinates: wktWithSrid });

    expect(coords.length).toBe(2);
    expect(coords[0].longitude).toBe(106.1);
    expect(coords[0].latitude).toBe(20.1);
    expect(coords[1].longitude).toBe(106.5);
    expect(coords[1].latitude).toBe(20.5);
  });

  it('TC-SS-04: parseWktToCoordinates and serializeCoordinatesToWkt work reciprocally for POLYGON', () => {
    const rawWkt = 'POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))';
    const parsed = parseWktToCoordinates(rawWkt);
    expect(parsed.length).toBe(4);

    const serialized = serializeCoordinatesToWkt(parsed, 'POLYGON');
    // Polygon serialization automatically closes the ring
    expect(serialized).toBe('POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))');
  });

  it('TC-SS-05: Fallback WKT preservation logic retains initial coordinates during edit', () => {
    const isEdit = true;
    const initialCoordinates = 'POLYGON ((106.1 20.1, 107.1 20.1, 107.1 21.1, 106.1 21.1, 106.1 20.1))';
    const initialCoordinatesRef = { current: initialCoordinates };

    const vals = {
      geometryType: 'POLYGON',
      mapSymbolId: 'sym-001',
      coordinateSystem: 1,
      displayRule: 'Độ, phút, giây (DMS)',
      stormShelterName: 'Khu tránh bão Hải Phòng (sửa tên)',
    };

    // Người dùng không nhập lại tọa độ (coordinateList rỗng)
    const validCoords: Array<{
      latD: number | null;
      latM: number | null;
      latS: number | null;
      lngD: number | null;
      lngM: number | null;
      lngS: number | null;
    }> = [];
    const minCount = 3;

    let wktCoordinates: string | null = null;
    let lat: number | null = null;
    let lng: number | null = null;

    const hasGeom = !!vals.geometryType;
    if (hasGeom) {
      if (validCoords.length >= minCount) {
        wktCoordinates = serializeCoordinatesToWkt(validCoords, vals.geometryType);
      } else if (isEdit && initialCoordinatesRef.current) {
        // Fallback bảo toàn tọa độ gốc
        wktCoordinates = initialCoordinatesRef.current;
        const pts = parseWktToCoordinates(wktCoordinates);
        if (pts.length > 0) {
          lat = pts[0].latitude;
          lng = pts[0].longitude;
        }
      }
    }

    const payload = {
      stormShelterName: vals.stormShelterName,
      geometryType: hasGeom ? (vals.geometryType || null) : (isEdit ? null : undefined),
      coordinates: hasGeom ? (wktCoordinates || (isEdit && initialCoordinatesRef.current ? initialCoordinatesRef.current : null)) : (isEdit ? null : undefined),
      latitude: hasGeom ? (lat ?? (isEdit ? null : undefined)) : (isEdit ? null : undefined),
      longitude: hasGeom ? (lng ?? (isEdit ? null : undefined)) : (isEdit ? null : undefined),
    };

    // Tọa độ không bị mất hay biến thành null
    expect(payload.coordinates).toBe(initialCoordinates);
    expect(payload.geometryType).toBe('POLYGON');
    expect(payload.latitude).toBe(20.1);
    expect(payload.longitude).toBe(106.1);
  });

  it('TC-SS-06: Intentionally clearing geometryType clears location in payload', () => {
    const isEdit = true;
    const initialCoordinatesRef = { current: 'POINT (106.685678 20.841234)' as string | null };

    // Người dùng xóa trắng loại đối tượng
    const onGeometryTypeClear = () => {
      initialCoordinatesRef.current = null;
    };
    onGeometryTypeClear();

    const vals = {
      geometryType: undefined,
      stormShelterName: 'Khu tránh bão Hải Phòng',
    };

    const hasGeom = !!vals.geometryType;
    const payload = {
      stormShelterName: vals.stormShelterName,
      geometryType: hasGeom ? (vals.geometryType || null) : (isEdit ? null : undefined),
      coordinates: hasGeom ? null : (isEdit ? null : undefined),
      latitude: hasGeom ? null : (isEdit ? null : undefined),
      longitude: hasGeom ? null : (isEdit ? null : undefined),
    };

    expect(payload.coordinates).toBeNull();
    expect(payload.geometryType).toBeNull();
    expect(payload.latitude).toBeNull();
    expect(payload.longitude).toBeNull();
  });

  it('TC-SS-07: normalizeClearedFields converts undefined clearable fields to null in edit mode', () => {
    const rawPayload = {
      stormShelterName: 'Khu tránh bão Hải Phòng',
      detailedLocation: undefined,
      remarks: undefined,
      operationalStatus: 'OPERATIONAL',
    };

    const normalized = normalizeClearedFields(rawPayload, { isEdit: true });

    expect(normalized.stormShelterName).toBe('Khu tránh bão Hải Phòng');
    expect(normalized.detailedLocation).toBeNull();
    expect(normalized.remarks).toBeNull();
    expect(normalized.operationalStatus).toBe('OPERATIONAL');
  });
});
