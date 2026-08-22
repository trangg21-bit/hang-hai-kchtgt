-- V20260822090000: Ensure map_symbols.code exists (idempotent, fresh version).
--
-- Vì sao cần version mới:
--   - V20260821120000 + V20260821130000 đã bị Flyway đánh dấu SUCCESS trong
--     flyway_schema_history (từ lần khởi động có build cũ chứa
--     MapSymbolSchemaMigrator còn block DROP COLUMN code — nó xóa cột ngay sau
--     khi Flyway thêm, nên cột mất đi trong khi migration vẫn bị ghi là applied).
--   - Flyway KHÔNG BAO GIỜ chạy lại migration đã applied -> cột code vĩnh viễn
--     thiếu dù restart nhiều lần. Migration version mới (chưa từng nằm trong
--     lịch sử) là cách duy nhất để Flyway chạy lại thao tác thêm cột.
-- Toàn bộ bước idempotent: nếu cột đã tồn tại thì không làm gì (no-op).

ALTER TABLE map_symbols ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- Backfill các dòng code NULL / rỗng / không khớp 'BT-XXXX' tuần tự
-- (thứ tự theo id::text, ổn định; format khớp generateCode BT-%04d của service).
WITH numbered AS (
    SELECT id, 'BT-' || LPAD((ROW_NUMBER() OVER (ORDER BY id::text))::text, 4, '0') AS new_code
    FROM map_symbols
    WHERE code IS NULL OR code = '' OR code !~ '^BT-[0-9]{4}$'
)
UPDATE map_symbols s SET code = n.new_code FROM numbered n WHERE s.id = n.id;

ALTER TABLE map_symbols ALTER COLUMN code TYPE VARCHAR(10);
ALTER TABLE map_symbols ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_map_symbols_code ON map_symbols(code);
