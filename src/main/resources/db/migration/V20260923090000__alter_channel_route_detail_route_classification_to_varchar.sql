-- Migration: V20260923090000__alter_channel_route_detail_route_classification_to_varchar.sql
-- Description: Convert channel_route_detail.route_classification from INTEGER to VARCHAR(50)
-- Reason: Route classification is a descriptive text code/name (e.g. "Cấp I", "Tuyến chính")
-- and is mapped as String in ChannelRouteDetail entity, DTOs, and Frontend Form.
-- Previous migration V20260826170000 incorrectly defined route_classification as INTEGER,
-- causing PSQLException: column "route_classification" is of type integer but expression is of type character varying.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'channel_route_detail'
          AND column_name = 'route_classification'
          AND data_type != 'character varying'
    ) THEN
        ALTER TABLE public.channel_route_detail
        ALTER COLUMN route_classification TYPE VARCHAR(50) USING route_classification::VARCHAR(50);
    END IF;
END $$;
