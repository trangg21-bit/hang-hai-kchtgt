-- Fix data_sharing_logs deleted_by to UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'deleted_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN deleted_by TYPE UUID USING (CASE WHEN deleted_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN deleted_by::uuid ELSE NULL END);
    END IF;
END $$;
