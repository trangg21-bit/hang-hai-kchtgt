-- ==============================================================================
-- Migration: Standardize coastal_station_haiphong GIS spatial objects and drop duplicate columns
-- Timestamp: 20260903194000
-- 1. Sync data between duplicate columns before dropping (code, name, org_unit_id)
-- 2. Backfill coordinates into gis_spatial_objects for all 5 stations and link spatial_id
-- 3. Add symbol_id UUID and index
-- 4. Drop flat GIS columns: latitude, longitude, coordinate_system, display_rule, geometry_type, symbol
-- 5. Drop duplicate & legacy columns: station_code, station_name, unit_id, status, is_active
-- 6. Add performance indexes for filtering, DataScope and approval workflow
-- ==============================================================================

-- 1. Đảm bảo dữ liệu được đồng bộ đầy đủ từ cột cũ sang cột mới trước khi drop
UPDATE public.coastal_station_haiphong
SET code = COALESCE(code, station_code),
    name = COALESCE(name, station_name),
    org_unit_id = COALESCE(org_unit_id, unit_id);

-- 2. Đảm bảo bảng gis_spatial_objects có đầy đủ cột audit
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 3. Tạo các đối tượng GIS không gian trong gis_spatial_objects và liên kết spatial_id cho 5 đài TTXLTT
DO $$
DECLARE
    v_st1_id UUID;
    v_st2_id UUID;
    v_st3_id UUID;
    v_st4_id UUID;
    v_st5_id UUID;
    v_sp1_id UUID := gen_random_uuid();
    v_sp2_id UUID := gen_random_uuid();
    v_sp3_id UUID := gen_random_uuid();
    v_sp4_id UUID := gen_random_uuid();
    v_sp5_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO v_st1_id FROM public.coastal_station_haiphong WHERE code = 'TTXLTT-0001' OR station_code = 'TTXLTT-0001' LIMIT 1;
    SELECT id INTO v_st2_id FROM public.coastal_station_haiphong WHERE code = 'TTXLTT-0002' OR station_code = 'TTXLTT-0002' LIMIT 1;
    SELECT id INTO v_st3_id FROM public.coastal_station_haiphong WHERE code = 'TTXLTT-0003' OR station_code = 'TTXLTT-0003' LIMIT 1;
    SELECT id INTO v_st4_id FROM public.coastal_station_haiphong WHERE code = 'TTXLTT-0004' OR station_code = 'TTXLTT-0004' LIMIT 1;
    SELECT id INTO v_st5_id FROM public.coastal_station_haiphong WHERE code = 'TTXLTT-0005' OR station_code = 'TTXLTT-0005' LIMIT 1;

    -- Hà Nội: [105.787680, 21.037240]
    IF v_st1_id IS NOT NULL THEN
        INSERT INTO public.gis_spatial_objects (
            id, name, code, geometry_type, object_type, coordinates, ref_id, ref_type, status, created_at, updated_at
        ) VALUES (
            v_sp1_id,
            'Trung tâm Xử lý Thông tin Hàng hải Hà Nội',
            'HAIPHONG_' || v_st1_id::text,
            0, -- GisGeometryType.POINT
            5, -- GisSpatialObjectType.POINT_OTHER
            '[105.787680,21.037240]',
            v_st1_id,
            23, -- InfrastructureType.HANOI_STATION
            1,  -- PUBLISHED
            NOW(), NOW()
        ) ON CONFLICT DO NOTHING;
        UPDATE public.coastal_station_haiphong SET spatial_id = v_sp1_id WHERE id = v_st1_id;
    END IF;

    -- Hải Phòng: [106.688084, 20.844911]
    IF v_st2_id IS NOT NULL THEN
        INSERT INTO public.gis_spatial_objects (
            id, name, code, geometry_type, object_type, coordinates, ref_id, ref_type, status, created_at, updated_at
        ) VALUES (
            v_sp2_id,
            'Đài TTXLTT Hàng hải Hải Phòng',
            'HAIPHONG_' || v_st2_id::text,
            0,
            5,
            '[106.688084,20.844911]',
            v_st2_id,
            23,
            1,
            NOW(), NOW()
        ) ON CONFLICT DO NOTHING;
        UPDATE public.coastal_station_haiphong SET spatial_id = v_sp2_id WHERE id = v_st2_id;
    END IF;

    -- Đà Nẵng: [108.220833, 16.054444]
    IF v_st3_id IS NOT NULL THEN
        INSERT INTO public.gis_spatial_objects (
            id, name, code, geometry_type, object_type, coordinates, ref_id, ref_type, status, created_at, updated_at
        ) VALUES (
            v_sp3_id,
            'Đài TTXLTT Hàng hải Đà Nẵng',
            'HAIPHONG_' || v_st3_id::text,
            0,
            5,
            '[108.220833,16.054444]',
            v_st3_id,
            23,
            1,
            NOW(), NOW()
        ) ON CONFLICT DO NOTHING;
        UPDATE public.coastal_station_haiphong SET spatial_id = v_sp3_id WHERE id = v_st3_id;
    END IF;

    -- Quy Nhơn: [109.219662, 13.782967]
    IF v_st4_id IS NOT NULL THEN
        INSERT INTO public.gis_spatial_objects (
            id, name, code, geometry_type, object_type, coordinates, ref_id, ref_type, status, created_at, updated_at
        ) VALUES (
            v_sp4_id,
            'Đài TTXLTT Hàng hải Quy Nhơn',
            'HAIPHONG_' || v_st4_id::text,
            0,
            5,
            '[109.219662,13.782967]',
            v_st4_id,
            23,
            1,
            NOW(), NOW()
        ) ON CONFLICT DO NOTHING;
        UPDATE public.coastal_station_haiphong SET spatial_id = v_sp4_id WHERE id = v_st4_id;
    END IF;

    -- Cần Thơ: [105.783802, 10.045162]
    IF v_st5_id IS NOT NULL THEN
        INSERT INTO public.gis_spatial_objects (
            id, name, code, geometry_type, object_type, coordinates, ref_id, ref_type, status, created_at, updated_at
        ) VALUES (
            v_sp5_id,
            'Đài TTXLTT Hàng hải Cần Thơ',
            'HAIPHONG_' || v_st5_id::text,
            0,
            5,
            '[105.783802,10.045162]',
            v_st5_id,
            23,
            1,
            NOW(), NOW()
        ) ON CONFLICT DO NOTHING;
        UPDATE public.coastal_station_haiphong SET spatial_id = v_sp5_id WHERE id = v_st5_id;
    END IF;
