-- Rename the legacy image column only when the database still has it.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'map_symbols'
          AND column_name = 'hinh_anh'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'map_symbols'
          AND column_name = 'image'
    ) THEN
        ALTER TABLE public.map_symbols RENAME COLUMN hinh_anh TO image;
    END IF;
END
$$;
