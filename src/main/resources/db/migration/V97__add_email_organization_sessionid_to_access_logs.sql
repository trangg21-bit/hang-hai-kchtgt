-- V97: Add new F-005 fields to access_logs

ALTER TABLE IF EXISTS access_logs ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE IF EXISTS access_logs ADD COLUMN IF NOT EXISTS organization VARCHAR(200);
ALTER TABLE IF EXISTS access_logs ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);

-- Convert id from BIGINT/IDENTITY to UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='access_logs' AND column_name='id'
          AND data_type IN ('bigint','integer','smallint')
    ) THEN
        EXECUTE 'ALTER TABLE public.access_logs ALTER COLUMN id DROP IDENTITY IF EXISTS';
        EXECUTE 'ALTER TABLE public.access_logs ALTER COLUMN id DROP DEFAULT';
        EXECUTE 'ALTER TABLE public.access_logs ALTER COLUMN id TYPE uuid USING gen_random_uuid()';
        EXECUTE 'ALTER TABLE public.access_logs ALTER COLUMN id SET DEFAULT gen_random_uuid()';
    END IF;
END $$;

