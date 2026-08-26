import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { vtsOperationCenterService } from './vtsOperationCenterService';
import { ConditionStatus, ApprovalStatus } from '../types/vtsSystem';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('vtsOperationCenterService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search / list', () => {
    it('should call GET /v1/vts-operation-center with query string', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            content: [{ id: '1', code: 'TTDH-01', name: 'Trung tâm Hải Phòng' }],
            totalElements: 1,
            number: 0,
            size: 20,
            statusCounts: { ALL: 1 },
          },
        },
      };
      (api.get as any).mockResolvedValueOnce(mockResponse);

      const result = await vtsOperationCenterService.list({
        page: 1,
        size: 20,
        keyword: 'Hải Phòng',
        portId: 'port-1',
        vtsSystemId: 'vts-1',
        orgUnitId: 'org-1',
        conditionStatus: ConditionStatus.OPERATIONAL,
        approvalStatus: ApprovalStatus.APPROVED,
      });

      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/vts-operation-center?keyword=H%E1%BA%A3i+Ph%C3%B2ng'),
      );
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getOptions', () => {
    it('should call GET /v1/vts-operation-center/options without orgUnitId', async () => {
      const mockOptions = [
        { id: '1', code: 'TTDH-01', name: 'Trung tâm Hải Phòng', orgUnitId: 'org-1' },
      ];
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: mockOptions },
      });

      const res = await vtsOperationCenterService.getOptions();
      expect(api.get).toHaveBeenCalledWith('/v1/vts-operation-center/options');
      expect(res).toEqual(mockOptions);
    });

    it('should pass orgUnitId query when provided', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

      await vtsOperationCenterService.getOptions('org-uuid-1');
      expect(api.get).toHaveBeenCalledWith('/v1/vts-operation-center/options?orgUnitId=org-uuid-1');
    });
  });

  describe('CRUD operations', () => {
    it('should call getById', async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { success: true, data: { id: '123', code: 'TTDH-01' } },
      });
      const res = await vtsOperationCenterService.getById('123');
      expect(api.get).toHaveBeenCalledWith('/v1/vts-operation-center/123');
      expect(res.id).toBe('123');
    });

    it('should call create', async () => {
      (api.post as any).mockResolvedValueOnce({
        data: { success: true, data: { id: '123', code: 'TTDH-01' } },
      });
      const res = await vtsOperationCenterService.create({
        code: 'TTDH-01',
        name: 'TT Hải Phòng',
        vtsSystemId: 'vts-1',
        orgUnitId: 'org-1',
      });
      expect(api.post).toHaveBeenCalledWith('/v1/vts-operation-center', expect.anything());
      expect(res.id).toBe('123');
    });

    it('should call update', async () => {
      (api.put as any).mockResolvedValueOnce({
        data: { success: true, data: { id: '123', name: 'Đã sửa' } },
      });
      const res = await vtsOperationCenterService.update('123', { name: 'Đã sửa' });
      expect(api.put).toHaveBeenCalledWith('/v1/vts-operation-center/123', { name: 'Đã sửa' });
      expect(res.name).toBe('Đã sửa');
    });

    it('should call delete', async () => {
      (api.delete as any).mockResolvedValueOnce({
        data: { success: true, message: 'Xóa thành công' },
      });
      await vtsOperationCenterService.delete('123');
      expect(api.delete).toHaveBeenCalledWith('/v1/vts-operation-center/123');
    });
  });
});
