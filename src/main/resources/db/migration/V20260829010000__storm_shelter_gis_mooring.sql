-- V: Bổ sung GIS + khu nước neo buộc tàu cho bảng storm_shelter_areas (parity với transfer_areas)
-- 1) Cột GIS cho storm_shelter_areas (giống transfer_areas: map_symbol_id, coordinate_system, display_rule, spatial_id)
ALTER TABLE storm_shelter_areas
    ADD COLUMN IF NOT EXISTS map_symbol_id UUID,
    ADD COLUMN IF NOT EXISTS coordinate_system INTEGER,
    ADD COLUMN IF NOT EXISTS display_rule INTEGER,
    ADD COLUMN IF NOT EXISTS spatial_id UUID;

-- 2) Bảng khu nước neo buộc tàu (mooring water areas) — con của storm_shelter_areas
CREATE TABLE IF NOT EXISTS storm_shelter_mooring_water_areas (
    id UUID PRIMARY KEY,
    storm_shelter_area_id UUID NOT NULL REFERENCES storm_shelter_areas(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_ssmwa_storm_shelter_area_id ON storm_shelter_mooring_water_areas(storm_shelter_area_id);

-- 3) Bảng điểm neo (anchor points) — con của storm_shelter_mooring_water_areas
CREATE TABLE IF NOT EXISTS storm_shelter_mooring_water_area_anchor_points (
    id UUID PRIMARY KEY,
    storm_shelter_mooring_water_area_id UUID NOT NULL REFERENCES storm_shelter_mooring_water_areas(id) ON DELETE CASCADE,
    name VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ssmwa_anchor_points_mwa_id ON storm_shelter_mooring_water_area_anchor_points(storm_shelter_mooring_water_area_id);
