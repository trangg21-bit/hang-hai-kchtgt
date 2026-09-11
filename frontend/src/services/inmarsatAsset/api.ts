import api from '../api';
import {
  fetchCoastalStationAssets,
  fetchCoastalStationAsset,
  createCoastalStationAsset,
  updateCoastalStationAsset,
  deleteCoastalStationAsset,
  fetchCoastalStationExploitations,
  createCoastalStationExploitation,
  fetchCoastalStationAdjustments,
  createCoastalStationAdjustment,
} from '../coastalStationAsset/api';
import type {
  PageResponse,
  InmarsatAsset,
  InmarsatAssetPayload,
  InmarsatAssetFilters,
  InmarsatAssetExploitation,
  InmarsatAssetExploitationPayload,
  InmarsatAssetAdjustment,
  InmarsatAssetAdjustmentPayload,
} from './types';

export const INMARSAT_ASSET_TYPE = 'Tài sản đài Inmarsat';

export async function fetchInmarsatAssets(
  params: InmarsatAssetFilters
): Promise<PageResponse<InmarsatAsset>> {
  return fetchCoastalStationAssets({
    ...params,
    assetType: INMARSAT_ASSET_TYPE,
  });
}

export async function fetchInmarsatAsset(id: string): Promise<InmarsatAsset> {
  return fetchCoastalStationAsset(id);
}

export async function createInmarsatAsset(
  payload: InmarsatAssetPayload
): Promise<InmarsatAsset> {
  return createCoastalStationAsset({
    ...payload,
    assetType: payload.assetType || INMARSAT_ASSET_TYPE,
  });
}

export async function updateInmarsatAsset(
  id: string,
  payload: InmarsatAssetPayload
): Promise<InmarsatAsset> {
  return updateCoastalStationAsset(id, {
    ...payload,
    assetType: payload.assetType || INMARSAT_ASSET_TYPE,
  });
}

export async function deleteInmarsatAsset(id: string): Promise<void> {
  return deleteCoastalStationAsset(id);
}

export async function fetchInmarsatExploitations(
  assetId: string
): Promise<InmarsatAssetExploitation[]> {
  return fetchCoastalStationExploitations(assetId);
}

export async function createInmarsatExploitation(
  assetId: string,
  payload: InmarsatAssetExploitationPayload
): Promise<InmarsatAssetExploitation> {
  return createCoastalStationExploitation(assetId, payload);
}

export async function fetchInmarsatAdjustments(
  assetId: string,
  type?: string
): Promise<InmarsatAssetAdjustment[]> {
  return fetchCoastalStationAdjustments(assetId, type);
}

export async function createInmarsatAdjustment(
  assetId: string,
  payload: InmarsatAssetAdjustmentPayload
): Promise<InmarsatAssetAdjustment> {
  return createCoastalStationAdjustment(assetId, payload);
}

export async function fetchInmarsatStationOptions(): Promise<Array<{ id: string; code: string; name: string }>> {
  try {
    const res = await api.get('/v1/stations/inmarsat/options');
    const body = res.data?.data !== undefined ? res.data.data : res.data;
    const list = Array.isArray(body) ? body : (Array.isArray(body?.content) ? body.content : []);
    if (list.length > 0) {
      return list.map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        code: String(item.code || item.deviceCode || item.stationCode || ''),
        name: String(item.name || item.stationName || ''),
      }));
    }
  } catch {
    // Fallback below
  }

  try {
    const res2 = await api.get('/v1/stations/inmarsat?size=1000');
    const body2 = res2.data?.data !== undefined ? res2.data.data : res2.data;
    const list2 = Array.isArray(body2?.content)
      ? body2.content
      : Array.isArray(body2)
        ? body2
        : Array.isArray(res2.data?.content)
          ? res2.data.content
          : [];
    return list2.map((item: Record<string, unknown>) => ({
      id: String(item.id || ''),
      code: String(item.code || item.deviceCode || item.stationCode || ''),
      name: String(item.name || item.stationName || ''),
    }));
  } catch {
    return [];
  }
}


export {
  fetchCoastalStationAssetAttachments as fetchInmarsatAssetAttachments,
  uploadCoastalStationAssetAttachments as uploadInmarsatAssetAttachments,
  deleteCoastalStationAssetAttachment as deleteInmarsatAssetAttachment,
  downloadCoastalStationAssetAttachment as downloadInmarsatAssetAttachment,
  type CoastalStationAssetAttachmentResponse as InmarsatAssetAttachmentResponse,
} from '../coastalStationAsset/api';

