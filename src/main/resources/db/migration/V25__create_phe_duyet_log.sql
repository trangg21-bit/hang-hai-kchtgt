-- V25: Create phe_duyet_log table (Approval Log - Phê duyệt log)
-- INSERT-only audit table; no UPDATE or DELETE
CREATE TABLE IF NOT EXISTS phe_duyet_log (
    id                      UUID PRIMARY KEY,
    entity_type             VARCHAR(50) NOT NULL,
    entity_id               VARCHAR(36) NOT NULL,
    decision                VARCHAR(50) NOT NULL,
    reason                  TEXT,
    decided_by              VARCHAR(36) NOT NULL,
    decided_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phe_duyet_log_entity ON phe_duyet_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_phe_duyet_log_decided_at ON phe_duyet_log(decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_phe_duyet_log_decided_by ON phe_duyet_log(decided_by);
