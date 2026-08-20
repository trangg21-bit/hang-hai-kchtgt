package com.hanghai.kchtg.seeder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationSync implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("ðŸ”„ Checking and migrating database tables from Vietnamese to English schema...");

        // 1. ports <- cang_bien
        trySyncTable("ports", "cang_bien",
            "INSERT INTO ports (id, port_code, port_name, provinceId, area, max_vessel_capacity, " +
            "    operational_status, approval_status, org_unit_id, port_group, map_symbol_id, " +
            "    spatial_id, detailed_location, port_class, coordinate_system, display_rule, " +
            "    water_area_scope, total_berths, total_anchorages_transshipment, " +
            "    total_public_channels, total_dedicated_channels, " +
            "    total_public_channel_length, total_dedicated_channel_length, " +
            "    total_buoys_beacons, total_dikes, total_dike_length, total_lighthouses, " +
            "    buoy_berth_count, anchorage_count, transshipment_count, " +
            "    other_water_areas, remarks, created_by, updated_by, created_at, updated_at, deleted_at, deleted_by) " +
            "SELECT id, ma_cang, ten_cang, tinh_thanh_pho, dien_tich, kha_nang_tiep_nhan, " +
            "    CASE WHEN trang_thai_hoat_dong IS NOT NULL THEN CAST(trang_thai_hoat_dong AS INTEGER) END, " +
            "    CASE WHEN trang_thai_phe_duyet IS NOT NULL THEN CAST(trang_thai_phe_duyet AS INTEGER) END, " +
            "    org_unit_id, nhom_cang_bien, bieu_tuong_id, " +
            "    spatial_id, dia_diem_chi_tiet, phan_cap, he_quy_chieu, quy_tac_hien_thi, " +
            "    pham_vi_vung_nuoc, tong_so_ben_cang, tong_so_khu_neo_dau_chuyen_tai, " +
            "    tong_so_tuyen_luong_cong_cong, tong_so_tuyen_luong_chuyen_dung, " +
            "    tong_chieu_dai_luong_cong_cong, tong_chieu_dai_luong_chuyen_dung, " +
            "    tong_so_phao_tieu_bao_hieu, tong_so_de_ke, tong_chieu_dai_de_ke, tong_so_den_bien_dang_tieu, " +
            "    so_luong_ben_phao, so_luong_khu_neo_dau, so_luong_khu_chuyen_tai, " +
            "    cac_khu_nuoc_khac, ghi_chu, created_by, updated_by, created_at, updated_at, deleted_at, deleted_by " +
            "FROM cang_bien " +
            "ON CONFLICT (id) DO NOTHING"
        );

        // 2. berths <- ben_cang
        trySyncTable("berths", "ben_cang",
            "INSERT INTO berths (id, berth_code, berth_name, port_id, waterway, length, width, " +
            "    berth_type, channel_depth, operational_status, approval_status, org_unit_id, " +
            "    operational_function, map_symbol_id, spatial_id, location_code, detailed_location, " +
            "    coordinate_system, display_rule, operator, total_area, design_throughput, " +
            "    current_throughput, max_vessel_size, planned_throughput, latest_cargo_volume, " +
            "    opening_announcement_date, opening_decision, investment_agreement, structure_type, " +
            "    created_by, updated_by, created_at, updated_at, deleted_at, deleted_by) " +
            "SELECT id, ma_ben, ten_ben, cang_bien_id, tuyen_duong_thuy, chieu_dai, chieu_rong, " +
            "    CASE WHEN loai_ben IS NOT NULL THEN CAST(loai_ben AS INTEGER) END, " +
            "    do_sau_luong, " +
            "    CASE WHEN trang_thai_hoat_dong IS NOT NULL THEN CAST(trang_thai_hoat_dong AS INTEGER) END, " +
            "    CASE WHEN trang_thai_phe_duyet IS NOT NULL THEN CAST(trang_thai_phe_duyet AS INTEGER) END, " +
            "    org_unit_id, cong_nang_khai_thac, bieu_tuong_id, spatial_id, dia_diem, dia_diem_chi_tiet, " +
            "    he_quy_chieu, quy_tac_hien_thi, don_vi_khai_thac, tong_dien_tich, " +
            "    nang_luc_thong_qua_thiet_ke, nang_luc_thong_qua_hien_trang, co_tau_tiep_nhan_lon_nhat, " +
            "    quy_hoach_nang_luc_thong_qua, san_luong_hang_hoa_nam_gan_nhat, " +
            "    thoi_diem_cong_bo_mo, quyet_dinh_cong_bo, van_ban_thoa_thuan_dau_tu, " +
            "    CASE WHEN loai_ket_cau IS NOT NULL THEN CAST(loai_ket_cau AS INTEGER) END, " +
            "    created_by, updated_by, created_at, updated_at, deleted_at, deleted_by " +
            "FROM ben_cang " +
            "ON CONFLICT (id) DO NOTHING"
        );

        // 3. piers <- cau_cang
        trySyncTable("piers", "cau_cang",
            "INSERT INTO piers (id, pier_code, pier_name, berth_id, length, design_load, pier_type, " +
            "    operational_status, approval_status, org_unit_id, operational_function, " +
            "    map_symbol_id, spatial_id, created_by, updated_by, created_at, updated_at, deleted_at, deleted_by) " +
            "SELECT id, ma_cau, ten_cau, ben_cang_id, chieu_dai, tai_trong, " +
            "    CASE WHEN loai_cau IS NOT NULL THEN CAST(loai_cau AS INTEGER) END, " +
            "    CASE WHEN trang_thai_hoat_dong IS NOT NULL THEN CAST(trang_thai_hoat_dong AS INTEGER) END, " +
            "    CASE WHEN trang_thai_phe_duyet IS NOT NULL THEN CAST(trang_thai_phe_duyet AS INTEGER) END, " +
            "    org_unit_id, cong_nang_khai_thac, " +
            "    bieu_tuong_id, spatial_id, created_by, updated_by, created_at, updated_at, deleted_at, deleted_by " +
            "FROM cau_cang " +
            "ON CONFLICT (id) DO NOTHING"
        );

        // 4. dry_ports <- cang_can
        trySyncTable("dry_ports", "cang_can",
            "INSERT INTO dry_ports (id, dry_port_code, dry_port_name, provinceId, area, teu_capacity, " +
            "    operational_status, approval_status, org_unit_id, map_symbol_id, spatial_id, " +
            "    created_by, updated_by, created_at, updated_at, deleted_at, deleted_by) " +
            "SELECT id, ma_cang_can, ten_cang_can, tinh_thanh_pho, dien_tich, cong_suat_teu, " +
            "    CASE WHEN trang_thai_hoat_dong IS NOT NULL THEN CAST(trang_thai_hoat_dong AS INTEGER) END, " +
            "    CASE WHEN trang_thai_phe_duyet IS NOT NULL THEN CAST(trang_thai_phe_duyet AS INTEGER) END, " +
            "    org_unit_id, bieu_tuong_id, spatial_id, " +
            "    created_by, updated_by, created_at, updated_at, deleted_at, deleted_by " +
            "FROM cang_can " +
            "ON CONFLICT (id) DO NOTHING"
        );

        // 5. water_zones <- vung_nuoc
        trySyncTable("water_zones", "vung_nuoc",
            "INSERT INTO water_zones (id, water_zone_code, water_zone_name, port_id, area, " +
            "    max_depth, avg_depth, water_zone_type, operational_status, approval_status, " +
            "    org_unit_id, map_symbol_id, spatial_id, " +
            "    created_by, updated_by, created_at, updated_at, deleted_at, deleted_by) " +
            "SELECT id, ma_vung_nuoc, ten_vung_nuoc, cang_bien_id, dien_tich, " +
            "    do_sau_max, do_sau_trung_binh, " +
            "    CASE WHEN loai_vung_nuoc IS NOT NULL THEN CAST(loai_vung_nuoc AS INTEGER) END, " +
            "    CASE WHEN trang_thai_hoat_dong IS NOT NULL THEN CAST(trang_thai_hoat_dong AS INTEGER) END, " +
            "    CASE WHEN trang_thai_phe_duyet IS NOT NULL THEN CAST(trang_thai_phe_duyet AS INTEGER) END, " +
            "    org_unit_id, bieu_tuong_id, spatial_id, " +
            "    created_by, updated_by, created_at, updated_at, deleted_at, deleted_by " +
            "FROM vung_nuoc " +
            "ON CONFLICT (id) DO NOTHING"
        );

        // 6. dike_revetment <- de_ke
        trySyncTable("dike_revetment", "de_ke",
            "INSERT INTO dike_revetment (id, dike_revetment_name, location, height, length, width, " +
            "    crest_elevation, dike_revetment_type, surface_material, status, commissioning_date, " +
            "    note, rejection_reason, approval_status, is_approved_level1, is_approved_level2, " +
            "    approver_level1, approver_level2, approved_date_level1, approved_date_level2, " +
            "    created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, org_unit_id, spatial_id) " +
            "SELECT id, ten_de_ke, vi_tri, chieu_cao, chieu_dai, chieu_rong, " +
            "    cao_trinh_dinh, CASE WHEN loai_de IS NOT NULL THEN CAST(loai_de AS INTEGER) END, " +
            "    mat_vat_lieu, tinh_trang, thoi_diem_dua_vao_khai_thac, " +
            "    ghi_chu, ly_do_REJECTED, CASE WHEN trang_thai_phe_duyet IS NOT NULL THEN CAST(trang_thai_phe_duyet AS INTEGER) END, " +
            "    phe_duyet_c1, phe_duyet_c2, nguoi_phe_duyet_c1, nguoi_phe_duyet_c2, ngay_phe_duyet_c1, ngay_phe_duyet_c2, " +
            "    created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, don_vi_id, spatial_id " +
            "FROM de_ke " +
            "ON CONFLICT (id) DO NOTHING"
        );

        // 7. documents <- giay_to
        trySyncTable("documents", "giay_to",
            "INSERT INTO documents (id, entity_type, entity_id, file_name, file_size, " +
            "    mime_type, storage_key, uploaded_by, created_by, updated_by, " +
            "    created_at, updated_at, deleted_at, deleted_by) " +
            "SELECT id, entity_type, entity_id, file_name, file_size, " +
            "    mime_type, minio_key, uploaded_by, created_by, updated_by, " +
            "    created_at, updated_at, deleted_at, deleted_by " +
            "FROM giay_to " +
            "ON CONFLICT (id) DO NOTHING"
        );

        // 8. change_logs <- lich_su_thay_doi
        trySyncTable("change_logs", "lich_su_thay_doi",
            "INSERT INTO change_logs (id, entity_type, entity_id, field_name, " +
            "    old_value, new_value, changed_by, changed_at, created_at, deleted_by) " +
            "SELECT id, entity_type, entity_id, field_name, " +
            "    old_value, new_value, changed_by, changed_at, created_at, deleted_by " +
            "FROM lich_su_thay_doi " +
            "ON CONFLICT (id) DO NOTHING"
        );

        // 9. approval_logs <- phe_duyet_log
        trySyncTable("approval_logs", "phe_duyet_log",
            "INSERT INTO approval_logs (id, entity_type, entity_id, decision, " +
            "    reason, decided_by, decided_at, created_at, deleted_by) " +
            "SELECT id, entity_type, entity_id, decision, " +
            "    reason, decided_by, decided_at, created_at, deleted_by " +
            "FROM phe_duyet_log " +
            "ON CONFLICT (id) DO NOTHING"
        );

        // 10. approval_history <- legal_document_history
        try {
            jdbcTemplate.execute("ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_ref_type_check");
            jdbcTemplate.execute("ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_status_check");
            jdbcTemplate.execute("ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_approval_level_check");
        } catch (Exception ignored) {
        }
        trySyncAndDropTable("approval_history", "legal_document_history",
            "INSERT INTO approval_history (id, ref_id, ref_type, approval_level, status, " +
            "    approved_by, approved_date, reason, changed_field, previous_value, new_value) " +
            "SELECT COALESCE(id, gen_random_uuid()), legal_document_id, 23, 0, " +
            "    CASE " +
            "        WHEN action = 'CREATED' THEN 0 " +
            "        WHEN action = 'UPDATED' THEN 5 " +
            "        WHEN action = 'DELETED' THEN 6 " +
            "        WHEN action = 'ATTACHMENT_UPLOADED' THEN 7 " +
            "        WHEN action = 'ATTACHMENT_DELETED' THEN 8 " +
            "        WHEN action = 'DRAFT_SAVED' THEN 9 " +
            "        WHEN action = 'EXPIRED' THEN 10 " +
            "        ELSE 5 " +
            "    END, " +
            "    changed_by, COALESCE(changed_at, CURRENT_TIMESTAMP), " +
            "    COALESCE(description, 'Thao tác trên văn bản pháp lý'), document_name, NULL, document_number " +
            "FROM legal_document_history " +
            "ON CONFLICT (id) DO NOTHING"
        );

        log.info("🚀 Database schema synchronization process finished.");
    }

    private void trySyncAndDropTable(String targetTable, String sourceTable, String sql) {
        trySyncTable(targetTable, sourceTable, sql);
        try {
            String checkSourceSql = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ?)";
            Boolean sourceExists = jdbcTemplate.queryForObject(checkSourceSql, java.lang.Boolean.class, sourceTable);
            if (Boolean.TRUE.equals(sourceExists)) {
                log.info("Dropping obsolete table [{}] after data sync...", sourceTable);
                jdbcTemplate.execute("DROP TABLE IF EXISTS " + sourceTable + " CASCADE");
                log.info("Successfully dropped table [{}]", sourceTable);
            }
        } catch (Exception e) {
            log.warn("Could not drop obsolete table [{}]: {}", sourceTable, e.getMessage());
        }
    }

    private void trySyncTable(String targetTable, String sourceTable, String sql) {
        try {
            String checkSourceSql = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ?)";
            Boolean sourceExists = jdbcTemplate.queryForObject(checkSourceSql, java.lang.Boolean.class, sourceTable);

            String checkTargetSql = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ?)";
            Boolean targetExists = jdbcTemplate.queryForObject(checkTargetSql, java.lang.Boolean.class, targetTable);

            if (Boolean.TRUE.equals(sourceExists) && Boolean.TRUE.equals(targetExists)) {
                log.info("Syncing data from old table [{}] to new table [{}]...", sourceTable, targetTable);
                int rows = jdbcTemplate.update(sql);
                log.info("Successfully synced {} rows from [{}] to [{}]", rows, sourceTable, targetTable);
            } else {
                log.info("Skipping sync for [{}] -> [{}] (one or both tables do not exist)", sourceTable, targetTable);
            }
        } catch (Exception e) {
            log.warn("Failed to sync data from [{}] to [{}]: {}", sourceTable, targetTable, e.getMessage());
        }
    }
}
