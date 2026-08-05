-- Revert processing_progress created_by and updated_by to VARCHAR(100)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'processing_progress' AND column_name = 'created_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.processing_progress ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'processing_progress' AND column_name = 'updated_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.processing_progress ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
END $$;
