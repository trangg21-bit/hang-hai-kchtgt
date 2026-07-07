-- V24: Create lich_su_thay_doi table (Change History - Lịch sử thay đổi)
-- INSERT-only audit table; no UPDATE or DELETE
CREATE TABLE IF NOT EXISTS lich_su_thay_doi (
    id                      UUID PRIMARY KEY,
    entity_type             VARCHAR(50) NOT NULL,
    entity_id               VARCHAR(36) NOT NULL,
    field_name              VARCHAR(255) NOT NULL,
    old_value               TEXT,
    new_value               TEXT,
    changed_by              VARCHAR(36) NOT NULL,
    changed_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lich_su_thay_doi_entity ON lich_su_thay_doi(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_lich_su_thay_doi_changed_at ON lich_su_thay_doi(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lich_su_thay_doi_changed_by ON lich_su_thay_doi(changed_by);
