CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY,
    code VARCHAR(100),
    name VARCHAR(100),
    resource VARCHAR(50),
    action VARCHAR(50),
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- Xóa tất cả các quyền ngoại trừ tra cứu Cảng biển (port:read) và Đơn vị (orgunit:read) khỏi ROLE_INTEGRATION
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM app_roles WHERE code = 'ROLE_INTEGRATION')
  AND permission_id IN (
    SELECT id FROM permissions 
    WHERE code NOT IN ('data:read', 'data:write', 'api:share', 'orgunit:read', 'port:read')
  );



