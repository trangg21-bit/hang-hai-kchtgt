-- ============================================================================
-- Migration: V20260917200000__seed_vts_assist_permissions.sql
-- Description: Đăng ký đầy đủ 8 mã quyền và cấp quyền cho chức năng Hệ thống phụ trợ VTS (vtsassist)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vtsassist:manage', 'Quản lý hệ thống phụ trợ VTS', 'vtsassist', 'manage', 'Toàn quyền quản lý hệ thống phụ trợ VTS', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vtsassist:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vtsassist:read', 'Xem hệ thống phụ trợ VTS', 'vtsassist', 'read', 'Tra cứu thông tin hệ thống phụ trợ VTS', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vtsassist:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vtsassist:create', 'Thêm hệ thống phụ trợ VTS', 'vtsassist', 'create', 'Tạo mới hồ sơ hệ thống phụ trợ VTS', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vtsassist:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vtsassist:update', 'Cập nhật hệ thống phụ trợ VTS', 'vtsassist', 'update', 'Chỉnh sửa thông tin hệ thống phụ trợ VTS', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vtsassist:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vtsassist:delete', 'Xóa hệ thống phụ trợ VTS', 'vtsassist', 'delete', 'Xóa hệ thống phụ trợ VTS khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vtsassist:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vtsassist:approvec1', 'Phê duyệt C1 hệ thống phụ trợ VTS', 'vtsassist', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) hệ thống phụ trợ VTS', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vtsassist:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vtsassist:approvec2', 'Phê duyệt C2 hệ thống phụ trợ VTS', 'vtsassist', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) hệ thống phụ trợ VTS', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vtsassist:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'vtsassist:history', 'Lịch sử phê duyệt phụ trợ VTS', 'vtsassist', 'history', 'Xem lịch sử thay đổi và phê duyệt hệ thống phụ trợ VTS', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'vtsassist:history');

        -- Dọn sạch mã cũ vtsassist:approve và vtsassistasset:approve nếu còn sót lại
        DELETE FROM permissions WHERE code IN ('vtsassist:approve', 'vtsassistasset:approve');
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code IN ('vtsassist:approve', 'vtsassistasset:approve');
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission IN ('vtsassist:approve', 'vtsassistasset:approve');
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code IN ('vtsassist:approve', 'vtsassistasset:approve')
        );
    END IF;

    -- Đồng bộ cấp quyền vtsassist cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('vtsassist:manage'), ('vtsassist:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Hệ thống phụ trợ VTS', v_now, v_now, u.id, u.id
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
