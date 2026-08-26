-- ============================================================================
-- V20260825120000: navigation_channel Excel 71-field target schema (F-038)
-- Design plan: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/design/00-design-plan.md
-- Section 5 (migration structure) — all steps guarded / idempotent.
--
-- Summary:
--   1. navigation_channel: RENAME 9 legacy columns to standard English
--   2. navigation_channel: ADD Excel fields #19-#21, #39-#44 + condition_status + 4 approval fields
--   3. Backfill org_unit_id from users (fail-closed if unresolvable), then SET NOT NULL
--   4. province_id: legacy `location` has no mapping table (provinces has only id/name per
--      V108__create_provinces_table.sql) -> keep province_id values assigned by V109 (best-effort rule)
--   5. Backfill condition_status = 0 (OPERATIONAL)
--   6. Backfill channel_code = 'LHH' + %06d per org_unit_id
--   7. DROP 10 legacy columns that are outside the 71-field Excel spec (BR-038-01)
--   8. Rebuild dashboard index without dropped `status` column; add unique per-org code index + org filter index
--   9. channel_route_detail: RENAME table chi_tiet_tuyen_luong -> channel_route_detail, RENAME 16 columns,
--      cast 3 string columns to NUMERIC(19,4), ADD audit + 2 new fields, DROP 3 obsolete columns
--  10. navigation_channel_coordinate: NEW child table (#45) with FK ON DELETE CASCADE
--  11. Add the 4 new approval columns to the other 4 BaseApprovableEntity tables
--      (vts_system, dike_revetment, radar_station, ship_repair_facility)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. navigation_channel — RENAME 9 legacy columns (guarded)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'channel_management_station') THEN
        ALTER TABLE public.navigation_channel RENAME COLUMN channel_management_station TO management_station;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'station_amountt') THEN
        ALTER TABLE public.navigation_channel RENAME COLUMN station_amountt TO station_count;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'station_staff_amount') THEN
        ALTER TABLE public.navigation_channel RENAME COLUMN station_staff_amount TO station_staff_count;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'station_area') THEN
        ALTER TABLE public.navigation_channel RENAME COLUMN station_area TO station_area_square_meters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'latest_station_repair_date') THEN
        ALTER TABLE public.navigation_channel RENAME COLUMN latest_station_repair_date TO latest_station_repair_month;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'dredging_volume') THEN
        ALTER TABLE public.navigation_channel RENAME COLUMN dredging_volume TO latest_dredging_volume_cubic_meters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'buoy_amount') THEN
        ALTER TABLE public.navigation_channel RENAME COLUMN buoy_amount TO buoy_count;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'beacon_amount') THEN
        ALTER TABLE public.navigation_channel RENAME COLUMN beacon_amount TO beacon_count;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'note') THEN
        ALTER TABLE public.navigation_channel RENAME COLUMN note TO notes;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. navigation_channel — ADD Excel fields (#19-#21, #39-#44), condition_status, 4 approval fields
-- ----------------------------------------------------------------------------
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS announcement_decision_number VARCHAR(100);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS announcement_decision_date DATE;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS announcement_decision_issuer VARCHAR(500);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS protection_scope_meters NUMERIC(19,4);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS protection_notes VARCHAR(500);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS geometry_type SMALLINT;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS map_icon_id UUID;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS coordinate_reference_system VARCHAR(50);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS display_rule VARCHAR(500);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS condition_status SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS level1_approval_content VARCHAR(2000);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS level2_approval_content VARCHAR(2000);

-- ----------------------------------------------------------------------------
-- 3. Backfill org_unit_id (orgUnitId is MANDATORY — never NULL for business rows)
--    Fail-closed: if any row still has NULL org_unit_id after the user-based backfill,
--    abort the migration so no record can be created without a managing unit.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    remaining_null BIGINT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'org_unit_id') THEN
        UPDATE public.navigation_channel nc
           SET org_unit_id = u.org_unit_id
          FROM public.users u
         WHERE nc.org_unit_id IS NULL
           AND u.id = nc.created_by
           AND u.org_unit_id IS NOT NULL;
    END IF;

    SELECT COUNT(*) INTO remaining_null
      FROM public.navigation_channel
     WHERE org_unit_id IS NULL;

    IF remaining_null > 0 THEN
        RAISE EXCEPTION 'V20260825120000: % navigation_channel row(s) still have NULL org_unit_id after user-based backfill. Resolve manually before applying NOT NULL constraint.', remaining_null;
    END IF;
