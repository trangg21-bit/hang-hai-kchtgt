-- V20260911140000: Bổ sung bảng port_wharf_areas (Khu bến thuộc Cảng biển)
CREATE TABLE IF NOT EXISTS port_wharf_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    wharf_code VARCHAR(50) NOT NULL,
    wharf_name VARCHAR(255) NOT NULL,
    main_planning_function VARCHAR(500),
    planning_scope VARCHAR(2000),
    regulatory_document VARCHAR(2000),
    notes VARCHAR(2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_port_wharf_areas_port_id ON port_wharf_areas(port_id);
CREATE INDEX IF NOT EXISTS idx_port_wharf_areas_wharf_code ON port_wharf_areas(wharf_code);
