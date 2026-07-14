-- V41: Convert he_thong_vts.tinh_trang to INTEGER and update VTS/Radar seed data status to APPROVED (3)

-- 1. Map existing string values to integers
UPDATE he_thong_vts SET tinh_trang = '1' WHERE tinh_trang = 'Tốt';
UPDATE he_thong_vts SET tinh_trang = '2' WHERE tinh_trang = 'Xuống cấp';
UPDATE he_thong_vts SET tinh_trang = '3' WHERE tinh_trang = 'Hư hỏng';
UPDATE he_thong_vts SET tinh_trang = NULL WHERE tinh_trang NOT IN ('1', '2', '3') AND tinh_trang IS NOT NULL;

-- 2. Alter column type to INTEGER
ALTER TABLE he_thong_vts ALTER COLUMN tinh_trang TYPE INTEGER USING tinh_trang::integer;

-- 3. Update seeded status from CREATED (1) to APPROVED (3)
UPDATE he_thong_vts SET trang_thai = 3 WHERE trang_thai = 1;
UPDATE tram_radar SET trang_thai = 3 WHERE trang_thai = 1;
