import { describe, expect, it } from 'vitest';
import {
  coordinateRowsToWkt,
  findMapGeometryHits,
  geoJsonToMapHitGeometries,
  getMapHitGeometryBounds,
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
    expect(parseWktToCoords('MULTIPOINT((106 10),(107 10),(107 11))')).toEqual([
      [106, 10],
      [107, 10],
      [107, 11],
    ]);
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

  it('hit-tests overlapping points, lines and polygons without pane priority', () => {
    const project = ([lng, lat]: [number, number]) => ({ x: lng * 10, y: lat * 10 });
    const targets = [
      {
        value: 'polygon',
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]] as [number, number][][],
        },
      },
      {
        value: 'line',
        geometry: {
          type: 'LineString' as const,
          coordinates: [[0, 5], [10, 5]] as [number, number][],
        },
      },
      {
        value: 'point',
        geometry: {
          type: 'Point' as const,
          coordinates: [5, 5] as [number, number],
        },
      },
    ];

    expect(findMapGeometryHits({ x: 50, y: 50 }, targets, project, 8).map((hit) => hit.value))
      .toEqual(['point', 'line', 'polygon']);
    expect(findMapGeometryHits({ x: 50, y: 62 }, targets, project, 8).map((hit) => hit.value))
      .toEqual(['polygon']);
    expect(findMapGeometryHits({ x: 150, y: 150 }, targets, project, 8)).toEqual([]);
  });

  it('does not treat the inside of a polygon hole as a hit', () => {
    const project = ([lng, lat]: [number, number]) => ({ x: lng, y: lat });
    const target = {
      value: 'area-with-hole',
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
          [[3, 3], [7, 3], [7, 7], [3, 7], [3, 3]],
        ] as [number, number][][],
      },
    };

    expect(findMapGeometryHits({ x: 2, y: 2 }, [target], project, 0.4)).toHaveLength(1);
    expect(findMapGeometryHits({ x: 5, y: 5 }, [target], project, 0.4)).toHaveLength(0);
  });

  it('converts planning GeoJSON collections and multi-geometries for shared hit testing', () => {
    expect(geoJsonToMapHitGeometries({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'MultiLineString',
            coordinates: [
              [[106, 20], [107, 21]],
              [[108, 22], [109, 23]],
            ],
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[[106, 20], [107, 20], [107, 21], [106, 20]]]],
          },
        },
      ],
    })).toEqual([
      { type: 'LineString', coordinates: [[106, 20], [107, 21]] },
      { type: 'LineString', coordinates: [[108, 22], [109, 23]] },
      { type: 'Polygon', coordinates: [[[106, 20], [107, 20], [107, 21], [106, 20]]] },
    ]);
  });

  it('builds a geographic bounding box for spatially indexing click targets', () => {
    expect(getMapHitGeometryBounds({
      type: 'Polygon',
      coordinates: [[[106, 20], [109, 19], [108, 23], [106, 20]]],
    })).toEqual({
      minLongitude: 106,
      minLatitude: 19,
      maxLongitude: 109,
      maxLatitude: 23,
    });
  });
});
