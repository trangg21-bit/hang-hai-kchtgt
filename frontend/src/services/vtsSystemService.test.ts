import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vtsSystemCRUD, vtsSystemApproval } from './vtsSystemService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('vtsSystemService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('vtsSystemCRUD', () => {
    it('should list VTS systems with pagination and filtering parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            items: [{ id: '1', systemName: 'VTS Hòn Dấu' }],
            total: 1,
            statusCounts: { APPROVED: 1 },
          },
        },
      };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse as any);

      const result = await vtsSystemCRUD.list({ keyword: 'Hòn Dấu', page: 0, size: 10 });

      expect(api.get).toHaveBeenCalledWith('/v1/vts-system', {
        params: {
          orgUnitId: undefined,
          page: 0,
          size: 10,
          keyword: 'Hòn Dấu',
          conditionStatus: undefined,
          approvalStatus: undefined,
          year: undefined,
        },
      });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].systemName).toBe('VTS Hòn Dấu');
    });

    it('should search VTS systems correctly', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [{ id: '1', systemName: 'VTS Hải Phòng' }],
          total: 1,
        },
      };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse as any);

      const result = await vtsSystemCRUD.search({ keyword: 'Hải Phòng' });

      expect(api.get).toHaveBeenCalledWith('/v1/vts-system/search', expect.any(Object));
      expect(result.items).toHaveLength(1);
    });

    it('should fetch VTS system by ID', async () => {
      const mockItem = { id: 'vts-123', systemName: 'VTS Vũng Tàu' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockItem } } as any);

      const result = await vtsSystemCRUD.getById('vts-123');

      expect(api.get).toHaveBeenCalledWith('/v1/vts-system/vts-123');
      expect(result.id).toBe('vts-123');
    });

    it('should create a new VTS system', async () => {
      const createReq = { systemName: 'VTS Mới', systemCode: 'VTS-001' } as any;
      vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: { id: 'new-id', ...createReq } } } as any);

      const result = await vtsSystemCRUD.create(createReq);

      expect(api.post).toHaveBeenCalledWith('/v1/vts-system', createReq);
      expect(result.id).toBe('new-id');
    });

    it('should update an existing VTS system', async () => {
      const updateReq = { systemName: 'VTS Cập nhật' } as any;
      vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true, data: { id: 'vts-1', ...updateReq } } } as any);

      const result = await vtsSystemCRUD.update('vts-1', updateReq);

      expect(api.put).toHaveBeenCalledWith('/v1/vts-system/vts-1', updateReq);
      expect(result.systemName).toBe('VTS Cập nhật');
    });

    it('should delete a VTS system by ID', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: { success: true } } as any);

      await vtsSystemCRUD.delete('vts-1');

      expect(api.delete).toHaveBeenCalledWith('/v1/vts-system/vts-1');
    });
  });

  describe('vtsSystemApproval', () => {
    it('should submit C1 level approval', async () => {
      const approvalReq = { approved: true, comment: 'Đồng ý C1' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: { id: 'vts-1', approvalStatus: 'PENDING_C2' } } } as any);

      const result = await vtsSystemApproval.approveC1('vts-1', approvalReq);

      expect(api.post).toHaveBeenCalledWith('/v1/vts-system/vts-1/approve/c1', approvalReq);
      expect(result.approvalStatus).toBe('PENDING_C2');
    });

    it('should submit C2 level approval', async () => {
      const approvalReq = { approved: true, comment: 'Đồng ý C2 (Phê duyệt cấp Cục)' };
      vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: { id: 'vts-1', approvalStatus: 'APPROVED' } } } as any);

      const result = await vtsSystemApproval.approveC2('vts-1', approvalReq);

      expect(api.post).toHaveBeenCalledWith('/v1/vts-system/vts-1/approve/c2', approvalReq);
      expect(result.approvalStatus).toBe('APPROVED');
    });

    it('should fetch approval history for VTS system', async () => {
      const mockHistory = [{ id: 'h1', action: 'APPROVE_C1', actorName: 'Nguyễn Văn A' }];
      vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: mockHistory } } as any);

      const history = await vtsSystemApproval.getHistory('vts-1');

      expect(api.get).toHaveBeenCalledWith('/v1/vts-system/vts-1/history');
      expect(history).toHaveLength(1);
    });
  });
});
