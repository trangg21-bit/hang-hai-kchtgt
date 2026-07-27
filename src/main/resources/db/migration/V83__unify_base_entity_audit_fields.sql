-- V83: Unify audit fields across all remaining entities to match BaseEntity standard
-- This script safely renames created_date to created_at, updated_date to updated_at,
-- migrates is_deleted boolean to deleted_at timestamp, and adds deleted_by column.

DO $$
DECLARE
    t_name text;
BEGIN
    -- List of tables to migrate
    FOR t_name IN SELECT unnest(ARRAY['radar_station', 'vts_system', 'ship_repair_facility'])
    LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = t_name) THEN
            
            -- Rename created_date -> created_at
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'created_date') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN created_date TO created_at;', t_name);
            END IF;

            -- Rename updated_date -> updated_at
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'updated_date') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN updated_date TO updated_at;', t_name);
            END IF;

            -- Migrate is_deleted -> deleted_at
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'is_deleted') THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;', t_name);
                EXECUTE format('UPDATE %I SET deleted_at = CURRENT_TIMESTAMP WHERE is_deleted = true;', t_name);
                EXECUTE format('ALTER TABLE %I DROP COLUMN is_deleted;', t_name);
            END IF;

            -- Add deleted_by
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100);', t_name);
            
        END IF;
    END LOOP;

    -- For nha_tram_den and buoy_station, they just need deleted_by if missing
    FOR t_name IN SELECT unnest(ARRAY['nha_tram_den', 'buoy_station', 'lighthouse_station', 'coastal_station_vts', 'coastal_station_lrit', 'coastal_station_cospas_sarsat', 'coastal_station_inmarsat', 'coastal_station_haiphong'])
    LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = t_name) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100);', t_name);
        END IF;
    END LOOP;

END $$;
