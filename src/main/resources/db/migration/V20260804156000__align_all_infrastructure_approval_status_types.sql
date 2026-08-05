-- Align approval_status data types with Java JPA mappings
ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE SMALLINT USING approval_status::smallint;
ALTER TABLE public.dike_revetment ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
ALTER TABLE public.navigation_channel ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
ALTER TABLE public.ship_repair_facility ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
ALTER TABLE public.radar_station ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
