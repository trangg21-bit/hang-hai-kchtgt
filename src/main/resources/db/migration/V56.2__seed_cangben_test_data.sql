-- V56: Seed test data for M-002 Cảng & Bến (H2-compatible)
-- Idempotent: uses MERGE for H2, ON CONFLICT for PostgreSQL
-- Run: automatically via Flyway on app restart

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cang_bien') THEN
    INSERT INTO cang_bien (id, ma_cang, ten_cang, tinh_thanh_pho, vi_do, kinh_do, dien_tich, kha_nang_tiep_nhan, trang_thai_hoat_dong, trang_thai_phe_duyet, org_unit_id, created_by, updated_by, created_at, updated_at)
    SELECT * FROM (
        SELECT 'a1000001-0000-0000-0000-000000000001', 'CB-0001', 'Cảng biển Hải Phòng',  'Hải Phòng',           20.859400, 106.681500, 2500.00, 5000000, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        UNION ALL
        SELECT 'a1000002-0000-0000-0000-000000000002', 'CB-0002', 'Cảng biển Vũng Tàu',    'Bà Rịa - Vũng Tàu',   10.345900, 107.084200, 1800.00, 3000000, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        UNION ALL
        SELECT 'a1000003-0000-0000-0000-000000000003', 'CB-0003', 'Cảng biển Đà Nẵng',     'Đà Nẵng',            16.071100, 108.223600, 1200.00, 2000000, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) AS v
    WHERE NOT EXISTS (SELECT 1 FROM cang_bien WHERE ma_cang = v.c1);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ben_cang') THEN
    INSERT INTO ben_cang (id, ma_ben, ten_ben, cang_bien_id, loai_ben, chieu_dai, chieu_rong, do_sau_luong, trang_thai_hoat_dong, trang_thai_phe_duyet, org_unit_id, vi_do, kinh_do, created_by, updated_by, created_at, updated_at)
    SELECT * FROM (
        SELECT 'b2000001-0000-0000-0000-000000000001', 'BC-HP-001', 'Bến cảng Chùa Vẽ',   'a1000001-0000-0000-0000-000000000001', 'BEN_CONTAINER', 200.00, 30.00, 12.50, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), 20.862000, 106.690000, '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        UNION ALL
        SELECT 'b2000002-0000-0000-0000-000000000002', 'BC-HP-002', 'Bến cảng Đình Vũ',   'a1000001-0000-0000-0000-000000000001', 'BEN_TONG_HOP',  350.00, 40.00, 14.00, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), 20.840000, 106.750000, '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        UNION ALL
        SELECT 'b2000003-0000-0000-0000-000000000003', 'BC-HP-003', 'Bến cảng Tân Vũ',    'a1000001-0000-0000-0000-000000000001', 'BEN_CONTAINER', 500.00, 50.00, 16.00, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), 20.830000, 106.770000, '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        UNION ALL
        SELECT 'b2000004-0000-0000-0000-000000000004', 'BC-VT-001', 'Bến cảng Cái Mép',   'a1000002-0000-0000-0000-000000000002', 'BEN_CONTAINER', 600.00, 60.00, 18.00, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), 10.350000, 107.080000, '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        UNION ALL
        SELECT 'b2000005-0000-0000-0000-000000000005', 'BC-DN-001', 'Bến cảng Tiên Sa',   'a1000003-0000-0000-0000-000000000003', 'BEN_TONG_HOP',  250.00, 35.00, 11.00, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), 16.120000, 108.230000, '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) AS v
    WHERE NOT EXISTS (SELECT 1 FROM ben_cang WHERE ma_ben = v.c1);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vung_nuoc') THEN
    INSERT INTO vung_nuoc (id, ma_vung_nuoc, ten_vung_nuoc, cang_bien_id, loai_vung_nuoc, dien_tich, do_sau_max, do_sau_trung_binh, trang_thai_hoat_dong, trang_thai_phe_duyet, org_unit_id, created_by, updated_by, created_at, updated_at)
    SELECT * FROM (
        SELECT 'c3000001-0000-0000-0000-000000000001', 'VN-HP-001', 'Khu neo đậu Hải Phòng',        'a1000001-0000-0000-0000-000000000001', 'NEO_DAU',       500.00, 15.00, 10.00, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        UNION ALL
        SELECT 'c3000002-0000-0000-0000-000000000002', 'VN-VT-001', 'Vùng quay trở tàu Vũng Tàu',    'a1000002-0000-0000-0000-000000000002', 'QUAY_TRO_TAU',  300.00, 20.00, 12.00, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        UNION ALL
        SELECT 'c3000003-0000-0000-0000-000000000003', 'VN-DN-001', 'Khu tránh trú bão Đà Nẵng',     'a1000003-0000-0000-0000-000000000003', 'TRANH_BAO',     800.00, 18.00,  8.00, 'HIEN_HANH', 'DUOC_PHE_DUYET', (SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1), '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) AS v
    WHERE NOT EXISTS (SELECT 1 FROM vung_nuoc WHERE ma_vung_nuoc = v.c1);
  END IF;
END $$;