END $$;

ALTER TABLE public.navigation_channel ALTER COLUMN org_unit_id SET NOT NULL;

-- ----------------------------------------------------------------------------
-- 4. province_id backfill — BEST-EFFORT
--    Legacy `location` (varchar(6)) has no mapping table to provinces (provinces.id/name only,
--    V108). Rows keep the province_id assigned by V109__sync_kcht_province_code.sql.
--    The legacy `location` column itself is dropped in step 7 below.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 5. Backfill condition_status = 0 (OPERATIONAL) — column already DEFAULT 0, keep explicit
-- ----------------------------------------------------------------------------
UPDATE public.navigation_channel SET condition_status = 0 WHERE condition_status IS NULL;

-- ----------------------------------------------------------------------------
-- 6. Backfill channel_code = 'LHH' + %06d per org_unit_id (ordered by created_at)
-- ----------------------------------------------------------------------------
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY org_unit_id ORDER BY created_at NULLS LAST, id) AS rn
      FROM public.navigation_channel
     WHERE channel_code IS NULL OR btrim(channel_code) = ''
)
UPDATE public.navigation_channel nc
   SET channel_code = 'LHH' || LPAD(ranked.rn::text, 6, '0')
  FROM ranked
 WHERE nc.id = ranked.id;

-- ----------------------------------------------------------------------------
-- 7. DROP 10 legacy columns outside the 71-field Excel spec (BR-038-01)
-- ----------------------------------------------------------------------------
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS status;
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS is_approved_level1;
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS is_approved_level2;
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS clearance_height;
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS location;
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS registered_area;
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS operating_hours;
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS recorded_date;
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS quantity;
ALTER TABLE public.navigation_channel DROP COLUMN IF EXISTS load_capacity;

-- ----------------------------------------------------------------------------
-- 8. Indexes — rebuild dashboard index (dropped `status` column), unique per-org code, org filter
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_navigation_channel_dashboard;
CREATE INDEX idx_navigation_channel_dashboard ON public.navigation_channel (deleted_at, approval_status);
CREATE UNIQUE INDEX IF NOT EXISTS ux_navigation_channel_org_code
    ON public.navigation_channel (org_unit_id, channel_code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_navigation_channel_org_unit ON public.navigation_channel (org_unit_id);

-- ----------------------------------------------------------------------------
-- 9. channel_route_detail — RENAME from chi_tiet_tuyen_luong or CREATE IF NOT EXISTS
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.chi_tiet_tuyen_luong') IS NOT NULL
       AND to_regclass('public.channel_route_detail') IS NULL THEN
        ALTER TABLE public.chi_tiet_tuyen_luong RENAME TO channel_route_detail;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.channel_route_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    navigation_channel_id UUID,
    sequence_no INTEGER NOT NULL DEFAULT 1,
    route_classification INTEGER,
    route_code VARCHAR(50),
    route_name VARCHAR(255),
    route_type INTEGER,
    channel_length_kilometers NUMERIC(19,4),
    design_depth_meters NUMERIC(19,4),
    current_depth_meters NUMERIC(19,4),
    maximum_design_width_meters NUMERIC(19,4),
    minimum_design_width_meters NUMERIC(19,4),
    design_slope NUMERIC(19,4),
    minimum_curve_radius_meters NUMERIC(19,4),
    vertical_clearance_meters NUMERIC(19,4),
    turning_basin_location VARCHAR(255),
    turning_basin_radius_meters NUMERIC(19,4),
    route_latest_maintenance_year INTEGER,
    route_latest_dredging_volume_cubic_meters NUMERIC(19,4),
    route_grade INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'sequenceno') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN sequenceno TO sequence_no;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'phan_loai') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN phan_loai TO route_classification;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'ma') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN ma TO route_code;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'ten') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN ten TO route_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'loai_tuyen_luong') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN loai_tuyen_luong TO route_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'vi_tri_vung_quay_tau') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN vi_tri_vung_quay_tau TO turning_basin_location;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'ban_kinh_vung_quay_tau') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN ban_kinh_vung_quay_tau TO turning_basin_radius_meters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'chieu_cao_tinh_khong') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN chieu_cao_tinh_khong TO vertical_clearance_meters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'chieu_dai') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN chieu_dai TO channel_length_kilometers;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'rong_lon_nhat') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN rong_lon_nhat TO maximum_design_width_meters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'rong_nho_nhat') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN rong_nho_nhat TO minimum_design_width_meters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'do_sau') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN do_sau TO design_depth_meters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'do_sau_hien_tai') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN do_sau_hien_tai TO current_depth_meters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'mai_doc_thiet_ke') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN mai_doc_thiet_ke TO design_slope;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'ban_kinh_cong_nho_nhat') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN ban_kinh_cong_nho_nhat TO minimum_curve_radius_meters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'khoi_luong_nao_vet') THEN
        ALTER TABLE public.channel_route_detail RENAME COLUMN khoi_luong_nao_vet TO route_latest_dredging_volume_cubic_meters;
    END IF;
