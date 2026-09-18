-- ============================================================================
-- Migration: V20260917140000__seed_beacon_station_approval_permissions.sql
-- Description: Đăng ký đầy đủ mã quyền và cấp quyền cho chức năng Đèn biển và nhà trạm (beaconstation)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- 1. manage
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'beaconstation:manage', 'Quản lý Đèn biển và nhà trạm', 'beaconstation', 'manage', 'Toàn quyền Đèn biển và nhà trạm', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'beaconstation:manage');

        -- 2. read
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'beaconstation:read', 'Xem Đèn biển và nhà trạm', 'beaconstation', 'read', 'Tra cứu Đèn biển và nhà trạm', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'beaconstation:read');

        -- 3. create
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'beaconstation:create', 'Thêm Đèn biển và nhà trạm', 'beaconstation', 'create', 'Tạo mới Đèn biển và nhà trạm', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'beaconstation:create');

        -- 4. update
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'beaconstation:update', 'Sửa Đèn biển và nhà trạm', 'beaconstation', 'update', 'Chỉnh sửa Đèn biển và nhà trạm', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'beaconstation:update');

        -- 5. delete
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'beaconstation:delete', 'Xóa Đèn biển và nhà trạm', 'beaconstation', 'delete', 'Xóa Đèn biển và nhà trạm', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'beaconstation:delete');

        -- 6. approvec1
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'beaconstation:approvec1', 'Phê duyệt C1 Đèn biển và nhà trạm', 'beaconstation', 'approvec1', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) Đèn biển và nhà trạm', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'beaconstation:approvec1');

        -- 7. approvec2
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'beaconstation:approvec2', 'Phê duyệt C2 Đèn biển và nhà trạm', 'beaconstation', 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) Đèn biển và nhà trạm', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'beaconstation:approvec2');

        -- 8. history
        INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
        SELECT gen_random_uuid(), 'beaconstation:history', 'Lịch sử phê duyệt Đèn biển và nhà trạm', 'beaconstation', 'history', 'Xem lịch sử thay đổi và phê duyệt Đèn biển và nhà trạm', v_now, v_now
        WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'beaconstation:history');

        -- Dọn sạch mã cũ beaconstation:approve nếu còn sót lại
        DELETE FROM permissions WHERE code = 'beaconstation:approve';
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code = 'beaconstation:approve';
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission = 'beaconstation:approve';
    END IF;

    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code = 'beaconstation:approve'
        );
    END IF;

    -- Đồng bộ cấp quyền beaconstation cho active users có lighthouseasset:manage hoặc beaconstation:manage
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('beaconstation:manage'), ('beaconstation:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Đèn biển và nhà trạm', v_now, v_now, u.id, u.id
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
