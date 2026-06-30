import type { User } from '../types/user';
import type { Role } from '../types/role';
import type { Permission } from '../types/permission';

// ============================================================
// PERMISSIONS
// ============================================================
export const ALL_PERMISSIONS: Permission[] = [
  // User Management
  { key: 'user:read', name: 'Xem danh sách người dùng', group: 'user_management', description: 'Xem danh sách và thông tin người dùng' },
  { key: 'user:manage', name: 'Quản lý người dùng', group: 'user_management', description: 'Tạo, sửa, xóa, khóa/mở khóa người dùng' },
  { key: 'user:approve', name: 'Phê duyệt người dùng', group: 'user_management', description: 'Phê duyệt tài khoản người dùng mới' },

  // Role Management
  { key: 'role:manage', name: 'Quản lý vai trò & phân quyền', group: 'role_management', description: 'Tạo, sửa, xóa, gán vai trò và phân quyền' },

  // Admin Account Management
  { key: 'admin:manage', name: 'Quản lý tài khoản quản trị', group: 'admin_management', description: 'Xem, tạo, sửa, xóa tài khoản quản trị viên và cấu hình hệ thống' },

  // Group Management
  { key: 'group:manage', name: 'Quản lý nhóm', group: 'group_management', description: 'Tạo, sửa, xóa nhóm người dùng' },

  // Organization Unit Management
  { key: 'orgunit:read', name: 'Xem đơn vị tổ chức', group: 'org_management', description: 'Xem danh sách và chi tiết đơn vị tổ chức' },
  { key: 'orgunit:manage', name: 'Quản lý đơn vị tổ chức', group: 'org_management', description: 'Tạo, sửa, xóa đơn vị tổ chức' },
  { key: 'orgunit:approve', name: 'Phê duyệt đơn vị tổ chức', group: 'org_management', description: 'Phê duyệt đơn vị tổ chức mới' },

  // Connection Management
  { key: 'connection:read', name: 'Xem kết nối liên thông', group: 'connection', description: 'Xem danh sách và trạng thái kết nối liên thông' },
  { key: 'connection:manage', name: 'Quản lý kết nối liên thông', group: 'connection', description: 'Tạo, sửa, xóa và cấu hình kết nối liên thông' },

  // GIS / Bản đồ
  { key: 'data:read', name: 'Xem dữ liệu đối tượng', group: 'gis', description: 'Xem danh sách và chi tiết dữ liệu (point, line, polygon)' },
  { key: 'data:create', name: 'Tạo dữ liệu đối tượng', group: 'gis', description: 'Thêm mới dữ liệu đối tượng' },
  { key: 'data:update', name: 'Chỉnh sửa dữ liệu đối tượng', group: 'gis', description: 'Chỉnh sửa dữ liệu đối tượng' },
  { key: 'data:approve', name: 'Phê duyệt dữ liệu đối tượng', group: 'gis', description: 'Phê duyệt dữ liệu đối tượng' },
  { key: 'data:write', name: 'Viết dữ liệu (tổng hợp)', group: 'gis', description: 'Tạo và chỉnh sửa dữ liệu' },
  { key: 'map:manage', name: 'Quản lý lớp bản đồ', group: 'gis', description: 'Quản lý lớp bản đồ và hải đồ S-57/S-63' },
  { key: 'check:read', name: 'Xem kết quả kiểm tra', group: 'gis', description: 'Xem kết quả rà soát, kiểm tra dữ liệu' },
  { key: 'approve:action', name: 'Thao tác phê duyệt', group: 'gis', description: 'Thực hiện phê duyệt đối tượng' },
  { key: 'api:share', name: 'Chia sẻ API dữ liệu', group: 'gis', description: 'Cho phép chia sẻ dữ liệu qua API' },

  // System & Security
  { key: 'log:manage', name: 'Quản lý nhật ký hệ thống', group: 'system', description: 'Xem, xuất, cấu hình lưu trữ audit log' },
  { key: 'report:read', name: 'Xem báo cáo thống kê', group: 'system', description: 'Xem báo cáo và thống kê số liệu' },
  { key: 'security:monitor', name: 'Giám sát an ninh (SIEM)', group: 'system', description: 'Giám sát an toàn thông tin, SIEM' },
  { key: 'security:read', name: 'Xem cảnh báo an ninh', group: 'system', description: 'Xem báo cáo an ninh, cảnh báo' },
];

