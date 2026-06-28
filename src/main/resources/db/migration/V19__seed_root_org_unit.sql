-- V19: Seed root organisational unit (F-003)
-- Inserts the initial root unit: Cục Hàng hải

-- Only insert if no root unit exists (parent_id IS NULL)
INSERT INTO org_units (id, name, code, unit_type, description, address, phone, coefficient,
                       status, path, level, scope_id, sort_order, created_at, updated_at, approved_at)
SELECT
    gen_random_uuid(),  -- If using PostgreSQL; for MSSQL this would be NEWID()
    'Cục Hàng hải',
    'CUC_HH',
    'CUC',
    'Đơn vị gốc - Cục Hàng hải',
    NULL,
    NULL,
    1.00,
    'APPROVED',
    '',  -- Will be computed by service
    0,
    0,
    0,
    NOW(),
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL
);

-- Update the path for the root unit we just inserted (or already existed)
-- Note: The path computation happens in the application layer via MaterializedPathService
-- This migration ensures a seed exists for the application to reference.
