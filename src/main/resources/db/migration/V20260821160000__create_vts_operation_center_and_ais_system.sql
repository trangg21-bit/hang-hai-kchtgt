-- V20260821160000: Create vts_operation_center and ais_system tables
-- Uses shared infrastructure_attachments and approval_history

CREATE TABLE IF NOT EXISTS public.vts_operation_center (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    vts_system_id UUID NOT NULL,
    detailed_location VARCHAR(500) NOT NULL,
    coverage VARCHAR(255) NOT NULL,
    condition_status SMALLINT NOT NULL DEFAULT 0,
    note VARCHAR(2000),
    org_unit_id UUID,
    province_id INTEGER,
    spatial_id UUID,
    approval_status SMALLINT NOT NULL DEFAULT 1,
    approver_level1 UUID,
    approved_date_level1 TIMESTAMP,
    approver_level2 UUID,
    approved_date_level2 TIMESTAMP,
    rejection_reason VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT fk_vts_op_center_vts_system FOREIGN KEY (vts_system_id) REFERENCES public.vts_system(id) ON DELETE RESTRICT,
    CONSTRAINT fk_vts_op_center_org_unit FOREIGN KEY (org_unit_id) REFERENCES public.org_units(id) ON DELETE SET NULL,
    CONSTRAINT fk_vts_op_center_province FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vts_op_center_code ON public.vts_operation_center (code);
CREATE INDEX IF NOT EXISTS idx_vts_op_center_vts_system ON public.vts_operation_center (vts_system_id);
CREATE INDEX IF NOT EXISTS idx_vts_op_center_org_unit ON public.vts_operation_center (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_vts_op_center_province ON public.vts_operation_center (province_id);
CREATE INDEX IF NOT EXISTS idx_vts_op_center_approval_status ON public.vts_operation_center (approval_status);
CREATE INDEX IF NOT EXISTS idx_vts_op_center_deleted ON public.vts_operation_center (deleted_at);

CREATE TABLE IF NOT EXISTS public.ais_system (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    vts_operation_center_id UUID NOT NULL,
    operating_org_id UUID NOT NULL,
    detailed_location VARCHAR(500),
    unit_of_measure SMALLINT NOT NULL DEFAULT 1,
    quantity INTEGER NOT NULL DEFAULT 1,
    model VARCHAR(100),
    specifications VARCHAR(1000),
    manufacturer VARCHAR(255),
    commissioning_year INTEGER,
    condition_status SMALLINT NOT NULL DEFAULT 0,
    maintenance_info VARCHAR(2000),
    note VARCHAR(2000),
    org_unit_id UUID,
    province_id INTEGER,
    spatial_id UUID,
    approval_status SMALLINT NOT NULL DEFAULT 1,
    approver_level1 UUID,
    approved_date_level1 TIMESTAMP,
    approver_level2 UUID,
    approved_date_level2 TIMESTAMP,
    rejection_reason VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT fk_ais_system_vts_op_center FOREIGN KEY (vts_operation_center_id) REFERENCES public.vts_operation_center(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ais_system_operating_org FOREIGN KEY (operating_org_id) REFERENCES public.org_units(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ais_system_org_unit FOREIGN KEY (org_unit_id) REFERENCES public.org_units(id) ON DELETE SET NULL,
    CONSTRAINT fk_ais_system_province FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ais_system_code ON public.ais_system (code);
CREATE INDEX IF NOT EXISTS idx_ais_system_vts_op_center ON public.ais_system (vts_operation_center_id);
CREATE INDEX IF NOT EXISTS idx_ais_system_operating_org ON public.ais_system (operating_org_id);
CREATE INDEX IF NOT EXISTS idx_ais_system_org_unit ON public.ais_system (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_ais_system_province ON public.ais_system (province_id);
CREATE INDEX IF NOT EXISTS idx_ais_system_approval_status ON public.ais_system (approval_status);
CREATE INDEX IF NOT EXISTS idx_ais_system_deleted ON public.ais_system (deleted_at);
