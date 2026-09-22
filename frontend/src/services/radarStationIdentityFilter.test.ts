import { describe, expect, it } from 'vitest';
import { normalizeRadarIdentityFilters } from './radarStationService';

describe('radar station identity filters', () => {
  it('keeps station name and code as independent AND filters', () => {
    expect(normalizeRadarIdentityFilters('  Hòn Dấu  ', '  RADAR-13  ')).toEqual({
      stationName: 'Hòn Dấu',
      code: 'RADAR-13',
    });
  });

  it('does not widen station-name filtering to keyword', () => {
    const filters = normalizeRadarIdentityFilters('Hòn Dấu', undefined);
    expect(filters).toEqual({ stationName: 'Hòn Dấu', code: undefined });
    expect(filters).not.toHaveProperty('keyword');
  });
});
