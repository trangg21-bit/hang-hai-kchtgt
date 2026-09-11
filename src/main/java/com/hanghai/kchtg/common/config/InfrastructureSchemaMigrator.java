package com.hanghai.kchtg.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Compatibility schema migrator ensuring all two-level approval and metadata columns
 * exist across all infrastructure tables in every environment (H2, PostgreSQL, UAT, Prod).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class InfrastructureSchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    private static final String[] TIMESTAMP_INFRA_TABLES = {
            "ports", "piers", "berths", "dry_ports", "water_zones",
            "vts_system", "vts_operation_center", "ais_system", "radar_station",
            "ship_repair_facility", "coastal_station_vts", "coastal_station_lrit",
            "coastal_station_haiphong", "coastal_station_cospas_sarsat",
            "coastal_station_inmarsat", "buoy_station", "cctv", "scada", "beacon_light", "buoy"
    };

    private static final String[] DATE_INFRA_TABLES = {
            "dike_revetment", "navigation_channel"
    };

    @Override
    public void run(String... args) {
        log.info("Starting InfrastructureSchemaMigrator to ensure all approval and audit columns exist...");

        for (String table : TIMESTAMP_INFRA_TABLES) {
            patchApprovalColumns(table, "TIMESTAMP");
        }

        for (String table : DATE_INFRA_TABLES) {
            patchApprovalColumns(table, "DATE");
        }

        patchInfrastructureHistoryTable();
        patchCctvTable();
        patchCoastalStationsTables();
        patchAisSystemTable();

        log.info("InfrastructureSchemaMigrator finished successfully.");
    }

    private void patchAisSystemTable() {
        try {
            jdbcTemplate.execute("ALTER TABLE ais_system ADD COLUMN IF NOT EXISTS radar_station_id UUID;");
            jdbcTemplate.execute("ALTER TABLE ais_system ALTER COLUMN vts_operation_center_id DROP NOT NULL;");
        } catch (Exception e) {
            log.warn("Could not patch ais_system table: {}", e.getMessage());
        }
    }

    private void patchCoastalStationsTables() {
        try {
            // coastal_station_lrit
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS station_code VARCHAR(50);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(50) DEFAULT 'POINT';");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS symbol VARCHAR(100);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS coordinate_system VARCHAR(50) DEFAULT 'WGS84';");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS display_rule VARCHAR(500);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS spatial_id UUID;");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS terminal_id VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS imo_number VARCHAR(100);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS reporting_interval INTEGER;");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS antenna_height DOUBLE PRECISION;");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS power_output DOUBLE PRECISION;");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS antenna_type VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS data_format VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS communication_channel VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(1000);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS services_provided VARCHAR(1000);");

            // coastal_station_haiphong
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS station_code VARCHAR(50);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(50) DEFAULT 'POINT';");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS symbol VARCHAR(100);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS coordinate_system VARCHAR(50) DEFAULT 'WGS84';");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS display_rule VARCHAR(500);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS spatial_id UUID;");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS port_name VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS district VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS ward VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS operational_license VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS license_expiry VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS inspector_phone VARCHAR(50);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS last_inspection_date VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS next_inspection_date VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(1000);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS communication_frequency VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS services_provided VARCHAR(1000);");
        } catch (Exception e) {
            log.warn("Could not patch coastal stations tables: {}", e.getMessage());
        }
    }

    private void patchApprovalColumns(String table, String dateType) {
        try {
            try {
                jdbcTemplate.execute("ALTER TABLE " + table + " DROP CONSTRAINT IF EXISTS " + table + "_approval_status_check;");
            } catch (Exception ignored) {}
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS approval_status SMALLINT DEFAULT 0;");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS approved_date_level1 " + dateType + ";");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS approver_level1 UUID;");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS approved_date_level2 " + dateType + ";");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS approver_level2 UUID;");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS rejection_reason TEXT;");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS submitted_at " + dateType + ";");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS submitted_by UUID;");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS level1_approval_content VARCHAR(2000);");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS level2_approval_content VARCHAR(2000);");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS deleted_by UUID;");
            coerceApprovedByToUuid(table);
        } catch (Exception e) {
            log.warn("Could not patch columns for table {}: {}", table, e.getMessage());
        }
    }

    /**
     * Cột {@code approved_by} ở một số bảng cũ còn kiểu VARCHAR trong khi entity đã khai UUID —
     * lệch kiểu này khiến Postgres báo "operator does not exist: character varying = uuid".
     * Chuyển về UUID, giá trị không phải UUID hợp lệ (ví dụ "1" của code cũ) đặt về NULL.
     */
    private void coerceApprovedByToUuid(String table) {
        try {
            jdbcTemplate.execute(
                    "DO $$ BEGIN " +
                    "  IF EXISTS (SELECT 1 FROM information_schema.columns " +
                    "             WHERE table_name = '" + table + "' AND column_name = 'approved_by' " +
                    "               AND udt_name <> 'uuid') THEN " +
                    "    ALTER TABLE " + table + " ALTER COLUMN approved_by TYPE UUID USING (" +
                    "      CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' " +
                    "           THEN approved_by::text::uuid ELSE NULL END); " +
                    "  END IF; " +
                    "END $$;");
        } catch (Exception e) {
            // H2 và các CSDL không hỗ trợ DO block: bỏ qua, schema ở đó đã đúng kiểu
            log.debug("Skip approved_by type coercion for {}: {}", table, e.getMessage());
        }
    }

    private void patchInfrastructureHistoryTable() {
        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS infrastructure_history (" +
                    "id UUID PRIMARY KEY, " +
                    "ref_id UUID NOT NULL, " +
                    "ref_type INTEGER NOT NULL, " +
                    "status INTEGER NOT NULL, " +
                    "approved_by UUID, " +
                    "approved_date TIMESTAMP, " +
                    "changed_field VARCHAR(255), " +
                    "previous_value TEXT, " +
                    "new_value TEXT, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ");");
            jdbcTemplate.execute("ALTER TABLE public.infrastructure_history ADD COLUMN IF NOT EXISTS approval_level VARCHAR(32);");
            jdbcTemplate.execute("ALTER TABLE public.infrastructure_history ADD COLUMN IF NOT EXISTS reason VARCHAR(500);");
            try {
                jdbcTemplate.execute(
                        "DO $$ BEGIN " +
                        "  IF EXISTS (SELECT 1 FROM information_schema.columns " +
                        "             WHERE table_name = 'infrastructure_history' AND column_name = 'status' " +
                        "               AND data_type LIKE '%character%') THEN " +
                        "    ALTER TABLE infrastructure_history ALTER COLUMN status DROP DEFAULT; " +
                        "    ALTER TABLE infrastructure_history ALTER COLUMN status TYPE INTEGER USING (" +
                        "      CASE upper(trim(status)) " +
                        "        WHEN 'CREATED' THEN 0 " +
                        "        WHEN 'PROPOSED' THEN 1 " +
                        "        WHEN 'UNDER_REVIEW' THEN 2 " +
                        "        WHEN 'APPROVED' THEN 3 " +
                        "        WHEN 'REJECTED' THEN 4 " +
                        "        WHEN 'UPDATED' THEN 5 " +
                        "        WHEN 'DELETED' THEN 6 " +
                        "        WHEN 'ATTACHMENT_UPLOADED' THEN 7 " +
                        "        WHEN 'ATTACHMENT_DELETED' THEN 8 " +
                        "        WHEN 'DRAFT_SAVED' THEN 9 " +
                        "        WHEN 'EXPIRED' THEN 10 " +
                        "        WHEN 'STATUS_CHANGED' THEN 11 " +
                        "        ELSE 0 " +
                        "      END" +
                        "    ); " +
                        "  END IF; " +
                        "END $$;"
                );
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute(
                        "DO $$ BEGIN " +
                        "  IF EXISTS (SELECT 1 FROM information_schema.columns " +
                        "             WHERE table_name = 'infrastructure_history' AND column_name = 'ref_type' " +
                        "               AND data_type LIKE '%character%') THEN " +
                        "    ALTER TABLE infrastructure_history ALTER COLUMN ref_type DROP DEFAULT; " +
                        "    ALTER TABLE infrastructure_history ALTER COLUMN ref_type TYPE INTEGER USING (" +
                        "      CASE " +
                        "        WHEN ref_type ~ '^[0-9]+$' THEN ref_type::integer " +
                        "        WHEN upper(trim(ref_type)) IN ('SEAPORT', 'CANGBIEN', 'PORT') THEN 0 " +
                        "        WHEN upper(trim(ref_type)) IN ('PORT_TERMINAL', 'BENCANG', 'BERTH') THEN 1 " +
                        "        WHEN upper(trim(ref_type)) IN ('PIER', 'CAUCANG') THEN 2 " +
                        "        WHEN upper(trim(ref_type)) IN ('DRY_PORT', 'CANGCAN') THEN 3 " +
                        "        WHEN upper(trim(ref_type)) IN ('WATER_AREA', 'VUNGNUOC') THEN 4 " +
                        "        WHEN upper(trim(ref_type)) IN ('DIKE_REVETMENT', 'DEKE') THEN 5 " +
                        "        WHEN upper(trim(ref_type)) IN ('NAVIGATION_CHANNEL', 'LUONGHANGHAI') THEN 6 " +
                        "        WHEN upper(trim(ref_type)) IN ('SHIP_REPAIR_FACILITY', 'COSO_SUACHUA') THEN 7 " +
                        "        WHEN upper(trim(ref_type)) IN ('LIGHTHOUSE', 'DENBIEN') THEN 8 " +
                        "        WHEN upper(trim(ref_type)) IN ('BUOY', 'PHAOTIEU') THEN 9 " +
                        "        WHEN upper(trim(ref_type)) IN ('VTS_SYSTEM', 'HE_THONG_VTS') THEN 10 " +
                        "        WHEN upper(trim(ref_type)) IN ('RADAR_STATION_LEGACY') THEN 11 " +
                        "        WHEN upper(trim(ref_type)) IN ('RADAR_STATION', 'TRAM_RADAR', 'RADAR') THEN 12 " +
                        "        WHEN upper(trim(ref_type)) IN ('BUOY_BERTH', 'BENPHAO') THEN 13 " +
                        "        WHEN upper(trim(ref_type)) IN ('SHIP_REPAIR_YARD') THEN 14 " +
                        "        WHEN upper(trim(ref_type)) IN ('ANCHORAGE_AREA', 'KHUNEO_DAU') THEN 15 " +
                        "        WHEN upper(trim(ref_type)) IN ('TRANSSHIPMENT_AREA', 'KHUCHUYEN_TAI') THEN 16 " +
                        "        WHEN upper(trim(ref_type)) IN ('STORM_SHELTER_AREA', 'KHUTRANH_TRU_BAO') THEN 17 " +
                        "        WHEN upper(trim(ref_type)) IN ('DAI_TTDH') THEN 18 " +
                        "        WHEN upper(trim(ref_type)) IN ('COASTAL_RADIO_STATION', 'HAIPHONG_STATION', 'COASTAL_STATION_HAIPHONG') THEN 19 " +
                        "        WHEN upper(trim(ref_type)) IN ('INMARSAT_STATION', 'COASTAL_STATION_INMARSAT') THEN 20 " +
                        "        WHEN upper(trim(ref_type)) IN ('COSPAS_SARSAT_STATION') THEN 21 " +
                        "        WHEN upper(trim(ref_type)) IN ('LRIT_STATION', 'COASTAL_STATION_LRIT') THEN 22 " +
                        "        WHEN upper(trim(ref_type)) IN ('HANOI_STATION') THEN 23 " +
                        "        WHEN upper(trim(ref_type)) IN ('BUOY_STATION') THEN 24 " +
                        "        WHEN upper(trim(ref_type)) IN ('LEGAL_DOCUMENT') THEN 25 " +
                        "        WHEN upper(trim(ref_type)) IN ('VTS_OPERATION_CENTER') THEN 26 " +
                        "        WHEN upper(trim(ref_type)) IN ('AIS_SYSTEM') THEN 27 " +
                        "        WHEN upper(trim(ref_type)) IN ('CCTV') THEN 28 " +
                        "        WHEN upper(trim(ref_type)) IN ('VHF') THEN 29 " +
                        "        WHEN upper(trim(ref_type)) IN ('SCADA') THEN 30 " +
                        "        WHEN upper(trim(ref_type)) IN ('TRANSMISSION') THEN 31 " +
                        "        WHEN upper(trim(ref_type)) IN ('VTS_ASSIST') THEN 32 " +
                        "        WHEN upper(trim(ref_type)) IN ('SEAPORT_THROUGHPUT') THEN 33 " +
                        "        WHEN upper(trim(ref_type)) IN ('REPORT_BCC157') THEN 34 " +
                        "        WHEN upper(trim(ref_type)) IN ('VTS_ZONE') THEN 35 " +
                        "        ELSE 0 " +
                        "      END" +
                        "    ); " +
                        "    DROP INDEX IF EXISTS idx_infra_history_ref; " +
                        "    CREATE INDEX IF NOT EXISTS idx_infra_history_ref ON infrastructure_history(ref_type, ref_id, approved_date DESC); " +
                        "  END IF; " +
                        "END $$;"
                );
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("DELETE FROM infrastructure_history WHERE changed_field IN (" +
                        "'approverLevel1', 'approverLevel2', 'approvedDateLevel1', 'approvedDateLevel2', " +
                        "'submittedAt', 'submittedBy', 'submittedForApprovalAt', 'submittedForApprovalBy', " +
                        "'portAuthorityApprovedAt', 'departmentApprovedAt', 'portAuthorityApprovedBy', " +
                        "'departmentApprovedBy', 'level1ApprovedDate', 'level2ApprovedDate', " +
                        "'level1ApprovedBy', 'level2ApprovedBy', 'sentApprovedDate', 'sentApprovedBy', " +
                        "'approvalLevel', 'submittedAt, approvedDateLevel2', 'submittedDate', " +
                        "'approvedDate', 'approvedBy', 'approvalContentLevel1', 'approvalContentLevel2', " +
                        "'portAuthorityApprovalContent', 'departmentApprovalContent');");
                jdbcTemplate.execute("UPDATE infrastructure_history SET previous_value = NULL " +
                        "WHERE previous_value IN ('(null)', 'null', 'Chưa có', '—', '[]', 'NULL', 'null=null') " +
                        "   OR TRIM(previous_value) = '';");
                jdbcTemplate.execute("UPDATE infrastructure_history SET new_value = NULL " +
                        "WHERE new_value IN ('(null)', 'null', 'Chưa có', '—', '[]', 'NULL', 'null=null') " +
                        "   OR TRIM(new_value) = '';");
            } catch (Exception ignored) {}
        } catch (Exception e) {
            log.warn("Could not ensure infrastructure_history table: {}", e.getMessage());
        }
    }

    private void patchCctvTable() {
        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS cctv (" +
                    "id UUID PRIMARY KEY, " +
                    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                    "deleted_at TIMESTAMP, " +
                    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                    "created_by UUID, " +
                    "deleted_by UUID, " +
                    "updated_by UUID, " +
                    "org_unit_id UUID, " +
                    "attached_infrastructure_type INT2, " +
                    "attached_infrastructure_id UUID, " +
                    "operating_unit_id UUID, " +
                    "province_id UUID, " +
                    "unit_of_measure INT4, " +
                    "quantity INT4 NOT NULL DEFAULT 1, " +
                    "year_of_use INT2, " +
                    "operational_status INT4 NOT NULL DEFAULT 0, " +
                    "specifications VARCHAR(2000), " +
                    "maintenance_information VARCHAR(2000), " +
                    "note VARCHAR(2000), " +
                    "object_type INT2, " +
                    "map_symbol_id UUID, " +
                    "coordinate_system INT4, " +
                    "display_rule INT4, " +
                    "spatial_id UUID, " +
                    "approval_status SMALLINT NOT NULL DEFAULT 0, " +
                    "device_code VARCHAR(200) NOT NULL, " +
                    "device_name VARCHAR(255) NOT NULL, " +
                    "detailed_location VARCHAR(500), " +
                    "model VARCHAR(255), " +
                    "manufacturer VARCHAR(50)" +
                    ");");

            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS province_id UUID;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS attached_infrastructure_type INT2;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS attached_infrastructure_id UUID;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS operating_unit_id UUID;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS unit_of_measure INT4;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS quantity INT4 DEFAULT 1;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS year_of_use INT2;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS operational_status INT4 DEFAULT 0;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS specifications VARCHAR(2000);");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS maintenance_information VARCHAR(2000);");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS note VARCHAR(2000);");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS object_type INT2;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS map_symbol_id UUID;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS coordinate_system INT4;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS display_rule INT4;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS spatial_id UUID;");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS detailed_location VARCHAR(500);");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS model VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE cctv ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(50);");
            try {
                jdbcTemplate.execute("ALTER TABLE cctv DROP CONSTRAINT IF EXISTS check_cctv_approval_status_range;");
            } catch (Exception ignored) {}
        } catch (Exception e) {
            log.warn("Could not patch CCTV table: {}", e.getMessage());
        }
    }
}
