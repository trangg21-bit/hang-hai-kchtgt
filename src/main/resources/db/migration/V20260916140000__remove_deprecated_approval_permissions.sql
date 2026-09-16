-- Migration: Xóa bỏ các quyền phê duyệt legacy thừa (*:approve, *:reject) cho toàn bộ các phân hệ KCHT hàng hải
-- Lý do: Hệ thống đã áp dụng quy trình phê duyệt 2 cấp chuẩn mực (approvec1, approvec2).
-- Các quyền *:approve và *:reject đơn cấp cũ gây dư thừa và nhầm lẫn trên cây phân quyền chức năng.

DO $$
DECLARE
    deprecated_codes text[] := ARRAY[
        -- 1. Nhóm thiết bị kỹ thuật & phụ trợ VTS
        'cctv:approve',
        'vhf:approve',
        'scada:approve',
        'transmission:approve',
        'vtsassist:approve',

        -- 2. Nhóm đài thông tin duyên hải & chuyên dùng
        'coastalstationcospassarsat:approve', 'coastalstationcospassarsat:reject',
        'coastalstationlrit:approve', 'coastalstationlrit:reject',
        'coastalstationinmarsat:approve', 'coastalstationinmarsat:reject',
        'coastalstationhaiphong:approve', 'coastalstationhaiphong:reject',
        'daittdh:approve',
        'coastalstation:approve', 'coastalstation:reject',
        'specialstation:approve', 'specialstation:reject',
        'station:approve', 'station:reject',

        -- 3. Nhóm hạ tầng cảng biển, cầu bến, vùng nước
        'port:approve',
        'berth:approve',
        'buoyberth:approve',
        'pier:approve',
        'dryport:approve',
        'anchorage:approve',
        'anchoragearea:approve',
        'transferarea:approve',
        'stormshelter:approve',
        'shiprepairyard:approve',
        'waterzone:approve',

        -- 4. Quyền dữ liệu dùng chung & mồ côi
        'data:approve',
        'approve:action'
    ];
BEGIN
    -- 1. Xóa khỏi bảng ghi đè quyền người dùng
    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override
        WHERE permission_code = ANY(deprecated_codes);
    END IF;

    -- 2. Xóa khỏi bảng phân quyền nhóm người dùng
    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions
        WHERE permission = ANY(deprecated_codes);
    END IF;

    -- 3. Xóa khỏi bảng liên kết vai trò - quyền hạn
    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code = ANY(deprecated_codes)
        );
    END IF;

    -- 4. Xóa khỏi bảng danh mục quyền hạn hệ thống
    IF to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM permissions
        WHERE code = ANY(deprecated_codes);
    END IF;

    RAISE NOTICE 'Đã dọn sạch các quyền phê duyệt legacy thừa khỏi hệ thống.';
END $$;
