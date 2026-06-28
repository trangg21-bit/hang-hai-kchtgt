-- F-005: Extend access_logs with type, severity, and new fields for structured log categorization
-- MSSQL 2022 syntax (project database)

-- 1. Add new columns to existing access_logs table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('access_logs') AND name = 'type')
    ALTER TABLE access_logs ADD type VARCHAR(20) NOT NULL DEFAULT 'access';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('access_logs') AND name = 'severity')
    ALTER TABLE access_logs ADD severity VARCHAR(20) NOT NULL DEFAULT 'info';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('access_logs') AND name = 'target_resource')
    ALTER TABLE access_logs ADD target_resource VARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('access_logs') AND name = 'request_path')
    ALTER TABLE access_logs ADD request_path VARCHAR(500) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('access_logs') AND name = 'response_code')
    ALTER TABLE access_logs ADD response_code INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('access_logs') AND name = 'duration_ms')
    ALTER TABLE access_logs ADD duration_ms INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('access_logs') AND name = 'metadata')
    ALTER TABLE access_logs ADD metadata NVARCHAR(MAX) NULL;

-- 2. Create composite indexes for F-005 query patterns
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_type_createdAt' AND object_id = OBJECT_ID('access_logs'))
    CREATE INDEX idx_type_createdAt ON access_logs(type, created_at);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_severity_createdAt' AND object_id = OBJECT_ID('access_logs'))
    CREATE INDEX idx_severity_createdAt ON access_logs(severity, created_at);

-- 3. Create log_retention_policies table (singleton)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'log_retention_policies')
    CREATE TABLE log_retention_policies (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        retention_days INT NOT NULL DEFAULT 90,
        max_export_rows INT NOT NULL DEFAULT 10000,
        cleanup_schedule VARCHAR(50) NOT NULL DEFAULT '0 0 2 * * ?',
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

-- Seed default retention policy
IF NOT EXISTS (SELECT 1 FROM log_retention_policies WHERE is_active = 1)
    INSERT INTO log_retention_policies (retention_days, max_export_rows, cleanup_schedule, is_active)
    VALUES (90, 10000, '0 0 2 * * ?', 1);

-- 4. Create log_aggregates table (daily pre-computed stats)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'log_aggregates')
    CREATE TABLE log_aggregates (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        total_accesses INT NOT NULL DEFAULT 0,
        unique_users INT NOT NULL DEFAULT 0,
        success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        avg_duration INT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
