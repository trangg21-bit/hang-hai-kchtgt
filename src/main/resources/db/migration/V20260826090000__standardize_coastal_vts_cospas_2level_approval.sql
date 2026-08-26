-- ============================================================
-- Migration: Chuẩn hóa quy trình phê duyệt 2 cấp cho
--   - coastal_station_vts          (Đài duyên hải / VTS)
--   - coastal_station_cospas_sarsat (Đài Cospas-Sarsat)
-- theo docs/conventions/approval-2-level-spec.md (mục 3) — giống
-- coastal_station_inmarsat (V20260825093000).
-- Format: VYYYYMMDDHHmmss__description.sql
--
-- CHỈ CHẠY TRÊN POSTGRESQL. Phần backfill ở mục 3 dùng toán tử regex `~*`
-- và ép kiểu `::uuid` của PostgreSQL. Điều này an toàn vì Flyway chỉ bật ở
-- profile `local` và `prod` (đều PostgreSQL) — các profile H2 (`dev`,
-- `local-h2`) và test đều đặt `spring.flyway.enabled=false` và dựng schema
-- bằng Hibernate ddl-auto.
--
-- Các cột/kiểu ở đây cũng được InfrastructureSchemaMigrator vá lại lúc khởi
-- động (idempotent) để môi trường nào lỡ bỏ qua migration vẫn chạy đúng.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Các cột phê duyệt nền — trước đây chỉ tồn tại nhờ Hibernate ddl-auto,
--    chưa migration nào tạo. Khai báo ở đây để migration tự đứng được trên
--    một CSDL sạch (không phụ thuộc ddl-auto).
-- ------------------------------------------------------------
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS approval_status SMALLINT DEFAULT 0;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS status SMALLINT DEFAULT 0;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS approval_level SMALLINT;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS approval_status SMALLINT DEFAULT 0;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS status SMALLINT DEFAULT 0;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS approval_level SMALLINT;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ------------------------------------------------------------
-- 1. Bổ sung cột phục vụ 2 vòng duyệt (M-1006 Standard)
-- ------------------------------------------------------------
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE coastal_station_vts ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;

ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;

-- ------------------------------------------------------------
-- 2. Chuyển dữ liệu cũ sang tập 7 trạng thái chuẩn
--    Ordinal ApprovalStatus: DRAFT=0, PROPOSED=1, PENDING_APPROVAL=2,
--      APPROVED_LEVEL1=3, APPROVED_LEVEL2=4, APPROVED=5, REJECTED=6,
--      ARCHIVED=7, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9
--    Ordinal StationStatus:  DRAFT=0, PENDING_APPROVAL=1, APPROVED_L1=2,
--      APPROVED_L2=3, PUBLISHED=4, DELETED=5, REJECTED=6
--
--    Luồng cũ: tạo mới -> PROPOSED(1); từ chối cũng ghi PROPOSED(1)
--    kèm rejection_reason; duyệt vòng 2 -> APPROVED_LEVEL2(4).
-- ------------------------------------------------------------

-- 2.1. Bản ghi bị từ chối (legacy REJECTED=6, hoặc PROPOSED có lý do từ chối)
UPDATE coastal_station_vts
   SET approval_status = 8, status = 6
 WHERE approval_status = 6
    OR (approval_status = 1 AND rejection_reason IS NOT NULL AND rejection_reason <> '');

UPDATE coastal_station_cospas_sarsat
   SET approval_status = 8, status = 6
 WHERE approval_status = 6
    OR (approval_status = 1 AND rejection_reason IS NOT NULL AND rejection_reason <> '');

-- 2.2. PROPOSED (đã gửi, chờ vòng 1) -> PENDING_APPROVAL
UPDATE coastal_station_vts
   SET approval_status = 2, status = 1
 WHERE approval_status = 1;

UPDATE coastal_station_cospas_sarsat
   SET approval_status = 2, status = 1
 WHERE approval_status = 1;

-- 2.3. APPROVED_LEVEL2 (legacy) -> APPROVED
UPDATE coastal_station_vts
   SET approval_status = 5, status = 3
 WHERE approval_status = 4;

UPDATE coastal_station_cospas_sarsat
   SET approval_status = 5, status = 3
 WHERE approval_status = 4;

-- 2.4. Đồng bộ status cho bản ghi chờ Cục duyệt
UPDATE coastal_station_vts            SET status = 2 WHERE approval_status = 3;
UPDATE coastal_station_cospas_sarsat  SET status = 2 WHERE approval_status = 3;

-- 2.5. Bản ghi chưa có trạng thái -> Lưu tạm
UPDATE coastal_station_vts            SET approval_status = 0 WHERE approval_status IS NULL;
UPDATE coastal_station_cospas_sarsat  SET approval_status = 0 WHERE approval_status IS NULL;
UPDATE coastal_station_vts            SET status = 0 WHERE status IS NULL;
UPDATE coastal_station_cospas_sarsat  SET status = 0 WHERE status IS NULL;

-- ------------------------------------------------------------
-- 3. Backfill người duyệt / thời điểm duyệt theo từng vòng
-- ------------------------------------------------------------
UPDATE coastal_station_vts
   SET approver_level1 = (CASE WHEN CAST(approved_by AS VARCHAR) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN CAST(CAST(approved_by AS VARCHAR) AS UUID) ELSE NULL END),
       approved_date_level1 = approved_date
 WHERE approval_status IN (3, 5) AND approver_level1 IS NULL AND approved_by IS NOT NULL;

UPDATE coastal_station_vts
   SET approver_level2 = (CASE WHEN CAST(approved_by AS VARCHAR) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN CAST(CAST(approved_by AS VARCHAR) AS UUID) ELSE NULL END),
       approved_date_level2 = approved_date
 WHERE approval_status = 5 AND approver_level2 IS NULL AND approved_by IS NOT NULL;

UPDATE coastal_station_cospas_sarsat
   SET approver_level1 = (CASE WHEN CAST(approved_by AS VARCHAR) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN CAST(CAST(approved_by AS VARCHAR) AS UUID) ELSE NULL END),
       approved_date_level1 = approved_date
 WHERE approval_status IN (3, 5) AND approver_level1 IS NULL AND approved_by IS NOT NULL;

UPDATE coastal_station_cospas_sarsat
   SET approver_level2 = (CASE WHEN CAST(approved_by AS VARCHAR) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN CAST(CAST(approved_by AS VARCHAR) AS UUID) ELSE NULL END),
       approved_date_level2 = approved_date
 WHERE approval_status = 5 AND approver_level2 IS NULL AND approved_by IS NOT NULL;

-- 3.1. approval_level đồng bộ với trạng thái (LEVEL_0=0, LEVEL_1=1, LEVEL_2=2)
UPDATE coastal_station_vts            SET approval_level = 1 WHERE approval_status = 3;
UPDATE coastal_station_cospas_sarsat  SET approval_level = 1 WHERE approval_status = 3;
UPDATE coastal_station_vts            SET approval_level = 2 WHERE approval_status = 5;
UPDATE coastal_station_cospas_sarsat  SET approval_level = 2 WHERE approval_status = 5;
