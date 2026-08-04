-- Force convert approval_history.status to SMALLINT
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'status') THEN
        ALTER TABLE public.approval_history 
            ALTER COLUMN status TYPE SMALLINT USING (CASE WHEN status::text ~ '^[0-9]+$' THEN status::text::smallint ELSE 1 END);
    END IF;
END $$;
