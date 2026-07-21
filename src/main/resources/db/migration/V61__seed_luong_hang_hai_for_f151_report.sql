-- V61: Seed LuongHangHai data for F-151 report (Biểu 04-N: Thống kê luồng hàng hải)
-- Requires: org_units table with root record, luong_hang_hai and chi_tiet_tuyen_luong tables

DO $$
DECLARE
    v_org_id UUID;
    v_lhh_id UUID;
BEGIN
    -- Get root org unit (the top-level org without a parent)
    SELECT id INTO v_org_id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE NOTICE 'No root org_unit found — skipping LuongHangHai seed data';
        RETURN;
    END IF;

    -- =========================================================================
    -- 1. Vạn Gia
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM luong_hang_hai WHERE ma_luong_hang_hai = 'CCHH-LHH-000001') THEN
        INSERT INTO luong_hang_hai (
            id, ten, ma_luong_hang_hai, tram_quan_ly_luong,
            so_luong_tram, so_luong_nhan_su_tai_tram,
            tinh_trang, org_unit_id, don_vi_van_hanh_id,
            trang_thai_phe_duyet,
            phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
            phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
            created_by, created_at, updated_by, updated_at, is_deleted
        ) VALUES (
            gen_random_uuid(), 'Vạn Gia', 'CCHH-LHH-000001',
            'Trạm quản lý báo hiệu luồng hàng hải Vạn Gia',
            1, 6,
            1, v_org_id, v_org_id,
            2,
            true, 'admin', '2026-06-01 08:00:00',
            true, 'admin', '2026-06-01 08:00:00',
            'admin', NOW(), 'admin', NOW(), false
        ) RETURNING id INTO v_lhh_id;

        INSERT INTO chi_tiet_tuyen_luong (
            id, luong_hang_hai_id, stt, ten,
            chieu_dai, rong_lon_nhat, do_sau_hien_tai,
            created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_lhh_id, 1,
            'Chiều dài từ hạ lưu phao số P1-300m đến phao số 11',
            10.4, 120, '-5.8',
            NOW(), NOW()
        );
    END IF;

    -- =========================================================================
    -- 2. Hòn Gai
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM luong_hang_hai WHERE ma_luong_hang_hai = 'CCHH-LHH-000002') THEN
        INSERT INTO luong_hang_hai (
            id, ten, ma_luong_hang_hai, tram_quan_ly_luong,
            so_luong_tram, so_luong_nhan_su_tai_tram,
            tinh_trang, org_unit_id, don_vi_van_hanh_id,
            trang_thai_phe_duyet,
            phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
            phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
            created_by, created_at, updated_by, updated_at, is_deleted
        ) VALUES (
            gen_random_uuid(), 'Hòn Gai', 'CCHH-LHH-000002',
            'Trạm quản lý báo hiệu luồng hàng hải Hòn Gai - Cái Lân',
            2, 19,
            1, v_org_id, v_org_id,
            2,
            true, 'admin', '2026-06-01 08:00:00',
            true, 'admin', '2026-06-01 08:00:00',
            'admin', NOW(), 'admin', NOW(), false
        ) RETURNING id INTO v_lhh_id;

        INSERT INTO chi_tiet_tuyen_luong (
            id, luong_hang_hai_id, stt, ten,
            chieu_dai, rong_lon_nhat, do_sau_hien_tai,
            created_at, updated_at
        ) VALUES
        (
            gen_random_uuid(), v_lhh_id, 1,
            'Đoạn phao 0 đến Hòn Pháo ngoài',
            11.3, 240, '-13',
            NOW(), NOW()
        ),
        (
            gen_random_uuid(), v_lhh_id, 2,
            'Đoạn Hòn Pháo ngoài đến Hòn Một',
            7, 130, '-12.3',
            NOW(), NOW()
        );
    END IF;

    -- =========================================================================
    -- 3. Hải Phòng
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM luong_hang_hai WHERE ma_luong_hang_hai = 'CCHH-LHH-000003') THEN
        INSERT INTO luong_hang_hai (
            id, ten, ma_luong_hang_hai, tram_quan_ly_luong,
            so_luong_tram, so_luong_nhan_su_tai_tram,
            tinh_trang, org_unit_id, don_vi_van_hanh_id,
            trang_thai_phe_duyet,
            phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
            phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
            created_by, created_at, updated_by, updated_at, is_deleted
        ) VALUES (
            gen_random_uuid(), 'Hải Phòng', 'CCHH-LHH-000003',
            'Trạm QLBHHH Hải Phòng',
            6, 87,
            1, v_org_id, v_org_id,
            2,
            true, 'admin', '2026-06-01 08:00:00',
            true, 'admin', '2026-06-01 08:00:00',
            'admin', NOW(), 'admin', NOW(), false
        ) RETURNING id INTO v_lhh_id;

        INSERT INTO chi_tiet_tuyen_luong (
            id, luong_hang_hai_id, stt, ten,
            chieu_dai, rong_lon_nhat, do_sau, mai_doc_thiet_ke, do_sau_hien_tai, khoi_luong_nao_vet,
            created_at, updated_at
        ) VALUES
        (
            gen_random_uuid(), v_lhh_id, 1,
            'Đoạn Lạch Huyện: Từ P0 đến P29,30',
            22.6, 160, -14, '1/15', '-13.4', 1772307,
            NOW(), NOW()
        ),
        (
            gen_random_uuid(), v_lhh_id, 2,
            'Đoạn kênh Hà Nam: Từ P29,30 đến P43,46',
            5.9, 80, -8.5, '1/7', '-8.2', 149035,
            NOW(), NOW()
        ),
        (
            gen_random_uuid(), v_lhh_id, 3,
            'Đoạn Bạch Đằng: Từ P43,46 đến ngã ba Đình Vũ',
            9.6, 80, -8.5, '1/15', '-8.3', 50432,
            NOW(), NOW()
        );
    END IF;

    -- =========================================================================
    -- 4. Đà Nẵng
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM luong_hang_hai WHERE ma_luong_hang_hai = 'CCHH-LHH-000004') THEN
        INSERT INTO luong_hang_hai (
            id, ten, ma_luong_hang_hai, tram_quan_ly_luong,
            so_luong_tram, so_luong_nhan_su_tai_tram,
            tinh_trang, org_unit_id, don_vi_van_hanh_id,
            trang_thai_phe_duyet,
            phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
            phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
            created_by, created_at, updated_by, updated_at, is_deleted
        ) VALUES (
            gen_random_uuid(), 'Đà Nẵng', 'CCHH-LHH-000004',
            'Trạm QLBHLHH Đà Nẵng',
            1, 16,
            1, v_org_id, v_org_id,
            2,
            true, 'admin', '2026-06-01 08:00:00',
            true, 'admin', '2026-06-01 08:00:00',
            'admin', NOW(), 'admin', NOW(), false
        ) RETURNING id INTO v_lhh_id;

        INSERT INTO chi_tiet_tuyen_luong (
            id, luong_hang_hai_id, stt, ten,
            chieu_dai, rong_lon_nhat, do_sau, mai_doc_thiet_ke, do_sau_hien_tai, cong_cong,
            created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_lhh_id, 1,
            'Đoạn từ phao số 0 đến hết cảng Tiên Sa',
            6.77, 110, -11, '1/10', '-11.5', true,
            NOW(), NOW()
        );
    END IF;

    -- =========================================================================
    -- 5. Vũng Tàu - Thị Vải
    -- =========================================================================
    IF NOT EXISTS (SELECT 1 FROM luong_hang_hai WHERE ma_luong_hang_hai = 'CCHH-LHH-000005') THEN
        INSERT INTO luong_hang_hai (
            id, ten, ma_luong_hang_hai, tram_quan_ly_luong,
            so_luong_tram, so_luong_nhan_su_tai_tram,
            tinh_trang, org_unit_id, don_vi_van_hanh_id,
            trang_thai_phe_duyet,
            phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
            phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
            created_by, created_at, updated_by, updated_at, is_deleted
        ) VALUES (
            gen_random_uuid(), 'Vũng Tàu - Thị Vải', 'CCHH-LHH-000005',
            'Gành Rái, Hội Bài, Cái Mép, Phú Mỹ',
            4, 44,
            1, v_org_id, v_org_id,
            2,
            true, 'admin', '2026-06-01 08:00:00',
            true, 'admin', '2026-06-01 08:00:00',
            'admin', NOW(), 'admin', NOW(), false
        ) RETURNING id INTO v_lhh_id;

        INSERT INTO chi_tiet_tuyen_luong (
            id, luong_hang_hai_id, stt, ten,
            chieu_dai, cong_cong,
            created_at, updated_at
        ) VALUES
        (
            gen_random_uuid(), v_lhh_id, 1,
            'Đoạn Cái Mép',
            9.1, true,
            NOW(), NOW()
        ),
        (
            gen_random_uuid(), v_lhh_id, 2,
            'Đoạn Gành Rái',
            14.4, true,
            NOW(), NOW()
        ),
        (
            gen_random_uuid(), v_lhh_id, 3,
            'Đoạn Hội Bài',
            17.8, true,
            NOW(), NOW()
        ),
        (
            gen_random_uuid(), v_lhh_id, 4,
            'Đoạn Phú Mỹ',
            12.9, true,
            NOW(), NOW()
        );
    END IF;

    RAISE NOTICE 'Seed data inserted: 5 LuongHangHai records with 11 ChiTietTuyenLuong children for F-151 report';
END $$;
