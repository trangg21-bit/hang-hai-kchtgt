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

  it('formats condition status labels correctly for both KCHT and AIS/VTS', async () => {
    const { getConditionStatusLabel, getVtsConditionStatusLabel, getConditionStatusColor, statusOperational, statusCritical, statusAttention } = await import('../themetokenchk');
    
    // KCHT standard & AIS/VTS labels
    expect(getConditionStatusLabel('OPERATIONAL')).toBe('Đang hoạt động');
    expect(getConditionStatusLabel('STOPPED')).toBe('Dừng hoạt động');
    expect(getConditionStatusLabel('MAINTENANCE')).toBe('Đang bảo trì');
    expect(getConditionStatusLabel('UNDER_CONSTRUCTION')).toBe('Đang xây dựng');
    expect(getConditionStatusLabel('SUSPENDED')).toBe('Dừng khai thác/vận hành');
    expect(getConditionStatusLabel('NOT_YET_OPERATIONAL')).toBe('Chưa khai thác/vận hành');
    expect(getConditionStatusLabel('Đang khai thác/vận hành')).toBe('Đang khai thác/vận hành');

    // VTS/AIS specific
    expect(getVtsConditionStatusLabel('OPERATIONAL')).toBe('Đang khai thác/vận hành');
    expect(getVtsConditionStatusLabel('SUSPENDED')).toBe('Dừng khai thác/vận hành');
    expect(getVtsConditionStatusLabel('NOT_YET_OPERATIONAL')).toBe('Chưa khai thác/vận hành');

    // Colors
    expect(getConditionStatusColor('Đang khai thác/vận hành')).toBe(statusOperational);
    expect(getConditionStatusColor('Đang hoạt động')).toBe(statusOperational);
    expect(getConditionStatusColor('Dừng khai thác/vận hành')).toBe(statusCritical);
    expect(getConditionStatusColor('Dừng hoạt động')).toBe(statusCritical);
    expect(getConditionStatusColor('Chưa khai thác/vận hành')).toBe(statusAttention);
    expect(getConditionStatusColor('Đang bảo trì')).toBe(statusAttention);
  });
});
