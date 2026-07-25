-- V18: Extend access_logs with 7 new fields, create log_retention_policies and log_aggregates tables
-- Migration for F-005: Quản lý log truy cập

-- ── 1. Add 7 new columns to access_logs ────────────────────────────
ALTER TABLE access_logs ADD COLUMN type VARCHAR(20) DEFAULT 'access';
ALTER TABLE access_logs ADD COLUMN severity VARCHAR(20) DEFAULT 'info';
ALTER TABLE access_logs ADD COLUMN target_resource VARCHAR(100);
ALTER TABLE access_logs ADD COLUMN request_path VARCHAR(500);
ALTER TABLE access_logs ADD COLUMN response_code INT;
ALTER TABLE access_logs ADD COLUMN duration_ms INT;
ALTER TABLE access_logs ADD COLUMN metadata TEXT;
ALTER TABLE access_logs ADD COLUMN userId BIGINT;
ALTER TABLE access_logs ADD COLUMN created_at DATETIME2 DEFAULT SYSUTCDATETIME();
ALTER TABLE access_logs ADD COLUMN updated_at DATETIME2 DEFAULT SYSUTCDATETIME();

-- ── 2. Create composite indexes ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_type_createdAt ON access_logs(type, created_at);
CREATE INDEX IF NOT EXISTS idx_severity_createdAt ON access_logs(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_action_createdAt ON access_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_userid_createdAt ON access_logs(userId, created_at);

-- ── 3. Create log_retention_policies table ─────────────────────────
CREATE TABLE log_retention_policies (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    retention_days INT NOT NULL DEFAULT 90 CHECK (retention_days > 0),
    max_export_rows INT NOT NULL DEFAULT 10000 CHECK (max_export_rows > 0),
    cleanup_schedule VARCHAR(50) NOT NULL DEFAULT '0 0 2 * * ?',
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Seed default retention policy
INSERT INTO log_retention_policies (retention_days, max_export_rows, cleanup_schedule)
    VALUES (90, 10000, '0 0 2 * * ?');

-- ── 4. Create log_aggregates table ─────────────────────────────────
CREATE TABLE log_aggregates (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_accesses INT NOT NULL DEFAULT 0,
    unique_users INT NOT NULL DEFAULT 0,
    success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    avg_duration INT NOT NULL DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
