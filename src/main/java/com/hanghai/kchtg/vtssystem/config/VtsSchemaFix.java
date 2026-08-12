package com.hanghai.kchtg.vtssystem.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class VtsSchemaFix implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(VtsSchemaFix.class);
    private final JdbcTemplate jdbcTemplate;

    public VtsSchemaFix(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        log.info("Executing VtsSchemaFix to bypass Flyway...");
        try {
            jdbcTemplate.execute("ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS code VARCHAR(50);");
            jdbcTemplate.execute("ALTER TABLE vts_system DROP COLUMN IF EXISTS location;");
            try {
                jdbcTemplate.execute("ALTER TABLE vts_system ADD CONSTRAINT uk_vts_system_code UNIQUE(code);");
            } catch(Exception e) {
                // Ignore constraint already exists
            }
            jdbcTemplate.execute("ALTER TABLE vts_system DROP COLUMN IF EXISTS province;");
            jdbcTemplate.execute("ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS province_id INTEGER;");
            jdbcTemplate.execute("ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS address VARCHAR(500);");
            jdbcTemplate.execute("ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS maritime_notice VARCHAR(2000);");
            jdbcTemplate.execute("ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS operation_start_date DATE;");
            
            jdbcTemplate.execute("ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS owning_org_id UUID;");
            jdbcTemplate.execute("ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS operating_org_id UUID;");
            jdbcTemplate.execute("ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS port_id UUID;");

            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS vts_zone (" +
                    "id UUID PRIMARY KEY, " +
                    "vts_system_id UUID NOT NULL, " +
                    "code VARCHAR(50) NOT NULL, " +
                    "name VARCHAR(255) NOT NULL, " +
                    "condition_status SMALLINT, " +
                    "created_at TIMESTAMP, " +
                    "updated_at TIMESTAMP, " +
                    "deleted_at TIMESTAMP, " +
                    "created_by UUID, " +
                    "updated_by UUID, " +
                    "deleted_by UUID, " +
                    "CONSTRAINT fk_vts_zone_system FOREIGN KEY (vts_system_id) REFERENCES vts_system(id)" +
                    ");");

            jdbcTemplate.execute("ALTER TABLE vts_zone ADD COLUMN IF NOT EXISTS deleted_by UUID;");
            jdbcTemplate.execute("ALTER TABLE vts_zone ADD COLUMN IF NOT EXISTS created_by UUID;");
            jdbcTemplate.execute("ALTER TABLE vts_zone ADD COLUMN IF NOT EXISTS updated_by UUID;");
            jdbcTemplate.execute("ALTER TABLE vts_zone ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;");
            jdbcTemplate.execute("ALTER TABLE vts_zone ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;");
            jdbcTemplate.execute("ALTER TABLE vts_zone ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;");

            log.info("VtsSchemaFix executed successfully.");
        } catch (Exception e) {
            log.error("Failed to execute VtsSchemaFix", e);
        }
    }
}
