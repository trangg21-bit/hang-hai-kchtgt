-- F-005: Add email, don_vi, session_id columns to access_logs.
--
-- These denormalised fields are populated by the AccessLogInterceptor from the
-- authenticated user's auth context. They enable fast filtering and reporting
-- without JOINing to app_users on every query.
--
-- SAFE & IDEMPOTENT: every statement carries IF NOT EXISTS.

-- 1. New columns on access_logs
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS email      VARCHAR(100);
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS don_vi     VARCHAR(100);
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);

-- 2. Composite indexes for the F-005 query patterns
CREATE INDEX IF NOT EXISTS idx_donvi_createdat     ON access_logs (don_vi, created_at);
CREATE INDEX IF NOT EXISTS idx_sessionid_createdat ON access_logs (session_id, created_at);
