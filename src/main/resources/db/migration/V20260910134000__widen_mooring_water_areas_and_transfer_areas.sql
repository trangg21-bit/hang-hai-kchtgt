-- ============================================================================
-- Migration: V20260910134000__widen_mooring_water_areas_and_transfer_areas.sql
-- Mô tả: Mở rộng độ dài cột description trong các bảng khu nước neo buộc tàu
--        lên VARCHAR(2000) đồng bộ với giao diện (0/2000).
--        Đồng thời mở rộng area NUMERIC(28,4) và các trường thông số kỹ thuật,
--        quyết định công bố, nội dung phê duyệt lên VARCHAR(2000).
-- ============================================================================

DO $$
BEGIN
    -- 1. Mở rộng description trong transfer_area_mooring_water_areas
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'transfer_area_mooring_water_areas' AND column_name = 'description'
    ) THEN
        ALTER TABLE transfer_area_mooring_water_areas ALTER COLUMN description TYPE VARCHAR(2000);
    END IF;

    -- 2. Mở rộng description trong storm_shelter_mooring_water_areas
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'storm_shelter_mooring_water_areas' AND column_name = 'description'
    ) THEN
        ALTER TABLE storm_shelter_mooring_water_areas ALTER COLUMN description TYPE VARCHAR(2000);
    END IF;

    -- 3. Mở rộng description trong mooring_water_areas (Khu neo đậu)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'mooring_water_areas' AND column_name = 'description'
    ) THEN
        ALTER TABLE mooring_water_areas ALTER COLUMN description TYPE VARCHAR(2000);
    END IF;

    -- 4. transfer_areas: mở rộng area, các trường kỹ thuật và văn bản
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'area') THEN
        ALTER TABLE transfer_areas ALTER COLUMN area TYPE NUMERIC(28, 4);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'bottom_elevation_design') THEN
        ALTER TABLE transfer_areas ALTER COLUMN bottom_elevation_design TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'design_water_depth') THEN
        ALTER TABLE transfer_areas ALTER COLUMN design_water_depth TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'current_water_depth') THEN
        ALTER TABLE transfer_areas ALTER COLUMN current_water_depth TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'max_vessel_dwt') THEN
        ALTER TABLE transfer_areas ALTER COLUMN max_vessel_dwt TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'public_decision') THEN
        ALTER TABLE transfer_areas ALTER COLUMN public_decision TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'port_authority_approval_content') THEN
        ALTER TABLE transfer_areas ALTER COLUMN port_authority_approval_content TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'department_approval_content') THEN
        ALTER TABLE transfer_areas ALTER COLUMN department_approval_content TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transfer_areas' AND column_name = 'rejection_reason') THEN
        ALTER TABLE transfer_areas ALTER COLUMN rejection_reason TYPE VARCHAR(2000);
    END IF;

    -- 5. storm_shelter_areas: mở rộng area, các trường kỹ thuật và văn bản
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'area') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN area TYPE NUMERIC(28, 4);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'bottom_elevation_design') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN bottom_elevation_design TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'design_water_depth') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN design_water_depth TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'current_water_depth') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN current_water_depth TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'max_vessel_dwt') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN max_vessel_dwt TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'public_decision') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN public_decision TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'port_authority_approval_content') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN port_authority_approval_content TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'department_approval_content') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN department_approval_content TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storm_shelter_areas' AND column_name = 'rejection_reason') THEN
        ALTER TABLE storm_shelter_areas ALTER COLUMN rejection_reason TYPE VARCHAR(2000);
    END IF;

    -- 6. anchorages: mở rộng area, các trường kỹ thuật và văn bản
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'area') THEN
        ALTER TABLE anchorages ALTER COLUMN area TYPE NUMERIC(28, 4);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'bottom_elevation_design') THEN
        ALTER TABLE anchorages ALTER COLUMN bottom_elevation_design TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'design_water_depth') THEN
        ALTER TABLE anchorages ALTER COLUMN design_water_depth TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'current_water_depth') THEN
        ALTER TABLE anchorages ALTER COLUMN current_water_depth TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'bottom_elevation_survey') THEN
        ALTER TABLE anchorages ALTER COLUMN bottom_elevation_survey TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'design_ship_size') THEN
        ALTER TABLE anchorages ALTER COLUMN design_ship_size TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'receiving_ship_size') THEN
        ALTER TABLE anchorages ALTER COLUMN receiving_ship_size TYPE VARCHAR(20);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'public_decision') THEN
        ALTER TABLE anchorages ALTER COLUMN public_decision TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'port_authority_approval_content') THEN
        ALTER TABLE anchorages ALTER COLUMN port_authority_approval_content TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'department_approval_content') THEN
        ALTER TABLE anchorages ALTER COLUMN department_approval_content TYPE VARCHAR(2000);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anchorages' AND column_name = 'rejection_reason') THEN
        ALTER TABLE anchorages ALTER COLUMN rejection_reason TYPE VARCHAR(2000);
    END IF;
END $$;
