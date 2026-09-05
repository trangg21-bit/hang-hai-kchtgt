-- =====================================================================
-- V20260905110000__x_port_planning_update.sql
-- F-132/133/134 PortPlanning delta (design plan §5.2; engine: PostgreSQL)
--   New columns + status STRING->ORDINAL INT conversion + audit fix +
--   org_unit_id backfill (fail-closed) + planning_categories extension +
--   port_planning_cargo_forecast child table.
-- House style: guarded ALTERs (V20260803370000) + fail-closed backfill
-- (V20260826170000:96,108,112). Never DROP COLUMN existing data columns.
-- =====================================================================

-- 5.2.1 New columns (widths superseded by design §2.1 D7-FINAL:
--        planning_group stored as ORDINAL INT via PortPlanningGroup enum;
--        seaport_group VARCHAR(100)).
ALTER TABLE public.port_planning
    ADD COLUMN IF NOT EXISTS org_unit_id UUID,
    ADD COLUMN IF NOT EXISTS decision_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS decision_date DATE,
    ADD COLUMN IF NOT EXISTS planning_group INTEGER,
    ADD COLUMN IF NOT EXISTS seaport_id UUID,
    ADD COLUMN IF NOT EXISTS seaport_group VARCHAR(100),
    ADD COLUMN IF NOT EXISTS dry_port_id UUID,
    ADD COLUMN IF NOT EXISTS plan_to_year INT,
    ADD COLUMN IF NOT EXISTS plan_content VARCHAR(4000),
    ADD COLUMN IF NOT EXISTS land_water_demand VARCHAR(4000),
    ADD COLUMN IF NOT EXISTS capital_demand VARCHAR(4000),
    ADD COLUMN IF NOT EXISTS implementation_solution VARCHAR(4000),
    ADD COLUMN IF NOT EXISTS priority_projects VARCHAR(4000),
    ADD COLUMN IF NOT EXISTS implementation_org VARCHAR(4000),
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- 5.2.2 status VARCHAR -> INT (ORDINAL): legacy values only (0 = DRAFT has no legacy rows).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'port_planning'
                 AND column_name = 'status' AND udt_name = 'varchar') THEN
        ALTER TABLE public.port_planning
            ALTER COLUMN status TYPE INTEGER
            USING CASE status
                      WHEN 'HIEN_HANH' THEN 1
                      WHEN 'DA_THAY_THE' THEN 2
                      WHEN 'LICH_SU' THEN 3
                      ELSE NULL END;
    END IF;
END $$;

-- 5.2.3 Audit + org_unit_id backfill + NOT NULL (mirror §5.1 steps 4-5).
DO $$
DECLARE
    v_remaining INTEGER;
BEGIN
    -- (a) Best-effort created_by backfill from legacy audit names.
    UPDATE public.port_planning p
    SET created_by = u.id
    FROM public.users u
    WHERE p.created_by IS NULL
      AND p.updated_by IS NOT NULL
      AND (u.full_name = p.updated_by OR u.username = p.updated_by);
    -- (b) Guarded updated_by VARCHAR -> UUID cast.
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'port_planning'
                 AND column_name = 'updated_by' AND udt_name = 'varchar') THEN
        ALTER TABLE public.port_planning
            ALTER COLUMN updated_by TYPE UUID
            USING CASE WHEN updated_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                       THEN updated_by::uuid ELSE NULL END;
    END IF;
    -- (c) org_unit_id backfill from resolved creator + fail-closed check.
    UPDATE public.port_planning p
    SET org_unit_id = u.org_unit_id
    FROM public.users u
    WHERE p.org_unit_id IS NULL
      AND p.created_by = u.id
      AND u.org_unit_id IS NOT NULL;

    SELECT COUNT(*) INTO v_remaining
    FROM public.port_planning
    WHERE org_unit_id IS NULL;

    IF v_remaining > 0 THEN
        RAISE EXCEPTION 'F-132 backfill failed: % port_planning row(s) still have NULL org_unit_id. Assign an org_unit_id manually for legacy rows whose creator cannot be resolved, then re-run this migration file.', v_remaining;
    END IF;

    ALTER TABLE public.port_planning ALTER COLUMN org_unit_id SET NOT NULL;
END $$;

-- 5.2.4 Extend planning_categories with the §4.1 detail columns (D9;
--        table name kept, no rename). Widths per D7-FINAL.
ALTER TABLE public.planning_categories
    ADD COLUMN IF NOT EXISTS phase VARCHAR(50),
    ADD COLUMN IF NOT EXISTS port_category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS port_id UUID,
    ADD COLUMN IF NOT EXISTS port_name VARCHAR(300),
    ADD COLUMN IF NOT EXISTS exploitation_function VARCHAR(200),
    ADD COLUMN IF NOT EXISTS classification VARCHAR(100),
    ADD COLUMN IF NOT EXISTS berth_count INT,
    ADD COLUMN IF NOT EXISTS length DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS ship_size VARCHAR(100),
    ADD COLUMN IF NOT EXISTS capacity DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS land_area DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS water_area DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS note VARCHAR(500);

-- Detail rows of the new matrix (rows 25-38) carry phase + port identity instead
-- of the legacy category_name → the legacy NOT NULL constraint no longer fits.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'planning_categories'
                 AND column_name = 'category_name' AND is_nullable = 'NO') THEN
        ALTER TABLE public.planning_categories ALTER COLUMN category_name DROP NOT NULL;
    END IF;
END $$;

-- 5.2.5 Cargo forecast child table (F-132 matrix rows 18-24; §4.1).
CREATE TABLE IF NOT EXISTS public.port_planning_cargo_forecast (
    id               UUID PRIMARY KEY,
    port_planning_id UUID NOT NULL REFERENCES public.port_planning (id) ON DELETE CASCADE,
    classification   VARCHAR(100),
    port_id          UUID,
    port_name        VARCHAR(300),
    container_min    NUMERIC(15, 2),
    container_max    NUMERIC(15, 2),
    bulk_min         NUMERIC(15, 2),
    bulk_max         NUMERIC(15, 2),
    liquid_min       NUMERIC(15, 2),
    liquid_max       NUMERIC(15, 2),
    total_min        NUMERIC(15, 2),
    total_max        NUMERIC(15, 2),
    note             VARCHAR(500)
);

-- Indexes.
CREATE INDEX IF NOT EXISTS idx_port_planning_org_unit
    ON public.port_planning (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_port_planning_org_unit_created
    ON public.port_planning (org_unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_planning_categories_port_planning_id
    ON public.planning_categories (port_planning_id);
CREATE INDEX IF NOT EXISTS idx_cargo_forecast_port_planning_id
    ON public.port_planning_cargo_forecast (port_planning_id);
