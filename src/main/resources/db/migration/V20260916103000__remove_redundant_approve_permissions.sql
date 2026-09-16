-- ==============================================================================
-- Migration: Xóa bỏ các quyền approve thừa thãi (đơn cấp) ở các module KCHT hàng hải
-- đã chuẩn hóa mô hình phê duyệt 2 cấp (C1/C2 - approvec1/approvec2).
-- ==============================================================================

DO $$
BEGIN
    -- 1. Xóa trong bảng user_permission_override nếu tồn tại
    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override
        WHERE permission_code IN (
            'cctv:approve', 'vhf:approve', 'scada:approve',
            'transmission:approve', 'vtsassist:approve',
            'beaconstation:approve', 'dikerevetment:approve', 'radarstation:approve'
        );
    END IF;

    -- 2. Xóa trong bảng user_group_permissions nếu tồn tại
    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions
        WHERE permission IN (
            'cctv:approve', 'vhf:approve', 'scada:approve',
            'transmission:approve', 'vtsassist:approve',
            'beaconstation:approve', 'dikerevetment:approve', 'radarstation:approve'
        );
    END IF;

    -- 3. Xóa trong bảng role_permissions nếu tồn tại
    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id
            FROM permissions
            WHERE code IN (
                'cctv:approve', 'vhf:approve', 'scada:approve',
                'transmission:approve', 'vtsassist:approve',
                'beaconstation:approve', 'dikerevetment:approve', 'radarstation:approve'
            )
        );
    END IF;

    -- 4. Xóa trong bảng permissions
    IF to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM permissions
        WHERE code IN (
            'cctv:approve', 'vhf:approve', 'scada:approve',
            'transmission:approve', 'vtsassist:approve',
            'beaconstation:approve', 'dikerevetment:approve', 'radarstation:approve'
        );
    END IF;
END $$;
