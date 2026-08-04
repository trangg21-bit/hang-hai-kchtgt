-- Convert all approver, approved_by, created_by, updated_by, deleted_by columns to UUID across all tables (except adjustment_approvals)
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
              'adjustment_approvals', 'port_planning', 'planning_adjustments',
              'incidents', 'documents', 'planning_files'
          )
    LOOP
        FOR col IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = tbl.table_name 
              AND column_name IN ('approved_by', 'approver_level1', 'approver_level_1', 'approver_level2', 'approver_level_2', 'created_by', 'updated_by', 'deleted_by', 'uploaded_by')
              AND data_type IN ('character varying', 'text', 'varchar')
        LOOP
            IF col.is_nullable = 'NO' THEN
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING COALESCE(CASE WHEN %I ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN %I::uuid ELSE NULL END, ''00000000-0000-0000-0000-000000000000''::uuid)', 
                               tbl.table_name, col.column_name, col.column_name, col.column_name);
            ELSE
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING (CASE WHEN %I ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN %I::uuid ELSE NULL END)', 
                               tbl.table_name, col.column_name, col.column_name, col.column_name);
            END IF;
        END LOOP;
    END LOOP;
END $$;
