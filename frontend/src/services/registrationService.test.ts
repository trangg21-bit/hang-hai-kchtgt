import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { registerAccount, getRegistrationConfig, getRegistrationOrgUnits } from './registrationService';

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

  describe('getRegistrationOrgUnits', () => {
    it('should fetch active organizational units for registration', async () => {
      const mockOrgs = [
        { id: 'org-1', name: 'Cục Hàng hải Việt Nam', code: 'CHHVN', parentId: null },
        { id: 'org-2', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP', parentId: 'org-1' },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: {
          success: true,
          data: mockOrgs,
        },
      });

      const result = await getRegistrationOrgUnits();

      expect(api.get).toHaveBeenCalledWith('/register/org-units');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Cục Hàng hải Việt Nam');
      expect(result[1].parentId).toBe('org-1');
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
        orgUnitId: '123e4567-e89b-12d3-a456-426614174001',
        department: 'Phòng Pháp chế',
        position: 'Chuyên viên',
      };

      const mockResponseData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '0901234567',
        orgUnitId: '123e4567-e89b-12d3-a456-426614174001',
        orgUnitName: 'Cảng vụ Hàng hải Hải Phòng',
        department: 'Phòng Pháp chế',
        position: 'Chuyên viên',
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
      expect(result.orgUnitName).toBe('Cảng vụ Hàng hải Hải Phòng');
      expect(result.department).toBe('Phòng Pháp chế');
      expect(result.position).toBe('Chuyên viên');
      expect(result.status).toBe('PENDING_APPROVAL');
    });
  });
});
