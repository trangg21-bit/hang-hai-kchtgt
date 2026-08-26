-- Accent-insensitive (gõ không dấu) partial search support for the six KCHT list screens:
-- cảng biển (ports), cầu cảng (piers), bến cảng (berths), cảng cạn (dry_ports),
-- phao tiêu (buoy), nhà trạm phao tiêu (buoy_station).
-- The immutable_unaccent wrapper + unaccent/pg_trgm extensions are created by V20260812170000.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ports') THEN
        CREATE INDEX IF NOT EXISTS idx_ports_active_port_code_unaccent_trgm
            ON public.ports USING gin (public.immutable_unaccent(LOWER(port_code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_ports_active_port_name_unaccent_trgm
            ON public.ports USING gin (public.immutable_unaccent(LOWER(port_name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'piers') THEN
        CREATE INDEX IF NOT EXISTS idx_piers_active_pier_code_unaccent_trgm
            ON public.piers USING gin (public.immutable_unaccent(LOWER(pier_code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_piers_active_pier_name_unaccent_trgm
            ON public.piers USING gin (public.immutable_unaccent(LOWER(pier_name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'berths') THEN
        CREATE INDEX IF NOT EXISTS idx_berths_active_berth_code_unaccent_trgm
            ON public.berths USING gin (public.immutable_unaccent(LOWER(berth_code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_berths_active_berth_name_unaccent_trgm
            ON public.berths USING gin (public.immutable_unaccent(LOWER(berth_name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dry_ports') THEN
        CREATE INDEX IF NOT EXISTS idx_dry_ports_active_dry_port_code_unaccent_trgm
            ON public.dry_ports USING gin (public.immutable_unaccent(LOWER(dry_port_code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_dry_ports_active_dry_port_name_unaccent_trgm
            ON public.dry_ports USING gin (public.immutable_unaccent(LOWER(dry_port_name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'buoy') THEN
        ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS name VARCHAR(255);

        CREATE INDEX IF NOT EXISTS idx_buoy_active_code_unaccent_trgm
            ON public.buoy USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_buoy_active_name_unaccent_trgm
            ON public.buoy USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'buoy_station') THEN
        ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS code VARCHAR(50);
        ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS name VARCHAR(255);

        CREATE INDEX IF NOT EXISTS idx_buoy_station_active_code_unaccent_trgm
            ON public.buoy_station USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_buoy_station_active_name_unaccent_trgm
            ON public.buoy_station USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
END $$;
