-- V20260911120000: Ensure approval_level column exists in infrastructure_history
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'infrastructure_history'
          AND column_name = 'approval_level'
    ) THEN
        ALTER TABLE public.infrastructure_history ADD COLUMN approval_level VARCHAR(32);
        RAISE NOTICE 'Added column approval_level to infrastructure_history';
    END IF;
END $$;
