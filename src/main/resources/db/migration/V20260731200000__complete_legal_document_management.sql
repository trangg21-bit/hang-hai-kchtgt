CREATE TABLE IF NOT EXISTS legal_document_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    action VARCHAR(40) NOT NULL,
    changed_by UUID,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    document_name VARCHAR(200) NOT NULL,
    document_number VARCHAR(50),
    issuing_authority VARCHAR(200),
    issue_date DATE,
    effective_date DATE,
    expiration_date DATE,
    document_type VARCHAR(30),
    application_area VARCHAR(100),
    validity_status VARCHAR(30),
    signer VARCHAR(100),
    description VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_legal_document_history_document
    ON legal_document_history(legal_document_id);
CREATE INDEX IF NOT EXISTS idx_legal_document_history_changed_at
    ON legal_document_history(changed_at);
