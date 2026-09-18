import { describe, it, expect } from 'vitest';

const parseGisCoordinates = (gisLocation: { geometryType?: string; coordinates?: string } | undefined | null): Array<{ latitude: number; longitude: number }> => {
  const wkt = gisLocation?.coordinates;
  if (!wkt || typeof wkt !== 'string' || !wkt.trim()) return [];
  try {
    const trimmed = wkt.trim();
    if (trimmed.toUpperCase().startsWith('LINESTRING')) {
      const m = trimmed.match(/LINESTRING\s*\(\s*([^)]+)\s*\)/i);
      if (m) return m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    }
    if (trimmed.toUpperCase().startsWith('POLYGON')) {
      const m = trimmed.match(/POLYGON\s*\(\s*\(\s*([^)]+)\s*\)\s*\)/i);
      if (m) {
        const pts = m[1].split(',').map(p => { const [lng, lat] = p.trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
        if (pts.length > 1 && pts[0].longitude === pts[pts.length - 1].longitude && pts[0].latitude === pts[pts.length - 1].latitude) pts.pop();
        return pts;
      }
    }
    const mm = trimmed.match(/MULTIPOINT\s*\(\s*((?:\([^)]*\),?)+)\s*\)/i);
    if (mm) return mm[1].split('),(').map(p => { const [lng, lat] = p.replace(/[()]/g, '').trim().split(/\s+/); return { latitude: parseFloat(lat), longitude: parseFloat(lng) }; }).filter(c => !isNaN(c.latitude));
    const pm = trimmed.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (pm) return [{ latitude: parseFloat(pm[2]), longitude: parseFloat(pm[1]) }];
  } catch { /* ignore */ }
  return [];
};

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

  it('parses LINESTRING with spaces', () => {
    const wkt = 'LINESTRING ( 106.5 10.5, 106.6 10.6 )';
    const res = parseGisCoordinates({ coordinates: wkt });
    expect(res).toHaveLength(2);
    expect(res[0]).toEqual({ latitude: 10.5, longitude: 106.5 });
    expect(res[1]).toEqual({ latitude: 10.6, longitude: 106.6 });
  });

  it('parses POINT with spaces', () => {
    const wkt = 'POINT ( 106.5 10.5 )';
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
