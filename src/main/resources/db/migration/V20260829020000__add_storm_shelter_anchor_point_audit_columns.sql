-- Add missing audit columns to storm_shelter_mooring_water_area_anchor_points.
-- Entity StormShelterMooringWaterAreaAnchorPoint extends BaseEntity; V20260829010000 created the
-- table without created_by/updated_by/deleted_at/deleted_by, so the INSERT fails at runtime
-- ('column created_by does not exist') — same bug as anchorage/transfer area, fixed there by
-- V20260826110000 / V20260828020000.
-- Types follow the anchorage fix standard (UUID/UUID/TIMESTAMP/UUID).
ALTER TABLE storm_shelter_mooring_water_area_anchor_points
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;
