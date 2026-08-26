-- Migration: Clean invalid draft history records for VTS System 2 and all VTS systems
-- Version: V20260826143000

-- 1. Xóa các bản ghi nhật ký tạo mới bản nháp (DRAFT / CREATED) của Hệ thống VTS số 2 và các hệ thống VTS
DELETE FROM infrastructure_history
WHERE ref_type = 'VTS_SYSTEM'
  AND (
      status = 'CREATED'
      OR new_value = 'Trạng thái phê duyệt=Lưu tạm'
      OR (reason = 'Tạo mới hệ thống VTS' AND approval_level = 'LEVEL_0')
      OR (changed_field = 'Trạng thái phê duyệt' AND (previous_value IS NULL OR previous_value = '') AND new_value = 'Trạng thái phê duyệt=Lưu tạm')
  );

-- 2. Đảm bảo xóa triệt để bất kỳ bản ghi draft log nào gắn với Hệ thống VTS số 2
DELETE FROM infrastructure_history
WHERE ref_type = 'VTS_SYSTEM'
  AND ref_id IN (
      SELECT id FROM vts_system
      WHERE system_name ILIKE '%Hệ thống VTS số 2%'
         OR code ILIKE '%VTS-002%'
         OR code ILIKE '%VTS%2%'
  )
  AND (
      status = 'CREATED'
      OR new_value = 'Trạng thái phê duyệt=Lưu tạm'
      OR (previous_value IS NULL AND reason LIKE '%Tạo mới%')
  );
