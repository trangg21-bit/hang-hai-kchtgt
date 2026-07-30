package com.hanghai.kchtg.orgunit.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Compatibility schema patch for local installations where Flyway is disabled.
 * Production and UAT receive the same change through the Flyway migration.
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class OrgUnitSchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE org_units "
                    + "ADD COLUMN IF NOT EXISTS operational_status SMALLINT NOT NULL DEFAULT 1");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_org_units_operational_status "
                    + "ON org_units (operational_status)");
            log.info("Đã kiểm tra cấu trúc trạng thái sử dụng của đơn vị.");
        } catch (Exception exception) {
            log.error("Không thể cập nhật cấu trúc trạng thái sử dụng của đơn vị.", exception);
            throw exception;
        }
    }
}
