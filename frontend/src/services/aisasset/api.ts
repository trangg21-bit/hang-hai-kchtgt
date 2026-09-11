import api from '../api';
import type {
  PageResponse,
  AisSystemAsset,
  AisSystemAssetFilters,
  AisSystemAssetPayload,
} from './types';

export interface AisSystemOption {
  id: string;
  code: string;
  name: string;
}

export async function fetchAisSystemAssets(
  params: AisSystemAssetFilters
): Promise<PageResponse<AisSystemAsset>> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  });
  const res = await api.get(`/v1/asset/ais-assets?${sp.toString()}`);
  return res.data.data;
}

export async function fetchAisSystemAssetById(id: string): Promise<AisSystemAsset> {
  const res = await api.get(`/v1/asset/ais-assets/${id}`);
  return res.data.data;
}

export async function createAisSystemAsset(
  payload: AisSystemAssetPayload
): Promise<AisSystemAsset> {
  const res = await api.post('/v1/asset/ais-assets', payload);
  return res.data.data;
}

export async function updateAisSystemAsset(
  id: string,
  payload: AisSystemAssetPayload
): Promise<AisSystemAsset> {
  const res = await api.put(`/v1/asset/ais-assets/${id}`, payload);
  return res.data.data;
}

export async function deleteAisSystemAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/ais-assets/${id}`);
}

export async function fetchAisSystemOptions(orgUnitId?: string): Promise<AisSystemOption[]> {
  const sp = new URLSearchParams();
  if (orgUnitId) sp.set('orgUnitId', orgUnitId);
  try {
    const res = await api.get(`/v1/ais-system/options?${sp.toString()}`);
    const items: Array<{ id: string; code: string; name?: string }> =
      res.data?.data || [];
    return items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name || item.code,
    }));
  } catch {
    return [];
  }
}
