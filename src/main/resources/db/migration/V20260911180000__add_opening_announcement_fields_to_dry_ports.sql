-- V20260911180000: Add opening announcement fields to dry_ports to match piers (cầu cảng)
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS opening_announcement_date DATE;
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS opening_decision VARCHAR(2000);
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS investment_agreement_doc VARCHAR(2000);

-- Migrate existing announcement data if present
UPDATE dry_ports
SET opening_announcement_date = COALESCE(opening_announcement_date, announcement_decision_date, announcement_time::date),
    opening_decision = COALESCE(opening_decision, announcement_decision_number)
WHERE opening_announcement_date IS NULL AND (announcement_decision_date IS NOT NULL OR announcement_time IS NOT NULL OR announcement_decision_number IS NOT NULL);
