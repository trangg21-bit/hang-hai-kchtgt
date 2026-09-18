-- Đài Inmarsat thuộc phân hệ Trạm bờ dùng resource riêng
-- `coastalstationinmarsat:*`; không dùng chung với tài sản Inmarsat.
-- Chỉ seed definition. Các quyền đã cấp không được tự suy diễn/chuyển đổi.

DO $$
DECLARE
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'coastalstationinmarsat:' || item.action,
           item.name, 'coastalstationinmarsat', item.action,
           item.description, v_now, v_now
    FROM (VALUES
        ('read', 'Xem đài Inmarsat', 'Xem danh sách và chi tiết đài Inmarsat'),
        ('create', 'Thêm đài Inmarsat', 'Tạo mới đài Inmarsat'),
        ('update', 'Cập nhật đài Inmarsat', 'Chỉnh sửa đài Inmarsat'),
        ('delete', 'Xóa đài Inmarsat', 'Xóa đài Inmarsat'),
        ('approvec1', 'Phê duyệt C1 đài Inmarsat', 'Phê duyệt cấp 1 (Cảng vụ/Chi cục) đài Inmarsat'),
        ('approvec2', 'Phê duyệt C2 đài Inmarsat', 'Phê duyệt cấp 2 (Cục Hàng hải) đài Inmarsat'),
        ('history', 'Lịch sử phê duyệt đài Inmarsat', 'Xem lịch sử thay đổi và phê duyệt đài Inmarsat')
    ) AS item(action, name, description)
    WHERE NOT EXISTS (
        SELECT 1
        FROM permissions permission
        WHERE permission.code = 'coastalstationinmarsat:' || item.action
    );
END $$;
