-- V20260819000000: Bổ sung 11 trường mở rộng cho bảng beacon_light (đồng bộ frontend types/beacon.ts).
-- seaport_id: FK cảng biển; operator: đơn vị vận hành; detailed_location: địa điểm chi tiết;
-- operational_status: trạng thái hoạt động (enum ordinal); region: khu vực;
-- identifying_feature: đặc điểm nhận dạng; note: ghi chú;
-- geometry_type: POINT/LINE/POLYGON; map_symbol_id: biểu tượng bản đồ;
-- coordinate_system: 1=WGS-84, 2=VN-2000; display_rule: quy tắc hiển thị.
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS seaport_id UUID;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS operator VARCHAR(200);
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS detailed_location VARCHAR(500);
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS operational_status INTEGER;
-- Legacy DB có thể đã có operational_status dạng varchar(30) (di sản lighthouse_station) —
-- khi đó ADD COLUMN IF NOT EXISTS bị skip và cột vẫn varchar, gây lỗi "character varying = integer".
-- Chủ động chuyển sang INTEGER nếu còn varchar.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='beacon_light' AND column_name='operational_status'
               AND data_type='character varying') THEN
    ALTER TABLE public.beacon_light ALTER COLUMN operational_status DROP DEFAULT;
    ALTER TABLE public.beacon_light
      ALTER COLUMN operational_status TYPE INTEGER
      USING (CASE operational_status
        WHEN 'OPERATIONAL' THEN 1
        WHEN 'SUSPENDED' THEN 2
        ELSE 0 END);
    ALTER TABLE public.beacon_light ALTER COLUMN operational_status SET DEFAULT 0;
  END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS region VARCHAR(255);
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS identifying_feature VARCHAR(500);
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS note VARCHAR(1000);
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(20);
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS map_symbol_id UUID;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS coordinate_system INTEGER;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS display_rule VARCHAR(255);
