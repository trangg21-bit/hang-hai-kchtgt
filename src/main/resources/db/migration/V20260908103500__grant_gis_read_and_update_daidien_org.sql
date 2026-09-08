-- ============================================================================
-- Migration: V20260908103500__grant_gis_read_and_update_daidien_org.sql
-- Description: Cấp quyền đọc đối tượng bản đồ GIS (lineobject:read, pointobject:read, polygonobject:read, data:read)
--              cho tất cả tài khoản và đồng bộ đơn vị của tài khoản đại diện Cảng vụ Hải Phòng
-- ============================================================================

DO $$
DECLARE
    v_hp_org_id uuid := 'b25bee7b-62ba-40b7-9796-f92ae8b99a0d'; -- Cảng vụ Hàng hải Hải Phòng
    v_daidien_id uuid := 'a4f4208a-dcad-4f8b-a627-dcff427f787c'; -- daidien@gmail.com
BEGIN
    -- 1. Cập nhật đơn vị quản lý cho tài khoản đại diện CV HP
    IF to_regclass('public.app_users') IS NOT NULL THEN
        UPDATE app_users 
        SET org_unit_id = v_hp_org_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_daidien_id;
    END IF;

    -- 2. Cấp các quyền đọc đối tượng bản đồ/luồng GIS cho các tài khoản đang hoạt động
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid(), u.id, p.code, 'Cấp quyền đọc dữ liệu đối tượng bản đồ/luồng GIS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, u.id, u.id
        FROM app_users u
        CROSS JOIN (VALUES ('lineobject:read'), ('pointobject:read'), ('polygonobject:read'), ('data:read')) AS p(code)
        WHERE u.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override upo
              WHERE upo.user_id = u.id
                AND upo.permission_code = p.code
                AND upo.deleted_at IS NULL
          );

        -- 3. Nâng permission_version để làm mới cache quyền
        UPDATE app_users
        SET permission_version = COALESCE(permission_version, 0) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE deleted_at IS NULL;
    END IF;
END $$;
