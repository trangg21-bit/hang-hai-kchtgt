-- Convert approval_history vts_system_id and approved_by to UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'vts_system_id' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.approval_history ALTER COLUMN vts_system_id TYPE UUID USING (CASE WHEN vts_system_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN vts_system_id::uuid ELSE NULL END);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'approved_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.approval_history ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::uuid ELSE NULL END);
    END IF;
END $$;
