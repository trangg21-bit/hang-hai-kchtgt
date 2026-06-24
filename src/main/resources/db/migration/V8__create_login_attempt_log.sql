-- V5: create_login_attempt_log.sql
-- Login attempt audit log (F-277)

CREATE TABLE IF NOT EXISTS login_attempt_log (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID,
    username         VARCHAR(100),
    ip_address       VARCHAR(45),
    user_agent       TEXT,
    result           VARCHAR(20) NOT NULL,
    failure_reason   VARCHAR(100),
    occurred_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast admin log queries
CREATE INDEX IF NOT EXISTS idx_login_attempt_log_user ON login_attempt_log(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempt_log_username ON login_attempt_log(username);
CREATE INDEX IF NOT EXISTS idx_login_attempt_log_occurred ON login_attempt_log(occurred_at DESC);