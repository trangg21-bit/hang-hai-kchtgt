-- Migration: Convert map_layers layer_type to INTEGER and status to BOOLEAN

-- 1. Convert layer_type column to INTEGER
ALTER TABLE map_layers ALTER COLUMN layer_type TYPE INTEGER USING (
    CASE UPPER(layer_type::text)
        WHEN 'POINT' THEN 1
        WHEN 'LINE' THEN 2
        WHEN 'POLYGON' THEN 3
        WHEN 'BASEMAP' THEN 4
        WHEN 'OVERLAY' THEN 5
        WHEN '1' THEN 1
        WHEN '2' THEN 2
        WHEN '3' THEN 3
        WHEN '4' THEN 4
        WHEN '5' THEN 5
        ELSE 1
    END
);

-- 2. Convert status column to BOOLEAN (true = Active, false = Inactive)
ALTER TABLE map_layers ALTER COLUMN status TYPE BOOLEAN USING (
    CASE UPPER(status::text)
        WHEN 'ACTIVE' THEN true
        WHEN '1' THEN true
        WHEN 'TRUE' THEN true
        WHEN 'INACTIVE' THEN false
        WHEN '0' THEN false
        WHEN 'FALSE' THEN false
        ELSE true
    END
);

-- Set default values
ALTER TABLE map_layers ALTER COLUMN status SET DEFAULT true;
