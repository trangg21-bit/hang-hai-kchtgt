-- V68: Update bieu_tuong_id/map_symbol_id of existing KCHT and gis_spatial_objects from spatial_object_categories

DO $$
DECLARE
    cat_icon UUID;
BEGIN
    -- 0: CANGBIEN
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'CANG_BIEN' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 0;
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cang_bien') THEN
            UPDATE cang_bien SET bieu_tuong_id = cat_icon;
        ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ports') THEN
            UPDATE ports SET map_symbol_id = cat_icon;
        END IF;
    END IF;

    -- 1: BENCANG
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'BEN_CANG' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 1;
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ben_cang') THEN
            UPDATE ben_cang SET bieu_tuong_id = cat_icon;
        ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'berths') THEN
            UPDATE berths SET map_symbol_id = cat_icon;
        END IF;
    END IF;

    -- 3: CANGCAN
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'CANG_CAN' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 3;
    END IF;

    -- 4: VUNGNUOC
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'VUNG_NUOC' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 4;
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vung_nuoc') THEN
            UPDATE vung_nuoc SET bieu_tuong_id = cat_icon;
        ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'water_zones') THEN
            UPDATE water_zones SET map_symbol_id = cat_icon;
        END IF;
    END IF;

    -- 5: DEKE
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'DE_KE' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 5;
    END IF;

    -- 6: LUONGHANGHAI
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'LUONG_HH' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 6;
    END IF;

    -- 8: DENBIEN
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'DEN_BIEN' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 8;
    END IF;

    -- 9: PHAOTIEU
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'PHAO_TIEU' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 9;
    END IF;

    -- 10: HE_THONG_VTS
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'HE_THONG_VTS' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 10;
    END IF;

    -- 11: TRAM_RADAR
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'TRAM_RADAR' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 11;
    END IF;

    -- 16: DAI_TTDH
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'DAI_TTDH' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 16;
    END IF;

    -- 21: NHATRAM_PHAO
    SELECT icon_id INTO cat_icon FROM spatial_object_categories WHERE code = 'NHA_TRAM_PHAO' LIMIT 1;
    IF cat_icon IS NOT NULL THEN
        UPDATE gis_spatial_objects SET bieu_tuong_id = cat_icon WHERE ref_type = 21;
    END IF;

END $$;
