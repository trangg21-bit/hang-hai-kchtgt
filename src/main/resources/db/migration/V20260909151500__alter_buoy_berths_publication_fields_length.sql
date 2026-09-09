-- Migration: Tăng độ dài cột public_decision và mooring_water_area_scope lên 2000 ký tự (đồng bộ chuẩn TextArea 0/2000)
ALTER TABLE buoy_berths ALTER COLUMN public_decision TYPE VARCHAR(2000);
ALTER TABLE buoy_berths ALTER COLUMN mooring_water_area_scope TYPE VARCHAR(2000);

-- Đồng bộ cho các bảng vùng nước tương tự nếu có
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'public_decision') THEN
        ALTER TABLE anchorages ALTER COLUMN public_decision TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'public_decision') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN public_decision TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'public_decision') THEN
        ALTER TABLE transfer_areas ALTER COLUMN public_decision TYPE VARCHAR(2000);
    END IF;
END $$;
