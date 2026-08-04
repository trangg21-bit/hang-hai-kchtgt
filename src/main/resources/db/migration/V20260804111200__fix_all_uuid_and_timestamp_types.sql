-- V20260804111200: Targeted type alterations for Station entities & Revert adjustment_approvals
DO $$
BEGIN
    -- 1. Revert adjustment_approvals.approved_by back to VARCHAR(100)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approved_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN approved_by TYPE VARCHAR(100) USING approved_by::text;
    END IF;

    -- 2. approval_history.approved_date -> TIMESTAMP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'approved_date') THEN
        ALTER TABLE public.approval_history ALTER COLUMN approved_date TYPE TIMESTAMP WITHOUT TIME ZONE USING approved_date::timestamp;
    END IF;

    -- 3. Station approved_by -> UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'approved_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'approved_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'approved_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'approved_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'approved_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'approved_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'approved_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    -- 4. Station approver_level1 & approver_level2 -> UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approver_level1' AND udt_name != 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approver_level2' AND udt_name != 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approver_level1' AND udt_name != 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approver_level2' AND udt_name != 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approver_level1' AND udt_name != 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approver_level2' AND udt_name != 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approver_level1' AND udt_name != 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approver_level2' AND udt_name != 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approver_level1' AND udt_name != 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approver_level2' AND udt_name != 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END;
    END IF;
END $$;
