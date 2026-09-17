-- ============================================================================
-- Migration: V20260916183000__seed_coastal_station_permissions.sql
-- Description: Đăng ký mã quyền và cấp quyền cho các đài thông tin duyên hải chuyên biệt
--              (coastalstationhaiphong, coastalstationlrit, coastalstationcospassarsat, coastalstationinmarsat)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('coastalstationhaiphong', 'Đài TTXLTT Hàng hải Hải Phòng / Hà Nội'),
                ('coastalstationlrit', 'Đài thông tin LRIT'),
                ('coastalstationcospassarsat', 'Đài thông tin Cospas-Sarsat'),
                ('coastalstationinmarsat', 'Đài thông tin Inmarsat')
            ) AS t(res, name_prefix)
        LOOP
            -- manage
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':manage', 'Quản lý ' || rec.name_prefix, rec.res, 'manage', 'Toàn quyền ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':manage');

            -- read
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':read', 'Xem ' || rec.name_prefix, rec.res, 'read', 'Tra cứu ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':read');

            -- create
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':create', 'Thêm ' || rec.name_prefix, rec.res, 'create', 'Tạo mới ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':create');

            -- update
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':update', 'Sửa ' || rec.name_prefix, rec.res, 'update', 'Chỉnh sửa ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':update');

            -- delete
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':delete', 'Xóa ' || rec.name_prefix, rec.res, 'delete', 'Xóa ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':delete');
        END LOOP;
    END IF;

    -- Đồng bộ cấp quyền cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('coastalstationhaiphong:manage'), ('coastalstationhaiphong:read'),
                ('coastalstationlrit:manage'), ('coastalstationlrit:read'),
                ('coastalstationcospassarsat:manage'), ('coastalstationcospassarsat:read'),
                ('coastalstationinmarsat:manage'), ('coastalstationinmarsat:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho Đài thông tin duyên hải chuyên biệt', v_now, v_now, u.id, u.id
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
