-- =====================================================================
-- V20260909100000__add_planning_category_pair_columns.sql
-- Bổ sung 3 cột "high" cho DoubleInput cặp KB thấp/KB cao
-- của "Danh mục quy hoạch chi tiết — Sau quy hoạch" (Excel rows 30, 31, 33).
--
-- Semantic mapping:
--   - Excel row 30 "Số cầu cảng KB thấp/cao"       → berth_count (low) + berth_count_high (high)
--   - Excel row 31 "Chiều dài (m) KB thấp/cao"     → length      (low) + length_high      (high)
--   - Excel row 33 "Dự kiến công suất KB thấp/cao" → capacity    (low) + capacity_high    (high)
--
-- Đối với phase = 'HIEN_TRANG' (rows 27-29): berth_count / length dùng như giá trị
-- đơn, *_high để NULL. Đối với phase = 'SAU_QUY_HOACH' (rows 30-35): cột hiện có
-- lưu low, cột *_high lưu high — backward compat cho record đang có.
--
-- House style: guarded ALTER, IF NOT EXISTS, không DROP.
-- =====================================================================

ALTER TABLE public.planning_categories
    ADD COLUMN IF NOT EXISTS berth_count_high INT,
    ADD COLUMN IF NOT EXISTS length_high      NUMERIC(15, 2),
    ADD COLUMN IF NOT EXISTS capacity_high    NUMERIC(15, 2);

COMMENT ON COLUMN public.planning_categories.berth_count_high
    IS 'Số lượng cầu cảng — KB cao (Excel row 30 Sau quy hoạch). Cặp low-high với berth_count. NULL cho phase HIEN_TRANG.';
COMMENT ON COLUMN public.planning_categories.length_high
    IS 'Chiều dài (m) — KB cao (Excel row 31 Sau quy hoạch). Cặp low-high với length. NULL cho phase HIEN_TRANG.';
COMMENT ON COLUMN public.planning_categories.capacity_high
    IS 'Dự kiến công suất (Triệu tấn) — KB cao (Excel row 33 Sau quy hoạch). Cặp low-high với capacity. NULL cho phase HIEN_TRANG.';
