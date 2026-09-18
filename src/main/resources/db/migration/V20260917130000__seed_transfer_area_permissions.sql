-- ============================================================================
-- Migration: V20260917130000__seed_transfer_area_permissions.sql
-- Description: Đăng ký đầy đủ mã quyền và cấp quyền cho chức năng Khu chuyển tải (transferarea)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transferarea:manage', 'Quản lý khu chuyển tải', 'transferarea', 'manage', 'Toàn quyền quản lý khu chuyển tải', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transferarea:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transferarea:read', 'Xem khu chuyển tải', 'transferarea', 'read', 'Tra cứu thông tin khu chuyển tải', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transferarea:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transferarea:create', 'Thêm khu chuyển tải', 'transferarea', 'create', 'Tạo mới hồ sơ khu chuyển tải', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transferarea:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transferarea:update', 'Cập nhật khu chuyển tải', 'transferarea', 'update', 'Chỉnh sửa thông tin khu chuyển tải', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transferarea:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transferarea:delete', 'Xóa khu chuyển tải', 'transferarea', 'delete', 'Xóa khu chuyển tải khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transferarea:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transferarea:approvec1', 'Phê duyệt C1 khu chuyển tải', 'transferarea', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) khu chuyển tải', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transferarea:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transferarea:approvec2', 'Phê duyệt C2 khu chuyển tải', 'transferarea', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) khu chuyển tải', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transferarea:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transferarea:history', 'Lịch sử phê duyệt khu chuyển tải', 'transferarea', 'history', 'Xem lịch sử thay đổi và phê duyệt khu chuyển tải', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transferarea:history');

        -- Dọn sạch mã cũ transferarea:approve nếu còn sót lại
        DELETE FROM permissions WHERE code = 'transferarea:approve';
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code = 'transferarea:approve';
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission = 'transferarea:approve';
    END IF;

    -- Đồng bộ cấp quyền transferarea cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('transferarea:manage'), ('transferarea:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Khu chuyển tải', v_now, v_now, u.id, u.id
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
