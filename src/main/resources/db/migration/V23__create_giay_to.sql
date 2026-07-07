-- V23: Create giay_to table (Document/File Attachment - Giấy tờ)
CREATE TABLE IF NOT EXISTS giay_to (
    id                      UUID PRIMARY KEY,
    entity_type             VARCHAR(50) NOT NULL,
    entity_id               VARCHAR(36) NOT NULL,
    file_name               VARCHAR(255) NOT NULL,
    file_size               BIGINT NOT NULL,
    mime_type               VARCHAR(100) NOT NULL,
    minio_key               VARCHAR(500) NOT NULL,
    uploaded_by             VARCHAR(36) NOT NULL,
    created_by              VARCHAR(36),
    updated_by              VARCHAR(36),
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at              TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_giay_to_entity ON giay_to(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_giay_to_uploaded_by ON giay_to(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_giay_to_created_at ON giay_to(created_at DESC);
