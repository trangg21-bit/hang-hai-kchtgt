-- Migration to purge redundant approvec1 and approvec2 permissions for M-002 entities
-- M-002 entities (port, berth, pier, dryport, waterzone) use single-level approval (resource:approve)

DELETE FROM role_permissions WHERE permission_id IN (
    SELECT id FROM permissions WHERE resource IN ('port', 'berth', 'pier', 'dryport', 'waterzone') AND action IN ('approvec1', 'approvec2')
);

DELETE FROM permissions WHERE resource IN ('port', 'berth', 'pier', 'dryport', 'waterzone') AND action IN ('approvec1', 'approvec2');
