-- Migration to drop legacy role_menu_permissions table
-- All authorization logic is consolidated into single role_permissions table

DROP TABLE IF EXISTS role_menu_permissions;
