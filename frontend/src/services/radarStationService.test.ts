import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { radarStationCRUD, radarStationService } from './radarStationService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('radarStationService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOptions', () => {
    it('should normalize stationName to name property when calling GET /v1/radar-station/options', async () => {
      const mockBackendResponse = [
        {
          id: 'bdb9af05-4155-4866-9cce-0d4e2552d5a8',
          code: 'RADAR-000015',
          stationName: 'Cảng Tân Cảng - Cái Mép',
          orgUnitId: 'f8e415eb-9ece-4840-9478-e2c0bbb30562',
        },
        {
          id: 'd4b4de83-969d-4481-9bb3-238a83342fd5',
          code: 'RADAR-QN',
          stationName: 'Trạm Radar Quảng Ninh',
          orgUnitId: '2c18df80-652d-4708-b248-8a9889def744',
        },
      ];

      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockBackendResponse },
      });

      const res = await radarStationService.getOptions();
      expect(api.get).toHaveBeenCalledWith('/v1/radar-station/options?');
      expect(res).toHaveLength(2);
      expect(res[0].name).toBe('Cảng Tân Cảng - Cái Mép');
      expect(res[0].stationName).toBe('Cảng Tân Cảng - Cái Mép');
      expect(res[1].name).toBe('Trạm Radar Quảng Ninh');
      expect(res[1].stationName).toBe('Trạm Radar Quảng Ninh');
    });

    it('should pass orgUnitId query parameter when provided', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

      await radarStationService.getOptions('org-123');
      expect(api.get).toHaveBeenCalledWith('/v1/radar-station/options?orgUnitId=org-123');
    });
  });

  describe('getById', () => {
    it('should call GET /v1/radar-station/{id}', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'radar-1',
            code: 'RADAR-01',
            stationName: 'Trạm Radar Test',
          },
        },
      });

      const res = await radarStationCRUD.getById('radar-1');
      expect(api.get).toHaveBeenCalledWith('/v1/radar-station/radar-1');
      expect(res.id).toBe('radar-1');
      expect(res.stationName).toBe('Trạm Radar Test');
    });
  });
});
