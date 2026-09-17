-- Cospas form accepts a 4,000-character coverage area and a 2,000-character note.
-- Keep the database and JPA limits aligned so valid form data is never truncated or rejected.
ALTER TABLE IF EXISTS public.coastal_station_cospas_sarsat
    ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(4000),
    ADD COLUMN IF NOT EXISTS description VARCHAR(2000);

ALTER TABLE IF EXISTS public.coastal_station_cospas_sarsat
    ALTER COLUMN coverage_area TYPE VARCHAR(4000) USING coverage_area::text,
    ALTER COLUMN description TYPE VARCHAR(2000) USING description::text;
