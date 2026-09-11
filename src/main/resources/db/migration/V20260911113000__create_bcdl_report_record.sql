-- V20260911113000: Tạo bảng bcdl_report_record lưu trữ snapshot báo cáo cho nhóm BCDL (F-163 đến F-169).
CREATE TABLE IF NOT EXISTS public.bcdl_report_record (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                 UUID,
    updated_by                 UUID,
    deleted_at                 TIMESTAMP,
    deleted_by                 UUID,

    org_unit_id                UUID NOT NULL,
    report_code                VARCHAR(50) NOT NULL,
    report_period              VARCHAR(50) NOT NULL,
    report_year                INTEGER NOT NULL,
    status                     VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    report_data                TEXT,
    version                    BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bcdl_report_record_unit_code_period
    ON public.bcdl_report_record (org_unit_id, report_code, report_period)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bcdl_report_record_org_unit
    ON public.bcdl_report_record (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_bcdl_report_record_report_code
    ON public.bcdl_report_record (report_code);
CREATE INDEX IF NOT EXISTS idx_bcdl_report_record_period
    ON public.bcdl_report_record (report_period);
CREATE INDEX IF NOT EXISTS idx_bcdl_report_record_deleted_at
    ON public.bcdl_report_record (deleted_at) WHERE deleted_at IS NULL;
