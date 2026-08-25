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

/**
 * Runs the real migration chain against a real PostgreSQL.
 *
 * <p>The rest of the suite runs on H2 with {@code flyway.enabled: false}, so nothing
 * executed the SQL until it reached UAT. Two production-blocking defects shipped that
 * way: V82 referenced {@code coastal_station_cospassarsat} (the table is
 * {@code coastal_station_cospas_sarsat}), and once that was fixed it hit
 * {@code coastal_station_vts_status_check} — a Hibernate-generated CHECK constraint
 * that PostgreSQL re-validates after a column type change.
 *
 * <p>The fixture reproduces the shape of the UAT database rather than a clean one:
 * the tables were originally created by Hibernate {@code ddl-auto=update}, so status
 * columns are varchar carrying a CHECK constraint, coordinates are still present, and
 * audit columns hold usernames rather than UUIDs. Flyway is then baselined at 81 —
 * the version UAT sits at — so exactly V82 onwards runs.
 *
 * <p>PostgreSQL runs as a local process; no Docker is required.
 */
@DisplayName("Flyway migrations V82+ on a UAT-shaped PostgreSQL")
class FlywayMigrationTest {

    private static EmbeddedPostgres postgres;
    private static DataSource dataSource;

    /** Station tables that V82 touches. */
    private static final String[] STATION_TABLES = {
            "buoy_station", "lighthouse_station", "coastal_station_vts",
            "coastal_station_lrit", "coastal_station_inmarsat",
            "coastal_station_haiphong", "coastal_station_cospas_sarsat"
    };

    @BeforeAll
    static void startDatabase() throws Exception {
        new java.io.File("target/tmp").mkdirs();
        postgres = EmbeddedPostgres.builder()
                .setServerConfig("shared_buffers", "16MB")
                .setServerConfig("work_mem", "2MB")
                .setServerConfig("maintenance_work_mem", "16MB")
                .setServerConfig("max_connections", "20")
                .start();
        dataSource = postgres.getPostgresDatabase();
        seedUatShapedSchema();
    }

    @AfterAll
    static void stopDatabase() throws Exception {
        if (postgres != null) {
            postgres.close();
        }
    }

