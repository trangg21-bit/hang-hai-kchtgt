-- V69: Drop bieu_tuong_id from all KCHT tables and gis_spatial_objects

DO $$ 
DECLARE
    t_name text;
BEGIN
    FOR t_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('spatial_object_categories', 'map_symbols')
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS bieu_tuong_id', t_name);
            EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS icon_id', t_name);
        EXCEPTION
            WHEN OTHERS THEN
                -- ignore
        END;
    END LOOP;
END $$;
