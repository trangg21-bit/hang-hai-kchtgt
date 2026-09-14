import React from 'react';
import type { FormInstance } from 'antd';
import type { Organization } from '../../services/organizationService';
import type {
  LritAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import type { InfrastructureAttachmentItem } from '../../components/shared/InfrastructureAttachmentTab';
import StationAssetForm, { type StationFormValues } from './StationAssetForm';
import { LRIT_CONFIG } from './stationConfigs';

export type LritFormValues = StationFormValues;

export interface LritAssetFormProps {
  open: boolean;
  drawerMode?: 'create' | 'edit' | 'detail';
  selected?: LritAsset;
  form: FormInstance<LritFormValues>;
  organizations: Organization[];
  stations: { id: string; name: string; code?: string }[];
  attachments: InfrastructureAttachmentItem[];
  exploitationRows?: AssetExploitationResponse[];
  increaseRows?: AssetIncreaseResponse[];
  decreaseRows?: AssetDecreaseResponse[];
  orgName?: (id?: string) => string;
  saving: boolean;
  saveAction: string;
  onClose: () => void;
  onSave: (status: string) => void | Promise<void>;
  onUploadAttachment: (file: File) => void;
  onDeleteAttachment: (id: string) => void;
  onDownloadAttachment: (id: string, fileName: string) => void;
}

export default function LritAssetForm(props: LritAssetFormProps) {
  return <StationAssetForm config={LRIT_CONFIG} {...props} />;
}