// ============================================================
// ROLES
// ============================================================
export const MOCK_ROLES: Role[] = [
  {
    id: 'role-001',
    name: 'Quản trị viên (Super Admin)',
    code: 'super_admin',
    description: 'Toàn quyền quản trị hệ thống',
    permissions: ALL_PERMISSIONS.map(p => p.key),
    userCount: 2,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'role-002',
    name: 'Quản trị viên (Admin)',
    code: 'admin',
    description: 'Quản lý người dùng và xem vai trò',
    permissions: ['user:read', 'user:manage', 'role:manage'],
    userCount: 5,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-05-20T00:00:00Z',
  },
  {
    id: 'role-003',
    name: 'Quản lý người dùng',
    code: 'user_manager',
    description: 'Quản lý tài khoản người dùng',
    permissions: ['user:read', 'user:manage'],
    userCount: 12,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-04-10T00:00:00Z',
  },
  {
    id: 'role-004',
    name: 'Người xem (Viewer)',
    code: 'viewer',
    description: 'Chỉ xem thông tin',
    permissions: ['user:read', 'role:manage'],
    userCount: 8,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
];

// ============================================================
// USERS
// ============================================================
export const MOCK_USERS: User[] = [
  {
    id: 'user-001',
    username: 'admin',
    fullName: 'Nguyễn Văn An',
    email: 'admin@hh.gov.vn',
    phone: '0901234567',
    roleId: 'ROLE_SYSTEM_ADMIN',
    roleName: 'Quản trị hệ thống',
    status: 'active',
    lastLoginAt: '2026-06-17T08:30:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 'user-002',
    username: 'tuanla',
    fullName: 'Lê Anh Tuấn',
    email: 'tuanla@hh.gov.vn',
    phone: '0902345678',
    roleId: 'ROLE_ADMIN',
    roleName: 'Quản trị đơn vị',
    status: 'active',
    lastLoginAt: '2026-06-17T09:15:00Z',
    createdAt: '2025-02-10T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
  },
  {
    id: 'user-003',
    username: 'huongnt',
    fullName: 'Nguyễn Thị Hương',
    email: 'huongnt@hh.gov.vn',
    phone: '0903456789',
    roleId: 'ROLE_SPECIALIST',
    roleName: 'Chuyên viên',
    status: 'active',
    lastLoginAt: '2026-06-16T16:45:00Z',
    createdAt: '2025-03-15T00:00:00Z',
    updatedAt: '2026-05-20T00:00:00Z',
  },
  {
    id: 'user-004',
    username: 'minhpd',
    fullName: 'Phạm Đức Minh',
    email: 'minhpd@hh.gov.vn',
    phone: '0904567890',
    roleId: 'ROLE_SPECIALIST',
    roleName: 'Chuyên viên',
    status: 'locked',
    lastLoginAt: '2026-05-01T10:00:00Z',
    createdAt: '2025-04-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'user-005',
    username: 'linhnt',
    fullName: 'Nguyễn Thùy Linh',
    email: 'linhnt@hh.gov.vn',
    phone: '0905678901',
    roleId: 'ROLE_LEADER',
    roleName: 'Lãnh đạo',
    status: 'inactive',
    lastLoginAt: '2026-01-15T08:00:00Z',
    createdAt: '2025-05-20T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'user-006',
    username: 'cuongtq',
    fullName: 'Trần Quốc Cường',
    email: 'cuongtq@hh.gov.vn',
    phone: '0906789012',
    roleId: 'ROLE_LEADER',
    roleName: 'Lãnh đạo',
    status: 'active',
    lastLoginAt: '2026-06-16T14:20:00Z',
    createdAt: '2025-06-10T00:00:00Z',
    updatedAt: '2026-04-15T00:00:00Z',
  },
  {
    id: 'user-007',
    username: 'anhbv',
    fullName: 'Bùi Văn Anh',
    email: 'anhbv@hh.gov.vn',
    phone: '0907890123',
    roleId: 'ROLE_ADMIN',
    roleName: 'Quản trị đơn vị',
    status: 'active',
    lastLoginAt: '2026-06-17T07:50:00Z',
    createdAt: '2025-07-05T00:00:00Z',
    updatedAt: '2026-06-05T00:00:00Z',
  },
  {
    id: 'user-008',
    username: 'maitt',
    fullName: 'Trần Thị Mai',
    email: 'maitt@hh.gov.vn',
    phone: '0908901234',
    roleId: 'ROLE_SPECIALIST',
    roleName: 'Chuyên viên',
    status: 'locked',
    lastLoginAt: '2026-04-20T11:30:00Z',
    createdAt: '2025-08-15T00:00:00Z',
    updatedAt: '2026-06-12T00:00:00Z',
  },
  {
    id: 'user-009',
    username: 'quanvh',
    fullName: 'Vũ Hoàng Quân',
    email: 'quanvh@hh.gov.vn',
    phone: '0909012345',
    roleId: 'ROLE_LEADER',
    roleName: 'Lãnh đạo',
    status: 'active',
    lastLoginAt: '2026-06-10T09:00:00Z',
    createdAt: '2025-09-20T00:00:00Z',
    updatedAt: '2026-02-20T00:00:00Z',
  },
  {
    id: 'user-010',
    username: 'phuongdt',
    fullName: 'Đỗ Thanh Phương',
    email: 'phuongdt@hh.gov.vn',
    phone: '0910123456',
    roleId: 'ROLE_SPECIALIST',
    roleName: 'Chuyên viên',
    status: 'inactive',
    lastLoginAt: '2025-12-01T08:00:00Z',
    createdAt: '2025-10-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'user-011',
    username: 'sonnh',
    fullName: 'Nguyễn Hồng Sơn',
    email: 'sonnh@hh.gov.vn',
    phone: '0911234567',
    roleId: 'ROLE_ADMIN',
    roleName: 'Quản trị đơn vị',
    status: 'active',
    lastLoginAt: '2026-06-16T17:00:00Z',
    createdAt: '2025-11-10T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'user-012',
    username: 'hoaipn',
    fullName: 'Phạm Ngọc Hoài',
    email: 'hoaipn@hh.gov.vn',
    phone: '0912345678',
    roleId: 'ROLE_SPECIALIST',
    roleName: 'Chuyên viên',
    status: 'active',
    lastLoginAt: '2026-06-17T10:30:00Z',
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-05-25T00:00:00Z',
  },
];

// Current logged-in user (for permission guard demo)
export const CURRENT_USER: User = MOCK_USERS[0];
