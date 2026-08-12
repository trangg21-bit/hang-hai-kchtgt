CREATE INDEX IF NOT EXISTS idx_vts_zone_system_created_at
    ON vts_zone (vts_system_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_infra_attachment_ref_uploaded
    ON infrastructure_attachments (ref_id, ref_type, uploaded_date DESC);
