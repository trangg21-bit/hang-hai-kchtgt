-- ============================================================
-- Migration: Chuẩn hóa cấu trúc CSDL Đài Cospas-Sarsat theo mẫu VTS
-- (vts_system & vts_operation_center) và BaseApprovableEntity (M-1006).
-- Timestamp: V20260915113000
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat'
    ) THEN
        -- 1. Bổ sung cột org_unit_id (chuẩn DataScope toàn hệ thống KCHT)
        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS org_unit_id UUID;

        -- Backfill org_unit_id từ unit_id hiện hữu
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'unit_id'
        ) THEN
            UPDATE public.coastal_station_cospas_sarsat
            SET org_unit_id = unit_id
            WHERE org_unit_id IS NULL AND unit_id IS NOT NULL;
        END IF;

        -- 2. Bổ sung tình trạng hoạt động chuẩn KCHT (ConditionStatus)
        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS condition_status SMALLINT NOT NULL DEFAULT 0;

        -- 3. Bổ sung các trường danh mục & tổ chức chuẩn
        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS operating_org_id UUID;

        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS owning_org_id UUID;

        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS symbol_id UUID;

        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS coordinate_reference_system VARCHAR(50);

        -- 4. Bổ sung trường ghi chú chuẩn KCHT
        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS note VARCHAR(2000);

        -- Backfill note từ description nếu có
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'description'
        ) THEN
            UPDATE public.coastal_station_cospas_sarsat
            SET note = description
            WHERE note IS NULL AND description IS NOT NULL;
        END IF;

        -- 5. Bổ sung trường nội dung phê duyệt 2 cấp (M-1006 / BaseApprovableEntity)
        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS level1_approval_content VARCHAR(2000);

        ALTER TABLE public.coastal_station_cospas_sarsat
            ADD COLUMN IF NOT EXISTS level2_approval_content VARCHAR(2000);

        -- Suy ngược vết gửi duyệt nếu hồ sơ đã gửi nhưng chưa có submitted_at/submitted_by
        UPDATE public.coastal_station_cospas_sarsat
        SET submitted_at = created_at,
            submitted_by = created_by
        WHERE submitted_at IS NULL
          AND approval_status IN (2, 3, 5, 8, 9);

        -- 6. Tạo các index hiệu năng và hỗ trợ bộ lọc chuẩn
        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_org_unit_id
            ON public.coastal_station_cospas_sarsat (org_unit_id);

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_condition_status
            ON public.coastal_station_cospas_sarsat (condition_status);

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_approval_status
            ON public.coastal_station_cospas_sarsat (approval_status);

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_province_id
            ON public.coastal_station_cospas_sarsat (province_id);

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_symbol_id
            ON public.coastal_station_cospas_sarsat (symbol_id);

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_operating_org_id
            ON public.coastal_station_cospas_sarsat (operating_org_id);

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_active_created_at
            ON public.coastal_station_cospas_sarsat (created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_active_updated_at
            ON public.coastal_station_cospas_sarsat (updated_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_active_org_created_at
            ON public.coastal_station_cospas_sarsat (org_unit_id, created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_active_org_approval_created_at
            ON public.coastal_station_cospas_sarsat (org_unit_id, approval_status, created_at DESC)
            WHERE deleted_at IS NULL;

        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_active_options_name
            ON public.coastal_station_cospas_sarsat (LOWER(name), org_unit_id)
            WHERE deleted_at IS NULL
              AND condition_status = 0
              AND approval_status IN (4, 5);

        -- Composite pattern index cho code
        CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_code_pattern
            ON public.coastal_station_cospas_sarsat (code text_pattern_ops);

        -- Unaccent trgm indexes nếu hàm immutable_unaccent tồn tại
        IF EXISTS (
            SELECT 1 FROM pg_proc WHERE proname = 'immutable_unaccent'
        ) THEN
            CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_name_unaccent_trgm
                ON public.coastal_station_cospas_sarsat USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_cospas_sarsat_code_unaccent_trgm
                ON public.coastal_station_cospas_sarsat USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops);
        END IF;

    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping standardize migration on coastal_station_cospas_sarsat: %', SQLERRM;
END $$;
