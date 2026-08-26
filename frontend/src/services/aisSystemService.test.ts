import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { aisSystemService } from './aisSystemService';
import { ConditionStatus, ApprovalStatus } from '../types/vtsSystem';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('aisSystemService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search / list', () => {
    it('should call GET /v1/ais-system with query string', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            content: [{ id: '1', code: 'AIS-01', name: 'Thiết bị AIS Hải Phòng' }],
            totalElements: 1,
            number: 0,
            size: 20,
            statusCounts: { ALL: 1 },
          },
        },
      };
      (api.get as any).mockResolvedValueOnce(mockResponse);

      const result = await aisSystemService.search({
        page: 1,
        size: 20,
        keyword: 'AIS',
        vtsOperationCenterId: 'op-1',
        orgUnitId: 'org-1',
        conditionStatus: ConditionStatus.OPERATIONAL,
        approvalStatus: ApprovalStatus.APPROVED,
      });

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/ais-system?keyword=AIS'),
      );
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getOptions', () => {
    it('should call GET /v1/ais-system/options without orgUnitId', async () => {
      const mockOptions = [
        { id: '1', code: 'AIS-01', name: 'Hệ thống AIS 01', orgUnitId: 'org-1' },
      ];
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockOptions },
      });

      const res = await aisSystemService.getOptions();
      expect(api.get).toHaveBeenCalledWith('/v1/ais-system/options');
      expect(res).toEqual(mockOptions);
    });

    it('should pass orgUnitId query when provided', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

      await aisSystemService.getOptions('org-uuid-1');
      expect(api.get).toHaveBeenCalledWith('/v1/ais-system/options?orgUnitId=org-uuid-1');
    });
  });

  describe('CRUD operations', () => {
    it('should call getById', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: { id: '123', code: 'AIS-01' } },
      });
      const res = await aisSystemService.getById('123');
      expect(api.get).toHaveBeenCalledWith('/v1/ais-system/123');
      expect(res.id).toBe('123');
    });

    it('should call create', async () => {
      (api.post as any).mockResolvedValueOnce({
        data: { success: true, data: { id: '123', code: 'AIS-01' } },
      });
      const res = await aisSystemService.create({
        code: 'AIS-01',
        name: 'AIS HP',
        vtsOperationCenterId: 'op-1',
        orgUnitId: 'org-1',
      });
      expect(api.post).toHaveBeenCalledWith('/v1/ais-system', expect.anything());
      expect(res.id).toBe('123');
    });

    it('should call delete', async () => {
      (api.delete as any).mockResolvedValueOnce({
        data: { success: true, message: 'Xóa thành công' },
      });
      await aisSystemService.delete('123');
      expect(api.delete).toHaveBeenCalledWith('/v1/ais-system/123');
    });
  });
});
