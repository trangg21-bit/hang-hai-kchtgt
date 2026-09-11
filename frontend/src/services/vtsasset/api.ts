import api from '../api';
import type {
  PageResponse,
  VtsSystemAsset,
  VtsSystemAssetFilters,
  VtsSystemAssetPayload,
} from './types';

export interface VtsSystemOption {
  id: string;
  code: string;
  name: string;
}

export async function fetchVtsSystemAssets(
  params: VtsSystemAssetFilters
): Promise<PageResponse<VtsSystemAsset>> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  });
  const res = await api.get(`/v1/asset/vts-assets?${sp.toString()}`);
  return res.data.data;
}

export async function fetchVtsSystemAssetById(id: string): Promise<VtsSystemAsset> {
  const res = await api.get(`/v1/asset/vts-assets/${id}`);
  return res.data.data;
}

export async function createVtsSystemAsset(
  payload: VtsSystemAssetPayload
): Promise<VtsSystemAsset> {
  const res = await api.post('/v1/asset/vts-assets', payload);
  return res.data.data;
}

export async function updateVtsSystemAsset(
  id: string,
  payload: VtsSystemAssetPayload
): Promise<VtsSystemAsset> {
  const res = await api.put(`/v1/asset/vts-assets/${id}`, payload);
  return res.data.data;
}

export async function deleteVtsSystemAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/vts-assets/${id}`);
}

export async function fetchVtsSystemOptions(orgUnitId?: string): Promise<VtsSystemOption[]> {
  const sp = new URLSearchParams();
  if (orgUnitId) sp.set('orgUnitId', orgUnitId);
  sp.set('size', '200');
  try {
    const res = await api.get(`/v1/vts-systems?${sp.toString()}`);
    const items: Array<{ id: string; code: string; systemName?: string; name?: string }> =
      res.data?.data?.items || res.data?.data?.content || [];
    return items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.systemName || item.name || item.code,
    }));
  } catch {
    return [];
  }
}
