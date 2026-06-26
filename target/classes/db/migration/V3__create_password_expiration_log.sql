-- V3: create_password_expiration_log.sql
-- Password expiration audit trail (F-276)

CREATE TABLE IF NOT EXISTS password_expiration_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL,
    expired_at     TIMESTAMP NOT NULL,
    status         VARCHAR(20) NOT NULL,
    notified_via   VARCHAR(20) NOT NULL DEFAULT 'none',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_exp_log_user FOREIGN KEY (user_id)
        REFERENCES app_users(id) ON DELETE CASCADE
);

-- Index for monitoring
CREATE INDEX IF NOT EXISTS idx_password_exp_log_user
    ON password_expiration_log(user_id);