import api from '../api';
import type {
  PageResponse,
  ScadaSystemAsset,
  ScadaSystemAssetFilters,
  ScadaSystemAssetPayload,
  ScadaDeviceOption,
} from './types';

export async function fetchScadaSystemAssets(
  params: ScadaSystemAssetFilters
): Promise<PageResponse<ScadaSystemAsset>> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  });
  const res = await api.get(`/v1/asset/scada-assets?${sp.toString()}`);
  return res.data.data;
}

export async function fetchScadaSystemAssetById(id: string): Promise<ScadaSystemAsset> {
  const res = await api.get(`/v1/asset/scada-assets/${id}`);
  return res.data.data;
}

export async function createScadaSystemAsset(
  payload: ScadaSystemAssetPayload
): Promise<ScadaSystemAsset> {
  const res = await api.post('/v1/asset/scada-assets', payload);
  return res.data.data;
}

export async function updateScadaSystemAsset(
  id: string,
  payload: ScadaSystemAssetPayload
): Promise<ScadaSystemAsset> {
  const res = await api.put(`/v1/asset/scada-assets/${id}`, payload);
  return res.data.data;
}

export async function deleteScadaSystemAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/scada-assets/${id}`);
}

export async function fetchScadaDeviceOptions(): Promise<ScadaDeviceOption[]> {
  try {
    const res = await api.get('/v1/scada/options');
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
