-- V67: Insert Spatial Object Categories for Lines (2) and Polygons (3)

-- =====================================
-- LINES (geometry_type = 2)
-- =====================================
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'BEN_CANG', 'Bến cảng, cầu cảng', 2, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Bến cảng%' OR code = 'BEN_CANG' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'CANG_BIEN', 'Cảng biển', 2, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Cảng biển%' OR code = 'CANG_BIEN' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'DAI_TTDH', 'Đài TTDH', 2, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Đài TTDH%' OR code = 'DAI_TTDH' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'DEN_BIEN', 'Đèn biển', 2, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Đèn biển%' OR code = 'DEN_BIEN' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'DE_KE', 'Đê, kè', 2, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Đê%' OR name ILIKE '%kè%' OR code = 'DE_KE' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'LUONG_HH', 'Luồng hàng hải', 2, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Luồng%' OR code = 'LUONG_HH' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'PHAO_TIEU', 'Phao, tiêu', 2, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Phao%' OR name ILIKE '%tiêu%' OR code = 'PHAO_TIEU' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'VUNG_NUOC', 'Vùng nước', 2, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Vùng nước%' OR code = 'VUNG_NUOC' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'HE_THONG_VTS', 'Hệ thống VTS', 2, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%VTS%' OR code = 'HE_THONG_VTS' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

-- =====================================
-- POLYGONS (geometry_type = 3)
-- =====================================
INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'BEN_CANG', 'Bến cảng, cầu cảng', 3, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Bến cảng%' OR code = 'BEN_CANG' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'CANG_BIEN', 'Cảng biển', 3, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Cảng biển%' OR code = 'CANG_BIEN' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'DAI_TTDH', 'Đài TTDH', 3, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Đài TTDH%' OR code = 'DAI_TTDH' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'DEN_BIEN', 'Đèn biển', 3, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Đèn biển%' OR code = 'DEN_BIEN' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'DE_KE', 'Đê, kè', 3, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Đê%' OR name ILIKE '%kè%' OR code = 'DE_KE' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'LUONG_HH', 'Luồng hàng hải', 3, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Luồng%' OR code = 'LUONG_HH' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'PHAO_TIEU', 'Phao, tiêu', 3, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Phao%' OR name ILIKE '%tiêu%' OR code = 'PHAO_TIEU' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'VUNG_NUOC', 'Vùng nước', 3, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%Vùng nước%' OR code = 'VUNG_NUOC' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;

INSERT INTO spatial_object_categories (id, code, name, geometry_type, icon_id, status, created_at, created_by, updated_at, updated_by)
VALUES (gen_random_uuid(), 'HE_THONG_VTS', 'Hệ thống VTS', 3, 
        (SELECT id FROM map_symbols WHERE name ILIKE '%VTS%' OR code = 'HE_THONG_VTS' LIMIT 1), 
        1, CURRENT_TIMESTAMP, 'SYSTEM', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (code, geometry_type) DO NOTHING;
