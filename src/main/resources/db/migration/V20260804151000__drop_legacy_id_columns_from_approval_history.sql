-- Drop redundant foreign key columns from approval_history after polymorphic ref refactoring
ALTER TABLE public.approval_history 
    DROP COLUMN IF EXISTS radar_station_id,
    DROP COLUMN IF EXISTS ship_repair_facility_id,
    DROP COLUMN IF EXISTS vts_system_id,
    DROP COLUMN IF EXISTS navigation_channel_id,
    DROP COLUMN IF EXISTS dike_revetment_id;
