-- ============================================================================
-- Migration: V20260917110000__remove_anchorage_approve_and_anchoragearea_permissions.sql
-- Description: Xóa bỏ quyền thừa anchorage:approve và dọn dẹp triệt để nhóm quyền trùng lặp anchoragearea:*
-- ============================================================================

DO $$
DECLARE
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
    deprecated_codes text[] := ARRAY[
        'anchorage:approve',
        'anchoragearea:approve',
        'anchoragearea:read',
        'anchoragearea:create',
        'anchoragearea:update',
        'anchoragearea:delete',
        'anchoragearea:approvec1',
        'anchoragearea:approvec2',
        'anchoragearea:history'
    ];
BEGIN
    -- 1. Chuyển tiếp an toàn quyền anchoragearea sang anchorage cho user (nếu chưa có)
    IF to_regclass('public.user_permission_override') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        -- Chuyển anchoragearea:read -> anchorage:read
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at)
        SELECT gen_random_uuid(), upo.user_id, 'anchorage:read', 'Tự động đồng bộ từ anchoragearea:read', v_now, v_now
        FROM user_permission_override upo
        WHERE upo.permission_code = 'anchoragearea:read'
          AND upo.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override u2
              WHERE u2.user_id = upo.user_id AND u2.permission_code = 'anchorage:read' AND u2.deleted_at IS NULL
          )
        ON CONFLICT DO NOTHING;

        -- Chuyển anchoragearea:create -> anchorage:create
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at)
        SELECT gen_random_uuid(), upo.user_id, 'anchorage:create', 'Tự động đồng bộ từ anchoragearea:create', v_now, v_now
        FROM user_permission_override upo
        WHERE upo.permission_code = 'anchoragearea:create'
          AND upo.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override u2
              WHERE u2.user_id = upo.user_id AND u2.permission_code = 'anchorage:create' AND u2.deleted_at IS NULL
          )
        ON CONFLICT DO NOTHING;

        -- Chuyển anchoragearea:update -> anchorage:update
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at)
        SELECT gen_random_uuid(), upo.user_id, 'anchorage:update', 'Tự động đồng bộ từ anchoragearea:update', v_now, v_now
        FROM user_permission_override upo
        WHERE upo.permission_code = 'anchoragearea:update'
          AND upo.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override u2
              WHERE u2.user_id = upo.user_id AND u2.permission_code = 'anchorage:update' AND u2.deleted_at IS NULL
          )
        ON CONFLICT DO NOTHING;

        -- Chuyển anchoragearea:delete -> anchorage:delete
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at)
        SELECT gen_random_uuid(), upo.user_id, 'anchorage:delete', 'Tự động đồng bộ từ anchoragearea:delete', v_now, v_now
        FROM user_permission_override upo
        WHERE upo.permission_code = 'anchoragearea:delete'
          AND upo.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override u2
              WHERE u2.user_id = upo.user_id AND u2.permission_code = 'anchorage:delete' AND u2.deleted_at IS NULL
          )
        ON CONFLICT DO NOTHING;

        -- Chuyển anchoragearea:approvec1 -> anchorage:approvec1
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at)
        SELECT gen_random_uuid(), upo.user_id, 'anchorage:approvec1', 'Tự động đồng bộ từ anchoragearea:approvec1', v_now, v_now
        FROM user_permission_override upo
        WHERE upo.permission_code = 'anchoragearea:approvec1'
          AND upo.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override u2
              WHERE u2.user_id = upo.user_id AND u2.permission_code = 'anchorage:approvec1' AND u2.deleted_at IS NULL
          )
        ON CONFLICT DO NOTHING;

        -- Chuyển anchoragearea:approvec2 -> anchorage:approvec2
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at)
        SELECT gen_random_uuid(), upo.user_id, 'anchorage:approvec2', 'Tự động đồng bộ từ anchoragearea:approvec2', v_now, v_now
        FROM user_permission_override upo
        WHERE upo.permission_code = 'anchoragearea:approvec2'
          AND upo.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override u2
              WHERE u2.user_id = upo.user_id AND u2.permission_code = 'anchorage:approvec2' AND u2.deleted_at IS NULL
          )
        ON CONFLICT DO NOTHING;

        -- Chuyển anchoragearea:history -> anchorage:history
        INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at)
        SELECT gen_random_uuid(), upo.user_id, 'anchorage:history', 'Tự động đồng bộ từ anchoragearea:history', v_now, v_now
        FROM user_permission_override upo
        WHERE upo.permission_code = 'anchoragearea:history'
          AND upo.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM user_permission_override u2
              WHERE u2.user_id = upo.user_id AND u2.permission_code = 'anchorage:history' AND u2.deleted_at IS NULL
          )
        ON CONFLICT DO NOTHING;
    END IF;

    -- 2. Xóa triệt để khỏi user_permission_override
    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override
        WHERE permission_code = ANY(deprecated_codes)
           OR permission_code LIKE 'anchoragearea:%';
    END IF;

    -- 3. Xóa triệt để khỏi user_group_permissions
    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions
        WHERE permission = ANY(deprecated_codes)
           OR permission LIKE 'anchoragearea:%';
    END IF;

    -- 4. Xóa triệt để khỏi role_permissions
    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions
            WHERE code = ANY(deprecated_codes)
               OR code LIKE 'anchoragearea:%'
               OR resource = 'anchoragearea'
        );
    END IF;

    -- 5. Xóa triệt để khỏi permissions
    IF to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM permissions
        WHERE code = ANY(deprecated_codes)
           OR code LIKE 'anchoragearea:%'
           OR resource = 'anchoragearea';
    END IF;

    RAISE NOTICE 'Đã dọn sạch quyền anchorage:approve và toàn bộ nhóm quyền anchoragearea:*';
END $$;
