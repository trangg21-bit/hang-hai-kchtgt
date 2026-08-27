-- =========================================================
-- Migration: Create SCADA table (QL Hệ thống SCADA)
-- Module: M-NEW (SCADA Management) — theo Sheet "QL HT SCADA"
-- Date: 2026-08-26
-- Cấu trúc bảng mô phỏng bảng cctv (V20260825170000 + V124 +
-- V20260826120000 + V20260826150000), khác biệt duy nhất ở tầng
-- nghiệp vụ: mã thiết bị tự sinh prefix SCA-{seq}.
-- =========================================================

CREATE TABLE IF NOT EXISTS public.scada (
    -- Audit fields (from BaseEntity)
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp(6) NULL,
    updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by uuid NULL,
    deleted_by uuid NULL,
    updated_by uuid NULL,

    -- Security level
    security_level smallint NOT NULL DEFAULT 0,

    -- Basic information
    org_unit_id uuid NULL,
    attached_infrastructure_type int2 NULL,
    attached_infrastructure_id uuid NULL,
    operating_unit_id uuid NULL,
    province_name varchar(100) NULL,
    unit_of_measure int4 NULL,
    quantity int4 NOT NULL DEFAULT 1,
    year_of_use int2 NULL,
    operational_status int4 NOT NULL DEFAULT 0,

    -- Equipment information
    specifications varchar(2000) NULL,
    maintenance_information varchar(2000) NULL,
    note varchar(2000) NULL,

    -- GIS location
    object_type int2 NULL,
    map_symbol_id uuid NULL,
    coordinate_system int4 NULL,
    display_rule int4 NULL,
    spatial_id uuid NULL,

    -- Approval & audit (2 cấp — Cảng vụ/Chi cục → Cục)
    approval_status smallint NOT NULL DEFAULT 0,
    approver_level1 uuid NULL,
    approved_date_level1 timestamp NULL,
    approver_level2 uuid NULL,
    approved_date_level2 timestamp NULL,
    rejection_reason varchar(500) NULL,
    submitted_date timestamp NULL,
    submitted_by uuid NULL,
    approval_content_level1 varchar(500) NULL,
    approval_content_level2 varchar(500) NULL,

    -- Identity fields (mã thiết bị tự sinh SCA-{seq})
    device_code varchar(200) NOT NULL,
    device_name varchar(255) NOT NULL,
    detailed_location varchar(500) NULL,
    model varchar(255) NULL,
    manufacturer varchar(50) NULL,

    -- Constraints
    CONSTRAINT scada_primary_key PRIMARY KEY (id),
    CONSTRAINT scada_device_code_unique UNIQUE (device_code)
);

