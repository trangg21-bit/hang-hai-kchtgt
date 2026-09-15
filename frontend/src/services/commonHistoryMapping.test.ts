import { describe, it, expect } from 'vitest';
import { formatFallbackFieldLabel } from '../components/shared/CommonHistoryDrawer';

describe('CommonHistoryDrawer Field Mapping & Formatting', () => {
  it('formats single camelCase fallback properly', () => {
    expect(formatFallbackFieldLabel('unknownField')).toBe('Unknown Field');
    expect(formatFallbackFieldLabel('waterDepthMeters')).toBe('Water Depth Meters');
  });

  it('translates comma-separated fields with fallback', () => {
    const combinedMap: Record<string, string> = {
      coordinates: 'Tọa độ GIS',
      latitude: 'Vĩ độ',
      longitude: 'Kinh độ',
    };
    const formatted = formatFallbackFieldLabel('coordinates, latitude, longitude', combinedMap);
    expect(formatted).toBe('Tọa độ GIS, Vĩ độ, Kinh độ');
  });

  it('handles empty or dash inputs gracefully', () => {
    expect(formatFallbackFieldLabel('')).toBe('—');
  });

  it('preserves GIS acronym and never splits it into G I S', () => {
    expect(formatFallbackFieldLabel('Loại đối tượng GIS')).toBe('Loại đối tượng GIS');
    expect(formatFallbackFieldLabel('Tọa độ GIS')).toBe('Tọa độ GIS');
    expect(formatFallbackFieldLabel('gisCoordinate')).toBe('Gis Coordinate');
    expect(formatFallbackFieldLabel('Loại đối tượng G I S')).toBe('Loại đối tượng GIS');
  });
});
