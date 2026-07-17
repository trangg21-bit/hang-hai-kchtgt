-- V55: Seed DeKe data for F-160 report (Biểu 13-N: Thống kê hệ thống đê, kè chắn sóng, chắn cát)
-- Requires: org_units table with root record, de_ke table
--
-- LoaiDe enum mapping:
--   1 = Đê chắn sóng (Sea dike / Breakwater)
--   2 = Đê chắn cát (Sand barrier dike)
--   3 = Kè hướng dòng (Flow-direction revetment)
--   4 = Kè bảo vệ bờ (Bank protection revetment)
--   5 = Giao thông (Traffic embankment)
--   6 = Kè chắn sóng (Wave-damping revetment)
--   7 = Kè chắn cát (Sand-damping revetment)
--
-- TinhTrang enum mapping:
--   1 = Chưa KT/VH (Not yet operation/maintenance)
--   2 = Đang KT/VH (In operation/maintenance)
--   3 = Dừng KT/VH (Stopped operation/maintenance)

DO $$
DECLARE
    v_root_org_id UUID;
BEGIN
    -- Get root org unit (the top-level org without a parent)
    SELECT id INTO v_root_org_id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1;

    IF v_root_org_id IS NULL THEN
        RAISE NOTICE 'No root org_unit found — skipping DeKe seed data';
        RETURN;
    END IF;

    -- =========================================================================
    -- Hải Phòng area (3 records)
    -- =========================================================================

    INSERT INTO de_ke (
        ten_de_ke, vi_tri, loai_de, chieu_dai, chieu_cao, cao_trinh_dinh,
        mat_vat_lieu, tinh_trang, ghi_chu,
        org_unit_id, trang_thai_phe_duyet, thoi_diem_dua_vao_khai_thac,
        phe_duyet_c1, nguoi_phe_duyet_c1, ngay_phe_duyet_c1,
        phe_duyet_c2, nguoi_phe_duyet_c2, ngay_phe_duyet_c2,
        is_deleted, created_at, updated_at, created_by, updated_by
    ) VALUES
    -- 1. Đê chắn sóng Cửa Cấm — loai_de: 1 (Đê chắn sóng)
    (
        'Đê chắn sóng Cửa Cấm',
        'Cửa Cấm, Hải Phòng',
        1, 850.0, 5.2, 3.5,
        'Bê tông cốt thép', '2',
        'Đê chắn sóng bảo vệ luồng vào cảng Cửa Cấm',
        v_root_org_id, 2, '2018-06-15',
        true, 'Nguyễn Văn An', '2026-01-05',
        true, 'Trần Thị Bình', '2026-01-10',
        false, '2025-01-10 08:00:00', '2026-01-15 10:00:00', 'admin', 'admin'
    ),
    -- 2. Kè bảo vệ bờ Đồ Sơn — loai_de: 4 (Kè bảo vệ bờ)
    (
        'Kè bảo vệ bờ Đồ Sơn',
        'Đồ Sơn, Hải Phòng',
        4, 1200.0, 4.8, 2.8,
        'Đá hộc xây', '2',
        'Kè bảo vệ bờ biển khu du lịch Đồ Sơn',
        v_root_org_id, 2, '2015-03-20',
        true, 'Nguyễn Văn An', '2026-01-05',
        true, 'Trần Thị Bình', '2026-01-10',
        false, '2025-01-10 08:00:00', '2026-02-20 09:30:00', 'admin', 'admin'
    ),
    -- 3. Đê chắn cát Cát Hải — loai_de: 2 (Đê chắn cát)
    (
        'Đê chắn cát Cát Hải',
        'Cát Hải, Hải Phòng',
        2, 620.0, 3.5, 1.8,
        'Đá đổ', '1',
        'Đê chắn cát bảo vệ bờ Tây đảo Cát Hải',
        v_root_org_id, 2, '2020-09-01',
        true, 'Nguyễn Văn An', '2026-01-05',
        true, 'Trần Thị Bình', '2026-01-10',
        false, '2025-01-10 08:00:00', '2026-03-25 14:15:00', 'admin', 'admin'
    ),

    -- =========================================================================
    -- Đà Nẵng area (3 records)
    -- =========================================================================

    -- 4. Kè chắn sóng Tiên Sa — loai_de: 6 (Kè chắn sóng)
    (
        'Kè chắn sóng Tiên Sa',
        'Cảng Tiên Sa, Đà Nẵng',
        6, 420.0, 6.0, 4.2,
        'Bê tông cốt thép', '2',
        'Kè chắn sóng bảo vệ cảng Tiên Sa, chịu được sóng cấp 8',
        v_root_org_id, 2, '2019-11-10',
        true, 'Lê Văn Cường', '2026-02-01',
        true, 'Phạm Thị Dung', '2026-02-05',
        false, '2025-02-01 08:00:00', '2026-04-10 11:00:00', 'admin', 'admin'
    ),
    -- 5. Kè hướng dòng Sông Hàn — loai_de: 3 (Kè hướng dòng)
    (
        'Kè hướng dòng Sông Hàn',
        'Sông Hàn, Đà Nẵng',
        3, 750.0, 3.2, 1.5,
        'Đá hộc xây', '2',
        'Kè hướng dòng ổn định luồng chảy Sông Hàn đoạn qua trung tâm thành phố',
        v_root_org_id, 2, '2017-07-25',
        true, 'Lê Văn Cường', '2026-02-01',
        true, 'Phạm Thị Dung', '2026-02-05',
        false, '2025-02-01 08:00:00', '2026-05-12 08:45:00', 'admin', 'admin'
    ),
    -- 6. Đê chắn sóng Liên Chiểu — loai_de: 1 (Đê chắn sóng)
    (
        'Đê chắn sóng Liên Chiểu',
        'Liên Chiểu, Đà Nẵng',
        1, 980.0, 5.5, 3.8,
        'Bê tông cốt thép', '1',
        'Đê chắn sóng khu vực cảng Liên Chiểu đang xây dựng',
        v_root_org_id, 2, '2021-02-14',
        true, 'Lê Văn Cường', '2026-02-01',
        true, 'Phạm Thị Dung', '2026-02-05',
        false, '2025-02-01 08:00:00', '2026-06-20 16:30:00', 'admin', 'admin'
    ),

    -- =========================================================================
    -- Vũng Tàu area (2 records)
    -- =========================================================================

    -- 7. Kè bảo vệ bờ Bãi Sau — loai_de: 4 (Kè bảo vệ bờ)
    (
        'Kè bảo vệ bờ Bãi Sau',
        'Bãi Sau, Vũng Tàu',
        4, 1800.0, 3.0, 1.2,
        'Đá hộc xây kết hợp bê tông', '2',
        'Kè bảo vệ bờ biển Bãi Sau dài nhất khu vực, kết hợp kè đá hộc và bê tông',
        v_root_org_id, 2, '2016-05-30',
        true, 'Hoàng Văn Em', '2026-03-01',
        true, 'Võ Thị Phương', '2026-03-05',
        false, '2025-03-01 08:00:00', '2026-07-08 10:00:00', 'admin', 'admin'
    ),
    -- 8. Đê chắn cát Cửa Lấp — loai_de: 2 (Đê chắn cát)
    (
        'Đê chắn cát Cửa Lấp',
        'Cửa Lấp, Vũng Tàu',
        2, 540.0, 4.0, 2.1,
        'Đá đổ', '3',
        'Đê chắn cát cửa sông Cửa Lấp, hiện đã dừng khai thác do bồi lắng',
        v_root_org_id, 2, '2014-08-12',
        true, 'Hoàng Văn Em', '2026-03-01',
        true, 'Võ Thị Phương', '2026-03-05',
        false, '2025-03-01 08:00:00', '2026-08-14 14:00:00', 'admin', 'admin'
    ),

    -- =========================================================================
    -- Quảng Ninh area (3 records)
    -- =========================================================================

    -- 9. Kè chắn sóng Cái Lân — loai_de: 6 (Kè chắn sóng)
    (
        'Kè chắn sóng Cái Lân',
        'Cảng Cái Lân, Hạ Long, Quảng Ninh',
        6, 560.0, 5.8, 4.0,
        'Bê tông cốt thép', '2',
        'Kè chắn sóng bảo vệ cảng nước sâu Cái Lân, Hạ Long',
        v_root_org_id, 2, '2018-12-20',
        true, 'Đỗ Văn Giang', '2026-04-01',
        true, 'Nguyễn Thị Hạnh', '2026-04-05',
        false, '2025-04-01 08:00:00', '2026-09-10 09:15:00', 'admin', 'admin'
    ),
    -- 10. Đê giao thông Tuần Châu — loai_de: 5 (Giao thông)
    (
        'Đê giao thông Tuần Châu',
        'Tuần Châu, Hạ Long, Quảng Ninh',
        5, 2100.0, 2.5, 1.0,
        'Bê tông nhựa', '2',
        'Đê giao thông nối đảo Tuần Châu với đất liền, kết hợp chắn sóng',
        v_root_org_id, 2, '2020-04-18',
        true, 'Đỗ Văn Giang', '2026-04-01',
        true, 'Nguyễn Thị Hạnh', '2026-04-05',
        false, '2025-04-01 08:00:00', '2026-10-05 11:30:00', 'admin', 'admin'
    ),
    -- 11. Kè chắn cát Móng Cái — loai_de: 7 (Kè chắn cát), cao_trinh_dinh negative
    (
        'Kè chắn cát Móng Cái',
        'Móng Cái, Quảng Ninh',
        7, 380.0, 3.8, -0.5,
        'Đá hộc xây', '1',
        'Kè chắn cát khu vực cửa khẩu Móng Cái, cao trình đỉnh thấp hơn mực nước biển',
        v_root_org_id, 2, '2022-01-10',
        true, 'Đỗ Văn Giang', '2026-04-01',
        true, 'Nguyễn Thị Hạnh', '2026-04-05',
        false, '2025-04-01 08:00:00', '2026-11-18 15:45:00', 'admin', 'admin'
    );

    RAISE NOTICE 'Seed data inserted: 11 de_ke records for F-160 report (4 provinces, all 7 loai_de types, all trang_thai_phe_duyet=2)';
END $$;
