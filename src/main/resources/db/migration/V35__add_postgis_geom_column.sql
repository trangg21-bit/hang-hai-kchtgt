-- V35: Add PostGIS geometry column, synchronization trigger, and GiST index for enc_features
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Add geometry column if not exists
ALTER TABLE enc_features ADD COLUMN IF NOT EXISTS geom GEOMETRY(Geometry, 4326);

-- 2. Create a safe wrapper function for ST_GeomFromText
CREATE OR REPLACE FUNCTION safe_st_geomfromtext(wkt text, srid integer)
RETURNS geometry AS $$
BEGIN
    IF wkt IS NULL OR wkt = '' THEN
        RETURN NULL;
    END IF;
    RETURN ST_GeomFromText(wkt, srid);
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Populate geometry column safely for existing data
UPDATE enc_features 
SET geom = safe_st_geomfromtext(coordinates, 4326) 
WHERE coordinates IS NOT NULL AND geom IS NULL;

-- 4. Create before insert/update trigger to keep geom in sync with coordinates WKT
CREATE OR REPLACE FUNCTION update_enc_features_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.coordinates IS NOT NULL THEN
        NEW.geom := safe_st_geomfromtext(NEW.coordinates, 4326);
    ELSE
        NEW.geom := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_enc_features_geom ON enc_features;
CREATE TRIGGER trg_update_enc_features_geom
BEFORE INSERT OR UPDATE ON enc_features
FOR EACH ROW
EXECUTE FUNCTION update_enc_features_geom();

-- 5. Create GiST spatial index
CREATE INDEX IF NOT EXISTS idx_enc_features_geom ON enc_features USING gist (geom);
