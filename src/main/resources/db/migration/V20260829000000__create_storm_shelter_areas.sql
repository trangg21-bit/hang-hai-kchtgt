-- V: Create storm_shelter_areas table for Khu tránh, trú bão (parity với transfer_areas)
CREATE TABLE IF NOT EXISTS storm_shelter_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    security_level SMALLINT NOT NULL DEFAULT 0,
    storm_shelter_code VARCHAR(50) NOT NULL UNIQUE,
    storm_shelter_name VARCHAR(255) NOT NULL,
    port_id UUID NOT NULL,
    org_unit_id UUID,
    navigation_channel_id UUID,
    buoy_station_id UUID,
    classification VARCHAR(100),
    province_id INTEGER,
    detailed_location VARCHAR(500),
    operational_status SMALLINT,
    approval_status SMALLINT NOT NULL DEFAULT 0,
    shape_description TEXT,
    area NUMERIC(15,2),
    design_water_depth NUMERIC(10,2),
    current_water_depth NUMERIC(10,2),
    bottom_elevation_design NUMERIC(10,2),
    max_vessel_dwt NUMERIC(15,2),
    active_storm_shelter_count INTEGER,
    published_storm_shelter_count INTEGER,
    under_investment_storm_shelter_count INTEGER,
    remarks TEXT,
    opening_announcement_date TIMESTAMP,
    public_decision VARCHAR(500),
    investment_agreement TEXT,
    submitted_for_approval_at TIMESTAMP,
    submitted_for_approval_by VARCHAR(100),
    port_authority_approved_at TIMESTAMP,
    port_authority_approved_by VARCHAR(100),
    port_authority_approval_content VARCHAR(1000),
    department_approved_at TIMESTAMP,
    department_approved_by VARCHAR(100),
    department_approval_content VARCHAR(1000),
    rejection_reason VARCHAR(500)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_storm_shelter_areas_code ON storm_shelter_areas(storm_shelter_code);
CREATE INDEX IF NOT EXISTS idx_storm_shelter_areas_port_id ON storm_shelter_areas(port_id);
CREATE INDEX IF NOT EXISTS idx_storm_shelter_areas_org_unit ON storm_shelter_areas(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_storm_shelter_areas_approval_status ON storm_shelter_areas(approval_status);
CREATE INDEX IF NOT EXISTS idx_storm_shelter_areas_operational_status ON storm_shelter_areas(operational_status);
CREATE INDEX IF NOT EXISTS idx_storm_shelter_areas_nav_channel ON storm_shelter_areas(navigation_channel_id);
CREATE INDEX IF NOT EXISTS idx_storm_shelter_areas_buoy_station ON storm_shelter_areas(buoy_station_id);
CREATE INDEX IF NOT EXISTS idx_storm_shelter_areas_deleted_at ON storm_shelter_areas(deleted_at) WHERE deleted_at IS NULL;
