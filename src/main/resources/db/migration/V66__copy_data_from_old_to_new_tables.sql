-- V66: Copy data from old Vietnamese tables to already-existing new English tables
-- The new tables were created empty by Hibernate ddl-auto:update
-- The old tables still exist with data

-- 1. ports ← cang_bien
INSERT INTO ports (id, port_code, port_name, province, area, max_vessel_capacity,
    operational_status, approval_status, org_unit_id, port_group, map_symbol_id,
    spatial_id, detailed_location, port_class, coordinate_system, display_rule,
    water_area_scope, total_berths, total_anchorages_transshipment,
    total_public_channels, total_dedicated_channels,
    total_public_channel_length, total_dedicated_channel_length,
    total_buoys_beacons, total_dikes, total_dike_length, total_lighthouses,
    buoy_berth_count, anchorage_count, transshipment_count,
    other_water_areas, remarks, created_by, updated_by, created_at, updated_at, deleted_at, deleted_by)
SELECT id, ma_cang, ten_cang, tinh_thanh_pho, dien_tich, kha_nang_tiep_nhan,
    CAST(trang_thai_hoat_dong AS INTEGER), CAST(trang_thai_phe_duyet AS INTEGER),
    org_unit_id, nhom_cang_bien, bieu_tuong_id,
    spatial_id, dia_diem_chi_tiet, phan_cap, he_quy_chieu, quy_tac_hien_thi,
    pham_vi_vung_nuoc, tong_so_ben_cang, tong_so_khu_neo_dau_chuyen_tai,
    tong_so_tuyen_luong_cong_cong, tong_so_tuyen_luong_chuyen_dung,
    tong_chieu_dai_luong_cong_cong, tong_chieu_dai_luong_chuyen_dung,
    tong_so_phao_tieu_bao_hieu, tong_so_de_ke, tong_chieu_dai_de_ke, tong_so_den_bien_dang_tieu,
    so_luong_ben_phao, so_luong_khu_neo_dau, so_luong_khu_chuyen_tai,
    cac_khu_nuoc_khac, ghi_chu, created_by, updated_by, created_at, updated_at, deleted_at, NULL AS deleted_by
FROM cang_bien
ON CONFLICT (id) DO NOTHING;

-- 2. berths ← ben_cang
INSERT INTO berths (id, berth_code, berth_name, port_id, waterway, length, width,
    berth_type, channel_depth, operational_status, approval_status, org_unit_id,
    operational_function, map_symbol_id, spatial_id, location_code, detailed_location,
    coordinate_system, display_rule, operator, total_area, design_throughput,
    current_throughput, max_vessel_size, planned_throughput, latest_cargo_volume,
    opening_announcement_date, opening_decision, investment_agreement, structure_type,
    created_by, updated_by, created_at, updated_at, deleted_at, deleted_by)
SELECT id, ma_ben, ten_ben, cang_bien_id, tuyen_duong_thuy, chieu_dai, chieu_rong,
    CAST(loai_ben AS INTEGER), do_sau_luong,
    CAST(trang_thai_hoat_dong AS INTEGER), CAST(trang_thai_phe_duyet AS INTEGER),
    org_unit_id, cong_nang_khai_thac, bieu_tuong_id, spatial_id, dia_diem, dia_diem_chi_tiet,
    he_quy_chieu, quy_tac_hien_thi, don_vi_khai_thac, tong_dien_tich,
    nang_luc_thong_qua_thiet_ke, nang_luc_thong_qua_hien_trang, co_tau_tiep_nhan_lon_nhat,
    quy_hoach_nang_luc_thong_qua, san_luong_hang_hoa_nam_gan_nhat,
    thoi_diem_cong_bo_mo, quyet_dinh_cong_bo, van_ban_thoa_thuan_dau_tu,
    CAST(loai_ket_cau AS INTEGER),
    created_by, updated_by, created_at, updated_at, deleted_at, NULL AS deleted_by
