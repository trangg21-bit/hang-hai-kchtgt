ALTER TABLE public.coastal_station_lrit
    ADD COLUMN IF NOT EXISTS level1_approval_content VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS level2_approval_content VARCHAR(2000);

COMMENT ON COLUMN public.coastal_station_lrit.level1_approval_content IS
    'Nội dung/ý kiến phê duyệt cấp 1 của hồ sơ LRIT';
COMMENT ON COLUMN public.coastal_station_lrit.level2_approval_content IS
    'Nội dung/ý kiến phê duyệt cấp 2 của hồ sơ LRIT';
