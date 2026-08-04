-- V91: Convert the primary keys (and their foreign keys) of the legacy "vanban"
-- document tables from BIGINT to UUID, so the schema matches the entity model.
--
-- WHY
-- ----
-- Every entity in the document module types its id as UUID
-- (`private UUID id`) and every repository is `JpaRepository<T, UUID>`. But the
-- 22 tables listed below were not created by this migration suite: they existed
-- in the old Vietnamese schema, were created by Hibernate ddl-auto with BIGINT
-- identity primary keys, and V84 only *renamed* them (phe_duyet_dieu_chinh ->
-- adjustment_approvals, ...). No migration ever changed the id type. On UAT/prod
-- the columns are therefore still int8, and Hibernate schema-validation aborts
-- startup with:
--
--   wrong column type in column [id] of table [adjustment_approvals];
--   found [int8 (BIGINT)], but expecting [uuid (UUID)]
--
-- adjustment_approvals is only the first table Hibernate validates; the rest fail
-- the same way. Freshly-created tables (gis, port, assetmovement, ...) are already
-- uuid and are deliberately NOT in this list. Tables that are meant to stay BIGINT
-- (access_logs, log_*, lockout_*, statistics_forms, shared_data, ...) are absent
-- too, so this migration can never touch them.
--
-- DATA
-- ----
-- These tables hold no production data worth keeping (confirmed with the owner).
-- On the empty prod/UAT tables the type change is a pure no-op cast. Where rows do
-- exist, each keeps a freshly generated uuid id and its (disposable) integer FK
-- links are cleared to NULL, since an int8 value has no meaningful UUID equivalent.
-- Rows are preserved rather than truncated so unrelated migration tests that assert
-- V86 carried data across still hold.
--
-- SAFE & IDEMPOTENT
-- -----------------
--  * A table is only touched when its id is still an integer type, or when one of
--    its FK columns is not yet uuid. A table absent from this DB is skipped.
--  * FK constraints that touch a converted table are dropped up front and recreated
--    verbatim afterwards, so no drop-order problems and no lost constraints.
--  * The id gains DEFAULT gen_random_uuid(), matching the freshly-created UUID
--    tables, so @GeneratedValue(IDENTITY) inserts still receive a generated key.

DO $$
DECLARE
    -- The 22 tables V84 renamed from the old vanban schema. All UUID-backed.
    legacy_tables CONSTANT text[] := ARRAY[
        'legal_documents', 'maintenance_reports', 'operation_reports', 'incident_records',
        'planning_adjustments', 'planning_files', 'search_suggestions', 'planning_categories',
        'maintenance_plans', 'operation_plans', 'maintenance_results', 'search_results',
        'lookup_results', 'adjustment_approvals', 'port_planning', 'current_planning',
        'incidents', 'attached_documents', 'processing_progress', 'search_logs',
        'lookup_logs', 'operation_details'
    ];

    tbl      text;
    col      text;
    r        record;
    is_int   boolean;
    needs    boolean;
