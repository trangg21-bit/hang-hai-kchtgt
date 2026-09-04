-- ==============================================================================
-- Migration: Drop latitude, longitude and flat GIS columns for coastal_station_lrit
-- Timestamp: 20260903163000
-- Chuẩn hóa kiến trúc GIS tập trung theo mẫu Trung tâm điều hành VTS và Đài Inmarsat:
-- 1. Backfill tọa độ vào gis_spatial_objects nếu có bản ghi chưa có spatial_id
-- 2. Bổ sung cột symbol_id UUID và index liên kết map_symbols
-- 3. DROP các cột latitude, longitude, coordinate_system, display_rule, geometry_type, symbol
-- ==============================================================================

-- 1. Đảm bảo bảng gis_spatial_objects có các cột audit
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. Backfill an toàn tọa độ vào gis_spatial_objects nếu các cột latitude/longitude còn tồn tại trong bảng
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'longitude'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'latitude'
    ) THEN
        EXECUTE '
            INSERT INTO public.gis_spatial_objects (
                id, name, code, geometry_type, object_type, coordinates, ref_id, ref_type, status, created_at, updated_at
            )
            SELECT 
                gen_random_uuid(),
                ''Đài LRIT '' || COALESCE(name, code, ''LRIT''),
                ''LRIT_'' || id::text,
                0, -- GisGeometryType.POINT (ordinal 0)
                5, -- GisSpatialObjectType.POINT_OTHER (ordinal 5)
                ''['' || longitude::text || '','' || latitude::text || '']'',
                id,
                22, -- InfrastructureType.LRIT_STATION (ordinal 22)
                1,  -- GisSpatialStatus.PUBLISHED (ordinal 1)
                NOW(),
                NOW()
            FROM public.coastal_station_lrit
            WHERE latitude IS NOT NULL 
              AND longitude IS NOT NULL 
              AND spatial_id IS NULL 
              AND deleted_at IS NULL
            ON CONFLICT DO NOTHING
        ';

        -- Gán lại spatial_id vừa tạo vào coastal_station_lrit
        UPDATE public.coastal_station_lrit c
        SET spatial_id = g.id
        FROM public.gis_spatial_objects g
        WHERE g.ref_id = c.id 
          AND g.ref_type = 22
          AND c.spatial_id IS NULL;
    END IF;
END $$;

-- 3. Bổ sung cột symbol_id UUID và index phục vụ MapSymbol
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS symbol_id UUID;
CREATE INDEX IF NOT EXISTS idx_cs_lrit_symbol_id ON public.coastal_station_lrit (symbol_id);

-- 4. Xóa bỏ hoàn toàn 2 cột lat long và các cột GIS phẳng khỏi bảng coastal_station_lrit
ALTER TABLE public.coastal_station_lrit 
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS longitude,
    DROP COLUMN IF EXISTS coordinate_system,
    DROP COLUMN IF EXISTS display_rule,
    DROP COLUMN IF EXISTS geometry_type,
    DROP COLUMN IF EXISTS symbol;

