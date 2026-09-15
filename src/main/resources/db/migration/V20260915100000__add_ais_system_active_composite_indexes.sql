-- V20260915100000: Add composite indexes for the active AIS list and lookups.
-- The list query filters soft-deleted rows through its normal status paths and
-- commonly sorts the remaining rows by created_at/updated_at.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ais_system'
    ) THEN
        -- Covers the most common scoped list query and keeps the sort in index order.
        CREATE INDEX IF NOT EXISTS idx_ais_system_active_org_created_at
            ON public.ais_system (org_unit_id, created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_ais_system_active_org_updated_at
            ON public.ais_system (org_unit_id, updated_at DESC)
            WHERE deleted_at IS NULL;

        -- Status tabs filter approval_status and use created_at as the stable tie-breaker.
        CREATE INDEX IF NOT EXISTS idx_ais_system_active_approval_created_at
            ON public.ais_system (approval_status, created_at DESC)
            WHERE deleted_at IS NULL;

        -- The combined key avoids scanning all active rows when both scope and
        -- approval status are supplied by the list request.
        CREATE INDEX IF NOT EXISTS idx_ais_system_active_org_approval_created_at
            ON public.ais_system (org_unit_id, approval_status, created_at DESC)
            WHERE deleted_at IS NULL;

        -- Child AIS lookup from the VTS operation-center detail screen.
        CREATE INDEX IF NOT EXISTS idx_ais_system_active_vts_center_created_at
            ON public.ais_system (vts_operation_center_id, created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_ais_system_active_radar_station_created_at
            ON public.ais_system (radar_station_id, created_at DESC)
            WHERE deleted_at IS NULL;

        -- /options always requests active, operational, approved AIS systems
        -- and orders them by LOWER(name).
        CREATE INDEX IF NOT EXISTS idx_ais_system_active_options_name
            ON public.ais_system (LOWER(name), org_unit_id)
            WHERE deleted_at IS NULL
              AND condition_status = 0
              AND approval_status IN (4, 5);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping composite index creation on ais_system: %', SQLERRM;
END $$;
