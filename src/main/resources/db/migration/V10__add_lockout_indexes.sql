-- V4: Add lockout indexes
CREATE INDEX ix_users_locked_unlock_scan ON app_users (account_locked_until ASC)
    WHERE account_locked_until IS NOT NULL;

CREATE INDEX ix_login_attempts_user_occurred ON login_attempts (user_id ASC, occurred_at DESC);

CREATE INDEX ix_login_attempt_logs_login_attempt ON login_attempt_logs (login_attempt_id ASC);