-- V64: Rename KCHT management tables and columns from Vietnamese to English
-- This migration must run AFTER V63 (deleted_by column addition) and all Java entities have been renamed

-- ============================================================
-- 1. ports (was cang_bien)
-- ============================================================
ALTER TABLE cang_bien RENAME TO ports;
ALTER TABLE ports RENAME COLUMN ma_cang TO port_code;
ALTER TABLE ports RENAME COLUMN ten_cang TO port_name;
ALTER TABLE ports RENAME COLUMN tinh_thanh_pho TO province;
ALTER TABLE ports RENAME COLUMN dien_tich TO area;
ALTER TABLE ports RENAME COLUMN kha_nang_tiep_nhan TO max_vessel_capacity;
ALTER TABLE ports RENAME COLUMN trang_thai_hoat_dong TO operational_status;
ALTER TABLE ports RENAME COLUMN trang_thai_phe_duyet TO approval_status;
ALTER TABLE ports RENAME COLUMN nhom_cang_bien TO port_group;
ALTER TABLE ports RENAME COLUMN bieu_tuong_id TO map_symbol_id;
ALTER TABLE ports RENAME COLUMN dia_diem_chi_tiet TO detailed_location;
ALTER TABLE ports RENAME COLUMN phan_cap TO port_class;
ALTER TABLE ports RENAME COLUMN he_quy_chieu TO coordinate_system;
ALTER TABLE ports RENAME COLUMN quy_tac_hien_thi TO display_rule;
ALTER TABLE ports RENAME COLUMN pham_vi_vung_nuoc TO water_area_scope;
ALTER TABLE ports RENAME COLUMN tong_so_ben_cang TO total_berths;
ALTER TABLE ports RENAME COLUMN tong_so_khu_neo_dau_chuyen_tai TO total_anchorages_transshipment;
ALTER TABLE ports RENAME COLUMN tong_so_tuyen_luong_cong_cong TO total_public_channels;
ALTER TABLE ports RENAME COLUMN tong_so_tuyen_luong_chuyen_dung TO total_dedicated_channels;
ALTER TABLE ports RENAME COLUMN tong_chieu_dai_luong_cong_cong TO total_public_channel_length;
ALTER TABLE ports RENAME COLUMN tong_chieu_dai_luong_chuyen_dung TO total_dedicated_channel_length;
ALTER TABLE ports RENAME COLUMN tong_so_phao_tieu_bao_hieu TO total_buoys_beacons;
ALTER TABLE ports RENAME COLUMN tong_so_de_ke TO total_dikes;
ALTER TABLE ports RENAME COLUMN tong_chieu_dai_de_ke TO total_dike_length;
ALTER TABLE ports RENAME COLUMN tong_so_den_bien_dang_tieu TO total_lighthouses;
ALTER TABLE ports RENAME COLUMN so_luong_ben_phao TO buoy_berth_count;
ALTER TABLE ports RENAME COLUMN so_luong_khu_neo_dau TO anchorage_count;
ALTER TABLE ports RENAME COLUMN so_luong_khu_chuyen_tai TO transshipment_count;
ALTER TABLE ports RENAME COLUMN cac_khu_nuoc_khac TO other_water_areas;
ALTER TABLE ports RENAME COLUMN ghi_chu TO remarks;

-- Rename indexes
ALTER INDEX IF EXISTS idx_cang_bien_ma_cang RENAME TO idx_ports_port_code;
ALTER INDEX IF EXISTS idx_cang_bien_org_unit RENAME TO idx_ports_org_unit;
ALTER INDEX IF EXISTS idx_cang_bien_trang_thai_phe_duyet RENAME TO idx_ports_approval_status;
ALTER INDEX IF EXISTS idx_cang_bien_deleted RENAME TO idx_ports_deleted;

