import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { registerAccount, getRegistrationConfig } from './registrationService';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('registrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRegistrationConfig', () => {
    it('should fetch registration config and password policy', async () => {
      const mockConfig = {
        passwordPolicy: {
          minLength: 12,
          maxLength: 512,
          requireUppercase: true,
          requireLowercase: true,
          requireDigit: true,
          requireSpecialChar: true,
        },
        rateLimit: {
          maxRequests: 5,
          windowMinutes: 5,
        },
      };

      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: mockConfig,
        },
      });

      const config = await getRegistrationConfig();

      expect(api.get).toHaveBeenCalledWith('/register/config');
      expect(config.passwordPolicy?.minLength).toBe(12);
      expect(config.passwordPolicy?.requireUppercase).toBe(true);
    });
  });

  describe('registerAccount', () => {
    it('should submit registration payload to /register', async () => {
      const payload = {
        username: 'testuser',
        password: 'Password@123456',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '0901234567',
      };

      const mockResponseData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '0901234567',
        status: 'PENDING_APPROVAL',
        message: 'Đăng ký tài khoản thành công',
      };

      vi.mocked(api.post).mockResolvedValue({
        data: {
          success: true,
          data: mockResponseData,
        },
      });

      const result = await registerAccount(payload);

      expect(api.post).toHaveBeenCalledWith('/register', payload);
      expect(result.username).toBe('testuser');
      expect(result.status).toBe('PENDING_APPROVAL');
    });
  });
});
