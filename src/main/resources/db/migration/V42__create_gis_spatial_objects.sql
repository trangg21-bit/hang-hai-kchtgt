-- V42: Create centralized gis_spatial_objects table, sync triggers, migrate data, and add spatial_id to KCHT tables
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Create centralized gis_spatial_objects table
CREATE TABLE IF NOT EXISTS gis_spatial_objects (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    deleted_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(255),
    
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    geometry_type INTEGER NOT NULL, -- 1: POINT, 2: LINE, 3: POLYGON
    object_type INTEGER NOT NULL,    -- Unified integers (10-14 for POINT, 20-23 for LINE, 30-35 for POLYGON)
    category_id BIGINT,
    bieu_tuong_id UUID,             -- Unified icon/symbol reference (maps from icon_id, line_symbol_id, fill_symbol_id)
    coordinates TEXT NOT NULL,      -- WKT coordinates representation
    geom GEOMETRY(Geometry, 4326),  -- PostGIS geometry column
    description VARCHAR(1000),
    status INTEGER NOT NULL DEFAULT 0,         -- 0: DRAFT, 1: PENDING_APPROVAL, etc.
    approval_status INTEGER NOT NULL DEFAULT 0, -- 0: PENDING, 1: APPROVED, 2: REJECTED
    unit_id UUID,
    approved_by BIGINT,
    approved_date TIMESTAMP,
    
    -- Specific fields for points
    cong_nang_khai_thac VARCHAR(255),
    
    -- Specific fields for lines
    length DOUBLE PRECISION,
    material VARCHAR(100),
    year_built INTEGER,
    
    -- Specific fields for polygons
    area DOUBLE PRECISION,
    purpose VARCHAR(500),
    restriction_level VARCHAR(50),
    
    -- Reference fields to link back to business tables if needed
    ref_id UUID,
    ref_type VARCHAR(50)
);

-- 2. Create GiST spatial index
CREATE INDEX IF NOT EXISTS idx_gis_spatial_objects_geom ON gis_spatial_objects USING gist (geom);



-- 4. Create before insert/update trigger to keep geom in sync with coordinates WKT
CREATE OR REPLACE FUNCTION update_gis_spatial_objects_geom()
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

DROP TRIGGER IF EXISTS trg_update_gis_spatial_objects_geom ON gis_spatial_objects;
CREATE TRIGGER trg_update_gis_spatial_objects_geom
BEFORE INSERT OR UPDATE ON gis_spatial_objects
FOR EACH ROW
EXECUTE FUNCTION update_gis_spatial_objects_geom();

-- 5. Migrate old data
-- 5.1 Migrate point_objects (convert lat/lon to WKT POINT(lon lat))
INSERT INTO gis_spatial_objects (
    id, created_at, created_by, deleted_at, updated_at, updated_by,
    name, code, geometry_type, object_type, category_id, bieu_tuong_id,
    coordinates, description, status, approval_status, unit_id,
    approved_by, approved_date, cong_nang_khai_thac
)
SELECT 
    id, created_at, created_by, deleted_at, updated_at, updated_by,
    name, code, 1, 
    CASE object_type 
        WHEN 'PORT' THEN 10
        WHEN 'LIGHTHOUSE' THEN 11
        WHEN 'BUOY' THEN 12
        WHEN 'BEACON' THEN 13
        ELSE 14
    END,
    category_id, icon_id,
    'POINT(' || longitude || ' ' || latitude || ')',
    description,
    CASE status
        WHEN 'DRAFT' THEN 0
        WHEN 'PENDING_APPROVAL' THEN 1
        WHEN 'APPROVED_L1' THEN 2
        WHEN 'APPROVED_L2' THEN 3
        WHEN 'PUBLISHED' THEN 4
        WHEN 'REJECTED' THEN 5
        ELSE 6
    END,
    CASE approval_status
        WHEN 'PENDING' THEN 0
        WHEN 'APPROVED' THEN 1
        ELSE 2
    END,
    unit_id, approved_by, approved_date, cong_nang_khai_thac
FROM point_objects
ON CONFLICT (code) DO NOTHING;

