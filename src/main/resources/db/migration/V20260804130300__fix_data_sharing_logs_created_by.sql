-- Fix data_sharing_logs created_by, updated_by, deleted_by to UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'created_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN created_by::uuid ELSE NULL END);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'updated_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN updated_by TYPE UUID USING (CASE WHEN updated_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN updated_by::uuid ELSE NULL END);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'deleted_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN deleted_by TYPE UUID USING (CASE WHEN deleted_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN deleted_by::uuid ELSE NULL END);
    END IF;
END $$;
