import api from '../api';
import type {
  PageResponse,
  VhfAsset,
  VhfAssetPayload,
  VhfAssetFilters,
  VhfAssetExploitation,
  VhfAssetAdjustment,
} from './types';

const BASE_URL = '/v1/asset/transmission-assets';
export const VHF_ASSET_TYPE = 'Tài sản HTTT liên lạc VHF';

export async function fetchVhfAssets(params: VhfAssetFilters): Promise<PageResponse<VhfAsset>> {
  const sp = new URLSearchParams();
  const mergedParams = { assetType: VHF_ASSET_TYPE, ...params };
  Object.entries(mergedParams).forEach(([key, value]) => {
    if (value !== undefined && value !== '') sp.set(key, String(value));
  });
  const res = await api.get(`${BASE_URL}?${sp}`);
  return res.data.data;
}

export async function fetchVhfAsset(id: string): Promise<VhfAsset> {
  const res = await api.get(`${BASE_URL}/${id}`);
  return res.data.data;
}

export async function createVhfAsset(payload: VhfAssetPayload): Promise<VhfAsset> {
  const res = await api.post(BASE_URL, {
    ...payload,
    assetType: payload.assetType || VHF_ASSET_TYPE,
  });
  return res.data.data;
}

export async function updateVhfAsset(id: string, payload: VhfAssetPayload): Promise<VhfAsset> {
  const res = await api.put(`${BASE_URL}/${id}`, {
    ...payload,
    assetType: payload.assetType || VHF_ASSET_TYPE,
  });
  return res.data.data;
}

export async function deleteVhfAsset(id: string): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

export async function fetchVhfExploitations(assetId: string): Promise<VhfAssetExploitation[]> {
  const res = await api.get(`${BASE_URL}/${assetId}/exploitations`);
  return res.data.data;
}

export async function createVhfExploitation(assetId: string, payload: Partial<VhfAssetExploitation>): Promise<VhfAssetExploitation> {
  const res = await api.post(`${BASE_URL}/${assetId}/exploitations`, payload);
  return res.data.data;
}

export async function fetchVhfAdjustments(assetId: string, type?: string): Promise<VhfAssetAdjustment[]> {
  const sp = type ? `?type=${type}` : '';
  const res = await api.get(`${BASE_URL}/${assetId}/adjustments${sp}`);
  return res.data.data;
}

export async function createVhfAdjustment(assetId: string, payload: Partial<VhfAssetAdjustment>): Promise<VhfAssetAdjustment> {
  const res = await api.post(`${BASE_URL}/${assetId}/adjustments`, payload);
  return res.data.data;
}

export {
  fetchTransmissionAssetAttachments as fetchVhfAssetAttachments,
  uploadTransmissionAssetAttachments as uploadVhfAssetAttachments,
  deleteTransmissionAssetAttachment as deleteVhfAssetAttachment,
  downloadTransmissionAssetAttachment as downloadVhfAssetAttachment,
  type TransmissionAssetAttachmentResponse as VhfAssetAttachmentResponse,
} from '../transmissionAsset/api';
