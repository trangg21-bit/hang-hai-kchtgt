-- Convert approved_by, approver_level_1, approver_level_2 to UUID across station & buoy tables (excluding adjustment_approvals which uses String/varchar)
DO $$
DECLARE
    tbl RECORD;
    col RECORD;
BEGIN
    -- Revert adjustment_approvals.approved_by to VARCHAR(100) if it was changed to UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approved_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN approved_by TYPE VARCHAR(100) USING approved_by::text;
    END IF;

    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name != 'adjustment_approvals'
    LOOP
        FOR col IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = tbl.table_name 
              AND column_name IN ('approved_by', 'approver_level_1', 'approver_level_2')
              AND data_type IN ('character varying', 'text', 'varchar')
        LOOP
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING (CASE WHEN %I ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN %I::uuid ELSE NULL END)', 
                           tbl.table_name, col.column_name, col.column_name, col.column_name);
        END LOOP;
    END LOOP;
END $$;