-- =========================================================
-- Column comments (tiếng Việt hiển thị)
-- =========================================================
COMMENT ON COLUMN public.scada.id IS 'Khóa chính';
COMMENT ON COLUMN public.scada.org_unit_id IS 'Đơn vị quản lý (bắt buộc khi tạo)';
COMMENT ON COLUMN public.scada.attached_infrastructure_type IS 'Loại hạ tầng trực thuộc (TTDH VTS / Trạm Radar)';
COMMENT ON COLUMN public.scada.attached_infrastructure_id IS 'ID hạ tầng trực thuộc (TTDH VTS / Trạm Radar)';
COMMENT ON COLUMN public.scada.operating_unit_id IS 'Đơn vị khai thác';
COMMENT ON COLUMN public.scada.province_name IS 'Địa điểm (Tỉnh/TP)';
COMMENT ON COLUMN public.scada.detailed_location IS 'Địa điểm chi tiết';
COMMENT ON COLUMN public.scada.unit_of_measure IS 'Đơn vị tính';
COMMENT ON COLUMN public.scada.quantity IS 'Số lượng (bắt buộc, > 0)';
COMMENT ON COLUMN public.scada.year_of_use IS 'Năm đưa vào sử dụng';
COMMENT ON COLUMN public.scada.operational_status IS 'Tình trạng (bắt buộc)';
COMMENT ON COLUMN public.scada.model IS 'Model';
COMMENT ON COLUMN public.scada.specifications IS 'Thông số kỹ thuật';
COMMENT ON COLUMN public.scada.manufacturer IS 'Hãng sản xuất';
COMMENT ON COLUMN public.scada.maintenance_information IS 'Thông tin bảo trì';
COMMENT ON COLUMN public.scada.note IS 'Ghi chú';
COMMENT ON COLUMN public.scada.object_type IS 'Loại đối tượng (GIS): Điểm/Đường/Vùng';
COMMENT ON COLUMN public.scada.map_symbol_id IS 'Biểu tượng (GIS)';
COMMENT ON COLUMN public.scada.coordinate_system IS 'Hệ quy chiếu (GIS)';
COMMENT ON COLUMN public.scada.display_rule IS 'Quy tắc hiển thị (GIS)';
COMMENT ON COLUMN public.scada.spatial_id IS 'Tọa độ (GIS) — tham chiếu bảng spatial';
COMMENT ON COLUMN public.scada.approval_status IS 'Trạng thái phê duyệt (0=Lưu tạm, 1=Chờ Cảng vụ duyệt, 2=Chờ Cục duyệt, 3=Đã duyệt, 4=Từ chối)';
COMMENT ON COLUMN public.scada.approver_level1 IS 'Người phê duyệt cấp 1 (Cảng vụ/Chi cục)';
COMMENT ON COLUMN public.scada.approved_date_level1 IS 'Thời gian phê duyệt cấp 1';
COMMENT ON COLUMN public.scada.approver_level2 IS 'Người phê duyệt cấp 2 (Cục)';
COMMENT ON COLUMN public.scada.approved_date_level2 IS 'Thời gian phê duyệt cấp 2';
COMMENT ON COLUMN public.scada.rejection_reason IS 'Lý do từ chối';
COMMENT ON COLUMN public.scada.submitted_date IS 'Ngày gửi phê duyệt (cập nhật mỗi lần gửi)';
COMMENT ON COLUMN public.scada.submitted_by IS 'Cán bộ gửi phê duyệt';
COMMENT ON COLUMN public.scada.approval_content_level1 IS 'Nội dung/ý kiến phê duyệt cấp 1 (Cảng vụ/Chi cục)';
COMMENT ON COLUMN public.scada.approval_content_level2 IS 'Nội dung/ý kiến phê duyệt cấp 2 (Cục)';
COMMENT ON COLUMN public.scada.device_code IS 'Mã thiết bị (tự sinh SCA-{seq}, không đổi sau tạo)';
COMMENT ON COLUMN public.scada.device_name IS 'Tên thiết bị (bắt buộc)';

-- =========================================================
-- Indexes for search/filter performance
-- =========================================================

-- Search by device code (trigram)
CREATE INDEX IF NOT EXISTS index_scada_active_device_code_unaccent_trigram
    ON public.scada USING gin (immutable_unaccent(lower(device_code::text)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- Search by device name (trigram)
CREATE INDEX IF NOT EXISTS index_scada_active_device_name_unaccent_trigram
    ON public.scada USING gin (immutable_unaccent(lower(device_name::text)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- Filter by org unit + approval status
CREATE INDEX IF NOT EXISTS index_scada_active_organization_unit_approval_status
    ON public.scada USING btree (org_unit_id, approval_status)
    WHERE deleted_at IS NULL;

-- Filter by attached infrastructure
CREATE INDEX IF NOT EXISTS index_scada_active_attached_infrastructure
    ON public.scada USING btree (attached_infrastructure_type, attached_infrastructure_id)
    WHERE deleted_at IS NULL;

-- Filter by operational status
CREATE INDEX IF NOT EXISTS index_scada_active_operational_status
    ON public.scada USING btree (operational_status)
    WHERE deleted_at IS NULL;

-- Filter by year of use
CREATE INDEX IF NOT EXISTS index_scada_active_year_of_use
    ON public.scada USING btree (year_of_use)
    WHERE deleted_at IS NULL;

-- Filter by updated_at range
CREATE INDEX IF NOT EXISTS index_scada_active_updated_at
    ON public.scada USING btree (updated_at)
    WHERE deleted_at IS NULL;

-- Filter by province
CREATE INDEX IF NOT EXISTS index_scada_active_province
    ON public.scada USING btree (province_name)
    WHERE deleted_at IS NULL;

-- Filter by org unit + security level
CREATE INDEX IF NOT EXISTS index_scada_active_organization_unit_security_level
    ON public.scada USING btree (org_unit_id, security_level)
    WHERE deleted_at IS NULL;

-- =========================================================
-- Ghi chú: KHÔNG tạo bảng scada_approval_log / scada_change_log
-- riêng — module dùng chung bảng change_logs, approval_logs
-- (keyed by entity_type) và infrastructure_history, giống hệt
-- quyết định của module CCTV (V20260825170100).
-- =========================================================
