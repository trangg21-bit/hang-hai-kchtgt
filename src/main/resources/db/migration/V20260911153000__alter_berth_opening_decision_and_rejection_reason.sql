-- V20260911153000__alter_berth_opening_decision_and_rejection_reason.sql
-- Increase opening_decision to VARCHAR(2000) and rejection_reason to TEXT to match piers and avoid truncation/validation errors

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'berths' 
          AND column_name = 'opening_decision'
    ) THEN
        ALTER TABLE public.berths ALTER COLUMN opening_decision TYPE VARCHAR(2000);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'berths' 
          AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE public.berths ALTER COLUMN rejection_reason TYPE TEXT;
    END IF;
END $$;
