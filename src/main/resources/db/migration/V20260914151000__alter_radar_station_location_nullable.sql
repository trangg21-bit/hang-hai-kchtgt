-- Cho phép trường location (địa điểm chi tiết) của trạm radar nhận giá trị NULL (optional)
ALTER TABLE radar_station ALTER COLUMN location DROP NOT NULL;
