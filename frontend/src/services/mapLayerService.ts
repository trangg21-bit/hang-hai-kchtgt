import api from './api';
import type { PaginatedResponse } from '../types/common';
import type {
  MapLayer,
  CreateMapLayerPayload,
  UpdateMapLayerPayload,
  MapView,
  CreateMapViewPayload,
  UpdateMapViewPayload,
  MapOverlay,
  CreateMapOverlayPayload,
  UpdateMapOverlayPayload,
  MapStyle,
  CreateMapStylePayload,
  UpdateMapStylePayload,
} from '../types/mapLayer';

export const mapLayerService = {
  // ===== MapLayer CRUD =====
  async list(params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<MapLayer>> {
    const res = await api.get('/map-layers');
    const data = res.data.data || [];
    return {
      data,
      total: data.length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10,
    };
  },

  async getAll(): Promise<MapLayer[]> {
    const res = await api.get('/map-layers');
    return res.data.data || [];
  },

  async getById(id: string): Promise<MapLayer> {
    const res = await api.get(`/map-layers/${id}`);
    return res.data.data;
  },

  async getByLayerType(layerType: string): Promise<MapLayer[]> {
    const res = await api.get(`/map-layers/type/${layerType}`);
    return res.data.data || [];
  },

  async findVisibleLayers(): Promise<MapLayer[]> {
    const res = await api.get('/map-layers/visible');
    return res.data.data || [];
  },

  async create(payload: CreateMapLayerPayload): Promise<MapLayer> {
    const res = await api.post('/map-layers', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateMapLayerPayload): Promise<MapLayer> {
    const res = await api.put(`/map-layers/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/map-layers/${id}`);
  },

  // ===== MapView CRUD =====
  async findViews(): Promise<MapView[]> {
    const res = await api.get('/map-layers/map-views');
    return res.data.data || [];
  },

  async findViewById(id: string): Promise<MapView> {
    const res = await api.get(`/map-layers/map-views/${id}`);
    return res.data.data;
  },

  async findViewsByUserId(userId: number): Promise<MapView[]> {
    const res = await api.get(`/map-layers/map-views/user/${userId}`);
    return res.data.data || [];
  },

  async createView(payload: CreateMapViewPayload): Promise<MapView> {
    const res = await api.post('/map-layers/map-views', payload);
    return res.data.data;
  },

  async updateView(id: string, payload: UpdateMapViewPayload): Promise<MapView> {
    const res = await api.put(`/map-layers/map-views/${id}`, payload);
    return res.data.data;
  },

  async deleteView(id: string): Promise<void> {
    await api.delete(`/map-layers/map-views/${id}`);
  },

  // ===== MapOverlay CRUD =====
  async findOverlays(): Promise<MapOverlay[]> {
    const res = await api.get('/map-layers/overlays');
    return res.data.data || [];
  },

  async findOverlayById(id: string): Promise<MapOverlay> {
    const res = await api.get(`/map-layers/overlays/${id}`);
    return res.data.data;
  },

  async findOverlaysByLayerName(layerName: string): Promise<MapOverlay[]> {
    const res = await api.get(`/map-layers/overlays/layer/${layerName}`);
    return res.data.data || [];
  },

  async findVisibleOverlays(): Promise<MapOverlay[]> {
    const res = await api.get('/map-layers/overlays/visible');
    return res.data.data || [];
  },

  async createOverlay(payload: CreateMapOverlayPayload): Promise<MapOverlay> {
    const res = await api.post('/map-layers/overlays', payload);
    return res.data.data;
  },

  async updateOverlay(id: string, payload: UpdateMapOverlayPayload): Promise<MapOverlay> {
    const res = await api.put(`/map-layers/overlays/${id}`, payload);
    return res.data.data;
  },

  async deleteOverlay(id: string): Promise<void> {
    await api.delete(`/map-layers/overlays/${id}`);
  },

  // ===== MapStyle CRUD =====
  async findStyles(): Promise<MapStyle[]> {
    const res = await api.get('/map-layers/styles');
    return res.data.data || [];
  },

  async findStyleById(id: string): Promise<MapStyle> {
    const res = await api.get(`/map-layers/styles/${id}`);
    return res.data.data;
  },

  async findStylesByLayerId(layerId: string): Promise<MapStyle[]> {
    const res = await api.get(`/map-layers/styles/layer/${layerId}`);
    return res.data.data || [];
  },

  async createStyle(payload: CreateMapStylePayload): Promise<MapStyle> {
    const res = await api.post('/map-layers/styles', payload);
    return res.data.data;
  },

  async updateStyle(id: string, payload: UpdateMapStylePayload): Promise<MapStyle> {
    const res = await api.put(`/map-layers/styles/${id}`, payload);
    return res.data.data;
  },

  async deleteStyle(id: string): Promise<void> {
    await api.delete(`/map-layers/styles/${id}`);
  },
};
