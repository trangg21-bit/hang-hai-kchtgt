-- Convert port_attachments.uploaded_by to UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'uploaded_by' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.port_attachments ALTER COLUMN uploaded_by TYPE UUID USING (CASE WHEN uploaded_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN uploaded_by::uuid ELSE NULL END);
    END IF;
END $$;
