-- ============================================================================
-- Migration: V20260911111500__grant_infraasset_permissions_to_active_users.sql
-- Description: Cấp quyền infraasset:manage và infraasset:read cho tất cả tài khoản người dùng đang hoạt động
-- ============================================================================

DO $$
BEGIN
    -- 1. Đảm bảo mã quyền 'infraasset:manage' và 'infraasset:read' đã tồn tại trong bảng permissions
    IF to_regclass('public.permissions') IS NOT NULL THEN
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'infraasset:manage', 'Quản lý tài sản KCHT', 'infraasset', 'manage', 'Quản trị danh mục và hồ sơ tài sản kết cấu hạ tầng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'infraasset:manage');

        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'infraasset:read', 'Xem tài sản KCHT', 'infraasset', 'read', 'Tra cứu danh mục và hồ sơ tài sản kết cấu hạ tầng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'infraasset:read');

        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'infraasset:create', 'Thêm tài sản KCHT', 'infraasset', 'create', 'Tạo mới hồ sơ tài sản kết cấu hạ tầng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'infraasset:create');

        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'infraasset:update', 'Cập nhật tài sản KCHT', 'infraasset', 'update', 'Chỉnh sửa hồ sơ tài sản kết cấu hạ tầng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'infraasset:update');

        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'infraasset:delete', 'Xóa tài sản KCHT', 'infraasset', 'delete', 'Xóa hồ sơ tài sản kết cấu hạ tầng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'infraasset:delete');
    END IF;

    -- 2. Kích hoạt lại quyền nếu bị xóa mềm
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        UPDATE user_permission_override upo
        SET deleted_at = NULL,
            deleted_by = NULL,
            reason = 'Cấp quyền quản lý tài sản KCHT',
            updated_at = CURRENT_TIMESTAMP
        FROM app_users u
        WHERE upo.user_id = u.id
          AND u.deleted_at IS NULL
          AND upo.permission_code IN ('infraasset:manage', 'infraasset:read')
          AND upo.deleted_at IS NOT NULL;

        -- 3. Cấp mới quyền infraasset:manage cho các tài khoản chưa có
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid(), u.id, 'infraasset:manage', 'Cấp quyền quản lý tài sản KCHT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, u.id, u.id
        FROM app_users u
        WHERE u.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override upo
              WHERE upo.user_id = u.id
                AND upo.permission_code = 'infraasset:manage'
                AND upo.deleted_at IS NULL
          );

        -- Cấp mới quyền infraasset:read cho các tài khoản chưa có
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid(), u.id, 'infraasset:read', 'Cấp quyền xem tài sản KCHT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, u.id, u.id
        FROM app_users u
        WHERE u.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override upo
              WHERE upo.user_id = u.id
                AND upo.permission_code = 'infraasset:read'
                AND upo.deleted_at IS NULL
          );

        -- 4. Nâng version quyền của người dùng để vô hiệu hóa cache
        UPDATE app_users
        SET permission_version = COALESCE(permission_version, 0) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE deleted_at IS NULL;
    END IF;
END $$;
