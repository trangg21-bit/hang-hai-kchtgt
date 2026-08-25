-- Accent-insensitive (gõ không dấu) partial search support for the six KCHT list screens:
-- cảng biển (ports), cầu cảng (piers), bến cảng (berths), cảng cạn (dry_ports),
-- phao tiêu (buoy), nhà trạm phao tiêu (buoy_station).
-- The immutable_unaccent wrapper + unaccent/pg_trgm extensions are created by V20260812170000.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_ports_active_port_code_unaccent_trgm
    ON public.ports USING gin (public.immutable_unaccent(LOWER(port_code)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ports_active_port_name_unaccent_trgm
    ON public.ports USING gin (public.immutable_unaccent(LOWER(port_name)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_piers_active_pier_code_unaccent_trgm
    ON public.piers USING gin (public.immutable_unaccent(LOWER(pier_code)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_piers_active_pier_name_unaccent_trgm
    ON public.piers USING gin (public.immutable_unaccent(LOWER(pier_name)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_berths_active_berth_code_unaccent_trgm
    ON public.berths USING gin (public.immutable_unaccent(LOWER(berth_code)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_berths_active_berth_name_unaccent_trgm
    ON public.berths USING gin (public.immutable_unaccent(LOWER(berth_name)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dry_ports_active_dry_port_code_unaccent_trgm
    ON public.dry_ports USING gin (public.immutable_unaccent(LOWER(dry_port_code)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dry_ports_active_dry_port_name_unaccent_trgm
    ON public.dry_ports USING gin (public.immutable_unaccent(LOWER(dry_port_name)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_buoy_active_code_unaccent_trgm
    ON public.buoy USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_buoy_active_name_unaccent_trgm
    ON public.buoy USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_buoy_station_active_code_unaccent_trgm
    ON public.buoy_station USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_buoy_station_active_name_unaccent_trgm
    ON public.buoy_station USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops)
    WHERE deleted_at IS NULL;
