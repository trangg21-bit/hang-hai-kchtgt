-- ============================================================================
-- Migration: V20260907174500__eradicate_admin_all_and_add_user_permission.sql
-- Description: Xóa bỏ hoàn toàn admin:all và tạo quyền chuyên biệt user:permission (Phân quyền người dùng)
-- ============================================================================

DO $$
BEGIN
    -- 1. Thêm quyền mới 'user:permission' (Phân quyền người dùng) vào bảng permissions
    IF to_regclass('public.permissions') IS NOT NULL THEN
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'user:permission', 'Phân quyền người dùng', 'user', 'permission', 'Cấp và thu hồi quyền trực tiếp cho tài khoản người dùng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'user:permission');
    END IF;

    -- 2. Tự động cấp quyền 'user:permission' cho các tài khoản đang có quyền quản trị (admin:all hoặc user:manage)
    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        EXECUTE '
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.user_id, ''user:permission'', ''Cấp quyền phân quyền người dùng'', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, u.user_id, u.user_id
            FROM (
                SELECT DISTINCT user_id FROM user_permission_override
                WHERE permission_code IN (''admin:all'', ''user:manage'')
                  AND deleted_at IS NULL
            ) u
            WHERE NOT EXISTS (
                SELECT 1 FROM user_permission_override upo
                WHERE upo.user_id = u.user_id
                  AND upo.permission_code = ''user:permission''
                  AND upo.deleted_at IS NULL
            )
        ';

        -- 3. Xóa bỏ admin:all khỏi các bảng phân quyền
        EXECUTE 'DELETE FROM user_permission_override WHERE permission_code = ''admin:all''';
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        EXECUTE 'DELETE FROM user_group_permissions WHERE permission = ''admin:all''';
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        EXECUTE 'DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE code = ''admin:all'')';
    END IF;

    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 4. Xóa bỏ admin:all khỏi bảng danh mục permissions
        DELETE FROM permissions WHERE code = 'admin:all';
    END IF;
END $$;
