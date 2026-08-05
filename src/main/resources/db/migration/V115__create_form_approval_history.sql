-- Create the approval audit trail used by FormApprovalHistory.
CREATE TABLE IF NOT EXISTS form_approval_history (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id    UUID,
    action     VARCHAR(30),
    actor      UUID,
    comments   VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_form_approval_history_form
    ON form_approval_history(form_id);

CREATE INDEX IF NOT EXISTS idx_form_approval_history_created_at
    ON form_approval_history(created_at);
