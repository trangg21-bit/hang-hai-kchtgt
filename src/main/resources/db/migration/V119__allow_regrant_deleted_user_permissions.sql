-- Keep only active direct grants unique so a revoked permission can be granted again.
ALTER TABLE user_permission_override
    DROP CONSTRAINT IF EXISTS uq_user_permission_override;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_permission_override_active
    ON user_permission_override(user_id, permission_code)
    WHERE deleted_at IS NULL;
