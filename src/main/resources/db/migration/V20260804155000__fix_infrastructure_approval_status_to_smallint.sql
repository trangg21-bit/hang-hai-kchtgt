-- Convert approval_status to SMALLINT (int2) for infrastructure entities using @Enumerated(EnumType.ORDINAL) with columnDefinition = "SMALLINT"
ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE SMALLINT USING approval_status::smallint;
ALTER TABLE public.dike_revetment ALTER COLUMN approval_status TYPE SMALLINT USING approval_status::smallint;
ALTER TABLE public.navigation_channel ALTER COLUMN approval_status TYPE SMALLINT USING approval_status::smallint;
ALTER TABLE public.ship_repair_facility ALTER COLUMN approval_status TYPE SMALLINT USING approval_status::smallint;
ALTER TABLE public.radar_station ALTER COLUMN approval_status TYPE SMALLINT USING approval_status::smallint;
