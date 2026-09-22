-- ============================================================================
-- Migration: V20260921170000__seed_complete_asset_and_kcht_permissions.sql
-- Description: Bổ sung và chuẩn hóa đầy đủ mã quyền (read, create, update, delete, approvec1, approvec2, history)
--              cho 24 loại Tài sản KCHT, 4 nghiệp vụ tài sản và các đài viễn thông KCHT
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NOT NULL THEN
        FOR rec IN
            SELECT * FROM (VALUES
                ('asset', 'Quản lý tài sản'),
                ('infraasset', 'Tài sản kết cấu hạ tầng'),
                ('berthasset', 'Tài sản bến cảng'),
                ('transferareaasset', 'Tài sản khu chuyển tải'),
                ('stormshelterasset', 'Tài sản khu tránh, trú bão'),
                ('buoyberthasset', 'Tài sản bến phao'),
                ('pierasset', 'Tài sản cầu cảng'),
                ('anchorageasset', 'Tài sản khu neo đậu'),
                ('lighthouseasset', 'Tài sản đèn biển và nhà trạm'),
                ('dikerevetmentasset', 'Tài sản đê/kè'),
                ('buoyasset', 'Tài sản phao, tiêu và nhà trạm'),
                ('channelasset', 'Tài sản luồng hàng hải'),
                ('dryportasset', 'Tài sản cảng cạn'),
                ('lritasset', 'Tài sản đài LRIT'),
                ('cospassarsatasset', 'Tài sản đài Cospas-Sarsat'),
                ('ttxlttasset', 'Tài sản đài TTXLTT'),
                ('vtsasset', 'Tài sản hệ thống VTS'),
                ('radarasset', 'Tài sản trạm radar'),
                ('aisasset', 'Tài sản hệ thống AIS'),
                ('cctvasset', 'Tài sản HT CCTV'),
                ('scadaasset', 'Tài sản HT SCADA'),
                ('transmissionasset', 'Tài sản HT truyền dẫn'),
                ('vtsassistasset', 'Tài sản hệ thống phụ trợ VTS'),
                ('vhfasset', 'Tài sản HTTT liên lạc VHF'),
                ('daittdhasset', 'Tài sản đài TTDH'),
                ('inmarsatasset', 'Tài sản đài Inmarsat'),
                ('assetincrease', 'Yêu cầu tăng tài sản'),
                ('assetdecrease', 'Yêu cầu giảm tài sản'),
                ('inventoryasset', 'Kiểm kê tài sản'),
                ('assetexploitation', 'Khai thác tài sản')
            ) AS t(res, name_prefix)
        LOOP
            -- read
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':read', 'Xem ' || rec.name_prefix, rec.res, 'read', 'Tra cứu danh sách và chi tiết ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':read');

            -- create
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':create', 'Thêm mới ' || rec.name_prefix, rec.res, 'create', 'Tạo mới hồ sơ ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':create');

            -- update
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':update', 'Cập nhật ' || rec.name_prefix, rec.res, 'update', 'Chỉnh sửa thông tin ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':update');

            -- delete
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':delete', 'Xóa ' || rec.name_prefix, rec.res, 'delete', 'Xóa hồ sơ ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':delete');

            -- approvec1
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':approvec1', 'Phê duyệt C1 ' || rec.name_prefix, rec.res, 'approvec1', 'Phê duyệt cấp 1 (Chi cục/Cảng vụ) ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':approvec1');

            -- approvec2
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':approvec2', 'Phê duyệt C2 ' || rec.name_prefix, rec.res, 'approvec2', 'Phê duyệt cấp 2 (Cục Hàng hải) ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':approvec2');

            -- history
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':history', 'Lịch sử phê duyệt ' || rec.name_prefix, rec.res, 'history', 'Xem lịch sử thay đổi và phê duyệt ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':history');
        END LOOP;

        -- 2. Thêm các mã quyền chuẩn ngắn cho các đài viễn thông KCHT (inmarsat, cospassarsat, lrit, ttxltt)
        FOR rec IN
            SELECT * FROM (VALUES
                ('inmarsat', 'đài Inmarsat'),
                ('cospassarsat', 'đài Cospas-Sarsat'),
                ('lrit', 'đài LRIT'),
                ('ttxltt', 'đài TTXLTT Hà Nội')
            ) AS t(res, name_prefix)
        LOOP
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':read', 'Xem ' || rec.name_prefix, rec.res, 'read', 'Xem danh sách và chi tiết ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':read');

            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':create', 'Thêm mới ' || rec.name_prefix, rec.res, 'create', 'Tạo mới ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':create');

            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':update', 'Cập nhật ' || rec.name_prefix, rec.res, 'update', 'Chỉnh sửa ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':update');

            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':delete', 'Xóa ' || rec.name_prefix, rec.res, 'delete', 'Xóa ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':delete');

            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':approvec1', 'Phê duyệt C1 ' || rec.name_prefix, rec.res, 'approvec1', 'Phê duyệt cấp 1 ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':approvec1');

            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':approvec2', 'Phê duyệt C2 ' || rec.name_prefix, rec.res, 'approvec2', 'Phê duyệt cấp 2 ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':approvec2');

            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), rec.res || ':history', 'Lịch sử phê duyệt ' || rec.name_prefix, rec.res, 'history', 'Xem lịch sử thay đổi ' || rec.name_prefix, v_now, v_now
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = rec.res || ':history');
        END LOOP;
    END IF;

    -- 3. Đồng bộ cấp quyền cho active users
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.app_users') IS NOT NULL THEN
        FOR rec IN
            SELECT p.code AS perm_code
            FROM permissions p
            WHERE p.resource IN (
                'berthasset', 'transferareaasset', 'stormshelterasset', 'buoyberthasset', 'pierasset',
                'anchorageasset', 'lighthouseasset', 'dikerevetmentasset', 'buoyasset', 'channelasset',
                'dryportasset', 'lritasset', 'cospassarsatasset', 'ttxlttasset', 'vtsasset', 'radarasset',
                'aisasset', 'cctvasset', 'scadaasset', 'transmissionasset', 'vtsassistasset', 'vhfasset',
                'daittdhasset', 'inmarsatasset', 'assetincrease', 'assetdecrease', 'inventoryasset', 'assetexploitation',
                'inmarsat', 'cospassarsat', 'lrit', 'ttxltt'
            )
        LOOP
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), u.id, rec.perm_code, 'Cấp quyền tự động theo chuẩn phân hệ KCHT & Tài sản', v_now, v_now, u.id, u.id
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
