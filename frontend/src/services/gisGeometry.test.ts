import { describe, expect, it } from 'vitest';
import {
  coordinateRowsToWkt,
  geometryCoordinatesToRows,
  normalizeLineCoordinates,
  normalizePolygonCoordinates,
  parseWktToCoords,
  resolveMapGeometryLocation,
} from '../utils/gisGeometry';

describe('gisGeometry', () => {
  it('parses valid line and polygon WKT', () => {
    expect(parseWktToCoords('LINESTRING(106.7 10.7, 106.8 10.8)')).toEqual([
      [106.7, 10.7],
      [106.8, 10.8],
    ]);
    expect(parseWktToCoords('POLYGON((106 10, 107 10, 107 11, 106 10))')).toEqual([[
      [106, 10],
      [107, 10],
      [107, 11],
      [106, 10],
    ]]);
  });

  it('rejects incomplete, out-of-range and empty geometries', () => {
    expect(parseWktToCoords('LINESTRING(106.7 10.7)')).toBeNull();
    expect(parseWktToCoords('POLYGON EMPTY')).toBeNull();
    expect(normalizeLineCoordinates([[106.7, 10.7], undefined])).toBeNull();
    expect(normalizePolygonCoordinates([[[106.7, 91], [106.8, 10.8], [106.9, 10.9]]])).toBeNull();
  });

  it('converts editable coordinates in both directions', () => {
    const rows = geometryCoordinatesToRows('Polygon', [[
      [106, 10],
      [107, 10],
      [107, 11],
      [106, 10],
    ]]);
    expect(rows).toHaveLength(3);
    expect(coordinateRowsToWkt('Polygon', rows)).toBe(
      'POLYGON((106.000000 10.000000, 107.000000 10.000000, 107.000000 11.000000, 106.000000 10.000000))',
    );
  });

  it('resolves marker position and focus extent from WKT', () => {
    expect(resolveMapGeometryLocation('POINT(106.7 20.8)')).toEqual({
      center: [106.7, 20.8],
      coordinates: [[106.7, 20.8]],
    });

    expect(resolveMapGeometryLocation('LINESTRING(106 20, 108 22)')).toEqual({
      center: [107, 21],
      coordinates: [[106, 20], [108, 22]],
    });
  });

  it('falls back to separate longitude and latitude for legacy records', () => {
    expect(resolveMapGeometryLocation(undefined, '106.8', '20.9')).toEqual({
      center: [106.8, 20.9],
      coordinates: [[106.8, 20.9]],
    });
    expect(resolveMapGeometryLocation('INVALID', undefined, undefined)).toBeNull();
    expect(resolveMapGeometryLocation(undefined, null, null)).toBeNull();
  });
});
