import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { lritStationService } from './lritStationService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('lritStationService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search / list', () => {
    it('should call GET /v1/stations/lrit and /v1/stations/lrit/counts', async () => {
      const mockListRes = {
        data: {
          data: {
            content: [{ id: '1', code: 'LRIT-0001', name: 'Đài LRIT Hải Phòng' }],
            totalElements: 1,
            number: 0,
            size: 10,
          },
        },
      };
      const mockCountsRes = {
        data: {
          data: { all: 1, approved: 1 },
        },
      };
      (api.get as any).mockResolvedValueOnce(mockListRes);
      (api.get as any).mockResolvedValueOnce(mockCountsRes);

      const res = await lritStationService.search({ page: 1, size: 10, keyword: 'Hải Phòng' });
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/v1/stations/lrit?keyword=H%E1%BA%A3i+Ph%C3%B2ng'));
      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.statusCounts.all).toBe(1);
    });
  });

  describe('CRUD & Approval', () => {
    it('should call GET /v1/stations/lrit/:id', async () => {
      (api.get as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', name: 'Đài LRIT' } } });
      const res = await lritStationService.getById('uuid-1');
      expect(api.get).toHaveBeenCalledWith('/v1/stations/lrit/uuid-1');
      expect(res.name).toBe('Đài LRIT');
    });

    it('should call POST /v1/stations/lrit?action=DRAFT', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'new-id', name: 'Đài LRIT Mới' } } });
      const res = await lritStationService.create({ name: 'Đài LRIT Mới' }, 'DRAFT');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/lrit?action=DRAFT', { name: 'Đài LRIT Mới' });
      expect(res.id).toBe('new-id');
    });

    it('should call POST /v1/stations/lrit/:id/submit', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', approvalStatus: 2 } } });
      const res = await lritStationService.submit('uuid-1');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/lrit/uuid-1/submit');
      expect(res.approvalStatus).toBe(2);
    });

    it('should call POST /v1/stations/lrit/:id/approve-c1', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', approvalStatus: 3 } } });
      const res = await lritStationService.approveC1('uuid-1');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/lrit/uuid-1/approve-c1', {});
      expect(res.approvalStatus).toBe(3);
    });

    it('should call POST /v1/stations/lrit/:id/approve-c2', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', approvalStatus: 5 } } });
      const res = await lritStationService.approveC2('uuid-1');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/lrit/uuid-1/approve-c2', {});
      expect(res.approvalStatus).toBe(5);
    });

    it('should call POST /v1/stations/lrit/:id/reject with reason', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', rejectionReason: 'Sai vị trí' } } });
      const res = await lritStationService.reject('uuid-1', 'Sai vị trí');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/lrit/uuid-1/reject', { reason: 'Sai vị trí' });
      expect(res.rejectionReason).toBe('Sai vị trí');
    });

    it('should call DELETE /v1/stations/lrit/:id', async () => {
      (api.delete as any).mockResolvedValueOnce({});
      await lritStationService.delete('uuid-1');
      expect(api.delete).toHaveBeenCalledWith('/v1/stations/lrit/uuid-1');
    });
  });
});
