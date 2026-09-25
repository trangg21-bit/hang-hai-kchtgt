-- =====================================================================
-- Chuẩn hóa tình trạng hoạt động Phao, tiêu (buoy.condition)
-- Khắc phục tình trạng xuất hiện các giá trị lạ từ dữ liệu cũ (Trên luồng, Trên bãi, Đang hoạt động, Gắn đèn)
-- Đưa về 3 tình trạng chuẩn nghiệp vụ:
-- 1. Đang khai thác/vận hành
-- 2. Chưa khai thác/vận hành
-- 3. Dừng khai thác/vận hành
-- =====================================================================

-- 1. Chuẩn hóa phao luân chuyển (trên bãi) về 'Chưa khai thác/vận hành'
UPDATE public.buoy
SET condition = 'Chưa khai thác/vận hành'
WHERE condition ILIKE '%bãi%'
   OR condition ILIKE '%bai%'
   OR name ILIKE '%Lu%n chuy%n%';

-- 2. Chuẩn hóa phao trên luồng / đang hoạt động / gắn đèn / null về 'Đang khai thác/vận hành'
UPDATE public.buoy
SET condition = 'Đang khai thác/vận hành'
WHERE condition ILIKE '%luồng%'
   OR condition ILIKE '%luong%'
   OR condition ILIKE '%hoạt động%'
   OR condition ILIKE '%hoat dong%'
   OR condition ILIKE '%gắn đèn%'
   OR condition ILIKE '%gan den%'
   OR condition IS NULL
   OR TRIM(condition) = ''
   OR (condition NOT IN ('Đang khai thác/vận hành', 'Chưa khai thác/vận hành', 'Dừng khai thác/vận hành'));
