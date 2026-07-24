-- V65: Insert Default Spatial Object Categories

-- 1. Bến cảng, cầu cảng
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'BEN_CANG', 'Bến cảng, cầu cảng', 1, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Bến cảng%' OR code = 'BEN_CANG' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

-- 2. Cảng biển
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'CANG_BIEN', 'Cảng biển', 1, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Cảng biển%' OR code = 'CANG_BIEN' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

-- 3. Đài TTDH
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'DAI_TTDH', 'Đài TTDH', 1, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Đài TTDH%' OR code = 'DAI_TTDH' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

-- 4. Đèn biển
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'DEN_BIEN', 'Đèn biển', 1, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Đèn biển%' OR code = 'DEN_BIEN' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

-- 5. Đê, kè
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'DE_KE', 'Đê, kè', 1, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Đê%' OR name ILIKE '%kè%' OR code = 'DE_KE' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

-- 6. Luồng hàng hải
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'LUONG_HH', 'Luồng hàng hải', 1, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Luồng%' OR code = 'LUONG_HH' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

-- 7. Phao, tiêu
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'PHAO_TIEU', 'Phao, tiêu', 1, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Phao%' OR name ILIKE '%tiêu%' OR code = 'PHAO_TIEU' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

-- 8. Vùng nước
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'VUNG_NUOC', 'Vùng nước', 1, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Vùng nước%' OR code = 'VUNG_NUOC' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

-- 9. Hệ thống VTS
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'HE_THONG_VTS', 'Hệ thống VTS', 1, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%VTS%' OR code = 'HE_THONG_VTS' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code) DO NOTHING;
