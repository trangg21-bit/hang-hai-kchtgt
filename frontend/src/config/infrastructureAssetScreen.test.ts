import { describe, expect, it } from 'vitest';
import {
  DIKE_REVETMENT_ASSET_SCREEN,
  LIGHTHOUSE_ASSET_SCREEN,
} from '../pages/assetmovement/infrastructureAssetScreen';

describe('LIGHTHOUSE_ASSET_SCREEN', () => {
  it('uses the lighthouse asset type and active beacon catalog relation', () => {
    expect(LIGHTHOUSE_ASSET_SCREEN).toMatchObject({
      assetType: 'LIGHTHOUSE',
      relationField: 'beaconStationId',
      title: 'Tài sản đèn biển và nhà trạm gắn liền đèn biển',
    });
  });
});

describe('DIKE_REVETMENT_ASSET_SCREEN', () => {
  it('uses the dike/revetment asset type and active dike catalog relation', () => {
    expect(DIKE_REVETMENT_ASSET_SCREEN).toMatchObject({
      assetType: 'DIKE_REVETMENT',
      relationField: 'dikeRevetmentId',
      title: 'Tài sản đê/kè',
    });
  });
});
