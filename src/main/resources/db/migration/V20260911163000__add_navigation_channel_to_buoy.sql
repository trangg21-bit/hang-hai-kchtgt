-- Migration to add navigation_channel_id to buoy table
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS navigation_channel_id UUID;
CREATE INDEX IF NOT EXISTS idx_buoy_navigation_channel_id ON public.buoy(navigation_channel_id);
COMMENT ON COLUMN public.buoy.navigation_channel_id IS 'ID luong hang hai lien ket voi phao tieu';
