-- Force convert vts_system.approval_status to SMALLINT if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approval_status') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE SMALLINT USING (CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint ELSE 1 END);
    END IF;
END $$;
