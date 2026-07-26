-- V90: Convert the audit columns (created_by / updated_by / deleted_by /
-- approved_by) to UUID, so the schema matches BaseEntity, which types them as UUID.
--
-- Runs after V84 and V86 so every table and column already carries its final
-- English name; V85 attempted this too early and has been reduced to a no-op.
--
-- Two safeguards:
--
--  * EXCLUDED holds the audit columns the entity model deliberately keeps as text.
--    adjustment_approvals.approved_by is `private String approver`;
--    port_planning, incidents, planning_adjustments and processing_progress keep
--    String audit fields; pending_approvals.approved_by is a foreign key to
--    app_users and already has the right type. Converting any of them would trade
--    one schema-validation failure for another.
--
--  * Values that are not valid UUIDs are set to NULL before the cast instead of
--    aborting the migration. The older code wrote usernames into these columns, and
--    a single such row would otherwise fail the whole deploy. Every column where
--    this happens is reported with RAISE NOTICE, so the discarded count is visible
--    in the startup log.
--
-- SAFE & IDEMPOTENT: only character-typed columns are touched, so a re-run is a
-- no-op.

DO $$
DECLARE
    excluded_cols CONSTANT text[] := ARRAY[
        'adjustment_approvals.approved_by',
        'incidents.updated_by',
        'pending_approvals.approved_by',
        'planning_adjustments.updated_by',
        'port_planning.created_by',
        'port_planning.updated_by',
        'processing_progress.updated_by'
    ];
    uuid_re CONSTANT text :=
        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

    r        record;
    bad_rows bigint;
BEGIN
    FOR r IN
        SELECT c.table_name, c.column_name
          FROM information_schema.columns c
          JOIN information_schema.tables t
            ON t.table_schema = c.table_schema
           AND t.table_name   = c.table_name
           AND t.table_type   = 'BASE TABLE'
         WHERE c.table_schema = 'public'
           AND c.column_name IN ('created_by', 'updated_by', 'deleted_by', 'approved_by')
           AND c.data_type IN ('character varying', 'character', 'text')
         ORDER BY c.table_name, c.column_name
    LOOP
        IF (r.table_name || '.' || r.column_name) = ANY (excluded_cols) THEN
            RAISE NOTICE 'V90: keeping %.% as text (entity declares it non-UUID)',
                r.table_name, r.column_name;
            CONTINUE;
        END IF;

        -- Clear anything that is not a UUID so the cast cannot abort the deploy.
        EXECUTE format(
            'UPDATE %I SET %I = NULL WHERE %I IS NOT NULL AND %I !~ %L',
            r.table_name, r.column_name, r.column_name, r.column_name, uuid_re);
        GET DIAGNOSTICS bad_rows = ROW_COUNT;
        IF bad_rows > 0 THEN
            RAISE NOTICE 'V90: %.% - cleared % non-UUID value(s) before conversion',
                r.table_name, r.column_name, bad_rows;
        END IF;

        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT', r.table_name, r.column_name);
        EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING NULLIF(%I, '''')::uuid',
            r.table_name, r.column_name, r.column_name);
    END LOOP;
END $$;
