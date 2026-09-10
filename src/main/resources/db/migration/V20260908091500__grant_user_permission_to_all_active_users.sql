-- ============================================================================
-- Migration: V20260908091500__grant_user_permission_to_all_active_users.sql
-- Description: Cấp quyền user:permission (Phân quyền người dùng) cho tất cả tài khoản người dùng đang hoạt động
-- ============================================================================

DO $$
BEGIN
    -- 1. Đảm bảo mã quyền 'user:permission' đã tồn tại trong bảng permissions
    IF to_regclass('public.permissions') IS NOT NULL THEN
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'user:permission', 'Phân quyền người dùng', 'user', 'permission', 'Cấp và thu hồi quyền trực tiếp cho tài khoản người dùng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'user:permission');
    END IF;

    -- 2. Kích hoạt lại quyền nếu bị xóa mềm
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        UPDATE user_permission_override upo
        SET deleted_at = NULL,
            deleted_by = NULL,
            reason = 'Cấp quyền phân quyền người dùng',
            updated_at = CURRENT_TIMESTAMP
        FROM app_users u
        WHERE upo.user_id = u.id
          AND u.deleted_at IS NULL
          AND upo.permission_code = 'user:permission'
          AND upo.deleted_at IS NOT NULL;

        -- 3. Cấp mới quyền user:permission cho các tài khoản chưa có
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid(), u.id, 'user:permission', 'Cấp quyền phân quyền người dùng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, u.id, u.id
        FROM app_users u
        WHERE u.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override upo
              WHERE upo.user_id = u.id
                AND upo.permission_code = 'user:permission'
                AND upo.deleted_at IS NULL
          );

        -- 4. Nâng version quyền của người dùng để vô hiệu hóa cache
        UPDATE app_users
        SET permission_version = COALESCE(permission_version, 0) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE deleted_at IS NULL;
    END IF;
END $$;
