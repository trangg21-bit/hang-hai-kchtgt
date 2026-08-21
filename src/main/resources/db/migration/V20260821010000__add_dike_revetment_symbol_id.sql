-- Add symbol_id column to dike_revetment so the GIS symbol (biểu tượng bản đồ)
-- selected in the form is persisted and returned in detail view.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'symbol_id') THEN
        ALTER TABLE public.dike_revetment ADD COLUMN symbol_id UUID;
    END IF;
END $$;
