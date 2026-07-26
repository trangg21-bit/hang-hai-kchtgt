-- V82: Cleanup latitude and longitude from station and beacon tables
-- Convert status and approval_status to smallint where applicable

-- 1. Drop latitude and longitude columns from Station tables
ALTER TABLE buoy_station DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
ALTER TABLE lighthouse_station DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
ALTER TABLE coastal_station_vts DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
ALTER TABLE coastal_station_lrit DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
ALTER TABLE coastal_station_inmarsat DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
ALTER TABLE coastal_station_haiphong DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
ALTER TABLE coastal_station_cospassarsat DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;

-- Drop from Beacon and NhaTram tables
ALTER TABLE beacon_light DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
ALTER TABLE nha_tram_den DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
ALTER TABLE nha_tram_phao DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
ALTER TABLE buoy DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;

-- 2. Add spatial_id column if not exists
ALTER TABLE beacon_light ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE nha_tram_den ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE nha_tram_phao ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE buoy_station ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE lighthouse_station ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE coastal_station_cospassarsat ADD COLUMN IF NOT EXISTS spatial_id UUID;

-- 3. Convert status and approval_status to smallint for Station tables
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN SELECT unnest(ARRAY[
        'buoy_station', 'lighthouse_station', 'coastal_station_vts',
        'coastal_station_lrit', 'coastal_station_inmarsat',
        'coastal_station_haiphong', 'coastal_station_cospassarsat'
    ])
    LOOP
        EXECUTE format('
            ALTER TABLE %I
                ALTER COLUMN status TYPE smallint USING (
                    CASE status
                        WHEN ''DRAFT'' THEN 0
                        WHEN ''PENDING_APPROVAL'' THEN 1
                        WHEN ''APPROVED_L1'' THEN 2
                        WHEN ''APPROVED_L2'' THEN 3
                        WHEN ''PUBLISHED'' THEN 4
                        WHEN ''DELETED'' THEN 5
                        ELSE 0
                    END
                ),
                ALTER COLUMN status SET DEFAULT 0,
                
                ALTER COLUMN approval_status TYPE smallint USING (
                    CASE approval_status
                        WHEN ''PENDING'' THEN 0
                        WHEN ''APPROVED_L1'' THEN 1
                        WHEN ''APPROVED_L2'' THEN 2
                        WHEN ''REJECTED'' THEN 3
                        ELSE 0
                    END
                ),
                ALTER COLUMN approval_status SET DEFAULT 0;
        ', t_name);
    END LOOP;
END $$;