END $$;

-- Cast 3 legacy string columns to NUMERIC(19,4); non-numeric legacy values -> NULL (best-effort)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'vertical_clearance_meters'
                 AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.channel_route_detail ALTER COLUMN vertical_clearance_meters TYPE NUMERIC(19,4)
            USING CASE WHEN btrim(vertical_clearance_meters::text) ~ '^[0-9]+(\.[0-9]+)?$'
                       THEN btrim(vertical_clearance_meters::text)::numeric ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'current_depth_meters'
                 AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.channel_route_detail ALTER COLUMN current_depth_meters TYPE NUMERIC(19,4)
            USING CASE WHEN btrim(current_depth_meters::text) ~ '^[0-9]+(\.[0-9]+)?$'
                       THEN btrim(current_depth_meters::text)::numeric ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'design_slope'
                 AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.channel_route_detail ALTER COLUMN design_slope TYPE NUMERIC(19,4)
            USING CASE WHEN btrim(design_slope::text) ~ '^[0-9]+(\.[0-9]+)?$'
                       THEN btrim(design_slope::text)::numeric ELSE NULL END;
    END IF;
END $$;

-- New fields (#37, #38) + BaseEntity audit columns (child now extends BaseEntity)
ALTER TABLE public.channel_route_detail ADD COLUMN IF NOT EXISTS route_latest_maintenance_year INTEGER;
ALTER TABLE public.channel_route_detail ADD COLUMN IF NOT EXISTS route_grade INTEGER;
ALTER TABLE public.channel_route_detail ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.channel_route_detail ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE public.channel_route_detail ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE public.channel_route_detail ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Drop obsolete columns (protection scope #39 lives on the parent navigation_channel)
ALTER TABLE public.channel_route_detail DROP COLUMN IF EXISTS cong_cong;
ALTER TABLE public.channel_route_detail DROP COLUMN IF EXISTS chuyen_dung;
ALTER TABLE public.channel_route_detail DROP COLUMN IF EXISTS pham_vi_bao_ve_luong;

-- FK to navigation_channel must be NOT NULL
ALTER TABLE public.channel_route_detail ALTER COLUMN navigation_channel_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_channel_route_detail_nc ON public.channel_route_detail (navigation_channel_id);

-- ----------------------------------------------------------------------------
-- 10. navigation_channel_coordinate — NEW child table (#45), FK ON DELETE CASCADE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.navigation_channel_coordinate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    navigation_channel_id UUID NOT NULL,
    sequence_no INTEGER NOT NULL,
    longitude NUMERIC(10,7),
    latitude NUMERIC(9,7),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP,
    deleted_by UUID,
    created_by UUID,
    updated_by UUID
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_navigation_channel_coordinate_nc') THEN
        ALTER TABLE public.navigation_channel_coordinate
            ADD CONSTRAINT fk_navigation_channel_coordinate_nc
            FOREIGN KEY (navigation_channel_id) REFERENCES public.navigation_channel(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_navigation_channel_coordinate_nc
    ON public.navigation_channel_coordinate (navigation_channel_id);

-- ----------------------------------------------------------------------------
-- 11. Add the 4 new approval workflow columns to the other 4 tables extending
--     BaseApprovableEntity (BaseApprovableEntity gains submittedAt/By + level1/2ApprovalContent;
--     ddl-auto: none means missing columns = runtime error on select)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    t_name text;
    tables text[] := ARRAY['vts_system', 'dike_revetment', 'radar_station', 'ship_repair_facility'];
BEGIN
    FOREACH t_name IN ARRAY tables LOOP
        IF to_regclass('public.' || t_name) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP', t_name);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS submitted_by UUID', t_name);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS level1_approval_content VARCHAR(2000)', t_name);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS level2_approval_content VARCHAR(2000)', t_name);
        END IF;
    END LOOP;
END $$;
