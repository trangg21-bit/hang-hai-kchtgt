CREATE TABLE IF NOT EXISTS report_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_unit_id UUID NOT NULL,
    report_code VARCHAR(50) NOT NULL,
    report_period VARCHAR(50) NOT NULL,
    report_year INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    report_data TEXT,
    notes TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_report_record_lookup 
ON report_record(report_code, org_unit_id, report_year, report_period) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_report_record_org 
ON report_record(org_unit_id) 
WHERE deleted_at IS NULL;
