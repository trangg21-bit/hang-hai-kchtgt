-- Migration: Unify all infrastructure history into a single infrastructure_history table
-- Version: V20260825162500

CREATE TABLE IF NOT EXISTS infrastructure_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_id UUID NOT NULL,
    ref_type VARCHAR(64) NOT NULL,
    approval_level VARCHAR(32),
    status VARCHAR(32) NOT NULL,
    approved_by UUID,
    approved_date TIMESTAMP,
    reason TEXT,
    changed_field VARCHAR(255),
    previous_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_infra_history_ref ON infrastructure_history(ref_type, ref_id, approved_date DESC);
CREATE INDEX IF NOT EXISTS idx_infra_history_ref_id_date ON infrastructure_history(ref_id, approved_date DESC);
CREATE INDEX IF NOT EXISTS idx_infra_history_approved_by ON infrastructure_history(approved_by);

-- Drop legacy fragmented history tables if they exist
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS dike_revetment_approval_history CASCADE;
DROP TABLE IF EXISTS beacon_history CASCADE;
DROP TABLE IF EXISTS station_history CASCADE;
DROP TABLE IF EXISTS change_logs CASCADE;
DROP TABLE IF EXISTS approval_logs CASCADE;
