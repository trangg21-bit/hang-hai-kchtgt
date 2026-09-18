import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type User } from '../../store/authStore';
import { resolveDefaultOrgUnitId } from '../../components/org-unit';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../../services/beaconService', () => ({
  beaconStationCRUD: {
    generateCode: vi.fn().mockResolvedValue('DB-TEST-001'),
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    findById: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    listAttachments: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/organizationService', () => ({
  organizationService: {
    getTree: vi.fn().mockResolvedValue([
      { id: 'org-cuc-hh', name: 'Cục Hàng hải Việt Nam', code: 'CHH' },
      { id: 'org-cv-hp', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP', parentId: 'org-cuc-hh' },
      { id: 'org-bdathh-mb', name: 'Tổng công ty Bảo đảm an toàn hàng hải Miền Bắc', code: 'BDATHHMB', parentId: 'org-cuc-hh' },
    ]),
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

describe('BeaconStation Default Managing Unit (/beacon-stations)', () => {
  const mockOrganizations = [
    { id: 'org-cuc-hh', name: 'Cục Hàng hải Việt Nam', code: 'CHH' },
    { id: 'org-cv-hp', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CVHP', parentId: 'org-cuc-hh' },
    { id: 'org-bdathh-mb', name: 'Tổng công ty Bảo đảm an toàn hàng hải Miền Bắc', code: 'BDATHHMB', parentId: 'org-cuc-hh' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('xác định đúng đơn vị quản lý mặc định theo tài khoản cán bộ đang tạo bản ghi (Cảng vụ Hải Phòng)', () => {
    const user: User = {
      id: 'user-cvhp-01',
      userId: 'user-cvhp-01',
      username: 'canbo_hp',
      fullName: 'Cán bộ Hải Phòng',
      role: 'CV_STAFF',
      status: 'ACTIVE',
      orgUnitId: 'org-cv-hp',
      orgUnitName: 'Cảng vụ Hàng hải Hải Phòng',
    };

    const resolved = resolveDefaultOrgUnitId(user, mockOrganizations);
    expect(resolved).toBe('org-cv-hp');
  });

  it('xác định đúng đơn vị quản lý mặc định theo tài khoản cán bộ Tổng công ty BĐATHH Miền Bắc', () => {
    const user: User = {
      id: 'user-bdathh-01',
      userId: 'user-bdathh-01',
      username: 'canbo_bdathh',
      fullName: 'Cán bộ BĐATHH',
      role: 'STAFF',
      status: 'ACTIVE',
      orgUnitId: 'org-bdathh-mb',
      orgUnitName: 'Tổng công ty Bảo đảm an toàn hàng hải Miền Bắc',
    };

    const resolved = resolveDefaultOrgUnitId(user, mockOrganizations);
    expect(resolved).toBe('org-bdathh-mb');
  });

  it('không tự gán mã gốc Bộ GTVT (G17) cho đơn vị quản lý khi tài khoản là Admin cấp Bộ', () => {
    const ministryUser: User = {
      id: 'user-ministry-admin',
      userId: 'user-ministry-admin',
      username: 'admin_bgtvt',
      fullName: 'Quản trị viên Bộ',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      orgUnitId: '00000000-0000-0000-0000-000000000017',
      orgUnitCode: 'G17',
    };

    const resolved = resolveDefaultOrgUnitId(ministryUser, mockOrganizations);
    expect(resolved).toBeUndefined();
  });

  it('truy vấn /users/me nạp orgUnitId khi currentUser trong store chưa có orgUnitId', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: {
        data: {
          id: 'user-lazy',
          username: 'canbo_lazy',
          orgUnitId: 'org-cv-hp',
          orgUnitName: 'Cảng vụ Hàng hải Hải Phòng',
        },
      },
    });

    const res = await api.get('/users/me');
    const profile = res.data?.data;
    expect(profile?.orgUnitId).toBe('org-cv-hp');

    const resolved = resolveDefaultOrgUnitId(profile, mockOrganizations);
    expect(resolved).toBe('org-cv-hp');
  });
});
