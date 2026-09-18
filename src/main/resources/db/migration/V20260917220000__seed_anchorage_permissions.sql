-- ============================================================================
-- Migration: V20260917220000__seed_anchorage_permissions.sql
-- Description: Đăng ký đầy đủ 8 mã quyền và cấp quyền cho chức năng Khu neo đậu (anchorage)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'anchorage:manage', 'Quản lý khu neo đậu', 'anchorage', 'manage', 'Toàn quyền quản lý khu neo đậu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'anchorage:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'anchorage:read', 'Xem khu neo đậu', 'anchorage', 'read', 'Tra cứu thông tin khu neo đậu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'anchorage:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'anchorage:create', 'Thêm khu neo đậu', 'anchorage', 'create', 'Tạo mới hồ sơ khu neo đậu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'anchorage:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'anchorage:update', 'Cập nhật khu neo đậu', 'anchorage', 'update', 'Chỉnh sửa thông tin khu neo đậu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'anchorage:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'anchorage:delete', 'Xóa khu neo đậu', 'anchorage', 'delete', 'Xóa khu neo đậu khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'anchorage:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'anchorage:approvec1', 'Phê duyệt C1 khu neo đậu', 'anchorage', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) khu neo đậu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'anchorage:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'anchorage:approvec2', 'Phê duyệt C2 khu neo đậu', 'anchorage', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) khu neo đậu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'anchorage:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'anchorage:history', 'Lịch sử phê duyệt khu neo đậu', 'anchorage', 'history', 'Xem lịch sử thay đổi và phê duyệt khu neo đậu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'anchorage:history');

        -- Dọn sạch mã cũ đơn cấp approve nếu còn sót lại
        DELETE FROM permissions WHERE code IN ('anchorage:approve', 'anchoragearea:approve', 'anchorageasset:approve');
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code IN ('anchorage:approve', 'anchoragearea:approve', 'anchorageasset:approve');
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission IN ('anchorage:approve', 'anchoragearea:approve', 'anchorageasset:approve');
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code IN ('anchorage:approve', 'anchoragearea:approve', 'anchorageasset:approve')
        );
    END IF;

    -- Đồng bộ cấp quyền anchorage cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('anchorage:manage'), ('anchorage:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Khu neo đậu', v_now, v_now, u.id, u.id
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
