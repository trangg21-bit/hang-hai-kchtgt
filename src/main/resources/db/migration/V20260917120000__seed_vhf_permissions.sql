-- ============================================================================
-- Migration: V20260917120000__seed_vhf_permissions.sql
-- Description: Đăng ký đầy đủ mã quyền và cấp quyền cho chức năng Hệ thống thông tin liên lạc VHF (vhf)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vhf:manage', 'Quản lý hệ thống thông tin liên lạc VHF', 'vhf', 'manage', 'Toàn quyền Hệ thống thông tin liên lạc VHF', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vhf:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vhf:read', 'Xem hệ thống thông tin liên lạc VHF', 'vhf', 'read', 'Tra cứu thông tin hệ thống VHF', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vhf:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vhf:create', 'Thêm hệ thống thông tin liên lạc VHF', 'vhf', 'create', 'Tạo mới hồ sơ hệ thống VHF', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vhf:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vhf:update', 'Cập nhật hệ thống thông tin liên lạc VHF', 'vhf', 'update', 'Chỉnh sửa thông tin hệ thống VHF', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vhf:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vhf:delete', 'Xóa hệ thống thông tin liên lạc VHF', 'vhf', 'delete', 'Xóa hệ thống VHF khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vhf:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vhf:approvec1', 'Phê duyệt C1 hệ thống thông tin liên lạc VHF', 'vhf', 'approvec1', 'Phê duyệt cấp 1 hệ thống VHF', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vhf:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vhf:approvec2', 'Phê duyệt C2 hệ thống thông tin liên lạc VHF', 'vhf', 'approvec2', 'Phê duyệt cấp 2 hệ thống VHF', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vhf:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vhf:history', 'Lịch sử phê duyệt VHF', 'vhf', 'history', 'Xem lịch sử thay đổi và phê duyệt hệ thống VHF', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vhf:history');
    END IF;

    -- Đồng bộ cấp quyền vhf cho active users có vhfasset:manage hoặc vhfasset:read
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('vhf:manage'), ('vhf:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Hệ thống VHF', v_now, v_now, u.id, u.id
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
