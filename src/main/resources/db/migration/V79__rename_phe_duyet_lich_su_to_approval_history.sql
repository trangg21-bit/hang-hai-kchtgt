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
ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_vts;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'he_thong_vts_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_history' AND column_name = 'vts_system_id') THEN
    ALTER TABLE approval_history RENAME COLUMN he_thong_vts_id TO vts_system_id;
  END IF;
END $$;

-- 5. Drop other old FK constraints that may reference renamed tables
--    (fk_phe_duyet_lich_su_luong has column already renamed to navigation_channel_id)
ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_luong;

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

-- 7. Create new FK constraints. Legacy audit history may reference a record
-- removed before this migration; preserve those rows and validate new writes.
DO $$
DECLARE
  foreign_key record;
  has_orphan boolean;
BEGIN
  FOR foreign_key IN
    SELECT * FROM (VALUES
      ('fk_approval_history_vts_system', 'vts_system_id', 'vts_system'),
      ('fk_approval_history_navigation_channel', 'navigation_channel_id', 'navigation_channel'),
      ('fk_approval_history_radar_station', 'radar_station_id', 'radar_station'),
      ('fk_approval_history_ship_repair', 'ship_repair_facility_id', 'ship_repair_facility')
    ) AS definitions(constraint_name, column_name, referenced_table)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'approval_history'
        AND column_name = foreign_key.column_name
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.approval_history'::regclass
        AND conname = foreign_key.constraint_name
    ) THEN
      EXECUTE format(
        'SELECT EXISTS (SELECT 1 FROM public.approval_history history LEFT JOIN public.%I reference_row ON reference_row.id = history.%I WHERE reference_row.id IS NULL)',
        foreign_key.referenced_table, foreign_key.column_name
      ) INTO has_orphan;

      EXECUTE format(
        'ALTER TABLE public.approval_history ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id)%s',
        foreign_key.constraint_name,
        foreign_key.column_name,
        foreign_key.referenced_table,
        CASE WHEN has_orphan THEN ' NOT VALID' ELSE '' END
      );
    END IF;
  END LOOP;
END $$;
