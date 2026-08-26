-- Add missing audit columns to mooring_water_area_anchor_points.
-- Entity MooringWaterAreaAnchorPoint extends BaseEntity; V20260825130000 created the
-- table without created_by/updated_by/deleted_at/deleted_by, so the INSERT fails at runtime.
-- Types follow the V20260825120000__create_anchorages.sql standard (UUID/UUID/TIMESTAMP/UUID).
ALTER TABLE mooring_water_area_anchor_points
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;
