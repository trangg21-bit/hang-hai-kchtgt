-- V20260728150000: Add operational_status + deleted_at indexes for dashboard KCHT asset counting.
-- Skips tables or columns that don't exist (e.g. empty test fixture, tables without the column).

DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'ports', 'berths', 'piers', 'dry_ports', 'water_zones',
        'beacon_light', 'buoy',
        'navigation_channel', 'dike_revetment',
        'radar_station', 'vts_system', 'ship_repair_facility',
        'lighthouse_station', 'buoy_station',
        'coastal_station_vts', 'coastal_station_lrit',
        'coastal_station_inmarsat', 'coastal_station_haiphong',
        'coastal_station_cospas_sarsat'
    ];
    idx_name TEXT;
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'operational_status') THEN
                idx_name := 'idx_' || tbl || '_operational_status';
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = tbl AND indexname = idx_name) THEN
                    EXECUTE format('CREATE INDEX %I ON %I(operational_status, deleted_at)', idx_name, tbl);
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;
