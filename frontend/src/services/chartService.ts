import api from './api';

export interface ChartCell {
  id: string;
  cellName: string;
  producer?: string;
  edition?: number;
  scale?: number;
  updateNumber?: number;
  releaseDate?: string;
  isEncrypted: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface ChartFeature {
  id: string;
  featureName?: string;
  featureCode: string;
  geometryType: 'POINT' | 'LINE' | 'POLYGON';
  coordinates: string;
  attributes: Record<string, any>;
  s52Style: {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    strokeDashArray: string;
    iconSymbol: string;
    fillOpacity: number;
  };
}

export interface S63Permit {
  id: string;
  cellName: string;
  permitKey: string;
  expiryDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalibrationRequest {
  systemType: string;
  coord1: string;
  coord2: string;
  zoneOrCm?: string;
  dx: number;
  dy: number;
}

export interface CalibrationResult {
  longitude: number;
  latitude: number;
  valid: boolean;
  errorMessage?: string;
}

export const chartService = {
  async importS57(file: File): Promise<ChartCell> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/gis/charts/s57/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async importS63(file: File): Promise<ChartCell> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/gis/charts/s63/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async getAllCells(): Promise<ChartCell[]> {
    const res = await api.get('/gis/charts/cells');
    return res.data.data || [];
  },

  async getS52StyledFeatures(cellId: string, palette = 'DAY'): Promise<ChartFeature[]> {
    const res = await api.get(`/gis/charts/cells/${cellId}/s52-styled`, {
      params: { palette },
    });
    return res.data.data || [];
  },

  async getAllPermits(): Promise<S63Permit[]> {
    const res = await api.get('/gis/charts/permits');
    return res.data.data || [];
  },

  async registerPermit(payload: { cellName: string; permitKey: string; expiryDate: string }): Promise<S63Permit> {
    const res = await api.post('/gis/charts/permits', payload);
    return res.data.data;
  },

  async deletePermit(id: string): Promise<void> {
    await api.delete(`/gis/charts/permits/${id}`);
  },

  async calibrate(payload: CalibrationRequest): Promise<CalibrationResult> {
    const res = await api.post('/gis/charts/calibrate', payload);
    return res.data.data;
  },
};
