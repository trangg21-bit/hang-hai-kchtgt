-- =====================================================================
-- V20260905100000__x_incident_update.sql
-- F-131 Incident delta (design plan §5.1; engine: PostgreSQL)
--   New columns + enum conversions (STRING -> ORDINAL INT) + audit fix +
--   org_unit_id backfill (fail-closed) + code backfill + child tables.
-- House style: guarded ALTERs (V20260803370000) + fail-closed backfill
-- (V20260826170000:96,108,112). Never DROP COLUMN existing data columns.
-- =====================================================================

-- 5.1.1 New columns (widths superseded by design §2.1 D7-FINAL:
--        incident_type VARCHAR(100), damage_status VARCHAR(500)).
ALTER TABLE public.incidents
    ADD COLUMN IF NOT EXISTS code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS org_unit_id UUID,
    ADD COLUMN IF NOT EXISTS incident_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS occurred_to TIMESTAMP,
    ADD COLUMN IF NOT EXISTS infrastructure_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS infrastructure_id UUID,
    ADD COLUMN IF NOT EXISTS infrastructure_name VARCHAR(300),
    ADD COLUMN IF NOT EXISTS damage_status VARCHAR(500),
    ADD COLUMN IF NOT EXISTS note VARCHAR(500),
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- 5.1.2 Guarded RENAME discovery_time -> occurred_from (only once).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'incidents'
                 AND column_name = 'discovery_time')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'incidents'
                         AND column_name = 'occurred_from') THEN
        ALTER TABLE public.incidents RENAME COLUMN discovery_time TO occurred_from;
    END IF;
END $$;

-- 5.1.3 Enum conversions VARCHAR -> INT (ORDINAL) with explicit per-name mapping.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'incidents'
                 AND column_name = 'severity_level' AND udt_name = 'varchar') THEN
        -- Log strays first (any value outside the mapping stays NULL after cast).
        ALTER TABLE public.incidents
            ALTER COLUMN severity_level TYPE INTEGER
            USING CASE severity_level
                      WHEN 'NHE' THEN 0
                      WHEN 'TRUNG_BINH' THEN 1
                      WHEN 'NGHIEM_TRONG' THEN 2
                      WHEN 'CUC_NGIEM_TRONG' THEN 3
                      ELSE NULL END;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'incidents'
                 AND column_name = 'processing_status' AND udt_name = 'varchar') THEN
        -- 3 = UNRESOLVED has no legacy rows (D4); legacy 'DA_DONG' -> 4.
        ALTER TABLE public.incidents
            ALTER COLUMN processing_status TYPE INTEGER
            USING CASE processing_status
                      WHEN 'TIEP_NHAN' THEN 0
                      WHEN 'DANG_XU_LY' THEN 1
                      WHEN 'DA_XU_LY' THEN 2
                      WHEN 'DA_DONG' THEN 4
                      ELSE NULL END;
    END IF;
END $$;

-- 5.1.4 Audit fix. Order matters: created_by backfill must join the legacy
--        updated_by STRING (display name) BEFORE updated_by converts to UUID.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'incidents'
                 AND column_name = 'updated_by' AND udt_name = 'varchar') THEN
        -- (a) Best-effort created_by backfill from legacy audit names.
        UPDATE public.incidents i
        SET created_by = u.id
        FROM public.users u
        WHERE i.created_by IS NULL
          AND i.updated_by IS NOT NULL
          AND (u.full_name = i.updated_by OR u.username = i.updated_by);
        -- (b) Guarded VARCHAR -> UUID cast (valid UUID kept, name-string -> NULL).
        ALTER TABLE public.incidents
            ALTER COLUMN updated_by TYPE UUID
            USING CASE WHEN updated_by ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                       THEN updated_by::uuid ELSE NULL END;
    END IF;
END $$;

-- 5.1.5 org_unit_id backfill (D2 mandatory) + fail-closed check.
DO $$
DECLARE
    v_remaining INTEGER;
BEGIN
    UPDATE public.incidents i
    SET org_unit_id = u.org_unit_id
    FROM public.users u
    WHERE i.org_unit_id IS NULL
      AND i.created_by = u.id
      AND u.org_unit_id IS NOT NULL;

    SELECT COUNT(*) INTO v_remaining
    FROM public.incidents
    WHERE org_unit_id IS NULL;

    IF v_remaining > 0 THEN
        RAISE EXCEPTION 'F-131 backfill failed: % incident row(s) still have NULL org_unit_id. Assign an org_unit_id manually for legacy rows whose creator cannot be resolved, then re-run this migration file.', v_remaining;
    END IF;

    ALTER TABLE public.incidents ALTER COLUMN org_unit_id SET NOT NULL;
END $$;

-- 5.1.6 code backfill: SC-###### per org (D11) + partial unique index.
DO $$
BEGIN
    UPDATE public.incidents
    SET code = 'SC-' || lpad(rn::text, 6, '0')
    FROM (SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY org_unit_id ORDER BY created_at NULLS LAST, id) AS rn
          FROM public.incidents
          WHERE code IS NULL) seq
    WHERE public.incidents.id = seq.id;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_incidents_org_unit_code
    ON public.incidents (org_unit_id, code) WHERE deleted_at IS NULL;

-- 5.1.7 Child tables (F-131 §3.1): incident_evolution / incident_handling / incident_file.
CREATE TABLE IF NOT EXISTS public.incident_evolution (
    id          UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES public.incidents (id) ON DELETE CASCADE,
    from_date   DATE,
    to_date     DATE,
    event       VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS public.incident_handling (
    id                UUID PRIMARY KEY,
    incident_id       UUID NOT NULL REFERENCES public.incidents (id) ON DELETE CASCADE,
    handler           VARCHAR(150),
    directive_content VARCHAR(2000),
    directive_date    DATE,
    measure           VARCHAR(2000),
    result            VARCHAR(2000),
    note              VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS public.incident_file (
    id            UUID PRIMARY KEY,
    incident_id   UUID NOT NULL REFERENCES public.incidents (id) ON DELETE CASCADE,
    file_name     VARCHAR(255),
    file_path     VARCHAR(500),
    file_type     VARCHAR(50),
    file_size     BIGINT,
    uploaded_at   TIMESTAMP,
    uploaded_by   UUID,
    file_category VARCHAR(20) NOT NULL DEFAULT 'INFO'
);

-- 5.1.8 Indexes.
CREATE INDEX IF NOT EXISTS idx_incidents_org_unit
    ON public.incidents (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_incidents_org_unit_created
    ON public.incidents (org_unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_evolution_incident_id
    ON public.incident_evolution (incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_handling_incident_id
    ON public.incident_handling (incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_file_incident_id
    ON public.incident_file (incident_id);
