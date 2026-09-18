-- ============================================================================
-- Migration: V20260917160000__seed_radar_station_permissions.sql
-- Description: Đăng ký đầy đủ 8 mã quyền và cấp quyền cho chức năng Trạm radar hàng hải (radarstation)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'radarstation:manage', 'Quản lý trạm radar', 'radarstation', 'manage', 'Toàn quyền quản lý trạm radar', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'radarstation:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'radarstation:read', 'Xem trạm radar', 'radarstation', 'read', 'Tra cứu thông tin trạm radar', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'radarstation:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'radarstation:create', 'Thêm trạm radar', 'radarstation', 'create', 'Tạo mới hồ sơ trạm radar', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'radarstation:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'radarstation:update', 'Cập nhật trạm radar', 'radarstation', 'update', 'Chỉnh sửa thông tin trạm radar', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'radarstation:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'radarstation:delete', 'Xóa trạm radar', 'radarstation', 'delete', 'Xóa trạm radar khỏi hệ thống', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'radarstation:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'radarstation:approvec1', 'Phê duyệt C1 trạm radar', 'radarstation', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) trạm radar', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'radarstation:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'radarstation:approvec2', 'Phê duyệt C2 trạm radar', 'radarstation', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) trạm radar', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'radarstation:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'radarstation:history', 'Lịch sử phê duyệt trạm radar', 'radarstation', 'history', 'Xem lịch sử thay đổi và phê duyệt trạm radar', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'radarstation:history');

        -- Dọn sạch mã cũ radarstation:approve và tramradar:approve nếu còn sót lại
        DELETE FROM permissions WHERE code IN ('radarstation:approve', 'tramradar:approve');
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code IN ('radarstation:approve', 'tramradar:approve');
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission IN ('radarstation:approve', 'tramradar:approve');
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code IN ('radarstation:approve', 'tramradar:approve')
        );
    END IF;

    -- Đồng bộ cấp quyền radarstation cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('radarstation:manage'), ('radarstation:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Trạm radar hàng hải', v_now, v_now, u.id, u.id
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
