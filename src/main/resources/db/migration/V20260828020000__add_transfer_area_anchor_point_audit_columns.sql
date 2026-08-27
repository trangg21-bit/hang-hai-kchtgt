-- Add missing audit columns to transfer_area_mooring_water_area_anchor_points.
-- Entity TransferAreaMooringWaterAreaAnchorPoint extends BaseEntity; V20260828010000 created the
-- table without created_by/updated_by/deleted_at/deleted_by, so the INSERT fails at runtime
-- ('column created_by does not exist') — same bug as anchorage, fixed there by V20260826110000.
-- Types follow the anchorage fix standard (UUID/UUID/TIMESTAMP/UUID).
ALTER TABLE transfer_area_mooring_water_area_anchor_points
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;
