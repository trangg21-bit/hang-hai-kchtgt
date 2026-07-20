ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS spatial_id UUID NULL;
ALTER TABLE public.beacon_light DROP CONSTRAINT IF EXISTS fk_beaconlight_spatial;
ALTER TABLE public.beacon_light ADD CONSTRAINT fk_beaconlight_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;

ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS spatial_id UUID NULL;
ALTER TABLE public.buoy DROP CONSTRAINT IF EXISTS fk_buoy_spatial;
ALTER TABLE public.buoy ADD CONSTRAINT fk_buoy_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;

-- DO block to migrate existing data for public.beacon_light
DO $$
DECLARE
    rec RECORD;
    new_spatial_id UUID;
BEGIN
    FOR rec IN SELECT id, name, code, latitude, longitude, unit_id FROM public.beacon_light WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND spatial_id IS NULL LOOP
        new_spatial_id := gen_random_uuid();
        INSERT INTO public.gis_spatial_objects (id, name, code, geometry_type, object_type, coordinates, status, approval_status, unit_id, ref_id, ref_type, created_at, updated_at)
        VALUES (
            new_spatial_id,
            rec.name,
            'DENBIEN_' || rec.code,
            1, -- GisGeometryType.POINT = 1
            11, -- GisSpatialObjectType.POINT_LIGHTHOUSE = 11
            'POINT(' || rec.longitude || ' ' || rec.latitude || ')',
            4, -- GisSpatialStatus.PUBLISHED = 4
            1, -- GisSpatialApprovalStatus.APPROVED = 1
            rec.unit_id,
            rec.id,
            8, -- KchtType.DENBIEN = 8
            NOW(),
            NOW()
        );
        UPDATE public.beacon_light SET spatial_id = new_spatial_id WHERE id = rec.id;
    END LOOP;
END $$;

-- DO block to migrate existing data for public.buoy
DO $$
DECLARE
    rec RECORD;
    new_spatial_id UUID;
BEGIN
    FOR rec IN SELECT id, name, code, latitude, longitude, unit_id FROM public.buoy WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND spatial_id IS NULL LOOP
        new_spatial_id := gen_random_uuid();
        INSERT INTO public.gis_spatial_objects (id, name, code, geometry_type, object_type, coordinates, status, approval_status, unit_id, ref_id, ref_type, created_at, updated_at)
        VALUES (
            new_spatial_id,
            rec.name,
            'PHAOTIEU_' || rec.code,
            1, -- GisGeometryType.POINT = 1
            12, -- GisSpatialObjectType.POINT_BUOY = 12
            'POINT(' || rec.longitude || ' ' || rec.latitude || ')',
            4, -- GisSpatialStatus.PUBLISHED = 4
            1, -- GisSpatialApprovalStatus.APPROVED = 1
            rec.unit_id,
            rec.id,
            9, -- KchtType.PHAOTIEU = 9
            NOW(),
            NOW()
        );
        UPDATE public.buoy SET spatial_id = new_spatial_id WHERE id = rec.id;
    END LOOP;
END $$;
