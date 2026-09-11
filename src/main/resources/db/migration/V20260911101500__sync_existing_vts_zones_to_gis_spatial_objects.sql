-- V20260911101500__sync_existing_vts_zones_to_gis_spatial_objects.sql
-- Backfill gis_spatial_objects for existing vts_zone records having coordinates

DO $$
DECLARE
    rec RECORD;
    new_spatial_id UUID;
    zone_code_val VARCHAR(50);
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'vts_zone'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'vts_zone' AND column_name = 'coordinates'
    ) THEN
        FOR rec IN EXECUTE
            'SELECT z.id, z.name, z.code, z.coordinates, z.vts_system_id, s.org_unit_id ' ||
            'FROM vts_zone z ' ||
            'LEFT JOIN vts_system s ON s.id = z.vts_system_id ' ||
            'WHERE z.coordinates IS NOT NULL ' ||
            '  AND TRIM(z.coordinates) <> '''' ' ||
            '  AND z.spatial_id IS NULL'
        LOOP
            new_spatial_id := gen_random_uuid();
            zone_code_val := 'VTS_ZONE_' || SUBSTRING(REPLACE(new_spatial_id::text, '-', ''), 1, 16);
            
            INSERT INTO gis_spatial_objects (
                id,
                name,
                code,
                geometry_type,
                object_type,
                coordinates,
                status,
                ref_id,
                ref_type,
                unit_id,
                created_at,
                updated_at
            ) VALUES (
                new_spatial_id,
                COALESCE(rec.name, 'Phân vùng VTS'),
                zone_code_val,
                3, -- GisGeometryType.POLYGON = 3
                34, -- GisSpatialObjectType.POLYGON_LIMITED_ZONE = 34
                TRIM(rec.coordinates),
                4, -- GisSpatialStatus.PUBLISHED = 4
                rec.id,
                25, -- InfrastructureType.VTS_ZONE ordinal = 25
                rec.org_unit_id,
                NOW(),
                NOW()
            );

            UPDATE vts_zone
            SET spatial_id = new_spatial_id
            WHERE id = rec.id;
        END LOOP;
    END IF;
END $$;

