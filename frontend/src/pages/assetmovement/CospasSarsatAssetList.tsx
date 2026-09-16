import StationAssetList from './StationAssetList';
import { COSPAS_SARSAT_CONFIG } from './stationConfigs';
import { getCospasSarsatStationOptions } from '../../services/stationOptionsService';

export default function CospasSarsatAssetList() {
  return (
    <StationAssetList
      config={COSPAS_SARSAT_CONFIG}
      fetchStationOptions={getCospasSarsatStationOptions}
    />
  );
}
