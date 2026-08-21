-- Migration: Remove obsolete VtsSystem columns (responsibility_level, source, partner, approved_level1, approved_level2)

ALTER TABLE vts_system DROP COLUMN IF EXISTS responsibility_level;
ALTER TABLE vts_system DROP COLUMN IF EXISTS source;
ALTER TABLE vts_system DROP COLUMN IF EXISTS partner;
ALTER TABLE vts_system DROP COLUMN IF EXISTS approved_level1;
ALTER TABLE vts_system DROP COLUMN IF EXISTS approved_level2;
