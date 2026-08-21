-- V20260821130000: Re-ensure map_symbols.code exists (idempotent).
--
-- Lý do: V20260821120000 đã thêm cột `code`, nhưng ở một lần khởi động trước,
-- MapSymbolSchemaMigrator (CommandLineRunner chạy SAU Flyway) còn block cũ
-- DROP COLUMN code nên đã xóa cột ngay sau khi Flyway thêm. Kết quả: Flyway
-- vẫn ghi V20260821120000 là đã áp dụng (SUCCESS) trong khi cột đã mất.
-- Migration này phòng thủ: tạo lại cột (nếu thiếu), backfill mã còn trống,
-- rồi khôi phục NOT NULL + unique index. Toàn bộ bước đều idempotent.

ALTER TABLE map_symbols ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- Backfill các dòng code NULL / rỗng / không khớp 'BT-XXXX' tuần tự.
WITH numbered AS (
    SELECT id, 'BT-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id::text))::text, 4, '0') AS new_code
    FROM map_symbols
    WHERE code IS NULL OR code = '' OR code !~ '^BT-[0-9]{4}$'
)
UPDATE map_symbols s SET code = n.new_code FROM numbered n WHERE s.id = n.id;

ALTER TABLE map_symbols ALTER COLUMN code TYPE VARCHAR(10);
ALTER TABLE map_symbols ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_map_symbols_code ON map_symbols(code);
