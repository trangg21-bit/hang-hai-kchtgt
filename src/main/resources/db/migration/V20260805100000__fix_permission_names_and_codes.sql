-- V20260805100000: Fix duplicated/corrupted permission names & descriptions for shiprepair and other modules
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        -- Fix shiprepair permissions
        UPDATE permissions SET name = 'Tạo cơ sở sửa chữa', description = 'Tạo mới cơ sở sửa chữa đóng tàu' WHERE code = 'shiprepair:create';
        UPDATE permissions SET name = 'Xem cơ sở sửa chữa', description = 'Xem danh sách và chi tiết cơ sở sửa chữa đóng tàu' WHERE code = 'shiprepair:read';
        UPDATE permissions SET name = 'Cập nhật cơ sở sửa chữa', description = 'Chỉnh sửa cơ sở sửa chữa đóng tàu' WHERE code = 'shiprepair:update';
        UPDATE permissions SET name = 'Xóa cơ sở sửa chữa', description = 'Xóa cơ sở sửa chữa đóng tàu' WHERE code = 'shiprepair:delete';
        UPDATE permissions SET name = 'Phê duyệt C1 cơ sở sửa chữa', description = 'Phê duyệt cấp 1 cơ sở sửa chữa đóng tàu' WHERE code = 'shiprepair:approvec1';
        UPDATE permissions SET name = 'Phê duyệt C2 cơ sở sửa chữa', description = 'Phê duyệt cấp 2 cơ sở sửa chữa đóng tàu' WHERE code = 'shiprepair:approvec2';
        UPDATE permissions SET name = 'Xem lịch sử cơ sở sửa chữa', description = 'Xem lịch sử thay đổi cơ sở sửa chữa đóng tàu' WHERE code = 'shiprepair:history';

        -- Fix navigationchannel permissions (fix typos in Vietnamese)
        UPDATE permissions SET name = 'Tạo luồng hàng hải', description = 'Tạo mới luồng hàng hải' WHERE code = 'navigationchannel:create';
        UPDATE permissions SET name = 'Xem luồng hàng hải', description = 'Xem danh sách và chi tiết luồng hàng hải' WHERE code = 'navigationchannel:read';
        UPDATE permissions SET name = 'Cập nhật luồng hàng hải', description = 'Chỉnh sửa luồng hàng hải' WHERE code = 'navigationchannel:update';
        UPDATE permissions SET name = 'Xóa luồng hàng hải', description = 'Xóa luồng hàng hải' WHERE code = 'navigationchannel:delete';
        UPDATE permissions SET name = 'Phê duyệt C1 luồng hàng hải', description = 'Phê duyệt cấp 1 luồng hàng hải' WHERE code = 'navigationchannel:approvec1';
        UPDATE permissions SET name = 'Phê duyệt C2 luồng hàng hải', description = 'Phê duyệt cấp 2 luồng hàng hải' WHERE code = 'navigationchannel:approvec2';
        UPDATE permissions SET name = 'Xem lịch sử luồng hàng hải', description = 'Xem lịch sử thay đổi luồng hàng hải' WHERE code = 'navigationchannel:history';

        -- Fix dikerevetment permissions (fix typos in Vietnamese)
        UPDATE permissions SET name = 'Tạo đê kè', description = 'Tạo mới đê kè' WHERE code = 'dikerevetment:create';
        UPDATE permissions SET name = 'Xem đê kè', description = 'Xem danh sách và chi tiết đê kè' WHERE code = 'dikerevetment:read';
        UPDATE permissions SET name = 'Cập nhật đê kè', description = 'Chỉnh sửa đê kè' WHERE code = 'dikerevetment:update';
        UPDATE permissions SET name = 'Xóa đê kè', description = 'Xóa đê kè' WHERE code = 'dikerevetment:delete';
        UPDATE permissions SET name = 'Phê duyệt C1 đê kè', description = 'Phê duyệt cấp 1 đê kè' WHERE code = 'dikerevetment:approvec1';
        UPDATE permissions SET name = 'Phê duyệt C2 đê kè', description = 'Phê duyệt cấp 2 đê kè' WHERE code = 'dikerevetment:approvec2';
        UPDATE permissions SET name = 'Xem lịch sử đê kè', description = 'Xem lịch sử thay đổi đê kè' WHERE code = 'dikerevetment:history';

        -- Fix radarstation permissions
        UPDATE permissions SET name = 'Tạo trạm radar', description = 'Tạo mới trạm radar' WHERE code = 'radarstation:create';
        UPDATE permissions SET name = 'Xem trạm radar', description = 'Xem danh sách và chi tiết trạm radar' WHERE code = 'radarstation:read';
        UPDATE permissions SET name = 'Cập nhật trạm radar', description = 'Chỉnh sửa trạm radar' WHERE code = 'radarstation:update';
        UPDATE permissions SET name = 'Xóa trạm radar', description = 'Xóa trạm radar' WHERE code = 'radarstation:delete';
        UPDATE permissions SET name = 'Phê duyệt C1 trạm radar', description = 'Phê duyệt cấp 1 trạm radar' WHERE code = 'radarstation:approvec1';
        UPDATE permissions SET name = 'Phê duyệt C2 trạm radar', description = 'Phê duyệt cấp 2 trạm radar' WHERE code = 'radarstation:approvec2';
        UPDATE permissions SET name = 'Xem lịch sử trạm radar', description = 'Xem lịch sử thay đổi trạm radar' WHERE code = 'radarstation:history';

        -- Fix vts permissions
        UPDATE permissions SET name = 'Tạo VTS', description = 'Tạo mới hệ thống VTS' WHERE code = 'vts:create';
        UPDATE permissions SET name = 'Xem VTS', description = 'Xem danh sách và chi tiết hệ thống VTS' WHERE code = 'vts:read';
        UPDATE permissions SET name = 'Cập nhật VTS', description = 'Chỉnh sửa hệ thống VTS' WHERE code = 'vts:update';
        UPDATE permissions SET name = 'Xóa VTS', description = 'Xóa hệ thống VTS' WHERE code = 'vts:delete';
        UPDATE permissions SET name = 'Phê duyệt C1 VTS', description = 'Phê duyệt cấp 1 VTS' WHERE code = 'vts:approve:c1' OR code = 'vts:approvec1';
        UPDATE permissions SET name = 'Phê duyệt C2 VTS', description = 'Phê duyệt cấp 2 VTS' WHERE code = 'vts:approve:c2' OR code = 'vts:approvec2';
        UPDATE permissions SET name = 'Xem lịch sử VTS', description = 'Xem lịch sử thay đổi VTS' WHERE code = 'vts:history';
    END IF;
END $$;
