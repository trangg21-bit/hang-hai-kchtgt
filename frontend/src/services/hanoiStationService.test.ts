import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { hanoiStationService } from './hanoiStationService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('hanoiStationService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search / list', () => {
    it('should call GET /v1/stations/haiphong and /v1/stations/haiphong/counts', async () => {
      const mockListRes = {
        data: {
          data: {
            content: [{ id: '1', code: 'TTXLTT-0001', name: 'Đài TTXLTT Hà Nội' }],
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

      const res = await hanoiStationService.search({ page: 1, size: 10, keyword: 'Hà Nội' });
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/v1/stations/haiphong?keyword=H%C3%A0+N%E1%BB%99i'));
      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.statusCounts.all).toBe(1);
    });
  });

  describe('CRUD & Approval', () => {
    it('should call GET /v1/stations/haiphong/:id', async () => {
      (api.get as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', name: 'Đài TTXLTT Hà Nội' } } });
      const res = await hanoiStationService.getById('uuid-1');
      expect(api.get).toHaveBeenCalledWith('/v1/stations/haiphong/uuid-1');
      expect(res.name).toBe('Đài TTXLTT Hà Nội');
    });

    it('should call POST /v1/stations/haiphong?action=DRAFT', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'new-id', name: 'Đài TTXLTT Mới' } } });
      const res = await hanoiStationService.create({ name: 'Đài TTXLTT Mới' }, 'DRAFT');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/haiphong?action=DRAFT', { name: 'Đài TTXLTT Mới' });
      expect(res.id).toBe('new-id');
    });

    it('should call POST /v1/stations/haiphong/:id/submit', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', approvalStatus: 2 } } });
      const res = await hanoiStationService.submit('uuid-1');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/haiphong/uuid-1/submit');
      expect(res.approvalStatus).toBe(2);
    });

    it('should call POST /v1/stations/haiphong/:id/approve-c1', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', approvalStatus: 3 } } });
      const res = await hanoiStationService.approveC1('uuid-1');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/haiphong/uuid-1/approve-c1', { content: 'Đã phê duyệt cấp 1' });
      expect(res.approvalStatus).toBe(3);
    });

    it('should call POST /v1/stations/haiphong/:id/approve-c2', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', approvalStatus: 5 } } });
      const res = await hanoiStationService.approveC2('uuid-1');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/haiphong/uuid-1/approve-c2', { content: 'Đã phê duyệt cấp 2' });
      expect(res.approvalStatus).toBe(5);
    });

    it('should call POST /v1/stations/haiphong/:id/reject with reason', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { data: { id: 'uuid-1', rejectionReason: 'Thiếu đường truyền' } } });
      const res = await hanoiStationService.reject('uuid-1', 'Thiếu đường truyền');
      expect(api.post).toHaveBeenCalledWith('/v1/stations/haiphong/uuid-1/reject', { reason: 'Thiếu đường truyền' });
      expect(res.rejectionReason).toBe('Thiếu đường truyền');
    });

    it('should call DELETE /v1/stations/haiphong/:id', async () => {
      (api.delete as any).mockResolvedValueOnce({});
      await hanoiStationService.delete('uuid-1');
      expect(api.delete).toHaveBeenCalledWith('/v1/stations/haiphong/uuid-1');
    });
  });
});
