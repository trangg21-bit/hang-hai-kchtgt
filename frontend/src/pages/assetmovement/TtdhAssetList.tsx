import React from 'react';
import StationAssetList from './StationAssetList';
import { TTDH_CONFIG } from './stationConfigs';
import { getTtdhStationOptions } from '../../services/stationOptionsService';

export default function TtdhAssetList() {
  return (
    <StationAssetList
      config={TTDH_CONFIG}
      fetchStationOptions={getTtdhStationOptions}
    />
  );
}
