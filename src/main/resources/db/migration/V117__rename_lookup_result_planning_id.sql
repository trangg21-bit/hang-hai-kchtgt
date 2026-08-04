-- Use the English database naming convention for the lookup result relation.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'lookup_results'
          AND column_name = 'quy_hoach_id'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'lookup_results'
          AND column_name = 'planning_id'
    ) THEN
        ALTER TABLE public.lookup_results
            RENAME COLUMN quy_hoach_id TO planning_id;
    END IF;
END $$;
