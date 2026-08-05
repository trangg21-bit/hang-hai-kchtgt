-- V20260804112700: Revert planning_files.uploaded_by to VARCHAR(100)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
END $$;
