-- V112: Add two-level approval fields to berths table + cap column to approval_logs
ALTER TABLE berths ADD COLUMN IF NOT EXISTS activity_status NVARCHAR(50);
ALTER TABLE berths ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP;
ALTER TABLE berths ADD COLUMN IF NOT EXISTS submitted_for_approval_by NVARCHAR(100);
ALTER TABLE berths ADD COLUMN IF NOT EXISTS port_authority_approved_at TIMESTAMP;
ALTER TABLE berths ADD COLUMN IF NOT EXISTS port_authority_approved_by NVARCHAR(100);
ALTER TABLE berths ADD COLUMN IF NOT EXISTS department_approved_at TIMESTAMP;
ALTER TABLE berths ADD COLUMN IF NOT EXISTS department_approved_by NVARCHAR(100);
ALTER TABLE berths ADD COLUMN IF NOT EXISTS rejection_reason NVARCHAR(500);
ALTER TABLE approval_logs ADD COLUMN IF NOT EXISTS cap NVARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_berths_activity_status ON berths(activity_status);
