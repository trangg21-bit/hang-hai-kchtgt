-- ============================================================
-- Migration: Bổ sung cột services_provided cho Đài Cospas-Sarsat theo chuẩn LRIT
-- Timestamp: V20260916085500
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat'
    ) THEN
        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS services_provided VARCHAR(1000);
    END IF;
END $$;
