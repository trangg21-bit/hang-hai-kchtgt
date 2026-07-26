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

// ============================================================
// GROUPS
// ============================================================
export const MOCK_GROUPS = [
  { id: 'grp-001', name: 'Nhóm Quản trị viên', code: 'GRP_ADMINS', description: 'Nhóm dành cho quản trị viên hệ thống', permissions: ['user:manage', 'role:manage', 'admin:manage', 'group:manage', 'orgunit:manage', 'log:manage'], memberCount: 3, status: 'active' as const, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'grp-002', name: 'Nhóm Lãnh đạo', code: 'GRP_LEADERS', description: 'Nhóm dành cho lãnh đạo các phòng ban', permissions: ['user:read', 'data:read', 'report:read'], memberCount: 5, status: 'active' as const, createdAt: '2025-02-15T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' },
  { id: 'grp-003', name: 'Nhóm Chuyên viên GIS', code: 'GRP_GIS', description: 'Nhóm chuyên viên quản lý dữ liệu GIS và bản đồ', permissions: ['data:read', 'data:create', 'data:update', 'map:manage'], memberCount: 8, status: 'active' as const, createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
  { id: 'grp-004', name: 'Nhóm Báo hiệu hàng hải', code: 'GRP_BEACON', description: 'Nhóm quản lý đèn biển và phao tiêu', permissions: ['data:read', 'data:create', 'data:update'], memberCount: 6, status: 'active' as const, createdAt: '2025-03-15T00:00:00Z', updatedAt: '2026-04-20T00:00:00Z' },
  { id: 'grp-005', name: 'Nhóm Cảng vụ Hải Phòng', code: 'GRP_HPV', description: 'Nhóm cán bộ Cảng vụ Hàng hải Hải Phòng', permissions: ['port:read', 'berth:read', 'navigationchannel:read', 'data:read'], memberCount: 12, status: 'active' as const, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z' },
  { id: 'grp-006', name: 'Nhóm Báo cáo Thống kê', code: 'GRP_REPORTS', description: 'Nhóm chuyên viên tổng hợp báo cáo thống kê', permissions: ['report:read', 'data:read'], memberCount: 4, status: 'active' as const, createdAt: '2025-05-01T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'grp-007', name: 'Nhóm Khu nước & VTS', code: 'GRP_VTS', description: 'Nhóm quản lý luồng, VTS, đê kè', permissions: ['navigationchannel:read', 'dikerevetment:read', 'vts:read', 'radarstation:read', 'data:read'], memberCount: 7, status: 'active' as const, createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'grp-008', name: 'Nhóm Đài duyên hải', code: 'GRP_STATIONS', description: 'Nhóm quản lý đài duyên hải và vệ tinh', permissions: ['station:read', 'data:read'], memberCount: 5, status: 'active' as const, createdAt: '2025-07-01T00:00:00Z', updatedAt: '2026-05-15T00:00:00Z' },
  { id: 'grp-009', name: 'Nhóm Kiểm kê tài sản', code: 'GRP_ASSET', description: 'Nhóm kiểm kê và quản lý biến động tài sản', permissions: ['asset:increase-request', 'asset:decrease-request', 'asset:inventory', 'asset:exploitation', 'data:read'], memberCount: 9, status: 'active' as const, createdAt: '2025-08-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'grp-010', name: 'Nhóm Hỗ trợ kỹ thuật', code: 'GRP_TECH', description: 'Nhóm hỗ trợ kỹ thuật và vận hành hệ thống', permissions: ['log:manage', 'connection:read', 'user:read'], memberCount: 3, status: 'inactive' as const, createdAt: '2025-09-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
];

// ============================================================
// ORGANIZATIONS
// ============================================================
export const MOCK_ORGANIZATIONS = [
  { id: 'org-001', name: 'Cục Hàng hải và Đường thủy Việt Nam', code: 'CUC_HH', parentId: undefined, parentOrgName: undefined, level: 1, type: 'CUC' as const, description: 'Cơ quan quản lý nhà nước về hàng hải', address: 'Số 8 Phạm Hùng, Hà Nội', phone: '024.37683111', contactPerson: 'Nguyễn Văn An', status: 'approved' as const, childCount: 3, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'org-002', name: 'Cảng vụ Hàng hải Hải Phòng', code: 'CV_HP', parentId: 'org-001', parentOrgName: 'Cục Hàng hải và Đường thủy Việt Nam', level: 2, type: 'CANG_VU' as const, description: 'Cảng vụ quản lý khu vực Hải Phòng', address: 'Số 3 Lý Tự Trọng, Hải Phòng', phone: '0225.3822123', contactPerson: 'Lê Anh Tuấn', status: 'approved' as const, childCount: 0, createdAt: '2025-02-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  { id: 'org-003', name: 'Cảng vụ Hàng hải Quảng Ninh', code: 'CV_QN', parentId: 'org-001', parentOrgName: 'Cục Hàng hải và Đường thủy Việt Nam', level: 2, type: 'CANG_VU' as const, description: 'Cảng vụ quản lý khu vực Quảng Ninh', address: 'Số 12 Trần Phú, Hạ Long, Quảng Ninh', phone: '0203.3825234', contactPerson: 'Trần Quốc Cường', status: 'approved' as const, childCount: 0, createdAt: '2025-02-15T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
  { id: 'org-004', name: 'Cảng vụ Hàng hải TP. Hồ Chí Minh', code: 'CV_HCM', parentId: 'org-001', parentOrgName: 'Cục Hàng hải và Đường thủy Việt Nam', level: 2, type: 'CANG_VU' as const, description: 'Cảng vụ quản lý khu vực TP. Hồ Chí Minh', address: 'Số 45 Nguyễn Tất Thành, TP. HCM', phone: '028.38221123', contactPerson: 'Bùi Văn Anh', status: 'approved' as const, childCount: 0, createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'org-005', name: 'Chi cục Hàng hải Miền Bắc', code: 'CC_MB', parentId: 'org-001', parentOrgName: 'Cục Hàng hải và Đường thủy Việt Nam', level: 2, type: 'CHI_CUC' as const, description: 'Chi cục quản lý khu vực phía Bắc', address: 'Số 5 Ngô Quyền, Hà Nội', phone: '024.38262234', contactPerson: 'Phạm Đức Minh', status: 'approved' as const, childCount: 2, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
  { id: 'org-006', name: 'Chi cục Hàng hải Miền Trung', code: 'CC_MT', parentId: 'org-001', parentOrgName: 'Cục Hàng hải và Đường thủy Việt Nam', level: 2, type: 'CHI_CUC' as const, description: 'Chi cục quản lý khu vực miền Trung', address: 'Số 20 Bạch Đằng, Đà Nẵng', phone: '0236.3822334', contactPerson: 'Nguyễn Thị Hương', status: 'pending' as const, childCount: 0, createdAt: '2025-05-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'org-007', name: 'Đội Quản lý Đèn biển Hải Phòng', code: 'DL_DB_HP', parentId: 'org-005', parentOrgName: 'Chi cục Hàng hải Miền Bắc', level: 2, type: 'CANG_VU' as const, description: 'Đội quản lý hệ thống đèn biển Hải Phòng', address: 'Số 8 Trần Hưng Đạo, Hải Phòng', phone: '0225.3834456', contactPerson: 'Nguyễn Hồng Sơn', status: 'approved' as const, childCount: 0, createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
  { id: 'org-008', name: 'Đội Quản lý Phao tiêu Quảng Ninh', code: 'DL_PT_QN', parentId: 'org-005', parentOrgName: 'Chi cục Hàng hải Miền Bắc', level: 2, type: 'CANG_VU' as const, description: 'Đội quản lý hệ thống phao tiêu Quảng Ninh', address: 'Số 3 Cái Lân, Hạ Long', phone: '0203.3834567', contactPerson: 'Đỗ Thanh Phương', status: 'approved' as const, childCount: 0, createdAt: '2025-07-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'org-009', name: 'Tổng công ty Bảo đảm An toàn Hàng hải Miền Bắc', code: 'TCT_BDAT_MB', parentId: 'org-001', parentOrgName: 'Cục Hàng hải và Đường thủy Việt Nam', level: 2, type: 'TCT' as const, description: 'Tổng công ty bảo đảm an toàn hàng hải khu vực phía Bắc', address: 'Số 15 Lê Thánh Tông, Hải Phòng', phone: '0225.3845678', contactPerson: 'Vũ Hoàng Quân', status: 'approved' as const, childCount: 1, createdAt: '2025-03-15T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z' },
  { id: 'org-010', name: 'Xí nghiệp Bảo đảm An toàn Hàng hải Đông Bắc Bộ', code: 'XN_DBB', parentId: 'org-009', parentOrgName: 'Tổng công ty Bảo đảm An toàn Hàng hải Miền Bắc', level: 2, type: 'CANG_VU' as const, description: 'Xí nghiệp trực thuộc TCT BĐAT HH Miền Bắc', address: 'Số 25 Nguyễn Trãi, Hải Phòng', phone: '0225.3856789', contactPerson: 'Nguyễn Thùy Linh', status: 'draft' as const, childCount: 0, createdAt: '2025-08-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'org-011', name: 'Phòng Quản lý KCHTGT Hàng Hải', code: 'P_KCHT', parentId: 'org-001', parentOrgName: 'Cục Hàng hải và Đường thủy Việt Nam', level: 2, type: 'CHI_CUC' as const, description: 'Phòng chuyên trách quản lý kết cấu hạ tầng giao thông hàng hải', address: 'Số 8 Phạm Hùng, Hà Nội', phone: '024.37684567', contactPerson: 'Trần Thị Mai', status: 'approved' as const, childCount: 0, createdAt: '2025-09-01T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
  { id: 'org-012', name: 'Trung tâm Phối hợp Tìm kiếm Cứu nạn Hàng hải', code: 'TT_TKCN', parentId: 'org-001', parentOrgName: 'Cục Hàng hải và Đường thủy Việt Nam', level: 2, type: 'TCT' as const, description: 'Trung tâm phối hợp tìm kiếm cứu nạn trên biển', address: 'Số 1 Nguyễn Cơ Thạch, Hà Nội', phone: '024.37891234', contactPerson: 'Phạm Ngọc Hoài', status: 'rejected' as const, childCount: 0, createdAt: '2025-10-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  // Level 3 — Đại diện
  { id: 'org-013', name: 'Đại diện Cảng vụ Hải Phòng tại Đình Vũ', code: 'DD_CVHP_DV', parentId: 'org-002', parentOrgName: 'Cảng vụ Hàng hải Hải Phòng', level: 3, type: 'CANG_VU' as const, description: 'Văn phòng đại diện tại khu vực Đình Vũ', address: 'KCN Đình Vũ, Hải Phòng', phone: '0225.3768111', contactPerson: 'Hoàng Minh Đức', status: 'approved' as const, childCount: 0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z' },
  { id: 'org-014', name: 'Đại diện Cảng vụ Quảng Ninh tại Cái Lân', code: 'DD_CVQN_CL', parentId: 'org-003', parentOrgName: 'Cảng vụ Hàng hải Quảng Ninh', level: 3, type: 'CANG_VU' as const, description: 'Văn phòng đại diện tại cảng Cái Lân', address: 'Cảng Cái Lân, Hạ Long, Quảng Ninh', phone: '0203.3825999', contactPerson: 'Lê Văn Hải', status: 'approved' as const, childCount: 0, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-06-20T00:00:00Z' },
  { id: 'org-015', name: 'Đại diện Cảng vụ TP.HCM tại Cát Lái', code: 'DD_CVHCM_CL', parentId: 'org-004', parentOrgName: 'Cảng vụ Hàng hải TP. Hồ Chí Minh', level: 3, type: 'CANG_VU' as const, description: 'Văn phòng đại diện tại cảng Cát Lái', address: 'Cảng Cát Lái, TP. Thủ Đức, TP.HCM', phone: '028.38221999', contactPerson: 'Trần Thanh Tùng', status: 'pending' as const, childCount: 0, createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
  { id: 'org-016', name: 'Đại diện Xí nghiệp BĐAT Đông Bắc Bộ tại Móng Cái', code: 'DD_XNDBB_MC', parentId: 'org-010', parentOrgName: 'Xí nghiệp Bảo đảm An toàn Hàng hải Đông Bắc Bộ', level: 3, type: 'CANG_VU' as const, description: 'Văn phòng đại diện tại cửa khẩu Móng Cái', address: 'Số 5 Trần Phú, Móng Cái, Quảng Ninh', phone: '0203.3888123', contactPerson: 'Nguyễn Thanh Hà', status: 'draft' as const, childCount: 0, createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-07-05T00:00:00Z' },
  { id: 'org-017', name: 'Đại diện Chi cục Hàng hải Miền Bắc tại Hải Dương', code: 'DD_CCMB_HD', parentId: 'org-005', parentOrgName: 'Chi cục Hàng hải Miền Bắc', level: 3, type: 'CHI_CUC' as const, description: 'Văn phòng đại diện tại Hải Dương', address: 'Số 10 Nguyễn Lương Bằng, Hải Dương', phone: '0220.3856123', contactPerson: 'Phạm Văn Khánh', status: 'approved' as const, childCount: 0, createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-07-10T00:00:00Z' },
];
