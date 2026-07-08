-- V29: Add nhom_cang_bien column to cang_bien table
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS nhom_cang_bien INT NULL;
