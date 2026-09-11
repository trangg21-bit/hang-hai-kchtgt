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
});
