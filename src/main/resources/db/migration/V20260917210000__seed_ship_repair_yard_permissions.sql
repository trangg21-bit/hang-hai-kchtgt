-- ============================================================================
-- Migration: V20260917210000__seed_ship_repair_yard_permissions.sql
-- Description: Đăng ký đầy đủ 8 mã quyền và cấp quyền cho chức năng Cơ sở sửa chữa, đóng tàu (shiprepairyard)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepairyard:manage', 'Quản lý cơ sở sửa chữa, đóng tàu', 'shiprepairyard', 'manage', 'Toàn quyền quản lý cơ sở sửa chữa, đóng tàu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepairyard:manage');

        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepair:manage', 'Quản lý cơ sở sửa chữa tàu', 'shiprepair', 'manage', 'Toàn quyền quản lý cơ sở sửa chữa tàu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepair:manage');

        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepairfacility:manage', 'Quản lý cơ sở đóng sửa tàu', 'shiprepairfacility', 'manage', 'Toàn quyền quản lý cơ sở đóng sửa tàu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepairfacility:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepairyard:read', 'Xem cơ sở sửa chữa, đóng tàu', 'shiprepairyard', 'read', 'Tra cứu thông tin cơ sở sửa chữa, đóng tàu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepairyard:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepairyard:create', 'Thêm cơ sở sửa chữa, đóng tàu', 'shiprepairyard', 'create', 'Tạo mới hồ sơ cơ sở sửa chữa, đóng tàu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepairyard:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepairyard:update', 'Cập nhật cơ sở sửa chữa, đóng tàu', 'shiprepairyard', 'update', 'Chỉnh sửa thông tin cơ sở sửa chữa, đóng tàu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepairyard:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepairyard:delete', 'Xóa cơ sở sửa chữa, đóng tàu', 'shiprepairyard', 'delete', 'Xóa cơ sở sửa chữa, đóng tàu khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepairyard:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepairyard:approvec1', 'Phê duyệt C1 cơ sở sửa chữa, đóng tàu', 'shiprepairyard', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) cơ sở sửa chữa, đóng tàu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepairyard:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepairyard:approvec2', 'Phê duyệt C2 cơ sở sửa chữa, đóng tàu', 'shiprepairyard', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) cơ sở sửa chữa, đóng tàu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepairyard:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'shiprepairyard:history', 'Lịch sử phê duyệt cơ sở sửa chữa, đóng tàu', 'shiprepairyard', 'history', 'Xem lịch sử thay đổi và phê duyệt cơ sở sửa chữa, đóng tàu', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'shiprepairyard:history');

        -- Dọn sạch mã cũ đơn cấp approve nếu còn sót lại
        DELETE FROM permissions WHERE code IN ('shiprepairyard:approve', 'shiprepair:approve', 'shiprepairfacility:approve');
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code IN ('shiprepairyard:approve', 'shiprepair:approve', 'shiprepairfacility:approve');
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission IN ('shiprepairyard:approve', 'shiprepair:approve', 'shiprepairfacility:approve');
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code IN ('shiprepairyard:approve', 'shiprepair:approve', 'shiprepairfacility:approve')
        );
    END IF;

    -- Đồng bộ cấp quyền shiprepairyard cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('shiprepairyard:manage'), ('shiprepairyard:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Cơ sở sửa chữa, đóng tàu', v_now, v_now, u.id, u.id
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
