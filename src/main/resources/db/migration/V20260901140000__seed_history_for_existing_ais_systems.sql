-- V20260901140000: Seed and backfill audit history for approved ais_system records

DO $$
DECLARE
    r RECORD;
    v_has_hist BOOLEAN;
BEGIN
    -- Xóa các log tạo mới / cập nhật nháp không đúng chuẩn của AIS
    DELETE FROM infrastructure_history 
    WHERE ref_type = 'AIS_SYSTEM' 
      AND status IN ('CREATED', 'PROPOSED')
      AND ref_id IN (SELECT id FROM ais_system WHERE approval_status != 5);

    FOR r IN SELECT * FROM ais_system WHERE deleted_at IS NULL AND approval_status = 5 LOOP
        SELECT EXISTS (
            SELECT 1 FROM infrastructure_history 
            WHERE ref_type = 'AIS_SYSTEM' AND ref_id = r.id AND status = 'APPROVED'
        ) INTO v_has_hist;

        IF NOT v_has_hist THEN
            -- Ghi nhận mốc phê duyệt cấp cuối (APPROVED)
            INSERT INTO infrastructure_history (
                id, ref_id, ref_type, approval_level, status, approved_by, approved_date,
                reason, changed_field, previous_value, new_value
            ) VALUES (
                gen_random_uuid(), r.id, 'AIS_SYSTEM', 'LEVEL_2', 'APPROVED',
                COALESCE(r.approver_level2, r.updated_by),
                COALESCE(r.approved_date_level2, r.created_at + INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),
                'Cục Hàng hải Việt Nam phê duyệt hồ sơ',
                'Trạng thái phê duyệt', 'Chờ Cục duyệt', 'Đã duyệt'
            );
        END IF;
    END LOOP;
END $$;

