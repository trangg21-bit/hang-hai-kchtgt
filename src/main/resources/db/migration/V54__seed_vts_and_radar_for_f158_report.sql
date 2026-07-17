-- V54: Seed VTS and Radar data for F-158 report (Biểu 11-N: Thống kê hệ thống VTS)
-- Requires: org_units table with root record, he_thong_vts and tram_radar tables

DO $$
DECLARE
    v_root_org_id UUID;
    v_vts_hp_id BIGINT;
    v_vts_vt_id BIGINT;
    v_vts_dn_id BIGINT;
    v_vts_hcm_id BIGINT;
BEGIN
    -- Get root org unit (the top-level org without a parent)
    SELECT id INTO v_root_org_id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1;

    IF v_root_org_id IS NULL THEN
        RAISE NOTICE 'No root org_unit found — skipping VTS/Radar seed data';
        RETURN;
    END IF;

    -- =========================================================================
    -- VTS 1: Hệ thống VTS Hải Phòng
    -- =========================================================================
    INSERT INTO he_thong_vts (
        ten_he_thong, vi_tri, tinh_trang, pham_vi_ap_dung,
        org_unit_id, trang_thai,
        phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
        phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
        nguoi_tao, ngay_tao, nguoi_sua_doi, ngay_sua_doi, is_deleted
    ) VALUES (
        'Hệ thống VTS Hải Phòng',
        'Trung tâm điều hành cảng Hải Phòng, số 1 đường Ngô Quyền, Hải Phòng',
        1, 'Vùng biển Hải Phòng, Quảng Ninh, bán kính 30 hải lý',
        v_root_org_id, 3,
        true, 'admin', '2026-03-10 10:00:00',
        true, 'admin', '2026-03-10 10:00:00',
        'admin', '2025-01-15 08:00:00', 'admin', '2026-03-10 10:00:00', false
    ) RETURNING id INTO v_vts_hp_id;

    INSERT INTO tram_radar (
        ten_tram, vi_tri, kinh_do, vi_do,
        loai_tram, tinh_trang,
        org_unit_id, trang_thai,
        phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
        phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
        nguoi_tao, ngay_tao, nguoi_sua_doi, ngay_sua_doi, is_deleted,
        he_thong_vts_id, chieu_cao_thap_radar, tam_hieu_luc_radar
    ) VALUES
    (
        'Trạm Radar Hòn Dáu',
        'Đảo Hòn Dáu, Đồ Sơn, Hải Phòng',
        106.816667, 20.666667,
        'Trạm chính', '1',
        v_root_org_id, 2,
        true, 'admin', '2026-03-15 10:00:00',
        true, 'admin', '2026-03-15 10:00:00',
        'admin', '2025-01-20 08:00:00', 'admin', '2026-03-15 10:00:00', false,
        v_vts_hp_id, 85.5, 24
    ),
    (
        'Trạm Radar Cát Hải',
        'Đảo Cát Hải, Hải Phòng',
        106.850000, 20.800000,
        'Trạm phụ', '1',
        v_root_org_id, 2,
        true, 'admin', '2026-03-15 10:00:00',
        true, 'admin', '2026-03-15 10:00:00',
        'admin', '2025-01-25 08:00:00', 'admin', '2026-03-15 10:00:00', false,
        v_vts_hp_id, 65.0, 18
    );

    -- =========================================================================
    -- VTS 2: Hệ thống VTS Vũng Tàu
    -- =========================================================================
    INSERT INTO he_thong_vts (
        ten_he_thong, vi_tri, tinh_trang, pham_vi_ap_dung,
        org_unit_id, trang_thai,
        phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
        phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
        nguoi_tao, ngay_tao, nguoi_sua_doi, ngay_sua_doi, is_deleted
    ) VALUES (
        'Hệ thống VTS Vũng Tàu',
        'Trung tâm điều hành cảng Vũng Tàu, số 5 đường Hạ Long, Vũng Tàu',
        1, 'Vùng biển Vũng Tàu, luồng Sài Gòn - Vũng Tàu, bán kính 40 hải lý',
        v_root_org_id, 3,
        true, 'admin', '2026-04-15 14:00:00',
        true, 'admin', '2026-04-15 14:00:00',
        'admin', '2025-02-20 08:00:00', 'admin', '2026-04-15 14:00:00', false
    ) RETURNING id INTO v_vts_vt_id;

    INSERT INTO tram_radar (
        ten_tram, vi_tri, kinh_do, vi_do,
        loai_tram, tinh_trang,
        org_unit_id, trang_thai,
        phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
        phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
        nguoi_tao, ngay_tao, nguoi_sua_doi, ngay_sua_doi, is_deleted,
        he_thong_vts_id, chieu_cao_thap_radar, tam_hieu_luc_radar
    ) VALUES
    (
        'Trạm Radar Núi Lớn',
        'Núi Lớn, Vũng Tàu',
        107.083333, 10.333333,
        'Trạm chính', '1',
        v_root_org_id, 2,
        true, 'admin', '2026-04-20 14:00:00',
        true, 'admin', '2026-04-20 14:00:00',
        'admin', '2025-03-01 08:00:00', 'admin', '2026-04-20 14:00:00', false,
        v_vts_vt_id, 120.0, 36
    ),
    (
        'Trạm Radar Cần Giờ',
        'Cần Giờ, TP.HCM',
        106.950000, 10.400000,
        'Trạm phụ', '2',
        v_root_org_id, 2,
        true, 'admin', '2026-04-20 14:00:00',
        true, 'admin', '2026-04-20 14:00:00',
        'admin', '2025-03-05 08:00:00', 'admin', '2026-04-20 14:00:00', false,
        v_vts_vt_id, 95.0, 30
    );

    -- =========================================================================
    -- VTS 3: Hệ thống VTS Đà Nẵng
    -- =========================================================================
    INSERT INTO he_thong_vts (
        ten_he_thong, vi_tri, tinh_trang, pham_vi_ap_dung,
        org_unit_id, trang_thai,
        phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
        phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
        nguoi_tao, ngay_tao, nguoi_sua_doi, ngay_sua_doi, is_deleted
    ) VALUES (
        'Hệ thống VTS Đà Nẵng',
        'Trung tâm điều hành cảng Tiên Sa, Đà Nẵng',
        1, 'Vùng biển Đà Nẵng, bán kính 25 hải lý',
        v_root_org_id, 3,
        true, 'admin', '2026-05-20 09:00:00',
        true, 'admin', '2026-05-20 09:00:00',
        'admin', '2025-03-10 08:00:00', 'admin', '2026-05-20 09:00:00', false
    ) RETURNING id INTO v_vts_dn_id;

    INSERT INTO tram_radar (
        ten_tram, vi_tri, kinh_do, vi_do,
        loai_tram, tinh_trang,
        org_unit_id, trang_thai,
        phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
        phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
        nguoi_tao, ngay_tao, nguoi_sua_doi, ngay_sua_doi, is_deleted,
        he_thong_vts_id, chieu_cao_thap_radar, tam_hieu_luc_radar
    ) VALUES
    (
        'Trạm Radar Sơn Trà',
        'Bán đảo Sơn Trà, Đà Nẵng',
        108.283333, 16.100000,
        'Trạm chính', '1',
        v_root_org_id, 2,
        true, 'admin', '2026-05-25 09:00:00',
        true, 'admin', '2026-05-25 09:00:00',
        'admin', '2025-03-20 08:00:00', 'admin', '2026-05-25 09:00:00', false,
        v_vts_dn_id, 72.0, 24
    ),
    (
        'Trạm Radar Hải Vân',
        'Đèo Hải Vân, Đà Nẵng',
        108.133333, 16.200000,
        'Trạm phụ', '1',
        v_root_org_id, 2,
        true, 'admin', '2026-05-25 09:00:00',
        true, 'admin', '2026-05-25 09:00:00',
        'admin', '2025-03-25 08:00:00', 'admin', '2026-05-25 09:00:00', false,
        v_vts_dn_id, 55.0, 18
    );

    -- =========================================================================
    -- VTS 4: Hệ thống VTS TP. Hồ Chí Minh
    -- =========================================================================
    INSERT INTO he_thong_vts (
        ten_he_thong, vi_tri, tinh_trang, pham_vi_ap_dung,
        org_unit_id, trang_thai,
        phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
        phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
        nguoi_tao, ngay_tao, nguoi_sua_doi, ngay_sua_doi, is_deleted
    ) VALUES (
        'Hệ thống VTS TP. Hồ Chí Minh',
        'Trung tâm điều hành cảng Sài Gòn, TP. Hồ Chí Minh',
        2, 'Luồng Soài Rạp, luồng Lòng Tàu, bán kính 20 hải lý',
        v_root_org_id, 3,
        true, 'admin', '2026-02-28 16:00:00',
        true, 'admin', '2026-02-28 16:00:00',
        'admin', '2024-11-01 08:00:00', 'admin', '2026-02-28 16:00:00', false
    ) RETURNING id INTO v_vts_hcm_id;

    INSERT INTO tram_radar (
        ten_tram, vi_tri, kinh_do, vi_do,
        loai_tram, tinh_trang,
        org_unit_id, trang_thai,
        phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
        phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
        nguoi_tao, ngay_tao, nguoi_sua_doi, ngay_sua_doi, is_deleted,
        he_thong_vts_id, chieu_cao_thap_radar, tam_hieu_luc_radar
    ) VALUES
    (
        'Trạm Radar Nhà Bè',
        'Nhà Bè, TP.HCM',
        106.733333, 10.683333,
        'Trạm chính', '2',
        v_root_org_id, 2,
        true, 'admin', '2026-03-05 16:00:00',
        true, 'admin', '2026-03-05 16:00:00',
        'admin', '2024-11-10 08:00:00', 'admin', '2026-03-05 16:00:00', false,
        v_vts_hcm_id, 60.0, 20
    ),
    (
        'Trạm Radar Cần Giờ 2',
        'Cần Giờ, TP.HCM',
        106.900000, 10.450000,
        'Trạm phụ', '1',
        v_root_org_id, 2,
        true, 'admin', '2026-03-05 16:00:00',
        true, 'admin', '2026-03-05 16:00:00',
        'admin', '2024-11-15 08:00:00', 'admin', '2026-03-05 16:00:00', false,
        v_vts_hcm_id, 48.0, 15
    );

    RAISE NOTICE 'Seed data inserted: 4 VTS systems and 8 radar stations for F-158 report';
END $$;
