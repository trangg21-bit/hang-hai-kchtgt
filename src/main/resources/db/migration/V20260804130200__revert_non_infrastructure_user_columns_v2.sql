-- Revert user/approver columns back to VARCHAR for all non-infrastructure tables that expect VARCHAR in JPA entities
DO $$
DECLARE
    tbl RECORD;
    col RECORD;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN (
              'vts_system', 'vts_system_attachment', 'ship_repair_facility', 'radar_station',
              'navigation_channel', 'buoy_station', 'lighthouse_station', 'coastal_station_cospas_sarsat',
              'coastal_station_haiphong', 'coastal_station_inmarsat', 'coastal_station_lrit',
              'coastal_station_vts', 'beacon_light', 'buoy', 'berth', 'dike_revetment',
              'pending_approvals', 'approval_history'
          )
    LOOP
        FOR col IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = tbl.table_name 
              AND column_name IN ('approved_by', 'created_by', 'updated_by', 'deleted_by', 'uploaded_by')
              AND data_type = 'uuid'
        LOOP
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE VARCHAR(100) USING %I::text', 
                           tbl.table_name, col.column_name, col.column_name);
        END LOOP;
    END LOOP;

    -- Special case for documents table which uses VARCHAR(36)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by') THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by TYPE VARCHAR(36) USING uploaded_by::text;
    END IF;
END $$;
