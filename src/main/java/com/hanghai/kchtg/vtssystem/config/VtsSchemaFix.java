package com.hanghai.kchtg.vtssystem.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
@Profile("local-h2")
public class VtsSchemaFix implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(VtsSchemaFix.class);
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public VtsSchemaFix(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
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

            // Older databases may have persisted audit text columns as BYTEA.
            // Convert them before the history search applies LOWER()/LIKE.
            if (isPostgreSql()) {
                jdbcTemplate.execute("""
                    DO $$
                    DECLARE
                        target_column_name text;
                    BEGIN
                        FOREACH target_column_name IN ARRAY ARRAY['changed_field', 'previous_value', 'new_value', 'reason'] LOOP
                            IF EXISTS (
                                SELECT 1
                                FROM information_schema.columns c
                                WHERE c.table_schema = 'public'
                                  AND c.table_name = 'approval_history'
                                  AND c.column_name = target_column_name
                                  AND c.udt_name = 'bytea'
                            ) THEN
                                EXECUTE format(
                                    'ALTER TABLE public.approval_history ALTER COLUMN %I TYPE TEXT USING convert_from(%I, ''UTF8'')',
                                    target_column_name,
                                    target_column_name
                                );
                            END IF;
                        END LOOP;
                    END $$;
                    """);
            } else {
                log.info("Skipping PostgreSQL-only approval history conversion for non-PostgreSQL database.");
            }

            log.info("VtsSchemaFix executed successfully.");
        } catch (Exception e) {
            log.error("Failed to execute VtsSchemaFix", e);
        }
    }

    private boolean isPostgreSql() {
        try (Connection connection = dataSource.getConnection()) {
            return "PostgreSQL".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName());
        } catch (Exception e) {
            log.warn("Unable to determine database product; skipping PostgreSQL-only schema fix.", e);
            return false;
        }
    }
}
