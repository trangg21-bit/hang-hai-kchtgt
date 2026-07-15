ALTER TABLE public.cang_bien ADD COLUMN spatial_id UUID NULL;
ALTER TABLE public.cang_bien ADD CONSTRAINT fk_cangbien_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;

ALTER TABLE public.ben_cang ADD COLUMN spatial_id UUID NULL;
ALTER TABLE public.ben_cang ADD CONSTRAINT fk_bencang_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;

ALTER TABLE public.cang_can ADD COLUMN spatial_id UUID NULL;
ALTER TABLE public.cang_can ADD CONSTRAINT fk_cangcan_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;

ALTER TABLE public.nha_tram_den ADD COLUMN spatial_id UUID NULL;
ALTER TABLE public.nha_tram_den ADD CONSTRAINT fk_nhatramden_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;

ALTER TABLE public.nha_tram_phao ADD COLUMN spatial_id UUID NULL;
ALTER TABLE public.nha_tram_phao ADD CONSTRAINT fk_nhatramphao_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;

ALTER TABLE public.tram_radar ADD COLUMN spatial_id UUID NULL;
ALTER TABLE public.tram_radar ADD CONSTRAINT fk_tramradar_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;

-- DO block to migrate existing data for public.cang_bien
DO $$
DECLARE
    rec RECORD;
    new_spatial_id UUID;
BEGIN
    FOR rec IN SELECT id, ten_cang, ma_cang, vi_do, kinh_do, org_unit_id, bieu_tuong_id FROM public.cang_bien WHERE vi_do IS NOT NULL AND kinh_do IS NOT NULL AND spatial_id IS NULL LOOP
        new_spatial_id := gen_random_uuid();
        INSERT INTO public.gis_spatial_objects (id, name, code, geometry_type, object_type, coordinates, status, approval_status, unit_id, ref_id, ref_type, bieu_tuong_id, created_at, updated_at)
        VALUES (
            new_spatial_id,
            rec.ten_cang,
            'CANGBIEN_' || rec.ma_cang,
            1, -- GisGeometryType.POINT = 1
            10, -- GisSpatialObjectType.POINT_PORT = 10
            'POINT(' || rec.kinh_do || ' ' || rec.vi_do || ')',
            2, -- GisSpatialStatus.PUBLISHED = 2
            1, -- GisSpatialApprovalStatus.APPROVED = 1
            rec.org_unit_id,
            rec.id,
            0, -- KchtType.CANGBIEN = 0
            rec.bieu_tuong_id,
            NOW(),
            NOW()
        );
        UPDATE public.cang_bien SET spatial_id = new_spatial_id WHERE id = rec.id;
    END LOOP;
END $$;

-- DO block to migrate existing data for public.ben_cang
DO $$
DECLARE
    rec RECORD;
    new_spatial_id UUID;
BEGIN
    FOR rec IN SELECT id, ten_ben, ma_ben, vi_do, kinh_do, org_unit_id, bieu_tuong_id FROM public.ben_cang WHERE vi_do IS NOT NULL AND kinh_do IS NOT NULL AND spatial_id IS NULL LOOP
        new_spatial_id := gen_random_uuid();
        INSERT INTO public.gis_spatial_objects (id, name, code, geometry_type, object_type, coordinates, status, approval_status, unit_id, ref_id, ref_type, bieu_tuong_id, created_at, updated_at)
        VALUES (
            new_spatial_id,
            rec.ten_ben,
            'BENCANG_' || rec.ma_ben,
            1, -- GisGeometryType.POINT = 1
            10, -- GisSpatialObjectType.POINT_PORT = 10
            'POINT(' || rec.kinh_do || ' ' || rec.vi_do || ')',
            2, -- GisSpatialStatus.PUBLISHED = 2
            1, -- GisSpatialApprovalStatus.APPROVED = 1
            rec.org_unit_id,
            rec.id,
            1, -- KchtType.BENCANG = 1
            rec.bieu_tuong_id,
            NOW(),
            NOW()
        );
        UPDATE public.ben_cang SET spatial_id = new_spatial_id WHERE id = rec.id;
    END LOOP;
END $$;

-- DO block to migrate existing data for public.cang_can
DO $$
DECLARE
    rec RECORD;
    new_spatial_id UUID;
