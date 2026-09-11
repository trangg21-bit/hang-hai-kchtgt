-- Existing environments may already have infrastructure_history from Hibernate.
-- In that case V20260825162500's CREATE TABLE IF NOT EXISTS cannot add newer columns.
ALTER TABLE public.infrastructure_history
    ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
