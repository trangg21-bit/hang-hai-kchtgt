-- V4: create_lockout_policy.sql
-- Lockout policy singleton table (F-277)

CREATE TABLE IF NOT EXISTS lockout_policy (
    id                       INT PRIMARY KEY DEFAULT 1,
    max_failed_attempts      INT NOT NULL DEFAULT 5,
    lockout_duration_minutes INT NOT NULL DEFAULT 30,
    window_minutes           INT NOT NULL DEFAULT 15,
    is_enabled               BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by               VARCHAR(100),

    CONSTRAINT chk_lockout_policy_id CHECK (id = 1)
);

-- Seed default policy
INSERT INTO lockout_policy (id, max_failed_attempts, lockout_duration_minutes, window_minutes, is_enabled)
SELECT 1, 5, 30, 15, TRUE
WHERE NOT EXISTS (SELECT 1 FROM lockout_policy);