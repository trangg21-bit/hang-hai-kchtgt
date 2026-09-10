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
            java.util.List<String> existingColumns = jdbcTemplate.queryForList(
                    "SELECT LOWER(column_name) FROM information_schema.columns WHERE LOWER(table_name) = 'app_users'",
                    String.class
            );
            java.util.Set<String> colSet = new java.util.HashSet<>(existingColumns);

            if (!colSet.contains("address")) {
                jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL");
            }
            if (!colSet.contains("department")) {
                jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL");
            }
            if (!colSet.contains("position")) {
                jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS position VARCHAR(100) NULL");
            }
            if (!colSet.contains("note")) {
                jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS note VARCHAR(500) NULL");
            }
            if (!colSet.contains("last_login_at")) {
                jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL");
            }
            if (!colSet.contains("permission_version")) {
                jdbcTemplate.execute("ALTER TABLE app_users ADD COLUMN IF NOT EXISTS permission_version INTEGER NOT NULL DEFAULT 0");
            }
            log.info("Đã kiểm tra và đồng bộ cấu trúc bảng app_users thành công.");
        } catch (Exception exception) {
            log.error("Không thể cập nhật cấu trúc bảng app_users.", exception);
        }
    }
}
