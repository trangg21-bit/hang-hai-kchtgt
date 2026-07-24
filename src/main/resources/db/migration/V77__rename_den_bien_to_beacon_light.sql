-- V77: Rename den_bien → beacon_light with English column names
--
-- SAFE & IDEMPOTENT: Each operation checks preconditions using information_schema,
-- so this migration succeeds whether the old table exists, the new table already exists,
-- or some columns are already renamed. Safe to run multiple times.

-- 1. Rename main table (only if old exists and new does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'den_bien')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'beacon_light') THEN
    ALTER TABLE den_bien RENAME TO beacon_light;
  END IF;
END $$;

-- 2. Rename PK constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'den_bien_pkey')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'beacon_light_pkey') THEN
    ALTER INDEX den_bien_pkey RENAME TO beacon_light_pkey;
  END IF;
END $$;

-- 3. Drop old unique constraint, create new one
DO $$
BEGIN
  ALTER TABLE beacon_light DROP CONSTRAINT IF EXISTS uk_den_bien_ma;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'code')
     AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'uk_beacon_light_code') THEN
    ALTER TABLE beacon_light ADD CONSTRAINT uk_beacon_light_code UNIQUE (code);
  END IF;
END $$;

-- 4. Also drop any Hibernate-generated unique constraint that might exist
DO $$
BEGIN
  ALTER TABLE beacon_light DROP CONSTRAINT IF EXISTS ukbflnjodjjrp150kyn3fct6qwu;
END $$;

-- 5. Rename columns (Vietnamese → English, one by one, guarded)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'ma_den_bien')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'code') THEN
    ALTER TABLE beacon_light RENAME COLUMN ma_den_bien TO code;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'ten_den_bien')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'name') THEN
    ALTER TABLE beacon_light RENAME COLUMN ten_den_bien TO name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'dia_diem_dat_tram_den')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'location') THEN
    ALTER TABLE beacon_light RENAME COLUMN dia_diem_dat_tram_den TO location;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'vi_do')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'latitude') THEN
    ALTER TABLE beacon_light RENAME COLUMN vi_do TO latitude;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'kinh_do')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'longitude') THEN
    ALTER TABLE beacon_light RENAME COLUMN kinh_do TO longitude;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'tam_hieu_luc_anh_sang')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'light_range') THEN
    ALTER TABLE beacon_light RENAME COLUMN tam_hieu_luc_anh_sang TO light_range;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'mau_sac_ben_ngoai_cua_thap_den')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'tower_color') THEN
    ALTER TABLE beacon_light RENAME COLUMN mau_sac_ben_ngoai_cua_thap_den TO tower_color;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'cap_tram_den')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'type') THEN
    ALTER TABLE beacon_light RENAME COLUMN cap_tram_den TO type;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'thoi_diem_dua_vao_su_dung')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'commissioned_date') THEN
    ALTER TABLE beacon_light RENAME COLUMN thoi_diem_dua_vao_su_dung TO commissioned_date;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'thoi_diem_sua_chua_gan_nhat')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'last_repair_date') THEN
    ALTER TABLE beacon_light RENAME COLUMN thoi_diem_sua_chua_gan_nhat TO last_repair_date;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'dien_tich')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'area') THEN
    ALTER TABLE beacon_light RENAME COLUMN dien_tich TO area;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'chieu_cao_thap_den')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'tower_height') THEN
    ALTER TABLE beacon_light RENAME COLUMN chieu_cao_thap_den TO tower_height;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'chieu_cao_tam_sang')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'light_height') THEN
    ALTER TABLE beacon_light RENAME COLUMN chieu_cao_tam_sang TO light_height;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'tam_hieu_luc_dia_ly')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'geographic_range') THEN
    ALTER TABLE beacon_light RENAME COLUMN tam_hieu_luc_dia_ly TO geographic_range;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'chung_loai_den_chinh')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'primary_light_model') THEN
    ALTER TABLE beacon_light RENAME COLUMN chung_loai_den_chinh TO primary_light_model;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'chung_loai_den_du_phong')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'backup_light_model') THEN
    ALTER TABLE beacon_light RENAME COLUMN chung_loai_den_du_phong TO backup_light_model;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'nguon_cung_cap_nang_luong_cho_den')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'power_supply') THEN
    ALTER TABLE beacon_light RENAME COLUMN nguon_cung_cap_nang_luong_cho_den TO power_supply;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'so_luong_nhan_su_bo_tri')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'staff_count') THEN
    ALTER TABLE beacon_light RENAME COLUMN so_luong_nhan_su_bo_tri TO staff_count;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'dien_tich_su_dung_tram')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'station_area') THEN
    ALTER TABLE beacon_light RENAME COLUMN dien_tich_su_dung_tram TO station_area;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'hinh_dang')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'shape') THEN
    ALTER TABLE beacon_light RENAME COLUMN hinh_dang TO shape;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'ket_cau')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beacon_light' AND column_name = 'structure') THEN
    ALTER TABLE beacon_light RENAME COLUMN ket_cau TO structure;
  END IF;
END $$;
