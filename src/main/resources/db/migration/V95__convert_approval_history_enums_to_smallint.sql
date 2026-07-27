-- V95: Convert approval_level to smallint to match Hibernate 6 @Enumerated(EnumType.ORDINAL)
-- Default mapping for Enums in PostgresDialect is TINYINT/SMALLINT.
DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['approval_history', 'dike_revetment_approval_history'] LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN approval_level TYPE smallint', tbl);
            RAISE NOTICE 'V95: %.approval_level converted to smallint', tbl;
        END IF;
    END LOOP;
END $$;