-- ============================================================
-- 2. berths (was ben_cang)
-- ============================================================
ALTER TABLE ben_cang RENAME TO berths;
ALTER TABLE berths RENAME COLUMN ma_ben TO berth_code;
ALTER TABLE berths RENAME COLUMN ten_ben TO berth_name;
ALTER TABLE berths RENAME COLUMN cang_bien_id TO port_id;
ALTER TABLE berths RENAME COLUMN tuyen_duong_thuy TO waterway;
ALTER TABLE berths RENAME COLUMN chieu_dai TO length;
ALTER TABLE berths RENAME COLUMN chieu_rong TO width;
ALTER TABLE berths RENAME COLUMN loai_ben TO berth_type;
ALTER TABLE berths RENAME COLUMN do_sau_luong TO channel_depth;
ALTER TABLE berths RENAME COLUMN cong_nang_khai_thac TO operational_function;
ALTER TABLE berths RENAME COLUMN don_vi_khai_thac TO operator;
ALTER TABLE berths RENAME COLUMN tong_dien_tich TO total_area;
ALTER TABLE berths RENAME COLUMN nang_luc_thong_qua_thiet_ke TO design_throughput;
ALTER TABLE berths RENAME COLUMN nang_luc_thong_qua_hien_trang TO current_throughput;
ALTER TABLE berths RENAME COLUMN co_tau_tiep_nhan_lon_nhat TO max_vessel_size;
ALTER TABLE berths RENAME COLUMN quy_hoach_nang_luc_thong_qua TO planned_throughput;
ALTER TABLE berths RENAME COLUMN san_luong_hang_hoa_nam_gan_nhat TO latest_cargo_volume;
ALTER TABLE berths RENAME COLUMN thoi_diem_cong_bo_mo TO opening_announcement_date;
ALTER TABLE berths RENAME COLUMN quyet_dinh_cong_bo TO opening_decision;
ALTER TABLE berths RENAME COLUMN van_ban_thoa_thuan_dau_tu TO investment_agreement;
ALTER TABLE berths RENAME COLUMN loai_ket_cau TO structure_type;
ALTER TABLE berths RENAME COLUMN dia_diem TO location_code;
ALTER TABLE berths RENAME COLUMN dia_diem_chi_tiet TO detailed_location;
ALTER TABLE berths RENAME COLUMN he_quy_chieu TO coordinate_system;
ALTER TABLE berths RENAME COLUMN quy_tac_hien_thi TO display_rule;
ALTER TABLE berths RENAME COLUMN trang_thai_hoat_dong TO operational_status;
ALTER TABLE berths RENAME COLUMN trang_thai_phe_duyet TO approval_status;
ALTER TABLE berths RENAME COLUMN bieu_tuong_id TO map_symbol_id;

ALTER INDEX IF EXISTS idx_ben_cang_ma_ben RENAME TO idx_berths_berth_code;
ALTER INDEX IF EXISTS idx_ben_cang_cang_bien RENAME TO idx_berths_port;
ALTER INDEX IF EXISTS idx_ben_cang_org_unit RENAME TO idx_berths_org_unit;
ALTER INDEX IF EXISTS idx_ben_cang_trang_thai_phe_duyet RENAME TO idx_berths_approval_status;
ALTER INDEX IF EXISTS idx_ben_cang_deleted RENAME TO idx_berths_deleted;

-- ============================================================
-- 3. piers (was cau_cang)
-- ============================================================
ALTER TABLE cau_cang RENAME TO piers;
ALTER TABLE piers RENAME COLUMN ma_cau TO pier_code;
ALTER TABLE piers RENAME COLUMN ten_cau TO pier_name;
ALTER TABLE piers RENAME COLUMN ben_cang_id TO berth_id;
ALTER TABLE piers RENAME COLUMN chieu_dai TO length;
ALTER TABLE piers RENAME COLUMN tai_trong TO design_load;
ALTER TABLE piers RENAME COLUMN loai_cau TO pier_type;
ALTER TABLE piers RENAME COLUMN cong_nang_khai_thac TO operational_function;
ALTER TABLE piers RENAME COLUMN trang_thai_hoat_dong TO operational_status;
ALTER TABLE piers RENAME COLUMN trang_thai_phe_duyet TO approval_status;
ALTER TABLE piers RENAME COLUMN bieu_tuong_id TO map_symbol_id;

ALTER INDEX IF EXISTS idx_cau_cang_ma_cau RENAME TO idx_piers_pier_code;
ALTER INDEX IF EXISTS idx_cau_cang_ben_cang RENAME TO idx_piers_berth;
ALTER INDEX IF EXISTS idx_cau_cang_org_unit RENAME TO idx_piers_org_unit;
ALTER INDEX IF EXISTS idx_cau_cang_trang_thai_phe_duyet RENAME TO idx_piers_approval_status;
ALTER INDEX IF EXISTS idx_cau_cang_deleted RENAME TO idx_piers_deleted;

