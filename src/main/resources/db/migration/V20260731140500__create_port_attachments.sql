-- V105: Create port_attachments table
-- Lưu file đính kèm cho mỗi Cảng biển (Port).
-- Mỗi port có thể có nhiều file đính kèm (tối đa 10 file, mỗi file ≤ 20MB).
-- Các định dạng hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF

CREATE TABLE port_attachments (
    id           BIGSERIAL    PRIMARY KEY,
    port_id      UUID         NOT NULL,
    file_name    VARCHAR(255) NOT NULL,
    file_path    VARCHAR(500) NOT NULL,
    file_size    BIGINT       NOT NULL CHECK (file_size > 0 AND file_size <= 20971520),
    content_type VARCHAR(100),
    uploaded_by  UUID,
    uploaded_at  TIMESTAMP    DEFAULT NOW(),

    CONSTRAINT fk_port_attachments_port
        FOREIGN KEY (port_id) REFERENCES ports(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_port_attachments_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Index để truy vấn nhanh theo port_id
CREATE INDEX idx_port_attachments_port_id ON port_attachments(port_id);


-- V106: Alter updated_at columns to allow NULL (safe migration for existing rows)
-- Applied to all 3 port child tables that now have the updatedAt field.

ALTER TABLE port_coordinates ALTER COLUMN updated_at DROP NOT NULL;
ALTER TABLE port_infrastructure ALTER COLUMN updated_at DROP NOT NULL;
ALTER TABLE port_attachments ALTER COLUMN updated_at DROP NOT NULL;


-- V107: Alter sub-tables id column from BIGINT to UUID (idempotent)
DO $$
BEGIN
    -- 1. port_coordinates
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_coordinates' AND column_name = 'id' AND data_type = 'bigint') THEN
        ALTER TABLE port_coordinates ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        ALTER TABLE port_coordinates ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;

    -- 2. port_infrastructure
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_infrastructure' AND column_name = 'id' AND data_type = 'bigint') THEN
        ALTER TABLE port_infrastructure ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        ALTER TABLE port_infrastructure ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;

    -- 3. port_attachments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_attachments' AND column_name = 'id' AND data_type = 'bigint') THEN
        ALTER TABLE port_attachments ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        ALTER TABLE port_attachments ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;
