-- ============================================================================
-- Migration: V20260917150000__seed_dike_revetment_permissions.sql
-- Description: Đăng ký đầy đủ mã quyền và cấp quyền cho chức năng Đê kè hàng hải (dikerevetment)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dikerevetment:manage', 'Quản lý đê kè', 'dikerevetment', 'manage', 'Toàn quyền quản lý đê kè', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dikerevetment:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dikerevetment:read', 'Xem đê kè', 'dikerevetment', 'read', 'Tra cứu thông tin đê kè', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dikerevetment:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dikerevetment:create', 'Thêm đê kè', 'dikerevetment', 'create', 'Tạo mới hồ sơ đê kè', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dikerevetment:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dikerevetment:update', 'Cập nhật đê kè', 'dikerevetment', 'update', 'Chỉnh sửa thông tin đê kè', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dikerevetment:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dikerevetment:delete', 'Xóa đê kè', 'dikerevetment', 'delete', 'Xóa đê kè', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dikerevetment:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dikerevetment:approvec1', 'Phê duyệt C1 đê kè', 'dikerevetment', 'approvec1', 'Phê duyệt cấp 1 công trình đê kè', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dikerevetment:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dikerevetment:approvec2', 'Phê duyệt C2 đê kè', 'dikerevetment', 'approvec2', 'Phê duyệt cấp 2 công trình đê kè', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dikerevetment:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'dikerevetment:history', 'Lịch sử phê duyệt đê kè', 'dikerevetment', 'history', 'Xem lịch sử thay đổi đê kè', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'dikerevetment:history');

        -- Dọn sạch mã cũ dikerevetment:approve nếu còn sót lại
        DELETE FROM permissions WHERE code = 'dikerevetment:approve';
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code = 'dikerevetment:approve';
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission = 'dikerevetment:approve';
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code = 'dikerevetment:approve'
        );
    END IF;

    -- Đồng bộ cấp quyền dikerevetment cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('dikerevetment:manage'), ('dikerevetment:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Đê kè hàng hải', v_now, v_now, u.id, u.id
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
