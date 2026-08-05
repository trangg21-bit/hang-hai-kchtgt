CREATE TABLE IF NOT EXISTS app_users (id UUID PRIMARY KEY);
CREATE TABLE IF NOT EXISTS app_roles (id UUID PRIMARY KEY, code VARCHAR(100));

-- F-275: direct user permission overrides and auditable role assignments.
CREATE TABLE IF NOT EXISTS user_permission_override (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES app_users(id),
    permission_code VARCHAR(100) NOT NULL,
    reason          VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP,
    deleted_by      UUID,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_user_permission_override UNIQUE (user_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_user_permission_override_user
    ON user_permission_override(user_id);

CREATE TABLE IF NOT EXISTS user_roles_tracking (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES app_users(id),
    role_id         UUID NOT NULL REFERENCES app_roles(id),
    assigned_by     UUID REFERENCES app_users(id),
    assigned_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP,
    is_direct_grant BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP,
    deleted_by      UUID,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_user_roles_tracking_assignment UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_tracking_user
    ON user_roles_tracking(user_id);
