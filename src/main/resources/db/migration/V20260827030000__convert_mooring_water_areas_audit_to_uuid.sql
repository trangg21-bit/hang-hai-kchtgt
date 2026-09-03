-- Convert mooring_water_areas audit columns from VARCHAR(100) to UUID.
-- Entity MooringWaterArea extends BaseEntity (UUID), but V20260825130000 created these
-- columns as VARCHAR(100) -> ClassCastException (String -> UUID) on list reads.
-- Safe cast: NULL or '' -> NULL, else ::text::uuid; deleted_at stays TIMESTAMP (untouched).
ALTER TABLE mooring_water_areas
    ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END),
    ALTER COLUMN updated_by TYPE UUID USING (CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END),
    ALTER COLUMN deleted_by TYPE UUID USING (CASE WHEN deleted_by IS NULL OR deleted_by::text = '' THEN NULL ELSE deleted_by::text::uuid END);
