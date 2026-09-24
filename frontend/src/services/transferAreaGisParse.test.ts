import { describe, it, expect } from 'vitest';
import { parseGisCoordinates } from '../pages/transfer-area/transferAreaPayload';

describe('TransferArea GIS parsing', () => {
  it('parses POLYGON with spaces between POLYGON and ((', () => {
    const wkt = 'POLYGON ((106.1 10.2, 107.1 10.2, 107.1 11.2, 106.1 11.2, 106.1 10.2))';
    const res = parseGisCoordinates({ coordinates: wkt });
    expect(res).toHaveLength(4);
    expect(res[0]).toEqual({ latitude: 10.2, longitude: 106.1 });
    expect(res[1]).toEqual({ latitude: 10.2, longitude: 107.1 });
    expect(res[2]).toEqual({ latitude: 11.2, longitude: 107.1 });
    expect(res[3]).toEqual({ latitude: 11.2, longitude: 106.1 });
  });

  it('parses WKT with SRID=4326; prefix correctly without losing coordinates', () => {
    const wkt = 'SRID=4326;POLYGON ((106.1 10.2, 107.1 10.2, 107.1 11.2, 106.1 11.2, 106.1 10.2))';
    const res = parseGisCoordinates({ coordinates: wkt });
    expect(res).toHaveLength(4);
    expect(res[0]).toEqual({ latitude: 10.2, longitude: 106.1 });
    expect(res[1]).toEqual({ latitude: 10.2, longitude: 107.1 });
    expect(res[2]).toEqual({ latitude: 11.2, longitude: 107.1 });
    expect(res[3]).toEqual({ latitude: 11.2, longitude: 106.1 });
  });

  it('parses LINESTRING with spaces and SRID prefix', () => {
    const wkt = 'SRID=4326;LINESTRING ( 106.5 10.5, 106.6 10.6 )';
    const res = parseGisCoordinates({ coordinates: wkt });
    expect(res).toHaveLength(2);
    expect(res[0]).toEqual({ latitude: 10.5, longitude: 106.5 });
    expect(res[1]).toEqual({ latitude: 10.6, longitude: 106.6 });
  });

  it('parses POINT with spaces and SRID prefix', () => {
    const wkt = 'SRID=4326;POINT ( 106.5 10.5 )';
    const res = parseGisCoordinates({ coordinates: wkt });
    expect(res).toHaveLength(1);
    expect(res[0]).toEqual({ latitude: 10.5, longitude: 106.5 });
  });

  it('returns empty array for invalid or empty input', () => {
    expect(parseGisCoordinates(null)).toEqual([]);
    expect(parseGisCoordinates({ coordinates: '' })).toEqual([]);
    expect(parseGisCoordinates({ coordinates: 'INVALID' })).toEqual([]);
  });
});
