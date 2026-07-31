-- UAT may have been baselined after the original access-log migration.
-- Create the audit table idempotently so asynchronous audit logging is available.
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(30) NOT NULL,
    module VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    email VARCHAR(100),
    org_unit VARCHAR(100),
    session_id VARCHAR(50),
    status VARCHAR(10) NOT NULL,
    detail TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'ACCESS',
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    target_resource VARCHAR(100),
    request_path VARCHAR(500),
    response_code INTEGER,
    duration_ms INTEGER,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_type_createdat ON access_logs (type, created_at);
CREATE INDEX IF NOT EXISTS idx_severity_createdat ON access_logs (severity, created_at);
CREATE INDEX IF NOT EXISTS idx_action_createdat ON access_logs (action, created_at);
CREATE INDEX IF NOT EXISTS idx_userid_createdat ON access_logs (user_id, created_at);
