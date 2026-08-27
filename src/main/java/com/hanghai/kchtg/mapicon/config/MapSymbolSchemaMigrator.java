package com.hanghai.kchtg.mapicon.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class MapSymbolSchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking map_symbols and KCHT table schemas...");
        try {
            // 1. Check if map_symbols table exists and check status column data type
            String checkSql = "SELECT data_type FROM information_schema.columns " +
                    "WHERE LOWER(table_name) = 'map_symbols' AND LOWER(column_name) = 'status'";

            String dataType = jdbcTemplate.query(checkSql, rs -> {
                if (rs.next()) {
                    return rs.getString("data_type");
                }
                return null;
            });

            if (dataType != null && (dataType.equalsIgnoreCase("character varying") || dataType.equalsIgnoreCase("varchar"))) {
                log.info("Found map_symbols.status with type VARCHAR. Migrating to INTEGER...");
                jdbcTemplate.execute("UPDATE map_symbols SET status = '0' WHERE status ILIKE 'inactive'");
                jdbcTemplate.execute("UPDATE map_symbols SET status = '2' WHERE status ILIKE 'deprecated'");
                jdbcTemplate.execute("UPDATE map_symbols SET status = '1' WHERE status IS NULL OR (status NOT ILIKE '0' AND status NOT ILIKE '2')");
                jdbcTemplate.execute("ALTER TABLE map_symbols ALTER COLUMN status TYPE INTEGER USING (status::INTEGER)");
                log.info("Successfully migrated map_symbols.status column to INTEGER.");
            }

            // 2. Check if hinh_anh column exists, if so rename to image
            String checkColSql = "SELECT count(*) FROM information_schema.columns " +
                    "WHERE LOWER(table_name) = 'map_symbols' AND LOWER(column_name) = 'hinh_anh'";
            Integer count = jdbcTemplate.queryForObject(checkColSql, Integer.class);
            if (count != null && count > 0) {
                log.info("Found map_symbols.hinh_anh column. Renaming to image...");
                jdbcTemplate.execute("ALTER TABLE map_symbols RENAME COLUMN hinh_anh TO image");
                log.info("Successfully renamed map_symbols.hinh_anh to image.");
            }

            // 3. Check if code column exists in map_symbols, if not add it
            String checkCodeColSql = "SELECT count(*) FROM information_schema.columns " +
                    "WHERE LOWER(table_name) = 'map_symbols' AND LOWER(column_name) = 'code'";
            Integer codeCount = jdbcTemplate.queryForObject(checkCodeColSql, Integer.class);
            if (codeCount == null || codeCount == 0) {
                log.info("Column map_symbols.code not found. Adding column...");
                jdbcTemplate.execute("ALTER TABLE map_symbols ADD COLUMN IF NOT EXISTS code VARCHAR(20)");
            }

            // 3.1. Backfill any records with missing or empty code using standard JDBC (database-agnostic)
            try {
                List<UUID> missingCodeIds = jdbcTemplate.query(
                        "SELECT id FROM map_symbols WHERE code IS NULL OR code = ''",
                        (rs, rowNum) -> (UUID) rs.getObject("id")
                );
                if (missingCodeIds != null && !missingCodeIds.isEmpty()) {
                    int counter = 1;
                    for (UUID id : missingCodeIds) {
                        String generatedCode = String.format("BT-%04d", counter++);
                        jdbcTemplate.update("UPDATE map_symbols SET code = ? WHERE id = ?", generatedCode, id);
                    }
                    log.info("Successfully backfilled {} missing map_symbols codes.", missingCodeIds.size());
                }
            } catch (Exception ex) {
                log.warn("Could not backfill map_symbols code: {}", ex.getMessage());
            }

            // 5. Ensure port_id exists and drop legacy GIS fields from vts_operation_center (unified in gis_spatial_objects)
            jdbcTemplate.execute("ALTER TABLE IF EXISTS vts_operation_center ADD COLUMN IF NOT EXISTS port_id UUID");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS vts_operation_center DROP COLUMN IF EXISTS geometry_type");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS vts_operation_center DROP COLUMN IF EXISTS coordinates");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS vts_operation_center DROP COLUMN IF EXISTS coordinate_system");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS vts_operation_center DROP COLUMN IF EXISTS display_rule");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS vts_operation_center DROP COLUMN IF EXISTS symbol_id");

            // 6. Ensure ARCHIVED (status 7) records in vts_system have deleted_at set so they are excluded from list
            jdbcTemplate.execute("UPDATE vts_system SET deleted_at = CURRENT_TIMESTAMP WHERE approval_status = 7 AND deleted_at IS NULL");

        } catch (Exception e) {
            log.error("Failed to migrate schemas in MapSymbolSchemaMigrator", e);
        }
    }
}
