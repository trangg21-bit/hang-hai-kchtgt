-- V64: Rename and alter spatial_geometries to spatial_object_categories to match the UI requirements (Category Configuration)

DROP TABLE IF EXISTS spatial_geometries;

CREATE TABLE IF NOT EXISTS spatial_object_categories (
    id UUID PRIMARY KEY,
    
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    geometry_type INTEGER NOT NULL, -- 1: Point, 2: LineString, 3: Polygon
    icon_id UUID,                   -- Maps to the icon/symbol
    
    status INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(36)
);
