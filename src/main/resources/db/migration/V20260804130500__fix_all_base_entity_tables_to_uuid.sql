-- Convert created_by, updated_by, deleted_by to UUID for all BaseEntity tables
DO $$
DECLARE
    tbl_name TEXT;
    tbls TEXT[] := ARRAY[
        'data_sharing_logs', 'integration_connections', 'system_integration_records',
        'business_data_integration_records', 'data_sharing_aggregation_records',
        'siem_reports', 'statistics_forms', 'map_symbols', 'symbol_libraries',
        'gis_spatial_objects', 'point_objects', 'line_objects', 'polygon_objects',
        'maintenance_plans', 'maintenance_reports', 'operation_plans', 'operation_reports',
        'legal_documents', 'shared_data', 'vts_system', 'ship_repair_facility',
        'radar_station', 'navigation_channel', 'buoy_station', 'lighthouse_station',
        'coastal_station_cospas_sarsat', 'coastal_station_haiphong', 'coastal_station_inmarsat',
        'coastal_station_lrit', 'coastal_station_vts', 'beacon_light', 'buoy', 'berth', 'dike_revetment'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY tbls
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'created_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN created_by::uuid ELSE NULL END)', tbl_name);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'updated_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN updated_by TYPE UUID USING (CASE WHEN updated_by ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN updated_by::uuid ELSE NULL END)', tbl_name);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'deleted_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN deleted_by TYPE UUID USING (CASE WHEN deleted_by ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN deleted_by::uuid ELSE NULL END)', tbl_name);
        END IF;
    END LOOP;
END $$;
