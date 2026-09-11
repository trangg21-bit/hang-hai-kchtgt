import React from 'react';
import StationAssetList from './StationAssetList';
import { INMARSAT_CONFIG } from './stationConfigs';
import { getInmarsatStationOptions } from '../../services/stationOptionsService';

export default function InmarsatAssetList() {
  return (
    <StationAssetList
      config={INMARSAT_CONFIG}
      fetchStationOptions={getInmarsatStationOptions}
    />
  );
}
