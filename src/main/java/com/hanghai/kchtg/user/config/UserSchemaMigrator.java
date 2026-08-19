package com.hanghai.kchtg.user.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Compatibility schema patch ensuring user profile columns exist on app_users table
 * across all deployment environments where Flyway migrations might have been skipped or baseline-locked.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class UserSchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL");
            jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL");
            jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS position VARCHAR(100) NULL");
            jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS note VARCHAR(500) NULL");
            jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL");
            jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS permission_version INTEGER NOT NULL DEFAULT 0");
            log.info("Đã kiểm tra và đồng bộ cấu trúc bảng app_users thành công.");
        } catch (Exception exception) {
            log.error("Không thể cập nhật cấu trúc bảng app_users.", exception);
        }
    }
}
