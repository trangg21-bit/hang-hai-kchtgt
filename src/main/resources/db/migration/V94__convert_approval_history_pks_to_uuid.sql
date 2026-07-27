-- V94: Convert the primary keys and foreign keys of the remaining legacy tables
-- to UUID. Specifically, `approval_history` and `dike_revetment_approval_history`
-- were missed in V91 but their entities map IDs to UUIDs.

DO $$
DECLARE
    legacy_tables CONSTANT text[] := ARRAY[
        'approval_history', 'dike_revetment_approval_history'
    ];
    tbl      text;
    col      text;
    r        record;
    is_int   boolean;
    needs    boolean;
BEGIN
    CREATE TEMP TABLE _v94_fkcols (fk_owner text, fk_col text) ON COMMIT DROP;
    INSERT INTO _v94_fkcols (fk_owner, fk_col) VALUES
        ('approval_history', 'vts_system_id'),
        ('approval_history', 'navigation_channel_id'),
        ('approval_history', 'radar_station_id'),
        ('approval_history', 'ship_repair_facility_id'),
        ('dike_revetment_approval_history', 'dike_revetment_id');

    CREATE TEMP TABLE _v94_fk (fk_table text, fk_name text, fk_def text) ON COMMIT DROP;
    INSERT INTO _v94_fk (fk_table, fk_name, fk_def)
    SELECT rel.relname, con.conname, pg_get_constraintdef(con.oid)
      FROM pg_constraint con
      JOIN pg_class     rel    ON rel.oid = con.conrelid
      JOIN pg_namespace n      ON n.oid = rel.relnamespace
      LEFT JOIN pg_class refrel ON refrel.oid = con.confrelid
     WHERE con.contype = 'f'
       AND n.nspname = 'public'
       AND (rel.relname = ANY (legacy_tables) OR refrel.relname = ANY (legacy_tables));

    FOR r IN SELECT fk_table, fk_name FROM _v94_fk LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.fk_table, r.fk_name);
    END LOOP;

    FOREACH tbl IN ARRAY legacy_tables LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = tbl
                          AND table_type = 'BASE TABLE') THEN
            CONTINUE;
        END IF;

        SELECT data_type IN ('bigint', 'integer', 'smallint')
          INTO is_int
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'id';

        SELECT EXISTS (
            SELECT 1
              FROM _v94_fkcols f
              JOIN information_schema.columns c
                ON c.table_schema = 'public' AND c.table_name = f.fk_owner AND c.column_name = f.fk_col
             WHERE f.fk_owner = tbl AND c.data_type <> 'uuid'
        ) INTO needs;

        CONTINUE WHEN NOT COALESCE(is_int, false) AND NOT needs;

        IF COALESCE(is_int, false) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id DROP IDENTITY IF EXISTS', tbl);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id DROP DEFAULT', tbl);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id TYPE uuid USING gen_random_uuid()', tbl);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()', tbl);
            RAISE NOTICE 'V94: %.id converted to uuid', tbl;
        END IF;

        FOR col IN
            SELECT f.fk_col
              FROM _v94_fkcols f
              JOIN information_schema.columns c
                ON c.table_schema = 'public' AND c.table_name = f.fk_owner AND c.column_name = f.fk_col
             WHERE f.fk_owner = tbl AND c.data_type <> 'uuid'
        LOOP
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', tbl, col);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE uuid USING NULL::uuid', tbl, col);
            RAISE NOTICE 'V94: %.% converted to uuid', tbl, col;
        END LOOP;
    END LOOP;

    FOR r IN SELECT fk_table, fk_name, fk_def FROM _v94_fk LOOP
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', r.fk_table, r.fk_name, r.fk_def);
    END LOOP;
END $$;
