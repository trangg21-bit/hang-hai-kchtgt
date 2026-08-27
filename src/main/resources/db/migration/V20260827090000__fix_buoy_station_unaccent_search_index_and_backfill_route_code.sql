-- =====================================================================
-- HOTFIX TRI-1787825767692-3dab — Repair migration (Luồng hàng hải M-003)
--
-- Root cause:
--   1. V20260803370000 added `code` to `buoy` but NEVER to `buoy_station`
--      (buoy_station.index idx_buoy_station_active_code_unaccent_trgm then
--      failed on real DBs).
--   2. V20260822130000 was edited AFTER it had already been applied, so its
--      ADD COLUMN code/name + unaccent trigram indexes drifted on real DBs.
--   3. Legacy channel_route_detail rows keep `route_code IS NULL` — the §9
--      rename in V20260825120000 only renamed the legacy `ma` column.
--
-- One-way door: the applied migrations above are NOT edited. This file
-- converges all environments idempotently (guards + IF NOT EXISTS) — running
-- it twice must be a no-op.
-- =====================================================================

-- Section 1: converge code/name columns on buoy_station AND buoy (idempotent)
DO $$
BEGIN
    IF to_regclass('public.buoy_station') IS NOT NULL THEN
        ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    END IF;
    IF to_regclass('public.buoy') IS NOT NULL THEN
        ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    END IF;
END $$;

-- Section 2: recreate the four unaccent partial search indexes (idempotent)
DO $$
BEGIN
    IF to_regclass('public.buoy_station') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_buoy_station_active_code_unaccent_trgm
            ON public.buoy_station USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_buoy_station_active_name_unaccent_trgm
            ON public.buoy_station USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
    IF to_regclass('public.buoy') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_buoy_active_code_unaccent_trgm
            ON public.buoy USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_buoy_active_name_unaccent_trgm
            ON public.buoy USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
END $$;

-- Section 3: backfill route_code for legacy channel_route_detail rows
-- Format parity with NavigationChannelService.toRouteDetail:
--   channelCode + "-" + String.format("%02d", sequenceNo)
DO $$
BEGIN
    IF to_regclass('public.channel_route_detail') IS NOT NULL
       AND to_regclass('public.navigation_channel') IS NOT NULL THEN
        UPDATE public.channel_route_detail SET route_code =
            (SELECT nc.channel_code FROM public.navigation_channel nc
              WHERE nc.id = channel_route_detail.navigation_channel_id)
            || '-' || LPAD(COALESCE(sequence_no, 1)::text, 2, '0')
        WHERE route_code IS NULL;
    END IF;
END $$;
