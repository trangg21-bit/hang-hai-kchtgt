-- V11: Create database backups table
CREATE TABLE IF NOT EXISTS database_backups (
    id              UUID PRIMARY KEY,
    filename        VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_size       BIGINT NOT NULL,
    backup_type     VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    error_detail    VARCHAR(4000),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_database_backups_created ON database_backups(created_at DESC);
