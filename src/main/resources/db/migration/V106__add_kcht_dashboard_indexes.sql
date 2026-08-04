-- V106__add_kcht_dashboard_indexes.sql
-- Add dashboard indexes only when the target table/columns exist.
-- Some UAT databases still contain the legacy operational_status column while
-- newer schemas use status; conditional creation keeps the migration portable.

DO $$
DECLARE
    item record;
BEGIN
    FOR item IN
        SELECT * FROM (VALUES
            ('idx_ports_dashboard', 'ports', 'deleted_at', 'operational_status', 'approval_status'),
            ('idx_berths_dashboard', 'berths', 'deleted_at', 'operational_status', 'approval_status'),
            ('idx_piers_dashboard', 'piers', 'deleted_at', 'operational_status', 'approval_status'),
            ('idx_dry_ports_dashboard', 'dry_ports', 'deleted_at', 'operational_status', 'approval_status'),
            ('idx_beacon_light_dashboard', 'beacon_light', 'deleted_at', 'status', 'approval_status'),
            ('idx_buoy_dashboard', 'buoy', 'deleted_at', 'status', 'approval_status'),
            ('idx_navigation_channel_dashboard', 'navigation_channel', 'deleted_at', 'status', 'approval_status'),
            ('idx_dike_revetment_dashboard', 'dike_revetment', 'deleted_at', 'status', 'approval_status'),
            ('idx_lighthouse_station_dashboard', 'lighthouse_station', 'deleted_at', 'status', 'approval_status'),
            ('idx_buoy_station_dashboard', 'buoy_station', 'deleted_at', 'status', 'approval_status'),
            ('idx_coastal_station_vts_dashboard', 'coastal_station_vts', 'deleted_at', 'status', 'approval_status'),
            ('idx_coastal_station_lrit_dashboard', 'coastal_station_lrit', 'deleted_at', 'status', 'approval_status'),
            ('idx_coastal_station_inmarsat_dashboard', 'coastal_station_inmarsat', 'deleted_at', 'status', 'approval_status'),
            ('idx_radar_station_dashboard', 'radar_station', 'deleted_at', 'condition_status', 'approval_status'),
            ('idx_vts_system_dashboard', 'vts_system', 'deleted_at', 'condition_status', 'approval_status')
        ) AS values(index_name, table_name, deleted_column, state_column, approval_column)
    LOOP
        IF to_regclass(format('public.%I', item.table_name)) IS NOT NULL
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = item.table_name AND column_name = item.deleted_column)
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = item.table_name AND column_name = item.state_column)
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = item.table_name AND column_name = item.approval_column) THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I, %I, %I)', item.index_name, item.table_name, item.deleted_column, item.state_column, item.approval_column);
        END IF;
    END LOOP;

    FOR item IN
        SELECT * FROM (VALUES
            ('idx_ship_repair_facility_dashboard', 'ship_repair_facility', 'deleted_at', 'approval_status')
        ) AS values(index_name, table_name, deleted_column, approval_column)
    LOOP
        IF to_regclass(format('public.%I', item.table_name)) IS NOT NULL
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = item.table_name AND column_name = item.deleted_column)
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = item.table_name AND column_name = item.approval_column) THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I, %I)', item.index_name, item.table_name, item.deleted_column, item.approval_column);
        END IF;
    END LOOP;

    FOR item IN
        SELECT * FROM (VALUES
            ('idx_ports_spatial', 'ports'),
            ('idx_berths_spatial', 'berths'),
            ('idx_piers_spatial', 'piers'),
            ('idx_dry_ports_spatial', 'dry_ports'),
            ('idx_beacon_light_spatial', 'beacon_light'),
            ('idx_buoy_spatial', 'buoy'),
            ('idx_navigation_channel_spatial', 'navigation_channel'),
            ('idx_dike_revetment_spatial', 'dike_revetment'),
            ('idx_radar_station_spatial', 'radar_station'),
            ('idx_vts_system_spatial', 'vts_system'),
            ('idx_ship_repair_facility_spatial', 'ship_repair_facility'),
            ('idx_lighthouse_station_spatial', 'lighthouse_station'),
            ('idx_buoy_station_spatial', 'buoy_station'),
            ('idx_coastal_station_vts_spatial', 'coastal_station_vts'),
            ('idx_coastal_station_lrit_spatial', 'coastal_station_lrit'),
            ('idx_coastal_station_inmarsat_spatial', 'coastal_station_inmarsat')
        ) AS values(index_name, table_name)
    LOOP
        IF to_regclass(format('public.%I', item.table_name)) IS NOT NULL
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = item.table_name AND column_name = 'deleted_at')
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = item.table_name AND column_name = 'spatial_id') THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (deleted_at, spatial_id)', item.index_name, item.table_name);
        END IF;
    END LOOP;
END $$;
