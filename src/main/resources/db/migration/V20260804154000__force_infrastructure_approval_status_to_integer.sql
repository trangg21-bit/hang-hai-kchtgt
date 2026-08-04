-- Force convert approval_status to INTEGER for infrastructure entities
ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
ALTER TABLE public.dike_revetment ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
ALTER TABLE public.navigation_channel ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
ALTER TABLE public.ship_repair_facility ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
ALTER TABLE public.radar_station ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
