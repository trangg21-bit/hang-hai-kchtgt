DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'uploaded_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN uploaded_by TYPE UUID USING CASE WHEN uploaded_by IS NULL OR uploaded_by::text = '' THEN NULL WHEN uploaded_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN uploaded_by::text::uuid ELSE NULL END;
    END IF;
END $$;
