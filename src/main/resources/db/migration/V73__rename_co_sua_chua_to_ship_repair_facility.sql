-- V73: Rename co_sua_chua_dong_tau → ship_repair_facility with English column names
--
-- SAFE & IDEMPOTENT: Each operation checks preconditions using information_schema,
-- so this migration succeeds whether the old table exists, the new table already exists,
-- or some columns are already renamed. Safe to run multiple times.

-- 1. Rename main table (only if old exists and new does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'co_sua_chua_dong_tau')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ship_repair_facility') THEN
    ALTER TABLE co_sua_chua_dong_tau RENAME TO ship_repair_facility;
  END IF;
END $$;

-- 2. Rename attachment table (only if old exists and new does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'co_sua_chua_dong_tau_attachment')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ship_repair_facility_attachment') THEN
    ALTER TABLE co_sua_chua_dong_tau_attachment RENAME TO ship_repair_facility_attachment;
  END IF;
END $$;

-- 3. Rename columns in attachment table (only if old column exists and new column does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility_attachment' AND column_name = 'co_sua_chua_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility_attachment' AND column_name = 'ship_repair_facility_id') THEN
    ALTER TABLE ship_repair_facility_attachment RENAME COLUMN co_sua_chua_id TO ship_repair_facility_id;
  END IF;
END $$;

-- 4. Rename columns in phe_duyet_lich_su (only if old column exists and new column does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phe_duyet_lich_su' AND column_name = 'co_sua_chua_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phe_duyet_lich_su' AND column_name = 'ship_repair_facility_id') THEN
    ALTER TABLE phe_duyet_lich_su RENAME COLUMN co_sua_chua_id TO ship_repair_facility_id;
  END IF;
END $$;

-- 5. Rename columns in main table (guarded the same way, one by one)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'ten_co_so')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'facility_name') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN ten_co_so TO facility_name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'dia_chi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'address') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN dia_chi TO address;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'tinh_thanh')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'province') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN tinh_thanh TO province;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'so_dien_thoai')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'phone') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN so_dien_thoai TO phone;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'loai_co_so')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'facility_type') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN loai_co_so TO facility_type;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'kha_nang')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'capacity') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN kha_nang TO capacity;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'chu_quan')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'authority') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN chu_quan TO authority;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'trang_thai')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'approval_status') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN trang_thai TO approval_status;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'phe_duyet_c1')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'approved_level1') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN phe_duyet_c1 TO approved_level1;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'nguoi_phe_duyet_c1')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'approver_level1') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN nguoi_phe_duyet_c1 TO approver_level1;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'ngay_phe_duyet_c1')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'approved_date_level1') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN ngay_phe_duyet_c1 TO approved_date_level1;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'phe_duyet_c2')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'approved_level2') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN phe_duyet_c2 TO approved_level2;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'nguoi_phe_duyet_c2')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'approver_level2') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN nguoi_phe_duyet_c2 TO approver_level2;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'ngay_phe_duyet_c2')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'approved_date_level2') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN ngay_phe_duyet_c2 TO approved_date_level2;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'ly_do_tu_choi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'rejection_reason') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN ly_do_tu_choi TO rejection_reason;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'nguoi_tao')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'created_by') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN nguoi_tao TO created_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'ngay_tao')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'created_date') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN ngay_tao TO created_date;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'nguoi_sua_doi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'updated_by') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN nguoi_sua_doi TO updated_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'ngay_sua_doi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = 'updated_date') THEN
    ALTER TABLE ship_repair_facility RENAME COLUMN ngay_sua_doi TO updated_date;
  END IF;
END $$;

-- 6. Rename index (guarded)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_co_sua_chua_dong_tau_org_unit')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ship_repair_facility_org_unit') THEN
    ALTER INDEX idx_co_sua_chua_dong_tau_org_unit RENAME TO idx_ship_repair_facility_org_unit;
  END IF;
END $$;

-- 7. Recreate FK constraints safely
-- Drop old FK (IF EXISTS makes this safe if already dropped) and add new FK (only if missing)
ALTER TABLE ship_repair_facility_attachment DROP CONSTRAINT IF EXISTS fk_co_sua_chua_attachment;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_ship_repair_facility_attachment') THEN
    ALTER TABLE ship_repair_facility_attachment ADD CONSTRAINT fk_ship_repair_facility_attachment FOREIGN KEY (ship_repair_facility_id) REFERENCES ship_repair_facility(id);
  END IF;
END $$;

ALTER TABLE phe_duyet_lich_su DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_cosuachua;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_phe_duyet_lich_su_ship_repair') THEN
    ALTER TABLE phe_duyet_lich_su ADD CONSTRAINT fk_phe_duyet_lich_su_ship_repair FOREIGN KEY (ship_repair_facility_id) REFERENCES ship_repair_facility(id);
  END IF;
END $$;
