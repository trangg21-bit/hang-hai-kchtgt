-- ============================================================================
-- F-002 Scope Expansion: Add organization_id to user_groups
-- ============================================================================
-- Module: M-001 (Quản trị hệ thống)
-- Feature: F-002 (Quản lý nhóm người dùng)
-- Description: Adds organization_id column and index for data scope filtering.
-- ============================================================================

ALTER TABLE user_groups ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_groups_organization_id ON user_groups(organization_id);
