-- ============================================================================
-- Migration: V20260917170000__seed_cctv_permissions.sql
-- Description: Đăng ký đầy đủ 8 mã quyền và cấp quyền cho chức năng Hệ thống CCTV (cctv)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'cctv:manage', 'Quản lý hệ thống CCTV', 'cctv', 'manage', 'Toàn quyền quản lý hệ thống CCTV', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'cctv:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'cctv:read', 'Xem hệ thống CCTV', 'cctv', 'read', 'Tra cứu thông tin hệ thống CCTV', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'cctv:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'cctv:create', 'Thêm hệ thống CCTV', 'cctv', 'create', 'Tạo mới hồ sơ hệ thống CCTV', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'cctv:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'cctv:update', 'Cập nhật hệ thống CCTV', 'cctv', 'update', 'Chỉnh sửa thông tin hệ thống CCTV', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'cctv:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'cctv:delete', 'Xóa hệ thống CCTV', 'cctv', 'delete', 'Xóa hệ thống CCTV khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'cctv:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'cctv:approvec1', 'Phê duyệt C1 hệ thống CCTV', 'cctv', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) hệ thống CCTV', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'cctv:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'cctv:approvec2', 'Phê duyệt C2 hệ thống CCTV', 'cctv', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) hệ thống CCTV', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'cctv:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'cctv:history', 'Lịch sử phê duyệt CCTV', 'cctv', 'history', 'Xem lịch sử thay đổi và phê duyệt hệ thống CCTV', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'cctv:history');

        -- Dọn sạch mã cũ cctv:approve và cctvasset:approve nếu còn sót lại
        DELETE FROM permissions WHERE code IN ('cctv:approve', 'cctvasset:approve');
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code IN ('cctv:approve', 'cctvasset:approve');
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission IN ('cctv:approve', 'cctvasset:approve');
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code IN ('cctv:approve', 'cctvasset:approve')
        );
    END IF;

    -- Đồng bộ cấp quyền cctv cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('cctv:manage'), ('cctv:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Hệ thống CCTV', v_now, v_now, u.id, u.id
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