FROM ben_cang
ON CONFLICT (id) DO NOTHING;

-- 3. piers ← cau_cang
INSERT INTO piers (id, pier_code, pier_name, berth_id, length, design_load, pier_type,
    operational_status, approval_status, org_unit_id, operational_function,
    map_symbol_id, spatial_id, created_by, updated_by, created_at, updated_at, deleted_at, deleted_by)
SELECT id, ma_cau, ten_cau, ben_cang_id, chieu_dai, tai_trong,
    CAST(loai_cau AS INTEGER),
    CAST(trang_thai_hoat_dong AS INTEGER), CAST(trang_thai_phe_duyet AS INTEGER),
    org_unit_id, cong_nang_khai_thac,
    bieu_tuong_id, spatial_id, created_by, updated_by, created_at, updated_at, deleted_at, NULL AS deleted_by
FROM cau_cang
ON CONFLICT (id) DO NOTHING;

-- 4. dry_ports ← cang_can
INSERT INTO dry_ports (id, dry_port_code, dry_port_name, province, area, teu_capacity,
    operational_status, approval_status, org_unit_id, map_symbol_id, spatial_id,
    created_by, updated_by, created_at, updated_at, deleted_at, deleted_by)
SELECT id, ma_cang_can, ten_cang_can, tinh_thanh_pho, dien_tich, cong_suat_teu,
    CAST(trang_thai_hoat_dong AS INTEGER), CAST(trang_thai_phe_duyet AS INTEGER),
    org_unit_id, bieu_tuong_id, spatial_id,
    created_by, updated_by, created_at, updated_at, deleted_at, NULL AS deleted_by
FROM cang_can
ON CONFLICT (id) DO NOTHING;

-- 5. water_zones ← vung_nuoc
INSERT INTO water_zones (id, water_zone_code, water_zone_name, port_id, area,
    max_depth, avg_depth, water_zone_type, operational_status, approval_status,
    org_unit_id, map_symbol_id, spatial_id,
    created_by, updated_by, created_at, updated_at, deleted_at, deleted_by)
SELECT id, ma_vung_nuoc, ten_vung_nuoc, cang_bien_id, dien_tich,
    do_sau_max, do_sau_trung_binh,
    CAST(loai_vung_nuoc AS INTEGER),
    CAST(trang_thai_hoat_dong AS INTEGER), CAST(trang_thai_phe_duyet AS INTEGER),
    org_unit_id, bieu_tuong_id, spatial_id,
    created_by, updated_by, created_at, updated_at, deleted_at, NULL AS deleted_by
FROM vung_nuoc
ON CONFLICT (id) DO NOTHING;

-- 6. documents ← giay_to
INSERT INTO documents (id, entity_type, entity_id, file_name, file_size,
    mime_type, storage_key, uploaded_by, created_by, updated_by,
    created_at, updated_at, deleted_at, deleted_by)
SELECT id, entity_type, entity_id, file_name, file_size,
    mime_type, minio_key, uploaded_by, created_by, updated_by,
    created_at, updated_at, deleted_at, NULL AS deleted_by
FROM giay_to
ON CONFLICT (id) DO NOTHING;

-- 7. change_logs ← lich_su_thay_doi
INSERT INTO change_logs (id, entity_type, entity_id, field_name,
    old_value, new_value, changed_by, changed_at, created_at)
SELECT id, entity_type, entity_id, field_name,
    old_value, new_value, changed_by, changed_at, created_at
FROM lich_su_thay_doi
ON CONFLICT (id) DO NOTHING;

-- 8. approval_logs ← phe_duyet_log
INSERT INTO approval_logs (id, entity_type, entity_id, decision,
    reason, decided_by, decided_at, created_at)
SELECT id, entity_type, entity_id, decision,
    reason, decided_by, decided_at, created_at
FROM phe_duyet_log
ON CONFLICT (id) DO NOTHING;
