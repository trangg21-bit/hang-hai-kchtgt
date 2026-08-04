-- V20260804240000: Fix column types in gis_spatial_objects to match Java entity (SMALLINT for enums, UUID for IDs)

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Convert enum columns in gis_spatial_objects to SMALLINT if they are currently varchar/text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' 
          AND column_name = 'geometry_type' AND data_type NOT IN ('smallint', 'integer')
    ) THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN geometry_type DROP DEFAULT;
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN geometry_type TYPE SMALLINT USING (
            CASE 
                WHEN geometry_type::text = 'POINT' THEN 0
                WHEN geometry_type::text = 'LINE' OR geometry_type::text = 'LINESTRING' THEN 1
                WHEN geometry_type::text = 'POLYGON' THEN 2
                WHEN geometry_type::text ~ '^[0-9]+$' THEN geometry_type::text::smallint
                ELSE 0
            END
        );
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' 
          AND column_name = 'object_type' AND data_type NOT IN ('smallint', 'integer')
    ) THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN object_type DROP DEFAULT;
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN object_type TYPE SMALLINT USING (
            CASE 
                WHEN object_type::text ~ '^[0-9]+$' THEN object_type::text::smallint
                ELSE 0
            END
        );
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' 
          AND column_name = 'status' AND data_type NOT IN ('smallint', 'integer')
    ) THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN status TYPE SMALLINT USING (
            CASE 
                WHEN status::text = 'DRAFT' THEN 0
                WHEN status::text = 'ACTIVE' OR status::text = 'PUBLISHED' THEN 1
                WHEN status::text = 'INACTIVE' THEN 2
                WHEN status::text ~ '^[0-9]+$' THEN status::text::smallint
                ELSE 0
            END
        );
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' 
          AND column_name = 'approval_status' AND data_type NOT IN ('smallint', 'integer')
    ) THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN approval_status DROP DEFAULT;
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE 
                WHEN approval_status::text = 'PENDING' OR approval_status::text = 'PROPOSED' THEN 0
                WHEN approval_status::text = 'APPROVED' THEN 1
                WHEN approval_status::text = 'REJECTED' THEN 2
                WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint
                ELSE 0
            END
        );
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' 
          AND column_name = 'ref_type' AND data_type NOT IN ('smallint', 'integer')
    ) THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN ref_type DROP DEFAULT;
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN ref_type TYPE SMALLINT USING (
            CASE 
                WHEN ref_type::text ~ '^[0-9]+$' THEN ref_type::text::smallint
                ELSE 0
            END
        );
    END IF;

    -- 2. Convert UUID columns in gis_spatial_objects to UUID
    FOR r IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'gis_spatial_objects'
          AND column_name IN ('unit_id', 'approved_by', 'ref_id', 'created_by', 'updated_by', 'deleted_by')
          AND data_type IN ('character varying', 'varchar', 'text')
    LOOP
        EXECUTE format('
            ALTER TABLE public.gis_spatial_objects 
            ALTER COLUMN %I TYPE UUID USING (
                CASE 
                    WHEN %I IS NULL OR trim(%I) = '''' THEN NULL
                    WHEN %I ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' 
                    THEN %I::uuid 
                    ELSE NULL 
                END
            )
        ', r.column_name, r.column_name, r.column_name, r.column_name, r.column_name);
    END LOOP;
END $$;
