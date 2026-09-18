ALTER TABLE coastal_station_lrit
    DROP COLUMN IF EXISTS terminal_id,
    DROP COLUMN IF EXISTS imo_number,
    DROP COLUMN IF EXISTS reporting_interval,
    DROP COLUMN IF EXISTS antenna_height,
    DROP COLUMN IF EXISTS power_output,
    DROP COLUMN IF EXISTS antenna_type,
    DROP COLUMN IF EXISTS data_format,
    DROP COLUMN IF EXISTS communication_channel,
    DROP COLUMN IF EXISTS contact_person,
    DROP COLUMN IF EXISTS contact_phone;
