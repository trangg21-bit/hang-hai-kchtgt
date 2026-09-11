-- V20260911160000: Tang do chinh xac cot so cua dry_ports len NUMERIC(28,4) va text len VARCHAR(2000) dong bo voi Pier va Cảng biển
ALTER TABLE dry_ports ALTER COLUMN area TYPE NUMERIC(28, 4);
ALTER TABLE dry_ports ALTER COLUMN teu_capacity TYPE NUMERIC(28, 4);
ALTER TABLE dry_ports ALTER COLUMN warehouse_area TYPE NUMERIC(28, 4);
ALTER TABLE dry_ports ALTER COLUMN yard_area TYPE NUMERIC(28, 4);
ALTER TABLE dry_ports ALTER COLUMN connection_mode TYPE VARCHAR(2000);
ALTER TABLE dry_ports ALTER COLUMN remarks TYPE VARCHAR(2000);
