-- Chuẩn hoá cột beacon_light.light_range về NUMERIC(24,4) — đồng nhất với
-- tower_height / light_height / area / station_area (V2026[REDACTED_PHONE]).
--
-- LƯU Ý phạm vi: theo yêu cầu, CHỈ cột CSDL được chuẩn hoá ở đây; phần code Java
-- (entity/DTO) vẫn giữ kiểu Double như trước — Hibernate/JDBC đọc-ghi cột numeric
-- qua Double bình thường, chưa cần đổi DTO.
--
-- An toàn dữ liệu:
--   * Idempotent thực sự: không làm gì nếu cột đã đúng numeric(24,4).
--   * Chỉ chạy khi cột tồn tại (một số môi trường cũ còn tên tam_hieu_luc_anh_sang —
--     V77 mới đổi tên về light_range).
--   * Nhận cả dạng số mũ mà cột float8 sinh ra (vd '5e-05') — nếu chỉ khớp '^[0-9.]+$'
--     thì số hợp lệ đó bị biến thành NULL.
--   * Chặn trước ngưỡng tràn: giá trị >= 10^20 (quá 20 chữ số phần nguyên) hoặc chuỗi
--     không phải số đều thành NULL, KHÔNG để ::NUMERIC(24,4) ném numeric field overflow
--     làm hỏng cả migration.
--   * KHÔNG đặt NOT NULL: bản ghi cũ có thể đang NULL; ràng buộc bắt buộc đã được ép ở
--     tầng API.
-- Lưu ý: giá trị nhỏ hơn 0.00005 sẽ làm tròn về 0 ở scale 4 (không có ý nghĩa với hải lý).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'beacon_light'
          AND column_name = 'light_range'
          AND NOT (data_type = 'numeric' AND numeric_precision = 24 AND numeric_scale = 4)
    ) THEN
        ALTER TABLE public.beacon_light
            ALTER COLUMN light_range TYPE NUMERIC(24, 4)
            USING (
                CASE
                    -- Chỉ xét chuỗi đúng dạng số: ≤20 chữ số phần nguyên, phần thập phân tùy ý,
                    -- số mũ tùy chọn tối đa 3 chữ số (float8 xuất '5e-05', '1.5e+19'; chặn 3
                    -- chữ số để phép ép numeric bên dưới không bao giờ vượt giới hạn ~131072
                    -- chữ số của kiểu numeric).
                    WHEN BTRIM(light_range::text) ~ '^-?[0-9]{1,20}(\.[0-9]+)?([eE][-+]?[0-9]{1,3})?$' THEN
                        -- Chỉ nhận giá trị < 10^20 (đúng 20 chữ số phần nguyên của NUMERIC(24,4));
                        -- lớn hơn hoặc chuỗi rác → NULL thay vì ném numeric field overflow.
                        -- CASE lồng trong nhánh regex: phép ép numeric chỉ chạy khi chuỗi đã đúng dạng số.
                        CASE
                            WHEN ABS(BTRIM(light_range::text)::NUMERIC) < NUMERIC '1e20'
                                THEN BTRIM(light_range::text)::NUMERIC(24, 4)
                            ELSE NULL
                        END
                    ELSE NULL
                END
            );
    END IF;
END $$;
