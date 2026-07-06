-- V27: Seed demo child organization units under the root unit
-- Inserts Cảng vụ Hàng hải Hải Phòng, Quảng Ninh, and TP. Hồ Chí Minh

INSERT INTO org_units (id, name, code, parent_id, unit_type, description, status, path, level, scope_id, sort_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Cảng vụ Hàng hải Hải Phòng',
    'CVHH_HP',
    r.id,
    'CANG_VU',
    'Cảng vụ Hàng hải Hải Phòng',
    'APPROVED',
    r.id::text,
    1,
    0,
    1,
    NOW(),
    NOW()
FROM org_units r
WHERE r.parent_id IS NULL AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM org_units WHERE code = 'CVHH_HP');

INSERT INTO org_units (id, name, code, parent_id, unit_type, description, status, path, level, scope_id, sort_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Cảng vụ Hàng hải Quảng Ninh',
    'CVHH_QN',
    r.id,
    'CANG_VU',
    'Cảng vụ Hàng hải Quảng Ninh',
    'APPROVED',
    r.id::text,
    1,
    0,
    2,
    NOW(),
    NOW()
FROM org_units r
WHERE r.parent_id IS NULL AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM org_units WHERE code = 'CVHH_QN');

INSERT INTO org_units (id, name, code, parent_id, unit_type, description, status, path, level, scope_id, sort_order, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Cảng vụ Hàng hải TP. Hồ Chí Minh',
    'CVHH_HCM',
    r.id,
    'CANG_VU',
    'Cảng vụ Hàng hải TP. Hồ Chí Minh',
    'APPROVED',
    r.id::text,
    1,
    0,
    3,
    NOW(),
    NOW()
FROM org_units r
WHERE r.parent_id IS NULL AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM org_units WHERE code = 'CVHH_HCM');
