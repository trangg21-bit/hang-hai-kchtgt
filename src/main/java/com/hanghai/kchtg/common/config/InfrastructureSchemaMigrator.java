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
            "coastal_station_inmarsat", "buoy_station", "cctv", "beacon_station", "buoy"
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

        log.info("InfrastructureSchemaMigrator finished successfully.");
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
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;");
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS deleted_by UUID;");
        } catch (Exception e) {
            log.warn("Could not patch columns for table {}: {}", table, e.getMessage());
        }
    }

    private void patchInfrastructureHistoryTable() {
        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS infrastructure_history (" +
                    "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                    "ref_id UUID NOT NULL, " +
                    "ref_type VARCHAR(64) NOT NULL, " +
                    "approval_level VARCHAR(32), " +
                    "status VARCHAR(32) NOT NULL, " +
                    "approved_by UUID, " +
                    "approved_date TIMESTAMP, " +
                    "reason TEXT, " +
                    "changed_field VARCHAR(255), " +
                    "previous_value TEXT, " +
                    "new_value TEXT, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ");");
        } catch (Exception e) {
            log.warn("Could not ensure infrastructure_history table: {}", e.getMessage());
        }
    }
}
