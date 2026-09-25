import { describe, expect, it } from 'vitest';
import { getKchtGisCategoryId, KCHT_GIS_TYPE_OPTIONS } from '../../types/gisSearch';
import {
  buildKchtScreenPath,
  isKchtSearchResultCompatibleWithFeature,
  KCHT_SCREEN_ROUTE_BY_TYPE,
  resolveKchtCustomFeatureReference,
  resolveKchtInfrastructureType,
} from './kchtGisDetailRouting';

describe('KCHT GIS detail routing', () => {
  it('has a native management screen for every searchable infrastructure type', () => {
    const missingTypes = KCHT_GIS_TYPE_OPTIONS
      .map((option) => option.value)
      .filter((type) => !KCHT_SCREEN_ROUTE_BY_TYPE[type]);

    expect(missingTypes).toEqual([]);
  });

  it.each(KCHT_GIS_TYPE_OPTIONS)('opens $label in an embedded native detail screen', ({ value }) => {
    const path = buildKchtScreenPath(value, 'record-123', 'view');
    const url = new URL(path, 'http://localhost');

    expect(url.pathname).toBe(KCHT_SCREEN_ROUTE_BY_TYPE[value]);
    expect(url.searchParams.get('embed')).toBe('gis-action');
    expect(url.searchParams.get('action')).toBe('detail');
    expect(url.searchParams.get('id')).toBe('record-123');
    expect(url.pathname).not.toContain('record-123');
  });

  it('uses the same embedded protocol for edit actions', () => {
    const url = new URL(buildKchtScreenPath('RADAR_STATION_LEGACY', 'radar-1', 'edit'), 'http://localhost');

    expect(url.pathname).toBe('/radar-station');
    expect(url.searchParams.get('action')).toBe('edit');
    expect(url.searchParams.get('id')).toBe('radar-1');
  });

  it.each([
    ['TRAM_RADAR', 'Trạm radar', 'RADAR_STATION_LEGACY'],
    ['RADAR_STATION', 'Trạm radar', 'RADAR_STATION_LEGACY'],
    ['DAI_TTDH', 'Đài TTDH', 'COASTAL_RADIO_STATION'],
  ])('normalizes legacy type %s', (infrastructureType, kchtTypeLabel, expectedType) => {
    expect(resolveKchtInfrastructureType({ infrastructureType, kchtTypeLabel })).toBe(expectedType);
  });

  it('falls back to the Vietnamese type label when the source type is unknown', () => {
    expect(resolveKchtInfrastructureType({
      infrastructureType: 'UNKNOWN',
      kchtTypeLabel: 'Hệ thống CCTV',
    })).toBe('CCTV');
  });

  it('treats refType 0 on a manually drawn AIS object as its parent seaport reference', () => {
    expect(resolveKchtCustomFeatureReference({
      categoryId: 23,
      refId: 'parent-port-123',
      refType: 0,
    })).toEqual({
      infrastructureType: 'AIS_SYSTEM',
      isSystemLinked: false,
      referenceId: 'parent-port-123',
    });
  });

  it('does not route a manually drawn berth to the berth API using its parent seaport ID', () => {
    const feature = {
      categoryId: getKchtGisCategoryId('PORT_TERMINAL'),
      refId: 'parent-port-456',
      refType: 0,
    };
    expect(resolveKchtCustomFeatureReference(feature)).toEqual({
      infrastructureType: 'PORT_TERMINAL',
      isSystemLinked: false,
      referenceId: 'parent-port-456',
    });
    expect(isKchtSearchResultCompatibleWithFeature(feature, {
      infrastructureType: 'SEAPORT',
      kchtTypeLabel: 'Cảng biển',
    })).toBe(false);
    expect(isKchtSearchResultCompatibleWithFeature(feature, {
      infrastructureType: 'PORT_TERMINAL',
      kchtTypeLabel: 'Bến cảng',
    })).toBe(true);
  });

  it('keeps a seaport spatial object linked when refType 0 identifies the seaport itself', () => {
    expect(resolveKchtCustomFeatureReference({
      categoryId: getKchtGisCategoryId('SEAPORT'),
      refId: 'seaport-123',
      refType: 0,
    })).toEqual({
      infrastructureType: 'SEAPORT',
      isSystemLinked: true,
      referenceId: 'seaport-123',
    });
  });

  it.each([
    [0, 'SEAPORT'],
    [1, 'PORT_TERMINAL'],
    [27, 'AIS_SYSTEM'],
    [28, 'CCTV'],
    [30, 'SCADA'],
    [31, 'TRANSMISSION'],
    [33, 'VTS_ASSIST'],
  ])('maps backend refType ordinal %s to %s', (refType, infrastructureType) => {
    expect(resolveKchtCustomFeatureReference({ refId: 'record-1', refType })).toEqual({
      infrastructureType,
      isSystemLinked: true,
      referenceId: 'record-1',
    });
  });

  it('keeps a manually drawn feature editable when it has no system refId', () => {
    expect(resolveKchtCustomFeatureReference({ categoryId: 23, refType: 0 })).toEqual({
      infrastructureType: 'AIS_SYSTEM',
      isSystemLinked: false,
      referenceId: undefined,
    });
  });
});