    /**
     * Loads {@code uat-schema-fixture.sql}, which recreates the parts of the UAT
     * database the new migrations touch.
     *
     * <p>The document tables in that fixture are generated from the {@code IF EXISTS}
     * guards inside V86, so every rename it performs actually runs. Leaving them out
     * is what let the {@code loai_bao_tri TO loai_bao_tri} self-rename reach UAT: with
     * no such table present, all of V86 skipped itself and the test still passed.
     */
    private static void seedUatShapedSchema() throws Exception {
        String sql;
        try (var in = FlywayMigrationTest.class.getResourceAsStream("/uat-schema-fixture.sql")) {
            if (in == null) {
                throw new IllegalStateException("uat-schema-fixture.sql missing from the test classpath");
            }
            sql = new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        }
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute(sql);
        }
    }

    private static String columnType(String table, String column) throws Exception {
        try (Connection c = dataSource.getConnection();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("""
                     SELECT data_type FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = '%s' AND column_name = '%s'
                     """.formatted(table, column))) {
            return rs.next() ? rs.getString(1) : null;
        }
    }

    private static long count(String sql) throws Exception {
        try (Connection c = dataSource.getConnection();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    @Test
    @DisplayName("V82 onwards apply cleanly and leave the schema matching the entities")
    void migrationsApplyCleanly() throws Exception {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("81")   // the version UAT sits at
                .outOfOrder(true)
                .load();

        // Fails the test with Flyway's own diagnostics if any migration throws.
        flyway.migrate();

        // V82: coordinates gone, spatial_id added, status columns numeric.
        for (String table : STATION_TABLES) {
            assertThat(columnType(table, "latitude"))
                    .as("%s.latitude should have been dropped", table).isNull();
            assertThat(columnType(table, "longitude"))
                    .as("%s.longitude should have been dropped", table).isNull();
            assertThat(columnType(table, "spatial_id"))
                    .as("%s.spatial_id should exist", table).isEqualTo("uuid");
            assertThat(columnType(table, "status"))
                    .as("%s.status should be numeric", table).isEqualTo("smallint");
            assertThat(columnType(table, "approval_status"))
                    .as("%s.approval_status should be numeric", table).isEqualTo("smallint");
        }

        // The string statuses must have been mapped to their ordinals, not zeroed.
        assertThat(count("SELECT count(*) FROM coastal_station_vts WHERE status = 4"))
                .as("PUBLISHED should map to 4").isEqualTo(1);
        assertThat(count("SELECT count(*) FROM coastal_station_vts WHERE approval_status = 4"))
                .as("APPROVED_L2 should map to 4 (APPROVED_LEVEL2)").isEqualTo(1);

        // V90: audit columns converted, the username dropped, the real UUID kept.
        assertThat(columnType("coastal_station_vts", "created_by")).isEqualTo("uuid");
        assertThat(columnType("coastal_station_vts", "updated_by")).isEqualTo("uuid");
        assertThat(count("SELECT count(*) FROM coastal_station_vts WHERE created_by IS NULL"))
                .as("the 'admin' username is not a UUID and must be cleared").isEqualTo(1);
        assertThat(count("SELECT count(*) FROM coastal_station_vts WHERE updated_by IS NOT NULL"))
                .as("a valid UUID must survive").isEqualTo(1);

        // V86: the Vietnamese column names are gone. loai_bao_tri is called out because
        // V86 shipped with "RENAME COLUMN loai_bao_tri TO loai_bao_tri" — a self-rename
        // PostgreSQL rejects, which stopped the UAT deploy at version 85.
        assertThat(columnType("maintenance_plans", "maintenance_type"))
                .as("loai_bao_tri must end up as maintenance_type").isNotNull();
        assertThat(columnType("maintenance_plans", "loai_bao_tri"))
                .as("the Vietnamese name must be gone").isNull();
        assertThat(count("SELECT count(*) FROM maintenance_plans WHERE maintenance_type = 'DINH_KY'"))
                .as("the rename must carry the data across").isEqualTo(1);

        // V90 on a NOT NULL column: the username cannot become NULL without breaking
        // the constraint, so it must land on the nil UUID and the real one survive.
        assertThat(columnType("approval_history", "approved_by")).isEqualTo("uuid");
        assertThat(count("""
                SELECT count(*) FROM approval_history
                 WHERE approved_by = '00000000-0000-0000-0000-000000000000'"""))
                .as("'admin' must be replaced, not nulled").isEqualTo(1);
        assertThat(count("""
                SELECT count(*) FROM approval_history
                 WHERE approved_by = '1dfc226c-d31b-4089-93ff-86c646b94129'"""))
                .as("a valid UUID must survive untouched").isEqualTo(1);

        // V90 exclusions: these stay text because the entities declare String. Their
        // names arrive via V86 (nguoi_tao -> created_by, nguoi_duyet -> approved_by).
        assertThat(columnType("port_planning", "created_by")).isEqualTo("character varying");
        assertThat(columnType("port_planning", "updated_by")).isEqualTo("character varying");
        assertThat(columnType("adjustment_approvals", "approved_by")).isEqualTo("character varying");
        assertThat(count("SELECT count(*) FROM port_planning WHERE created_by = 'nguyenvana'"))
                .as("excluded columns keep their data").isEqualTo(1);

        // V91: the legacy document tables were created with BIGINT identity PKs, but
        // their entities type id as UUID. Before V91 the mismatch aborted startup with
        // a Hibernate schema-validation error. The fixture reproduces the BIGINT shape,
        // so these assertions fail if V91 stops converting the primary/foreign keys.
        assertThat(columnType("adjustment_approvals", "id"))
                .as("adjustment_approvals.id must become uuid").isEqualTo("uuid");
        assertThat(columnType("planning_adjustments", "id"))
                .as("planning_adjustments.id must become uuid").isEqualTo("uuid");
        assertThat(columnType("port_planning", "id"))
                .as("port_planning.id must become uuid").isEqualTo("uuid");
        // FK columns (renamed to English by V86) must be converted alongside the PKs.
        assertThat(columnType("adjustment_approvals", "planning_adjustment_id"))
                .as("adjustment_approvals.planning_adjustment_id must become uuid").isEqualTo("uuid");
        assertThat(columnType("planning_adjustments", "port_planning_id"))
                .as("planning_adjustments.port_planning_id must become uuid").isEqualTo("uuid");
    }

    @Test
    @DisplayName("re-running the migrations is a no-op")
    void migrationsAreIdempotent() {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("81")
                .outOfOrder(true)
                .load();

        flyway.migrate();
        assertThat(flyway.migrate().migrationsExecuted)
                .as("nothing left to apply on a second run").isZero();
    }
}
