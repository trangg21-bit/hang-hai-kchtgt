import React from 'react';
import type {
  LritAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import StationAssetDetailContent from './StationAssetDetailContent';
import { LRIT_CONFIG } from './stationConfigs';

export interface LritAssetDetailContentProps {
  open: boolean;
  selectedRecord?: LritAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  stationMap: Map<string, { id: string; name: string; code?: string }>;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
}

export default function LritAssetDetailContent(props: LritAssetDetailContentProps) {
  return <StationAssetDetailContent config={LRIT_CONFIG} {...props} />;
}
