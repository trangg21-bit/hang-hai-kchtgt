package com.hanghai.kchtg.mapicon.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MapSymbolSchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking map_symbols table schema...");
        try {
            // Check if map_symbols table exists and check status column data type
            String checkSql = "SELECT data_type FROM information_schema.columns " +
                    "WHERE table_name = 'map_symbols' AND column_name = 'status'";
            
            String dataType = jdbcTemplate.query(checkSql, rs -> {
                if (rs.next()) {
                    return rs.getString("data_type");
                }
                return null;
            });

            if (dataType != null && (dataType.equalsIgnoreCase("character varying") || dataType.equalsIgnoreCase("varchar"))) {
                log.info("Found map_symbols.status with type VARCHAR. Migrating to INTEGER...");
                
                // 1. Map existing VARCHAR status values to string representation of integers
                jdbcTemplate.execute("UPDATE map_symbols SET status = '0' WHERE status ILIKE 'inactive'");
                jdbcTemplate.execute("UPDATE map_symbols SET status = '2' WHERE status ILIKE 'deprecated'");
                jdbcTemplate.execute("UPDATE map_symbols SET status = '1' WHERE status IS NULL OR (status NOT ILIKE '0' AND status NOT ILIKE '2')");
                
                // 2. Alter table column type to INTEGER
                jdbcTemplate.execute("ALTER TABLE map_symbols ALTER COLUMN status TYPE INTEGER USING (status::INTEGER)");
                
                log.info("Successfully migrated map_symbols.status column to INTEGER.");
            } else {
                log.info("map_symbols.status column is already INTEGER (or table does not exist yet). No migration needed.");
            }
        } catch (Exception e) {
            log.error("Failed to migrate map_symbols.status column to INTEGER", e);
        }
    }
}
