-- V92: Add missing approved_at column to adjustment_approvals table if it does not exist.
-- Fixes startup failure due to Hibernate schema validation mismatch.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'adjustment_approvals' 
          AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE public.adjustment_approvals ADD COLUMN approved_at DATE;
    END IF;
END $$;
