-- Chuyển đổi group_type và status của bảng user_groups sang smallint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_groups') THEN
        -- Xóa check constraint của group_type (nếu có)
        ALTER TABLE user_groups DROP CONSTRAINT IF EXISTS user_groups_grouptype_check;
        ALTER TABLE user_groups DROP CONSTRAINT IF EXISTS chk_user_groups_group_type;
        
        -- Xóa check constraint của status
        ALTER TABLE user_groups DROP CONSTRAINT IF EXISTS user_groups_status_check;
        
        -- Cập nhật kiểu cho group_type
        ALTER TABLE user_groups ALTER COLUMN group_type DROP DEFAULT;
        ALTER TABLE user_groups ALTER COLUMN group_type TYPE smallint USING CASE LOWER(group_type)
            WHEN 'department' THEN 0
            WHEN 'project' THEN 1
            WHEN 'custom' THEN 2
            ELSE 2
        END;
        ALTER TABLE user_groups ALTER COLUMN group_type SET DEFAULT 2;
        
        -- Cập nhật kiểu cho status
        ALTER TABLE user_groups ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE user_groups ALTER COLUMN status TYPE smallint USING CASE UPPER(status)
            WHEN 'ACTIVE' THEN 0
            WHEN 'INACTIVE' THEN 1
            ELSE 1
        END;
        ALTER TABLE user_groups ALTER COLUMN status SET DEFAULT 0;
    END IF;
END $$;

-- Chuyển đổi status của bảng group_members sang smallint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_members') THEN
        ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_status_check;
        -- Cập nhật kiểu cho status
        ALTER TABLE group_members ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE group_members ALTER COLUMN status TYPE smallint USING CASE UPPER(status)
            WHEN 'ACTIVE' THEN 0
            WHEN 'REMOVED' THEN 1
            WHEN 'BANNED' THEN 2
            ELSE 1
        END;
        ALTER TABLE group_members ALTER COLUMN status SET DEFAULT 0;
    END IF;
END $$;
