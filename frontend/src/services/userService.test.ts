import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { userService } from './userService';

// Mock api
vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserApiData = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'admin',
    email: 'admin@hanghai.vn',
    fullName: 'Administrator',
    phone: '0901234567',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('list', () => {
    it('should fetch paginated users', async () => {
      const mockResponse = {
        data: {
          data: {
            content: [mockUserApiData],
            totalElements: 1,
          },
        },
      };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await userService.list({ status: 'active', page: 1, pageSize: 20 });

      expect(api.get).toHaveBeenCalledWith('/users', {
        params: {
          search: undefined,
          fullName: undefined,
          status: 'ACTIVE',
          orgUnitId: undefined,
          page: 0,
          size: 20,
          sortField: undefined,
          sortOrder: undefined,
        },
      });
      expect(result.data.length).toBe(1);
      expect(result.data[0].username).toBe('admin');
      expect(result.total).toBe(1);
    });

    it('should handle API error in list', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));
      await expect(userService.list({})).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    it('should fetch user by ID', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { data: mockUserApiData } });

      const result = await userService.getById(mockUserApiData.id);

      expect(api.get).toHaveBeenCalledWith(`/users/${mockUserApiData.id}`);
      expect(result.success).toBe(true);
      expect(result.data.username).toBe('admin');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@hanghai.vn',
        fullName: 'New User',
        phone: '0912345678',
        password: 'SecurePass123!',
        status: 'active' as const,
      };

      vi.mocked(api.post).mockResolvedValue({ data: { data: { ...mockUserApiData, ...newUser } } });

      const result = await userService.create(newUser);

      expect(api.post).toHaveBeenCalledWith('/users', expect.objectContaining({
        fullName: 'New User',
        email: 'newuser@hanghai.vn',
      }));
      expect(result.success).toBe(true);
    });
  });

  describe('update', () => {
    it('should update user profile', async () => {
      const updates = {
        fullName: 'Updated Name',
        email: 'updated@hanghai.vn',
        phone: '0909999999',
      };

      vi.mocked(api.put).mockResolvedValue({ data: { data: { ...mockUserApiData, ...updates } } });

      const result = await userService.update(mockUserApiData.id, updates);

      expect(api.put).toHaveBeenCalledWith(`/users/${mockUserApiData.id}`, expect.objectContaining({
        fullName: 'Updated Name',
      }));
      expect(result.data.fullName).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: { success: true } });

      const result = await userService.delete(mockUserApiData.id);

      expect(api.delete).toHaveBeenCalledWith(`/users/${mockUserApiData.id}`);
      expect(result.success).toBe(true);
    });
  });

  describe('toggleLock', () => {
    it('should call lock endpoint when active', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { data: { ...mockUserApiData, status: 'LOCKED' } } });

      const result = await userService.toggleLock(mockUserApiData.id, 'active');

      expect(api.post).toHaveBeenCalledWith(`/users/${mockUserApiData.id}/lock`);
      expect(result.data.status).toBe('locked');
    });

    it('should call unlock endpoint when locked', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { data: { ...mockUserApiData, status: 'ACTIVE' } } });

      const result = await userService.toggleLock(mockUserApiData.id, 'locked');

      expect(api.post).toHaveBeenCalledWith(`/users/${mockUserApiData.id}/unlock`);
      expect(result.data.status).toBe('active');
    });

    it('should call lock endpoint with reason when provided', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { data: { ...mockUserApiData, status: 'LOCKED' } } });

      const result = await userService.toggleLock(mockUserApiData.id, 'active', 'Vi phạm quy định');

      expect(api.post).toHaveBeenCalledWith(`/users/${mockUserApiData.id}/lock`, { reason: 'Vi phạm quy định' });
      expect(result.data.status).toBe('locked');
    });
  });
});