BEGIN
    FOR rec IN SELECT id, ten_cang_can, ma_cang_can, vi_do, kinh_do, org_unit_id, bieu_tuong_id FROM public.cang_can WHERE vi_do IS NOT NULL AND kinh_do IS NOT NULL AND spatial_id IS NULL LOOP
        new_spatial_id := gen_random_uuid();
        INSERT INTO public.gis_spatial_objects (id, name, code, geometry_type, object_type, coordinates, status, approval_status, unit_id, ref_id, ref_type, bieu_tuong_id, created_at, updated_at)
        VALUES (
            new_spatial_id,
            rec.ten_cang_can,
            'CANGCAN_' || rec.ma_cang_can,
            1, -- GisGeometryType.POINT = 1
            10, -- GisSpatialObjectType.POINT_PORT = 10
            'POINT(' || rec.kinh_do || ' ' || rec.vi_do || ')',
            2, -- GisSpatialStatus.PUBLISHED = 2
            1, -- GisSpatialApprovalStatus.APPROVED = 1
            rec.org_unit_id,
            rec.id,
            3, -- KchtType.CANGCAN = 3
            rec.bieu_tuong_id,
            NOW(),
            NOW()
        );
        UPDATE public.cang_can SET spatial_id = new_spatial_id WHERE id = rec.id;
    END LOOP;
END $$;

-- DO block to migrate existing data for public.nha_tram_den
DO $$
DECLARE
    rec RECORD;
    new_spatial_id UUID;
BEGIN
    FOR rec IN SELECT id, name, code, latitude, longitude, unit_id FROM public.nha_tram_den WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND spatial_id IS NULL LOOP
        new_spatial_id := gen_random_uuid();
        INSERT INTO public.gis_spatial_objects (id, name, code, geometry_type, object_type, coordinates, status, approval_status, unit_id, ref_id, ref_type, bieu_tuong_id, created_at, updated_at)
        VALUES (
            new_spatial_id,
            rec.name,
            'DENBIEN_' || rec.code,
            1, -- GisGeometryType.POINT = 1
            11, -- GisSpatialObjectType.POINT_LIGHTHOUSE = 11
            'POINT(' || rec.longitude || ' ' || rec.latitude || ')',
            2, -- GisSpatialStatus.PUBLISHED = 2
            1, -- GisSpatialApprovalStatus.APPROVED = 1
            rec.unit_id,
            rec.id,
            8, -- KchtType.DENBIEN = 8
            NULL,
            NOW(),
            NOW()
        );
        UPDATE public.nha_tram_den SET spatial_id = new_spatial_id WHERE id = rec.id;
    END LOOP;
END $$;

-- DO block to migrate existing data for public.nha_tram_phao
DO $$
DECLARE
    rec RECORD;
    new_spatial_id UUID;
BEGIN
    FOR rec IN SELECT id, name, code, latitude, longitude, unit_id FROM public.nha_tram_phao WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND spatial_id IS NULL LOOP
        new_spatial_id := gen_random_uuid();
        INSERT INTO public.gis_spatial_objects (id, name, code, geometry_type, object_type, coordinates, status, approval_status, unit_id, ref_id, ref_type, bieu_tuong_id, created_at, updated_at)
        VALUES (
            new_spatial_id,
            rec.name,
            'PHAOTIEU_' || rec.code,
            1, -- GisGeometryType.POINT = 1
            12, -- GisSpatialObjectType.POINT_BUOY = 12
            'POINT(' || rec.longitude || ' ' || rec.latitude || ')',
            2, -- GisSpatialStatus.PUBLISHED = 2
            1, -- GisSpatialApprovalStatus.APPROVED = 1
            rec.unit_id,
            rec.id,
            9, -- KchtType.PHAOTIEU = 9
            NULL,
            NOW(),
            NOW()
        );
        UPDATE public.nha_tram_phao SET spatial_id = new_spatial_id WHERE id = rec.id;
    END LOOP;
END $$;

-- DO block to migrate existing data for public.tram_radar
DO $$
DECLARE
    rec RECORD;
    new_spatial_id UUID;
BEGIN
    FOR rec IN SELECT id, ten_tram, vi_do, kinh_do, org_unit_id FROM public.tram_radar WHERE vi_do IS NOT NULL AND kinh_do IS NOT NULL AND spatial_id IS NULL LOOP
        new_spatial_id := gen_random_uuid();
        INSERT INTO public.gis_spatial_objects (id, name, code, geometry_type, object_type, coordinates, status, approval_status, unit_id, ref_id, ref_type, bieu_tuong_id, created_at, updated_at)
        VALUES (
            new_spatial_id,
            rec.ten_tram,
            'RADAR_' || rec.id,
            1, -- GisGeometryType.POINT = 1
            14, -- GisSpatialObjectType.POINT_OTHER = 14
            'POINT(' || rec.kinh_do || ' ' || rec.vi_do || ')',
            2, -- GisSpatialStatus.PUBLISHED = 2
            1, -- GisSpatialApprovalStatus.APPROVED = 1
            rec.org_unit_id,
            rec.id,
            11, -- KchtType.TRAM_RADAR = 11
            NULL,
            NOW(),
            NOW()
        );
        UPDATE public.tram_radar SET spatial_id = new_spatial_id WHERE id = rec.id;
    END LOOP;
END $$;
