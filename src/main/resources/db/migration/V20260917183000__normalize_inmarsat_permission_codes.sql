-- Đài Inmarsat dùng một bộ mã quyền duy nhất: inmarsat:*.
-- Chuyển các grant cũ coastalstationinmarsat:* trước khi xóa definition cũ,
-- để quyền đã cấp cho người dùng/nhóm không bị mất sau khi triển khai.

DO $$
DECLARE
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF to_regclass('public.permissions') IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
    SELECT gen_random_uuid(), 'inmarsat:' || item.action, item.name, 'inmarsat', item.action,
           item.description, v_now, v_now
    FROM (VALUES
        ('read', 'Xem đài Inmarsat', 'Xem danh sách và chi tiết đài Inmarsat'),
        ('create', 'Thêm đài Inmarsat', 'Tạo mới đài Inmarsat'),
        ('update', 'Cập nhật đài Inmarsat', 'Chỉnh sửa đài Inmarsat'),
        ('delete', 'Xóa đài Inmarsat', 'Xóa đài Inmarsat'),
        ('approvec1', 'Phê duyệt C1 đài Inmarsat', 'Phê duyệt cấp 1 đài Inmarsat'),
        ('approvec2', 'Phê duyệt C2 đài Inmarsat', 'Phê duyệt cấp 2 đài Inmarsat'),
        ('history', 'Lịch sử phê duyệt đài Inmarsat', 'Xem lịch sử thay đổi và phê duyệt đài Inmarsat')
    ) AS item(action, name, description)
    WHERE NOT EXISTS (
        SELECT 1 FROM permissions p WHERE p.code = 'inmarsat:' || item.action
    );

    -- Quyền cấp trực tiếp lưu theo mã. Bổ sung mã mới trước, rồi thu hồi mã cũ.
    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        UPDATE app_users u
        SET permission_version = COALESCE(permission_version, 0) + 1
        WHERE EXISTS (
            SELECT 1
            FROM user_permission_override upo
            WHERE upo.user_id = u.id
              AND upo.deleted_at IS NULL
              AND (upo.permission_code LIKE 'coastalstationinmarsat:%'
                   OR upo.permission_code = 'inmarsat:manage')
        );

        INSERT INTO user_permission_override (
            id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by
        )
        SELECT gen_random_uuid(), upo.user_id,
               replace(upo.permission_code, 'coastalstationinmarsat:', 'inmarsat:'),
               COALESCE(upo.reason, 'Chuẩn hóa mã quyền Đài Inmarsat'),
               v_now, v_now, upo.created_by, upo.updated_by
        FROM user_permission_override upo
        WHERE upo.deleted_at IS NULL
          AND upo.permission_code LIKE 'coastalstationinmarsat:%'
          AND upo.permission_code <> 'coastalstationinmarsat:manage'
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override existing
              WHERE existing.user_id = upo.user_id
                AND LOWER(existing.permission_code) = LOWER(replace(upo.permission_code, 'coastalstationinmarsat:', 'inmarsat:'))
                AND existing.deleted_at IS NULL
          );

        UPDATE user_permission_override
        SET deleted_at = v_now, updated_at = v_now
        WHERE deleted_at IS NULL
          AND (permission_code LIKE 'coastalstationinmarsat:%'
               OR permission_code = 'inmarsat:manage');
    END IF;

    -- Một số cơ sở dữ liệu cũ còn giữ quyền nhóm theo chuỗi mã.
    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        INSERT INTO user_group_permissions (user_group_id, permission)
        SELECT DISTINCT ugp.user_group_id, replace(ugp.permission, 'coastalstationinmarsat:', 'inmarsat:')
        FROM user_group_permissions ugp
        WHERE ugp.permission LIKE 'coastalstationinmarsat:%'
          AND ugp.permission <> 'coastalstationinmarsat:manage'
          AND NOT EXISTS (
              SELECT 1 FROM user_group_permissions existing
              WHERE existing.user_group_id = ugp.user_group_id
                AND existing.permission = replace(ugp.permission, 'coastalstationinmarsat:', 'inmarsat:')
          );

        DELETE FROM user_group_permissions
        WHERE permission LIKE 'coastalstationinmarsat:%'
           OR permission = 'inmarsat:manage';
    END IF;

    -- Tương thích cơ sở dữ liệu chưa bỏ bảng role_permissions.
    IF to_regclass('public.role_permissions') IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT DISTINCT rp.role_id, current_permission.id
        FROM role_permissions rp
        JOIN permissions legacy_permission ON legacy_permission.id = rp.permission_id
        JOIN permissions current_permission
          ON current_permission.code = replace(legacy_permission.code, 'coastalstationinmarsat:', 'inmarsat:')
        WHERE legacy_permission.code LIKE 'coastalstationinmarsat:%'
          AND legacy_permission.code <> 'coastalstationinmarsat:manage'
          AND NOT EXISTS (
              SELECT 1 FROM role_permissions existing
              WHERE existing.role_id = rp.role_id
                AND existing.permission_id = current_permission.id
          );

        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions
            WHERE code LIKE 'coastalstationinmarsat:%'
               OR code = 'inmarsat:manage'
        );
    END IF;

    DELETE FROM permissions
WHERE code LIKE 'coastalstationinmarsat:%'
   OR code = 'inmarsat:manage';
END $$;
