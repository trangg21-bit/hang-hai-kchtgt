CREATE TABLE IF NOT EXISTS user_status_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    old_status  SMALLINT,
    new_status  SMALLINT NOT NULL,
    reason      VARCHAR(500),
    operator_id UUID,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_status_log_user FOREIGN KEY (user_id)
        REFERENCES app_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_status_log_user_created
    ON user_status_log(user_id, created_at DESC);
