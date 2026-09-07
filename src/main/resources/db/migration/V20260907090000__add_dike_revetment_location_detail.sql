-- =====================================================================
-- V20260907090000__add_dike_revetment_location_detail.sql
-- DikeRevetment (F-044): bổ sung cột lưu "Địa điểm chi tiết" (locationDetail).
--   Drawer FE đã gửi/nhận locationDetail nhưng bảng chưa có cột tương ứng
--   (dữ liệu cũ bị bỏ qua khi lưu). VARCHAR(500) theo quy ước detailed_location
--   của các module KCHT khác (beacon detailed_location = 500).
-- Additive only: cột nullable, dữ liệu cũ nhận NULL, không backfill cần thiết.
-- =====================================================================
ALTER TABLE public.dike_revetment
    ADD COLUMN IF NOT EXISTS location_detail VARCHAR(500);
