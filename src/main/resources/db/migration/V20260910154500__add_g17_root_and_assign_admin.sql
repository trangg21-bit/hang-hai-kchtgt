-- V20260910154500__add_g17_root_and_assign_admin.sql
-- 1. Thêm đơn vị gốc cấp Bộ [G17] làm container phân quyền ngầm (Level 0)
INSERT INTO org_units (
    id, code, name, description, parent_id, level, rank, path, sort_order, operational_status, created_at, updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000017',
    'G17',
    'Bộ Giao thông Vận tải',
    'Cơ quan quản lý nhà nước cấp Bộ - Đơn vị gốc hệ thống',
    NULL,
    0,
    0,
    '/00000000-0000-0000-0000-000000000017/',
    0,
    0,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET code = 'G17',
    name = 'Bộ Giao thông Vận tải',
    parent_id = NULL,
    level = 0,
    rank = 0,
    path = '/00000000-0000-0000-0000-000000000017/',
    deleted_at = NULL;

-- 2. Đưa 3 khối: Cục Hàng hải (G17.43), Tổng công ty BĐATHH (G17.72), và Vishipel (G17.74) làm 3 con trực tiếp của G17 (Level 1)
UPDATE org_units
SET parent_id = '00000000-0000-0000-0000-000000000017',
    level = 1,
    rank = 0,
    path = '/00000000-0000-0000-0000-000000000017/' || id || '/'
WHERE code IN ('G17.43', 'G17.72', 'G17.74') AND deleted_at IS NULL;

-- 3. Cập nhật lại path cho các đơn vị con của G17.43, G17.72, G17.74 (Level 2)
UPDATE org_units child
SET path = p.path || child.id || '/',
    level = 2
FROM org_units p
WHERE child.parent_id = p.id 
  AND p.code IN ('G17.43', 'G17.72', 'G17.74')
  AND child.deleted_at IS NULL;

-- Với các đơn vị cháu (Level 3 - Đại diện cảng vụ, trạm, chi nhánh hoa tiêu):
UPDATE org_units sub
SET path = p.path || sub.id || '/',
    level = 3
FROM org_units p
WHERE sub.parent_id = p.id 
  AND p.parent_id IN (SELECT id FROM org_units WHERE code IN ('G17.43', 'G17.72', 'G17.74'))
  AND sub.deleted_at IS NULL;

-- 4. Gán tài khoản admin trực thuộc đơn vị cha G17
UPDATE app_users
SET org_unit_id = '00000000-0000-0000-0000-000000000017'
WHERE username = 'admin';
