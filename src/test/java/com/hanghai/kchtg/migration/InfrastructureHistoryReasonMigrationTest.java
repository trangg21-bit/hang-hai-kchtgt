package com.hanghai.kchtg.migration;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Infrastructure history reason catch-up migration")
class InfrastructureHistoryReasonMigrationTest {

    private static EmbeddedPostgres postgres;
    private static DataSource dataSource;

    @BeforeAll
    static void startDatabase() throws Exception {
        new java.io.File("target/tmp").mkdirs();
        postgres = EmbeddedPostgres.builder().start();
        dataSource = postgres.getPostgresDatabase();

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("""
                    CREATE TABLE public.infrastructure_history (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        ref_id UUID NOT NULL,
                        ref_type VARCHAR(64) NOT NULL,
                        approval_level VARCHAR(32),
                        status VARCHAR(32) NOT NULL,
                        approved_by UUID,
                        approved_date TIMESTAMP,
                        changed_field VARCHAR(1000),
                        previous_value TEXT,
                        new_value TEXT
                    )
                    """);
        }
    }

    @AfterAll
    static void stopDatabase() throws Exception {
        if (postgres != null) {
            postgres.close();
        }
    }

    @Test
    @DisplayName("adds the missing reason column and remains idempotent")
    void addsMissingReasonColumn() throws Exception {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("20260911120000")
                .outOfOrder(true)
                .load();

        flyway.migrate();

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet result = statement.executeQuery("""
                     SELECT data_type, character_maximum_length
                     FROM information_schema.columns
                     WHERE table_schema = 'public'
                       AND table_name = 'infrastructure_history'
                       AND column_name = 'reason'
                     """)) {
            assertThat(result.next()).isTrue();
            assertThat(result.getString("data_type")).isEqualTo("character varying");
            assertThat(result.getInt("character_maximum_length")).isEqualTo(500);
        }

        assertThat(flyway.migrate().migrationsExecuted).isZero();
    }
}
