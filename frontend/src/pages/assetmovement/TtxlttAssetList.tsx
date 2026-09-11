import React from 'react';
import StationAssetList from './StationAssetList';
import { TTXLTT_CONFIG } from './stationConfigs';
import { getTtxlttStationOptions } from '../../services/stationOptionsService';

export default function TtxlttAssetList() {
  return (
    <StationAssetList
      config={TTXLTT_CONFIG}
      fetchStationOptions={getTtxlttStationOptions}
    />
  );
}
