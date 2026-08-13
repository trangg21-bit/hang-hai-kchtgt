-- Support accent-insensitive partial search for user accounts.
-- The immutable_unaccent wrapper is created by the preceding search migrations.
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_app_users_username_unaccent_trgm
    ON public.app_users USING gin (public.immutable_unaccent(LOWER(username)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_full_name_unaccent_trgm
    ON public.app_users USING gin (public.immutable_unaccent(LOWER(full_name)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_email_unaccent_trgm
    ON public.app_users USING gin (public.immutable_unaccent(LOWER(email)) gin_trgm_ops)
    WHERE deleted_at IS NULL;
