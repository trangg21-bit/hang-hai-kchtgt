-- V20260910153000__set_three_root_org_units.sql
-- Thiết lập 3 khối đơn vị gốc ngang hàng (Cấp 1 - parent_id = NULL) chuẩn theo dự án gốc hh.csdl:
-- 1. [G17.43] Cục Hàng hải và Đường thủy Việt Nam
-- 2. [G17.72] Tổng công ty Bảo đảm an toàn hàng hải Việt Nam
-- 3. [G17.74] Công ty TNHH MTV Thông tin điện tử hàng hải Việt Nam (VISHIPEL)

-- 0. Đảm bảo các cột audit deleted_at, created_at, updated_at tồn tại trên org_units
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- 1. Đưa G17.72 và G17.74 thành Root (level 1, parent_id = NULL)
UPDATE org_units
SET parent_id = NULL,
    level = 1,
    rank = 0,
    path = '/' || id || '/'
WHERE code IN ('G17.72', 'G17.74') AND deleted_at IS NULL;

-- 2. Cập nhật lại path và level cho các đơn vị con trực tiếp của G17.72 (Level 2)
UPDATE org_units child
SET path = '/' || p.id || '/' || child.id || '/',
    level = 2,
    rank = 1
FROM org_units p
WHERE child.parent_id = p.id 
  AND p.code = 'G17.72' 
  AND child.deleted_at IS NULL;

-- 3. Cập nhật lại path và level cho các đơn vị cháu của G17.72 (Chi nhánh hoa tiêu - Level 3)
UPDATE org_units sub
SET path = p.path || sub.id || '/',
    level = 3,
    rank = 2
FROM org_units p
WHERE sub.parent_id = p.id 
  AND p.path LIKE '%/' || (SELECT id FROM org_units WHERE code = 'G17.72' AND deleted_at IS NULL LIMIT 1) || '/%'
  AND sub.code LIKE 'G17.72.12.%'
  AND sub.deleted_at IS NULL;

-- 4. Cập nhật lại path và level cho các đơn vị con trực tiếp của G17.74 (Level 2)
UPDATE org_units child
SET path = '/' || p.id || '/' || child.id || '/',
    level = 2,
    rank = 1
FROM org_units p
WHERE child.parent_id = p.id 
  AND p.code = 'G17.74' 
  AND child.deleted_at IS NULL;
