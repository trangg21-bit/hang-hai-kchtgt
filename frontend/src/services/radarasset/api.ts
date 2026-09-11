import api from '../api';
import type {
  PageResponse,
  RadarStationAsset,
  RadarStationAssetFilters,
  RadarStationAssetPayload,
} from './types';

export interface RadarStationOption {
  id: string;
  code: string;
  name: string;
}

export async function fetchRadarStationAssets(
  params: RadarStationAssetFilters
): Promise<PageResponse<RadarStationAsset>> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  });
  const res = await api.get(`/v1/asset/radar-assets?${sp.toString()}`);
  return res.data.data;
}

export async function fetchRadarStationAssetById(id: string): Promise<RadarStationAsset> {
  const res = await api.get(`/v1/asset/radar-assets/${id}`);
  return res.data.data;
}

export async function createRadarStationAsset(
  payload: RadarStationAssetPayload
): Promise<RadarStationAsset> {
  const res = await api.post('/v1/asset/radar-assets', payload);
  return res.data.data;
}

export async function updateRadarStationAsset(
  id: string,
  payload: RadarStationAssetPayload
): Promise<RadarStationAsset> {
  const res = await api.put(`/v1/asset/radar-assets/${id}`, payload);
  return res.data.data;
}

export async function deleteRadarStationAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/radar-assets/${id}`);
}

export async function fetchRadarStationOptions(orgUnitId?: string): Promise<RadarStationOption[]> {
  const sp = new URLSearchParams();
  if (orgUnitId) sp.set('orgUnitId', orgUnitId);
  try {
    const res = await api.get(`/v1/radar-station/options?${sp.toString()}`);
    const items: Array<{ id: string; code: string; stationName?: string; name?: string }> =
      res.data?.data || [];
    return items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.stationName || item.name || item.code,
    }));
  } catch {
    return [];
  }
}
