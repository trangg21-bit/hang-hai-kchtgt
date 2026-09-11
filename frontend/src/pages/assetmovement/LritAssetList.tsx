import React from 'react';
import StationAssetList from './StationAssetList';
import { LRIT_CONFIG } from './stationConfigs';
import { getLritStationOptions } from '../../services/stationOptionsService';

export default function LritAssetList() {
  return (
    <StationAssetList
      config={LRIT_CONFIG}
      fetchStationOptions={getLritStationOptions}
    />
  );
}
