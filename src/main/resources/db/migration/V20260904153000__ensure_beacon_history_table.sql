-- Tạo bảng beacon_history nếu môi trường chưa có (lỗi "relation beacon_history does not exist"
-- khi mở Lịch sử màn Đèn biển /beacon-stations — endpoint /beacon-history).
-- An toàn khi chạy lại: CREATE/ALTER đều IF NOT EXISTS.
CREATE TABLE IF NOT EXISTS public.beacon_history (
    id UUID PRIMARY KEY,
    beacon_type VARCHAR(50),
    entity_id UUID,
    action_type VARCHAR(50),
    changed_field VARCHAR(255),
    previous_value TEXT,
    new_value TEXT,
    changed_by BIGINT,
    changed_at TIMESTAMP,
    reason VARCHAR(500),
    diff_data JSON
);

CREATE INDEX IF NOT EXISTS idx_beacon_history_entity_type
    ON public.beacon_history (beacon_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_beacon_history_entity_changed_at
    ON public.beacon_history (entity_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_beacon_history_action_type
    ON public.beacon_history (action_type);
