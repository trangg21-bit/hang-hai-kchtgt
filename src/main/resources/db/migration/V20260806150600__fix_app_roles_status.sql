ALTER TABLE app_roles DROP CONSTRAINT IF EXISTS app_roles_status_check;

ALTER TABLE app_roles 
ALTER COLUMN status TYPE integer 
USING CASE 
    WHEN status = 'ACTIVE' THEN 0 
    WHEN status = 'INACTIVE' THEN 1 
    WHEN status = 'DELETED' THEN 2 
    ELSE 0 
END;
