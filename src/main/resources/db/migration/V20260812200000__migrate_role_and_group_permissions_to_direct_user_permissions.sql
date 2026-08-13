-- Chuyển quyền kế thừa từ role/group sang quyền trực tiếp trên từng user.
-- Migration này phải chạy trước khi tắt authorization theo role/group.

INSERT INTO permissions (id, code, name, description, resource, action, created_at, updated_at)
SELECT gen_random_uuid(), 'orgunit:scope_all', 'Xem dữ liệu toàn hệ thống',
       'Cho phép user truy cập dữ liệu ngoài phạm vi cây đơn vị trực thuộc',
       'orgunit', 'scope_all', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'orgunit:scope_all');

INSERT INTO permissions (id, code, name, description, resource, action, created_at, updated_at)
SELECT gen_random_uuid(), 'admin:all', 'Toàn quyền hệ thống',
       'Toàn bộ quyền trực tiếp trên hệ thống', 'admin', 'all', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'admin:all');

-- Quyền được gán trực tiếp từ role của user.
INSERT INTO user_permission_override (
    id, user_id, permission_code, reason, created_at, updated_at
)
SELECT gen_random_uuid(), ur.user_id, p.code,
       'Chuyển đổi từ quyền của vai trò sang quyền trực tiếp trên người dùng',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM user_roles ur
JOIN role_permissions rp ON rp.role_id = ur.role_id
JOIN permissions p ON p.id = rp.permission_id
JOIN app_users u ON u.id = ur.user_id AND u.deleted_at IS NULL
WHERE p.deleted_at IS NULL
ON CONFLICT (user_id, permission_code) WHERE deleted_at IS NULL DO NOTHING;

-- Quyền trực tiếp được cấu hình trên group.
INSERT INTO user_permission_override (
    id, user_id, permission_code, reason, created_at, updated_at
)
SELECT gen_random_uuid(), ugm.user_id, ugp.permission,
       'Chuyển đổi từ quyền của nhóm sang quyền trực tiếp trên người dùng',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM user_group_membership ugm
JOIN user_group_permissions ugp ON ugp.user_group_id = ugm.user_group_id
JOIN app_users u ON u.id = ugm.user_id AND u.deleted_at IS NULL
WHERE ugp.permission IS NOT NULL
ON CONFLICT (user_id, permission_code) WHERE deleted_at IS NULL DO NOTHING;

-- Quyền của role được gán cho group. Một số môi trường không có bảng
-- group_roles vì group-role đã bị loại khỏi schema; chỉ chạy khi bảng còn tồn tại.
DO $$
BEGIN
    IF to_regclass('public.group_roles') IS NOT NULL THEN
        EXECUTE $migration$
            INSERT INTO user_permission_override (
                id, user_id, permission_code, reason, created_at, updated_at
            )
            SELECT gen_random_uuid(), ugm.user_id, p.code,
                   'Chuyển đổi từ quyền role của nhóm sang quyền trực tiếp trên người dùng',
                   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM user_group_membership ugm
            JOIN group_roles gr ON gr.user_group_id = ugm.user_group_id
            JOIN role_permissions rp ON rp.role_id = gr.role_id
            JOIN permissions p ON p.id = rp.permission_id
            JOIN app_users u ON u.id = ugm.user_id AND u.deleted_at IS NULL
            WHERE p.deleted_at IS NULL
            ON CONFLICT (user_id, permission_code) WHERE deleted_at IS NULL DO NOTHING
        $migration$;
    END IF;
END $$;

-- Phạm vi toàn hệ thống trước đây được suy ra từ ROLE_SYSTEM_ADMIN/ROLE_ADMIN.
INSERT INTO user_permission_override (
    id, user_id, permission_code, reason, created_at, updated_at
)
SELECT gen_random_uuid(), ur.user_id, 'orgunit:scope_all',
       'Chuyển đổi phạm vi dữ liệu toàn hệ thống từ role sang permission trực tiếp',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM user_roles ur
JOIN app_roles r ON r.id = ur.role_id
JOIN app_users u ON u.id = ur.user_id AND u.deleted_at IS NULL
WHERE r.code IN ('ROLE_SYSTEM_ADMIN', 'ROLE_ADMIN')
ON CONFLICT (user_id, permission_code) WHERE deleted_at IS NULL DO NOTHING;

-- ROLE_SYSTEM_ADMIN trước đây có quyền bypass toàn hệ thống; chuyển thành
-- permission trực tiếp để vẫn giữ đúng phạm vi sau khi bỏ authorization theo role.
INSERT INTO user_permission_override (
    id, user_id, permission_code, reason, created_at, updated_at
)
SELECT gen_random_uuid(), ur.user_id, 'admin:all',
       'Chuyển quyền quản trị toàn hệ thống từ role sang permission trực tiếp',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM user_roles ur
JOIN app_roles r ON r.id = ur.role_id
JOIN app_users u ON u.id = ur.user_id AND u.deleted_at IS NULL
WHERE r.code = 'ROLE_SYSTEM_ADMIN'
ON CONFLICT (user_id, permission_code) WHERE deleted_at IS NULL DO NOTHING;

-- Buộc token/cache cũ hết hiệu lực sau khi quyền đã được chuyển.
UPDATE app_users u
SET permission_version = COALESCE(permission_version, 0) + 1
WHERE u.deleted_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM user_permission_override upo
      WHERE upo.user_id = u.id
        AND upo.deleted_at IS NULL
  );
