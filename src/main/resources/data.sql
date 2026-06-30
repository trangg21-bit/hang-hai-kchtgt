-- Initial database seeding for users, roles, and permissions

-- 1. App Users
INSERT INTO app_users (id, username, password, email, full_name, phone, status, created_at, updated_at, failed_login_count, failed_totp_count)
VALUES
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be1', 'admin',    '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'admin@hh.gov.vn',   'Nguyễn Văn An',  '0912345678', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be2', 'trantmai', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'trantmai@hh.gov.vn', 'Trần Thị Mai',   '0912345679', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be3', 'leantuan', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'leantuan@hh.gov.vn', 'Lê Anh Tuan',    '0912345680', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be4', 'phamdm',   '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamdm@hh.gov.vn',   'Phạm Đức Minh',  '0912345681', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be5', 'buivanh',  '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'buivanh@hh.gov.vn',  'Bùi Văn Anh',    '0912345682', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf1', 'nguyenthib', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'nguyenthib@hh.gov.vn', 'Nguyễn Thị Bình', '0912345683', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf2', 'phamvancl', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamvancl@hh.gov.vn', 'Phạm Văn Cường', '0912345684', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf3', 'hoangthid', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'hoangthid@hh.gov.vn', 'Hoàng Thị Dung', '0912345685', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf4', 'vuvanem', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'vuvanem@hh.gov.vn', 'Vũ Văn Em', '0912345686', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf5', 'lethif', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'lethif@hh.gov.vn', 'Lê Thị Hoa', '0912345687', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf6', 'nguyenvang', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'nguyenvang@hh.gov.vn', 'Nguyễn Văn Giáp', '0912345688', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf7', 'tranvanh', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'tranvanh@hh.gov.vn', 'Trần Văn Hải', '0912345689', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf8', 'phamthii', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamthii@hh.gov.vn', 'Phạm Thị Inh', '0912345690', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf9', 'vuvank', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'vuvank@hh.gov.vn', 'Vũ Văn Khánh', '0912345691', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfa', 'lethil', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'lethil@hh.gov.vn', 'Lê Thị Lan', '0912345692', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfb', 'nguyenvanm', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'nguyenvanm@hh.gov.vn', 'Nguyễn Văn Minh', '0912345693', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfc', 'tranvann', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'tranvann@hh.gov.vn', 'Trần Văn Nam', '0912345694', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfd', 'phamthio', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamthio@hh.gov.vn', 'Phạm Thị Oanh', '0912345695', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfe', 'vuvap', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'vuvap@hh.gov.vn', 'Vũ Văn Phong', '0912345696', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bff', 'tranvanb', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'tranvanb@hh.gov.vn', 'Trần Văn Bình', '0912345697', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0);

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
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be5', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf1', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf2', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf3', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf4', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf5', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf6', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf7', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf8', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf9', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfa', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfb', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfc', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfd', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfe', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034'),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bff', '9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8031');

-- 4. Permissions
INSERT INTO permissions (id, code, name, resource, action, created_at, updated_at) VALUES
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001', 'user:manage', 'Quản lý người dùng', 'user', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8002', 'orgunit:manage', 'Quản lý đơn vị', 'orgunit', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8003', 'group:manage', 'Quản lý nhóm', 'group', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8004', 'role:manage', 'Quản lý vai trò', 'role', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8005', 'data:read', 'Xem dữ liệu', 'data', 'read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8006', 'data:create', 'Tạo dữ liệu', 'data', 'create', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8007', 'data:update', 'Chỉnh sửa dữ liệu', 'data', 'update', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8008', 'data:approve', 'Phê duyệt dữ liệu', 'data', 'approve', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8009', 'map:manage', 'Quản lý bản đồ', 'map', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8010', 'connection:read', 'Xem kết nối liên thông', 'connection', 'read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8011', 'report:read', 'Xem báo cáo', 'report', 'read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8012', 'admin:manage', 'Quản trị hệ thống', 'admin', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8013', 'log:manage', 'Quản lý log', 'log', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8014', 'audit:read', 'Xem nhật ký hoạt động', 'audit', 'read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8015', 'user:read', 'Xem danh sách người dùng', 'user', 'read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. Map Permissions to Roles (role_permissions)
-- SYSTEM_ADMIN (All 15 permissions)
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

