-- Composite indexes for the Inmarsat/TTDH asset list and grouped status counts.
-- Keep the active-list indexes partial so archived history does not enlarge the hot path.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'coastal_station_assets'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_type_org_updated
            ON public.coastal_station_assets(asset_type, org_unit_id, updated_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_type_parent_org_updated
            ON public.coastal_station_assets(asset_type, parent_org_unit_id, updated_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_type_using_org_updated
            ON public.coastal_station_assets(asset_type, using_org_unit_id, updated_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_type_station_updated
            ON public.coastal_station_assets(asset_type, station_id, updated_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_type_condition_updated
            ON public.coastal_station_assets(asset_type, asset_condition, updated_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_type_approval_updated
            ON public.coastal_station_assets(asset_type, approval_status, updated_at DESC)
            WHERE deleted_at IS NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping composite index creation on coastal_station_assets: %', SQLERRM;
END $$;
