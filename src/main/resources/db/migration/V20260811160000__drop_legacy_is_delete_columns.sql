-- Flyway migration to drop legacy is_delete, is_deleted, update_date, updated_date, create_date, created_date columns from all public schema tables

DO $$
DECLARE
    t text;
    col text;
    legacy_cols text[] := ARRAY['is_delete', 'is_deleted', 'update_date', 'updated_date', 'create_date', 'created_date'];
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        FOREACH col IN ARRAY legacy_cols
        LOOP
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = col) THEN
                EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS %I;', t, col);
            END IF;
        END LOOP;
    END LOOP;
END $$;
