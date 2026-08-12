-- VTS system codes are labels and may be reused by multiple records.
-- Remove the legacy database-level uniqueness that was introduced when code
-- was added to vts_system. Keep the code column itself required by the API.
DO $$
DECLARE
    constraint_name TEXT;
    index_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'vts_system'
          AND c.contype = 'u'
          AND c.conkey = ARRAY[
              (SELECT a.attnum
               FROM pg_attribute a
               WHERE a.attrelid = t.oid
                 AND a.attname = 'code'
                 AND NOT a.attisdropped)
          ]::smallint[]
    LOOP
        EXECUTE format('ALTER TABLE public.vts_system DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;

    FOR index_name IN
        SELECT i.relname
        FROM pg_index ix
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'vts_system'
          AND ix.indisunique
          AND NOT ix.indisprimary
          AND ix.indnatts = 1
          AND ix.indkey[0] = (
              SELECT a.attnum
              FROM pg_attribute a
              WHERE a.attrelid = t.oid
                AND a.attname = 'code'
                AND NOT a.attisdropped
          )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I', index_name);
    END LOOP;
END $$;
