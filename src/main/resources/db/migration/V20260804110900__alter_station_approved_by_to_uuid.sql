-- V20260804110900: Dynamically convert all user ID columns to UUID and date columns to TIMESTAMP
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Convert varchar user ID columns to UUID across all public tables
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type IN ('character varying', 'varchar', 'text')
          AND table_name NOT IN (
              'adjustment_approvals', 'port_planning', 'planning_adjustments',
              'incidents', 'documents', 'planning_files'
          )
          AND column_name IN ('approved_by', 'approver_level1', 'approver_level2', 'created_by', 'updated_by', 'deleted_by', 'operator_id', 'actor_id', 'org_unit_id', 'unit_id', 'operating_org_id', 'port_id', 'waterway_id', 'waterway_route_id', 'spatial_id')
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING CASE WHEN %I IS NULL OR %I::text = '''' THEN NULL WHEN %I::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN %I::text::uuid ELSE NULL END',
            r.table_name, r.column_name, r.column_name, r.column_name, r.column_name, r.column_name
        );
    END LOOP;

    -- 2. Convert date/varchar approval date columns to TIMESTAMP WITHOUT TIME ZONE
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type IN ('character varying', 'varchar', 'text', 'date')
          AND column_name IN ('approved_date')
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ALTER COLUMN %I TYPE TIMESTAMP WITHOUT TIME ZONE USING CASE WHEN %I IS NULL OR %I::text = '''' THEN NULL ELSE %I::timestamp END',
            r.table_name, r.column_name, r.column_name, r.column_name, r.column_name
        );
    END LOOP;
END $$;
