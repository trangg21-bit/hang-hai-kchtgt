-- V112: Add two-level approval fields to berths table + cap column to approval_logs
ALTER TABLE berths ADD COLUMN IF NOT EXISTS activity_status VARCHAR(50);
ALTER TABLE berths ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP;
ALTER TABLE berths ADD COLUMN IF NOT EXISTS submitted_for_approval_by VARCHAR(100);
ALTER TABLE berths ADD COLUMN IF NOT EXISTS port_authority_approved_at TIMESTAMP;
ALTER TABLE berths ADD COLUMN IF NOT EXISTS port_authority_approved_by VARCHAR(100);
ALTER TABLE berths ADD COLUMN IF NOT EXISTS department_approved_at TIMESTAMP;
ALTER TABLE berths ADD COLUMN IF NOT EXISTS department_approved_by VARCHAR(100);
ALTER TABLE berths ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
CREATE TABLE IF NOT EXISTS approval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100),
    entity_id UUID,
    action VARCHAR(50),
    actor_id VARCHAR(100),
    created_at TIMESTAMP,
    comments VARCHAR(500),
    cap VARCHAR(20)
);
ALTER TABLE approval_logs ADD COLUMN IF NOT EXISTS cap VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_berths_activity_status ON berths(activity_status);