END $$;

-- 4. Bổ sung cột symbol_id UUID phục vụ chọn biểu tượng bản đồ MapSymbol
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS symbol_id UUID;

-- 5. Xóa bỏ hoàn toàn các cột GIS phẳng khỏi bảng coastal_station_haiphong
ALTER TABLE public.coastal_station_haiphong
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS longitude,
    DROP COLUMN IF EXISTS coordinate_system,
    DROP COLUMN IF EXISTS display_rule,
    DROP COLUMN IF EXISTS geometry_type,
    DROP COLUMN IF EXISTS symbol;

-- 6. Xóa bỏ hoàn toàn các cột trùng lặp và legacy
ALTER TABLE public.coastal_station_haiphong
    DROP COLUMN IF EXISTS station_code,
    DROP COLUMN IF EXISTS station_name,
    DROP COLUMN IF EXISTS unit_id,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS is_active;

-- 7. Đánh các chỉ mục hiệu năng (Performance Indexes)
CREATE INDEX IF NOT EXISTS idx_cs_haiphong_org_unit ON public.coastal_station_haiphong (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_cs_haiphong_approval_status ON public.coastal_station_haiphong (approval_status);
CREATE INDEX IF NOT EXISTS idx_cs_haiphong_condition_status ON public.coastal_station_haiphong (condition_status);
CREATE INDEX IF NOT EXISTS idx_cs_haiphong_deleted_at ON public.coastal_station_haiphong (deleted_at);
CREATE INDEX IF NOT EXISTS idx_cs_haiphong_code ON public.coastal_station_haiphong (code);
CREATE INDEX IF NOT EXISTS idx_cs_haiphong_province_id ON public.coastal_station_haiphong (province_id);
CREATE INDEX IF NOT EXISTS idx_cs_haiphong_operating_org ON public.coastal_station_haiphong (operating_org_id);
CREATE INDEX IF NOT EXISTS idx_cs_haiphong_spatial_id ON public.coastal_station_haiphong (spatial_id);
CREATE INDEX IF NOT EXISTS idx_cs_haiphong_symbol ON public.coastal_station_haiphong (symbol_id);
