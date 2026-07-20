-- V57: Convert remaining KCHT primary keys to UUID and shipyard type to integer

-- =========================================================================
-- 1. Table: de_ke
-- =========================================================================

-- Add temporary columns
ALTER TABLE de_ke ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE de_ke_attachment ADD COLUMN new_de_ke_id UUID;
ALTER TABLE phe_duyet_lich_su_de_ke ADD COLUMN new_de_ke_id UUID;

-- Update child tables
UPDATE de_ke_attachment a SET new_de_ke_id = d.new_id FROM de_ke d WHERE a.de_ke_id = d.id;
UPDATE phe_duyet_lich_su_de_ke p SET new_de_ke_id = d.new_id FROM de_ke d WHERE p.de_ke_id = d.id;

-- Drop constraints
ALTER TABLE de_ke DROP CONSTRAINT IF EXISTS de_ke_pkey CASCADE;

-- Drop old columns and rename
ALTER TABLE de_ke DROP COLUMN id;
ALTER TABLE de_ke RENAME COLUMN new_id TO id;
ALTER TABLE de_ke ADD PRIMARY KEY (id);

ALTER TABLE de_ke_attachment DROP COLUMN de_ke_id;
ALTER TABLE de_ke_attachment RENAME COLUMN new_de_ke_id TO de_ke_id;
ALTER TABLE de_ke_attachment ALTER COLUMN de_ke_id SET NOT NULL;

ALTER TABLE phe_duyet_lich_su_de_ke DROP COLUMN de_ke_id;
ALTER TABLE phe_duyet_lich_su_de_ke RENAME COLUMN new_de_ke_id TO de_ke_id;
ALTER TABLE phe_duyet_lich_su_de_ke ALTER COLUMN de_ke_id SET NOT NULL;

-- Re-add constraints
ALTER TABLE de_ke_attachment ADD CONSTRAINT fk_de_ke_attachment_de_ke FOREIGN KEY (de_ke_id) REFERENCES de_ke(id);
ALTER TABLE phe_duyet_lich_su_de_ke ADD CONSTRAINT fk_phe_duyet_lich_su_de_ke_de_ke FOREIGN KEY (de_ke_id) REFERENCES de_ke(id);

-- =========================================================================
-- 2. Table: luong_hang_hai
-- =========================================================================

ALTER TABLE luong_hang_hai ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE luong_hang_hai_attachment ADD COLUMN new_luong_hang_hai_id UUID;
ALTER TABLE phe_duyet_lich_su ADD COLUMN new_luong_hang_hai_id UUID;

UPDATE luong_hang_hai_attachment a SET new_luong_hang_hai_id = l.new_id FROM luong_hang_hai l WHERE a.luong_hang_hai_id = l.id;
UPDATE phe_duyet_lich_su p SET new_luong_hang_hai_id = l.new_id FROM luong_hang_hai l WHERE p.luong_hang_hai_id = l.id;

ALTER TABLE luong_hang_hai DROP CONSTRAINT IF EXISTS luong_hang_hai_pkey CASCADE;

ALTER TABLE luong_hang_hai DROP COLUMN id;
ALTER TABLE luong_hang_hai RENAME COLUMN new_id TO id;
ALTER TABLE luong_hang_hai ADD PRIMARY KEY (id);

ALTER TABLE luong_hang_hai_attachment DROP COLUMN luong_hang_hai_id;
ALTER TABLE luong_hang_hai_attachment RENAME COLUMN new_luong_hang_hai_id TO luong_hang_hai_id;
ALTER TABLE luong_hang_hai_attachment ALTER COLUMN luong_hang_hai_id SET NOT NULL;

ALTER TABLE phe_duyet_lich_su DROP COLUMN luong_hang_hai_id;
ALTER TABLE phe_duyet_lich_su RENAME COLUMN new_luong_hang_hai_id TO luong_hang_hai_id;

ALTER TABLE luong_hang_hai_attachment ADD CONSTRAINT fk_luong_hang_hai_attachment_luong FOREIGN KEY (luong_hang_hai_id) REFERENCES luong_hang_hai(id);
ALTER TABLE phe_duyet_lich_su ADD CONSTRAINT fk_phe_duyet_lich_su_luong FOREIGN KEY (luong_hang_hai_id) REFERENCES luong_hang_hai(id);

