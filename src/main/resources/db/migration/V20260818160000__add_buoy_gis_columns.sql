-- V20260818160000: Thêm cột GIS cho bảng buoy (đồng bộ tab Thông tin vị trí theo Bến cảng)
-- geometry_type: POINT / LINE / POLYGON; map_symbol_id: biểu tượng bản đồ; coordinate_system: 1=WGS-84, 2=VN-2000; display_rule: quy tắc hiển thị
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(20);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS map_symbol_id UUID;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS coordinate_system INTEGER;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS display_rule VARCHAR(255);
