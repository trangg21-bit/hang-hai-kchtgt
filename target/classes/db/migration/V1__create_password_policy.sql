-- V1: create_password_policy.sql
-- Password policy singleton table (F-276)

CREATE TABLE IF NOT EXISTS password_policy (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_length      INT NOT NULL DEFAULT 12,
    require_uppercase  BOOLEAN NOT NULL DEFAULT TRUE,
    require_lowercase  BOOLEAN NOT NULL DEFAULT TRUE,
    require_digit      BOOLEAN NOT NULL DEFAULT TRUE,
    require_special_char BOOLEAN NOT NULL DEFAULT TRUE,
    special_char_set  VARCHAR(128) NOT NULL DEFAULT '!@#$%^&*()-_=+',
    max_age_days     INT NOT NULL DEFAULT 90,
    history_depth    INT NOT NULL DEFAULT 5,
    block_username_in_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Singleton guard: only one row allowed
CREATE OR REPLACE FUNCTION enforce_password_policy_singleton()
RETURNS TRIGGER AS $$
DECLARE
    cnt INT;
BEGIN
    SELECT COUNT(*) INTO cnt FROM password_policy;
    IF cnt >= 1 AND TG_OP = 'INSERT' THEN
        RAISE EXCEPTION 'password_policy is a singleton table - only one row allowed';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_password_policy_singleton ON password_policy;
CREATE TRIGGER trg_password_policy_singleton
    BEFORE INSERT ON password_policy
    FOR EACH ROW EXECUTE FUNCTION enforce_password_policy_singleton();

-- Seed default policy
INSERT INTO password_policy (
    min_length, require_uppercase, require_lowercase, require_digit,
    require_special_char, special_char_set, max_age_days,
    history_depth, block_username_in_password
)
SELECT 12, TRUE, TRUE, TRUE, TRUE, '!@#$%^&*()-_=+', 90, 5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM password_policy);

-- Index for monitoring queries
CREATE INDEX IF NOT EXISTS idx_password_policy_updated ON password_policy(updated_at);