import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../utils/apiClient';
import * as userService from './userService';

// Mock apiClient
vi.mock('../utils/apiClient', () => ({
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

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'admin',
    email: 'admin@hanghai.vn',
    displayName: 'Administrator',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  };

  describe('getAllUsers', () => {
    it('should fetch all active users', async () => {
      const mockResponse = [mockUser];
      vi.mocked(apiClient.default.get).mockResolvedValue(mockResponse);

      const result = await userService.getAllUsers({ status: 'active', page: 0, size: 20 });

      expect(apiClient.default.get).toHaveBeenCalledWith('/api/users', {
        params: { status: 'active', page: 0, size: 20 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API error', async () => {
      vi.mocked(apiClient.default.get).mockRejectedValue(new Error('Network error'));

      await expect(userService.getAllUsers()).rejects.toThrow('Network error');
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID', async () => {
      vi.mocked(apiClient.default.get).mockResolvedValue(mockUser);

      const result = await userService.getUserById(mockUser.id);

      expect(apiClient.default.get).toHaveBeenCalledWith(`/api/users/${mockUser.id}`);
      expect(result).toEqual(mockUser);
    });

    it('should handle 404 error', async () => {
      const notFoundError = { response: { status: 404 } };
      vi.mocked(apiClient.default.get).mockRejectedValue(notFoundError);

      await expect(userService.getUserById('nonexistent-id')).rejects.toThrow();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@hanghai.vn',
        displayName: 'New User',
        password: 'SecurePass123!',
        role: 'user',
      };

      vi.mocked(apiClient.default.post).mockResolvedValue({ ...mockUser, id: 'new-id' });

      const result = await userService.createUser(newUser);

      expect(apiClient.default.post).toHaveBeenCalledWith('/api/users', newUser);
      expect(result).toBeDefined();
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      const updates = {
        displayName: 'Updated Name',
        email: 'updated@hanghai.vn',
      };

      vi.mocked(apiClient.default.put).mockResolvedValue({ ...mockUser, ...updates });

      const result = await userService.updateUser(mockUser.id, updates);

      expect(apiClient.default.put).toHaveBeenCalledWith(`/api/users/${mockUser.id}`, updates);
      expect(result.displayName).toBe('Updated Name');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      vi.mocked(apiClient.default.put).mockResolvedValue({ success: true });

      await userService.updatePassword(mockUser.id, 'oldPass', 'newPass');

      expect(apiClient.default.put).toHaveBeenCalledWith(
        `/api/users/${mockUser.id}/password`,
        { oldPassword: 'oldPass', newPassword: 'newPass' }
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user', async () => {
      vi.mocked(apiClient.default.delete).mockResolvedValue({ success: true });

      await userService.deleteUser(mockUser.id);

      expect(apiClient.default.delete).toHaveBeenCalledWith(`/api/users/${mockUser.id}`);
    });

    it('should hard delete a user', async () => {
      vi.mocked(apiClient.default.delete).mockResolvedValue({ success: true });

      await userService.hardDeleteUser(mockUser.id);

      expect(apiClient.default.delete).toHaveBeenCalledWith(`/api/users/${mockUser.id}/hard`);
    });
  });

  describe('lockAccount', () => {
    it('should lock user account', async () => {
      vi.mocked(apiClient.default.patch).mockResolvedValue({ ...mockUser, status: 'locked' });

      const result = await userService.lockAccount(mockUser.id);

      expect(apiClient.default.patch).toHaveBeenCalledWith(`/api/users/${mockUser.id}/status/lock`);
      expect(result.status).toBe('locked');
    });
  });

  describe('unlockAccount', () => {
    it('should unlock user account', async () => {
      vi.mocked(apiClient.default.patch).mockResolvedValue({ ...mockUser, status: 'active' });

      const result = await userService.unlockAccount(mockUser.id);

      expect(apiClient.default.patch).toHaveBeenCalledWith(`/api/users/${mockUser.id}/status/unlock`);
      expect(result.status).toBe('active');
    });
  });

  describe('bulkActivate', () => {
    it('should bulk activate users', async () => {
      const userIds = [mockUser.id, 'another-id'];
      vi.mocked(apiClient.default.post).mockResolvedValue([{ ...mockUser, status: 'active' }]);

      const result = await userService.bulkActivate(userIds);

      expect(apiClient.default.post).toHaveBeenCalledWith('/api/users/bulk/activate', { ids: userIds });
      expect(result).toBeDefined();
    });
  });

  describe('bulkDeactivate', () => {
    it('should bulk deactivate users', async () => {
      const userIds = [mockUser.id];
      vi.mocked(apiClient.default.post).mockResolvedValue([{ ...mockUser, status: 'inactive' }]);

      const result = await userService.bulkDeactivate(userIds);

      expect(apiClient.default.post).toHaveBeenCalledWith('/api/users/bulk/deactivate', { ids: userIds });
      expect(result).toBeDefined();
    });
  });

  describe('searchUsers', () => {
    it('should search users by keyword', async () => {
      vi.mocked(apiClient.default.get).mockResolvedValue([mockUser]);

      const result = await userService.searchUsers('admin');

      expect(apiClient.default.get).toHaveBeenCalledWith('/api/users', {
        params: { keyword: 'admin', page: 0, size: 10 },
      });
      expect(result).toContainEqual(mockUser);
    });
  });

  describe('getUserByRole', () => {
    it('should filter users by role', async () => {
      vi.mocked(apiClient.default.get).mockResolvedValue([mockUser]);

      const result = await userService.findByRole('user');

      expect(apiClient.default.get).toHaveBeenCalledWith('/api/users', {
        params: { role: 'user', page: 0, size: 10 },
      });
    });
  });
});
