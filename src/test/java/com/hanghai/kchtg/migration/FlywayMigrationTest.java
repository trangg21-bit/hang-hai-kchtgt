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
        postgres = EmbeddedPostgres.builder().start();
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
     * Recreates the parts of the UAT schema the new migrations touch, the way
     * Hibernate would have created them.
     */
    private static void seedUatShapedSchema() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            for (String table : STATION_TABLES) {
                s.execute("""
                        CREATE TABLE %s (
                            id              UUID PRIMARY KEY,
                            latitude        DOUBLE PRECISION,
                            longitude       DOUBLE PRECISION,
                            status          VARCHAR(50) DEFAULT 'DRAFT'
                                            CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED_L1',
                                                              'APPROVED_L2','PUBLISHED','DELETED')),
                            approval_status VARCHAR(50) DEFAULT 'PENDING'
                                            CHECK (approval_status IN ('PENDING','APPROVED_L1',
                                                                       'APPROVED_L2','REJECTED')),
                            created_by      VARCHAR(100),
                            updated_by      VARCHAR(100),
                            deleted_by      VARCHAR(100)
                        )""".formatted(table));

                // A row per table so the type change has data to convert, and a
                // username in created_by so V90's non-UUID clearing is exercised.
                s.execute("""
                        INSERT INTO %s (id, latitude, longitude, status, approval_status, created_by, updated_by)
                        VALUES (gen_random_uuid(), 20.5, 106.7, 'PUBLISHED', 'APPROVED_L2',
                                'admin', '3f1a7c2e-9b4d-4e18-8a55-2c6f0d9e7b31')
                        """.formatted(table));
            }

            // Beacon tables: V82 drops coordinates from these too.
            for (String table : new String[]{"beacon_light", "buoy"}) {
                s.execute("""
                        CREATE TABLE %s (
                            id         UUID PRIMARY KEY,
                            latitude   DOUBLE PRECISION,
                            longitude  DOUBLE PRECISION,
                            created_by VARCHAR(100),
                            updated_by VARCHAR(100)
                        )""".formatted(table));
            }

            // Audit columns that must stay text — V90 has to leave these alone.
            s.execute("""
                    CREATE TABLE port_planning (
                        id         UUID PRIMARY KEY,
                        created_by VARCHAR(100),
                        updated_by VARCHAR(100)
                    )""");
            s.execute("""
                    CREATE TABLE adjustment_approvals (
                        id          UUID PRIMARY KEY,
                        approved_by VARCHAR(100)
                    )""");
            s.execute("INSERT INTO port_planning (id, created_by) VALUES (gen_random_uuid(), 'nguyenvana')");
            s.execute("INSERT INTO adjustment_approvals (id, approved_by) VALUES (gen_random_uuid(), 'Tran Thi B')");
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
        assertThat(count("SELECT count(*) FROM coastal_station_vts WHERE approval_status = 2"))
                .as("APPROVED_L2 should map to 2").isEqualTo(1);

        // V90: audit columns converted, the username dropped, the real UUID kept.
        assertThat(columnType("coastal_station_vts", "created_by")).isEqualTo("uuid");
        assertThat(columnType("coastal_station_vts", "updated_by")).isEqualTo("uuid");
        assertThat(count("SELECT count(*) FROM coastal_station_vts WHERE created_by IS NULL"))
                .as("the 'admin' username is not a UUID and must be cleared").isEqualTo(1);
        assertThat(count("SELECT count(*) FROM coastal_station_vts WHERE updated_by IS NOT NULL"))
                .as("a valid UUID must survive").isEqualTo(1);

        // V90 exclusions: these stay text because the entities declare String.
        assertThat(columnType("port_planning", "created_by")).isEqualTo("character varying");
        assertThat(columnType("port_planning", "updated_by")).isEqualTo("character varying");
        assertThat(columnType("adjustment_approvals", "approved_by")).isEqualTo("character varying");
        assertThat(count("SELECT count(*) FROM port_planning WHERE created_by = 'nguyenvana'"))
                .as("excluded columns keep their data").isEqualTo(1);
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
