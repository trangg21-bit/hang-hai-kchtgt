-- F-006 cleanup: DROP tables for entities removed (AdminAccount, AdminRole, AdminStatus, AdminPermission, AdminRecoveryToken)
-- These tables were duplicated by F-001's RBAC (Role, UserRoles, UserPermissionOverride) and F-005's AccessLog.
-- AdminAuditLog table is KEPT — still used by AccessLogInterceptor (F-005).
--
-- Migration: V28__cleanup_f006_redundant_tables.sql

-- Drop in reverse dependency order

-- 1. admin_permission_keys (child of admin_permissions)
DROP TABLE IF EXISTS admin_permission_keys CASCADE;

-- 2. admin_permissions
DROP TABLE IF EXISTS admin_permissions CASCADE;

-- 3. admin_recovery_tokens
DROP TABLE IF EXISTS admin_recovery_tokens CASCADE;

-- 4. admin_account_modules (child of admin_accounts)
DROP TABLE IF EXISTS admin_account_modules CASCADE;

-- 5. admin_accounts
DROP TABLE IF EXISTS admin_accounts CASCADE;

-- admin_audit_logs is NOT dropped — still referenced by AccessLogInterceptor (F-005) and 20+ test classes
