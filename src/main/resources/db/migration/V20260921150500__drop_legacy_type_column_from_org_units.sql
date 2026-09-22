-- Migration: Drop unused legacy type column from org_units table
-- Reason: org_units table uses 'rank' (SMALLINT) via OrgUnitRank (DEPARTMENT, BRANCH, REPRESENTATIVE).
-- The 'type' column contains 100% NULLs and is not mapped in OrgUnit entity.

ALTER TABLE org_units DROP COLUMN IF EXISTS type;
