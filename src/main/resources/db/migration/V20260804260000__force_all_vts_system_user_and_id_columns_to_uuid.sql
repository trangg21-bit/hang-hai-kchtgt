-- V20260804260000: Force all UUID columns across all infrastructure tables to native PostgreSQL UUID type

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN (
              'vts_system', 'radar_station', 'ship_repair_facility', 'navigation_channel', 'dike_revetment',
              'buoy_station', 'lighthouse_station', 'coastal_station_cospas_sarsat', 'coastal_station_haiphong',
              'coastal_station_inmarsat', 'coastal_station_lrit', 'coastal_station_vts', 'beacon_light', 'buoy',
              'berth', 'pier', 'ports', 'dry_ports', 'water_zones', 'piers', 'gis_spatial_objects', 'approval_history'
          )
          AND column_name IN ('id', 'org_unit_id', 'spatial_id', 'unit_id', 'ref_id', 'operator_id', 'created_by', 'updated_by', 'deleted_by', 'approved_by', 'approver_level1', 'approver_level2')
          AND data_type IN ('character varying', 'varchar', 'text')
    LOOP
        EXECUTE format('
            ALTER TABLE public.%I 
            ALTER COLUMN %I DROP DEFAULT
        ', r.table_name, r.column_name);

        EXECUTE format('
            ALTER TABLE public.%I 
            ALTER COLUMN %I TYPE UUID USING (
                CASE 
                    WHEN %I IS NULL OR trim(%I::text) = '''' THEN NULL
                    WHEN %I::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' 
                    THEN %I::uuid 
                    ELSE NULL 
                END
            )
        ', r.table_name, r.column_name, r.column_name, r.column_name, r.column_name, r.column_name);
    END LOOP;
END $$;
