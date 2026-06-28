-- ============================================================================
-- F-002: User Group Management — Database Migration
-- ============================================================================
-- Module: M-001 (Quan tri he thong)
-- Feature: F-002 (Quan ly nhom nguoi dung)
-- Description: Creates 3 new tables: user_groups, group_members, group_histories
-- with all indexes, constraints, and seed data per SA design.
--
-- Prerequisites: V1-V19 must be applied first (app_users, roles must exist).
-- Target DB: MSSQL 2022 (also compatible with PostgreSQL / H2 for testing).
-- ============================================================================

-- ============================================================================
-- Table: user_groups
-- ============================================================================
CREATE TABLE user_groups (
    id          UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    name        NVARCHAR(100)     NOT NULL,
    code        NVARCHAR(50)      NOT NULL,
    description NVARCHAR(500),
    group_type  NVARCHAR(30)      NOT NULL DEFAULT 'custom',
    status      NVARCHAR(20)      NOT NULL DEFAULT 'ACTIVE',
    created_at  DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at  DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    deleted_at  DATETIME2,
    CONSTRAINT chk_user_groups_group_type CHECK (group_type IN ('department', 'project', 'custom')),
    CONSTRAINT chk_user_groups_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- Unique constraints (BR-008: unique name and code)
CREATE UNIQUE INDEX uk_user_groups_name ON user_groups(name) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uk_user_groups_code ON user_groups(code);

-- Indexes for filtering and sorting
CREATE INDEX idx_user_groups_group_type ON user_groups(group_type);
CREATE INDEX idx_user_groups_status ON user_groups(status);
CREATE INDEX idx_user_groups_status_group_type ON user_groups(status, group_type);
CREATE INDEX idx_user_groups_name ON user_groups(name);
CREATE INDEX idx_user_groups_created_at ON user_groups(created_at DESC);

-- ============================================================================
-- Table: group_members
-- ============================================================================
CREATE TABLE group_members (
    id           UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    user_id      UNIQUEIDENTIFIER NOT NULL,
    user_group_id UNIQUEIDENTIFIER NOT NULL,
    role         NVARCHAR(30)      NOT NULL DEFAULT 'member',
    status       NVARCHAR(20)      NOT NULL DEFAULT 'ACTIVE',
    joined_at    DATETIME2,
    added_by     UNIQUEIDENTIFIER,
    created_at   DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at   DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    deleted_at   DATETIME2,
    CONSTRAINT chk_group_members_status CHECK (status IN ('ACTIVE', 'REMOVED', 'BANNED')),
    CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES app_users(id),
    CONSTRAINT fk_group_members_group FOREIGN KEY (user_group_id) REFERENCES user_groups(id) ON DELETE CASCADE
);

-- Unique composite: one membership per user per group (BR-010)
CREATE UNIQUE INDEX uk_group_members_user_group ON group_members(user_id, user_group_id) WHERE deleted_at IS NULL;

-- Indexes for queries
CREATE INDEX idx_group_members_group_id ON group_members(user_group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_status ON group_members(status);
CREATE INDEX idx_group_members_joined_at ON group_members(joined_at);

-- ============================================================================
-- Table: group_histories (immutable audit trail — BR-015)
-- ============================================================================
CREATE TABLE group_histories (
    id            UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    user_group_id UNIQUEIDENTIFIER NOT NULL,
    group_name    NVARCHAR(100),
    group_code    NVARCHAR(50),
    action        NVARCHAR(30)     NOT NULL,
    notes         NVARCHAR(MAX),
    performed_by  UNIQUEIDENTIFIER NOT NULL,
    performed_by_name NVARCHAR(100),
    performed_at  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    created_at    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    deleted_at    DATETIME2,
    CONSTRAINT fk_group_histories_group FOREIGN KEY (user_group_id) REFERENCES user_groups(id),
    CONSTRAINT fk_group_histories_user FOREIGN KEY (performed_by) REFERENCES app_users(id)
);

-- Indexes for history queries
CREATE INDEX idx_group_histories_group_id ON group_histories(user_group_id);
CREATE INDEX idx_group_histories_performed_at ON group_histories(performed_at DESC);
CREATE INDEX idx_group_histories_performed_by ON group_histories(performed_by);

-- ============================================================================
-- Table: user_group_permissions (many-to-many join table)
-- ============================================================================
CREATE TABLE user_group_permissions (
    user_group_id   UNIQUEIDENTIFIER NOT NULL,
    permission      NVARCHAR(100)    NOT NULL,
    CONSTRAINT fk_ugp_group FOREIGN KEY (user_group_id) REFERENCES user_groups(id) ON DELETE CASCADE
);

CREATE INDEX idx_ugp_group_id ON user_group_permissions(user_group_id);
CREATE INDEX idx_ugp_permission ON user_group_permissions(permission);

-- ============================================================================
-- Seed: Default system groups (optional — uncomment if needed)
-- ============================================================================
-- INSERT INTO user_groups (id, name, code, description, group_type, status)
-- VALUES (
--     NEWID(),
--     'Nhom quan tri vien',
--     'SYS-ADMIN',
--     'He thong default group for admin users',
--     'custom',
--     'ACTIVE'
-- );

-- ============================================================================
-- Migration applied: 2026-06-28
-- Rollback: Drop tables in reverse order: group_histories, group_members,
--           user_group_permissions, user_groups
-- ============================================================================
