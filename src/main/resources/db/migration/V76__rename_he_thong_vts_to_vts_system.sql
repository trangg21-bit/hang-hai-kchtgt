-- V76: Rename he_thong_vts → vts_system with English column names
--
-- SAFE & IDEMPOTENT: Each operation checks preconditions using information_schema,
-- so this migration succeeds whether the old table exists, the new table already exists,
-- or some columns are already renamed. Safe to run multiple times.

-- 1. Rename main table (only if old exists and new does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'he_thong_vts')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vts_system') THEN
    ALTER TABLE he_thong_vts RENAME TO vts_system;
  END IF;
END $$;

-- 2. Rename attachment table (only if old exists and new does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'he_thong_vts_attachment')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vts_system_attachment') THEN
    ALTER TABLE he_thong_vts_attachment RENAME TO vts_system_attachment;
  END IF;
END $$;

-- 3. Rename PK constraint on main table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'he_thong_vts_pkey')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'vts_system_pkey') THEN
    ALTER INDEX he_thong_vts_pkey RENAME TO vts_system_pkey;
  END IF;
END $$;

-- 4. Rename PK constraint on attachment table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'he_thong_vts_attachment_pkey')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'vts_system_attachment_pkey') THEN
    ALTER INDEX he_thong_vts_attachment_pkey RENAME TO vts_system_attachment_pkey;
  END IF;
END $$;

-- 5. Rename index
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_he_thong_vts_org_unit')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vts_system_org_unit') THEN
    ALTER INDEX idx_he_thong_vts_org_unit RENAME TO idx_vts_system_org_unit;
  END IF;
END $$;

-- 6. Rename columns in main table (vts_system)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'ten_he_thong')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'system_name') THEN
    ALTER TABLE vts_system RENAME COLUMN ten_he_thong TO system_name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'vi_tri')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'location') THEN
    ALTER TABLE vts_system RENAME COLUMN vi_tri TO location;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'tinh_trang')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'condition_status') THEN
    ALTER TABLE vts_system RENAME COLUMN tinh_trang TO condition_status;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'trang_thai')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'approval_status') THEN
    ALTER TABLE vts_system RENAME COLUMN trang_thai TO approval_status;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'nguon_goc')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'source') THEN
    ALTER TABLE vts_system RENAME COLUMN nguon_goc TO source;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'doi_tac')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'partner') THEN
    ALTER TABLE vts_system RENAME COLUMN doi_tac TO partner;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'muc_do_phu_trach')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'responsibility_level') THEN
    ALTER TABLE vts_system RENAME COLUMN muc_do_phu_trach TO responsibility_level;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'pham_vi_ap_dung')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'scope') THEN
    ALTER TABLE vts_system RENAME COLUMN pham_vi_ap_dung TO scope;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'ly_do_tu_choi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'rejection_reason') THEN
    ALTER TABLE vts_system RENAME COLUMN ly_do_tu_choi TO rejection_reason;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'phe_duyet_c1')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'approved_level1') THEN
    ALTER TABLE vts_system RENAME COLUMN phe_duyet_c1 TO approved_level1;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'nguoi_phe_duyet_c1')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'approver_level1') THEN
    ALTER TABLE vts_system RENAME COLUMN nguoi_phe_duyet_c1 TO approver_level1;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'ngay_phe_duyet_c1')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'approved_date_level1') THEN
    ALTER TABLE vts_system RENAME COLUMN ngay_phe_duyet_c1 TO approved_date_level1;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'phe_duyet_c2')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'approved_level2') THEN
    ALTER TABLE vts_system RENAME COLUMN phe_duyet_c2 TO approved_level2;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'nguoi_phe_duyet_c2')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'approver_level2') THEN
    ALTER TABLE vts_system RENAME COLUMN nguoi_phe_duyet_c2 TO approver_level2;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'ngay_phe_duyet_c2')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'approved_date_level2') THEN
    ALTER TABLE vts_system RENAME COLUMN ngay_phe_duyet_c2 TO approved_date_level2;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'nguoi_tao')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'created_by') THEN
    ALTER TABLE vts_system RENAME COLUMN nguoi_tao TO created_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'nguoi_sua_doi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'updated_by') THEN
    ALTER TABLE vts_system RENAME COLUMN nguoi_sua_doi TO updated_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'ngay_tao')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'created_date') THEN
    ALTER TABLE vts_system RENAME COLUMN ngay_tao TO created_date;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'ngay_sua_doi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system' AND column_name = 'updated_date') THEN
    ALTER TABLE vts_system RENAME COLUMN ngay_sua_doi TO updated_date;
  END IF;
END $$;

-- 7. Rename FK column in attachment table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'he_thong_vts_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'vts_system_id') THEN
    ALTER TABLE vts_system_attachment RENAME COLUMN he_thong_vts_id TO vts_system_id;
  END IF;
END $$;

-- 8. Rename columns in attachment table (remaining columns)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'ten_tai_lieu')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'file_name') THEN
    ALTER TABLE vts_system_attachment RENAME COLUMN ten_tai_lieu TO file_name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'duong_dan')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'file_path') THEN
    ALTER TABLE vts_system_attachment RENAME COLUMN duong_dan TO file_path;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'kich_thuoc')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'file_size') THEN
    ALTER TABLE vts_system_attachment RENAME COLUMN kich_thuoc TO file_size;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'loai_tai_lieu')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'document_type') THEN
    ALTER TABLE vts_system_attachment RENAME COLUMN loai_tai_lieu TO document_type;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'nguoi_tai_len')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'uploaded_by') THEN
    ALTER TABLE vts_system_attachment RENAME COLUMN nguoi_tai_len TO uploaded_by;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'ngay_tai_len')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'uploaded_date') THEN
    ALTER TABLE vts_system_attachment RENAME COLUMN ngay_tai_len TO uploaded_date;
  END IF;
END $$;

-- 9. Drop old FK constraint on attachment and recreate with new column name
ALTER TABLE vts_system_attachment
  DROP CONSTRAINT IF EXISTS fk_he_thong_vts_attachment_vts;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vts_system_attachment' AND column_name = 'vts_system_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_vts_system_attachment_vts') THEN
    ALTER TABLE vts_system_attachment ADD CONSTRAINT fk_vts_system_attachment_vts FOREIGN KEY (vts_system_id) REFERENCES vts_system(id);
  END IF;
END $$;

-- 10. Rename spatial FK constraint on vts_system (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'fk_vts_spatial')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'fk_vts_system_spatial') THEN
    ALTER INDEX fk_vts_spatial RENAME TO fk_vts_system_spatial;
  END IF;
END $$;

-- 11. Drop old FK name on radar_station referencing vts_system (constraint still works after table rename)
--     The column he_thong_vts_id in radar_station is NOT renamed here; it will be handled separately.
ALTER TABLE radar_station
  DROP CONSTRAINT IF EXISTS fk_tram_radar_he_thong_vts;
