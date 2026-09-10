-- ============================================================================
-- Migration: V20260910170000__alter_dai_ttdh_display_rule_to_varchar.sql
-- Mô tả: Chuyển đổi cột display_rule trong bảng dai_ttdh sang VARCHAR(255)
--        đồng bộ với Pier, Berth, Buoy, BeaconLight (chuẩn GIS VTS CHK).
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dai_ttdh' AND column_name = 'display_rule'
    ) THEN
        ALTER TABLE public.dai_ttdh ALTER COLUMN display_rule TYPE VARCHAR(255) USING display_rule::text;
    END IF;
END $$;
