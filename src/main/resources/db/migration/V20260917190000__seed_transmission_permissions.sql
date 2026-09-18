-- ============================================================================
-- Migration: V20260917190000__seed_transmission_permissions.sql
-- Description: Đăng ký đầy đủ 8 mã quyền và cấp quyền cho chức năng Hệ thống truyền dẫn (transmission)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transmission:manage', 'Quản lý hệ thống truyền dẫn', 'transmission', 'manage', 'Toàn quyền quản lý hệ thống truyền dẫn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transmission:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transmission:read', 'Xem hệ thống truyền dẫn', 'transmission', 'read', 'Tra cứu thông tin hệ thống truyền dẫn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transmission:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transmission:create', 'Thêm hệ thống truyền dẫn', 'transmission', 'create', 'Tạo mới hồ sơ hệ thống truyền dẫn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transmission:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transmission:update', 'Cập nhật hệ thống truyền dẫn', 'transmission', 'update', 'Chỉnh sửa thông tin hệ thống truyền dẫn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transmission:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transmission:delete', 'Xóa hệ thống truyền dẫn', 'transmission', 'delete', 'Xóa hệ thống truyền dẫn khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transmission:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transmission:approvec1', 'Phê duyệt C1 hệ thống truyền dẫn', 'transmission', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) hệ thống truyền dẫn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transmission:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transmission:approvec2', 'Phê duyệt C2 hệ thống truyền dẫn', 'transmission', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) hệ thống truyền dẫn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transmission:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'transmission:history', 'Lịch sử phê duyệt truyền dẫn', 'transmission', 'history', 'Xem lịch sử thay đổi và phê duyệt hệ thống truyền dẫn', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'transmission:history');

        -- Dọn sạch mã cũ transmission:approve và transmissionasset:approve nếu còn sót lại
        DELETE FROM permissions WHERE code IN ('transmission:approve', 'transmissionasset:approve');
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code IN ('transmission:approve', 'transmissionasset:approve');
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission IN ('transmission:approve', 'transmissionasset:approve');
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code IN ('transmission:approve', 'transmissionasset:approve')
        );
    END IF;

    -- Đồng bộ cấp quyền transmission cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('transmission:manage'), ('transmission:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Hệ thống truyền dẫn', v_now, v_now, u.id, u.id
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
