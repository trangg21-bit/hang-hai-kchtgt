-- V20260821120000: Thêm trường code (Mã biểu tượng, định dạng BT-0001) cho bảng map_symbols
--
-- Lịch sử cột code:
--   - V36 tạo cột code VARCHAR(50) NOT NULL UNIQUE chứa dữ liệu cũ dạng 'SYM-HD'...
--   - V54.2 xóa toàn bộ dữ liệu và re-seed với code dạng 'SEAPORT', 'TERMINAL'...
--   - Entity MapSymbol hiện tại không map cột này nên cột có thể còn tồn tại (leftover)
--     hoặc đã bị xóa (ddl-auto). Migration này PHÒNG THỦ + idempotent.

-- 1. Xóa unique constraint cũ do V36 tạo (tên mặc định map_symbols_code_key)
--    TRƯỚC khi backfill để tránh xung đột giữa mã vừa sinh và constraint cũ.
ALTER TABLE map_symbols DROP CONSTRAINT IF EXISTS map_symbols_code_key;

-- 2. Đảm bảo cột tồn tại (no-op nếu còn leftover từ V36/V54.2)
ALTER TABLE map_symbols ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- 3. Backfill các dòng code NULL / rỗng / không khớp '^BT-[0-9]{4}$'
--    thành BT-0001.. tuần tự (thứ tự theo created_at, ổn định theo id khi trùng thời gian).
--    Làm TRƯỚC khi thu hẹp độ rộng cột để mọi giá trị còn lại đều là BT-XXXX (7 ký tự),
--    nên bước ALTER TYPE không bao giờ thất bại vì giá trị dài hơn 10 ký tự.
WITH numbered AS (
    SELECT id, 'BT-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id::text))::text, 4, '0') AS new_code
    FROM map_symbols
    WHERE code IS NULL OR code = '' OR code !~ '^BT-[0-9]{4}$'
)
UPDATE map_symbols s SET code = n.new_code FROM numbered n WHERE s.id = n.id;

-- 4. Chuẩn hóa độ rộng cột (xử lý nếu cột cũ là VARCHAR(50))
ALTER TABLE map_symbols ALTER COLUMN code TYPE VARCHAR(10);

-- 5. Ép NOT NULL
ALTER TABLE map_symbols ALTER COLUMN code SET NOT NULL;

-- 6. Unique index (idempotent — không tạo lại nếu đã tồn tại)
CREATE UNIQUE INDEX IF NOT EXISTS uq_map_symbols_code ON map_symbols(code);
