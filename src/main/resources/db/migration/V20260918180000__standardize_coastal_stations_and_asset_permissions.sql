-- ============================================================================
-- Migration: V20260918180000__standardize_coastal_stations_and_asset_permissions.sql
-- Description: Chuẩn hóa 7 mã quyền 2 cấp cho các đài KCHT hàng hải (LRIT, Cospas-Sarsat, Đài TTDH)
--              và tách biệt hoàn toàn với phân hệ Tài sản KCHT
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- 1. Đăng ký đầy đủ 7 mã quyền chuẩn 2 cấp cho các đài KCHT
    IF to_regclass('public.permissions') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                -- Đài thông tin LRIT
                ('coastalstationlrit:read', 'Xem Đài thông tin LRIT', 'coastalstationlrit', 'read', 'Tra cứu danh sách và chi tiết Đài thông tin LRIT'),
                ('coastalstationlrit:create', 'Thêm Đài thông tin LRIT', 'coastalstationlrit', 'create', 'Tạo mới hồ sơ Đài thông tin LRIT'),
                ('coastalstationlrit:update', 'Sửa Đài thông tin LRIT', 'coastalstationlrit', 'update', 'Chỉnh sửa hồ sơ Đài thông tin LRIT'),
                ('coastalstationlrit:delete', 'Xóa Đài thông tin LRIT', 'coastalstationlrit', 'delete', 'Xóa mềm hồ sơ Đài thông tin LRIT'),
                ('coastalstationlrit:approvec1', 'Phê duyệt cấp Cảng vụ/Chi cục Đài thông tin LRIT', 'coastalstationlrit', 'approvec1', 'Phê duyệt hoặc từ chối cấp Cảng vụ/Chi cục đối với Đài thông tin LRIT'),
                ('coastalstationlrit:approvec2', 'Phê duyệt cấp Cục Đài thông tin LRIT', 'coastalstationlrit', 'approvec2', 'Phê duyệt hoặc từ chối cấp Cục đối với Đài thông tin LRIT'),
                ('coastalstationlrit:history', 'Lịch sử Đài thông tin LRIT', 'coastalstationlrit', 'history', 'Xem lịch sử thay đổi và phê duyệt Đài thông tin LRIT'),

                -- Đài thông tin Cospas-Sarsat
                ('coastalstationcospassarsat:read', 'Xem Đài thông tin Cospas-Sarsat', 'coastalstationcospassarsat', 'read', 'Tra cứu danh sách và chi tiết Đài thông tin Cospas-Sarsat'),
                ('coastalstationcospassarsat:create', 'Thêm Đài thông tin Cospas-Sarsat', 'coastalstationcospassarsat', 'create', 'Tạo mới hồ sơ Đài thông tin Cospas-Sarsat'),
                ('coastalstationcospassarsat:update', 'Sửa Đài thông tin Cospas-Sarsat', 'coastalstationcospassarsat', 'update', 'Chỉnh sửa hồ sơ Đài thông tin Cospas-Sarsat'),
                ('coastalstationcospassarsat:delete', 'Xóa Đài thông tin Cospas-Sarsat', 'coastalstationcospassarsat', 'delete', 'Xóa mềm hồ sơ Đài thông tin Cospas-Sarsat'),
                ('coastalstationcospassarsat:approvec1', 'Phê duyệt cấp Cảng vụ/Chi cục Đài thông tin Cospas-Sarsat', 'coastalstationcospassarsat', 'approvec1', 'Phê duyệt hoặc từ chối cấp Cảng vụ/Chi cục đối với Đài thông tin Cospas-Sarsat'),
                ('coastalstationcospassarsat:approvec2', 'Phê duyệt cấp Cục Đài thông tin Cospas-Sarsat', 'coastalstationcospassarsat', 'approvec2', 'Phê duyệt hoặc từ chối cấp Cục đối với Đài thông tin Cospas-Sarsat'),
                ('coastalstationcospassarsat:history', 'Lịch sử Đài thông tin Cospas-Sarsat', 'coastalstationcospassarsat', 'history', 'Xem lịch sử thay đổi và phê duyệt Đài thông tin Cospas-Sarsat'),

                -- Đài thông tin duyên hải (TTDH)
                ('daittdh:read', 'Xem Đài TTDH', 'daittdh', 'read', 'Tra cứu danh sách và chi tiết Đài TTDH'),
                ('daittdh:create', 'Thêm Đài TTDH', 'daittdh', 'create', 'Tạo mới hồ sơ Đài TTDH'),
                ('daittdh:update', 'Sửa Đài TTDH', 'daittdh', 'update', 'Chỉnh sửa hồ sơ Đài TTDH'),
                ('daittdh:delete', 'Xóa Đài TTDH', 'daittdh', 'delete', 'Xóa mềm hồ sơ Đài TTDH'),
                ('daittdh:approvec1', 'Phê duyệt cấp Cảng vụ/Chi cục Đài TTDH', 'daittdh', 'approvec1', 'Phê duyệt hoặc từ chối cấp Cảng vụ/Chi cục đối với Đài TTDH'),
                ('daittdh:approvec2', 'Phê duyệt cấp Cục Đài TTDH', 'daittdh', 'approvec2', 'Phê duyệt hoặc từ chối cấp Cục đối với Đài TTDH'),
                ('daittdh:history', 'Lịch sử Đài TTDH', 'daittdh', 'history', 'Xem lịch sử thay đổi và phê duyệt Đài TTDH')
            ) AS t(p_code, p_name, p_res, p_act, p_desc)
        LOOP
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.p_code, rec.p_name, rec.p_res, rec.p_act, rec.p_desc, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.p_code);

            -- Cập nhật tên rõ ràng nếu đã có
            UPDATE permissions
            SET name = rec.p_name,
                resource = rec.p_res,
                action = rec.p_act,
                description = rec.p_desc,
                updated_at = v_now
            WHERE code = rec.p_code;
        END LOOP;

        -- Chuẩn hóa tên rõ ràng cho các quyền Tài sản để phân biệt với KCHT
        UPDATE permissions SET name = 'Xem Tài sản đài LRIT', updated_at = v_now WHERE code = 'lritasset:read';
        UPDATE permissions SET name = 'Thêm Tài sản đài LRIT', updated_at = v_now WHERE code = 'lritasset:create';
        UPDATE permissions SET name = 'Sửa Tài sản đài LRIT', updated_at = v_now WHERE code = 'lritasset:update';
        UPDATE permissions SET name = 'Xóa Tài sản đài LRIT', updated_at = v_now WHERE code = 'lritasset:delete';

        UPDATE permissions SET name = 'Xem Tài sản đài Cospas-Sarsat', updated_at = v_now WHERE code = 'cospassarsatasset:read';
        UPDATE permissions SET name = 'Thêm Tài sản đài Cospas-Sarsat', updated_at = v_now WHERE code = 'cospassarsatasset:create';
        UPDATE permissions SET name = 'Sửa Tài sản đài Cospas-Sarsat', updated_at = v_now WHERE code = 'cospassarsatasset:update';
        UPDATE permissions SET name = 'Xóa Tài sản đài Cospas-Sarsat', updated_at = v_now WHERE code = 'cospassarsatasset:delete';

        UPDATE permissions SET name = 'Xem Tài sản đài TTDH', updated_at = v_now WHERE code = 'daittdhasset:read';
        UPDATE permissions SET name = 'Thêm Tài sản đài TTDH', updated_at = v_now WHERE code = 'daittdhasset:create';
        UPDATE permissions SET name = 'Sửa Tài sản đài TTDH', updated_at = v_now WHERE code = 'daittdhasset:update';
        UPDATE permissions SET name = 'Xóa Tài sản đài TTDH', updated_at = v_now WHERE code = 'daittdhasset:delete';
    END IF;

    -- 2. Đồng bộ cấp quyền cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('coastalstationlrit:read'),
                ('coastalstationlrit:create'),
                ('coastalstationlrit:update'),
                ('coastalstationlrit:delete'),
                ('coastalstationlrit:approvec1'),
                ('coastalstationlrit:approvec2'),
                ('coastalstationlrit:history'),
                ('coastalstationcospassarsat:read'),
                ('coastalstationcospassarsat:create'),
                ('coastalstationcospassarsat:update'),
                ('coastalstationcospassarsat:delete'),
                ('coastalstationcospassarsat:approvec1'),
                ('coastalstationcospassarsat:approvec2'),
                ('coastalstationcospassarsat:history'),
                ('daittdh:read'),
                ('daittdh:create'),
                ('daittdh:update'),
                ('daittdh:delete'),
                ('daittdh:approvec1'),
                ('daittdh:approvec2'),
                ('daittdh:history')
            ) AS t(perm_code)
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Chuẩn hóa quyền KCHT hàng hải theo chuẩn VTS', v_now, v_now, u.id, u.id
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
