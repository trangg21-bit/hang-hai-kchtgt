-- ==============================================================================
-- Flyway Migration: V20260903164500__drop_tai_inmarsat_and_unused_inmarsat_columns.sql
-- Mục đích:
-- 1. Xóa bảng thừa tai_inmarsat (bảng tàn dư prototype 0 bản ghi, không dùng).
-- 2. Xóa 6 cột thừa khỏi bảng coastal_station_inmarsat:
--    - contact_person (Người liên hệ)
--    - contact_phone (Số điện thoại)
--    - modem_type (Loại modem)
--    - sar_code (Mã SAR)
--    - satellite_system (Hệ thống vệ tinh)
--    - status (Trạng thái trạm kiểu legacy StationStatus)
-- ==============================================================================

-- 1. Xóa bảng thừa tai_inmarsat
DROP TABLE IF EXISTS tai_inmarsat;

-- 2. Xóa 6 cột thừa khỏi coastal_station_inmarsat
ALTER TABLE coastal_station_inmarsat DROP COLUMN IF EXISTS contact_person;
ALTER TABLE coastal_station_inmarsat DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE coastal_station_inmarsat DROP COLUMN IF EXISTS modem_type;
ALTER TABLE coastal_station_inmarsat DROP COLUMN IF EXISTS sar_code;
ALTER TABLE coastal_station_inmarsat DROP COLUMN IF EXISTS satellite_system;
ALTER TABLE coastal_station_inmarsat DROP COLUMN IF EXISTS status;

