import { describe, expect, it } from 'vitest';
import {
  buildMapShareUrl,
  circleToPolygonCoordinates,
  parseSharedMapView,
} from '../utils/mapInteraction';

describe('map interaction helpers', () => {
  it('builds a stable share URL without dropping existing filters', () => {
    const result = buildMapShareUrl(
      'http://127.0.0.1:3001/gis/map?kchtType=PORT',
      20.1234567,
      106.7654321,
      8.4,
    );
    const url = new URL(result);

    expect(url.searchParams.get('kchtType')).toBe('PORT');
    expect(url.searchParams.get('mapLat')).toBe('20.123457');
    expect(url.searchParams.get('mapLon')).toBe('106.765432');
    expect(url.searchParams.get('mapZoom')).toBe('8');
  });

  it('parses a valid shared viewport', () => {
    expect(parseSharedMapView('?mapLat=20.123457&mapLon=106.765432&mapZoom=8')).toEqual({
      latitude: 20.123457,
      longitude: 106.765432,
      zoom: 8,
    });
  });

  it('rejects incomplete and out-of-range shared viewports', () => {
    expect(parseSharedMapView('?mapLat=20&mapLon=106')).toBeNull();
    expect(parseSharedMapView('?mapLat=95&mapLon=106&mapZoom=8')).toBeNull();
    expect(parseSharedMapView('?mapLat=20&mapLon=106&mapZoom=30')).toBeNull();
  });

  it('converts a circle to a closed polygon suitable for persistence', () => {
    const coordinates = circleToPolygonCoordinates(20, 106, 1000, 32);

    expect(coordinates).toHaveLength(33);
    expect(coordinates[coordinates.length - 1]).toEqual(coordinates[0]);
    expect(coordinates.some(([longitude]) => longitude > 106)).toBe(true);
    expect(coordinates.some(([, latitude]) => latitude < 20)).toBe(true);
  });
});