-- =========================================================================
-- 3. Table: he_thong_vts
-- =========================================================================

ALTER TABLE he_thong_vts ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE he_thong_vts_attachment ADD COLUMN new_he_thong_vts_id UUID;
ALTER TABLE phe_duyet_lich_su ADD COLUMN new_he_thong_vts_id UUID;
ALTER TABLE tram_radar ADD COLUMN new_he_thong_vts_id UUID;

UPDATE he_thong_vts_attachment a SET new_he_thong_vts_id = v.new_id FROM he_thong_vts v WHERE a.he_thong_vts_id = v.id;
UPDATE phe_duyet_lich_su p SET new_he_thong_vts_id = v.new_id FROM he_thong_vts v WHERE p.he_thong_vts_id = v.id;
UPDATE tram_radar t SET new_he_thong_vts_id = v.new_id FROM he_thong_vts v WHERE t.he_thong_vts_id = v.id;

ALTER TABLE he_thong_vts DROP CONSTRAINT IF EXISTS he_thong_vts_pkey CASCADE;

ALTER TABLE he_thong_vts DROP COLUMN id;
ALTER TABLE he_thong_vts RENAME COLUMN new_id TO id;
ALTER TABLE he_thong_vts ADD PRIMARY KEY (id);

ALTER TABLE he_thong_vts_attachment DROP COLUMN he_thong_vts_id;
ALTER TABLE he_thong_vts_attachment RENAME COLUMN new_he_thong_vts_id TO he_thong_vts_id;
ALTER TABLE he_thong_vts_attachment ALTER COLUMN he_thong_vts_id SET NOT NULL;

ALTER TABLE phe_duyet_lich_su DROP COLUMN he_thong_vts_id;
ALTER TABLE phe_duyet_lich_su RENAME COLUMN new_he_thong_vts_id TO he_thong_vts_id;

ALTER TABLE tram_radar DROP COLUMN he_thong_vts_id;
ALTER TABLE tram_radar RENAME COLUMN new_he_thong_vts_id TO he_thong_vts_id;

ALTER TABLE he_thong_vts_attachment ADD CONSTRAINT fk_he_thong_vts_attachment_vts FOREIGN KEY (he_thong_vts_id) REFERENCES he_thong_vts(id);
ALTER TABLE phe_duyet_lich_su ADD CONSTRAINT fk_phe_duyet_lich_su_vts FOREIGN KEY (he_thong_vts_id) REFERENCES he_thong_vts(id);

-- =========================================================================
-- 4. Table: tram_radar
-- =========================================================================

ALTER TABLE tram_radar ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE tram_radar_attachment ADD COLUMN new_tram_radar_id UUID;
ALTER TABLE phe_duyet_lich_su ADD COLUMN new_tram_radar_id UUID;

UPDATE tram_radar_attachment a SET new_tram_radar_id = t.new_id FROM tram_radar t WHERE a.tram_radar_id = t.id;
UPDATE phe_duyet_lich_su p SET new_tram_radar_id = t.new_id FROM tram_radar t WHERE p.tram_radar_id = t.id;

ALTER TABLE tram_radar DROP CONSTRAINT IF EXISTS tram_radar_pkey CASCADE;

ALTER TABLE tram_radar DROP COLUMN id;
ALTER TABLE tram_radar RENAME COLUMN new_id TO id;
ALTER TABLE tram_radar ADD PRIMARY KEY (id);

ALTER TABLE tram_radar_attachment DROP COLUMN tram_radar_id;
ALTER TABLE tram_radar_attachment RENAME COLUMN new_tram_radar_id TO tram_radar_id;
ALTER TABLE tram_radar_attachment ALTER COLUMN tram_radar_id SET NOT NULL;

ALTER TABLE phe_duyet_lich_su DROP COLUMN tram_radar_id;
ALTER TABLE phe_duyet_lich_su RENAME COLUMN new_tram_radar_id TO tram_radar_id;

