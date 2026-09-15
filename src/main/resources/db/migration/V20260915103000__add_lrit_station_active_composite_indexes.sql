-- V20260915103000: Add composite indexes for the active LRIT station list.
-- Existing LRIT indexes cover individual columns; these indexes match the
-- common soft-delete, scope/filter, and created/updated sort predicates.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_lrit_active_org_created_at
            ON public.coastal_station_lrit (org_unit_id, created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_lrit_active_org_updated_at
            ON public.coastal_station_lrit (org_unit_id, updated_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_lrit_active_approval_created_at
            ON public.coastal_station_lrit (approval_status, created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_lrit_active_org_approval_created_at
            ON public.coastal_station_lrit (org_unit_id, approval_status, created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_lrit_active_operating_org_created_at
            ON public.coastal_station_lrit (operating_org_id, created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_lrit_active_province_created_at
            ON public.coastal_station_lrit (province_id, created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_lrit_active_condition_created_at
            ON public.coastal_station_lrit (condition_status, created_at DESC)
            WHERE deleted_at IS NULL;

        -- /options always requests active, operational, approved stations and
        -- sorts them by LOWER(name).
        CREATE INDEX IF NOT EXISTS idx_lrit_active_options_name
            ON public.coastal_station_lrit (LOWER(name), org_unit_id)
            WHERE deleted_at IS NULL
              AND condition_status = 0
              AND approval_status IN (4, 5);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping composite index creation on coastal_station_lrit: %', SQLERRM;
END $$;
