-- V82: Drop the duplicated latitude/longitude columns from the station and beacon
-- tables (coordinates live in the spatial tables, referenced by spatial_id) and
-- normalise status/approval_status to smallint.
--
-- Every statement is guarded, for two reasons learned the hard way on UAT:
--
--  1. These tables were originally created by Hibernate ddl-auto=update, so which
--     ones exist differs per environment — nha_tram_den / nha_tram_phao belong to
--     entities that have since been deleted and are absent on a fresh database.
--     A bare ALTER TABLE on a missing table aborts the whole migration.
--  2. The station entities declare @Enumerated(ORDINAL) with
--     columnDefinition = "smallint default 0", so on a Hibernate-created schema
--     status/approval_status are ALREADY smallint. Casting them with
--     CASE status WHEN 'DRAFT' ... fails there, because smallint cannot be
--     compared to a string literal. The conversion below therefore runs only when
--     the column is still a character type.
--
-- SAFE & IDEMPOTENT: missing tables and columns are skipped, and re-running is a
-- no-op.

DO $$
DECLARE
    -- Tables that carry redundant latitude/longitude columns.
    coord_tables CONSTANT text[] := ARRAY[
        'buoy_station', 'lighthouse_station',
        'coastal_station_vts', 'coastal_station_lrit',
        'coastal_station_inmarsat', 'coastal_station_haiphong',
        'coastal_station_cospas_sarsat',
        'beacon_light', 'buoy',
        -- Dead entities; the tables may still linger on older databases.
        'nha_tram_den', 'nha_tram_phao'
    ];

    -- Tables that need the spatial_id foreign reference.
    spatial_tables CONSTANT text[] := ARRAY[
        'beacon_light', 'buoy_station', 'lighthouse_station',
        'coastal_station_vts', 'coastal_station_lrit',
        'coastal_station_inmarsat', 'coastal_station_haiphong',
        'coastal_station_cospas_sarsat',
        'nha_tram_den', 'nha_tram_phao'
    ];

    -- Station tables whose status columns become smallint.
    status_tables CONSTANT text[] := ARRAY[
        'buoy_station', 'lighthouse_station',
        'coastal_station_vts', 'coastal_station_lrit',
        'coastal_station_inmarsat', 'coastal_station_haiphong',
        'coastal_station_cospas_sarsat'
    ];

    status_cols CONSTANT text[] := ARRAY['status', 'approval_status'];

    t          text;
    col        text;
    col_type   text;
BEGIN
    -- 1. Drop the duplicated coordinate columns.
    FOREACH t IN ARRAY coord_tables LOOP
        IF to_regclass('public.' || t) IS NULL THEN
            RAISE NOTICE 'V82: skipping % - table does not exist', t;
            CONTINUE;
        END IF;
        EXECUTE format(
            'ALTER TABLE %I DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude', t);
    END LOOP;

    -- 2. Add the spatial reference.
    FOREACH t IN ARRAY spatial_tables LOOP
        IF to_regclass('public.' || t) IS NULL THEN
            CONTINUE;
        END IF;
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS spatial_id UUID', t);
    END LOOP;

    -- 3. Normalise the status columns to smallint, but only where they are still
    --    text. On a Hibernate-created schema they are smallint already.
    FOREACH t IN ARRAY status_tables LOOP
        IF to_regclass('public.' || t) IS NULL THEN
            CONTINUE;
        END IF;

        FOREACH col IN ARRAY status_cols LOOP
            SELECT data_type INTO col_type
              FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name   = t
               AND column_name  = col;

            IF col_type IS NULL THEN
                RAISE NOTICE 'V82: skipping %.% - column does not exist', t, col;
                CONTINUE;
            END IF;

            IF col_type NOT IN ('character varying', 'character', 'text') THEN
                -- Already numeric; nothing to convert.
                CONTINUE;
            END IF;

            IF col = 'status' THEN
                EXECUTE format($fmt$
                    ALTER TABLE %I
                        ALTER COLUMN status DROP DEFAULT,
                        ALTER COLUMN status TYPE smallint USING (
                            CASE status
                                WHEN 'DRAFT'            THEN 0
                                WHEN 'PENDING_APPROVAL' THEN 1
                                WHEN 'APPROVED_L1'      THEN 2
                                WHEN 'APPROVED_L2'      THEN 3
                                WHEN 'PUBLISHED'        THEN 4
                                WHEN 'DELETED'          THEN 5
                                ELSE 0
                            END
                        ),
                        ALTER COLUMN status SET DEFAULT 0
                $fmt$, t);
            ELSE
                EXECUTE format($fmt$
                    ALTER TABLE %I
                        ALTER COLUMN approval_status DROP DEFAULT,
                        ALTER COLUMN approval_status TYPE smallint USING (
                            CASE approval_status
                                WHEN 'PENDING'     THEN 0
                                WHEN 'APPROVED_L1' THEN 1
                                WHEN 'APPROVED_L2' THEN 2
                                WHEN 'REJECTED'    THEN 3
                                ELSE 0
                            END
                        ),
                        ALTER COLUMN approval_status SET DEFAULT 0
                $fmt$, t);
            END IF;
        END LOOP;
    END LOOP;
END $$;
