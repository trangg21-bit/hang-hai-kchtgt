-- ============================================================================
-- Migration: V20260914133500__unify_archived_approval_status_for_all_kcht.sql
-- Mục đích: Chuẩn hóa trạng thái phê duyệt của các bản ghi đã xóa mềm (deleted_at IS NOT NULL)
-- sang ARCHIVED (7) cho toàn bộ các bảng tài sản Kết cấu Hạ tầng Hàng hải (KCHT)
-- theo quy định tại approval-2-level-spec.md mục 3.1 & AGENTS.md.
-- Sử dụng PL/pgSQL kiểm tra tồn tại bảng & cột để đảm bảo tương thích 100%.
-- ============================================================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'ports',
        'piers',
        'berths',
        'dry_ports',
        'buoy_berths',
        'dai_ttdh',
        'anchorages',
        'transfer_areas',
        'storm_shelter_areas',
        'ship_repair_yards',
        'water_zones',
        'navigation_channel',
        'ship_repair_facility',
        'coastal_station_cospas_sarsat',
        'coastal_station_lrit',
        'coastal_station_inmarsat',
        'coastal_station_haiphong',
        'vts_system',
        'vts_operation_center',
        'vts_assist',
        'vhf',
        'transmission',
        'radar_station',
        'dike_revetment',
        'scada',
        'cctv',
        'ais_system'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = current_schema() AND table_name = tbl AND column_name = 'deleted_at'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = current_schema() AND table_name = tbl AND column_name = 'approval_status'
        ) THEN
            EXECUTE format('UPDATE %I SET approval_status = 7 WHERE deleted_at IS NOT NULL AND approval_status != 7', tbl);
        END IF;
    END LOOP;
END $$;
