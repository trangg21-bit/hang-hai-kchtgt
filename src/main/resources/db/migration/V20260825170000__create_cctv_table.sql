-- =========================================================
-- Migration: Create CCTV table (QL Hệ thống CCTV)
-- Module: M-NEW (CCTV Management)
-- Date: 2026-08-24
-- =========================================================

CREATE TABLE public.cctv (
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
    province_id uuid NULL,
    unit_of_measure int4 NULL,
    quantity int4 NOT NULL,
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

    -- Approval & audit
    approval_status smallint NOT NULL DEFAULT 0,

    -- Identity fields
    device_code varchar(200) NOT NULL,
    device_name varchar(255) NOT NULL,
    detailed_location varchar(500) NULL,
    model varchar(255) NULL,
    manufacturer varchar(50) NULL,

    -- Constraints
    CONSTRAINT cctv_primary_key PRIMARY KEY (id),
    CONSTRAINT cctv_device_code_unique UNIQUE (device_code),
    CONSTRAINT check_cctv_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_cctv_security_level_range CHECK (security_level >= 0 AND security_level <= 2),
    CONSTRAINT check_cctv_approval_status_range CHECK (approval_status >= 0 AND approval_status <= 7)
);

-- =========================================================
-- Indexes for search/filter performance
-- =========================================================

-- Search by device code (trigram)
CREATE INDEX index_cctv_active_device_code_unaccent_trigram
    ON public.cctv USING gin (immutable_unaccent(lower(device_code::text)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- Search by device name (trigram)
CREATE INDEX index_cctv_active_device_name_unaccent_trigram
    ON public.cctv USING gin (immutable_unaccent(lower(device_name::text)) gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- Filter by org unit + approval status
CREATE INDEX index_cctv_active_organization_unit_approval_status
    ON public.cctv USING btree (org_unit_id, approval_status)
    WHERE deleted_at IS NULL;

-- Filter by attached infrastructure
CREATE INDEX index_cctv_active_attached_infrastructure
    ON public.cctv USING btree (attached_infrastructure_type, attached_infrastructure_id)
    WHERE deleted_at IS NULL;

-- Filter by operational status
CREATE INDEX index_cctv_active_operational_status
    ON public.cctv USING btree (operational_status)
    WHERE deleted_at IS NULL;

-- Filter by year of use
CREATE INDEX index_cctv_active_year_of_use
    ON public.cctv USING btree (year_of_use)
    WHERE deleted_at IS NULL;

-- Filter by updated_at range
CREATE INDEX index_cctv_active_updated_at
    ON public.cctv USING btree (updated_at)
    WHERE deleted_at IS NULL;

-- Filter by province
CREATE INDEX index_cctv_active_province
    ON public.cctv USING btree (province_id)
    WHERE deleted_at IS NULL;

-- Filter by org unit + security level
CREATE INDEX index_cctv_active_organization_unit_security_level
    ON public.cctv USING btree (org_unit_id, security_level)
    WHERE deleted_at IS NULL;

-- =========================================================
-- Approval and Change Log tables
-- =========================================================

-- Approval log table
CREATE TABLE public.cctv_approval_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    entity_id varchar(255) NOT NULL,
    entity_type varchar(50) NOT NULL,
    approved_by varchar(255) NOT NULL,
    approved_at timestamp(6) NULL,
    approved boolean NOT NULL,
    reason varchar(500) NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cctv_approval_log_primary_key PRIMARY KEY (id)
);

-- Change log table
CREATE TABLE public.cctv_change_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    entity_id varchar(255) NOT NULL,
    entity_type varchar(50) NOT NULL,
    field_name varchar(100) NULL,
    old_value varchar(2000) NULL,
    new_value varchar(2000) NULL,
    changed_by varchar(100) NULL,
    changed_at timestamp(6) NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cctv_change_log_primary_key PRIMARY KEY (id)
);

-- Indexes for approval and change logs
CREATE INDEX index_cctv_approval_log_entity ON public.cctv_approval_log(entity_type, entity_id);
CREATE INDEX index_cctv_change_log_entity ON public.cctv_change_log(entity_type, entity_id);
