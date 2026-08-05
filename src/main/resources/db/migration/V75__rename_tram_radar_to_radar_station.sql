-- V75: Rename tram_radar → radar_station with English column names
--
-- SAFE & IDEMPOTENT: Each operation checks preconditions using information_schema,
-- so this migration succeeds whether the old table exists, the new table already exists,
-- or some columns are already renamed. Safe to run multiple times.

-- 1. Rename main table (only if old exists and new does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tram_radar')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'radar_station') THEN
    ALTER TABLE tram_radar RENAME TO radar_station;
  END IF;
END $$;

-- 2. Rename attachment table (only if old exists and new does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tram_radar_attachment')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'radar_station_attachment') THEN
    ALTER TABLE tram_radar_attachment RENAME TO radar_station_attachment;
  END IF;
END $$;

-- 3. Rename columns in attachment table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'tram_radar_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'radar_station_id') THEN
    ALTER TABLE radar_station_attachment RENAME COLUMN tram_radar_id TO radar_station_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'ten_tai_lieu')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'file_name') THEN
    ALTER TABLE radar_station_attachment RENAME COLUMN ten_tai_lieu TO file_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'duong_dan')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'file_path') THEN
    ALTER TABLE radar_station_attachment RENAME COLUMN duong_dan TO file_path;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'kich_thuoc')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'file_size') THEN
    ALTER TABLE radar_station_attachment RENAME COLUMN kich_thuoc TO file_size;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'loai_tai_lieu')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'document_type') THEN
    ALTER TABLE radar_station_attachment RENAME COLUMN loai_tai_lieu TO document_type;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'nguoi_tai_len')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'uploaded_by') THEN
    ALTER TABLE radar_station_attachment RENAME COLUMN nguoi_tai_len TO uploaded_by;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'ngay_tai_len')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'uploaded_date') THEN
    ALTER TABLE radar_station_attachment RENAME COLUMN ngay_tai_len TO uploaded_date;
  END IF;
END $$;

-- 4. Rename columns in phe_duyet_lich_su (approval history FK)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phe_duyet_lich_su' AND column_name = 'tram_radar_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phe_duyet_lich_su' AND column_name = 'radar_station_id') THEN
    ALTER TABLE phe_duyet_lich_su RENAME COLUMN tram_radar_id TO radar_station_id;
  END IF;
END $$;

-- 5. Rename columns in main table (one by one, guarded)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'ten_tram')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'station_name') THEN
    ALTER TABLE radar_station RENAME COLUMN ten_tram TO station_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'vi_tri')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'location') THEN
    ALTER TABLE radar_station RENAME COLUMN vi_tri TO location;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'loai_tram')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'station_type') THEN
    ALTER TABLE radar_station RENAME COLUMN loai_tram TO station_type;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'co_trinh')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'coverage') THEN
    ALTER TABLE radar_station RENAME COLUMN co_trinh TO coverage;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'dien_tich_pha_xa')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'emission_area') THEN
    ALTER TABLE radar_station RENAME COLUMN dien_tich_pha_xa TO emission_area;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'nguon_goc')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'source') THEN
    ALTER TABLE radar_station RENAME COLUMN nguon_goc TO source;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'tinh_trang')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'condition_status') THEN
    ALTER TABLE radar_station RENAME COLUMN tinh_trang TO condition_status;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'trang_thai')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'approval_status') THEN
    ALTER TABLE radar_station RENAME COLUMN trang_thai TO approval_status;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'phe_duyet_c1')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'approved_level1') THEN
    ALTER TABLE radar_station RENAME COLUMN phe_duyet_c1 TO approved_level1;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'nguoi_phe_duyet_c1')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'approver_level1') THEN
    ALTER TABLE radar_station RENAME COLUMN nguoi_phe_duyet_c1 TO approver_level1;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'ngay_phe_duyet_c1')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'approved_date_level1') THEN
    ALTER TABLE radar_station RENAME COLUMN ngay_phe_duyet_c1 TO approved_date_level1;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'phe_duyet_c2')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'approved_level2') THEN
    ALTER TABLE radar_station RENAME COLUMN phe_duyet_c2 TO approved_level2;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'nguoi_phe_duyet_c2')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'approver_level2') THEN
    ALTER TABLE radar_station RENAME COLUMN nguoi_phe_duyet_c2 TO approver_level2;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'ngay_phe_duyet_c2')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'approved_date_level2') THEN
    ALTER TABLE radar_station RENAME COLUMN ngay_phe_duyet_c2 TO approved_date_level2;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'ly_do_tu_choi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'rejection_reason') THEN
    ALTER TABLE radar_station RENAME COLUMN ly_do_tu_choi TO rejection_reason;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'nguoi_tao')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'created_by') THEN
    ALTER TABLE radar_station RENAME COLUMN nguoi_tao TO created_by;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'ngay_tao')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'created_date') THEN
    ALTER TABLE radar_station RENAME COLUMN ngay_tao TO created_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'nguoi_sua_doi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'updated_by') THEN
    ALTER TABLE radar_station RENAME COLUMN nguoi_sua_doi TO updated_by;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'ngay_sua_doi')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'updated_date') THEN
    ALTER TABLE radar_station RENAME COLUMN ngay_sua_doi TO updated_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'chieu_cao_thap_radar')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'tower_height') THEN
    ALTER TABLE radar_station RENAME COLUMN chieu_cao_thap_radar TO tower_height;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'tam_hieu_luc_radar')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station' AND column_name = 'radar_range') THEN
    ALTER TABLE radar_station RENAME COLUMN tam_hieu_luc_radar TO radar_range;
  END IF;
END $$;

-- 6. Drop old FK constraint on radar_station_attachment, recreate with new column name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_tram_radar_attachment_radar') THEN
    ALTER TABLE radar_station_attachment DROP CONSTRAINT fk_tram_radar_attachment_radar;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radar_station_attachment' AND column_name = 'radar_station_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_radar_station_attachment_radar') THEN
    ALTER TABLE radar_station_attachment ADD CONSTRAINT fk_radar_station_attachment_radar FOREIGN KEY (radar_station_id) REFERENCES radar_station(id);
  END IF;
END $$;

-- 7. Drop old FK constraint in phe_duyet_lich_su, recreate with new column name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_phe_duyet_lich_su_radar') THEN
    ALTER TABLE phe_duyet_lich_su DROP CONSTRAINT fk_phe_duyet_lich_su_radar;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phe_duyet_lich_su' AND column_name = 'radar_station_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_phe_duyet_lich_su_radar_station') THEN
    IF EXISTS (
      SELECT 1
      FROM phe_duyet_lich_su history
      LEFT JOIN radar_station station ON station.id = history.radar_station_id
      WHERE station.id IS NULL
    ) THEN
      ALTER TABLE phe_duyet_lich_su
        ADD CONSTRAINT fk_phe_duyet_lich_su_radar_station
        FOREIGN KEY (radar_station_id) REFERENCES radar_station(id) NOT VALID;
    ELSE
      ALTER TABLE phe_duyet_lich_su
        ADD CONSTRAINT fk_phe_duyet_lich_su_radar_station
        FOREIGN KEY (radar_station_id) REFERENCES radar_station(id);
    END IF;
  END IF;
END $$;
