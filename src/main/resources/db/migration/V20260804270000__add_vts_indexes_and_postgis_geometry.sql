-- V20260804270000: Add performance indexes for vts_system and enable PostGIS geometry column with automatic sync trigger on gis_spatial_objects

-- 1. Create B-Tree Indexes on vts_system for fast list queries and filtering
CREATE INDEX IF NOT EXISTS idx_vts_system_org_unit ON public.vts_system (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_vts_system_approval_status ON public.vts_system (approval_status);
CREATE INDEX IF NOT EXISTS idx_vts_system_condition_status ON public.vts_system (condition_status);
CREATE INDEX IF NOT EXISTS idx_vts_system_created_at ON public.vts_system (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vts_system_deleted_at ON public.vts_system (deleted_at);
CREATE INDEX IF NOT EXISTS idx_vts_system_spatial_id ON public.vts_system (spatial_id);

-- 2. Create index on gis_spatial_objects for fast ref lookup
CREATE INDEX IF NOT EXISTS idx_gis_spatial_objects_ref ON public.gis_spatial_objects (ref_type, ref_id);

-- 3. Enable PostGIS Extension and add GEOMETRY column
DO $$
BEGIN
    -- Try to enable PostGIS
    CREATE EXTENSION IF NOT EXISTS postgis;

    -- Add geom column if not present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'geom'
    ) THEN
        ALTER TABLE public.gis_spatial_objects ADD COLUMN geom geometry(Geometry, 4326);
    END IF;

    -- Populate geom from WKT coordinates where coordinates is valid WKT
    UPDATE public.gis_spatial_objects
    SET geom = ST_SetSRID(ST_GeomFromText(coordinates), 4326)
    WHERE coordinates IS NOT NULL 
      AND trim(coordinates) <> ''
      AND (
        coordinates ILIKE 'POINT%' OR 
        coordinates ILIKE 'LINESTRING%' OR 
        coordinates ILIKE 'POLYGON%' OR 
        coordinates ILIKE 'MULTIPOINT%' OR 
        coordinates ILIKE 'MULTILINESTRING%' OR 
        coordinates ILIKE 'MULTIPOLYGON%'
      )
      AND (geom IS NULL);

    -- Create GiST Spatial Index on geom column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'geom'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_gis_spatial_objects_geom ON public.gis_spatial_objects USING GIST(geom);
    END IF;

    -- 4. Create trigger to automatically keep geom synchronized when coordinates are inserted/updated
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'geom'
    ) THEN
        EXECUTE '
            CREATE OR REPLACE FUNCTION public.fn_sync_gis_spatial_geom()
            RETURNS TRIGGER AS $trg$
            BEGIN
                IF NEW.coordinates IS NOT NULL AND trim(NEW.coordinates) <> '''' THEN
                    BEGIN
                        NEW.geom := ST_SetSRID(ST_GeomFromText(NEW.coordinates), 4326);
                    EXCEPTION WHEN OTHERS THEN
                        NEW.geom := NULL;
                    END;
                ELSE
                    NEW.geom := NULL;
                END IF;
                RETURN NEW;
            END;
            $trg$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trg_sync_gis_spatial_geom ON public.gis_spatial_objects;
            CREATE TRIGGER trg_sync_gis_spatial_geom
            BEFORE INSERT OR UPDATE OF coordinates ON public.gis_spatial_objects
            FOR EACH ROW
            EXECUTE FUNCTION public.fn_sync_gis_spatial_geom();
        ';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS setup notice: %', SQLERRM;
END $$;

