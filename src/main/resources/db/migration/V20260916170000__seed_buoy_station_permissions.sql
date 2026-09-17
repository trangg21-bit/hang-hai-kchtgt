-- ============================================================================
-- Migration: V20260916170000__seed_buoy_station_permissions.sql
-- Description: Đăng ký mã quyền và cấp quyền cho chức năng Nhà trạm phao tiêu (buoystation)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'buoystation:manage', 'Quản lý Nhà trạm phao tiêu', 'buoystation', 'manage', 'Toàn quyền Nhà trạm phao tiêu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'buoystation:manage');

        -- read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'buoystation:read', 'Xem Nhà trạm phao tiêu', 'buoystation', 'read', 'Tra cứu Nhà trạm phao tiêu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'buoystation:read');

        -- create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'buoystation:create', 'Thêm Nhà trạm phao tiêu', 'buoystation', 'create', 'Tạo mới Nhà trạm phao tiêu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'buoystation:create');

        -- update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'buoystation:update', 'Sửa Nhà trạm phao tiêu', 'buoystation', 'update', 'Chỉnh sửa Nhà trạm phao tiêu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'buoystation:update');

        -- delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'buoystation:delete', 'Xóa Nhà trạm phao tiêu', 'buoystation', 'delete', 'Xóa Nhà trạm phao tiêu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'buoystation:delete');
    END IF;

    -- Đồng bộ cấp quyền buoystation cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('buoystation:manage'), ('buoystation:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Nhà trạm phao tiêu', v_now, v_now, u.id, u.id
            FROM app_users u
            WHERE u.deleted_at IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM user_permission_override upo
                  WHERE upo.user_id = u.id
                    AND upo.permission_code = rec.perm_code
                    AND upo.deleted_at IS NULL
              );
        END LOOP;
    END IF;
END $$;
