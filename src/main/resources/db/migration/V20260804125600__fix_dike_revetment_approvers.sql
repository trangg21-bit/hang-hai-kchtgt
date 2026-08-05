-- Fix dike_revetment approver columns to UUID and ensure documents.uploaded_by remains VARCHAR(36)
DO $$
BEGIN
    -- Revert documents.uploaded_by to VARCHAR(36) if it was changed to UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by TYPE VARCHAR(36) USING uploaded_by::text;
    END IF;

    -- Fix dike_revetment approver_level1 and approver_level2 to UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approver_level1' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::uuid ELSE NULL END);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approver_level2' AND data_type IN ('character varying', 'text', 'varchar')) THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::uuid ELSE NULL END);
    END IF;
END $$;
