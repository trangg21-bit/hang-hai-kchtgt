-- Migration: V20260910140000__backfill_channel_route_detail_route_type.sql
-- Description: Backfill route_type = 1 (Công cộng) for existing channel_route_detail records where route_type is null

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'channel_route_detail'
          AND column_name = 'route_type'
    ) THEN
        UPDATE public.channel_route_detail
        SET route_type = 1
        WHERE route_type IS NULL;
    END IF;
END $$;
