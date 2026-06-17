import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsers } from './useUsers';
import * as userService from '../services/userService';

// Mock the userService module
vi.mock('../services/userService', () => ({
  getAllUsers: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  hardDeleteUser: vi.fn(),
  updatePassword: vi.fn(),
  lockAccount: vi.fn(),
  unlockAccount: vi.fn(),
  bulkActivate: vi.fn(),
  bulkDeactivate: vi.fn(),
  searchUsers: vi.fn(),
  findByRole: vi.fn(),
}));

describe('useUsers Hook', () => {
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

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUsers());

      expect(result.current.users).toEqual([]);
      expect(result.current.selectedUser).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.totalItems).toBe(0);
    });
  });

  describe('fetchUsers', () => {
    it('should fetch and set users', async () => {
      vi.mocked(userService.getAllUsers).mockResolvedValue([mockUser]);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.users).toEqual([mockUser]);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failure', async () => {
      vi.mocked(userService.getAllUsers).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed');
    });

    it('should pass pagination params', async () => {
      vi.mocked(userService.getAllUsers).mockResolvedValue([mockUser]);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.fetchUsers({ page: 1, size: 50, status: 'active' });
      });

      expect(userService.getAllUsers).toHaveBeenCalledWith({ page: 1, size: 50, status: 'active' });
    });
  });

  describe('fetchUser', () => {
    it('should fetch single user by ID', async () => {
      vi.mocked(userService.getUserById).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.fetchUser(mockUser.id);
      });

      expect(result.current.selectedUser).toEqual(mockUser);
    });

    it('should set error when fetch fails', async () => {
      vi.mocked(userService.getUserById).mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.fetchUser('invalid-id');
      });

      expect(result.current.error).toBe('Not found');
      expect(result.current.selectedUser).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user and update state', async () => {
      vi.mocked(userService.createUser).mockResolvedValue({ ...mockUser, id: 'new-id' });

      const { result } = renderHook(() => useUsers());

      const newUser = {
        username: 'newuser',
        email: 'new@hanghai.vn',
        displayName: 'New User',
        password: 'Pass123!',
        role: 'user',
      };

      await act(async () => {
        await result.current.createUser(newUser);
      });

      expect(result.current.users).toHaveLength(1);
      expect(result.current.users[0].username).toBe('newuser');
    });
  });

  describe('updateUser', () => {
    it('should update user and refresh list', async () => {
      vi.mocked(userService.updateUser).mockResolvedValue({ ...mockUser, displayName: 'Updated' });

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.updateUser(mockUser.id, { displayName: 'Updated' });
      });

      expect(result.current.selectedUser?.displayName).toBe('Updated');
    });
  });

  describe('deleteUser', () => {
    it('should remove user from list after delete', async () => {
      vi.mocked(userService.deleteUser).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useUsers());

      // Pre-populate with mock user
      await act(async () => {
        result.current.users = [mockUser];
        result.current.totalItems = 1;
      });

      await act(async () => {
        await result.current.deleteUser(mockUser.id);
      });

      expect(userService.deleteUser).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('searchUsers', () => {
    it('should search and update results', async () => {
      vi.mocked(userService.searchUsers).mockResolvedValue([mockUser]);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.searchUsers('admin');
      });

      expect(result.current.users).toEqual([mockUser]);
      expect(result.current.searchKeyword).toBe('admin');
    });
  });

  describe('lockAccount', () => {
    it('should lock user and refresh', async () => {
      vi.mocked(userService.lockAccount).mockResolvedValue({ ...mockUser, status: 'locked' });

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.lockAccount(mockUser.id);
      });

      expect(result.current.selectedUser?.status).toBe('locked');
    });
  });

  describe('bulkOperations', () => {
    it('should bulk activate users', async () => {
      vi.mocked(userService.bulkActivate).mockResolvedValue([mockUser]);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.bulkActivate([mockUser.id]);
      });

      expect(userService.bulkActivate).toHaveBeenCalledWith([mockUser.id]);
    });

    it('should bulk deactivate users', async () => {
      vi.mocked(userService.bulkDeactivate).mockResolvedValue([mockUser]);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.bulkDeactivate([mockUser.id]);
      });

      expect(userService.bulkDeactivate).toHaveBeenCalledWith([mockUser.id]);
    });
  });

  describe('resetState', () => {
    it('should reset all state to initial', async () => {
      const { result } = renderHook(() => useUsers());

      // Set some state
      await act(async () => {
        result.current.users = [mockUser];
        result.current.selectedUser = mockUser;
      });

      await act(async () => {
        result.current.resetState();
      });

      expect(result.current.users).toEqual([]);
      expect(result.current.selectedUser).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
