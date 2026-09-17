-- ============================================================================
-- Migration: V20260916160000__seed_distinct_asset_menu_permissions.sql
-- Description: Đăng ký mã quyền riêng biệt và cấp quyền cho từng chức năng trong phân hệ Tài sản KCHT hàng hải
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        -- Danh sách 18 tài nguyên KCHT được tách riêng
        FOR rec IN
            SELECT * FROM (VALUES
                ('berthasset', 'Tài sản bến cảng'),
                ('transferareaasset', 'Tài sản khu chuyển tải'),
                ('stormshelterasset', 'Tài sản khu tránh trú bão'),
                ('buoyberthasset', 'Tài sản bến phao'),
                ('pierasset', 'Tài sản cầu cảng'),
                ('anchorageasset', 'Tài sản khu neo đậu'),
                ('lighthouseasset', 'Tài sản đèn biển và nhà trạm'),
                ('dikerevetmentasset', 'Tài sản đê kè'),
                ('buoyasset', 'Tài sản phao tiêu'),
                ('channelasset', 'Tài sản luồng hàng hải'),
                ('dryportasset', 'Tài sản cảng cạn'),
                ('lritasset', 'Tài sản đài LRIT'),
                ('cospassarsatasset', 'Tài sản đài Cospas-Sarsat'),
                ('ttxlttasset', 'Tài sản đài TTXLTT'),
                ('vtsassistasset', 'Tài sản hệ thống phụ trợ VTS'),
                ('vhfasset', 'Tài sản HTTT liên lạc VHF'),
                ('daittdhasset', 'Tài sản đài TTDH'),
                ('inmarsatasset', 'Tài sản đài Inmarsat')
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

    -- Đồng bộ cấp quyền cho active users có infraasset:manage hoặc infraasset:read
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('berthasset:manage'), ('berthasset:read'),
                ('transferareaasset:manage'), ('transferareaasset:read'),
                ('stormshelterasset:manage'), ('stormshelterasset:read'),
                ('buoyberthasset:manage'), ('buoyberthasset:read'),
                ('pierasset:manage'), ('pierasset:read'),
                ('anchorageasset:manage'), ('anchorageasset:read'),
                ('lighthouseasset:manage'), ('lighthouseasset:read'),
                ('dikerevetmentasset:manage'), ('dikerevetmentasset:read'),
                ('buoyasset:manage'), ('buoyasset:read'),
                ('channelasset:manage'), ('channelasset:read'),
                ('dryportasset:manage'), ('dryportasset:read'),
                ('lritasset:manage'), ('lritasset:read'),
                ('cospassarsatasset:manage'), ('cospassarsatasset:read'),
                ('ttxlttasset:manage'), ('ttxlttasset:read'),
                ('vtsassistasset:manage'), ('vtsassistasset:read'),
                ('vhfasset:manage'), ('vhfasset:read'),
                ('daittdhasset:manage'), ('daittdhasset:read'),
                ('inmarsatasset:manage'), ('inmarsatasset:read')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động cho KCHT riêng biệt', v_now, v_now, u.id, u.id
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
