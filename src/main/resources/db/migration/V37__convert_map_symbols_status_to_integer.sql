-- V37: Convert map_symbols status column from VARCHAR to INTEGER

-- Convert existing text values to integers
UPDATE map_symbols SET status = '0' WHERE status ILIKE 'inactive';
UPDATE map_symbols SET status = '2' WHERE status ILIKE 'deprecated';
UPDATE map_symbols SET status = '1' WHERE status IS NULL OR (status NOT ILIKE '0' AND status NOT ILIKE '2');

-- Alter the column type to integer
ALTER TABLE map_symbols ALTER COLUMN status TYPE INTEGER USING (status::INTEGER);
