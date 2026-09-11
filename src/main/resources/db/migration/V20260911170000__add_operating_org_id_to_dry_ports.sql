-- V20260911170000: Add operating_org_id to dry_ports table (parity with buoy_berths)
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS operating_org_id UUID;
