-- ==============================================================================
-- Migration: V20260914105500__create_dai_ttdh_compatibility_view.sql
-- Mo ta: Tao compatibility view tuong thich hai chieu giua dai_ttdh va
--        coastal_radio_stations neu mot trong hai bang/view chua ton tai.
--        Su dung dynamic SQL de tranh loi relation does not exist o compile time.
-- ==============================================================================

DO $$
BEGIN
    -- Truong hop 1: coastal_radio_stations la base table, dai_ttdh chua phai base table -> tao view dai_ttdh
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = current_schema() AND table_name = 'coastal_radio_stations'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = current_schema() AND table_name = 'dai_ttdh' AND table_type = 'BASE TABLE'
    ) THEN
        EXECUTE 'CREATE OR REPLACE VIEW dai_ttdh AS
        SELECT
            id,
            station_code AS dai_ttdh_code,
            station_name AS dai_ttdh_name,
            org_unit_id,
            operating_unit_id,
            station_level,
            province_id,
            detailed_location,
            operational_status,
            approval_status,
            coverage_area,
            services_provided,
            remarks,
            map_symbol_id,
            coordinate_system,
            display_rule,
            spatial_id,
            submitted_for_approval_at,
            submitted_for_approval_by,
            port_authority_approved_at,
            port_authority_approved_by,
            port_authority_approval_content,
            department_approved_at,
            department_approved_by,
            department_approval_content,
            rejection_reason,
            created_at,
            updated_at,
            created_by,
            updated_by,
            deleted_at,
            deleted_by
        FROM coastal_radio_stations';
    END IF;

    -- Truong hop 2: dai_ttdh la base table (chuan hien tai), tao compatibility view coastal_radio_stations
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = current_schema() AND table_name = 'dai_ttdh'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = current_schema() AND table_name = 'coastal_radio_stations'
    ) THEN
        EXECUTE 'CREATE OR REPLACE VIEW coastal_radio_stations AS
        SELECT
            id,
            dai_ttdh_code AS station_code,
            dai_ttdh_name AS station_name,
            org_unit_id,
            operating_unit_id,
            station_level,
            province_id,
            detailed_location,
            operational_status,
            approval_status,
            coverage_area,
            services_provided,
            remarks,
            map_symbol_id,
            coordinate_system,
            display_rule,
            spatial_id,
            submitted_for_approval_at,
            submitted_for_approval_by,
            port_authority_approved_at,
            port_authority_approved_by,
            port_authority_approval_content,
            department_approved_at,
            department_approved_by,
            department_approval_content,
            rejection_reason,
            created_at,
            updated_at,
            created_by,
            updated_by,
            deleted_at,
            deleted_by
        FROM dai_ttdh';
    END IF;
END $$;

