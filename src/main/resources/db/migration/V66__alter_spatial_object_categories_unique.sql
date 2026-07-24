-- V66: Alter spatial_object_categories unique constraint to allow same code for different geometry_types

DO $$
DECLARE
    row record;
BEGIN
    FOR row IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'spatial_object_categories'::regclass
          AND contype = 'u'
    LOOP
        EXECUTE 'ALTER TABLE spatial_object_categories DROP CONSTRAINT ' || quote_ident(row.conname);
    END LOOP;
END
$$;

ALTER TABLE spatial_object_categories ADD CONSTRAINT spatial_object_categories_code_geom_key UNIQUE (code, geometry_type);
