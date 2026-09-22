import { describe, expect, it } from 'vitest';
import { buildTransferAreaGisFormPatch } from '../pages/transfer-area/transferAreaFormUtils';

describe('buildTransferAreaGisFormPatch', () => {
  it('keeps GIS enabled when coordinates are selected directly from the map', () => {
    expect(buildTransferAreaGisFormPatch({ geometryType: 'point' })).toEqual({
      geometryType: 'POINT',
      coordinateSystem: 1,
      displayRule: 'Độ, phút, giây (DMS)',
    });
  });

  it('preserves the selected coordinate system and map symbol', () => {
    expect(buildTransferAreaGisFormPatch({ geometryType: 'POLYGON', symbolId: 'symbol-1' }, 2)).toEqual({
      geometryType: 'POLYGON',
      coordinateSystem: 2,
      displayRule: 'Độ, phút, giây (DMS)',
      mapSymbolId: 'symbol-1',
    });
  });
});
