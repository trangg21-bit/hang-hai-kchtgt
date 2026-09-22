-- Migration: Clean empty / ghost history records from infrastructure_history
-- Timestamp: 20260922095500
-- Purpose: Remove records that have no changed fields and no reason/note

DELETE FROM infrastructure_history
WHERE (changed_field IS NULL OR trim(changed_field) = '')
  AND (reason IS NULL OR trim(reason) = '');

DELETE FROM infrastructure_history
WHERE (status::text IN ('0', 'CREATED'))
  AND (changed_field IS NULL OR previous_value IS NULL OR previous_value = '');
