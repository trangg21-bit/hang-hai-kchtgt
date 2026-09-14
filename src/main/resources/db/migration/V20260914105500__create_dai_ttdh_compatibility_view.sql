-- ==============================================================================
-- Migration: V20260914105500__create_dai_ttdh_compatibility_view.sql
-- Mo ta: Tao compatibility view dai_ttdh tro toi bang coastal_radio_stations
--        de dam bao tinh tuong thich nguoc cho JPA Entity DaiTtdh va cac module
--        lien ket (CoastalStationAsset, DaiTtdhService, v.v.)
-- ==============================================================================

CREATE OR REPLACE VIEW dai_ttdh AS
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
FROM coastal_radio_stations;
