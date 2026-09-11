-- Migration: Add missing audit columns from BaseEntity and lock_version
-- Tables: transmission_assets, transmission_asset_exploitations, transmission_asset_adjustments

ALTER TABLE transmission_assets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE transmission_assets ADD COLUMN IF NOT EXISTS deleted_by UUID;
ALTER TABLE transmission_assets ADD COLUMN IF NOT EXISTS lock_version INTEGER DEFAULT 0;
ALTER TABLE transmission_assets ADD COLUMN IF NOT EXISTS vts_assist_id UUID;
CREATE INDEX IF NOT EXISTS idx_transmission_assets_vts_assist_id ON transmission_assets(vts_assist_id);
CREATE INDEX IF NOT EXISTS idx_transmission_assets_asset_type ON transmission_assets(asset_type);

ALTER TABLE transmission_asset_exploitations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE transmission_asset_exploitations ADD COLUMN IF NOT EXISTS deleted_by UUID;

ALTER TABLE transmission_asset_adjustments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE transmission_asset_adjustments ADD COLUMN IF NOT EXISTS deleted_by UUID;
