-- Migration: Clean soft delete and draft saved history logs from infrastructure_history
-- Timestamp: 20260923103500
-- Purpose: Follow standard: do not record audit history when deleting records or saving initial drafts.
-- Only record change history when editing APPROVED records.

DELETE FROM infrastructure_history
WHERE status::text IN ('DELETED', '6')
   OR changed_field = 'deleted_at'
   OR new_value = 'đã xóa mềm'
   OR status::text IN ('DRAFT_SAVED', '0', 'CREATED');

