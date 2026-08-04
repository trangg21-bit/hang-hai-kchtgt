-- Revert columns in tables where Java entity expects VARCHAR(100) instead of UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'created_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'updated_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by TYPE VARCHAR(36) USING uploaded_by::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approved_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN approved_by TYPE VARCHAR(100) USING approved_by::text;
    END IF;
END $$;
