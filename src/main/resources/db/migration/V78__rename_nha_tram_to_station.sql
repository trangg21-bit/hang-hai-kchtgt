-- V78: Rename nha_tram_* → *_station with English table names
--
-- These tables already have English column names (type, status, approval_status, etc.),
-- so we only rename the tables themselves and their PK constraints.
-- SAFE & IDEMPOTENT: Each operation checks preconditions using information_schema.

-- 1. Rename nha_tram_den → lighthouse_station
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nha_tram_den')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lighthouse_station') THEN
    ALTER TABLE nha_tram_den RENAME TO lighthouse_station;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'nha_tram_den_pkey')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'lighthouse_station_pkey') THEN
    ALTER INDEX nha_tram_den_pkey RENAME TO lighthouse_station_pkey;
  END IF;
END $$;

-- 2. Rename nha_tram_phao → buoy_station
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nha_tram_phao')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buoy_station') THEN
    ALTER TABLE nha_tram_phao RENAME TO buoy_station;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'nha_tram_phao_pkey')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'buoy_station_pkey') THEN
    ALTER INDEX nha_tram_phao_pkey RENAME TO buoy_station_pkey;
  END IF;
END $$;

-- 3. Rename nha_tram_history → station_history
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nha_tram_history')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'station_history') THEN
    ALTER TABLE nha_tram_history RENAME TO station_history;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'nha_tram_history_pkey')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'station_history_pkey') THEN
    ALTER INDEX nha_tram_history_pkey RENAME TO station_history_pkey;
  END IF;
END $$;

-- 4. Rename column tram_type → station_type in station_history (if old column exists and new column does not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'station_history' AND column_name = 'tram_type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'station_history' AND column_name = 'station_type') THEN
    ALTER TABLE station_history RENAME COLUMN tram_type TO station_type;
  END IF;
END $$;

-- 5. Rename spatial FK constraints on lighthouse_station and buoy_station
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'fk_nhatramden_spatial')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'fk_lighthouse_station_spatial') THEN
    ALTER INDEX fk_nhatramden_spatial RENAME TO fk_lighthouse_station_spatial;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'fk_nhatramphao_spatial')
     AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'fk_buoy_station_spatial') THEN
    ALTER INDEX fk_nhatramphao_spatial RENAME TO fk_buoy_station_spatial;
  END IF;
END $$;
