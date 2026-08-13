-- Support the default and last-login sorts on the active user list.
-- Search-specific partial indexes already exist in V100 and V20260812193000.
CREATE INDEX IF NOT EXISTS idx_app_users_active_created_at
    ON public.app_users (created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_active_last_login_at
    ON public.app_users (last_login_at DESC)
    WHERE deleted_at IS NULL;
