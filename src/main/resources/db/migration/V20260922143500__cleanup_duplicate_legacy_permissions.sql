-- ============================================================================
-- Migration: V20260922143500__cleanup_duplicate_legacy_permissions.sql
-- Description: Dọn dẹp triệt để các mã quyền duplicate / legacy (lrit, cospassarsat,
--              ttxltt, inmarsat, shiprepair, shiprepairyard, waterarea, buoystation,
--              beaconlight, lighthousestation, interconnect) và đồng bộ chuyển đổi sang
--              các mã canonical chuẩn trong user_permission_override, user_group_permissions,
--              role_permissions và permissions.
-- ============================================================================

DO $$
DECLARE
    mapping_rec RECORD;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    -- 1. Bảng ánh xạ chuyển đổi từ mã quyền legacy sang mã quyền canonical chuẩn
    CREATE TEMP TABLE tmp_perm_cleanup_mapping (
        legacy_code VARCHAR(100) PRIMARY KEY,
        canonical_code VARCHAR(100)
    ) ON COMMIT DROP;

    INSERT INTO tmp_perm_cleanup_mapping (legacy_code, canonical_code) VALUES
        -- LRIT
        ('lrit:read', 'coastalstationlrit:read'),
        ('lrit:create', 'coastalstationlrit:create'),
        ('lrit:update', 'coastalstationlrit:update'),
        ('lrit:delete', 'coastalstationlrit:delete'),
        ('lrit:approvec1', 'coastalstationlrit:approvec1'),
        ('lrit:approvec2', 'coastalstationlrit:approvec2'),
        ('lrit:history', 'coastalstationlrit:history'),
        ('lrit:manage', NULL),

        -- Cospas-Sarsat
        ('cospassarsat:read', 'coastalstationcospassarsat:read'),
        ('cospassarsat:create', 'coastalstationcospassarsat:create'),
        ('cospassarsat:update', 'coastalstationcospassarsat:update'),
        ('cospassarsat:delete', 'coastalstationcospassarsat:delete'),
        ('cospassarsat:approvec1', 'coastalstationcospassarsat:approvec1'),
        ('cospassarsat:approvec2', 'coastalstationcospassarsat:approvec2'),
        ('cospassarsat:history', 'coastalstationcospassarsat:history'),
        ('cospassarsat:manage', NULL),

        -- TTXLTT
        ('ttxltt:read', 'coastalstationhaiphong:read'),
        ('ttxltt:create', 'coastalstationhaiphong:create'),
        ('ttxltt:update', 'coastalstationhaiphong:update'),
        ('ttxltt:delete', 'coastalstationhaiphong:delete'),
        ('ttxltt:approvec1', 'coastalstationhaiphong:approvec1'),
        ('ttxltt:approvec2', 'coastalstationhaiphong:approvec2'),
        ('ttxltt:history', 'coastalstationhaiphong:history'),
        ('ttxltt:manage', NULL),

        -- Inmarsat (Legacy station codes)
        ('inmarsat:read', 'coastalstationinmarsat:read'),
        ('inmarsat:create', 'coastalstationinmarsat:create'),
        ('inmarsat:update', 'coastalstationinmarsat:update'),
        ('inmarsat:delete', 'coastalstationinmarsat:delete'),
        ('inmarsat:approvec1', 'coastalstationinmarsat:approvec1'),
        ('inmarsat:approvec2', 'coastalstationinmarsat:approvec2'),
        ('inmarsat:history', 'coastalstationinmarsat:history'),
        ('inmarsat:manage', NULL),

        -- Cơ sở sửa chữa đóng tàu (shiprepair, shiprepairyard -> shiprepairfacility)
        ('shiprepair:read', 'shiprepairfacility:read'),
        ('shiprepair:create', 'shiprepairfacility:create'),
        ('shiprepair:update', 'shiprepairfacility:update'),
        ('shiprepair:delete', 'shiprepairfacility:delete'),
        ('shiprepair:approvec1', 'shiprepairfacility:approvec1'),
        ('shiprepair:approvec2', 'shiprepairfacility:approvec2'),
        ('shiprepair:history', 'shiprepairfacility:history'),
        ('shiprepair:manage', NULL),
        ('shiprepairyard:read', 'shiprepairfacility:read'),
        ('shiprepairyard:create', 'shiprepairfacility:create'),
        ('shiprepairyard:update', 'shiprepairfacility:update'),
        ('shiprepairyard:delete', 'shiprepairfacility:delete'),
        ('shiprepairyard:approvec1', 'shiprepairfacility:approvec1'),
        ('shiprepairyard:approvec2', 'shiprepairfacility:approvec2'),
        ('shiprepairyard:history', 'shiprepairfacility:history'),
        ('shiprepairyard:manage', NULL),

        -- Vùng nước (waterarea -> waterzone)
        ('waterarea:read', 'waterzone:read'),
        ('waterarea:create', 'waterzone:create'),
        ('waterarea:update', 'waterzone:update'),
        ('waterarea:delete', 'waterzone:delete'),
        ('waterarea:approvec1', 'waterzone:approvec1'),
        ('waterarea:approvec2', 'waterzone:approvec2'),
        ('waterarea:history', 'waterzone:history'),
        ('waterarea:manage', NULL),

        -- Phao tiêu (buoystation -> buoy)
        ('buoystation:read', 'buoy:read'),
        ('buoystation:create', 'buoy:create'),
        ('buoystation:update', 'buoy:update'),
        ('buoystation:delete', 'buoy:delete'),
        ('buoystation:approvec1', 'buoy:approvec1'),
        ('buoystation:approvec2', 'buoy:approvec2'),
        ('buoystation:history', 'buoy:history'),
        ('buoystation:manage', NULL),

        -- Đèn biển (beaconlight, lighthousestation -> beaconstation)
        ('beaconlight:read', 'beaconstation:read'),
        ('beaconlight:create', 'beaconstation:create'),
        ('beaconlight:update', 'beaconstation:update'),
        ('beaconlight:delete', 'beaconstation:delete'),
        ('beaconlight:approvec1', 'beaconstation:approvec1'),
        ('beaconlight:approvec2', 'beaconstation:approvec2'),
        ('beaconlight:history', 'beaconstation:history'),
        ('beaconlight:manage', NULL),
        ('lighthousestation:read', 'beaconstation:read'),
        ('lighthousestation:create', 'beaconstation:create'),
        ('lighthousestation:update', 'beaconstation:update'),
        ('lighthousestation:delete', 'beaconstation:delete'),
        ('lighthousestation:approvec1', 'beaconstation:approvec1'),
        ('lighthousestation:approvec2', 'beaconstation:approvec2'),
        ('lighthousestation:history', 'beaconstation:history'),
        ('lighthousestation:manage', NULL),

        -- Liên thông kết nối (interconnect -> connection)
        ('interconnect:read', 'connection:read'),
        ('interconnect:create', 'connection:create'),
        ('interconnect:update', 'connection:update'),
        ('interconnect:delete', 'connection:delete'),
        ('interconnect:manage', NULL);

    -- 2. Đảm bảo các quyền canonical đích đã tồn tại trong bảng permissions
    IF to_regclass('public.permissions') IS NOT NULL THEN
        FOR mapping_rec IN SELECT DISTINCT canonical_code FROM tmp_perm_cleanup_mapping WHERE canonical_code IS NOT NULL
        LOOP
            IF NOT EXISTS (SELECT 1 FROM permissions WHERE code = mapping_rec.canonical_code) THEN
                INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
                VALUES (
                    gen_random_uuid(),
                    mapping_rec.canonical_code,
                    mapping_rec.canonical_code,
                    split_part(mapping_rec.canonical_code, ':', 1),
                    split_part(mapping_rec.canonical_code, ':', 2),
                    'Tự động khởi tạo quyền chuẩn ' || mapping_rec.canonical_code,
                    v_now,
                    v_now
                );
            END IF;
        END LOOP;
    END IF;

    -- 3. Di chuyển quyền trong bảng user_permission_override
    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        FOR mapping_rec IN SELECT legacy_code, canonical_code FROM tmp_perm_cleanup_mapping
        LOOP
            IF mapping_rec.canonical_code IS NOT NULL THEN
                -- Thêm bản ghi canonical nếu user chưa có
                INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
                SELECT gen_random_uuid(), legacy.user_id, mapping_rec.canonical_code,
                       'Chuẩn hóa từ mã quyền legacy ' || mapping_rec.legacy_code, v_now, v_now,
                       legacy.created_by, legacy.updated_by
                FROM user_permission_override legacy
                WHERE legacy.permission_code = mapping_rec.legacy_code
                  AND legacy.deleted_at IS NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM user_permission_override current_perm
                      WHERE current_perm.user_id = legacy.user_id
                        AND current_perm.permission_code = mapping_rec.canonical_code
                        AND current_perm.deleted_at IS NULL
                  );
            END IF;

            -- Xóa mã legacy
            DELETE FROM user_permission_override WHERE permission_code = mapping_rec.legacy_code;
        END LOOP;
    END IF;

    -- 4. Di chuyển quyền trong bảng user_group_permissions
    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        FOR mapping_rec IN SELECT legacy_code, canonical_code FROM tmp_perm_cleanup_mapping
        LOOP
            IF mapping_rec.canonical_code IS NOT NULL THEN
                INSERT INTO user_group_permissions (user_group_id, permission)
                SELECT legacy.user_group_id, mapping_rec.canonical_code
                FROM user_group_permissions legacy
                WHERE legacy.permission = mapping_rec.legacy_code
                  AND NOT EXISTS (
                      SELECT 1 FROM user_group_permissions current_perm
                      WHERE current_perm.user_group_id = legacy.user_group_id
                        AND current_perm.permission = mapping_rec.canonical_code
                  );
            END IF;

            -- Xóa mã legacy
            DELETE FROM user_group_permissions WHERE permission = mapping_rec.legacy_code;
        END LOOP;
    END IF;

    -- 5. Di chuyển quyền trong bảng role_permissions
    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        FOR mapping_rec IN SELECT legacy_code, canonical_code FROM tmp_perm_cleanup_mapping
        LOOP
            IF mapping_rec.canonical_code IS NOT NULL THEN
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT legacy.role_id, target.id
                FROM role_permissions legacy
                JOIN permissions source ON source.id = legacy.permission_id AND source.code = mapping_rec.legacy_code
                JOIN permissions target ON target.code = mapping_rec.canonical_code
                WHERE NOT EXISTS (
                    SELECT 1 FROM role_permissions current_perm
                    WHERE current_perm.role_id = legacy.role_id AND current_perm.permission_id = target.id
                );
            END IF;

            DELETE FROM role_permissions
            WHERE permission_id IN (SELECT id FROM permissions WHERE code = mapping_rec.legacy_code);
        END LOOP;
    END IF;

    -- 6. Xóa triệt để các mã permission legacy trùng lặp khỏi bảng permissions
    IF to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM permissions
        WHERE code IN (SELECT legacy_code FROM tmp_perm_cleanup_mapping);

        -- Đồng thời xóa các quyền dạng :read:restricted và :read:confidential không còn dùng
        DELETE FROM permissions
        WHERE code LIKE '%:read:restricted' OR code LIKE '%:read:confidential';
    END IF;

END $$;
