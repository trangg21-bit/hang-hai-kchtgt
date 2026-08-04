-- Convert vts_system.condition_status to SMALLINT
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'condition_status') THEN
        ALTER TABLE public.vts_system ALTER COLUMN condition_status TYPE SMALLINT USING (CASE WHEN condition_status::text ~ '^[0-9]+$' THEN condition_status::text::smallint ELSE 1 END);
    END IF;
END $$;
