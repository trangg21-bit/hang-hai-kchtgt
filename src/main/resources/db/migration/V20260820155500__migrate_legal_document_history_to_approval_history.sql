-- Migration: Unify legal_document_history into approval_history table
-- InfrastructureType.LEGAL_DOCUMENT ordinal is 23

-- Drop restrictive check constraints generated for enums on approval_history
ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_ref_type_check;
ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_status_check;
ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_approval_level_check;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'legal_document_history'
    ) THEN
        INSERT INTO approval_history (
            id,
            ref_id,
            ref_type,
            approval_level,
            status,
            approved_by,
            approved_date,
            reason,
            changed_field,
            previous_value,
            new_value
        )
        SELECT
            COALESCE(ldh.id, gen_random_uuid()),
            ldh.legal_document_id,
            23, -- LEGAL_DOCUMENT ordinal
            0,  -- LEVEL_0
            CASE 
                WHEN ldh.action = 'CREATED' THEN 0
                WHEN ldh.action = 'UPDATED' THEN 5
                WHEN ldh.action = 'DELETED' THEN 6
                WHEN ldh.action = 'ATTACHMENT_UPLOADED' THEN 7
                WHEN ldh.action = 'ATTACHMENT_DELETED' THEN 8
                WHEN ldh.action = 'DRAFT_SAVED' THEN 9
                WHEN ldh.action = 'EXPIRED' THEN 10
                ELSE 5
            END,
            ldh.changed_by,
            COALESCE(ldh.changed_at, CURRENT_TIMESTAMP),
            COALESCE(ldh.description, 'Thao tác trên văn bản pháp lý'),
            ldh.document_name,
            NULL,
            ldh.document_number
        FROM legal_document_history ldh
        ON CONFLICT (id) DO NOTHING;

        -- Drop deprecated table after successful data migration
        DROP TABLE IF EXISTS legal_document_history CASCADE;
    END IF;
END $$;
