-- ================================================================
-- Migration: Rename shared table phe_duyet_lich_su → approval_history
-- Author: AI-generated
-- Date: 2026-07-24
-- ================================================================

-- ================================================================
-- STEP 1: Drop old FK constraints that reference dropped tables
-- ================================================================
ALTER TABLE phe_duyet_lich_su DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_cosuachua;
ALTER TABLE phe_duyet_lich_su DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_luong;
ALTER TABLE phe_duyet_lich_su DROP CONSTRAINT IF EXISTS fkcli6xfscl4wa2r8198eextl7k;

-- ================================================================
-- STEP 2: Rename the table
-- ================================================================
ALTER TABLE phe_duyet_lich_su RENAME TO approval_history;

-- ================================================================
-- STEP 3: Rename columns
-- ================================================================
ALTER TABLE approval_history RENAME COLUMN cap_phe_duyet TO approval_level;
ALTER TABLE approval_history RENAME COLUMN trang_thai TO status;
ALTER TABLE approval_history RENAME COLUMN nguoi_phe_duyet TO approved_by;
ALTER TABLE approval_history RENAME COLUMN ngay_phe_duyet TO approved_date;
ALTER TABLE approval_history RENAME COLUMN ly_do TO reason;

-- ================================================================
-- STEP 4: Recreate FK constraints (optional — for data integrity)
-- The FK column names are unchanged: ship_repair_facility_id,
-- tram_radar_id, he_thong_vts_id, navigation_channel_id
-- ================================================================
-- ALTER TABLE approval_history
--   ADD CONSTRAINT fk_approval_history_ship_repair
--   FOREIGN KEY (ship_repair_facility_id) REFERENCES ship_repair_facility(id);
--
-- ALTER TABLE approval_history
--   ADD CONSTRAINT fk_approval_history_tram_radar
--   FOREIGN KEY (tram_radar_id) REFERENCES tram_radar(id);
--
-- ALTER TABLE approval_history
--   ADD CONSTRAINT fk_approval_history_he_thong_vts
--   FOREIGN KEY (he_thong_vts_id) REFERENCES he_thong_vts(id);
--
-- ALTER TABLE approval_history
--   ADD CONSTRAINT fk_approval_history_navigation_channel
--   FOREIGN KEY (navigation_channel_id) REFERENCES navigation_channel(id);
-- (Uncomment and adjust table/column names as needed)

-- ================================================================
-- ROLLBACK (down migration)
-- ================================================================
-- ALTER TABLE approval_history RENAME COLUMN approval_level TO cap_phe_duyet;
-- ALTER TABLE approval_history RENAME COLUMN status TO trang_thai;
-- ALTER TABLE approval_history RENAME COLUMN approved_by TO nguoi_phe_duyet;
-- ALTER TABLE approval_history RENAME COLUMN approved_date TO ngay_phe_duyet;
-- ALTER TABLE approval_history RENAME COLUMN reason TO ly_do;
-- ALTER TABLE approval_history RENAME TO phe_duyet_lich_su;
