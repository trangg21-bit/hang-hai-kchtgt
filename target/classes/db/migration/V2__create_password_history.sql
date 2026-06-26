-- V2: create_password_history.sql
-- Password history table (F-276)

CREATE TABLE IF NOT EXISTS password_history (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_history_user FOREIGN KEY (user_id)
        REFERENCES app_users(id) ON DELETE CASCADE
);

-- Index for fast "top N by user" queries (history depth check)
CREATE INDEX IF NOT EXISTS idx_password_history_user_created
    ON password_history(user_id, created_at DESC);