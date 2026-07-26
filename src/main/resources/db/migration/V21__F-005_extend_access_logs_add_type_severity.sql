-- F-005: Extend access_logs with type, severity, and new fields for structured log categorization.
--
-- Rewritten for PostgreSQL. The original was written in SQL Server dialect
-- (sys.columns / OBJECT_ID / IDENTITY / NVARCHAR(MAX) / BIT / DATETIME2), which
-- this project's database cannot parse. It never surfaced because
-- flyway.baseline-version is 50, so everything below V50 is skipped on a fresh
-- database — but the file would fail the moment that baseline was lowered.
--
-- SAFE & IDEMPOTENT: every statement carries IF NOT EXISTS.

-- 1. New columns on access_logs
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS type            VARCHAR(20) NOT NULL DEFAULT 'access';
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS severity        VARCHAR(20) NOT NULL DEFAULT 'info';
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS target_resource VARCHAR(100);
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS request_path    VARCHAR(500);
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS response_code   INT;
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS duration_ms     INT;
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS metadata        TEXT;

-- 2. Composite indexes for the F-005 query patterns
CREATE INDEX IF NOT EXISTS idx_type_createdat     ON access_logs (type, created_at);
CREATE INDEX IF NOT EXISTS idx_severity_createdat ON access_logs (severity, created_at);

-- 3. Singleton retention policy table
CREATE TABLE IF NOT EXISTS log_retention_policies (
    id               BIGSERIAL   PRIMARY KEY,
    retention_days   INT         NOT NULL DEFAULT 90,
    max_export_rows  INT         NOT NULL DEFAULT 10000,
    cleanup_schedule VARCHAR(50) NOT NULL DEFAULT '0 0 2 * * ?',
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
    updated_at       TIMESTAMP   NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- Seed the default retention policy exactly once.
INSERT INTO log_retention_policies (retention_days, max_export_rows, cleanup_schedule, is_active)
SELECT 90, 10000, '0 0 2 * * ?', TRUE
WHERE NOT EXISTS (SELECT 1 FROM log_retention_policies WHERE is_active);

-- 4. Daily pre-computed statistics
CREATE TABLE IF NOT EXISTS log_aggregates (
    id             BIGSERIAL     PRIMARY KEY,
    date           DATE          NOT NULL UNIQUE,
    total_accesses INT           NOT NULL DEFAULT 0,
    unique_users   INT           NOT NULL DEFAULT 0,
    success_rate   DECIMAL(5, 2) NOT NULL DEFAULT 0,
    avg_duration   INT           NOT NULL DEFAULT 0,
    created_at     TIMESTAMP     NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);
