-- V79: Rename phe_duyet_lich_su → approval_history with English column names
--
-- SAFE & IDEMPOTENT: Each operation checks preconditions using information_schema,
-- so this migration succeeds whether the old table exists, the new table already exists,
-- or some columns are already renamed. Safe to run multiple times.

-- 1. Rename main table (only if old exists and new does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phe_duyet_lich_su')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_history') THEN
    ALTER TABLE phe_duyet_lich_su RENAME TO approval_history;
  END IF;
END $$;

-- 2. Rename PK constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'phe_duyet_lich_su_pkey')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'approval_history_pkey') THEN
    ALTER INDEX phe_duyet_lich_su_pkey RENAME TO approval_history_pkey;
  END IF;
END $$;

-- 3. Rename columns (one by one, guarded)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'cap_phe_duyet')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'approval_level') THEN
    ALTER TABLE approval_history RENAME COLUMN cap_phe_duyet TO approval_level;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'trang_thai')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'status') THEN
    ALTER TABLE approval_history RENAME COLUMN trang_thai TO status;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'nguoi_phe_duyet')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'approved_by') THEN
    ALTER TABLE approval_history RENAME COLUMN nguoi_phe_duyet TO approved_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'ngay_phe_duyet')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'approved_date') THEN
    ALTER TABLE approval_history RENAME COLUMN ngay_phe_duyet TO approved_date;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'ly_do')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'reason') THEN
    ALTER TABLE approval_history RENAME COLUMN ly_do TO reason;
  END IF;
END $$;

-- 4. Rename FK column he_thong_vts_id → vts_system_id (if still old)
--    Drop the old FK constraint first, rename the column, then recreate with new name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_phe_duyet_lich_su_vts') THEN
    ALTER TABLE approval_history DROP CONSTRAINT fk_phe_duyet_lich_su_vts;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'he_thong_vts_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'vts_system_id') THEN
    ALTER TABLE approval_history RENAME COLUMN he_thong_vts_id TO vts_system_id;
  END IF;
END $$;

-- 5. Drop other old FK constraints that may reference renamed tables
--    (fk_phe_duyet_lich_su_luong has column already renamed to navigation_channel_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_phe_duyet_lich_su_luong') THEN
    ALTER TABLE approval_history DROP CONSTRAINT fk_phe_duyet_lich_su_luong;
  END IF;
END $$;

--    fk_phe_duyet_lich_su_radar was already dropped in V75, but safe to re-try
DO $$
BEGIN
  ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_radar;
END $$;

--    fk_phe_duyet_lich_su_cosuachua was already dropped in V73, safe to re-try
DO $$
BEGIN
  ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_cosuachua;
END $$;

-- 6. Drop any auto-generated FK constraint names that may exist
DO $$
BEGIN
  ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS fkcli6xfscl4wa2r8198eextl7k;
END $$;

DO $$
BEGIN
  ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS fkiylsseol3iqad0hll1mpsrfm;
END $$;

-- 7. Create new FK constraints for renamed tables (only if column exists and constraint does not)

--    FK to vts_system
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'vts_system_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_approval_history_vts_system') THEN
    ALTER TABLE approval_history ADD CONSTRAINT fk_approval_history_vts_system FOREIGN KEY (vts_system_id) REFERENCES vts_system(id);
  END IF;
END $$;

--    FK to navigation_channel (column already renamed by V62.1)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'navigation_channel_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_approval_history_navigation_channel') THEN
    ALTER TABLE approval_history ADD CONSTRAINT fk_approval_history_navigation_channel FOREIGN KEY (navigation_channel_id) REFERENCES navigation_channel(id);
  END IF;
END $$;

--    FK to radar_station (already added by V75, but if not yet present, add it)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'radar_station_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_approval_history_radar_station') THEN
    ALTER TABLE approval_history ADD CONSTRAINT fk_approval_history_radar_station FOREIGN KEY (radar_station_id) REFERENCES radar_station(id);
  END IF;
END $$;

--    FK to ship_repair_facility (already added by V73, but if not yet present, add it)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'ship_repair_facility_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_approval_history_ship_repair') THEN
    ALTER TABLE approval_history ADD CONSTRAINT fk_approval_history_ship_repair FOREIGN KEY (ship_repair_facility_id) REFERENCES ship_repair_facility(id);
  END IF;
END $$;
