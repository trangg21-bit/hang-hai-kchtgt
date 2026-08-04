-- Convert created_by, updated_by, deleted_by, approved_by to UUID for ALL tables EXCEPT the 9 specific legacy/text string entities
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
              'planning_adjustments', 'port_planning', 'incidents', 'documents',
              'planning_files', 'ship_repair_facility_attachments', 'radar_station_attachments',
              'dike_revetment_attachments', 'adjustment_approvals'
          )
    LOOP
        FOR col IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = tbl.table_name 
              AND column_name IN ('approved_by', 'created_by', 'updated_by', 'deleted_by')
              AND data_type IN ('character varying', 'text', 'varchar')
        LOOP
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING (CASE WHEN %I ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN %I::uuid ELSE NULL END)', 
                           tbl.table_name, col.column_name, col.column_name, col.column_name);
        END LOOP;
    END LOOP;
END $$;
