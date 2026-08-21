-- Rename Vietnamese-named columns to standard English (ma -> code, cang_bien_id -> seaport_id)
-- so identifiers follow the naming convention (English for schema/columns).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'ma') THEN
        ALTER TABLE public.dike_revetment RENAME COLUMN ma TO code;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'cang_bien_id') THEN
        ALTER TABLE public.dike_revetment RENAME COLUMN cang_bien_id TO seaport_id;
    END IF;
END $$;