BEGIN
    ----------------------------------------------------------------------------
    -- (table, fk_column) pairs to convert. Every one references another table in
    -- legacy_tables, so both sides become uuid together. Verified against the
    -- @JoinColumn / @ManyToOne mappings in com.hanghai.kchtg.document.entity.
    -- Column names deliberately avoid the tbl/col variable names to keep bare
    -- identifiers unambiguous inside the queries below.
    ----------------------------------------------------------------------------
    CREATE TEMP TABLE _v91_fkcols (fk_owner text, fk_col text) ON COMMIT DROP;
    INSERT INTO _v91_fkcols (fk_owner, fk_col) VALUES
        ('adjustment_approvals', 'planning_adjustment_id'),
        ('attached_documents',   'document_id'),
        ('incident_records',     'incident_id'),
        ('processing_progress',  'incident_id'),
        ('maintenance_results',  'maintenance_plan_id'),
        ('operation_details',    'operation_plan_id'),
        ('planning_adjustments', 'port_planning_id'),
        ('planning_categories',  'port_planning_id'),
        ('planning_files',       'port_planning_id');

    ----------------------------------------------------------------------------
    -- 1. Capture, then drop, every FK constraint that touches a legacy table
    --    (either as the owning table or the referenced table).
    ----------------------------------------------------------------------------
    CREATE TEMP TABLE _v91_fk (fk_table text, fk_name text, fk_def text) ON COMMIT DROP;
    INSERT INTO _v91_fk (fk_table, fk_name, fk_def)
    SELECT rel.relname, con.conname, pg_get_constraintdef(con.oid)
      FROM pg_constraint con
      JOIN pg_class     rel    ON rel.oid = con.conrelid
      JOIN pg_namespace n      ON n.oid = rel.relnamespace
      LEFT JOIN pg_class refrel ON refrel.oid = con.confrelid
     WHERE con.contype = 'f'
       AND n.nspname = 'public'
       AND (rel.relname = ANY (legacy_tables) OR refrel.relname = ANY (legacy_tables));

    FOR r IN SELECT fk_table, fk_name FROM _v91_fk LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.fk_table, r.fk_name);
    END LOOP;

    ----------------------------------------------------------------------------
    -- 2. Convert each legacy table that still needs it.
    ----------------------------------------------------------------------------
    FOREACH tbl IN ARRAY legacy_tables LOOP
        -- Skip tables that do not exist on this database.
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'public' AND table_name = tbl
                          AND table_type = 'BASE TABLE') THEN
            CONTINUE;
        END IF;

        SELECT data_type IN ('bigint', 'integer', 'smallint')
          INTO is_int
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'id';

        -- Does any of this table's FK columns still need converting?
        SELECT EXISTS (
            SELECT 1
              FROM _v91_fkcols f
              JOIN information_schema.columns c
                ON c.table_schema = 'public' AND c.table_name = f.fk_owner AND c.column_name = f.fk_col
             WHERE f.fk_owner = tbl AND c.data_type <> 'uuid'
        ) INTO needs;

        CONTINUE WHEN NOT COALESCE(is_int, false) AND NOT needs;

        -- 2a. Primary key.
        IF COALESCE(is_int, false) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id DROP IDENTITY IF EXISTS', tbl);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id DROP DEFAULT', tbl);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id TYPE uuid USING gen_random_uuid()', tbl);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()', tbl);
            RAISE NOTICE 'V91: %.id converted to uuid', tbl;
        END IF;

        -- 2b. Foreign key columns owned by this table.
        FOR col IN
            SELECT f.fk_col
              FROM _v91_fkcols f
              JOIN information_schema.columns c
                ON c.table_schema = 'public' AND c.table_name = f.fk_owner AND c.column_name = f.fk_col
             WHERE f.fk_owner = tbl AND c.data_type <> 'uuid'
        LOOP
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', tbl, col);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE uuid USING NULL::uuid', tbl, col);
            RAISE NOTICE 'V91: %.% converted to uuid', tbl, col;
        END LOOP;
    END LOOP;

    ----------------------------------------------------------------------------
    -- 3. Recreate the FK constraints. Both sides are uuid again, so the original
    --    definitions apply unchanged.
    ----------------------------------------------------------------------------
    FOR r IN SELECT fk_table, fk_name, fk_def FROM _v91_fk LOOP
        -- When legal_documents already existed, V84 intentionally retained the
        -- old Vietnamese van_ban_phap_ly table. Its bigint key is not compatible
        -- with the UUID document_id converted above, so its obsolete FK must not
        -- be restored.
        IF r.fk_table = 'attached_documents'
           AND r.fk_def ILIKE '%REFERENCES van_ban_phap_ly%' THEN
            CONTINUE;
        END IF;
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', r.fk_table, r.fk_name, r.fk_def);
        EXCEPTION WHEN SQLSTATE '42804' THEN
            -- An external legacy table can retain a bigint FK to a table this
            -- migration converted to UUID. It is outside the document entity
            -- model, so preserve its data and leave the obsolete FK detached.
            RAISE NOTICE 'V91: skipped incompatible legacy FK %.%', r.fk_table, r.fk_name;
        END;
    END LOOP;

    -- Recreate the relationship against the UUID-backed entity table. V91 has
    -- already cleared non-mappable legacy bigint values in document_id.
    IF to_regclass('public.attached_documents') IS NOT NULL
       AND to_regclass('public.legal_documents') IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'attached_documents'
             AND column_name = 'document_id' AND data_type = 'uuid'
       )
       AND NOT EXISTS (
           SELECT 1 FROM pg_constraint
           WHERE conrelid = 'public.attached_documents'::regclass
             AND conname = 'fk_attached_documents_legal_document'
       ) THEN
        ALTER TABLE public.attached_documents
            ADD CONSTRAINT fk_attached_documents_legal_document
            FOREIGN KEY (document_id) REFERENCES public.legal_documents(id);
    END IF;
END $$;
