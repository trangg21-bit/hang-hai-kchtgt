INSERT INTO app_users (id, username, password, email, full_name, phone, role, status, created_at, updated_at)
VALUES
  (RANDOM_UUID(), 'admin',   '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'admin@hh.gov.vn',   'Nguyen Van An',  '0912345678', 'ROLE_SYSTEM_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (RANDOM_UUID(), 'trantmai', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'trantmai@hh.gov.vn', 'Tran Thi Mai',   '0912345679', 'ROLE_ADMIN',        'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (RANDOM_UUID(), 'leantuan', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'leantuan@hh.gov.vn', 'Le Anh Tuan',    '0912345680', 'ROLE_ADMIN',        'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (RANDOM_UUID(), 'phamdm',   '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamdm@hh.gov.vn',   'Pham Duc Minh',  '0912345681', 'ROLE_USER',         'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (RANDOM_UUID(), 'buivanh',  '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'buivanh@hh.gov.vn',  'Bui Van Anh',    '0912345682', 'ROLE_VIEWER',       'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO app_roles (id, name, code, description, status, user_count, created_at, updated_at)
VALUES
  (RANDOM_UUID(), 'System Admin',       'SYSTEM_ADMIN',  'Admin cao nhat he thong',                    'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (RANDOM_UUID(), 'Quan tri vien',      'ADMIN',         'Quan tri vien Cuc/Cang vu/Chi cuc',          'ACTIVE', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (RANDOM_UUID(), 'Chuyen vien',        'MANAGER',       'Chuyen vien quan ly du lieu',                'ACTIVE', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (RANDOM_UUID(), 'Nguoi dung',         'USER',          'Nguoi dung co ban (doanh nghiep)',           'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (RANDOM_UUID(), 'Nguoi xem',          'VIEWER',        'Chi xem, khong sua',                         'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO role_permissions (role_id, permission)
SELECT id, perm FROM app_roles CROSS JOIN (
  SELECT 'users:read' AS perm UNION ALL SELECT 'users:create' UNION ALL SELECT 'users:update' UNION ALL SELECT 'users:delete'
  UNION ALL SELECT 'roles:read' UNION ALL SELECT 'roles:manage'
  UNION ALL SELECT 'gis:read' UNION ALL SELECT 'gis:create' UNION ALL SELECT 'gis:update' UNION ALL SELECT 'gis:delete'
  UNION ALL SELECT 'map:view' UNION ALL SELECT 'map:edit'
  UNION ALL SELECT 'admin:manage' UNION ALL SELECT 'audit:read' UNION ALL SELECT 'audit:export'
) WHERE code = 'SYSTEM_ADMIN';

INSERT INTO role_permissions (role_id, permission)
SELECT id, perm FROM app_roles CROSS JOIN (
  SELECT 'users:read' AS perm UNION ALL SELECT 'users:create' UNION ALL SELECT 'users:update'
  UNION ALL SELECT 'roles:read'
  UNION ALL SELECT 'gis:read' UNION ALL SELECT 'gis:create' UNION ALL SELECT 'gis:update'
  UNION ALL SELECT 'map:view' UNION ALL SELECT 'map:edit'
  UNION ALL SELECT 'audit:read'
) WHERE code = 'ADMIN';

INSERT INTO role_permissions (role_id, permission)
SELECT id, perm FROM app_roles CROSS JOIN (
  SELECT 'users:read' AS perm
  UNION ALL SELECT 'gis:read' UNION ALL SELECT 'gis:create' UNION ALL SELECT 'gis:update'
  UNION ALL SELECT 'map:view' UNION ALL SELECT 'map:edit'
) WHERE code = 'MANAGER';

INSERT INTO role_permissions (role_id, permission)
SELECT id, perm FROM app_roles CROSS JOIN (
  SELECT 'users:read' AS perm
  UNION ALL SELECT 'gis:read'
  UNION ALL SELECT 'map:view'
) WHERE code = 'USER';

INSERT INTO role_permissions (role_id, permission)
SELECT id, perm FROM app_roles CROSS JOIN (
  SELECT 'users:read' AS perm
  UNION ALL SELECT 'gis:read'
  UNION ALL SELECT 'map:view'
) WHERE code = 'VIEWER';