ALTER TABLE tram_radar_attachment ADD CONSTRAINT fk_tram_radar_attachment_radar FOREIGN KEY (tram_radar_id) REFERENCES tram_radar(id);
ALTER TABLE phe_duyet_lich_su ADD CONSTRAINT fk_phe_duyet_lich_su_radar FOREIGN KEY (tram_radar_id) REFERENCES tram_radar(id);
ALTER TABLE tram_radar ADD CONSTRAINT fk_tram_radar_he_thong_vts FOREIGN KEY (he_thong_vts_id) REFERENCES he_thong_vts(id);

-- =========================================================================
-- 5. Table: co_sua_chua_dong_tau
-- =========================================================================

ALTER TABLE co_sua_chua_dong_tau ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE co_sua_chua_dong_tau_attachment ADD COLUMN new_co_sua_chua_id UUID;
ALTER TABLE phe_duyet_lich_su ADD COLUMN new_co_sua_chua_id UUID;

UPDATE co_sua_chua_dong_tau_attachment a SET new_co_sua_chua_id = c.new_id FROM co_sua_chua_dong_tau c WHERE a.co_sua_chua_id = c.id;
UPDATE phe_duyet_lich_su p SET new_co_sua_chua_id = c.new_id FROM co_sua_chua_dong_tau c WHERE p.co_sua_chua_id = c.id;

ALTER TABLE co_sua_chua_dong_tau DROP CONSTRAINT IF EXISTS co_sua_chua_dong_tau_pkey CASCADE;

ALTER TABLE co_sua_chua_dong_tau DROP COLUMN id;
ALTER TABLE co_sua_chua_dong_tau RENAME COLUMN new_id TO id;
ALTER TABLE co_sua_chua_dong_tau ADD PRIMARY KEY (id);

ALTER TABLE co_sua_chua_dong_tau_attachment DROP COLUMN co_sua_chua_id;
ALTER TABLE co_sua_chua_dong_tau_attachment RENAME COLUMN new_co_sua_chua_id TO co_sua_chua_id;
ALTER TABLE co_sua_chua_dong_tau_attachment ALTER COLUMN co_sua_chua_id SET NOT NULL;

ALTER TABLE phe_duyet_lich_su DROP COLUMN co_sua_chua_id;
ALTER TABLE phe_duyet_lich_su RENAME COLUMN new_co_sua_chua_id TO co_sua_chua_id;

ALTER TABLE co_sua_chua_dong_tau_attachment ADD CONSTRAINT fk_co_sua_chua_attachment FOREIGN KEY (co_sua_chua_id) REFERENCES co_sua_chua_dong_tau(id);
ALTER TABLE phe_duyet_lich_su ADD CONSTRAINT fk_phe_duyet_lich_su_cosuachua FOREIGN KEY (co_sua_chua_id) REFERENCES co_sua_chua_dong_tau(id);

-- Loai co so conversion
ALTER TABLE co_sua_chua_dong_tau ADD COLUMN new_loai_co_so INTEGER;

UPDATE co_sua_chua_dong_tau
SET new_loai_co_so = CASE
    WHEN loai_co_so = 'CS_SUA_CHUA' THEN 1
    WHEN loai_co_so = 'CS_DONG_TAU' THEN 2
    WHEN loai_co_so = 'CS_SUA_CHUA_DONG_TAU' THEN 3
    ELSE 4
END;

ALTER TABLE co_sua_chua_dong_tau DROP COLUMN loai_co_so;
ALTER TABLE co_sua_chua_dong_tau RENAME COLUMN new_loai_co_so TO loai_co_so;
ALTER TABLE co_sua_chua_dong_tau ALTER COLUMN loai_co_so SET NOT NULL;

-- =========================================================================
-- 6. Update spatial linkages in gis_spatial_objects
-- =========================================================================
UPDATE gis_spatial_objects g SET ref_id = d.id FROM de_ke d WHERE g.id = d.spatial_id;
UPDATE gis_spatial_objects g SET ref_id = l.id FROM luong_hang_hai l WHERE g.id = l.spatial_id;
UPDATE gis_spatial_objects g SET ref_id = v.id FROM he_thong_vts v WHERE g.id = v.spatial_id;
UPDATE gis_spatial_objects g SET ref_id = t.id FROM tram_radar t WHERE g.id = t.spatial_id;
UPDATE gis_spatial_objects g SET ref_id = c.id FROM co_sua_chua_dong_tau c WHERE g.id = c.spatial_id;
