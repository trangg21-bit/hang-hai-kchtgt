CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS app_users (id UUID PRIMARY KEY);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS status INTEGER;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_app_users_full_name_trgm
    ON app_users USING gin (LOWER(full_name) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_email_trgm
    ON app_users USING gin (LOWER(email) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_username_trgm
    ON app_users USING gin (LOWER(username) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_status_created_at
    ON app_users (status, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_org_created_at
    ON app_users (org_unit_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_user
    ON user_roles (role_id, user_id);
