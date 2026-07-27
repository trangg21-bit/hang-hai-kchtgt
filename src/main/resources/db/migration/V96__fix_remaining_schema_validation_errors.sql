-- V96: Fix remaining schema validation errors that Hibernate ddl-auto:update cannot resolve
-- This includes identity column conversions, null checks for NOT NULL columns, and safe casting from varchar to uuid.

-- 1. Revert approved_by to VARCHAR(255) for station tables where Java explicitly uses String
DO $$
DECLARE
    tbl TEXT;
    station_tables TEXT[] := ARRAY[
        'buoy_station', 'coastal_station_cospas_sarsat', 'coastal_station_haiphong',
        'coastal_station_inmarsat', 'coastal_station_lrit', 'coastal_station_vts',
        'lighthouse_station'
    ];
BEGIN
    FOREACH tbl IN ARRAY station_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'approved_by' AND data_type = 'uuid') THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN approved_by TYPE character varying(255)', tbl);
        END IF;
    END LOOP;
END $$;

-- 2. Fix IDENTITY columns blocking id -> uuid conversion
DO $$
DECLARE
    tbl TEXT;
    identity_tables TEXT[] := ARRAY[
        'shared_data', 'share_history', 'lookup_results', 'trade_flows',
        'dike_revetment_attachment', 'navigation_channel_attachment',
        'radar_station_attachment', 'ship_repair_facility_attachment',
        'vts_system_attachment'
    ];
BEGIN
    FOREACH tbl IN ARRAY identity_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name=tbl AND column_name='id'
              AND data_type IN ('bigint','integer','smallint')
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id DROP IDENTITY IF EXISTS', tbl);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id DROP DEFAULT', tbl);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id TYPE uuid USING gen_random_uuid()', tbl);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()', tbl);
        END IF;
    END LOOP;
END $$;

-- 3. Fix NOT NULL columns that contain nulls
DO $$
BEGIN
    -- ship_repair_facility.created_date
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ship_repair_facility' AND column_name='created_date') THEN
        EXECUTE 'UPDATE ship_repair_facility SET created_date = COALESCE(created_at, NOW()) WHERE created_date IS NULL';
    ELSE
        EXECUTE 'ALTER TABLE ship_repair_facility ADD COLUMN created_date timestamp(6) NOT NULL DEFAULT NOW()';
    END IF;

    -- ship_repair_facility.is_deleted
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ship_repair_facility' AND column_name='is_deleted') THEN
        EXECUTE 'UPDATE ship_repair_facility SET is_deleted = false WHERE is_deleted IS NULL';
        EXECUTE 'ALTER TABLE ship_repair_facility ALTER COLUMN is_deleted SET NOT NULL';
    ELSE
        EXECUTE 'ALTER TABLE ship_repair_facility ADD COLUMN is_deleted boolean NOT NULL DEFAULT false';
    END IF;

    -- radar_station.created_date
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='radar_station' AND column_name='created_date') THEN
        EXECUTE 'UPDATE radar_station SET created_date = COALESCE(created_at, NOW()) WHERE created_date IS NULL';
    ELSE
        EXECUTE 'ALTER TABLE radar_station ADD COLUMN created_date timestamp(6) NOT NULL DEFAULT NOW()';
    END IF;

    -- vts_system.created_date
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vts_system' AND column_name='created_date') THEN
        EXECUTE 'UPDATE vts_system SET created_date = COALESCE(created_at, NOW()) WHERE created_date IS NULL';
    ELSE
        EXECUTE 'ALTER TABLE vts_system ADD COLUMN created_date timestamp(6) NOT NULL DEFAULT NOW()';
    END IF;
END $$;

-- 4. Fix varchar -> uuid cast errors (cannot cast automatically)
DO $$
DECLARE
    pairs TEXT[][] := ARRAY[
        ['form_approval_history', 'actor'],
        ['form_approval_history', 'form_id'],
        ['statistics_forms', 'approver_level1'],
        ['statistics_forms', 'approver_level2'],
        ['statistics_forms', 'quy_hoach_id'],
        ['share_history', 'shared_data_id']
    ];
    i INT;
    tbl TEXT;
    col TEXT;
BEGIN
    FOR i IN 1..array_length(pairs, 1) LOOP
        tbl := pairs[i][1];
        col := pairs[i][2];
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name=tbl AND column_name=col
              AND data_type <> 'uuid'
        ) THEN
            EXECUTE format(
                'UPDATE public.%I SET %I = NULL WHERE %I IS NOT NULL AND %I::text !~ ''^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$''',
                tbl, col, col, col
            );
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', tbl, col);
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE uuid USING %I::text::uuid', tbl, col, col);
        END IF;
    END LOOP;
END $$;

-- 5. Fix ship_repair_facility.facility_type varchar -> integer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='ship_repair_facility' AND column_name='facility_type'
          AND data_type <> 'integer'
    ) THEN
        EXECUTE 'ALTER TABLE ship_repair_facility ALTER COLUMN facility_type TYPE integer USING CASE WHEN facility_type ~ ''^[0-9]+$'' THEN facility_type::integer ELSE 0 END';
    END IF;
END $$;
