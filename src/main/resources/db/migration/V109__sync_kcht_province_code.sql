-- V109: Sync province_id for all KCHT tables and assign random province to existing data

DO $$
DECLARE
    t_name text;
    tables text[] := ARRAY[
        'ports', 'berths', 'piers', 'dry_ports', 'water_zones',
        'beacon_light', 'buoy', 'navigation_channel', 'dike_revetment',
        'radar_station', 'vts_system', 'ship_repair_facility',
        'lighthouse_station', 'buoy_station', 'coastal_station_vts',
        'coastal_station_lrit', 'coastal_station_inmarsat',
        'coastal_station_haiphong', 'coastal_station_cospas_sarsat'
    ];
BEGIN
    -- 1. Drop existing legacy text columns safely
    ALTER TABLE IF EXISTS ports DROP COLUMN IF EXISTS province;
    ALTER TABLE IF EXISTS dry_ports DROP COLUMN IF EXISTS province;
    ALTER TABLE IF EXISTS ship_repair_facility DROP COLUMN IF EXISTS province;
    ALTER TABLE IF EXISTS berths DROP COLUMN IF EXISTS location_code;

    -- 2. Loop through all 19 KCHT tables
    FOREACH t_name IN ARRAY tables LOOP
        
        -- A. Add column
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS province_id INT;', t_name);
        
        -- B. Assign random province id to existing rows (only where it is NULL)
        EXECUTE format('
            UPDATE %I 
            SET province_id = (
                SELECT id FROM provinces 
                ORDER BY random() 
                LIMIT 1
            )
            WHERE province_id IS NULL;
        ', t_name);
        
        -- C. Add Foreign Key safely if not exists
        EXECUTE format('
            DO $FK$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = ''fk_%s_province''
                ) THEN
                    ALTER TABLE %I ADD CONSTRAINT fk_%s_province FOREIGN KEY (province_id) REFERENCES provinces(id);
                END IF;
            END $FK$;
        ', t_name, t_name, t_name);

    END LOOP;
END $$;