-- ============================================================
-- 4. dry_ports (was cang_can)
-- ============================================================
ALTER TABLE cang_can RENAME TO dry_ports;
ALTER TABLE dry_ports RENAME COLUMN ma_cang_can TO dry_port_code;
ALTER TABLE dry_ports RENAME COLUMN ten_cang_can TO dry_port_name;
ALTER TABLE dry_ports RENAME COLUMN tinh_thanh_pho TO province;
ALTER TABLE dry_ports RENAME COLUMN dien_tich TO area;
ALTER TABLE dry_ports RENAME COLUMN cong_suat_teu TO teu_capacity;
ALTER TABLE dry_ports RENAME COLUMN trang_thai_hoat_dong TO operational_status;
ALTER TABLE dry_ports RENAME COLUMN trang_thai_phe_duyet TO approval_status;
ALTER TABLE dry_ports RENAME COLUMN bieu_tuong_id TO map_symbol_id;

-- ============================================================
-- 5. water_zones (was vung_nuoc)
-- ============================================================
ALTER TABLE vung_nuoc RENAME TO water_zones;
ALTER TABLE water_zones RENAME COLUMN ma_vung_nuoc TO water_zone_code;
ALTER TABLE water_zones RENAME COLUMN ten_vung_nuoc TO water_zone_name;
ALTER TABLE water_zones RENAME COLUMN cang_bien_id TO port_id;
ALTER TABLE water_zones RENAME COLUMN dien_tich TO area;
ALTER TABLE water_zones RENAME COLUMN do_sau_max TO max_depth;
ALTER TABLE water_zones RENAME COLUMN do_sau_trung_binh TO avg_depth;
ALTER TABLE water_zones RENAME COLUMN loai_vung_nuoc TO water_zone_type;
ALTER TABLE water_zones RENAME COLUMN trang_thai_hoat_dong TO operational_status;
ALTER TABLE water_zones RENAME COLUMN trang_thai_phe_duyet TO approval_status;
ALTER TABLE water_zones RENAME COLUMN bieu_tuong_id TO map_symbol_id;

ALTER INDEX IF EXISTS idx_vung_nuoc_ma_vung_nuoc RENAME TO idx_water_zones_code;
ALTER INDEX IF EXISTS idx_vung_nuoc_cang_bien RENAME TO idx_water_zones_port;
ALTER INDEX IF EXISTS idx_vung_nuoc_org_unit RENAME TO idx_water_zones_org_unit;
ALTER INDEX IF EXISTS idx_vung_nuoc_trang_thai_phe_duyet RENAME TO idx_water_zones_approval_status;
ALTER INDEX IF EXISTS idx_vung_nuoc_deleted RENAME TO idx_water_zones_deleted;

-- ============================================================
-- 6. documents (was giay_to)
-- ============================================================
ALTER TABLE giay_to RENAME TO documents;
ALTER TABLE documents RENAME COLUMN minio_key TO storage_key;

ALTER INDEX IF EXISTS idx_giay_to_entity RENAME TO idx_documents_entity;
ALTER INDEX IF EXISTS idx_giay_to_uploaded_by RENAME TO idx_documents_uploaded_by;
ALTER INDEX IF EXISTS idx_giay_to_created_at RENAME TO idx_documents_created_at;

-- ============================================================
-- 7. change_logs (was lich_su_thay_doi)
-- ============================================================
ALTER TABLE lich_su_thay_doi RENAME TO change_logs;

ALTER INDEX IF EXISTS idx_lich_su_thay_doi_entity RENAME TO idx_change_logs_entity;
ALTER INDEX IF EXISTS idx_lich_su_thay_doi_changed_at RENAME TO idx_change_logs_changed_at;
ALTER INDEX IF EXISTS idx_lich_su_thay_doi_changed_by RENAME TO idx_change_logs_changed_by;

-- ============================================================
-- 8. approval_logs (was phe_duyet_log)
-- ============================================================
ALTER TABLE phe_duyet_log RENAME TO approval_logs;

ALTER INDEX IF EXISTS idx_phe_duyet_log_entity RENAME TO idx_approval_logs_entity;
ALTER INDEX IF EXISTS idx_phe_duyet_log_decided_at RENAME TO idx_approval_logs_decided_at;
ALTER INDEX IF EXISTS idx_phe_duyet_log_decided_by RENAME TO idx_approval_logs_decided_by;
