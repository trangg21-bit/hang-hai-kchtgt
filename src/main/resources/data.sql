-- Initial database seeding for users, roles, and permissions

-- 1. App Users
INSERT INTO app_users (id, username, password, email, full_name, phone, status, created_at, updated_at, failed_login_count, failed_totp_count)
VALUES
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be1', 'admin',    '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'admin@hh.gov.vn',   'Nguyen Van An',  '0912345678', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be2', 'trantmai', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'trantmai@hh.gov.vn', 'Tran Thi Mai',   '0912345679', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be3', 'leantuan', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'leantuan@hh.gov.vn', 'Le Anh Tuan',    '0912345680', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be4', 'phamdm',   '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamdm@hh.gov.vn',   'Pham Duc Minh',  '0912345681', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be5', 'buivanh',  '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'buivanh@hh.gov.vn',  'Bui Van Anh',    '0912345682', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0);

-- 2. App Roles
INSERT INTO app_roles (id, name, code, description, status, user_count, created_at, updated_at)
VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', 'Quản trị viên (Super Admin)', 'SYSTEM_ADMIN',  'Admin cao nhất hệ thống',                    'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', 'Quản trị viên (Admin)',      'ADMIN',         'Quản trị viên Cục/Cảng vụ/Chi cục',          'ACTIVE', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', 'Quản lý người dùng',         'MANAGER',       'Chuyên viên quản lý dữ liệu',                'ACTIVE', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034', 'Người dùng',                 'USER',          'Người dùng cơ bản (doanh nghiệp)',           'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035', 'Người xem (Viewer)',         'VIEWER',        'Chỉ xem, không sửa',                         'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Map Users to Roles
INSERT INTO user_roles (user_id, role_id) VALUES
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be2', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be3', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be4', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be5', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035');

-- 4. Permissions
INSERT INTO permissions (id, code, name, resource, action, created_at, updated_at) VALUES
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001', 'users:read', 'Xem danh sách người dùng', 'users', 'read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8002', 'users:create', 'Tạo mới người dùng', 'users', 'create', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8003', 'users:update', 'Cập nhật người dùng', 'users', 'update', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8004', 'users:delete', 'Xóa người dùng', 'users', 'delete', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8005', 'roles:read', 'Xem vai trò', 'roles', 'read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8006', 'roles:manage', 'Quản lý vai trò', 'roles', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8007', 'gis:read', 'Xem bản đồ GIS', 'gis', 'read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8008', 'gis:create', 'Thêm đối tượng GIS', 'gis', 'create', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8009', 'gis:update', 'Sửa đối tượng GIS', 'gis', 'update', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8010', 'gis:delete', 'Xóa đối tượng GIS', 'gis', 'delete', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8011', 'map:view', 'Xem bản đồ', 'map', 'view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8012', 'map:edit', 'Sửa cấu hình bản đồ', 'map', 'edit', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8013', 'admin:manage', 'Quản trị hệ thống', 'admin', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8014', 'audit:read', 'Xem nhật ký hoạt động', 'audit', 'read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8015', 'audit:export', 'Xuất nhật ký hoạt động', 'audit', 'export', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. Map Permissions to Roles (role_permissions)
-- SYSTEM_ADMIN (15 permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8002'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8003'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8004'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8005'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8006'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8007'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8008'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8009'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8010'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8011'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8012'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8013'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8014'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8015');

-- ADMIN (10 permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8002'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8003'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8005'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8007'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8008'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8009'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8011'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8012'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8014');

-- MANAGER (6 permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8007'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8008'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8009'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8011'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8012');

-- USER (3 permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8007'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8011');

-- VIEWER (3 permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8007'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8011');