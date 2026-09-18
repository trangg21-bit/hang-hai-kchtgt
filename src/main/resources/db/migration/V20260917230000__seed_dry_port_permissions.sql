-- ============================================================================
-- Migration: V20260917230000__seed_dry_port_permissions.sql
-- Description: Đăng ký đầy đủ mã quyền và cấp quyền cho chức năng Cảng cạn (dryport)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dryport:manage', 'Quản lý Cảng cạn', 'dryport', 'manage', 'Toàn quyền quản lý Cảng cạn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dryport:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dryport:read', 'Xem Cảng cạn', 'dryport', 'read', 'Tra cứu thông tin Cảng cạn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dryport:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dryport:create', 'Thêm Cảng cạn', 'dryport', 'create', 'Tạo mới hồ sơ Cảng cạn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dryport:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dryport:update', 'Cập nhật Cảng cạn', 'dryport', 'update', 'Chỉnh sửa thông tin Cảng cạn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dryport:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dryport:delete', 'Xóa Cảng cạn', 'dryport', 'delete', 'Xóa Cảng cạn khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dryport:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dryport:approvec1', 'Phê duyệt C1 Cảng cạn', 'dryport', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) Cảng cạn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dryport:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dryport:approvec2', 'Phê duyệt C2 Cảng cạn', 'dryport', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) Cảng cạn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dryport:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dryport:history', 'Lịch sử phê duyệt Cảng cạn', 'dryport', 'history', 'Xem lịch sử thay đổi và phê duyệt Cảng cạn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dryport:history');

        -- Dọn sạch mã cũ dryport:approve nếu còn sót lại
        DELETE FROM permissions WHERE code = 'dryport:approve';
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code = 'dryport:approve';
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission = 'dryport:approve';
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code = 'dryport:approve'
        );
    END IF;

    -- Đồng bộ cấp quyền dryport cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('dryport:manage'), ('dryport:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Cảng cạn', v_now, v_now, u.id, u.id
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
