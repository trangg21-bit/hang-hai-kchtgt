-- Convert transfer_area_mooring_water_areas audit columns from VARCHAR(100) to UUID.
-- Entity TransferAreaMooringWaterArea extends BaseEntity (UUID fields), but V20260828010000
-- created these columns as VARCHAR(100) -> ClassCastException (String -> UUID) on list reads.
-- Same bug as anchorage, fixed there by V20260826120000.
-- Safe cast: NULL or '' -> NULL, else ::text::uuid; deleted_at stays TIMESTAMP (untouched).
ALTER TABLE transfer_area_mooring_water_areas
    ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::text::uuid END),
    ALTER COLUMN updated_by TYPE UUID USING (CASE WHEN updated_by IS NULL OR updated_by = '' THEN NULL ELSE updated_by::text::uuid END),
    ALTER COLUMN deleted_by TYPE UUID USING (CASE WHEN deleted_by IS NULL OR deleted_by = '' THEN NULL ELSE deleted_by::text::uuid END);
