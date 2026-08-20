-- Ensure org_units columns exist (idempotent repair).
-- Lý do: entity OrgUnit map các cột này (address, detail_address, phone, contact_person,
-- status, operational_status, path, level, sort_order, approved_at, ...) nhưng một số DB
-- được restore/khởi tạo trước khi khối ALTER org_units của
-- V20260803370000__repair_all_schema_types_and_columns.sql được áp dụng -> app fail khởi động
-- tại OrgUnitDataFixer với "column ou1_0.address does not exist".
-- Pattern copy nguyên văn từ khối org_units của migration đó; ADD COLUMN IF NOT EXISTS = no-op nếu cột đã tồn tại.
-- KHÔNG đụng kiểu cột id (UUID conversion) — tránh rủi ro trên DB đang chạy.

ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN name TYPE VARCHAR(200) USING name::text;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS parent_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'parent_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN parent_id TYPE UUID USING CASE WHEN parent_id IS NULL OR parent_id::text = '' THEN NULL ELSE parent_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS type SMALLINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN type TYPE SMALLINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN description TYPE VARCHAR(1000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS province VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'province' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN province TYPE VARCHAR(100) USING province::text;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS address VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN address TYPE VARCHAR(500) USING address::text;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS detail_address VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'detail_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN detail_address TYPE VARCHAR(500) USING detail_address::text;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN phone TYPE VARCHAR(20) USING phone::text;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'contact_person' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN contact_person TYPE VARCHAR(200) USING contact_person::text;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS status SMALLINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN status TYPE SMALLINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS operational_status SMALLINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'operational_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN operational_status TYPE SMALLINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN path TYPE VARCHAR(500) USING path::text;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS level INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN level TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS sort_order INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'sort_order' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN sort_order TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.org_units ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
