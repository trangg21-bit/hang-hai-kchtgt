-- Support accent-insensitive partial search for VTS names, codes and addresses.
-- The unaccent extension is enabled by V20260731113500.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent() is not immutable by default, so expose an immutable wrapper for
-- expression indexes. The dictionary is fixed to the public unaccent rules.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$ SELECT public.unaccent('public.unaccent', input) $$;

CREATE INDEX IF NOT EXISTS idx_vts_system_active_name_unaccent_trgm
    ON public.vts_system USING gin (public.immutable_unaccent(LOWER(system_name)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vts_system_active_code_unaccent_trgm
    ON public.vts_system USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vts_system_active_address_unaccent_trgm
    ON public.vts_system USING gin (public.immutable_unaccent(LOWER(address)) gin_trgm_ops)
    WHERE deleted_at IS NULL;
