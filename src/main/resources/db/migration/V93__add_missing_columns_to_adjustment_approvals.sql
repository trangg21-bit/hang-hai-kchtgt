-- V93: Add remaining missing columns to adjustment_approvals table.
-- Fixes Hibernate schema-validation failures if the legacy table was missing all original columns.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'planning_adjustment_id') THEN
        ALTER TABLE public.adjustment_approvals ADD COLUMN planning_adjustment_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approval_level') THEN
        ALTER TABLE public.adjustment_approvals ADD COLUMN approval_level VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'status') THEN
        ALTER TABLE public.adjustment_approvals ADD COLUMN status VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approved_by') THEN
        ALTER TABLE public.adjustment_approvals ADD COLUMN approved_by VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'notes') THEN
        ALTER TABLE public.adjustment_approvals ADD COLUMN notes VARCHAR(500);
    END IF;
END $$;
