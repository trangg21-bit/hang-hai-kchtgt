-- ============================================================================
-- Migration: V20260916180000__seed_port_permissions.sql
-- Description: Đăng ký mã quyền và cấp quyền cho chức năng Cảng biển (port)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'port:manage', 'Quản lý Cảng biển', 'port', 'manage', 'Toàn quyền Cảng biển', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'port:manage');

        -- read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'port:read', 'Xem Cảng biển', 'port', 'read', 'Tra cứu Cảng biển', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'port:read');

        -- create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'port:create', 'Thêm Cảng biển', 'port', 'create', 'Tạo mới Cảng biển', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'port:create');

        -- update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'port:update', 'Sửa Cảng biển', 'port', 'update', 'Chỉnh sửa Cảng biển', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'port:update');

        -- delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'port:delete', 'Xóa Cảng biển', 'port', 'delete', 'Xóa Cảng biển', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'port:delete');
    END IF;

    -- Đồng bộ cấp quyền port cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('port:manage'), ('port:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Cảng biển', v_now, v_now, u.id, u.id
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
