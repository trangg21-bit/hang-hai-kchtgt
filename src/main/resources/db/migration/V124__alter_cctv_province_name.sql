-- M-NEW CCTV: Đổi province_id (UUID) → province_name (VARCHAR) để lưu tên tỉnh/thành phố
-- Migration V108 đã tạo bảng provinces với mã tỉnh (INT), đây là migrate riêng cho CCTV

DO $$
BEGIN
  -- Kiểm tra cột tồn tại và còn kiểu UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cctv'
      AND column_name = 'province_id'
      AND data_type = 'uuid'
  ) THEN
    -- Đổi tên cột province_id → province_name
    ALTER TABLE cctv RENAME COLUMN province_id TO province_name;
    -- Đổi kiểu dữ liệu từ UUID sang VARCHAR(100)
    ALTER TABLE cctv ALTER COLUMN province_name TYPE VARCHAR(100) USING province_name::VARCHAR(100);
  END IF;

  -- Nếu cột province_name chưa tồn tại và cột province_id tồn tại (trường hợp migration chạy lại)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cctv'
      AND column_name = 'province_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cctv'
      AND column_name = 'province_id'
      AND data_type = 'varchar'
  ) THEN
    -- Chỉ đổi tên
    ALTER TABLE cctv RENAME COLUMN province_id TO province_name;
  END IF;
END $$;
