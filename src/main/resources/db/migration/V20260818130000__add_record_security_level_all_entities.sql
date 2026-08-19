-- Migration: Add record security level to all infrastructure and business entity tables

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'ports',
        'berths',
        'piers',
        'dry_ports',
        'water_zones',
        'navigation_channel',
        'dike_revetment',
        'radar_station',
        'ship_repair_facility',
        'ts_ql',
        'beacon_light',
        'buoy',
        'buoy_station',
        'lighthouse_station',
        'coastal_station_haiphong',
        'coastal_station_lrit',
        'coastal_station_inmarsat',
        'coastal_station_vts',
        'coastal_station_cospas_sarsat',
        'documents',
        'legal_documents'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            -- 1. Add column if not exists
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS security_level SMALLINT;', t);

            -- 2. Backfill existing nulls to 0 (NORMAL)
            EXECUTE format('UPDATE %I SET security_level = 0 WHERE security_level IS NULL;', t);

            -- 3. Set default and not null
            EXECUTE format('ALTER TABLE %I ALTER COLUMN security_level SET DEFAULT 0;', t);
            EXECUTE format('ALTER TABLE %I ALTER COLUMN security_level SET NOT NULL;', t);

            -- 4. Constraint (0 = NORMAL, 1 = RESTRICTED, 2 = CONFIDENTIAL)
            EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS ck_%s_security_level;', t, t);
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT ck_%s_security_level CHECK (security_level BETWEEN 0 AND 2);', t, t);

            -- 5. Conditional index (check if org_unit_id exists in table)
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'org_unit_id') THEN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'deleted_at') THEN
                    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_org_security_active ON %I (org_unit_id, security_level) WHERE deleted_at IS NULL;', t, t);
                ELSE
                    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_org_security ON %I (org_unit_id, security_level);', t, t);
                END IF;
            ELSE
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'deleted_at') THEN
                    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_security_active ON %I (security_level) WHERE deleted_at IS NULL;', t, t);
                ELSE
                    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_security ON %I (security_level);', t, t);
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;
