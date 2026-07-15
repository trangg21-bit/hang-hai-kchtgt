-- V47: Convert ref_type from VARCHAR to INTEGER in gis_spatial_objects table

-- 1. Create temporary column
ALTER TABLE gis_spatial_objects ADD COLUMN ref_type_new INTEGER;

-- 2. Map existing string values to integers based on KchtType ordinal
UPDATE gis_spatial_objects 
SET ref_type_new = CASE ref_type
    WHEN 'CANGBIEN' THEN 0
    WHEN 'BENCANG' THEN 1
    WHEN 'CAUCANG' THEN 2
    WHEN 'CANGCAN' THEN 3
    WHEN 'VUNGNUOC' THEN 4
    WHEN 'DEKE' THEN 5
    WHEN 'LUONGHANGHAI' THEN 6
    WHEN 'COSO_SUACHUA' THEN 7
    WHEN 'DENBIEN' THEN 8
    WHEN 'PHAOTIEU' THEN 9
    WHEN 'HE_THONG_VTS' THEN 10
    WHEN 'TRAM_RADAR' THEN 11
    WHEN 'BENPHAO' THEN 12
    WHEN 'KHUNEO_DAU' THEN 13
    WHEN 'KHUCHUYEN_TAI' THEN 14
    WHEN 'KHUTRANH_TRU_BAO' THEN 15
    ELSE NULL
END;

-- 3. Drop old column and rename new column
ALTER TABLE gis_spatial_objects DROP COLUMN ref_type;
ALTER TABLE gis_spatial_objects RENAME COLUMN ref_type_new TO ref_type;