-- ADMIN (9 permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8002'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8003'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8005'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8008'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8010'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8011'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8014'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8032', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8015');

-- MANAGER (5 permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8005'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8006'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8007'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8033', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8015');

-- USER (2 permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8034', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8005');

-- VIEWER (2 permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8001'),
  ('9f8f4a13-43f1-4dfb-9efc-fcd4ef9d8035', '1f8f4a13-43f1-4dfb-9efc-fcd4ef9d8005');

-- 6. Map Symbols (15 sample records)
INSERT INTO map_symbols (id, code, name, description, category, icon, color, symbol_value, status, created_by, created_at, updated_at, deleted_at) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445501', 'SYM-HD', 'Hướng đi', 'Ký hiệu hướng đi của tàu thuyền', 'navigation', 'ArrowRightOutlined', '#1677ff', 'HD', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445502', 'SYM-DC', 'Đường chính', 'Ký hiệu luồng hàng hải chính', 'road', 'LineOutlined', '#52c41a', 'DC', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445503', 'SYM-TT', 'Tọa độ', 'Ký hiệu điểm mốc tọa độ hải văn', 'position', 'MapOutlined', '#faad14', 'TT', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445504', 'SYM-CC', 'Chia cắt', 'Ký hiệu phân làn giao thông hàng hải', 'division', 'DividerOutlined', '#f5222d', 'CC', 'inactive', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445505', 'SYM-CT', 'Cửa tầng', 'Ký hiệu cửa thu nước cảng biển', 'building', 'DoorOutlined', '#722ed1', 'CT', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445506', 'SYM-BN', 'Bến ngầm', 'Ký hiệu bến đậu ngầm của tàu ngầm', 'transport', 'ShipOutlined', '#13c2c2', 'BN', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445507', 'SYM-OD', 'Địa điểm', 'Ký hiệu địa điểm cảng vụ', 'location', 'EnvironmentOutlined', '#eb2f96', 'OD', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445508', 'SYM-PTA', 'Phao loại A', 'Ký hiệu phao tiêu chỉ giới loại A', 'navigation', 'InfoCircleOutlined', '#2f54eb', 'PTA', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445509', 'SYM-PTB', 'Phao loại B', 'Ký hiệu phao tiêu chỉ giới loại B', 'navigation', 'InfoCircleFilled', '#722ed1', 'PTB', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445510', 'SYM-DB1', 'Đèn biển chính', 'Hải đăng cấp 1 khu vực ven bờ', 'navigation', 'BulbOutlined', '#fa8c16', 'DB1', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445511', 'SYM-DB2', 'Đèn biển phụ', 'Đèn báo hiệu phụ lối vào luồng', 'navigation', 'BulbFilled', '#fadb14', 'DB2', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445512', 'SYM-VTC', 'Vùng cấm', 'Ký hiệu vùng cấm neo đậu hàng hải', 'division', 'StopOutlined', '#ff4d4f', 'VTC', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445513', 'SYM-VQD', 'Vùng quay đầu', 'Ký hiệu vùng dành cho tàu quay đầu', 'navigation', 'SyncOutlined', '#52c41a', 'VQD', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445514', 'SYM-NBD', 'Neo bão', 'Ký hiệu khu vực trú bão của tàu', 'location', 'HomeOutlined', '#13c2c2', 'NBD', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445515', 'SYM-QY', 'Quét lôi', 'Ký hiệu khu vực đang rà quét chướng ngại vật', 'navigation', 'RadarChartOutlined', '#faad14', 'QY', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);