-- 5.2 Migrate line_objects
INSERT INTO gis_spatial_objects (
    id, created_at, created_by, deleted_at, updated_at, updated_by,
    name, code, geometry_type, object_type, category_id, bieu_tuong_id,
    coordinates, description, status, approval_status, unit_id,
    approved_by, approved_date, length, material, year_built
)
SELECT 
    id, created_at, created_by, deleted_at, updated_at, updated_by,
    name, code, 2, 
    CASE object_type 
        WHEN 'COASTLINE' THEN 20
        WHEN 'SHIPPING_ROUTE' THEN 21
        WHEN 'WATERWAY' THEN 22
        ELSE 23
    END,
    category_id, CAST(NULL AS UUID), -- line_symbol_id is bigint in schema, cannot cast directly to UUID. Setting null.
    coordinates, description,
    CASE status
        WHEN 'DRAFT' THEN 0
        WHEN 'PENDING_APPROVAL' THEN 1
        WHEN 'APPROVED_L1' THEN 2
        WHEN 'APPROVED_L2' THEN 3
        WHEN 'PUBLISHED' THEN 4
        WHEN 'REJECTED' THEN 5
        ELSE 6
    END,
    CASE approval_status
        WHEN 'PENDING' THEN 0
        WHEN 'APPROVED' THEN 1
        ELSE 2
    END,
    unit_id, approved_by, approved_date, length, material, year_built
FROM line_objects
ON CONFLICT (code) DO NOTHING;

-- 5.3 Migrate polygon_objects
INSERT INTO gis_spatial_objects (
    id, created_at, created_by, deleted_at, updated_at, updated_by,
    name, code, geometry_type, object_type, category_id, bieu_tuong_id,
    coordinates, description, status, approval_status, unit_id,
    approved_by, approved_date, area, purpose, restriction_level
)
SELECT 
    id, created_at, created_by, deleted_at, updated_at, updated_by,
    name, code, 3, 
    CASE object_type 
        WHEN 'WATER_ZONE' THEN 30
        WHEN 'ANCHORAGE' THEN 31
        WHEN 'STORM_SHELTER' THEN 32
        WHEN 'RESTRICTED_AREA' THEN 33
        WHEN 'LIMITED_ZONE' THEN 34
        ELSE 35
    END,
    category_id, CAST(NULL AS UUID), -- fill_symbol_id is bigint, setting null.
    coordinates, description,
    CASE status
        WHEN 'DRAFT' THEN 0
        WHEN 'PENDING_APPROVAL' THEN 1
        WHEN 'APPROVED_L1' THEN 2
        WHEN 'APPROVED_L2' THEN 3
        WHEN 'PUBLISHED' THEN 4
        WHEN 'REJECTED' THEN 5
        ELSE 6
    END,
    CASE approval_status
        WHEN 'PENDING' THEN 0
        WHEN 'APPROVED' THEN 1
        ELSE 2
    END,
    unit_id, approved_by, approved_date, area, purpose, restriction_level
FROM polygon_objects
ON CONFLICT (code) DO NOTHING;

-- 6. Add spatial_id column to business tables
ALTER TABLE cau_cang ADD COLUMN IF NOT EXISTS spatial_id UUID CONSTRAINT fk_cau_cang_spatial REFERENCES gis_spatial_objects(id) ON DELETE SET NULL;
ALTER TABLE vung_nuoc ADD COLUMN IF NOT EXISTS spatial_id UUID CONSTRAINT fk_vung_nuoc_spatial REFERENCES gis_spatial_objects(id) ON DELETE SET NULL;
ALTER TABLE de_ke ADD COLUMN IF NOT EXISTS spatial_id UUID CONSTRAINT fk_de_ke_spatial REFERENCES gis_spatial_objects(id) ON DELETE SET NULL;
ALTER TABLE luong_hang_hai ADD COLUMN IF NOT EXISTS spatial_id UUID CONSTRAINT fk_luong_hang_hai_spatial REFERENCES gis_spatial_objects(id) ON DELETE SET NULL;

-- 7. Drop redundant tables
DROP TABLE IF EXISTS point_objects CASCADE;
DROP TABLE IF EXISTS line_objects CASCADE;
DROP TABLE IF EXISTS polygon_objects CASCADE;
