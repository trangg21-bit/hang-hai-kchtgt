-- Fix documents created_by/updated_by/deleted_by to UUID while keeping uploaded_by as VARCHAR(36)
DO $$
DECLARE
    tbl RECORD;
    col RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'created_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.documents ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN created_by::uuid ELSE NULL END);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'updated_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.documents ALTER COLUMN updated_by TYPE UUID USING (CASE WHEN updated_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN updated_by::uuid ELSE NULL END);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'deleted_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.documents ALTER COLUMN deleted_by TYPE UUID USING (CASE WHEN deleted_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN deleted_by::uuid ELSE NULL END);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by TYPE VARCHAR(36) USING uploaded_by::text;
    END IF;

    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN (
              'planning_adjustments', 'port_planning', 'incidents', 'planning_files', 'adjustment_approvals',
              'documents', 'ship_repair_facility_attachments', 'radar_station_attachments', 'dike_revetment_attachments'
          )
    LOOP
        FOR col IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = tbl.table_name 
              AND column_name IN ('approved_by', 'created_by', 'updated_by', 'deleted_by', 'uploaded_by')
              AND data_type IN ('character varying', 'text', 'varchar')
        LOOP
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING (CASE WHEN %I ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN %I::uuid ELSE NULL END)', 
                           tbl.table_name, col.column_name, col.column_name, col.column_name);
        END LOOP;
    END LOOP;
END $$;
