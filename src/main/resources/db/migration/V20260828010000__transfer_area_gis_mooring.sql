-- V: Bổ sung GIS + khu nước neo buộc tàu cho bảng transfer_areas (parity với anchorages)
-- 1) Cột GIS cho transfer_areas (giống anchorages: map_symbol_id, coordinate_system, display_rule, spatial_id)
ALTER TABLE transfer_areas
    ADD COLUMN IF NOT EXISTS map_symbol_id UUID,
    ADD COLUMN IF NOT EXISTS coordinate_system INTEGER,
    ADD COLUMN IF NOT EXISTS display_rule INTEGER,
    ADD COLUMN IF NOT EXISTS spatial_id UUID;

-- 2) Bảng khu nước neo buộc tàu (mooring water areas) — con của transfer_areas
CREATE TABLE IF NOT EXISTS transfer_area_mooring_water_areas (
    id UUID PRIMARY KEY,
    transfer_area_id UUID NOT NULL REFERENCES transfer_areas(id) ON DELETE CASCADE,
    description VARCHAR(1000),
    geometry_type VARCHAR(20),
    map_symbol_id UUID,
    coordinate_system INTEGER,
    display_rule VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_tamwa_transfer_area_id ON transfer_area_mooring_water_areas(transfer_area_id);

-- 3) Bảng điểm neo (anchor points) — con của transfer_area_mooring_water_areas
CREATE TABLE IF NOT EXISTS transfer_area_mooring_water_area_anchor_points (
    id UUID PRIMARY KEY,
    transfer_area_mooring_water_area_id UUID NOT NULL REFERENCES transfer_area_mooring_water_areas(id) ON DELETE CASCADE,
    name VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tamwa_anchor_points_mwa_id ON transfer_area_mooring_water_area_anchor_points(transfer_area_mooring_water_area_id);
