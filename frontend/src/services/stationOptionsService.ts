import api from './api';
import { lritStationService } from './lritStationService';
import { hanoiStationService } from './hanoiStationService';

export interface GenericStationOption {
  id: string;
  code?: string;
  name?: string;
  stationCode?: string;
  stationName?: string;
}

export async function getTtdhStationOptions(): Promise<GenericStationOption[]> {
  try {
    const res = await api.get('/v1/stations/coastal/options').catch(() => api.get('/v1/stations/coastal?size=5000')).catch(() => api.get('/v1/stations/coastal'));
    const raw = res.data?.data || res.data || [];
    const items = Array.isArray(raw) ? raw : raw.content || [];
    return items.map((s: Record<string, unknown>) => ({
      id: String(s.id),
      code: String(s.code || s.stationCode || ''),
      name: String(s.name || s.stationName || ''),
    }));
  } catch {
    return [];
  }
}

export async function getInmarsatStationOptions(): Promise<GenericStationOption[]> {
  try {
    const res = await api.get('/v1/stations/inmarsat/options').catch(() => api.get('/v1/stations/inmarsat/list')).catch(() => api.get('/v1/stations/inmarsat?size=5000'));
    const raw = res.data?.data || res.data || [];
    const items = Array.isArray(raw) ? raw : raw.content || [];
    return items.map((s: Record<string, unknown>) => ({
      id: String(s.id),
      code: String(s.code || s.stationCode || ''),
      name: String(s.name || s.stationName || ''),
    }));
  } catch {
    return [];
  }
}

export async function getCospasSarsatStationOptions(): Promise<GenericStationOption[]> {
  try {
    const res = await api.get('/v1/stations/cospas-sarsat/options').catch(() => api.get('/v1/stations/cospas-sarsat/list')).catch(() => api.get('/v1/stations/cospas-sarsat'));
    const raw = res.data?.data || res.data || [];
    const items = Array.isArray(raw) ? raw : raw.content || [];
    return items.map((s: Record<string, unknown>) => ({
      id: String(s.id),
      code: String(s.code || s.stationCode || ''),
      name: String(s.name || s.stationName || ''),
    }));
  } catch {
    return [];
  }
}

export async function getTtxlttStationOptions(): Promise<GenericStationOption[]> {
  try {
    const res = await hanoiStationService.getOptions();
    return (res || []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      code: String(s.code || s.stationCode || ''),
      name: String(s.name || s.stationName || ''),
    }));
  } catch {
    return [];
  }
}

export async function getLritStationOptions(): Promise<GenericStationOption[]> {
  try {
    const res = await lritStationService.getOptions();
    return (res || []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      code: String(s.code || s.stationCode || ''),
      name: String(s.name || s.stationName || ''),
    }));
  } catch {
    return [];
  }
}
