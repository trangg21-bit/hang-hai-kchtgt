-- Migration to drop unused type column from org_units table
ALTER TABLE org_units DROP COLUMN type;
