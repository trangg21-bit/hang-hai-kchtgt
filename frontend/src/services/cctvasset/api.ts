import api from '../api';
import type {
  PageResponse,
  CctvSystemAsset,
  CctvSystemAssetFilters,
  CctvSystemAssetPayload,
  CctvDeviceOption,
} from './types';

export async function fetchCctvSystemAssets(
  params: CctvSystemAssetFilters
): Promise<PageResponse<CctvSystemAsset>> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  });
  const res = await api.get(`/v1/asset/cctv-assets?${sp.toString()}`);
  return res.data.data;
}

export async function fetchCctvSystemAssetById(id: string): Promise<CctvSystemAsset> {
  const res = await api.get(`/v1/asset/cctv-assets/${id}`);
  return res.data.data;
}

export async function createCctvSystemAsset(
  payload: CctvSystemAssetPayload
): Promise<CctvSystemAsset> {
  const res = await api.post('/v1/asset/cctv-assets', payload);
  return res.data.data;
}

export async function updateCctvSystemAsset(
  id: string,
  payload: CctvSystemAssetPayload
): Promise<CctvSystemAsset> {
  const res = await api.put(`/v1/asset/cctv-assets/${id}`, payload);
  return res.data.data;
}

export async function deleteCctvSystemAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/cctv-assets/${id}`);
}

export async function fetchCctvDeviceOptions(): Promise<CctvDeviceOption[]> {
  try {
    const res = await api.get('/v1/cctv/options');
    const items: Array<{ id: string; deviceCode: string; deviceName: string; orgUnitId?: string }> =
      res.data?.data || [];
    return items.map((item) => ({
      id: item.id,
      deviceCode: item.deviceCode,
      deviceName: item.deviceName,
      orgUnitId: item.orgUnitId,
    }));
  } catch {
    return [];
  }
}
