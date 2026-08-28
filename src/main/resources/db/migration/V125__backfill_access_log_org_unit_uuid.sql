-- F-005: Chuẩn hóa access_logs.org_unit sang orgUnitId (UUID)
--
-- Trước đây AccessLogInterceptor ghi TÊN đơn vị (orgUnit.getName()) vào cột
-- org_unit, trong khi filter frontend gửi orgUnitId (UUID) → lọc không bao giờ
-- khớp → danh sách rỗng. Backfill: map tên → id qua bảng org_units; log không
-- tìm được tên tương ứng (đổi tên/đã xóa) thì để NULL (không thể khôi phục).

DO $$
BEGIN
  UPDATE access_logs a
  SET org_unit = m.id_text
  FROM (
    SELECT DISTINCT ON (lower(name)) id::text AS id_text, lower(name) AS name_lower
    FROM org_units
    WHERE name IS NOT NULL
  ) m
  WHERE a.org_unit IS NOT NULL
    AND a.org_unit !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND lower(a.org_unit) = m.name_lower;
END $$;
