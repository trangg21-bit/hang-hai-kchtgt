-- V111: Migrate port_coordinates data to gis_spatial_objects, then drop port_coordinates
-- NOTE: Numbered V111 (not V110) because V110__create_dashboard_snapshot.sql already exists.
-- bieu_tuong_id is intentionally NOT written here: V69 dropped that column from gis_spatial_objects.

-- Step 1: For each port with coordinates, aggregate into WKT and update/create gis_spatial_objects
DO $$
DECLARE
    rec RECORD;
    coords TEXT;
    first_point TEXT;
    new_spatial_id UUID;
    geom_type INT;
    obj_type INT;
BEGIN
    FOR rec IN
        SELECT p.id AS port_id, p.port_name, p.port_code, p.spatial_id, p.org_unit_id,
               COUNT(pc.id) AS coord_count
        FROM ports p
        JOIN port_coordinates pc ON pc.port_id = p.id
        WHERE p.deleted_at IS NULL
        GROUP BY p.id, p.port_name, p.port_code, p.spatial_id, p.org_unit_id
    LOOP
        -- Build WKT from all coordinates ordered by sort_order
        SELECT string_agg(lng || ' ' || lat, ', ' ORDER BY sort_order)
        INTO coords
        FROM (
            SELECT pc.longitude::TEXT AS lng, pc.latitude::TEXT AS lat, COALESCE(pc.sort_order, 0) AS sort_order
            FROM port_coordinates pc
            WHERE pc.port_id = rec.port_id
        ) sub;

        IF rec.coord_count = 1 THEN
            geom_type := 1; -- GisGeometryType.POINT = 1
            coords := 'POINT(' || coords || ')';
        ELSE
            geom_type := 3; -- GisGeometryType.POLYGON = 3
            -- First point (for polygon closure), same ordering as the aggregate above
            SELECT lng || ' ' || lat INTO first_point
            FROM (
                SELECT pc.longitude::TEXT AS lng, pc.latitude::TEXT AS lat
                FROM port_coordinates pc
                WHERE pc.port_id = rec.port_id
                ORDER BY COALESCE(pc.sort_order, 0)
                LIMIT 1
            ) first_pt;
            coords := 'POLYGON((' || coords || ', ' || first_point || '))';
        END IF;

        obj_type := 10; -- GisSpatialObjectType.POINT_PORT = 10

        IF rec.spatial_id IS NOT NULL THEN
            -- Update existing spatial object
            UPDATE gis_spatial_objects
            SET coordinates = coords, geometry_type = geom_type, object_type = obj_type,
                name = rec.port_name, code = 'PORT_' || rec.port_code,
                ref_id = rec.port_id, ref_type = 0, updated_at = NOW()
            WHERE id = rec.spatial_id;
        ELSE
            -- Create new spatial object
            new_spatial_id := gen_random_uuid();
            INSERT INTO gis_spatial_objects (id, name, code, geometry_type, object_type, coordinates,
                status, approval_status, unit_id, ref_id, ref_type, created_at, updated_at)
            VALUES (new_spatial_id, rec.port_name, 'PORT_' || rec.port_code, geom_type, obj_type, coords,
                2, 1, rec.org_unit_id, rec.port_id, 0, NOW(), NOW());
            UPDATE ports SET spatial_id = new_spatial_id WHERE id = rec.port_id;
        END IF;
    END LOOP;
END $$;

-- Step 2: Drop the port_coordinates table
DROP TABLE IF EXISTS port_coordinates CASCADE;
