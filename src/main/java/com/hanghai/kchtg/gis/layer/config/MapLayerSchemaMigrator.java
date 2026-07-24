package com.hanghai.kchtg.gis.layer.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MapLayerSchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking map_layers table schema...");
        try {
            // Check if map_layers table exists and check layer_type column data type
            String checkSql = "SELECT data_type FROM information_schema.columns " +
                    "WHERE table_name = 'map_layers' AND column_name = 'layer_type' " +
                    "AND table_schema = current_schema()";
            
            String dataType = jdbcTemplate.query(checkSql, rs -> {
                if (rs.next()) {
                    return rs.getString("data_type");
                }
                return null;
            });

            if (dataType != null && (dataType.equalsIgnoreCase("character varying") || dataType.equalsIgnoreCase("varchar"))) {
                log.info("Found map_layers.layer_type with type VARCHAR. Migrating to INTEGER...");
                
                // Drop existing check constraints dynamically
                dropCheckConstraints("map_layers", "layer_type");
                
                // Convert layer_type column to INTEGER
                jdbcTemplate.execute("ALTER TABLE map_layers ALTER COLUMN layer_type TYPE INTEGER USING (" +
                        "CASE UPPER(layer_type::text) " +
                        "WHEN 'POINT' THEN 1 " +
                        "WHEN 'LINE' THEN 2 " +
                        "WHEN 'POLYGON' THEN 3 " +
                        "WHEN 'BASEMAP' THEN 4 " +
                        "WHEN 'OVERLAY' THEN 5 " +
                        "WHEN '1' THEN 1 " +
                        "WHEN '2' THEN 2 " +
                        "WHEN '3' THEN 3 " +
                        "WHEN '4' THEN 4 " +
                        "WHEN '5' THEN 5 " +
                        "ELSE 1 END)");
                
                log.info("Successfully migrated map_layers.layer_type column to INTEGER.");
            } else {
                log.info("map_layers.layer_type column is already INTEGER (or table does not exist yet). No migration needed.");
            }

            // Check map_layers.status column data type
            String checkStatusSql = "SELECT data_type FROM information_schema.columns " +
                    "WHERE table_name = 'map_layers' AND column_name = 'status' " +
                    "AND table_schema = current_schema()";
            
            String statusDataType = jdbcTemplate.query(checkStatusSql, rs -> {
                if (rs.next()) {
                    return rs.getString("data_type");
                }
                return null;
            });

            if (statusDataType != null && (statusDataType.equalsIgnoreCase("character varying") || statusDataType.equalsIgnoreCase("varchar"))) {
                log.info("Found map_layers.status with type VARCHAR. Migrating to BOOLEAN...");
                
                // Drop existing check constraints dynamically
                dropCheckConstraints("map_layers", "status");
                
                jdbcTemplate.execute("ALTER TABLE map_layers ALTER COLUMN status TYPE BOOLEAN USING (" +
                        "CASE UPPER(status::text) " +
                        "WHEN 'ACTIVE' THEN true " +
                        "WHEN '1' THEN true " +
                        "WHEN 'TRUE' THEN true " +
                        "WHEN 'INACTIVE' THEN false " +
                        "WHEN '0' THEN false " +
                        "WHEN 'FALSE' THEN false " +
                        "ELSE true END)");
                
                jdbcTemplate.execute("ALTER TABLE map_layers ALTER COLUMN status SET DEFAULT true");
                
                log.info("Successfully migrated map_layers.status column to BOOLEAN.");
            }
        } catch (Exception e) {
            log.error("Failed to migrate map_layers schema columns", e);
        }
    }

    private void dropCheckConstraints(String tableName, String columnName) {
        String query = "SELECT tc.constraint_name " +
                "FROM information_schema.table_constraints tc " +
                "JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name " +
                "WHERE tc.table_name = ? AND tc.table_schema = current_schema() " +
                "AND ccu.column_name = ? AND tc.constraint_type = 'CHECK'";
        try {
            List<String> constraintNames = jdbcTemplate.query(query, 
                    (rs, rowNum) -> rs.getString("constraint_name"), 
                    tableName, columnName);
            for (String constraintName : constraintNames) {
                log.info("Dropping constraint {} on {}.{}", constraintName, tableName, columnName);
                jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP CONSTRAINT IF EXISTS " + constraintName);
            }
        } catch (Exception e) {
            log.warn("Failed to drop constraints for {}.{}: {}", tableName, columnName, e.getMessage());
        }
    }
}
