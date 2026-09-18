-- ============================================================================
-- Migration: V20260917180000__seed_scada_permissions.sql
-- Description: Đăng ký đầy đủ 8 mã quyền và cấp quyền cho chức năng Hệ thống SCADA (scada)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'scada:manage', 'Quản lý hệ thống SCADA', 'scada', 'manage', 'Toàn quyền quản lý hệ thống SCADA', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'scada:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'scada:read', 'Xem hệ thống SCADA', 'scada', 'read', 'Tra cứu thông tin hệ thống SCADA', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'scada:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'scada:create', 'Thêm hệ thống SCADA', 'scada', 'create', 'Tạo mới hồ sơ hệ thống SCADA', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'scada:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'scada:update', 'Cập nhật hệ thống SCADA', 'scada', 'update', 'Chỉnh sửa thông tin hệ thống SCADA', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'scada:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'scada:delete', 'Xóa hệ thống SCADA', 'scada', 'delete', 'Xóa hệ thống SCADA khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'scada:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'scada:approvec1', 'Phê duyệt C1 hệ thống SCADA', 'scada', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) hệ thống SCADA', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'scada:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'scada:approvec2', 'Phê duyệt C2 hệ thống SCADA', 'scada', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) hệ thống SCADA', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'scada:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'scada:history', 'Lịch sử phê duyệt SCADA', 'scada', 'history', 'Xem lịch sử thay đổi và phê duyệt hệ thống SCADA', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'scada:history');

        -- Dọn sạch mã cũ scada:approve và scadaasset:approve nếu còn sót lại
        DELETE FROM permissions WHERE code IN ('scada:approve', 'scadaasset:approve');
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code IN ('scada:approve', 'scadaasset:approve');
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission IN ('scada:approve', 'scadaasset:approve');
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code IN ('scada:approve', 'scadaasset:approve')
        );
    END IF;

    -- Đồng bộ cấp quyền scada cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('scada:manage'), ('scada:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Hệ thống SCADA', v_now, v_now, u.id, u.id
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
