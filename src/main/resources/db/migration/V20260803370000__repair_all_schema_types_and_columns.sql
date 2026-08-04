-- V20260803370000: Comprehensive Schema Repair - Ensure all tables, columns, and data types match Java entities

-- Table: access_logs
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.access_logs ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN user_id DROP NOT NULL;
        ALTER TABLE public.access_logs ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL WHEN user_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN user_id::text::uuid ELSE NULL END;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS username VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'username' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN username TYPE VARCHAR(50) USING username::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS action VARCHAR(30);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'action' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN action TYPE VARCHAR(30) USING action::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS module VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'module' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN module TYPE VARCHAR(50) USING module::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'ip_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN ip_address TYPE VARCHAR(45) USING ip_address::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'user_agent' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN user_agent TYPE VARCHAR(500) USING user_agent::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS email VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'email' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN email TYPE VARCHAR(100) USING email::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS org_unit VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'org_unit' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN org_unit TYPE VARCHAR(100) USING org_unit::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'session_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN session_id TYPE VARCHAR(50) USING session_id::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS detail TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'detail' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN detail TYPE TEXT USING detail::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'access';
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN type TYPE VARCHAR(20) USING type::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info';
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'severity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN severity TYPE VARCHAR(20) USING severity::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS target_resource VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'target_resource' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN target_resource TYPE VARCHAR(100) USING target_resource::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS request_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'request_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN request_path TYPE VARCHAR(500) USING request_path::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS response_code INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'response_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN response_code TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'duration_ms' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN duration_ms TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS metadata TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'metadata' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN metadata TYPE TEXT USING metadata::text;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.access_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'access_logs' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.access_logs ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: account_registration_audit
CREATE TABLE IF NOT EXISTS public.account_registration_audit (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_registration_audit' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.account_registration_audit ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.account_registration_audit ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.account_registration_audit ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_registration_audit' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.account_registration_audit ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.account_registration_audit ADD COLUMN IF NOT EXISTS identifier VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_registration_audit' AND column_name = 'identifier' AND udt_name = 'uuid') THEN
        ALTER TABLE public.account_registration_audit ALTER COLUMN identifier TYPE VARCHAR(100) USING identifier::text;
    END IF;
END $$;
ALTER TABLE public.account_registration_audit ADD COLUMN IF NOT EXISTS event_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_registration_audit' AND column_name = 'event_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.account_registration_audit ALTER COLUMN event_type TYPE VARCHAR(50) USING event_type::text;
    END IF;
END $$;
ALTER TABLE public.account_registration_audit ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_registration_audit' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.account_registration_audit ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.account_registration_audit ADD COLUMN IF NOT EXISTS processing_time_ms BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_registration_audit' AND column_name = 'processing_time_ms' AND udt_name = 'uuid') THEN
        ALTER TABLE public.account_registration_audit ALTER COLUMN processing_time_ms TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.account_registration_audit ADD COLUMN IF NOT EXISTS error_message VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_registration_audit' AND column_name = 'error_message' AND udt_name = 'uuid') THEN
        ALTER TABLE public.account_registration_audit ALTER COLUMN error_message TYPE VARCHAR(500) USING error_message::text;
    END IF;
END $$;
ALTER TABLE public.account_registration_audit ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_registration_audit' AND column_name = 'ip_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.account_registration_audit ALTER COLUMN ip_address TYPE VARCHAR(45) USING ip_address::text;
    END IF;
END $$;
ALTER TABLE public.account_registration_audit ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'account_registration_audit' AND column_name = 'user_agent' AND udt_name = 'uuid') THEN
        ALTER TABLE public.account_registration_audit ALTER COLUMN user_agent TYPE VARCHAR(500) USING user_agent::text;
    END IF;
END $$;

-- Table: adjustment_approvals
CREATE TABLE IF NOT EXISTS public.adjustment_approvals (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.adjustment_approvals ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.adjustment_approvals ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.adjustment_approvals ADD COLUMN IF NOT EXISTS planning_adjustment_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'planning_adjustment_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN planning_adjustment_id TYPE UUID USING CASE WHEN planning_adjustment_id IS NULL OR planning_adjustment_id::text = '' THEN NULL ELSE planning_adjustment_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.adjustment_approvals ADD COLUMN IF NOT EXISTS approval_level VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approval_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN approval_level TYPE VARCHAR(100) USING approval_level::text;
    END IF;
END $$;
ALTER TABLE public.adjustment_approvals ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.adjustment_approvals ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approved_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN approved_by TYPE VARCHAR(100) USING approved_by::text;
    END IF;
END $$;
ALTER TABLE public.adjustment_approvals ADD COLUMN IF NOT EXISTS approved_at DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN approved_at TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.adjustment_approvals ADD COLUMN IF NOT EXISTS notes VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'notes' AND udt_name = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN notes TYPE VARCHAR(500) USING notes::text;
    END IF;
END $$;

-- Table: admin_audit_logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.admin_audit_logs ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.admin_audit_logs ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS admin_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'admin_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.admin_audit_logs ALTER COLUMN admin_id TYPE UUID USING CASE WHEN admin_id IS NULL OR admin_id::text = '' THEN NULL ELSE admin_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS admin_name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'admin_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.admin_audit_logs ALTER COLUMN admin_name TYPE VARCHAR(100) USING admin_name::text;
    END IF;
END $$;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'action' AND udt_name = 'uuid') THEN
        ALTER TABLE public.admin_audit_logs ALTER COLUMN action TYPE VARCHAR(50) USING action::text;
    END IF;
END $$;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS target VARCHAR(150);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'target' AND udt_name = 'uuid') THEN
        ALTER TABLE public.admin_audit_logs ALTER COLUMN target TYPE VARCHAR(150) USING target::text;
    END IF;
END $$;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'details' AND udt_name = 'uuid') THEN
        ALTER TABLE public.admin_audit_logs ALTER COLUMN details TYPE TEXT USING details::text;
    END IF;
END $$;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS ip_addr VARCHAR(45);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'ip_addr' AND udt_name = 'uuid') THEN
        ALTER TABLE public.admin_audit_logs ALTER COLUMN ip_addr TYPE VARCHAR(45) USING ip_addr::text;
    END IF;
END $$;
ALTER TABLE public.admin_audit_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_audit_logs' AND column_name = 'user_agent' AND udt_name = 'uuid') THEN
        ALTER TABLE public.admin_audit_logs ALTER COLUMN user_agent TYPE VARCHAR(500) USING user_agent::text;
    END IF;
END $$;

-- Table: approval_history
CREATE TABLE IF NOT EXISTS public.approval_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.approval_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS navigation_channel_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'navigation_channel_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN navigation_channel_id TYPE UUID USING CASE WHEN navigation_channel_id IS NULL OR navigation_channel_id::text = '' THEN NULL ELSE navigation_channel_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS approval_level INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'approval_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN approval_level TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS status VARCHAR(30);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN status TYPE VARCHAR(30) USING status::text;
    END IF;
END $$;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'approved_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN approved_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN reason TYPE VARCHAR(500) USING reason::text;
    END IF;
END $$;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS radar_station_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'radar_station_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN radar_station_id TYPE UUID USING CASE WHEN radar_station_id IS NULL OR radar_station_id::text = '' THEN NULL ELSE radar_station_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS ship_repair_facility_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'ship_repair_facility_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN ship_repair_facility_id TYPE UUID USING CASE WHEN ship_repair_facility_id IS NULL OR ship_repair_facility_id::text = '' THEN NULL ELSE ship_repair_facility_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS vts_system_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'vts_system_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_history ALTER COLUMN vts_system_id TYPE UUID USING CASE WHEN vts_system_id IS NULL OR vts_system_id::text = '' THEN NULL ELSE vts_system_id::text::uuid END;
    END IF;
END $$;

-- Table: approval_logs
CREATE TABLE IF NOT EXISTS public.approval_logs (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_logs ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.approval_logs ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_logs' AND column_name = 'entity_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_logs ALTER COLUMN entity_type TYPE VARCHAR(50) USING entity_type::text;
    END IF;
END $$;
ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(36);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_logs' AND column_name = 'entity_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_logs ALTER COLUMN entity_id TYPE VARCHAR(36) USING entity_id::text;
    END IF;
END $$;
ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS decision VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_logs' AND column_name = 'decision' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_logs ALTER COLUMN decision TYPE VARCHAR(50) USING decision::text;
    END IF;
END $$;
ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS reason TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_logs' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_logs ALTER COLUMN reason TYPE TEXT USING reason::text;
    END IF;
END $$;
ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS decided_by VARCHAR(36);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_logs' AND column_name = 'decided_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_logs ALTER COLUMN decided_by TYPE VARCHAR(36) USING decided_by::text;
    END IF;
END $$;
ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_logs' AND column_name = 'decided_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_logs ALTER COLUMN decided_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS cap VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_logs' AND column_name = 'cap' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_logs ALTER COLUMN cap TYPE VARCHAR(20) USING cap::text;
    END IF;
END $$;
ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_logs' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_logs ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: approval_notifications
CREATE TABLE IF NOT EXISTS public.approval_notifications (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_notifications' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_notifications ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.approval_notifications ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.approval_notifications ADD COLUMN IF NOT EXISTS pending_approval_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_notifications' AND column_name = 'pending_approval_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_notifications ALTER COLUMN pending_approval_id TYPE UUID USING CASE WHEN pending_approval_id IS NULL OR pending_approval_id::text = '' THEN NULL ELSE pending_approval_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.approval_notifications ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_notifications' AND column_name = 'recipient_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_notifications ALTER COLUMN recipient_type TYPE VARCHAR(20) USING recipient_type::text;
    END IF;
END $$;
ALTER TABLE public.approval_notifications ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_notifications' AND column_name = 'recipient_email' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_notifications ALTER COLUMN recipient_email TYPE VARCHAR(255) USING recipient_email::text;
    END IF;
END $$;
ALTER TABLE public.approval_notifications ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_notifications' AND column_name = 'recipient_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_notifications ALTER COLUMN recipient_name TYPE VARCHAR(200) USING recipient_name::text;
    END IF;
END $$;
ALTER TABLE public.approval_notifications ADD COLUMN IF NOT EXISTS notification_type VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_notifications' AND column_name = 'notification_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_notifications ALTER COLUMN notification_type TYPE VARCHAR(20) USING notification_type::text;
    END IF;
END $$;
ALTER TABLE public.approval_notifications ADD COLUMN IF NOT EXISTS message VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_notifications' AND column_name = 'message' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_notifications ALTER COLUMN message TYPE VARCHAR(500) USING message::text;
    END IF;
END $$;
ALTER TABLE public.approval_notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_notifications' AND column_name = 'sent_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_notifications ALTER COLUMN sent_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.approval_notifications ADD COLUMN IF NOT EXISTS sent BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_notifications' AND column_name = 'sent' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_notifications ALTER COLUMN sent TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: approval_records
CREATE TABLE IF NOT EXISTS public.approval_records (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_records' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_records ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.approval_records ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.approval_records ADD COLUMN IF NOT EXISTS request_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_records' AND column_name = 'request_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_records ALTER COLUMN request_id TYPE UUID USING CASE WHEN request_id IS NULL OR request_id::text = '' THEN NULL ELSE request_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.approval_records ADD COLUMN IF NOT EXISTS approval_level INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_records' AND column_name = 'approval_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_records ALTER COLUMN approval_level TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.approval_records ADD COLUMN IF NOT EXISTS approver_name UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_records' AND column_name = 'approver_name' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.approval_records ALTER COLUMN approver_name TYPE UUID USING CASE WHEN approver_name IS NULL OR approver_name::text = '' THEN NULL ELSE approver_name::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.approval_records ADD COLUMN IF NOT EXISTS result VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_records' AND column_name = 'result' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_records ALTER COLUMN result TYPE VARCHAR(50) USING result::text;
    END IF;
END $$;
ALTER TABLE public.approval_records ADD COLUMN IF NOT EXISTS reason VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_records' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_records ALTER COLUMN reason TYPE VARCHAR(2000) USING reason::text;
    END IF;
END $$;
ALTER TABLE public.approval_records ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_records' AND column_name = 'approval_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_records ALTER COLUMN approval_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.approval_records ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_records' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_records ALTER COLUMN description TYPE VARCHAR(1000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.approval_records ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_records' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.approval_records ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: asset_decrease_requests
CREATE TABLE IF NOT EXISTS public.asset_decrease_requests (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS asset_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'asset_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN asset_id TYPE UUID USING CASE WHEN asset_id IS NULL OR asset_id::text = '' THEN NULL ELSE asset_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS decrease_reason VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'decrease_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN decrease_reason TYPE VARCHAR(50) USING decrease_reason::text;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS decrease_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'decrease_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN decrease_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS inspection_report VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'inspection_report' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN inspection_report TYPE VARCHAR(1000) USING inspection_report::text;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS accumulated_depreciation NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'accumulated_depreciation' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN accumulated_depreciation TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS remaining_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'remaining_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN remaining_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN description TYPE VARCHAR(1000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS approved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'approved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN approved_remarks TYPE VARCHAR(1000) USING approved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS unapproved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'unapproved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN unapproved_by TYPE UUID USING CASE WHEN unapproved_by IS NULL OR unapproved_by::text = '' THEN NULL ELSE unapproved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS unapproved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'unapproved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN unapproved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS unapproved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'unapproved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN unapproved_remarks TYPE VARCHAR(1000) USING unapproved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.asset_decrease_requests ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_decrease_requests' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_decrease_requests ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: asset_exploitations
CREATE TABLE IF NOT EXISTS public.asset_exploitations (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.asset_exploitations ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS asset_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'asset_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN asset_id TYPE UUID USING CASE WHEN asset_id IS NULL OR asset_id::text = '' THEN NULL ELSE asset_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS operating_time INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'operating_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN operating_time TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS exploitation_level NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'exploitation_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN exploitation_level TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS operating_cost NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'operating_cost' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN operating_cost TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS maintenance_cost NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'maintenance_cost' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN maintenance_cost TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS technical_status VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'technical_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN technical_status TYPE VARCHAR(500) USING technical_status::text;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS exploitation_month INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'exploitation_month' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN exploitation_month TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS exploitation_year INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'exploitation_year' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN exploitation_year TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN description TYPE VARCHAR(1000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.asset_exploitations ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_exploitations' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_exploitations ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: asset_increase_requests
CREATE TABLE IF NOT EXISTS public.asset_increase_requests (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.asset_increase_requests ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS asset_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'asset_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN asset_id TYPE UUID USING CASE WHEN asset_id IS NULL OR asset_id::text = '' THEN NULL ELSE asset_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS asset_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'asset_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN asset_type TYPE VARCHAR(50) USING asset_type::text;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS location VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN location TYPE VARCHAR(200) USING location::text;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS technical_specs VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'technical_specs' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN technical_specs TYPE VARCHAR(1000) USING technical_specs::text;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS funding_source VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'funding_source' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN funding_source TYPE VARCHAR(200) USING funding_source::text;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS original_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'original_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN original_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN description TYPE VARCHAR(1000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS approved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'approved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN approved_remarks TYPE VARCHAR(1000) USING approved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS unapproved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'unapproved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN unapproved_by TYPE UUID USING CASE WHEN unapproved_by IS NULL OR unapproved_by::text = '' THEN NULL ELSE unapproved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS unapproved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'unapproved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN unapproved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS unapproved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'unapproved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN unapproved_remarks TYPE VARCHAR(1000) USING unapproved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.asset_increase_requests ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_increase_requests' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_increase_requests ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: asset_processing_records
CREATE TABLE IF NOT EXISTS public.asset_processing_records (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.asset_processing_records ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS asset_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'asset_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN asset_id TYPE UUID USING CASE WHEN asset_id IS NULL OR asset_id::text = '' THEN NULL ELSE asset_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS processing_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'processing_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN processing_type TYPE VARCHAR(50) USING processing_type::text;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS recipient VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'recipient' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN recipient TYPE VARCHAR(200) USING recipient::text;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS processing_reason VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'processing_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN processing_reason TYPE VARCHAR(1000) USING processing_reason::text;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS liquidation_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'liquidation_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN liquidation_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN description TYPE VARCHAR(1000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS approved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'approved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN approved_remarks TYPE VARCHAR(1000) USING approved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS unapproved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'unapproved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN unapproved_by TYPE UUID USING CASE WHEN unapproved_by IS NULL OR unapproved_by::text = '' THEN NULL ELSE unapproved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS unapproved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'unapproved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN unapproved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS unapproved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'unapproved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN unapproved_remarks TYPE VARCHAR(1000) USING unapproved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.asset_processing_records ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'asset_processing_records' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.asset_processing_records ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: attached_documents
CREATE TABLE IF NOT EXISTS public.attached_documents (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attached_documents' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.attached_documents ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.attached_documents ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.attached_documents ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.attached_documents ADD COLUMN IF NOT EXISTS document_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attached_documents' AND column_name = 'document_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.attached_documents ALTER COLUMN document_id TYPE UUID USING CASE WHEN document_id IS NULL OR document_id::text = '' THEN NULL ELSE document_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.attached_documents ADD COLUMN IF NOT EXISTS document_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attached_documents' AND column_name = 'document_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.attached_documents ALTER COLUMN document_name TYPE VARCHAR(200) USING document_name::text;
    END IF;
END $$;
ALTER TABLE public.attached_documents ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attached_documents' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.attached_documents ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.attached_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attached_documents' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.attached_documents ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.attached_documents ADD COLUMN IF NOT EXISTS uploaded_at DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attached_documents' AND column_name = 'uploaded_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.attached_documents ALTER COLUMN uploaded_at TYPE DATE USING NULL;
    END IF;
END $$;

-- Table: audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.audit_log ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.audit_log ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'user_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.audit_log ALTER COLUMN user_id TYPE VARCHAR(36) USING user_id::text;
    END IF;
END $$;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS action VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'action' AND udt_name = 'uuid') THEN
        ALTER TABLE public.audit_log ALTER COLUMN action TYPE VARCHAR(100) USING action::text;
    END IF;
END $$;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS detail VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'detail' AND udt_name = 'uuid') THEN
        ALTER TABLE public.audit_log ALTER COLUMN detail TYPE VARCHAR(500) USING detail::text;
    END IF;
END $$;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS metadata TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'metadata' AND udt_name = 'uuid') THEN
        ALTER TABLE public.audit_log ALTER COLUMN metadata TYPE TEXT USING metadata::text;
    END IF;
END $$;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'ip_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.audit_log ALTER COLUMN ip_address TYPE VARCHAR(45) USING ip_address::text;
    END IF;
END $$;

-- Table: base_report
CREATE TABLE IF NOT EXISTS public.base_report (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.base_report ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN name TYPE VARCHAR(200) USING name::text;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS report_type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'report_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN report_type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN status TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'generated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN generated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS generated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'generated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN generated_by TYPE UUID USING CASE WHEN generated_by IS NULL OR generated_by::text = '' THEN NULL ELSE generated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS output_format INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'output_format' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN output_format TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS file_url VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'file_url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN file_url TYPE VARCHAR(1000) USING file_url::text;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS start_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'start_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN start_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS end_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'end_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN end_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.base_report ADD COLUMN IF NOT EXISTS parameters json;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'base_report' AND column_name = 'parameters' AND udt_name = 'uuid') THEN
        ALTER TABLE public.base_report ALTER COLUMN parameters TYPE json USING NULL;
    END IF;
END $$;

-- Table: bcc157_report
CREATE TABLE IF NOT EXISTS public.bcc157_report (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.bcc157_report ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS report_year INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'report_year' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN report_year TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS nguon_du_lieu VARCHAR(10);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'nguon_du_lieu' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN nguon_du_lieu TYPE VARCHAR(10) USING nguon_du_lieu::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS status VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN status TYPE VARCHAR(20) USING status::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_nguyen_gia_so_du_dau_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_nguyen_gia_so_du_dau_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_nguyen_gia_so_du_dau_nam TYPE VARCHAR(20) USING ma_so_nguyen_gia_so_du_dau_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_nguyen_gia_so_du_dau_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_nguyen_gia_so_du_dau_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_nguyen_gia_so_du_dau_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_nguyen_gia_tang_trong_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_nguyen_gia_tang_trong_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_nguyen_gia_tang_trong_nam TYPE VARCHAR(20) USING ma_so_nguyen_gia_tang_trong_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_nguyen_gia_tang_trong_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_nguyen_gia_tang_trong_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_nguyen_gia_tang_trong_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_nguyen_gia_giam_trong_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_nguyen_gia_giam_trong_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_nguyen_gia_giam_trong_nam TYPE VARCHAR(20) USING ma_so_nguyen_gia_giam_trong_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_nguyen_gia_giam_trong_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_nguyen_gia_giam_trong_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_nguyen_gia_giam_trong_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_nguyen_gia_so_du_cuoi_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_nguyen_gia_so_du_cuoi_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_nguyen_gia_so_du_cuoi_nam TYPE VARCHAR(20) USING ma_so_nguyen_gia_so_du_cuoi_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_nguyen_gia_so_du_cuoi_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_nguyen_gia_so_du_cuoi_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_nguyen_gia_so_du_cuoi_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_gia_tri_hao_mon_so_du_dau_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_gia_tri_hao_mon_so_du_dau_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_gia_tri_hao_mon_so_du_dau_nam TYPE VARCHAR(20) USING ma_so_gia_tri_hao_mon_so_du_dau_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_gia_tri_hao_mon_so_du_dau_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_gia_tri_hao_mon_so_du_dau_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_gia_tri_hao_mon_so_du_dau_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_gia_tri_hao_mon_tang_trong_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_gia_tri_hao_mon_tang_trong_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_gia_tri_hao_mon_tang_trong_nam TYPE VARCHAR(20) USING ma_so_gia_tri_hao_mon_tang_trong_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_gia_tri_hao_mon_tang_trong_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_gia_tri_hao_mon_tang_trong_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_gia_tri_hao_mon_tang_trong_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_gia_tri_hao_mon_giam_trong_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_gia_tri_hao_mon_giam_trong_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_gia_tri_hao_mon_giam_trong_nam TYPE VARCHAR(20) USING ma_so_gia_tri_hao_mon_giam_trong_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_gia_tri_hao_mon_giam_trong_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_gia_tri_hao_mon_giam_trong_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_gia_tri_hao_mon_giam_trong_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_gia_tri_hao_mon_so_du_cuoi_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_gia_tri_hao_mon_so_du_cuoi_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_gia_tri_hao_mon_so_du_cuoi_nam TYPE VARCHAR(20) USING ma_so_gia_tri_hao_mon_so_du_cuoi_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_gia_tri_hao_mon_so_du_cuoi_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_gia_tri_hao_mon_so_du_cuoi_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_gia_tri_hao_mon_so_du_cuoi_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_gia_tri_con_lai_tu_ngay_dau_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_gia_tri_con_lai_tu_ngay_dau_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_gia_tri_con_lai_tu_ngay_dau_nam TYPE VARCHAR(20) USING ma_so_gia_tri_con_lai_tu_ngay_dau_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_gia_tri_con_lai_tu_ngay_dau_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_gia_tri_con_lai_tu_ngay_dau_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_gia_tri_con_lai_tu_ngay_dau_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS ma_so_gia_tri_con_lai_tu_ngay_cuoi_nam VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'ma_so_gia_tri_con_lai_tu_ngay_cuoi_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN ma_so_gia_tri_con_lai_tu_ngay_cuoi_nam TYPE VARCHAR(20) USING ma_so_gia_tri_con_lai_tu_ngay_cuoi_nam::text;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS tai_san_gia_tri_con_lai_tu_ngay_cuoi_nam NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'tai_san_gia_tri_con_lai_tu_ngay_cuoi_nam' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN tai_san_gia_tri_con_lai_tu_ngay_cuoi_nam TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.bcc157_report ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bcc157_report' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.bcc157_report ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: beacon_history
CREATE TABLE IF NOT EXISTS public.beacon_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.beacon_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS beacon_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'beacon_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN beacon_type TYPE VARCHAR(50) USING beacon_type::text;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS entity_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'entity_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN entity_id TYPE UUID USING CASE WHEN entity_id IS NULL OR entity_id::text = '' THEN NULL ELSE entity_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'action_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN action_type TYPE VARCHAR(50) USING action_type::text;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS changed_field VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'changed_field' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN changed_field TYPE VARCHAR(255) USING changed_field::text;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS previous_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'previous_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN previous_value TYPE TEXT USING previous_value::text;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS new_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'new_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN new_value TYPE TEXT USING new_value::text;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS changed_by BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'changed_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN changed_by TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'changed_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN changed_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN reason TYPE VARCHAR(500) USING reason::text;
    END IF;
END $$;
ALTER TABLE public.beacon_history ADD COLUMN IF NOT EXISTS diff_data JSON;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'diff_data' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_history ALTER COLUMN diff_data TYPE JSON USING NULL;
    END IF;
END $$;

-- Table: beacon_light
CREATE TABLE IF NOT EXISTS public.beacon_light (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.beacon_light ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN name TYPE VARCHAR(255) USING name::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN type TYPE VARCHAR(500) USING type::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS light_range DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'light_range' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN light_range TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS tower_color VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'tower_color' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN tower_color TYPE VARCHAR(500) USING tower_color::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS primary_light_model VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'primary_light_model' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN primary_light_model TYPE VARCHAR(100) USING primary_light_model::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS area DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN area TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS location VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN location TYPE VARCHAR(500) USING location::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN unit_id TYPE UUID USING CASE WHEN unit_id IS NULL OR unit_id::text = '' THEN NULL ELSE unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS last_repair_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'last_repair_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN last_repair_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS commissioned_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'commissioned_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN commissioned_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'is_active' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN is_active TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS status VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN status TYPE VARCHAR(500) USING status::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS approval_status VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN approval_status TYPE VARCHAR(500) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS approval_level INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'approval_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN approval_level TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'approved_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN approved_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'rejection_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN rejection_reason TYPE VARCHAR(500) USING rejection_reason::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS shape VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'shape' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN shape TYPE VARCHAR(255) USING shape::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS structure VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'structure' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN structure TYPE VARCHAR(2000) USING structure::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS tower_height DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'tower_height' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN tower_height TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS light_height DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'light_height' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN light_height TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS geographic_range VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'geographic_range' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN geographic_range TYPE VARCHAR(20) USING geographic_range::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS backup_light_model VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'backup_light_model' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN backup_light_model TYPE VARCHAR(100) USING backup_light_model::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS power_supply VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'power_supply' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN power_supply TYPE VARCHAR(500) USING power_supply::text;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS staff_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'staff_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN staff_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS station_area DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_light' AND column_name = 'station_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.beacon_light ALTER COLUMN station_area TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;

-- Table: berths
CREATE TABLE IF NOT EXISTS public.berths (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.berths ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS berth_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'berth_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN berth_code TYPE VARCHAR(50) USING berth_code::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS berth_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'berth_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN berth_name TYPE VARCHAR(255) USING berth_name::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS port_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'port_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN port_id TYPE UUID USING CASE WHEN port_id IS NULL OR port_id::text = '' THEN NULL ELSE port_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS waterway VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'waterway' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN waterway TYPE VARCHAR(255) USING waterway::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS length NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'length' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN length TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS width NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'width' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN width TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS berth_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'berth_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN berth_type TYPE VARCHAR(50) USING berth_type::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS channel_depth NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'channel_depth' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN channel_depth TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'operational_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN operational_status TYPE VARCHAR(50) USING operational_status::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS operational_function VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'operational_function' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN operational_function TYPE VARCHAR(255) USING operational_function::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS map_symbol_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'map_symbol_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN map_symbol_id TYPE UUID USING CASE WHEN map_symbol_id IS NULL OR map_symbol_id::text = '' THEN NULL ELSE map_symbol_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS detailed_location VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'detailed_location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN detailed_location TYPE VARCHAR(500) USING detailed_location::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS coordinate_system INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'coordinate_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN coordinate_system TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS display_rule INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'display_rule' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN display_rule TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS operator VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'operator' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN operator TYPE VARCHAR(255) USING operator::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS total_area NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'total_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN total_area TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS design_throughput NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'design_throughput' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN design_throughput TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS current_throughput NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'current_throughput' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN current_throughput TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS max_vessel_size NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'max_vessel_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN max_vessel_size TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS planned_throughput NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'planned_throughput' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN planned_throughput TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS latest_cargo_volume NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'latest_cargo_volume' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN latest_cargo_volume TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS opening_announcement_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'opening_announcement_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN opening_announcement_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS opening_decision VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'opening_decision' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN opening_decision TYPE VARCHAR(500) USING opening_decision::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS investment_agreement VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'investment_agreement' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN investment_agreement TYPE VARCHAR(2000) USING investment_agreement::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS structure_type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'structure_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN structure_type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS activity_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'activity_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN activity_status TYPE VARCHAR(50) USING activity_status::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'submitted_for_approval_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN submitted_for_approval_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS submitted_for_approval_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'submitted_for_approval_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN submitted_for_approval_by TYPE VARCHAR(100) USING submitted_for_approval_by::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS port_authority_approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'port_authority_approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN port_authority_approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS port_authority_approved_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'port_authority_approved_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN port_authority_approved_by TYPE VARCHAR(100) USING port_authority_approved_by::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS department_approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'department_approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN department_approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS department_approved_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'department_approved_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN department_approved_by TYPE VARCHAR(100) USING department_approved_by::text;
    END IF;
END $$;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'berths' AND column_name = 'rejection_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.berths ALTER COLUMN rejection_reason TYPE VARCHAR(500) USING rejection_reason::text;
    END IF;
END $$;

-- Table: buoy
CREATE TABLE IF NOT EXISTS public.buoy (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.buoy ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN name TYPE VARCHAR(200) USING name::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN type TYPE VARCHAR(500) USING type::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS color VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'color' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN color TYPE VARCHAR(500) USING color::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS shape VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'shape' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN shape TYPE VARCHAR(500) USING shape::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS light_characteristic VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'light_characteristic' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN light_characteristic TYPE VARCHAR(100) USING light_characteristic::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS range DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'range' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN range TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS description VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN description TYPE VARCHAR(500) USING description::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN unit_id TYPE UUID USING CASE WHEN unit_id IS NULL OR unit_id::text = '' THEN NULL ELSE unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS last_inspection_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'last_inspection_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN last_inspection_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS next_inspection_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'next_inspection_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN next_inspection_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'is_active' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN is_active TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS status VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN status TYPE VARCHAR(500) USING status::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS approval_status VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN approval_status TYPE VARCHAR(500) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS approval_level INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'approval_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN approval_level TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'approved_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN approved_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'rejection_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN rejection_reason TYPE VARCHAR(500) USING rejection_reason::text;
    END IF;
END $$;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;

-- Table: buoy_station
CREATE TABLE IF NOT EXISTS public.buoy_station (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.buoy_station ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN type TYPE VARCHAR(500) USING type::text;
    END IF;
END $$;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS color VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'color' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN color TYPE VARCHAR(500) USING color::text;
    END IF;
END $$;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS shape VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'shape' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN shape TYPE VARCHAR(500) USING shape::text;
    END IF;
END $$;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS light_characteristic VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'light_characteristic' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN light_characteristic TYPE VARCHAR(500) USING light_characteristic::text;
    END IF;
END $$;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS range DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'range' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN range TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS last_inspection_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'last_inspection_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN last_inspection_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS next_inspection_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'next_inspection_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN next_inspection_date TYPE DATE USING NULL;
    END IF;
END $$;

-- Table: business_data_integration_record
CREATE TABLE IF NOT EXISTS public.business_data_integration_record (
    id VARCHAR(500) PRIMARY KEY
);

ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS id VARCHAR(500);
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS integration_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'integration_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN integration_type TYPE VARCHAR(50) USING integration_type::text;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS source_system VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'source_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN source_system TYPE VARCHAR(100) USING source_system::text;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS integration_period VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'integration_period' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN integration_period TYPE VARCHAR(50) USING integration_period::text;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS data_payload TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'data_payload' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN data_payload TYPE TEXT USING data_payload::text;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS error_message TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'error_message' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN error_message TYPE TEXT USING error_message::text;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS integration_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'integration_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN integration_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS retry_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'retry_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN retry_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.business_data_integration_record ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'business_data_integration_record' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.business_data_integration_record ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: cargo_transactions
CREATE TABLE IF NOT EXISTS public.cargo_transactions (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cargo_transactions' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.cargo_transactions ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.cargo_transactions ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.cargo_transactions ADD COLUMN IF NOT EXISTS port_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cargo_transactions' AND column_name = 'port_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.cargo_transactions ALTER COLUMN port_code TYPE VARCHAR(50) USING port_code::text;
    END IF;
END $$;
ALTER TABLE public.cargo_transactions ADD COLUMN IF NOT EXISTS cargo_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cargo_transactions' AND column_name = 'cargo_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.cargo_transactions ALTER COLUMN cargo_type TYPE VARCHAR(100) USING cargo_type::text;
    END IF;
END $$;
ALTER TABLE public.cargo_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cargo_transactions' AND column_name = 'transaction_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.cargo_transactions ALTER COLUMN transaction_type TYPE VARCHAR(50) USING transaction_type::text;
    END IF;
END $$;
ALTER TABLE public.cargo_transactions ADD COLUMN IF NOT EXISTS soluong BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cargo_transactions' AND column_name = 'soluong' AND udt_name = 'uuid') THEN
        ALTER TABLE public.cargo_transactions ALTER COLUMN soluong TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.cargo_transactions ADD COLUMN IF NOT EXISTS transaction_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cargo_transactions' AND column_name = 'transaction_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.cargo_transactions ALTER COLUMN transaction_date TYPE DATE USING NULL;
    END IF;
END $$;

-- Table: change_logs
CREATE TABLE IF NOT EXISTS public.change_logs (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'change_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.change_logs ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.change_logs ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'change_logs' AND column_name = 'entity_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.change_logs ALTER COLUMN entity_type TYPE VARCHAR(50) USING entity_type::text;
    END IF;
END $$;
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(36);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'change_logs' AND column_name = 'entity_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.change_logs ALTER COLUMN entity_id TYPE VARCHAR(36) USING entity_id::text;
    END IF;
END $$;
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS field_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'change_logs' AND column_name = 'field_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.change_logs ALTER COLUMN field_name TYPE VARCHAR(255) USING field_name::text;
    END IF;
END $$;
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS old_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'change_logs' AND column_name = 'old_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.change_logs ALTER COLUMN old_value TYPE TEXT USING old_value::text;
    END IF;
END $$;
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS new_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'change_logs' AND column_name = 'new_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.change_logs ALTER COLUMN new_value TYPE TEXT USING new_value::text;
    END IF;
END $$;
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS changed_by VARCHAR(36);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'change_logs' AND column_name = 'changed_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.change_logs ALTER COLUMN changed_by TYPE VARCHAR(36) USING changed_by::text;
    END IF;
END $$;
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'change_logs' AND column_name = 'changed_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.change_logs ALTER COLUMN changed_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'change_logs' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.change_logs ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: chi_tiet_tuyen_luong
CREATE TABLE IF NOT EXISTS public.chi_tiet_tuyen_luong (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS navigation_channel_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'navigation_channel_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN navigation_channel_id TYPE UUID USING CASE WHEN navigation_channel_id IS NULL OR navigation_channel_id::text = '' THEN NULL ELSE navigation_channel_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS sequenceno INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'sequenceno' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN sequenceno TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS phan_loai VARCHAR(5);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'phan_loai' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN phan_loai TYPE VARCHAR(5) USING phan_loai::text;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS ma VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'ma' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN ma TYPE VARCHAR(50) USING ma::text;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS ten VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'ten' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN ten TYPE VARCHAR(500) USING ten::text;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS loai_tuyen_luong INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'loai_tuyen_luong' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN loai_tuyen_luong TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS do_sau_hien_tai VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'do_sau_hien_tai' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN do_sau_hien_tai TYPE VARCHAR(20) USING do_sau_hien_tai::text;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS mai_doc_thiet_ke VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'mai_doc_thiet_ke' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN mai_doc_thiet_ke TYPE VARCHAR(20) USING mai_doc_thiet_ke::text;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS chieu_dai NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'chieu_dai' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN chieu_dai TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS rong_lon_nhat NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'rong_lon_nhat' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN rong_lon_nhat TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS rong_nho_nhat NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'rong_nho_nhat' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN rong_nho_nhat TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS do_sau NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'do_sau' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN do_sau TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS khoi_luong_nao_vet NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'khoi_luong_nao_vet' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN khoi_luong_nao_vet TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS cong_cong BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'cong_cong' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN cong_cong TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS chuyen_dung BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'chuyen_dung' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN chuyen_dung TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS chieu_cao_tinh_khong VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'chieu_cao_tinh_khong' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN chieu_cao_tinh_khong TYPE VARCHAR(20) USING chieu_cao_tinh_khong::text;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS vi_tri_vung_quay_tau VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'vi_tri_vung_quay_tau' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN vi_tri_vung_quay_tau TYPE VARCHAR(500) USING vi_tri_vung_quay_tau::text;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS ban_kinh_vung_quay_tau NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'ban_kinh_vung_quay_tau' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN ban_kinh_vung_quay_tau TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS ban_kinh_cong_nho_nhat NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'ban_kinh_cong_nho_nhat' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN ban_kinh_cong_nho_nhat TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS pham_vi_bao_ve_luong VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'pham_vi_bao_ve_luong' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN pham_vi_bao_ve_luong TYPE VARCHAR(500) USING pham_vi_bao_ve_luong::text;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chi_tiet_tuyen_luong' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.chi_tiet_tuyen_luong ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: coastal_station_cospas_sarsat
CREATE TABLE IF NOT EXISTS public.coastal_station_cospas_sarsat (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS frequency VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'frequency' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN frequency TYPE VARCHAR(500) USING frequency::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'coverage_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN coverage_area TYPE VARCHAR(500) USING coverage_area::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS beacon_protocol VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'beacon_protocol' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN beacon_protocol TYPE VARCHAR(500) USING beacon_protocol::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS emergency_channel VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'emergency_channel' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN emergency_channel TYPE VARCHAR(500) USING emergency_channel::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS antenna_type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'antenna_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN antenna_type TYPE VARCHAR(500) USING antenna_type::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'location_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN location_address TYPE VARCHAR(1000) USING location_address::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS contact_person VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'contact_person' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN contact_person TYPE VARCHAR(500) USING contact_person::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'contact_phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN contact_phone TYPE VARCHAR(500) USING contact_phone::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS signal_range DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'signal_range' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN signal_range TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_cospas_sarsat ADD COLUMN IF NOT EXISTS operating_mode VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'operating_mode' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN operating_mode TYPE VARCHAR(500) USING operating_mode::text;
    END IF;
END $$;

-- Table: coastal_station_haiphong
CREATE TABLE IF NOT EXISTS public.coastal_station_haiphong (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS port_name VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'port_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN port_name TYPE VARCHAR(500) USING port_name::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS district VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'district' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN district TYPE VARCHAR(500) USING district::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS ward VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'ward' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN ward TYPE VARCHAR(500) USING ward::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS operational_license VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'operational_license' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN operational_license TYPE VARCHAR(500) USING operational_license::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS license_expiry VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'license_expiry' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN license_expiry TYPE VARCHAR(500) USING license_expiry::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'inspector_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN inspector_name TYPE VARCHAR(500) USING inspector_name::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS inspector_phone VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'inspector_phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN inspector_phone TYPE VARCHAR(500) USING inspector_phone::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS last_inspection_date VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'last_inspection_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN last_inspection_date TYPE VARCHAR(500) USING last_inspection_date::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS next_inspection_date VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'next_inspection_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN next_inspection_date TYPE VARCHAR(500) USING next_inspection_date::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'coverage_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN coverage_area TYPE VARCHAR(500) USING coverage_area::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'equipment_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN equipment_type TYPE VARCHAR(500) USING equipment_type::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS communication_frequency VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'communication_frequency' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN communication_frequency TYPE VARCHAR(500) USING communication_frequency::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'location_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN location_address TYPE VARCHAR(1000) USING location_address::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS contact_person VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'contact_person' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN contact_person TYPE VARCHAR(500) USING contact_person::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'contact_phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN contact_phone TYPE VARCHAR(500) USING contact_phone::text;
    END IF;
END $$;

-- Table: coastal_station_inmarsat
CREATE TABLE IF NOT EXISTS public.coastal_station_inmarsat (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS device_code VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'device_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN device_code TYPE VARCHAR(500) USING device_code::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS modem_type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'modem_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN modem_type TYPE VARCHAR(500) USING modem_type::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS frequency VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'frequency' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN frequency TYPE VARCHAR(500) USING frequency::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS coverage_zone VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'coverage_zone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN coverage_zone TYPE VARCHAR(500) USING coverage_zone::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS sar_code VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'sar_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN sar_code TYPE VARCHAR(500) USING sar_code::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'location_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN location_address TYPE VARCHAR(1000) USING location_address::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS contact_person VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'contact_person' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN contact_person TYPE VARCHAR(500) USING contact_person::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'contact_phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN contact_phone TYPE VARCHAR(500) USING contact_phone::text;
    END IF;
END $$;

-- Table: coastal_station_lrit
CREATE TABLE IF NOT EXISTS public.coastal_station_lrit (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS terminal_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'terminal_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN terminal_id TYPE VARCHAR(500) USING terminal_id::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS imo_number VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'imo_number' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN imo_number TYPE VARCHAR(500) USING imo_number::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS reporting_interval INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'reporting_interval' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN reporting_interval TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS antenna_height DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'antenna_height' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN antenna_height TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS power_output DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'power_output' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN power_output TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS antenna_type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'antenna_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN antenna_type TYPE VARCHAR(500) USING antenna_type::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'location_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN location_address TYPE VARCHAR(1000) USING location_address::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS contact_person VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'contact_person' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN contact_person TYPE VARCHAR(500) USING contact_person::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'contact_phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN contact_phone TYPE VARCHAR(500) USING contact_phone::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS data_format VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'data_format' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN data_format TYPE VARCHAR(500) USING data_format::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS communication_channel VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'communication_channel' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN communication_channel TYPE VARCHAR(500) USING communication_channel::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'coverage_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN coverage_area TYPE VARCHAR(500) USING coverage_area::text;
    END IF;
END $$;

-- Table: coastal_station_vts
CREATE TABLE IF NOT EXISTS public.coastal_station_vts (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.coastal_station_vts ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.coastal_station_vts ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_vts ADD COLUMN IF NOT EXISTS frequency_band VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'frequency_band' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN frequency_band TYPE VARCHAR(500) USING frequency_band::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_vts ADD COLUMN IF NOT EXISTS transmit_power DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'transmit_power' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN transmit_power TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.coastal_station_vts ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'equipment_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN equipment_type TYPE VARCHAR(500) USING equipment_type::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_vts ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'location_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN location_address TYPE VARCHAR(1000) USING location_address::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_vts ADD COLUMN IF NOT EXISTS contact_person VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'contact_person' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN contact_person TYPE VARCHAR(500) USING contact_person::text;
    END IF;
END $$;
ALTER TABLE public.coastal_station_vts ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'contact_phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN contact_phone TYPE VARCHAR(500) USING contact_phone::text;
    END IF;
END $$;

-- Table: connection_health
CREATE TABLE IF NOT EXISTS public.connection_health (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connection_health' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.connection_health ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.connection_health ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.connection_health ADD COLUMN IF NOT EXISTS connection_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connection_health' AND column_name = 'connection_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.connection_health ALTER COLUMN connection_id TYPE UUID USING CASE WHEN connection_id IS NULL OR connection_id::text = '' THEN NULL ELSE connection_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.connection_health ADD COLUMN IF NOT EXISTS status_code INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connection_health' AND column_name = 'status_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.connection_health ALTER COLUMN status_code TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.connection_health ADD COLUMN IF NOT EXISTS latency_ms BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connection_health' AND column_name = 'latency_ms' AND udt_name = 'uuid') THEN
        ALTER TABLE public.connection_health ALTER COLUMN latency_ms TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.connection_health ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connection_health' AND column_name = 'checked_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.connection_health ALTER COLUMN checked_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.connection_health ADD COLUMN IF NOT EXISTS error_message VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connection_health' AND column_name = 'error_message' AND udt_name = 'uuid') THEN
        ALTER TABLE public.connection_health ALTER COLUMN error_message TYPE VARCHAR(500) USING error_message::text;
    END IF;
END $$;

-- Table: current_planning
CREATE TABLE IF NOT EXISTS public.current_planning (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'current_planning' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.current_planning ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.current_planning ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.current_planning ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.current_planning ADD COLUMN IF NOT EXISTS ten_do_an VARCHAR(300);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'current_planning' AND column_name = 'ten_do_an' AND udt_name = 'uuid') THEN
        ALTER TABLE public.current_planning ALTER COLUMN ten_do_an TYPE VARCHAR(300) USING ten_do_an::text;
    END IF;
END $$;
ALTER TABLE public.current_planning ADD COLUMN IF NOT EXISTS ngay_phe_duyet DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'current_planning' AND column_name = 'ngay_phe_duyet' AND udt_name = 'uuid') THEN
        ALTER TABLE public.current_planning ALTER COLUMN ngay_phe_duyet TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.current_planning ADD COLUMN IF NOT EXISTS pham_vi_ap_dung TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'current_planning' AND column_name = 'pham_vi_ap_dung' AND udt_name = 'uuid') THEN
        ALTER TABLE public.current_planning ALTER COLUMN pham_vi_ap_dung TYPE TEXT USING pham_vi_ap_dung::text;
    END IF;
END $$;
ALTER TABLE public.current_planning ADD COLUMN IF NOT EXISTS ten_file_ban_do VARCHAR(300);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'current_planning' AND column_name = 'ten_file_ban_do' AND udt_name = 'uuid') THEN
        ALTER TABLE public.current_planning ALTER COLUMN ten_file_ban_do TYPE VARCHAR(300) USING ten_file_ban_do::text;
    END IF;
END $$;
ALTER TABLE public.current_planning ADD COLUMN IF NOT EXISTS mo_ta_tom_tat TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'current_planning' AND column_name = 'mo_ta_tom_tat' AND udt_name = 'uuid') THEN
        ALTER TABLE public.current_planning ALTER COLUMN mo_ta_tom_tat TYPE TEXT USING mo_ta_tom_tat::text;
    END IF;
END $$;

-- Table: dashboard_snapshot
CREATE TABLE IF NOT EXISTS public.dashboard_snapshot (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.dashboard_snapshot ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.dashboard_snapshot ADD COLUMN IF NOT EXISTS snapshot_year INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot' AND column_name = 'snapshot_year' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot ALTER COLUMN snapshot_year TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot ADD COLUMN IF NOT EXISTS total_count BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot' AND column_name = 'total_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot ALTER COLUMN total_count TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot ADD COLUMN IF NOT EXISTS operating_count BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot' AND column_name = 'operating_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot ALTER COLUMN operating_count TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: dashboard_snapshot_detail
CREATE TABLE IF NOT EXISTS public.dashboard_snapshot_detail (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot_detail' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot_detail ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.dashboard_snapshot_detail ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot_detail ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.dashboard_snapshot_detail ADD COLUMN IF NOT EXISTS snapshot_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot_detail' AND column_name = 'snapshot_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot_detail ALTER COLUMN snapshot_id TYPE UUID USING CASE WHEN snapshot_id IS NULL OR snapshot_id::text = '' THEN NULL ELSE snapshot_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot_detail ADD COLUMN IF NOT EXISTS kcht_type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot_detail' AND column_name = 'kcht_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot_detail ALTER COLUMN kcht_type TYPE VARCHAR(500) USING kcht_type::text;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot_detail ADD COLUMN IF NOT EXISTS total_count BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot_detail' AND column_name = 'total_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot_detail ALTER COLUMN total_count TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot_detail ADD COLUMN IF NOT EXISTS operating_count BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot_detail' AND column_name = 'operating_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot_detail ALTER COLUMN operating_count TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot_detail ADD COLUMN IF NOT EXISTS pending_count BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot_detail' AND column_name = 'pending_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot_detail ALTER COLUMN pending_count TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot_detail ADD COLUMN IF NOT EXISTS suspended_count BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot_detail' AND column_name = 'suspended_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot_detail ALTER COLUMN suspended_count TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.dashboard_snapshot_detail ADD COLUMN IF NOT EXISTS sequence_no INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dashboard_snapshot_detail' AND column_name = 'sequence_no' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dashboard_snapshot_detail ALTER COLUMN sequence_no TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: data_connections
CREATE TABLE IF NOT EXISTS public.data_connections (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.data_connections ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS name VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN name TYPE VARCHAR(500) USING name::text;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS target_system VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'target_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN target_system TYPE VARCHAR(500) USING target_system::text;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'connection_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN connection_type TYPE VARCHAR(50) USING connection_type::text;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS endpoint_url VARCHAR(1024);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'endpoint_url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN endpoint_url TYPE VARCHAR(1024) USING endpoint_url::text;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS auth_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'auth_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN auth_type TYPE VARCHAR(50) USING auth_type::text;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS credentials TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'credentials' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN credentials TYPE TEXT USING credentials::text;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS sync_frequency VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'sync_frequency' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN sync_frequency TYPE VARCHAR(50) USING sync_frequency::text;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.data_connections ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_connections' AND column_name = 'last_sync_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_connections ALTER COLUMN last_sync_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: data_sharing_aggregation_record
CREATE TABLE IF NOT EXISTS public.data_sharing_aggregation_record (
    id VARCHAR(500) PRIMARY KEY
);

ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS id VARCHAR(500);
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS sharing_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'sharing_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN sharing_type TYPE VARCHAR(50) USING sharing_type::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS target_system VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'target_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN target_system TYPE VARCHAR(100) USING target_system::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS share_period VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'share_period' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN share_period TYPE VARCHAR(50) USING share_period::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS data_payload TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'data_payload' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN data_payload TYPE TEXT USING data_payload::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS error_message TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'error_message' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN error_message TYPE TEXT USING error_message::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS share_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'share_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN share_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS retry_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'retry_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN retry_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.data_sharing_aggregation_record ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_aggregation_record' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_aggregation_record ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: data_sharing_logs
CREATE TABLE IF NOT EXISTS public.data_sharing_logs (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.data_sharing_logs ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.data_sharing_logs ADD COLUMN IF NOT EXISTS transaction_code VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'transaction_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN transaction_code TYPE VARCHAR(100) USING transaction_code::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_logs ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'account_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN account_name TYPE VARCHAR(255) USING account_name::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_logs ADD COLUMN IF NOT EXISTS connection_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'connection_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN connection_name TYPE VARCHAR(255) USING connection_name::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_logs ADD COLUMN IF NOT EXISTS sender_system VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'sender_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN sender_system TYPE VARCHAR(255) USING sender_system::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_logs ADD COLUMN IF NOT EXISTS receiver_system VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'receiver_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN receiver_system TYPE VARCHAR(255) USING receiver_system::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.data_sharing_logs ADD COLUMN IF NOT EXISTS detail_content TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'data_sharing_logs' AND column_name = 'detail_content' AND udt_name = 'uuid') THEN
        ALTER TABLE public.data_sharing_logs ALTER COLUMN detail_content TYPE TEXT USING detail_content::text;
    END IF;
END $$;

-- Table: database_backups
CREATE TABLE IF NOT EXISTS public.database_backups (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'database_backups' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.database_backups ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.database_backups ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS filename VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'database_backups' AND column_name = 'filename' AND udt_name = 'uuid') THEN
        ALTER TABLE public.database_backups ALTER COLUMN filename TYPE VARCHAR(500) USING filename::text;
    END IF;
END $$;
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'database_backups' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.database_backups ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'database_backups' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.database_backups ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS backup_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'database_backups' AND column_name = 'backup_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.database_backups ALTER COLUMN backup_type TYPE VARCHAR(50) USING backup_type::text;
    END IF;
END $$;
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'database_backups' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.database_backups ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.database_backups ADD COLUMN IF NOT EXISTS error_detail VARCHAR(4000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'database_backups' AND column_name = 'error_detail' AND udt_name = 'uuid') THEN
        ALTER TABLE public.database_backups ALTER COLUMN error_detail TYPE VARCHAR(4000) USING error_detail::text;
    END IF;
END $$;

-- Table: dike_revetment
CREATE TABLE IF NOT EXISTS public.dike_revetment (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.dike_revetment ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS dike_revetment_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'dike_revetment_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN dike_revetment_type TYPE VARCHAR(50) USING dike_revetment_type::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS location VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN location TYPE VARCHAR(200) USING location::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS dike_revetment_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'dike_revetment_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN dike_revetment_name TYPE VARCHAR(255) USING dike_revetment_name::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS length DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'length' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN length TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS crest_elevation DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'crest_elevation' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN crest_elevation TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS commissioning_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'commissioning_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN commissioning_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS height DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'height' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN height TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS surface_material VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'surface_material' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN surface_material TYPE VARCHAR(100) USING surface_material::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS status VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN status TYPE VARCHAR(100) USING status::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS note VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'note' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN note TYPE VARCHAR(500) USING note::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS is_approved_level1 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'is_approved_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN is_approved_level1 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS approver_level1 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approver_level1' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL ELSE approver_level1::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS approved_date_level1 DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approved_date_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approved_date_level1 TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS is_approved_level2 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'is_approved_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN is_approved_level2 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS approver_level2 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approver_level2' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL ELSE approver_level2::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS approved_date_level2 DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approved_date_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approved_date_level2 TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'rejection_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN rejection_reason TYPE VARCHAR(500) USING rejection_reason::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'is_deleted' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN is_deleted TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'deleted_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN deleted_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS deleted_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'deleted_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN deleted_by TYPE UUID USING CASE WHEN deleted_by IS NULL OR deleted_by::text = '' THEN NULL ELSE deleted_by::text::uuid END;
    END IF;
END $$;

-- Table: dike_revetment_approval_history
CREATE TABLE IF NOT EXISTS public.dike_revetment_approval_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment_approval_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.dike_revetment_approval_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_approval_history ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.dike_revetment_approval_history ADD COLUMN IF NOT EXISTS dike_revetment_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history' AND column_name = 'dike_revetment_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment_approval_history ALTER COLUMN dike_revetment_id TYPE UUID USING CASE WHEN dike_revetment_id IS NULL OR dike_revetment_id::text = '' THEN NULL ELSE dike_revetment_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_approval_history ADD COLUMN IF NOT EXISTS approval_level INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history' AND column_name = 'approval_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_approval_history ALTER COLUMN approval_level TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_approval_history ADD COLUMN IF NOT EXISTS status VARCHAR(30);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_approval_history ALTER COLUMN status TYPE VARCHAR(30) USING status::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_approval_history ADD COLUMN IF NOT EXISTS approver VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history' AND column_name = 'approver' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_approval_history ALTER COLUMN approver TYPE VARCHAR(100) USING approver::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_approval_history ADD COLUMN IF NOT EXISTS approval_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history' AND column_name = 'approval_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_approval_history ALTER COLUMN approval_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_approval_history ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_approval_history ALTER COLUMN reason TYPE VARCHAR(500) USING reason::text;
    END IF;
END $$;

-- Table: dike_revetment_attachment
CREATE TABLE IF NOT EXISTS public.dike_revetment_attachment (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_attachment ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.dike_revetment_attachment ADD COLUMN IF NOT EXISTS dike_revetment_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'dike_revetment_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN dike_revetment_id TYPE UUID USING CASE WHEN dike_revetment_id IS NULL OR dike_revetment_id::text = '' THEN NULL ELSE dike_revetment_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_attachment ADD COLUMN IF NOT EXISTS file_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN file_name TYPE VARCHAR(200) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_attachment ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_attachment ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_attachment ADD COLUMN IF NOT EXISTS loai_tai_lieu VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'loai_tai_lieu' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN loai_tai_lieu TYPE VARCHAR(100) USING loai_tai_lieu::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_attachment ADD COLUMN IF NOT EXISTS nguoi_tai_len VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'nguoi_tai_len' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN nguoi_tai_len TYPE VARCHAR(100) USING nguoi_tai_len::text;
    END IF;
END $$;
ALTER TABLE public.dike_revetment_attachment ADD COLUMN IF NOT EXISTS upload_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'upload_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN upload_date TYPE DATE USING NULL;
    END IF;
END $$;

-- Table: documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.documents ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'entity_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN entity_type TYPE VARCHAR(50) USING entity_type::text;
    END IF;
END $$;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS entity_id VARCHAR(36);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'entity_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN entity_id TYPE VARCHAR(36) USING entity_id::text;
    END IF;
END $$;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN file_name TYPE VARCHAR(255) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'mime_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN mime_type TYPE VARCHAR(100) USING mime_type::text;
    END IF;
END $$;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS storage_key VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'storage_key' AND udt_name = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN storage_key TYPE VARCHAR(500) USING storage_key::text;
    END IF;
END $$;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(36);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by TYPE VARCHAR(36) USING uploaded_by::text;
    END IF;
END $$;

-- Table: dry_ports
CREATE TABLE IF NOT EXISTS public.dry_ports (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.dry_ports ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS dry_port_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'dry_port_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN dry_port_code TYPE VARCHAR(50) USING dry_port_code::text;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS dry_port_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'dry_port_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN dry_port_name TYPE VARCHAR(255) USING dry_port_name::text;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS area NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN area TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS teu_capacity NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'teu_capacity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN teu_capacity TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'operational_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN operational_status TYPE VARCHAR(50) USING operational_status::text;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS map_symbol_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'map_symbol_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN map_symbol_id TYPE UUID USING CASE WHEN map_symbol_id IS NULL OR map_symbol_id::text = '' THEN NULL ELSE map_symbol_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dry_ports' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.dry_ports ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;

-- Table: enc_cells
CREATE TABLE IF NOT EXISTS public.enc_cells (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_cells' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.enc_cells ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.enc_cells ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.enc_cells ADD COLUMN IF NOT EXISTS cell_name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_cells' AND column_name = 'cell_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_cells ALTER COLUMN cell_name TYPE VARCHAR(100) USING cell_name::text;
    END IF;
END $$;
ALTER TABLE public.enc_cells ADD COLUMN IF NOT EXISTS producer VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_cells' AND column_name = 'producer' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_cells ALTER COLUMN producer TYPE VARCHAR(100) USING producer::text;
    END IF;
END $$;
ALTER TABLE public.enc_cells ADD COLUMN IF NOT EXISTS edition INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_cells' AND column_name = 'edition' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_cells ALTER COLUMN edition TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.enc_cells ADD COLUMN IF NOT EXISTS scale INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_cells' AND column_name = 'scale' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_cells ALTER COLUMN scale TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.enc_cells ADD COLUMN IF NOT EXISTS update_number INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_cells' AND column_name = 'update_number' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_cells ALTER COLUMN update_number TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.enc_cells ADD COLUMN IF NOT EXISTS release_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_cells' AND column_name = 'release_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_cells ALTER COLUMN release_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.enc_cells ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_cells' AND column_name = 'is_encrypted' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_cells ALTER COLUMN is_encrypted TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.enc_cells ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_cells' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_cells ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;

-- Table: enc_features
CREATE TABLE IF NOT EXISTS public.enc_features (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_features' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.enc_features ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.enc_features ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.enc_features ADD COLUMN IF NOT EXISTS cell_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_features' AND column_name = 'cell_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.enc_features ALTER COLUMN cell_id TYPE UUID USING CASE WHEN cell_id IS NULL OR cell_id::text = '' THEN NULL ELSE cell_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.enc_features ADD COLUMN IF NOT EXISTS feature_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_features' AND column_name = 'feature_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_features ALTER COLUMN feature_name TYPE VARCHAR(200) USING feature_name::text;
    END IF;
END $$;
ALTER TABLE public.enc_features ADD COLUMN IF NOT EXISTS feature_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_features' AND column_name = 'feature_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_features ALTER COLUMN feature_code TYPE VARCHAR(50) USING feature_code::text;
    END IF;
END $$;
ALTER TABLE public.enc_features ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_features' AND column_name = 'geometry_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_features ALTER COLUMN geometry_type TYPE VARCHAR(50) USING geometry_type::text;
    END IF;
END $$;
ALTER TABLE public.enc_features ADD COLUMN IF NOT EXISTS coordinates TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_features' AND column_name = 'coordinates' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_features ALTER COLUMN coordinates TYPE TEXT USING coordinates::text;
    END IF;
END $$;
ALTER TABLE public.enc_features ADD COLUMN IF NOT EXISTS attributes_json TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enc_features' AND column_name = 'attributes_json' AND udt_name = 'uuid') THEN
        ALTER TABLE public.enc_features ALTER COLUMN attributes_json TYPE TEXT USING attributes_json::text;
    END IF;
END $$;

-- Table: form_approval_history
CREATE TABLE IF NOT EXISTS public.form_approval_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'form_approval_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.form_approval_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.form_approval_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.form_approval_history ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.form_approval_history ADD COLUMN IF NOT EXISTS form_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'form_approval_history' AND column_name = 'form_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.form_approval_history ALTER COLUMN form_id TYPE UUID USING CASE WHEN form_id IS NULL OR form_id::text = '' THEN NULL ELSE form_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.form_approval_history ADD COLUMN IF NOT EXISTS action VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'form_approval_history' AND column_name = 'action' AND udt_name = 'uuid') THEN
        ALTER TABLE public.form_approval_history ALTER COLUMN action TYPE VARCHAR(500) USING action::text;
    END IF;
END $$;
ALTER TABLE public.form_approval_history ADD COLUMN IF NOT EXISTS actor UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'form_approval_history' AND column_name = 'actor' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.form_approval_history ALTER COLUMN actor TYPE UUID USING CASE WHEN actor IS NULL OR actor::text = '' THEN NULL ELSE actor::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.form_approval_history ADD COLUMN IF NOT EXISTS comments VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'form_approval_history' AND column_name = 'comments' AND udt_name = 'uuid') THEN
        ALTER TABLE public.form_approval_history ALTER COLUMN comments TYPE VARCHAR(1000) USING comments::text;
    END IF;
END $$;
ALTER TABLE public.form_approval_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'form_approval_history' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.form_approval_history ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: gis_spatial_objects
CREATE TABLE IF NOT EXISTS public.gis_spatial_objects (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN name TYPE VARCHAR(200) USING name::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS geometry_type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'geometry_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN geometry_type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS object_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'object_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN object_type TYPE VARCHAR(50) USING object_type::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS category_id BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'category_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN category_id TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS line_symbol_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'line_symbol_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN line_symbol_id TYPE UUID USING CASE WHEN line_symbol_id IS NULL OR line_symbol_id::text = '' THEN NULL ELSE line_symbol_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS coordinates TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'coordinates' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN coordinates TYPE TEXT USING coordinates::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN description TYPE VARCHAR(1000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN unit_id TYPE UUID USING CASE WHEN unit_id IS NULL OR unit_id::text = '' THEN NULL ELSE unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS ref_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'ref_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN ref_id TYPE UUID USING CASE WHEN ref_id IS NULL OR ref_id::text = '' THEN NULL ELSE ref_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS ref_type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'ref_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN ref_type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS purpose VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'purpose' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN purpose TYPE VARCHAR(500) USING purpose::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS restriction_level VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'restriction_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN restriction_level TYPE VARCHAR(50) USING restriction_level::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS length DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'length' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN length TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS material VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'material' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN material TYPE VARCHAR(100) USING material::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS year_built INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'year_built' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN year_built TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'approved_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN approved_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS icon_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'icon_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN icon_id TYPE UUID USING CASE WHEN icon_id IS NULL OR icon_id::text = '' THEN NULL ELSE icon_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS cong_nang_khai_thac VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'cong_nang_khai_thac' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN cong_nang_khai_thac TYPE VARCHAR(255) USING cong_nang_khai_thac::text;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS fill_symbol_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'fill_symbol_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN fill_symbol_id TYPE UUID USING CASE WHEN fill_symbol_id IS NULL OR fill_symbol_id::text = '' THEN NULL ELSE fill_symbol_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS area DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gis_spatial_objects' AND column_name = 'area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.gis_spatial_objects ALTER COLUMN area TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;

-- Table: group_histories
CREATE TABLE IF NOT EXISTS public.group_histories (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_histories' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.group_histories ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.group_histories ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.group_histories ADD COLUMN IF NOT EXISTS user_group_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_histories' AND column_name = 'user_group_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.group_histories ALTER COLUMN user_group_id TYPE UUID USING CASE WHEN user_group_id IS NULL OR user_group_id::text = '' THEN NULL ELSE user_group_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.group_histories ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_histories' AND column_name = 'group_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.group_histories ALTER COLUMN group_name TYPE VARCHAR(100) USING group_name::text;
    END IF;
END $$;
ALTER TABLE public.group_histories ADD COLUMN IF NOT EXISTS group_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_histories' AND column_name = 'group_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.group_histories ALTER COLUMN group_code TYPE VARCHAR(50) USING group_code::text;
    END IF;
END $$;
ALTER TABLE public.group_histories ADD COLUMN IF NOT EXISTS action VARCHAR(30);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_histories' AND column_name = 'action' AND udt_name = 'uuid') THEN
        ALTER TABLE public.group_histories ALTER COLUMN action TYPE VARCHAR(30) USING action::text;
    END IF;
END $$;
ALTER TABLE public.group_histories ADD COLUMN IF NOT EXISTS notes TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_histories' AND column_name = 'notes' AND udt_name = 'uuid') THEN
        ALTER TABLE public.group_histories ALTER COLUMN notes TYPE TEXT USING notes::text;
    END IF;
END $$;
ALTER TABLE public.group_histories ADD COLUMN IF NOT EXISTS performed_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_histories' AND column_name = 'performed_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.group_histories ALTER COLUMN performed_by TYPE UUID USING CASE WHEN performed_by IS NULL OR performed_by::text = '' THEN NULL ELSE performed_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.group_histories ADD COLUMN IF NOT EXISTS performed_by_name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_histories' AND column_name = 'performed_by_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.group_histories ALTER COLUMN performed_by_name TYPE VARCHAR(100) USING performed_by_name::text;
    END IF;
END $$;
ALTER TABLE public.group_histories ADD COLUMN IF NOT EXISTS performed_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_histories' AND column_name = 'performed_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.group_histories ALTER COLUMN performed_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: group_members
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.group_members ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.group_members ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.group_members ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS user_group_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'user_group_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.group_members ALTER COLUMN user_group_id TYPE UUID USING CASE WHEN user_group_id IS NULL OR user_group_id::text = '' THEN NULL ELSE user_group_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.group_members ALTER COLUMN status TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'joined_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.group_members ALTER COLUMN joined_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS added_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'added_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.group_members ALTER COLUMN added_by TYPE UUID USING CASE WHEN added_by IS NULL OR added_by::text = '' THEN NULL ELSE added_by::text::uuid END;
    END IF;
END $$;

-- Table: incident_records
CREATE TABLE IF NOT EXISTS public.incident_records (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incident_records' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.incident_records ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.incident_records ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.incident_records ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.incident_records ADD COLUMN IF NOT EXISTS incident_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incident_records' AND column_name = 'incident_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.incident_records ALTER COLUMN incident_id TYPE UUID USING CASE WHEN incident_id IS NULL OR incident_id::text = '' THEN NULL ELSE incident_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.incident_records ADD COLUMN IF NOT EXISTS detailed_description TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incident_records' AND column_name = 'detailed_description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incident_records ALTER COLUMN detailed_description TYPE TEXT USING detailed_description::text;
    END IF;
END $$;
ALTER TABLE public.incident_records ADD COLUMN IF NOT EXISTS remedial_measures TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incident_records' AND column_name = 'remedial_measures' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incident_records ALTER COLUMN remedial_measures TYPE TEXT USING remedial_measures::text;
    END IF;
END $$;
ALTER TABLE public.incident_records ADD COLUMN IF NOT EXISTS processing_end_time TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incident_records' AND column_name = 'processing_end_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incident_records ALTER COLUMN processing_end_time TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.incident_records ADD COLUMN IF NOT EXISTS recorder VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incident_records' AND column_name = 'recorder' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incident_records ALTER COLUMN recorder TYPE VARCHAR(100) USING recorder::text;
    END IF;
END $$;
ALTER TABLE public.incident_records ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incident_records' AND column_name = 'recorded_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incident_records ALTER COLUMN recorded_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.incident_records ADD COLUMN IF NOT EXISTS attached_documents VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incident_records' AND column_name = 'attached_documents' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incident_records ALTER COLUMN attached_documents TYPE VARCHAR(500) USING attached_documents::text;
    END IF;
END $$;

-- Table: incidents
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.incidents ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS discovery_time TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'discovery_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN discovery_time TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS location VARCHAR(300);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN location TYPE VARCHAR(300) USING location::text;
    END IF;
END $$;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS severity_level VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'severity_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN severity_level TYPE VARCHAR(50) USING severity_level::text;
    END IF;
END $$;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS description TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN description TYPE TEXT USING description::text;
    END IF;
END $$;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'processing_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN processing_status TYPE VARCHAR(50) USING processing_status::text;
    END IF;
END $$;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'reporter' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN reporter TYPE VARCHAR(100) USING reporter::text;
    END IF;
END $$;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
END $$;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: infra_assets
CREATE TABLE IF NOT EXISTS public.infra_assets (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.infra_assets ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS asset_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'asset_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN asset_code TYPE VARCHAR(50) USING asset_code::text;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS asset_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'asset_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN asset_name TYPE VARCHAR(200) USING asset_name::text;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS asset_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'asset_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN asset_type TYPE VARCHAR(50) USING asset_type::text;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS location VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN location TYPE VARCHAR(200) USING location::text;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS technical_specs VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'technical_specs' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN technical_specs TYPE VARCHAR(1000) USING technical_specs::text;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS funding_source VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'funding_source' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN funding_source TYPE VARCHAR(200) USING funding_source::text;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS original_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'original_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN original_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS accumulated_depreciation NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'accumulated_depreciation' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN accumulated_depreciation TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS remaining_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'remaining_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN remaining_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS approved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'approved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN approved_remarks TYPE VARCHAR(1000) USING approved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS unapproved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'unapproved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN unapproved_by TYPE UUID USING CASE WHEN unapproved_by IS NULL OR unapproved_by::text = '' THEN NULL ELSE unapproved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS unapproved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'unapproved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN unapproved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS unapproved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'unapproved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN unapproved_remarks TYPE VARCHAR(1000) USING unapproved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.infra_assets ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'infra_assets' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.infra_assets ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: integration_connections
CREATE TABLE IF NOT EXISTS public.integration_connections (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_connections' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.integration_connections ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.integration_connections ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.integration_connections ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_connections' AND column_name = 'account_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_connections ALTER COLUMN account_name TYPE VARCHAR(255) USING account_name::text;
    END IF;
END $$;
ALTER TABLE public.integration_connections ADD COLUMN IF NOT EXISTS connection_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_connections' AND column_name = 'connection_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_connections ALTER COLUMN connection_name TYPE VARCHAR(255) USING connection_name::text;
    END IF;
END $$;
ALTER TABLE public.integration_connections ADD COLUMN IF NOT EXISTS sender_system VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_connections' AND column_name = 'sender_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_connections ALTER COLUMN sender_system TYPE VARCHAR(255) USING sender_system::text;
    END IF;
END $$;
ALTER TABLE public.integration_connections ADD COLUMN IF NOT EXISTS receiver_system VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_connections' AND column_name = 'receiver_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_connections ALTER COLUMN receiver_system TYPE VARCHAR(255) USING receiver_system::text;
    END IF;
END $$;
ALTER TABLE public.integration_connections ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_connections' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_connections ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.integration_connections ADD COLUMN IF NOT EXISTS password TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_connections' AND column_name = 'password' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_connections ALTER COLUMN password TYPE TEXT USING password::text;
    END IF;
END $$;

-- Table: integration_transactions
CREATE TABLE IF NOT EXISTS public.integration_transactions (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.integration_transactions ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS connection_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'connection_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN connection_id TYPE UUID USING CASE WHEN connection_id IS NULL OR connection_id::text = '' THEN NULL ELSE connection_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN name TYPE VARCHAR(255) USING name::text;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'reference_number' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN reference_number TYPE VARCHAR(100) USING reference_number::text;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'sent_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN sent_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS purpose VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'purpose' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN purpose TYPE VARCHAR(500) USING purpose::text;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS organization_unit VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'organization_unit' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN organization_unit TYPE VARCHAR(255) USING organization_unit::text;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS sender VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'sender' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN sender TYPE VARCHAR(255) USING sender::text;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS received_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'received_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN received_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS receiver_code VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'receiver_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN receiver_code TYPE VARCHAR(100) USING receiver_code::text;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS sent_content TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'sent_content' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN sent_content TYPE TEXT USING sent_content::text;
    END IF;
END $$;
ALTER TABLE public.integration_transactions ADD COLUMN IF NOT EXISTS received_content TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'integration_transactions' AND column_name = 'received_content' AND udt_name = 'uuid') THEN
        ALTER TABLE public.integration_transactions ALTER COLUMN received_content TYPE TEXT USING received_content::text;
    END IF;
END $$;

-- Table: inventory_assets
CREATE TABLE IF NOT EXISTS public.inventory_assets (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_assets' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_assets ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.inventory_assets ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.inventory_assets ADD COLUMN IF NOT EXISTS plan_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_assets' AND column_name = 'plan_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_assets ALTER COLUMN plan_id TYPE UUID USING CASE WHEN plan_id IS NULL OR plan_id::text = '' THEN NULL ELSE plan_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.inventory_assets ADD COLUMN IF NOT EXISTS asset_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_assets' AND column_name = 'asset_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_assets ALTER COLUMN asset_id TYPE UUID USING CASE WHEN asset_id IS NULL OR asset_id::text = '' THEN NULL ELSE asset_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.inventory_assets ADD COLUMN IF NOT EXISTS book_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_assets' AND column_name = 'book_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_assets ALTER COLUMN book_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_assets ADD COLUMN IF NOT EXISTS actual_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_assets' AND column_name = 'actual_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_assets ALTER COLUMN actual_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_assets ADD COLUMN IF NOT EXISTS difference NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_assets' AND column_name = 'difference' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_assets ALTER COLUMN difference TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_assets ADD COLUMN IF NOT EXISTS inventory_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_assets' AND column_name = 'inventory_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_assets ALTER COLUMN inventory_status TYPE VARCHAR(50) USING inventory_status::text;
    END IF;
END $$;
ALTER TABLE public.inventory_assets ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_assets' AND column_name = 'notes' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_assets ALTER COLUMN notes TYPE VARCHAR(1000) USING notes::text;
    END IF;
END $$;
ALTER TABLE public.inventory_assets ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_assets' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_assets ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: inventory_plans
CREATE TABLE IF NOT EXISTS public.inventory_plans (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.inventory_plans ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS plan_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'plan_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN plan_name TYPE VARCHAR(200) USING plan_name::text;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS inventory_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'inventory_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN inventory_type TYPE VARCHAR(50) USING inventory_type::text;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS scope VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'scope' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN scope TYPE VARCHAR(500) USING scope::text;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'start_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN start_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'end_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN end_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS inventory_leader VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'inventory_leader' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN inventory_leader TYPE VARCHAR(200) USING inventory_leader::text;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN description TYPE VARCHAR(1000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS approved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'approved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN approved_remarks TYPE VARCHAR(1000) USING approved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS unapproved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'unapproved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN unapproved_by TYPE UUID USING CASE WHEN unapproved_by IS NULL OR unapproved_by::text = '' THEN NULL ELSE unapproved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS unapproved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'unapproved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN unapproved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS unapproved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'unapproved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN unapproved_remarks TYPE VARCHAR(1000) USING unapproved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.inventory_plans ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_plans' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_plans ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: inventory_reports
CREATE TABLE IF NOT EXISTS public.inventory_reports (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.inventory_reports ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS plan_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'plan_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN plan_id TYPE UUID USING CASE WHEN plan_id IS NULL OR plan_id::text = '' THEN NULL ELSE plan_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS total_assets INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'total_assets' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN total_assets TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS surplus_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'surplus_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN surplus_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS missing_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'missing_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN missing_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS abnormal_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'abnormal_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN abnormal_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN description TYPE VARCHAR(1000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS approved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'approved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN approved_remarks TYPE VARCHAR(1000) USING approved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS unapproved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'unapproved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN unapproved_by TYPE UUID USING CASE WHEN unapproved_by IS NULL OR unapproved_by::text = '' THEN NULL ELSE unapproved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS unapproved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'unapproved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN unapproved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS unapproved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'unapproved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN unapproved_remarks TYPE VARCHAR(1000) USING unapproved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.inventory_reports ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_reports' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.inventory_reports ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: jwt_sessions
CREATE TABLE IF NOT EXISTS public.jwt_sessions (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.jwt_sessions ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'user_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN user_id TYPE VARCHAR(36) USING user_id::text;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS username VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'username' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN username TYPE VARCHAR(100) USING username::text;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS role_level INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'role_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN role_level TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(512);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'refresh_token_hash' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN refresh_token_hash TYPE VARCHAR(512) USING refresh_token_hash::text;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS refresh_token_salt VARCHAR(256);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'refresh_token_salt' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN refresh_token_salt TYPE VARCHAR(256) USING refresh_token_salt::text;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS session_id VARCHAR(128);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'session_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN session_id TYPE VARCHAR(128) USING session_id::text;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS user_agent VARCHAR(512);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'user_agent' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN user_agent TYPE VARCHAR(512) USING user_agent::text;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(256);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'device_fingerprint' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN device_fingerprint TYPE VARCHAR(256) USING device_fingerprint::text;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'ip_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN ip_address TYPE VARCHAR(45) USING ip_address::text;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'expires_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN expires_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'last_used_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN last_used_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'is_revoked' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN is_revoked TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'revoked_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN revoked_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.jwt_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jwt_sessions' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.jwt_sessions ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;

-- Table: kchtgt_cargo_aggregates
CREATE TABLE IF NOT EXISTS public.kchtgt_cargo_aggregates (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_cargo_aggregates' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.kchtgt_cargo_aggregates ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.kchtgt_cargo_aggregates ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.kchtgt_cargo_aggregates ADD COLUMN IF NOT EXISTS port_code VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_cargo_aggregates' AND column_name = 'port_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_cargo_aggregates ALTER COLUMN port_code TYPE VARCHAR(100) USING port_code::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_cargo_aggregates ADD COLUMN IF NOT EXISTS period_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_cargo_aggregates' AND column_name = 'period_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_cargo_aggregates ALTER COLUMN period_type TYPE VARCHAR(50) USING period_type::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_cargo_aggregates ADD COLUMN IF NOT EXISTS period_start DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_cargo_aggregates' AND column_name = 'period_start' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_cargo_aggregates ALTER COLUMN period_start TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_cargo_aggregates ADD COLUMN IF NOT EXISTS period_end DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_cargo_aggregates' AND column_name = 'period_end' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_cargo_aggregates ALTER COLUMN period_end TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_cargo_aggregates ADD COLUMN IF NOT EXISTS total_tons NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_cargo_aggregates' AND column_name = 'total_tons' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_cargo_aggregates ALTER COLUMN total_tons TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_cargo_aggregates ADD COLUMN IF NOT EXISTS total_teus NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_cargo_aggregates' AND column_name = 'total_teus' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_cargo_aggregates ALTER COLUMN total_teus TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_cargo_aggregates ADD COLUMN IF NOT EXISTS vessel_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_cargo_aggregates' AND column_name = 'vessel_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_cargo_aggregates ALTER COLUMN vessel_count TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: kchtgt_integration_dlq
CREATE TABLE IF NOT EXISTS public.kchtgt_integration_dlq (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_dlq' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_dlq ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.kchtgt_integration_dlq ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_dlq ADD COLUMN IF NOT EXISTS sync_job_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_dlq' AND column_name = 'sync_job_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_dlq ALTER COLUMN sync_job_id TYPE UUID USING CASE WHEN sync_job_id IS NULL OR sync_job_id::text = '' THEN NULL ELSE sync_job_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_dlq ADD COLUMN IF NOT EXISTS source_record TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_dlq' AND column_name = 'source_record' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_dlq ALTER COLUMN source_record TYPE TEXT USING source_record::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_dlq ADD COLUMN IF NOT EXISTS error_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_dlq' AND column_name = 'error_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_dlq ALTER COLUMN error_type TYPE VARCHAR(100) USING error_type::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_dlq ADD COLUMN IF NOT EXISTS error_detail TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_dlq' AND column_name = 'error_detail' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_dlq ALTER COLUMN error_detail TYPE TEXT USING error_detail::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_dlq ADD COLUMN IF NOT EXISTS resolved BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_dlq' AND column_name = 'resolved' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_dlq ALTER COLUMN resolved TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: kchtgt_integration_sync_job
CREATE TABLE IF NOT EXISTS public.kchtgt_integration_sync_job (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS feature_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'feature_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN feature_code TYPE VARCHAR(50) USING feature_code::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS source_url VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'source_url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN source_url TYPE VARCHAR(1000) USING source_url::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS records_total INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'records_total' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN records_total TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS records_success INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'records_success' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN records_success TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS records_failed INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'records_failed' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN records_failed TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS error_message VARCHAR(4000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'error_message' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN error_message TYPE VARCHAR(4000) USING error_message::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'started_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN started_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'completed_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN completed_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_integration_sync_job ADD COLUMN IF NOT EXISTS retry_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_integration_sync_job' AND column_name = 'retry_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_integration_sync_job ALTER COLUMN retry_count TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: kchtgt_port_status
CREATE TABLE IF NOT EXISTS public.kchtgt_port_status (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_port_status' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.kchtgt_port_status ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.kchtgt_port_status ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.kchtgt_port_status ADD COLUMN IF NOT EXISTS port_code VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_port_status' AND column_name = 'port_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_port_status ALTER COLUMN port_code TYPE VARCHAR(100) USING port_code::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_port_status ADD COLUMN IF NOT EXISTS port_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_port_status' AND column_name = 'port_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_port_status ALTER COLUMN port_name TYPE VARCHAR(200) USING port_name::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_port_status ADD COLUMN IF NOT EXISTS berth_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_port_status' AND column_name = 'berth_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_port_status ALTER COLUMN berth_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.kchtgt_port_status ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_port_status' AND column_name = 'operational_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_port_status ALTER COLUMN operational_status TYPE VARCHAR(50) USING operational_status::text;
    END IF;
END $$;
ALTER TABLE public.kchtgt_port_status ADD COLUMN IF NOT EXISTS current_capacity_tons DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'kchtgt_port_status' AND column_name = 'current_capacity_tons' AND udt_name = 'uuid') THEN
        ALTER TABLE public.kchtgt_port_status ALTER COLUMN current_capacity_tons TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;

-- Table: legal_document_history
CREATE TABLE IF NOT EXISTS public.legal_document_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.legal_document_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS legal_document_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'legal_document_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN legal_document_id TYPE UUID USING CASE WHEN legal_document_id IS NULL OR legal_document_id::text = '' THEN NULL ELSE legal_document_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS action VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'action' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN action TYPE VARCHAR(50) USING action::text;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS changed_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'changed_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN changed_by TYPE UUID USING CASE WHEN changed_by IS NULL OR changed_by::text = '' THEN NULL ELSE changed_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'changed_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN changed_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS document_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'document_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN document_name TYPE VARCHAR(200) USING document_name::text;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'document_number' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN document_number TYPE VARCHAR(50) USING document_number::text;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'issuing_authority' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN issuing_authority TYPE VARCHAR(200) USING issuing_authority::text;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS issue_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'issue_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN issue_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS effective_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'effective_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN effective_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS expiration_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'expiration_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN expiration_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS document_type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'document_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN document_type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS application_area VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'application_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN application_area TYPE VARCHAR(100) USING application_area::text;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS validity_status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'validity_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN validity_status TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS signer VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'signer' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN signer TYPE VARCHAR(100) USING signer::text;
    END IF;
END $$;
ALTER TABLE public.legal_document_history ADD COLUMN IF NOT EXISTS description VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_document_history' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_document_history ALTER COLUMN description TYPE VARCHAR(500) USING description::text;
    END IF;
END $$;

-- Table: legal_documents
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.legal_documents ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS document_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'document_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN document_name TYPE VARCHAR(200) USING document_name::text;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'document_number' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN document_number TYPE VARCHAR(50) USING document_number::text;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'issuing_authority' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN issuing_authority TYPE VARCHAR(200) USING issuing_authority::text;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS issue_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'issue_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN issue_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS effective_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'effective_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN effective_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS expiration_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'expiration_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN expiration_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS document_type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'document_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN document_type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS application_area VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'application_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN application_area TYPE VARCHAR(100) USING application_area::text;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN status TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS signer VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'signer' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN signer TYPE VARCHAR(100) USING signer::text;
    END IF;
END $$;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS description VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_documents' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.legal_documents ALTER COLUMN description TYPE VARCHAR(500) USING description::text;
    END IF;
END $$;

-- Table: lighthouse_station
CREATE TABLE IF NOT EXISTS public.lighthouse_station (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.lighthouse_station ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.lighthouse_station ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.lighthouse_station ADD COLUMN IF NOT EXISTS type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN type TYPE VARCHAR(500) USING type::text;
    END IF;
END $$;
ALTER TABLE public.lighthouse_station ADD COLUMN IF NOT EXISTS light_range DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'light_range' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN light_range TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.lighthouse_station ADD COLUMN IF NOT EXISTS light_color VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'light_color' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN light_color TYPE VARCHAR(500) USING light_color::text;
    END IF;
END $$;
ALTER TABLE public.lighthouse_station ADD COLUMN IF NOT EXISTS light_characteristic VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'light_characteristic' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN light_characteristic TYPE VARCHAR(500) USING light_characteristic::text;
    END IF;
END $$;
ALTER TABLE public.lighthouse_station ADD COLUMN IF NOT EXISTS range DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'range' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN range TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.lighthouse_station ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'last_maintenance_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN last_maintenance_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.lighthouse_station ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'next_maintenance_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN next_maintenance_date TYPE DATE USING NULL;
    END IF;
END $$;

-- Table: line_attachments
CREATE TABLE IF NOT EXISTS public.line_attachments (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_attachments' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.line_attachments ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.line_attachments ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.line_attachments ADD COLUMN IF NOT EXISTS object_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_attachments' AND column_name = 'object_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_attachments ALTER COLUMN object_id TYPE VARCHAR(500) USING object_id::text;
    END IF;
END $$;
ALTER TABLE public.line_attachments ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_attachments' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_attachments ALTER COLUMN file_name TYPE VARCHAR(255) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.line_attachments ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_attachments' AND column_name = 'file_url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_attachments ALTER COLUMN file_url TYPE VARCHAR(500) USING file_url::text;
    END IF;
END $$;
ALTER TABLE public.line_attachments ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_attachments' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_attachments ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.line_attachments ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_attachments' AND column_name = 'mime_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_attachments ALTER COLUMN mime_type TYPE VARCHAR(100) USING mime_type::text;
    END IF;
END $$;

-- Table: line_categories
CREATE TABLE IF NOT EXISTS public.line_categories (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_categories' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.line_categories ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.line_categories ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.line_categories ADD COLUMN IF NOT EXISTS name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_categories' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_categories ALTER COLUMN name TYPE VARCHAR(100) USING name::text;
    END IF;
END $$;
ALTER TABLE public.line_categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_categories' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_categories ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.line_categories ADD COLUMN IF NOT EXISTS description VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_categories' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_categories ALTER COLUMN description TYPE VARCHAR(500) USING description::text;
    END IF;
END $$;
ALTER TABLE public.line_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_categories' AND column_name = 'sort_order' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_categories ALTER COLUMN sort_order TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: line_history
CREATE TABLE IF NOT EXISTS public.line_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.line_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.line_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.line_history ADD COLUMN IF NOT EXISTS object_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_history' AND column_name = 'object_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_history ALTER COLUMN object_id TYPE VARCHAR(500) USING object_id::text;
    END IF;
END $$;
ALTER TABLE public.line_history ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_history' AND column_name = 'action_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_history ALTER COLUMN action_type TYPE VARCHAR(50) USING action_type::text;
    END IF;
END $$;
ALTER TABLE public.line_history ADD COLUMN IF NOT EXISTS previous_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_history' AND column_name = 'previous_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_history ALTER COLUMN previous_value TYPE TEXT USING previous_value::text;
    END IF;
END $$;
ALTER TABLE public.line_history ADD COLUMN IF NOT EXISTS new_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_history' AND column_name = 'new_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_history ALTER COLUMN new_value TYPE TEXT USING new_value::text;
    END IF;
END $$;
ALTER TABLE public.line_history ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_history' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.line_history ALTER COLUMN reason TYPE VARCHAR(500) USING reason::text;
    END IF;
END $$;

-- Table: lockout_policy
CREATE TABLE IF NOT EXISTS public.lockout_policy (
    id BIGINT PRIMARY KEY
);

ALTER TABLE public.lockout_policy ADD COLUMN IF NOT EXISTS id BIGINT;
ALTER TABLE public.lockout_policy ADD COLUMN IF NOT EXISTS max_failed_attempts INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lockout_policy' AND column_name = 'max_failed_attempts' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lockout_policy ALTER COLUMN max_failed_attempts TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.lockout_policy ADD COLUMN IF NOT EXISTS lockout_duration_minutes INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lockout_policy' AND column_name = 'lockout_duration_minutes' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lockout_policy ALTER COLUMN lockout_duration_minutes TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.lockout_policy ADD COLUMN IF NOT EXISTS window_minutes INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lockout_policy' AND column_name = 'window_minutes' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lockout_policy ALTER COLUMN window_minutes TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.lockout_policy ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lockout_policy' AND column_name = 'is_enabled' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lockout_policy ALTER COLUMN is_enabled TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.lockout_policy ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lockout_policy' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.lockout_policy ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.lockout_policy ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lockout_policy' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lockout_policy ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: log_aggregates
CREATE TABLE IF NOT EXISTS public.log_aggregates (
    id BIGINT PRIMARY KEY
);

ALTER TABLE public.log_aggregates ADD COLUMN IF NOT EXISTS id BIGINT;
ALTER TABLE public.log_aggregates ADD COLUMN IF NOT EXISTS date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_aggregates' AND column_name = 'date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_aggregates ALTER COLUMN date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.log_aggregates ADD COLUMN IF NOT EXISTS total_accesses BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_aggregates' AND column_name = 'total_accesses' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_aggregates ALTER COLUMN total_accesses TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.log_aggregates ADD COLUMN IF NOT EXISTS unique_users BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_aggregates' AND column_name = 'unique_users' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_aggregates ALTER COLUMN unique_users TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.log_aggregates ADD COLUMN IF NOT EXISTS success_rate NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_aggregates' AND column_name = 'success_rate' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_aggregates ALTER COLUMN success_rate TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.log_aggregates ADD COLUMN IF NOT EXISTS avg_duration INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_aggregates' AND column_name = 'avg_duration' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_aggregates ALTER COLUMN avg_duration TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.log_aggregates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_aggregates' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_aggregates ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: log_retention_policies
CREATE TABLE IF NOT EXISTS public.log_retention_policies (
    id BIGINT PRIMARY KEY
);

ALTER TABLE public.log_retention_policies ADD COLUMN IF NOT EXISTS id BIGINT;
ALTER TABLE public.log_retention_policies ADD COLUMN IF NOT EXISTS retention_days INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_retention_policies' AND column_name = 'retention_days' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_retention_policies ALTER COLUMN retention_days TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.log_retention_policies ADD COLUMN IF NOT EXISTS max_export_rows INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_retention_policies' AND column_name = 'max_export_rows' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_retention_policies ALTER COLUMN max_export_rows TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.log_retention_policies ADD COLUMN IF NOT EXISTS cleanup_schedule VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_retention_policies' AND column_name = 'cleanup_schedule' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_retention_policies ALTER COLUMN cleanup_schedule TYPE VARCHAR(50) USING cleanup_schedule::text;
    END IF;
END $$;
ALTER TABLE public.log_retention_policies ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_retention_policies' AND column_name = 'is_active' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_retention_policies ALTER COLUMN is_active TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.log_retention_policies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_retention_policies' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_retention_policies ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.log_retention_policies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'log_retention_policies' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.log_retention_policies ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: login_attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_attempts' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.login_attempts ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.login_attempts ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_attempts' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.login_attempts ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS username VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_attempts' AND column_name = 'username' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_attempts ALTER COLUMN username TYPE VARCHAR(100) USING username::text;
    END IF;
END $$;
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS email VARCHAR(150);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_attempts' AND column_name = 'email' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_attempts ALTER COLUMN email TYPE VARCHAR(150) USING email::text;
    END IF;
END $$;
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_attempts' AND column_name = 'ip_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_attempts ALTER COLUMN ip_address TYPE VARCHAR(45) USING ip_address::text;
    END IF;
END $$;
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_attempts' AND column_name = 'user_agent' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_attempts ALTER COLUMN user_agent TYPE VARCHAR(500) USING user_agent::text;
    END IF;
END $$;
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS result VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_attempts' AND column_name = 'result' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_attempts ALTER COLUMN result TYPE VARCHAR(20) USING result::text;
    END IF;
END $$;
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_attempts' AND column_name = 'failure_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_attempts ALTER COLUMN failure_reason TYPE VARCHAR(255) USING failure_reason::text;
    END IF;
END $$;

-- Table: login_audit_log
CREATE TABLE IF NOT EXISTS public.login_audit_log (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_audit_log' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.login_audit_log ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.login_audit_log ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.login_audit_log ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_audit_log' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.login_audit_log ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.login_audit_log ADD COLUMN IF NOT EXISTS username VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_audit_log' AND column_name = 'username' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_audit_log ALTER COLUMN username TYPE VARCHAR(100) USING username::text;
    END IF;
END $$;
ALTER TABLE public.login_audit_log ADD COLUMN IF NOT EXISTS attempt_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_audit_log' AND column_name = 'attempt_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_audit_log ALTER COLUMN attempt_type TYPE VARCHAR(50) USING attempt_type::text;
    END IF;
END $$;
ALTER TABLE public.login_audit_log ADD COLUMN IF NOT EXISTS result VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_audit_log' AND column_name = 'result' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_audit_log ALTER COLUMN result TYPE VARCHAR(50) USING result::text;
    END IF;
END $$;
ALTER TABLE public.login_audit_log ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_audit_log' AND column_name = 'failure_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_audit_log ALTER COLUMN failure_reason TYPE VARCHAR(255) USING failure_reason::text;
    END IF;
END $$;
ALTER TABLE public.login_audit_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_audit_log' AND column_name = 'ip_address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_audit_log ALTER COLUMN ip_address TYPE VARCHAR(45) USING ip_address::text;
    END IF;
END $$;
ALTER TABLE public.login_audit_log ADD COLUMN IF NOT EXISTS user_agent VARCHAR(512);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_audit_log' AND column_name = 'user_agent' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_audit_log ALTER COLUMN user_agent TYPE VARCHAR(512) USING user_agent::text;
    END IF;
END $$;
ALTER TABLE public.login_audit_log ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_audit_log' AND column_name = 'attempted_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.login_audit_log ALTER COLUMN attempted_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: lookup_logs
CREATE TABLE IF NOT EXISTS public.lookup_logs (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.lookup_logs ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.lookup_logs ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.lookup_logs ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.lookup_logs ADD COLUMN IF NOT EXISTS searched_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_logs' AND column_name = 'searched_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_logs ALTER COLUMN searched_by TYPE VARCHAR(100) USING searched_by::text;
    END IF;
END $$;
ALTER TABLE public.lookup_logs ADD COLUMN IF NOT EXISTS keyword VARCHAR(300);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_logs' AND column_name = 'keyword' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_logs ALTER COLUMN keyword TYPE VARCHAR(300) USING keyword::text;
    END IF;
END $$;
ALTER TABLE public.lookup_logs ADD COLUMN IF NOT EXISTS filters VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_logs' AND column_name = 'filters' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_logs ALTER COLUMN filters TYPE VARCHAR(200) USING filters::text;
    END IF;
END $$;
ALTER TABLE public.lookup_logs ADD COLUMN IF NOT EXISTS result_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_logs' AND column_name = 'result_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_logs ALTER COLUMN result_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.lookup_logs ADD COLUMN IF NOT EXISTS searched_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_logs' AND column_name = 'searched_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_logs ALTER COLUMN searched_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: lookup_results
CREATE TABLE IF NOT EXISTS public.lookup_results (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_results' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.lookup_results ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.lookup_results ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.lookup_results ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.lookup_results ADD COLUMN IF NOT EXISTS planning_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_results' AND column_name = 'planning_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.lookup_results ALTER COLUMN planning_id TYPE UUID USING CASE WHEN planning_id IS NULL OR planning_id::text = '' THEN NULL ELSE planning_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.lookup_results ADD COLUMN IF NOT EXISTS ten_do_an VARCHAR(300);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_results' AND column_name = 'ten_do_an' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_results ALTER COLUMN ten_do_an TYPE VARCHAR(300) USING ten_do_an::text;
    END IF;
END $$;
ALTER TABLE public.lookup_results ADD COLUMN IF NOT EXISTS coquan_phe_duyet VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_results' AND column_name = 'coquan_phe_duyet' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_results ALTER COLUMN coquan_phe_duyet TYPE VARCHAR(200) USING coquan_phe_duyet::text;
    END IF;
END $$;
ALTER TABLE public.lookup_results ADD COLUMN IF NOT EXISTS ngay_phe_duyet DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_results' AND column_name = 'ngay_phe_duyet' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_results ALTER COLUMN ngay_phe_duyet TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.lookup_results ADD COLUMN IF NOT EXISTS pham_vi_ap_dung TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_results' AND column_name = 'pham_vi_ap_dung' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_results ALTER COLUMN pham_vi_ap_dung TYPE TEXT USING pham_vi_ap_dung::text;
    END IF;
END $$;
ALTER TABLE public.lookup_results ADD COLUMN IF NOT EXISTS tinh_trang VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lookup_results' AND column_name = 'tinh_trang' AND udt_name = 'uuid') THEN
        ALTER TABLE public.lookup_results ALTER COLUMN tinh_trang TYPE VARCHAR(50) USING tinh_trang::text;
    END IF;
END $$;

-- Table: maintenance_plans
CREATE TABLE IF NOT EXISTS public.maintenance_plans (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.maintenance_plans ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS equipment VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'equipment' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN equipment TYPE VARCHAR(200) USING equipment::text;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS maintenance_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'maintenance_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN maintenance_type TYPE VARCHAR(50) USING maintenance_type::text;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS estimated_start_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'estimated_start_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN estimated_start_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS estimated_end_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'estimated_end_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN estimated_end_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'estimated_cost' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN estimated_cost TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.maintenance_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_plans' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_plans ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: maintenance_reports
CREATE TABLE IF NOT EXISTS public.maintenance_reports (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_reports' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.maintenance_reports ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.maintenance_reports ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS report_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_reports' AND column_name = 'report_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_reports ALTER COLUMN report_type TYPE VARCHAR(100) USING report_type::text;
    END IF;
END $$;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS period_start DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_reports' AND column_name = 'period_start' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_reports ALTER COLUMN period_start TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS period_end DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_reports' AND column_name = 'period_end' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_reports ALTER COLUMN period_end TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS total_cost NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_reports' AND column_name = 'total_cost' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_reports ALTER COLUMN total_cost TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_reports' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_reports ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_reports' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.maintenance_reports ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.maintenance_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_reports' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_reports ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: maintenance_results
CREATE TABLE IF NOT EXISTS public.maintenance_results (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_results' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.maintenance_results ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.maintenance_results ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.maintenance_results ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.maintenance_results ADD COLUMN IF NOT EXISTS maintenance_plan_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_results' AND column_name = 'maintenance_plan_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.maintenance_results ALTER COLUMN maintenance_plan_id TYPE UUID USING CASE WHEN maintenance_plan_id IS NULL OR maintenance_plan_id::text = '' THEN NULL ELSE maintenance_plan_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.maintenance_results ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_results' AND column_name = 'actual_start_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_results ALTER COLUMN actual_start_time TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_results ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_results' AND column_name = 'actual_end_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_results ALTER COLUMN actual_end_time TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_results ADD COLUMN IF NOT EXISTS result_description TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_results' AND column_name = 'result_description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_results ALTER COLUMN result_description TYPE TEXT USING result_description::text;
    END IF;
END $$;
ALTER TABLE public.maintenance_results ADD COLUMN IF NOT EXISTS replaced_parts VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_results' AND column_name = 'replaced_parts' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_results ALTER COLUMN replaced_parts TYPE VARCHAR(500) USING replaced_parts::text;
    END IF;
END $$;
ALTER TABLE public.maintenance_results ADD COLUMN IF NOT EXISTS downtime_duration BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_results' AND column_name = 'downtime_duration' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_results ALTER COLUMN downtime_duration TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.maintenance_results ADD COLUMN IF NOT EXISTS recorder VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_results' AND column_name = 'recorder' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_results ALTER COLUMN recorder TYPE VARCHAR(100) USING recorder::text;
    END IF;
END $$;
ALTER TABLE public.maintenance_results ADD COLUMN IF NOT EXISTS recorded_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_results' AND column_name = 'recorded_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.maintenance_results ALTER COLUMN recorded_date TYPE DATE USING NULL;
    END IF;
END $$;

-- Table: map_icons
CREATE TABLE IF NOT EXISTS public.map_icons (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_icons' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.map_icons ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.map_icons ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.map_icons ADD COLUMN IF NOT EXISTS name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_icons' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_icons ALTER COLUMN name TYPE VARCHAR(100) USING name::text;
    END IF;
END $$;
ALTER TABLE public.map_icons ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_icons' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_icons ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.map_icons ADD COLUMN IF NOT EXISTS category VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_icons' AND column_name = 'category' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_icons ALTER COLUMN category TYPE VARCHAR(50) USING category::text;
    END IF;
END $$;
ALTER TABLE public.map_icons ADD COLUMN IF NOT EXISTS icon_url VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_icons' AND column_name = 'icon_url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_icons ALTER COLUMN icon_url TYPE VARCHAR(500) USING icon_url::text;
    END IF;
END $$;
ALTER TABLE public.map_icons ADD COLUMN IF NOT EXISTS size VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_icons' AND column_name = 'size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_icons ALTER COLUMN size TYPE VARCHAR(50) USING size::text;
    END IF;
END $$;
ALTER TABLE public.map_icons ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_icons' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_icons ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;

-- Table: map_layers
CREATE TABLE IF NOT EXISTS public.map_layers (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.map_layers ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.map_layers ADD COLUMN IF NOT EXISTS name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN name TYPE VARCHAR(100) USING name::text;
    END IF;
END $$;
ALTER TABLE public.map_layers ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.map_layers ADD COLUMN IF NOT EXISTS layer_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'layer_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN layer_type TYPE VARCHAR(50) USING layer_type::text;
    END IF;
END $$;
ALTER TABLE public.map_layers ADD COLUMN IF NOT EXISTS source VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'source' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN source TYPE VARCHAR(200) USING source::text;
    END IF;
END $$;
ALTER TABLE public.map_layers ADD COLUMN IF NOT EXISTS visible BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'visible' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN visible TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_layers ADD COLUMN IF NOT EXISTS opacity DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'opacity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN opacity TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_layers ADD COLUMN IF NOT EXISTS sort_order INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'sort_order' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN sort_order TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_layers ADD COLUMN IF NOT EXISTS style_config TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'style_config' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN style_config TYPE TEXT USING style_config::text;
    END IF;
END $$;
ALTER TABLE public.map_layers ADD COLUMN IF NOT EXISTS status BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_layers' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_layers ALTER COLUMN status TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: map_overlays
CREATE TABLE IF NOT EXISTS public.map_overlays (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_overlays' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.map_overlays ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.map_overlays ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.map_overlays ADD COLUMN IF NOT EXISTS name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_overlays' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_overlays ALTER COLUMN name TYPE VARCHAR(100) USING name::text;
    END IF;
END $$;
ALTER TABLE public.map_overlays ADD COLUMN IF NOT EXISTS url VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_overlays' AND column_name = 'url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_overlays ALTER COLUMN url TYPE VARCHAR(500) USING url::text;
    END IF;
END $$;
ALTER TABLE public.map_overlays ADD COLUMN IF NOT EXISTS layer_name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_overlays' AND column_name = 'layer_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_overlays ALTER COLUMN layer_name TYPE VARCHAR(100) USING layer_name::text;
    END IF;
END $$;
ALTER TABLE public.map_overlays ADD COLUMN IF NOT EXISTS format VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_overlays' AND column_name = 'format' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_overlays ALTER COLUMN format TYPE VARCHAR(20) USING format::text;
    END IF;
END $$;
ALTER TABLE public.map_overlays ADD COLUMN IF NOT EXISTS visible BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_overlays' AND column_name = 'visible' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_overlays ALTER COLUMN visible TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_overlays ADD COLUMN IF NOT EXISTS opacity DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_overlays' AND column_name = 'opacity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_overlays ALTER COLUMN opacity TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_overlays ADD COLUMN IF NOT EXISTS z_index INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_overlays' AND column_name = 'z_index' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_overlays ALTER COLUMN z_index TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: map_styles
CREATE TABLE IF NOT EXISTS public.map_styles (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.map_styles ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.map_styles ADD COLUMN IF NOT EXISTS layer_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'layer_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN layer_id TYPE VARCHAR(500) USING layer_id::text;
    END IF;
END $$;
ALTER TABLE public.map_styles ADD COLUMN IF NOT EXISTS fill_color VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'fill_color' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN fill_color TYPE VARCHAR(20) USING fill_color::text;
    END IF;
END $$;
ALTER TABLE public.map_styles ADD COLUMN IF NOT EXISTS stroke_color VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'stroke_color' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN stroke_color TYPE VARCHAR(20) USING stroke_color::text;
    END IF;
END $$;
ALTER TABLE public.map_styles ADD COLUMN IF NOT EXISTS stroke_width DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'stroke_width' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN stroke_width TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_styles ADD COLUMN IF NOT EXISTS point_radius DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'point_radius' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN point_radius TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_styles ADD COLUMN IF NOT EXISTS icon_size DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'icon_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN icon_size TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_styles ADD COLUMN IF NOT EXISTS opacity DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'opacity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN opacity TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_styles ADD COLUMN IF NOT EXISTS min_zoom INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'min_zoom' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN min_zoom TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_styles ADD COLUMN IF NOT EXISTS max_zoom INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_styles' AND column_name = 'max_zoom' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_styles ALTER COLUMN max_zoom TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: map_symbols
CREATE TABLE IF NOT EXISTS public.map_symbols (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_symbols' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.map_symbols ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.map_symbols ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.map_symbols ADD COLUMN IF NOT EXISTS name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_symbols' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_symbols ALTER COLUMN name TYPE VARCHAR(255) USING name::text;
    END IF;
END $$;
ALTER TABLE public.map_symbols ADD COLUMN IF NOT EXISTS description TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_symbols' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_symbols ALTER COLUMN description TYPE TEXT USING description::text;
    END IF;
END $$;
ALTER TABLE public.map_symbols ADD COLUMN IF NOT EXISTS image TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_symbols' AND column_name = 'image' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_symbols ALTER COLUMN image TYPE TEXT USING image::text;
    END IF;
END $$;
ALTER TABLE public.map_symbols ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_symbols' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_symbols ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.map_symbols ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_symbols' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.map_symbols ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;

-- Table: map_views
CREATE TABLE IF NOT EXISTS public.map_views (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_views' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.map_views ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.map_views ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.map_views ADD COLUMN IF NOT EXISTS name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_views' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_views ALTER COLUMN name TYPE VARCHAR(100) USING name::text;
    END IF;
END $$;
ALTER TABLE public.map_views ADD COLUMN IF NOT EXISTS user_id BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_views' AND column_name = 'user_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_views ALTER COLUMN user_id TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_views ADD COLUMN IF NOT EXISTS center_lon DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_views' AND column_name = 'center_lon' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_views ALTER COLUMN center_lon TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_views ADD COLUMN IF NOT EXISTS center_lat DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_views' AND column_name = 'center_lat' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_views ALTER COLUMN center_lat TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_views ADD COLUMN IF NOT EXISTS zoom INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_views' AND column_name = 'zoom' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_views ALTER COLUMN zoom TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.map_views ADD COLUMN IF NOT EXISTS visible_layers TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_views' AND column_name = 'visible_layers' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_views ALTER COLUMN visible_layers TYPE TEXT USING visible_layers::text;
    END IF;
END $$;
ALTER TABLE public.map_views ADD COLUMN IF NOT EXISTS layer_order TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_views' AND column_name = 'layer_order' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_views ALTER COLUMN layer_order TYPE TEXT USING layer_order::text;
    END IF;
END $$;
ALTER TABLE public.map_views ADD COLUMN IF NOT EXISTS style_configs TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'map_views' AND column_name = 'style_configs' AND udt_name = 'uuid') THEN
        ALTER TABLE public.map_views ALTER COLUMN style_configs TYPE TEXT USING style_configs::text;
    END IF;
END $$;

-- Table: movement_requests
CREATE TABLE IF NOT EXISTS public.movement_requests (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.movement_requests ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS movement_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'movement_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN movement_type TYPE VARCHAR(50) USING movement_type::text;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS title VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'title' AND udt_name = 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN title TYPE VARCHAR(200) USING title::text;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS description VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN description TYPE VARCHAR(2000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS creator_name UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'creator_name' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN creator_name TYPE UUID USING CASE WHEN creator_name IS NULL OR creator_name::text = '' THEN NULL ELSE creator_name::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS approved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'approved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN approved_remarks TYPE VARCHAR(1000) USING approved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS unapproved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'unapproved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN unapproved_by TYPE UUID USING CASE WHEN unapproved_by IS NULL OR unapproved_by::text = '' THEN NULL ELSE unapproved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS unapproved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'unapproved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN unapproved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS unapproved_remarks VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'unapproved_remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN unapproved_remarks TYPE VARCHAR(1000) USING unapproved_remarks::text;
    END IF;
END $$;
ALTER TABLE public.movement_requests ADD COLUMN IF NOT EXISTS lock_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'movement_requests' AND column_name = 'lock_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.movement_requests ALTER COLUMN lock_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: navigation_channel
CREATE TABLE IF NOT EXISTS public.navigation_channel (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.navigation_channel ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS channel_name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'channel_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN channel_name TYPE VARCHAR(100) USING channel_name::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS station_amountt INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'station_amountt' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN station_amountt TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS latest_station_repair_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'latest_station_repair_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN latest_station_repair_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS station_area NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'station_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN station_area TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS note VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'note' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN note TYPE VARCHAR(500) USING note::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS channel_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'channel_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN channel_code TYPE VARCHAR(50) USING channel_code::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS seaport_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'seaport_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN seaport_id TYPE UUID USING CASE WHEN seaport_id IS NULL OR seaport_id::text = '' THEN NULL ELSE seaport_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS operating_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'operating_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN operating_unit_id TYPE UUID USING CASE WHEN operating_unit_id IS NULL OR operating_unit_id::text = '' THEN NULL ELSE operating_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS location VARCHAR(6);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN location TYPE VARCHAR(6) USING location::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS detailed_location VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'detailed_location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN detailed_location TYPE VARCHAR(500) USING detailed_location::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS channel_management_station VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'channel_management_station' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN channel_management_station TYPE VARCHAR(500) USING channel_management_station::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS station_staff_amount INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'station_staff_amount' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN station_staff_amount TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS latest_maintenance_year INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'latest_maintenance_year' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN latest_maintenance_year TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS dredging_volume NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'dredging_volume' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN dredging_volume TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS clearance_height VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'clearance_height' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN clearance_height TYPE VARCHAR(20) USING clearance_height::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS buoy_amount INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'buoy_amount' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN buoy_amount TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS beacon_amount INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'beacon_amount' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN beacon_amount TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN status TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS is_approved_level1 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'is_approved_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN is_approved_level1 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS approver_level1 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approver_level1' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL ELSE approver_level1::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS approved_date_level1 DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approved_date_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approved_date_level1 TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS is_approved_level2 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'is_approved_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN is_approved_level2 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS approver_level2 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approver_level2' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL ELSE approver_level2::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS approved_date_level2 DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approved_date_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approved_date_level2 TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'rejection_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN rejection_reason TYPE VARCHAR(500) USING rejection_reason::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'is_deleted' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN is_deleted TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS registered_area VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'registered_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN registered_area TYPE VARCHAR(100) USING registered_area::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'operating_hours' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN operating_hours TYPE VARCHAR(50) USING operating_hours::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS recorded_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'recorded_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN recorded_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS quantity INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'quantity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN quantity TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS load_capacity VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'load_capacity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN load_capacity TYPE VARCHAR(100) USING load_capacity::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'deleted_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN deleted_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS deleted_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'deleted_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN deleted_by TYPE UUID USING CASE WHEN deleted_by IS NULL OR deleted_by::text = '' THEN NULL ELSE deleted_by::text::uuid END;
    END IF;
END $$;

-- Table: navigation_channel_attachment
CREATE TABLE IF NOT EXISTS public.navigation_channel_attachment (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel_attachment' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel_attachment ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.navigation_channel_attachment ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel_attachment ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.navigation_channel_attachment ADD COLUMN IF NOT EXISTS navigation_channel_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel_attachment' AND column_name = 'navigation_channel_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.navigation_channel_attachment ALTER COLUMN navigation_channel_id TYPE UUID USING CASE WHEN navigation_channel_id IS NULL OR navigation_channel_id::text = '' THEN NULL ELSE navigation_channel_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.navigation_channel_attachment ADD COLUMN IF NOT EXISTS file_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel_attachment' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel_attachment ALTER COLUMN file_name TYPE VARCHAR(200) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel_attachment ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel_attachment' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel_attachment ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.navigation_channel_attachment ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel_attachment' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel_attachment ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.navigation_channel_attachment ADD COLUMN IF NOT EXISTS upload_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel_attachment' AND column_name = 'upload_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel_attachment ALTER COLUMN upload_date TYPE DATE USING NULL;
    END IF;
END $$;

-- Table: object_categories
CREATE TABLE IF NOT EXISTS public.object_categories (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'object_categories' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.object_categories ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.object_categories ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.object_categories ADD COLUMN IF NOT EXISTS name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'object_categories' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.object_categories ALTER COLUMN name TYPE VARCHAR(100) USING name::text;
    END IF;
END $$;
ALTER TABLE public.object_categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'object_categories' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.object_categories ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.object_categories ADD COLUMN IF NOT EXISTS description VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'object_categories' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.object_categories ALTER COLUMN description TYPE VARCHAR(500) USING description::text;
    END IF;
END $$;
ALTER TABLE public.object_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'object_categories' AND column_name = 'sort_order' AND udt_name = 'uuid') THEN
        ALTER TABLE public.object_categories ALTER COLUMN sort_order TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: operation_details
CREATE TABLE IF NOT EXISTS public.operation_details (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_details' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.operation_details ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.operation_details ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.operation_details ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.operation_details ADD COLUMN IF NOT EXISTS operation_plan_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_details' AND column_name = 'operation_plan_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.operation_details ALTER COLUMN operation_plan_id TYPE UUID USING CASE WHEN operation_plan_id IS NULL OR operation_plan_id::text = '' THEN NULL ELSE operation_plan_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.operation_details ADD COLUMN IF NOT EXISTS description TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_details' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_details ALTER COLUMN description TYPE TEXT USING description::text;
    END IF;
END $$;
ALTER TABLE public.operation_details ADD COLUMN IF NOT EXISTS estimated_volume NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_details' AND column_name = 'estimated_volume' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_details ALTER COLUMN estimated_volume TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.operation_details ADD COLUMN IF NOT EXISTS actual_volume NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_details' AND column_name = 'actual_volume' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_details ALTER COLUMN actual_volume TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.operation_details ADD COLUMN IF NOT EXISTS notes VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_details' AND column_name = 'notes' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_details ALTER COLUMN notes TYPE VARCHAR(500) USING notes::text;
    END IF;
END $$;

-- Table: operation_plans
CREATE TABLE IF NOT EXISTS public.operation_plans (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.operation_plans ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS operation_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'operation_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN operation_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS pier VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'pier' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN pier TYPE VARCHAR(200) USING pier::text;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS equipment VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'equipment' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN equipment TYPE VARCHAR(200) USING equipment::text;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS start_time TIME;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'start_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN start_time TYPE TIME USING NULL;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS end_time TIME;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'end_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN end_time TYPE TIME USING NULL;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.operation_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_plans' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_plans ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: operation_reports
CREATE TABLE IF NOT EXISTS public.operation_reports (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_reports' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.operation_reports ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.operation_reports ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.operation_reports ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.operation_reports ADD COLUMN IF NOT EXISTS report_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_reports' AND column_name = 'report_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_reports ALTER COLUMN report_type TYPE VARCHAR(100) USING report_type::text;
    END IF;
END $$;
ALTER TABLE public.operation_reports ADD COLUMN IF NOT EXISTS period_start DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_reports' AND column_name = 'period_start' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_reports ALTER COLUMN period_start TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.operation_reports ADD COLUMN IF NOT EXISTS period_end DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_reports' AND column_name = 'period_end' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_reports ALTER COLUMN period_end TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.operation_reports ADD COLUMN IF NOT EXISTS total_cost NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_reports' AND column_name = 'total_cost' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_reports ALTER COLUMN total_cost TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.operation_reports ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_reports' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_reports ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.operation_reports ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_reports' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.operation_reports ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.operation_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'operation_reports' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.operation_reports ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: org_units
CREATE TABLE IF NOT EXISTS public.org_units (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.org_units ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.org_units ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
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

-- Table: organization_chart
CREATE TABLE IF NOT EXISTS public.organization_chart (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organization_chart' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.organization_chart ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.organization_chart ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.organization_chart ADD COLUMN IF NOT EXISTS unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organization_chart' AND column_name = 'unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.organization_chart ALTER COLUMN unit_id TYPE UUID USING CASE WHEN unit_id IS NULL OR unit_id::text = '' THEN NULL ELSE unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.organization_chart ADD COLUMN IF NOT EXISTS parent_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organization_chart' AND column_name = 'parent_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.organization_chart ALTER COLUMN parent_id TYPE UUID USING CASE WHEN parent_id IS NULL OR parent_id::text = '' THEN NULL ELSE parent_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.organization_chart ADD COLUMN IF NOT EXISTS level INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organization_chart' AND column_name = 'level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.organization_chart ALTER COLUMN level TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.organization_chart ADD COLUMN IF NOT EXISTS sort_order INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organization_chart' AND column_name = 'sort_order' AND udt_name = 'uuid') THEN
        ALTER TABLE public.organization_chart ALTER COLUMN sort_order TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: password_expiration_log
CREATE TABLE IF NOT EXISTS public.password_expiration_log (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_expiration_log' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.password_expiration_log ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.password_expiration_log ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.password_expiration_log ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_expiration_log' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.password_expiration_log ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.password_expiration_log ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_expiration_log' AND column_name = 'expired_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_expiration_log ALTER COLUMN expired_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.password_expiration_log ADD COLUMN IF NOT EXISTS status VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_expiration_log' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_expiration_log ALTER COLUMN status TYPE VARCHAR(20) USING status::text;
    END IF;
END $$;
ALTER TABLE public.password_expiration_log ADD COLUMN IF NOT EXISTS notified_via VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_expiration_log' AND column_name = 'notified_via' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_expiration_log ALTER COLUMN notified_via TYPE VARCHAR(20) USING notified_via::text;
    END IF;
END $$;

-- Table: password_history
CREATE TABLE IF NOT EXISTS public.password_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.password_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.password_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.password_history ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_history' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.password_history ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.password_history ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_history' AND column_name = 'password_hash' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_history ALTER COLUMN password_hash TYPE VARCHAR(255) USING password_hash::text;
    END IF;
END $$;

-- Table: password_policy
CREATE TABLE IF NOT EXISTS public.password_policy (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_policy' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.password_policy ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.password_policy ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.password_policy ADD COLUMN IF NOT EXISTS min_length INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_policy' AND column_name = 'min_length' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_policy ALTER COLUMN min_length TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.password_policy ADD COLUMN IF NOT EXISTS require_uppercase BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_policy' AND column_name = 'require_uppercase' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_policy ALTER COLUMN require_uppercase TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.password_policy ADD COLUMN IF NOT EXISTS require_lowercase BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_policy' AND column_name = 'require_lowercase' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_policy ALTER COLUMN require_lowercase TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.password_policy ADD COLUMN IF NOT EXISTS require_digit BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_policy' AND column_name = 'require_digit' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_policy ALTER COLUMN require_digit TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.password_policy ADD COLUMN IF NOT EXISTS require_special_char BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_policy' AND column_name = 'require_special_char' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_policy ALTER COLUMN require_special_char TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.password_policy ADD COLUMN IF NOT EXISTS max_age_days INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_policy' AND column_name = 'max_age_days' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_policy ALTER COLUMN max_age_days TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.password_policy ADD COLUMN IF NOT EXISTS history_depth INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_policy' AND column_name = 'history_depth' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_policy ALTER COLUMN history_depth TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.password_policy ADD COLUMN IF NOT EXISTS block_username_in_password BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_policy' AND column_name = 'block_username_in_password' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_policy ALTER COLUMN block_username_in_password TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: password_reset_tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_reset_tokens' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.password_reset_tokens ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.password_reset_tokens ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.password_reset_tokens ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_reset_tokens' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.password_reset_tokens ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.password_reset_tokens ADD COLUMN IF NOT EXISTS token VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_reset_tokens' AND column_name = 'token' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_reset_tokens ALTER COLUMN token TYPE VARCHAR(255) USING token::text;
    END IF;
END $$;
ALTER TABLE public.password_reset_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_reset_tokens' AND column_name = 'expires_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_reset_tokens ALTER COLUMN expires_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.password_reset_tokens ADD COLUMN IF NOT EXISTS used BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_reset_tokens' AND column_name = 'used' AND udt_name = 'uuid') THEN
        ALTER TABLE public.password_reset_tokens ALTER COLUMN used TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: pending_approvals
CREATE TABLE IF NOT EXISTS public.pending_approvals (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.pending_approvals ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS username VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'username' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN username TYPE VARCHAR(100) USING username::text;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS email VARCHAR(150);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'email' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN email TYPE VARCHAR(150) USING email::text;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'full_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN full_name TYPE VARCHAR(200) USING full_name::text;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN phone TYPE VARCHAR(20) USING phone::text;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'password_hash' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN password_hash TYPE VARCHAR(255) USING password_hash::text;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS requested_role_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'requested_role_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN requested_role_code TYPE VARCHAR(50) USING requested_role_code::text;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS status VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN status TYPE VARCHAR(20) USING status::text;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'rejection_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN rejection_reason TYPE VARCHAR(500) USING rejection_reason::text;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN approved_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.pending_approvals ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pending_approvals' AND column_name = 'rejected_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.pending_approvals ALTER COLUMN rejected_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.permissions ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.permissions ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS code VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.permissions ALTER COLUMN code TYPE VARCHAR(100) USING code::text;
    END IF;
END $$;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.permissions ALTER COLUMN name TYPE VARCHAR(200) USING name::text;
    END IF;
END $$;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS description VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.permissions ALTER COLUMN description TYPE VARCHAR(500) USING description::text;
    END IF;
END $$;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS resource VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'resource' AND udt_name = 'uuid') THEN
        ALTER TABLE public.permissions ALTER COLUMN resource TYPE VARCHAR(50) USING resource::text;
    END IF;
END $$;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS action VARCHAR(30);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'action' AND udt_name = 'uuid') THEN
        ALTER TABLE public.permissions ALTER COLUMN action TYPE VARCHAR(30) USING action::text;
    END IF;
END $$;

-- Table: piers
CREATE TABLE IF NOT EXISTS public.piers (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.piers ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS pier_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'pier_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN pier_code TYPE VARCHAR(50) USING pier_code::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS pier_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'pier_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN pier_name TYPE VARCHAR(255) USING pier_name::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS berth_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'berth_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN berth_id TYPE UUID USING CASE WHEN berth_id IS NULL OR berth_id::text = '' THEN NULL ELSE berth_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS length NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'length' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN length TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS design_load NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'design_load' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN design_load TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS pier_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'pier_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN pier_type TYPE VARCHAR(50) USING pier_type::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'operational_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN operational_status TYPE VARCHAR(50) USING operational_status::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS operational_function VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'operational_function' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN operational_function TYPE VARCHAR(255) USING operational_function::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS map_symbol_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'map_symbol_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN map_symbol_id TYPE UUID USING CASE WHEN map_symbol_id IS NULL OR map_symbol_id::text = '' THEN NULL ELSE map_symbol_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS port_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'port_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN port_id TYPE UUID USING CASE WHEN port_id IS NULL OR port_id::text = '' THEN NULL ELSE port_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS navigation_channel_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'navigation_channel_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN navigation_channel_id TYPE UUID USING CASE WHEN navigation_channel_id IS NULL OR navigation_channel_id::text = '' THEN NULL ELSE navigation_channel_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS detailed_location VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'detailed_location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN detailed_location TYPE VARCHAR(500) USING detailed_location::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS construction_grade INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'construction_grade' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN construction_grade TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS structure_type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'structure_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN structure_type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS width NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'width' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN width TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS current_water_depth VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'current_water_depth' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN current_water_depth TYPE VARCHAR(20) USING current_water_depth::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS design_bed_elevation VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'design_bed_elevation' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN design_bed_elevation TYPE VARCHAR(20) USING design_bed_elevation::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS published_vessel_dwt VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'published_vessel_dwt' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN published_vessel_dwt TYPE VARCHAR(20) USING published_vessel_dwt::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS maintenance_approval_date VARCHAR(7);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'maintenance_approval_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN maintenance_approval_date TYPE VARCHAR(7) USING maintenance_approval_date::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS safety_assessment_date VARCHAR(7);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'safety_assessment_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN safety_assessment_date TYPE VARCHAR(7) USING safety_assessment_date::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS last_inspection_date VARCHAR(7);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'last_inspection_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN last_inspection_date TYPE VARCHAR(7) USING last_inspection_date::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS operating_pier_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'operating_pier_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN operating_pier_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS published_pier_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'published_pier_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN published_pier_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS investment_agreement_pier_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'investment_agreement_pier_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN investment_agreement_pier_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS cargo_throughput NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'cargo_throughput' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN cargo_throughput TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS receives_large_vessel BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'receives_large_vessel' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN receives_large_vessel TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS document_number VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'document_number' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN document_number TYPE VARCHAR(200) USING document_number::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS document_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'document_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN document_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS opening_announcement_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'opening_announcement_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN opening_announcement_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS opening_decision VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'opening_decision' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN opening_decision TYPE VARCHAR(200) USING opening_decision::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS investment_agreement_doc VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'investment_agreement_doc' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN investment_agreement_doc TYPE VARCHAR(2000) USING investment_agreement_doc::text;
    END IF;
END $$;
ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS water_area_neutral_scope VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'piers' AND column_name = 'water_area_neutral_scope' AND udt_name = 'uuid') THEN
        ALTER TABLE public.piers ALTER COLUMN water_area_neutral_scope TYPE VARCHAR(2000) USING water_area_neutral_scope::text;
    END IF;
END $$;

-- Table: planning_adjustments
CREATE TABLE IF NOT EXISTS public.planning_adjustments (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.planning_adjustments ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS port_planning_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'port_planning_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN port_planning_id TYPE UUID USING CASE WHEN port_planning_id IS NULL OR port_planning_id::text = '' THEN NULL ELSE port_planning_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS adjustment_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'adjustment_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN adjustment_type TYPE VARCHAR(100) USING adjustment_type::text;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS reason TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN reason TYPE TEXT USING reason::text;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS detailed_description TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'detailed_description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN detailed_description TYPE TEXT USING detailed_description::text;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS affected_scope VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'affected_scope' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN affected_scope TYPE VARCHAR(500) USING affected_scope::text;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS registrant VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'registrant' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN registrant TYPE VARCHAR(100) USING registrant::text;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'registered_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN registered_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
END $$;
ALTER TABLE public.planning_adjustments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: planning_categories
CREATE TABLE IF NOT EXISTS public.planning_categories (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_categories' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.planning_categories ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.planning_categories ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.planning_categories ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.planning_categories ADD COLUMN IF NOT EXISTS port_planning_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_categories' AND column_name = 'port_planning_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.planning_categories ALTER COLUMN port_planning_id TYPE UUID USING CASE WHEN port_planning_id IS NULL OR port_planning_id::text = '' THEN NULL ELSE port_planning_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.planning_categories ADD COLUMN IF NOT EXISTS category_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_categories' AND column_name = 'category_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_categories ALTER COLUMN category_name TYPE VARCHAR(200) USING category_name::text;
    END IF;
END $$;
ALTER TABLE public.planning_categories ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_categories' AND column_name = 'unit_of_measure' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_categories ALTER COLUMN unit_of_measure TYPE VARCHAR(50) USING unit_of_measure::text;
    END IF;
END $$;
ALTER TABLE public.planning_categories ADD COLUMN IF NOT EXISTS planned_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_categories' AND column_name = 'planned_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_categories ALTER COLUMN planned_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.planning_categories ADD COLUMN IF NOT EXISTS actual_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_categories' AND column_name = 'actual_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_categories ALTER COLUMN actual_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.planning_categories ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_categories' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_categories ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;

-- Table: planning_files
CREATE TABLE IF NOT EXISTS public.planning_files (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.planning_files ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.planning_files ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.planning_files ADD COLUMN IF NOT EXISTS port_planning_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'port_planning_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN port_planning_id TYPE UUID USING CASE WHEN port_planning_id IS NULL OR port_planning_id::text = '' THEN NULL ELSE port_planning_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.planning_files ADD COLUMN IF NOT EXISTS file_name VARCHAR(300);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN file_name TYPE VARCHAR(300) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.planning_files ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'file_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN file_type TYPE VARCHAR(50) USING file_type::text;
    END IF;
END $$;
ALTER TABLE public.planning_files ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.planning_files ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.planning_files ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'uploaded_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN uploaded_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.planning_files ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
END $$;

-- Table: point_attachments
CREATE TABLE IF NOT EXISTS public.point_attachments (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_attachments' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.point_attachments ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.point_attachments ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.point_attachments ADD COLUMN IF NOT EXISTS object_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_attachments' AND column_name = 'object_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_attachments ALTER COLUMN object_id TYPE VARCHAR(500) USING object_id::text;
    END IF;
END $$;
ALTER TABLE public.point_attachments ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_attachments' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_attachments ALTER COLUMN file_name TYPE VARCHAR(255) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.point_attachments ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_attachments' AND column_name = 'file_url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_attachments ALTER COLUMN file_url TYPE VARCHAR(500) USING file_url::text;
    END IF;
END $$;
ALTER TABLE public.point_attachments ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_attachments' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_attachments ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.point_attachments ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_attachments' AND column_name = 'mime_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_attachments ALTER COLUMN mime_type TYPE VARCHAR(100) USING mime_type::text;
    END IF;
END $$;

-- Table: point_history
CREATE TABLE IF NOT EXISTS public.point_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.point_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.point_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.point_history ADD COLUMN IF NOT EXISTS object_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_history' AND column_name = 'object_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_history ALTER COLUMN object_id TYPE VARCHAR(500) USING object_id::text;
    END IF;
END $$;
ALTER TABLE public.point_history ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_history' AND column_name = 'action_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_history ALTER COLUMN action_type TYPE VARCHAR(50) USING action_type::text;
    END IF;
END $$;
ALTER TABLE public.point_history ADD COLUMN IF NOT EXISTS previous_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_history' AND column_name = 'previous_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_history ALTER COLUMN previous_value TYPE TEXT USING previous_value::text;
    END IF;
END $$;
ALTER TABLE public.point_history ADD COLUMN IF NOT EXISTS new_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_history' AND column_name = 'new_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_history ALTER COLUMN new_value TYPE TEXT USING new_value::text;
    END IF;
END $$;
ALTER TABLE public.point_history ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_history' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.point_history ALTER COLUMN reason TYPE VARCHAR(500) USING reason::text;
    END IF;
END $$;

-- Table: polygon_attachments
CREATE TABLE IF NOT EXISTS public.polygon_attachments (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_attachments' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.polygon_attachments ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.polygon_attachments ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.polygon_attachments ADD COLUMN IF NOT EXISTS object_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_attachments' AND column_name = 'object_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_attachments ALTER COLUMN object_id TYPE VARCHAR(500) USING object_id::text;
    END IF;
END $$;
ALTER TABLE public.polygon_attachments ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_attachments' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_attachments ALTER COLUMN file_name TYPE VARCHAR(255) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.polygon_attachments ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_attachments' AND column_name = 'file_url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_attachments ALTER COLUMN file_url TYPE VARCHAR(500) USING file_url::text;
    END IF;
END $$;
ALTER TABLE public.polygon_attachments ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_attachments' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_attachments ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.polygon_attachments ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_attachments' AND column_name = 'mime_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_attachments ALTER COLUMN mime_type TYPE VARCHAR(100) USING mime_type::text;
    END IF;
END $$;

-- Table: polygon_categories
CREATE TABLE IF NOT EXISTS public.polygon_categories (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_categories' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.polygon_categories ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.polygon_categories ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.polygon_categories ADD COLUMN IF NOT EXISTS name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_categories' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_categories ALTER COLUMN name TYPE VARCHAR(100) USING name::text;
    END IF;
END $$;
ALTER TABLE public.polygon_categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_categories' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_categories ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.polygon_categories ADD COLUMN IF NOT EXISTS description VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_categories' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_categories ALTER COLUMN description TYPE VARCHAR(500) USING description::text;
    END IF;
END $$;
ALTER TABLE public.polygon_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_categories' AND column_name = 'sort_order' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_categories ALTER COLUMN sort_order TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: polygon_history
CREATE TABLE IF NOT EXISTS public.polygon_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.polygon_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.polygon_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.polygon_history ADD COLUMN IF NOT EXISTS object_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_history' AND column_name = 'object_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_history ALTER COLUMN object_id TYPE VARCHAR(500) USING object_id::text;
    END IF;
END $$;
ALTER TABLE public.polygon_history ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_history' AND column_name = 'action_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_history ALTER COLUMN action_type TYPE VARCHAR(50) USING action_type::text;
    END IF;
END $$;
ALTER TABLE public.polygon_history ADD COLUMN IF NOT EXISTS previous_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_history' AND column_name = 'previous_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_history ALTER COLUMN previous_value TYPE TEXT USING previous_value::text;
    END IF;
END $$;
ALTER TABLE public.polygon_history ADD COLUMN IF NOT EXISTS new_value TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_history' AND column_name = 'new_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_history ALTER COLUMN new_value TYPE TEXT USING new_value::text;
    END IF;
END $$;
ALTER TABLE public.polygon_history ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_history' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_history ALTER COLUMN reason TYPE VARCHAR(500) USING reason::text;
    END IF;
END $$;

-- Table: polygon_overlaps
CREATE TABLE IF NOT EXISTS public.polygon_overlaps (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_overlaps' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.polygon_overlaps ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.polygon_overlaps ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.polygon_overlaps ADD COLUMN IF NOT EXISTS polygon_id_a VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_overlaps' AND column_name = 'polygon_id_a' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_overlaps ALTER COLUMN polygon_id_a TYPE VARCHAR(500) USING polygon_id_a::text;
    END IF;
END $$;
ALTER TABLE public.polygon_overlaps ADD COLUMN IF NOT EXISTS polygon_id_b VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_overlaps' AND column_name = 'polygon_id_b' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_overlaps ALTER COLUMN polygon_id_b TYPE VARCHAR(500) USING polygon_id_b::text;
    END IF;
END $$;
ALTER TABLE public.polygon_overlaps ADD COLUMN IF NOT EXISTS overlap_area NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_overlaps' AND column_name = 'overlap_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.polygon_overlaps ALTER COLUMN overlap_area TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;

-- Table: port_attachments
CREATE TABLE IF NOT EXISTS public.port_attachments (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.port_attachments ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.port_attachments ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.port_attachments ADD COLUMN IF NOT EXISTS port_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'port_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN port_id TYPE UUID USING CASE WHEN port_id IS NULL OR port_id::text = '' THEN NULL ELSE port_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.port_attachments ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN file_name TYPE VARCHAR(255) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.port_attachments ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.port_attachments ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_attachments ADD COLUMN IF NOT EXISTS content_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'content_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN content_type TYPE VARCHAR(100) USING content_type::text;
    END IF;
END $$;
ALTER TABLE public.port_attachments ADD COLUMN IF NOT EXISTS uploaded_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'uploaded_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN uploaded_by TYPE UUID USING CASE WHEN uploaded_by IS NULL OR uploaded_by::text = '' THEN NULL ELSE uploaded_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.port_attachments ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'uploaded_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN uploaded_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_attachments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: port_infrastructures
CREATE TABLE IF NOT EXISTS public.port_infrastructures (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_infrastructures' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.port_infrastructures ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.port_infrastructures ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.port_infrastructures ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.port_infrastructures ADD COLUMN IF NOT EXISTS port_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_infrastructures' AND column_name = 'port_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.port_infrastructures ALTER COLUMN port_id TYPE UUID USING CASE WHEN port_id IS NULL OR port_id::text = '' THEN NULL ELSE port_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.port_infrastructures ADD COLUMN IF NOT EXISTS sequence_number INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_infrastructures' AND column_name = 'sequence_number' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_infrastructures ALTER COLUMN sequence_number TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_infrastructures ADD COLUMN IF NOT EXISTS infrastructure_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_infrastructures' AND column_name = 'infrastructure_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_infrastructures ALTER COLUMN infrastructure_name TYPE VARCHAR(255) USING infrastructure_name::text;
    END IF;
END $$;
ALTER TABLE public.port_infrastructures ADD COLUMN IF NOT EXISTS quantity INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_infrastructures' AND column_name = 'quantity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_infrastructures ALTER COLUMN quantity TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_infrastructures ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_infrastructures' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_infrastructures ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_infrastructures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_infrastructures' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_infrastructures ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: port_operations
CREATE TABLE IF NOT EXISTS public.port_operations (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_operations' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.port_operations ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.port_operations ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.port_operations ADD COLUMN IF NOT EXISTS port_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_operations' AND column_name = 'port_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_operations ALTER COLUMN port_code TYPE VARCHAR(50) USING port_code::text;
    END IF;
END $$;
ALTER TABLE public.port_operations ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_operations' AND column_name = 'arrival_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_operations ALTER COLUMN arrival_time TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_operations ADD COLUMN IF NOT EXISTS departure_time TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_operations' AND column_name = 'departure_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_operations ALTER COLUMN departure_time TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_operations ADD COLUMN IF NOT EXISTS cargo_quantity BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_operations' AND column_name = 'cargo_quantity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_operations ALTER COLUMN cargo_quantity TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_operations ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_operations' AND column_name = 'operation_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_operations ALTER COLUMN operation_type TYPE VARCHAR(50) USING operation_type::text;
    END IF;
END $$;

-- Table: port_planning
CREATE TABLE IF NOT EXISTS public.port_planning (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.port_planning ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS project_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'project_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN project_name TYPE VARCHAR(200) USING project_name::text;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS approval_authority VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'approval_authority' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN approval_authority TYPE VARCHAR(200) USING approval_authority::text;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS approval_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'approval_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN approval_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS application_scope VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'application_scope' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN application_scope TYPE VARCHAR(500) USING application_scope::text;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS map_scale VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'map_scale' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN map_scale TYPE VARCHAR(50) USING map_scale::text;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'created_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::text;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
END $$;
ALTER TABLE public.port_planning ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: ports
CREATE TABLE IF NOT EXISTS public.ports (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.ports ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS port_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'port_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN port_code TYPE VARCHAR(50) USING port_code::text;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS port_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'port_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN port_name TYPE VARCHAR(255) USING port_name::text;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS province VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'province' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN province TYPE VARCHAR(100) USING province::text;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS area NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN area TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS max_vessel_capacity NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'max_vessel_capacity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN max_vessel_capacity TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'operational_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN operational_status TYPE VARCHAR(50) USING operational_status::text;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS port_group INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'port_group' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN port_group TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS map_symbol_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'map_symbol_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN map_symbol_id TYPE UUID USING CASE WHEN map_symbol_id IS NULL OR map_symbol_id::text = '' THEN NULL ELSE map_symbol_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS detailed_location VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'detailed_location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN detailed_location TYPE VARCHAR(500) USING detailed_location::text;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS port_class INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'port_class' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN port_class TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS coordinate_system INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'coordinate_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN coordinate_system TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS display_rule INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'display_rule' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN display_rule TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS water_area_scope VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'water_area_scope' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN water_area_scope TYPE VARCHAR(2000) USING water_area_scope::text;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_berths INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_berths' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_berths TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_anchorages_transshipment INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_anchorages_transshipment' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_anchorages_transshipment TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_public_channels INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_public_channels' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_public_channels TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_dedicated_channels INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_dedicated_channels' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_dedicated_channels TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_public_channel_length NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_public_channel_length' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_public_channel_length TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_dedicated_channel_length NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_dedicated_channel_length' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_dedicated_channel_length TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_buoys_beacons INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_buoys_beacons' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_buoys_beacons TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_dikes INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_dikes' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_dikes TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_dike_length NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_dike_length' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_dike_length TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS total_lighthouses INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'total_lighthouses' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN total_lighthouses TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS buoy_berth_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'buoy_berth_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN buoy_berth_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS anchorage_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'anchorage_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN anchorage_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS transshipment_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'transshipment_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN transshipment_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS other_water_areas VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'other_water_areas' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN other_water_areas TYPE VARCHAR(2000) USING other_water_areas::text;
    END IF;
END $$;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS remarks VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'remarks' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ports ALTER COLUMN remarks TYPE VARCHAR(2000) USING remarks::text;
    END IF;
END $$;

-- Table: processing_progress
CREATE TABLE IF NOT EXISTS public.processing_progress (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'processing_progress' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.processing_progress ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.processing_progress ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.processing_progress ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.processing_progress ADD COLUMN IF NOT EXISTS incident_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'processing_progress' AND column_name = 'incident_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.processing_progress ALTER COLUMN incident_id TYPE UUID USING CASE WHEN incident_id IS NULL OR incident_id::text = '' THEN NULL ELSE incident_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.processing_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'processing_progress' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.processing_progress ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.processing_progress ADD COLUMN IF NOT EXISTS progress_description TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'processing_progress' AND column_name = 'progress_description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.processing_progress ALTER COLUMN progress_description TYPE TEXT USING progress_description::text;
    END IF;
END $$;
ALTER TABLE public.processing_progress ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'processing_progress' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.processing_progress ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
END $$;

-- Table: radar_station
CREATE TABLE IF NOT EXISTS public.radar_station (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.radar_station ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'station_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN station_name TYPE VARCHAR(255) USING station_name::text;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS location VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN location TYPE VARCHAR(500) USING location::text;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS station_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'station_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN station_type TYPE VARCHAR(100) USING station_type::text;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS coverage VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'coverage' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN coverage TYPE VARCHAR(100) USING coverage::text;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS emission_area NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'emission_area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN emission_area TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS source VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'source' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN source TYPE VARCHAR(255) USING source::text;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS condition_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'condition_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN condition_status TYPE VARCHAR(50) USING condition_status::text;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS approved_level1 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approved_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approved_level1 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS approver_level1 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approver_level1' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL ELSE approver_level1::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approved_date_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approved_date_level1 TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS approved_level2 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approved_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approved_level2 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS approver_level2 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approver_level2' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL ELSE approver_level2::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approved_date_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approved_date_level2 TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'rejection_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN rejection_reason TYPE VARCHAR(500) USING rejection_reason::text;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS vts_system_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'vts_system_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN vts_system_id TYPE UUID USING CASE WHEN vts_system_id IS NULL OR vts_system_id::text = '' THEN NULL ELSE vts_system_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS tower_height NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'tower_height' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN tower_height TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS radar_range NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'radar_range' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station ALTER COLUMN radar_range TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;

-- Table: radar_station_attachment
CREATE TABLE IF NOT EXISTS public.radar_station_attachment (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.radar_station_attachment ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.radar_station_attachment ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.radar_station_attachment ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.radar_station_attachment ADD COLUMN IF NOT EXISTS radar_station_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'radar_station_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.radar_station_attachment ALTER COLUMN radar_station_id TYPE UUID USING CASE WHEN radar_station_id IS NULL OR radar_station_id::text = '' THEN NULL ELSE radar_station_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.radar_station_attachment ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station_attachment ALTER COLUMN file_name TYPE VARCHAR(255) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.radar_station_attachment ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station_attachment ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.radar_station_attachment ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station_attachment ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.radar_station_attachment ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'document_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station_attachment ALTER COLUMN document_type TYPE VARCHAR(50) USING document_type::text;
    END IF;
END $$;
ALTER TABLE public.radar_station_attachment ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station_attachment ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
END $$;
ALTER TABLE public.radar_station_attachment ADD COLUMN IF NOT EXISTS uploaded_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'uploaded_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station_attachment ALTER COLUMN uploaded_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: report_kchtg
CREATE TABLE IF NOT EXISTS public.report_kchtg (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_kchtg' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.report_kchtg ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.report_kchtg ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.report_kchtg ADD COLUMN IF NOT EXISTS total_assets BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_kchtg' AND column_name = 'total_assets' AND udt_name = 'uuid') THEN
        ALTER TABLE public.report_kchtg ALTER COLUMN total_assets TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.report_kchtg ADD COLUMN IF NOT EXISTS total_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_kchtg' AND column_name = 'total_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.report_kchtg ALTER COLUMN total_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.report_kchtg ADD COLUMN IF NOT EXISTS ports_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_kchtg' AND column_name = 'ports_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.report_kchtg ALTER COLUMN ports_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.report_kchtg ADD COLUMN IF NOT EXISTS maintenance_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_kchtg' AND column_name = 'maintenance_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.report_kchtg ALTER COLUMN maintenance_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.report_kchtg ADD COLUMN IF NOT EXISTS navigation_signals_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_kchtg' AND column_name = 'navigation_signals_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.report_kchtg ALTER COLUMN navigation_signals_count TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.roles ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.roles ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.roles ALTER COLUMN name TYPE VARCHAR(100) USING name::text;
    END IF;
END $$;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.roles ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS description VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.roles ALTER COLUMN description TYPE VARCHAR(500) USING description::text;
    END IF;
END $$;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS level INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.roles ALTER COLUMN level TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'is_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.roles ALTER COLUMN is_system TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS hierarchy_depth INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'hierarchy_depth' AND udt_name = 'uuid') THEN
        ALTER TABLE public.roles ALTER COLUMN hierarchy_depth TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.roles ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS user_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'user_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.roles ALTER COLUMN user_count TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: s63_permits
CREATE TABLE IF NOT EXISTS public.s63_permits (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 's63_permits' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.s63_permits ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.s63_permits ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.s63_permits ADD COLUMN IF NOT EXISTS cell_name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 's63_permits' AND column_name = 'cell_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.s63_permits ALTER COLUMN cell_name TYPE VARCHAR(100) USING cell_name::text;
    END IF;
END $$;
ALTER TABLE public.s63_permits ADD COLUMN IF NOT EXISTS permit_key VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 's63_permits' AND column_name = 'permit_key' AND udt_name = 'uuid') THEN
        ALTER TABLE public.s63_permits ALTER COLUMN permit_key TYPE VARCHAR(200) USING permit_key::text;
    END IF;
END $$;
ALTER TABLE public.s63_permits ADD COLUMN IF NOT EXISTS expiry_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 's63_permits' AND column_name = 'expiry_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.s63_permits ALTER COLUMN expiry_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.s63_permits ADD COLUMN IF NOT EXISTS active BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 's63_permits' AND column_name = 'active' AND udt_name = 'uuid') THEN
        ALTER TABLE public.s63_permits ALTER COLUMN active TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: search_logs
CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.search_logs ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.search_logs ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.search_logs ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.search_logs ADD COLUMN IF NOT EXISTS searched_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_logs' AND column_name = 'searched_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_logs ALTER COLUMN searched_by TYPE VARCHAR(100) USING searched_by::text;
    END IF;
END $$;
ALTER TABLE public.search_logs ADD COLUMN IF NOT EXISTS keyword VARCHAR(300);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_logs' AND column_name = 'keyword' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_logs ALTER COLUMN keyword TYPE VARCHAR(300) USING keyword::text;
    END IF;
END $$;
ALTER TABLE public.search_logs ADD COLUMN IF NOT EXISTS filters VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_logs' AND column_name = 'filters' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_logs ALTER COLUMN filters TYPE VARCHAR(200) USING filters::text;
    END IF;
END $$;
ALTER TABLE public.search_logs ADD COLUMN IF NOT EXISTS result_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_logs' AND column_name = 'result_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_logs ALTER COLUMN result_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.search_logs ADD COLUMN IF NOT EXISTS searched_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_logs' AND column_name = 'searched_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_logs ALTER COLUMN searched_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: search_queries
CREATE TABLE IF NOT EXISTS public.search_queries (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_queries' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.search_queries ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.search_queries ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.search_queries ADD COLUMN IF NOT EXISTS user_id BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_queries' AND column_name = 'user_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_queries ALTER COLUMN user_id TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.search_queries ADD COLUMN IF NOT EXISTS query_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_queries' AND column_name = 'query_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_queries ALTER COLUMN query_type TYPE VARCHAR(50) USING query_type::text;
    END IF;
END $$;
ALTER TABLE public.search_queries ADD COLUMN IF NOT EXISTS query_text VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_queries' AND column_name = 'query_text' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_queries ALTER COLUMN query_text TYPE VARCHAR(1000) USING query_text::text;
    END IF;
END $$;
ALTER TABLE public.search_queries ADD COLUMN IF NOT EXISTS query_params TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_queries' AND column_name = 'query_params' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_queries ALTER COLUMN query_params TYPE TEXT USING query_params::text;
    END IF;
END $$;
ALTER TABLE public.search_queries ADD COLUMN IF NOT EXISTS result_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_queries' AND column_name = 'result_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_queries ALTER COLUMN result_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.search_queries ADD COLUMN IF NOT EXISTS duration_ms BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_queries' AND column_name = 'duration_ms' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_queries ALTER COLUMN duration_ms TYPE BIGINT USING NULL;
    END IF;
END $$;

-- Table: search_results
CREATE TABLE IF NOT EXISTS public.search_results (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.search_results ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS document_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'document_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN document_id TYPE UUID USING CASE WHEN document_id IS NULL OR document_id::text = '' THEN NULL ELSE document_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS document_name VARCHAR(300);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'document_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN document_name TYPE VARCHAR(300) USING document_name::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS document_number VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'document_number' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN document_number TYPE VARCHAR(100) USING document_number::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'issuing_authority' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN issuing_authority TYPE VARCHAR(200) USING issuing_authority::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS issue_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'issue_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN issue_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS relevance_score VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'relevance_score' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN relevance_score TYPE VARCHAR(500) USING relevance_score::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS summary TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'summary' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN summary TYPE TEXT USING summary::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS query_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'query_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN query_id TYPE VARCHAR(500) USING query_id::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS object_id VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'object_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN object_id TYPE VARCHAR(500) USING object_id::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS object_type VARCHAR(30);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'object_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN object_type TYPE VARCHAR(30) USING object_type::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN name TYPE VARCHAR(200) USING name::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS distance DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'distance' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN distance TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.search_results ADD COLUMN IF NOT EXISTS highlighted BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_results' AND column_name = 'highlighted' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_results ALTER COLUMN highlighted TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: search_suggestions
CREATE TABLE IF NOT EXISTS public.search_suggestions (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_suggestions' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.search_suggestions ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.search_suggestions ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.search_suggestions ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.search_suggestions ADD COLUMN IF NOT EXISTS keyword VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_suggestions' AND column_name = 'keyword' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_suggestions ALTER COLUMN keyword TYPE VARCHAR(200) USING keyword::text;
    END IF;
END $$;
ALTER TABLE public.search_suggestions ADD COLUMN IF NOT EXISTS search_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_suggestions' AND column_name = 'search_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_suggestions ALTER COLUMN search_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.search_suggestions ADD COLUMN IF NOT EXISTS last_searched TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_suggestions' AND column_name = 'last_searched' AND udt_name = 'uuid') THEN
        ALTER TABLE public.search_suggestions ALTER COLUMN last_searched TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: share_history
CREATE TABLE IF NOT EXISTS public.share_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'share_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.share_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.share_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.share_history ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.share_history ADD COLUMN IF NOT EXISTS shared_data_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'share_history' AND column_name = 'shared_data_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.share_history ALTER COLUMN shared_data_id TYPE UUID USING CASE WHEN shared_data_id IS NULL OR shared_data_id::text = '' THEN NULL ELSE shared_data_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.share_history ADD COLUMN IF NOT EXISTS action VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'share_history' AND column_name = 'action' AND udt_name = 'uuid') THEN
        ALTER TABLE public.share_history ALTER COLUMN action TYPE VARCHAR(500) USING action::text;
    END IF;
END $$;
ALTER TABLE public.share_history ADD COLUMN IF NOT EXISTS actor UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'share_history' AND column_name = 'actor' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.share_history ALTER COLUMN actor TYPE UUID USING CASE WHEN actor IS NULL OR actor::text = '' THEN NULL ELSE actor::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.share_history ADD COLUMN IF NOT EXISTS recipient VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'share_history' AND column_name = 'recipient' AND udt_name = 'uuid') THEN
        ALTER TABLE public.share_history ALTER COLUMN recipient TYPE VARCHAR(500) USING recipient::text;
    END IF;
END $$;
ALTER TABLE public.share_history ADD COLUMN IF NOT EXISTS comments VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'share_history' AND column_name = 'comments' AND udt_name = 'uuid') THEN
        ALTER TABLE public.share_history ALTER COLUMN comments TYPE VARCHAR(1000) USING comments::text;
    END IF;
END $$;
ALTER TABLE public.share_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'share_history' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.share_history ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: shared_data
CREATE TABLE IF NOT EXISTS public.shared_data (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.shared_data ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS code VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN code TYPE VARCHAR(500) USING code::text;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS name VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN name TYPE VARCHAR(500) USING name::text;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS status VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN status TYPE VARCHAR(500) USING status::text;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS data_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'data_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN data_type TYPE VARCHAR(50) USING data_type::text;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS share_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'share_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN share_status TYPE VARCHAR(50) USING share_status::text;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS shared_with VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'shared_with' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN shared_with TYPE VARCHAR(500) USING shared_with::text;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS shared_at DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'shared_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN shared_at TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS expires_at DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'expires_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN expires_at TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'file_url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN file_url TYPE VARCHAR(500) USING file_url::text;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS file_format VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'file_format' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN file_format TYPE VARCHAR(500) USING file_format::text;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS record_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'record_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN record_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS description VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN description TYPE VARCHAR(2000) USING description::text;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS approved_at DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN approved_at TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS shared_created TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'shared_created' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN shared_created TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.shared_data ADD COLUMN IF NOT EXISTS shared_updated TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'shared_updated' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN shared_updated TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: ship_repair_facility
CREATE TABLE IF NOT EXISTS public.ship_repair_facility (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.ship_repair_facility ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS facility_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'facility_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN facility_name TYPE VARCHAR(255) USING facility_name::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS address VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'address' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN address TYPE VARCHAR(500) USING address::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN phone TYPE VARCHAR(20) USING phone::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS email VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'email' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN email TYPE VARCHAR(100) USING email::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS facility_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'facility_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN facility_type TYPE VARCHAR(50) USING facility_type::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS capacity VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'capacity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN capacity TYPE VARCHAR(255) USING capacity::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS authority VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'authority' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN authority TYPE VARCHAR(255) USING authority::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS approved_level1 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approved_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approved_level1 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS approver_level1 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approver_level1' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL ELSE approver_level1::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approved_date_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approved_date_level1 TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS approved_level2 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approved_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approved_level2 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS approver_level2 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approver_level2' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL ELSE approver_level2::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approved_date_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approved_date_level2 TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'rejection_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN rejection_reason TYPE VARCHAR(500) USING rejection_reason::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS created_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'created_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN created_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS updated_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'updated_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN updated_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'is_deleted' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN is_deleted TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility ADD COLUMN IF NOT EXISTS deleted_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'deleted_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN deleted_by TYPE UUID USING CASE WHEN deleted_by IS NULL OR deleted_by::text = '' THEN NULL ELSE deleted_by::text::uuid END;
    END IF;
END $$;

-- Table: ship_repair_facility_attachment
CREATE TABLE IF NOT EXISTS public.ship_repair_facility_attachment (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility_attachment ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.ship_repair_facility_attachment ADD COLUMN IF NOT EXISTS ship_repair_facility_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'ship_repair_facility_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN ship_repair_facility_id TYPE UUID USING CASE WHEN ship_repair_facility_id IS NULL OR ship_repair_facility_id::text = '' THEN NULL ELSE ship_repair_facility_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility_attachment ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN file_name TYPE VARCHAR(255) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility_attachment ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility_attachment ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility_attachment ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'document_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN document_type TYPE VARCHAR(50) USING document_type::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility_attachment ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
END $$;
ALTER TABLE public.ship_repair_facility_attachment ADD COLUMN IF NOT EXISTS uploaded_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'uploaded_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN uploaded_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: siem_reports
CREATE TABLE IF NOT EXISTS public.siem_reports (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.siem_reports ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS format VARCHAR(10);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'format' AND udt_name = 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN format TYPE VARCHAR(10) USING format::text;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN version TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS content BYTEA;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'content' AND udt_name = 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN content TYPE BYTEA USING NULL;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS content_type VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'content_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN content_type TYPE VARCHAR(100) USING content_type::text;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'file_size_bytes' AND udt_name = 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN file_size_bytes TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'generated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN generated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'is_scheduled' AND udt_name = 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN is_scheduled TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.siem_reports ADD COLUMN IF NOT EXISTS cron_expression VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siem_reports' AND column_name = 'cron_expression' AND udt_name = 'uuid') THEN
        ALTER TABLE public.siem_reports ALTER COLUMN cron_expression TYPE VARCHAR(50) USING cron_expression::text;
    END IF;
END $$;

-- Table: spatial_object_categories
CREATE TABLE IF NOT EXISTS public.spatial_object_categories (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spatial_object_categories' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.spatial_object_categories ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.spatial_object_categories ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.spatial_object_categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spatial_object_categories' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.spatial_object_categories ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.spatial_object_categories ADD COLUMN IF NOT EXISTS name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spatial_object_categories' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.spatial_object_categories ALTER COLUMN name TYPE VARCHAR(255) USING name::text;
    END IF;
END $$;
ALTER TABLE public.spatial_object_categories ADD COLUMN IF NOT EXISTS geometry_type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spatial_object_categories' AND column_name = 'geometry_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.spatial_object_categories ALTER COLUMN geometry_type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.spatial_object_categories ADD COLUMN IF NOT EXISTS icon_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spatial_object_categories' AND column_name = 'icon_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.spatial_object_categories ALTER COLUMN icon_id TYPE UUID USING CASE WHEN icon_id IS NULL OR icon_id::text = '' THEN NULL ELSE icon_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.spatial_object_categories ADD COLUMN IF NOT EXISTS status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spatial_object_categories' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.spatial_object_categories ALTER COLUMN status TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: station_history
CREATE TABLE IF NOT EXISTS public.station_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.station_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS station_type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'station_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN station_type TYPE VARCHAR(500) USING station_type::text;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS entity_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'entity_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN entity_id TYPE UUID USING CASE WHEN entity_id IS NULL OR entity_id::text = '' THEN NULL ELSE entity_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS action_type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'action_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN action_type TYPE VARCHAR(500) USING action_type::text;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS changed_field VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'changed_field' AND udt_name = 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN changed_field TYPE VARCHAR(500) USING changed_field::text;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS previous_value VARCHAR(4000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'previous_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN previous_value TYPE VARCHAR(4000) USING previous_value::text;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS new_value VARCHAR(4000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'new_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN new_value TYPE VARCHAR(4000) USING new_value::text;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS changed_by BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'changed_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN changed_by TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS changed_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'changed_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN changed_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS reason VARCHAR(1000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN reason TYPE VARCHAR(1000) USING reason::text;
    END IF;
END $$;
ALTER TABLE public.station_history ADD COLUMN IF NOT EXISTS diff_data VARCHAR(4000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'station_history' AND column_name = 'diff_data' AND udt_name = 'uuid') THEN
        ALTER TABLE public.station_history ALTER COLUMN diff_data TYPE VARCHAR(4000) USING diff_data::text;
    END IF;
END $$;

-- Table: statistics_forms
CREATE TABLE IF NOT EXISTS public.statistics_forms (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.statistics_forms ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS form_code VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'form_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN form_code TYPE VARCHAR(500) USING form_code::text;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS form_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'form_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN form_type TYPE VARCHAR(50) USING form_type::text;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS form_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'form_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN form_status TYPE VARCHAR(50) USING form_status::text;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS reporting_period VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'reporting_period' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN reporting_period TYPE VARCHAR(500) USING reporting_period::text;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS period_type VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'period_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN period_type TYPE VARCHAR(500) USING period_type::text;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS start_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'start_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN start_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS end_date DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'end_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN end_date TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS total_value NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'total_value' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN total_value TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS total_units BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'total_units' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN total_units TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS ports_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'ports_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN ports_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS vessels_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'vessels_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN vessels_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS parameters TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'parameters' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN parameters TYPE TEXT USING parameters::text;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'file_url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN file_url TYPE VARCHAR(500) USING file_url::text;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL ELSE approved_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS approved_at DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'approved_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN approved_at TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.statistics_forms ADD COLUMN IF NOT EXISTS notes VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'notes' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN notes TYPE VARCHAR(500) USING notes::text;
    END IF;
END $$;

-- Table: symbol_library
CREATE TABLE IF NOT EXISTS public.symbol_library (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.symbol_library ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN name TYPE VARCHAR(200) USING name::text;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS format VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'format' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN format TYPE VARCHAR(50) USING format::text;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN file_name TYPE VARCHAR(255) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS file_path VARCHAR(1024);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN file_path TYPE VARCHAR(1024) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS uploaded_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'uploaded_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN uploaded_by TYPE UUID USING CASE WHEN uploaded_by IS NULL OR uploaded_by::text = '' THEN NULL ELSE uploaded_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'uploaded_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN uploaded_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS description TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN description TYPE TEXT USING description::text;
    END IF;
END $$;
ALTER TABLE public.symbol_library ADD COLUMN IF NOT EXISTS sld_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'sld_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN sld_path TYPE VARCHAR(500) USING sld_path::text;
    END IF;
END $$;

-- Table: symbol_usages
CREATE TABLE IF NOT EXISTS public.symbol_usages (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_usages' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.symbol_usages ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.symbol_usages ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.symbol_usages ADD COLUMN IF NOT EXISTS symbol_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_usages' AND column_name = 'symbol_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.symbol_usages ALTER COLUMN symbol_id TYPE UUID USING CASE WHEN symbol_id IS NULL OR symbol_id::text = '' THEN NULL ELSE symbol_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.symbol_usages ADD COLUMN IF NOT EXISTS object_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_usages' AND column_name = 'object_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.symbol_usages ALTER COLUMN object_id TYPE UUID USING CASE WHEN object_id IS NULL OR object_id::text = '' THEN NULL ELSE object_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.symbol_usages ADD COLUMN IF NOT EXISTS object_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_usages' AND column_name = 'object_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_usages ALTER COLUMN object_type TYPE VARCHAR(50) USING object_type::text;
    END IF;
END $$;
ALTER TABLE public.symbol_usages ADD COLUMN IF NOT EXISTS used_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_usages' AND column_name = 'used_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.symbol_usages ALTER COLUMN used_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.symbol_usages ADD COLUMN IF NOT EXISTS used_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_usages' AND column_name = 'used_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.symbol_usages ALTER COLUMN used_by TYPE UUID USING CASE WHEN used_by IS NULL OR used_by::text = '' THEN NULL ELSE used_by::text::uuid END;
    END IF;
END $$;

-- Table: sync_logs
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.sync_logs ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS connection_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'connection_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN connection_id TYPE UUID USING CASE WHEN connection_id IS NULL OR connection_id::text = '' THEN NULL ELSE connection_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'start_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN start_time TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'end_time' AND udt_name = 'uuid') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN end_time TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS records_processed INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'records_processed' AND udt_name = 'uuid') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN records_processed TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS records_failed INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'records_failed' AND udt_name = 'uuid') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN records_failed TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.sync_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;

-- Table: system_integration_record
CREATE TABLE IF NOT EXISTS public.system_integration_record (
    id VARCHAR(500) PRIMARY KEY
);

ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS id VARCHAR(500);
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS integration_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'integration_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN integration_type TYPE VARCHAR(50) USING integration_type::text;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS source_system VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'source_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN source_system TYPE VARCHAR(100) USING source_system::text;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS target_system VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'target_system' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN target_system TYPE VARCHAR(100) USING target_system::text;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS data_payload TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'data_payload' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN data_payload TYPE TEXT USING data_payload::text;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS error_message TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'error_message' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN error_message TYPE TEXT USING error_message::text;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS integration_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'integration_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN integration_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS retry_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'retry_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN retry_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL ELSE created_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL ELSE updated_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.system_integration_record ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_integration_record' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_integration_record ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: system_menus
CREATE TABLE IF NOT EXISTS public.system_menus (
    menu_code VARCHAR(100) PRIMARY KEY
);

ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS menu_code VARCHAR(100);
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS app_code VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'app_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN app_code TYPE VARCHAR(100) USING app_code::text;
    END IF;
END $$;
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS name VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN name TYPE VARCHAR(500) USING name::text;
    END IF;
END $$;
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS url VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'url' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN url TYPE VARCHAR(500) USING url::text;
    END IF;
END $$;
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS parent_code VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'parent_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN parent_code TYPE VARCHAR(100) USING parent_code::text;
    END IF;
END $$;
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN status TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS order_no INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'order_no' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN order_no TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS level_used INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'level_used' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN level_used TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS level_menu INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'level_menu' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN level_menu TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.system_menus ADD COLUMN IF NOT EXISTS hide_menu BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_menus' AND column_name = 'hide_menu' AND udt_name = 'uuid') THEN
        ALTER TABLE public.system_menus ALTER COLUMN hide_menu TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: tide_data
CREATE TABLE IF NOT EXISTS public.tide_data (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tide_data' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.tide_data ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.tide_data ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.tide_data ADD COLUMN IF NOT EXISTS station_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tide_data' AND column_name = 'station_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.tide_data ALTER COLUMN station_code TYPE VARCHAR(50) USING station_code::text;
    END IF;
END $$;
ALTER TABLE public.tide_data ADD COLUMN IF NOT EXISTS water_level DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tide_data' AND column_name = 'water_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.tide_data ALTER COLUMN water_level TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.tide_data ADD COLUMN IF NOT EXISTS flow_rate DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tide_data' AND column_name = 'flow_rate' AND udt_name = 'uuid') THEN
        ALTER TABLE public.tide_data ALTER COLUMN flow_rate TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.tide_data ADD COLUMN IF NOT EXISTS tide_level DOUBLE PRECISION;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tide_data' AND column_name = 'tide_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.tide_data ALTER COLUMN tide_level TYPE DOUBLE PRECISION USING NULL;
    END IF;
END $$;
ALTER TABLE public.tide_data ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tide_data' AND column_name = 'recorded_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.tide_data ALTER COLUMN recorded_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: trade_flows
CREATE TABLE IF NOT EXISTS public.trade_flows (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trade_flows' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.trade_flows ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.trade_flows ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.trade_flows ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.trade_flows ADD COLUMN IF NOT EXISTS source_port VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trade_flows' AND column_name = 'source_port' AND udt_name = 'uuid') THEN
        ALTER TABLE public.trade_flows ALTER COLUMN source_port TYPE VARCHAR(100) USING source_port::text;
    END IF;
END $$;
ALTER TABLE public.trade_flows ADD COLUMN IF NOT EXISTS dest_port VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trade_flows' AND column_name = 'dest_port' AND udt_name = 'uuid') THEN
        ALTER TABLE public.trade_flows ALTER COLUMN dest_port TYPE VARCHAR(100) USING dest_port::text;
    END IF;
END $$;
ALTER TABLE public.trade_flows ADD COLUMN IF NOT EXISTS cargo_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trade_flows' AND column_name = 'cargo_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.trade_flows ALTER COLUMN cargo_type TYPE VARCHAR(50) USING cargo_type::text;
    END IF;
END $$;
ALTER TABLE public.trade_flows ADD COLUMN IF NOT EXISTS quantity NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trade_flows' AND column_name = 'quantity' AND udt_name = 'uuid') THEN
        ALTER TABLE public.trade_flows ALTER COLUMN quantity TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.trade_flows ADD COLUMN IF NOT EXISTS period VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trade_flows' AND column_name = 'period' AND udt_name = 'uuid') THEN
        ALTER TABLE public.trade_flows ALTER COLUMN period TYPE VARCHAR(20) USING period::text;
    END IF;
END $$;
ALTER TABLE public.trade_flows ADD COLUMN IF NOT EXISTS created_at DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trade_flows' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.trade_flows ALTER COLUMN created_at TYPE DATE USING NULL;
    END IF;
END $$;

-- Table: ts_ql
CREATE TABLE IF NOT EXISTS public.ts_ql (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.ts_ql ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS nhom VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'nhom' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN nhom TYPE VARCHAR(20) USING nhom::text;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS ts_ma VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'ts_ma' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN ts_ma TYPE VARCHAR(50) USING ts_ma::text;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS ts_ten VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'ts_ten' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN ts_ten TYPE VARCHAR(500) USING ts_ten::text;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS don_vi_tinh VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'don_vi_tinh' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN don_vi_tinh TYPE VARCHAR(100) USING don_vi_tinh::text;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS so_luong NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'so_luong' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN so_luong TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS nam_xay_dung INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'nam_xay_dung' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN nam_xay_dung TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS nam_su_dung INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'nam_su_dung' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN nam_su_dung TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS dien_tich_dat NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'dien_tich_dat' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN dien_tich_dat TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS san_su_dung NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'san_su_dung' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN san_su_dung TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS nguyen_gia NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'nguyen_gia' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN nguyen_gia TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS gia_tri_con_lai NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'gia_tri_con_lai' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN gia_tri_con_lai TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS hao_mon_luy_ke NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'hao_mon_luy_ke' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN hao_mon_luy_ke TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS tinh_trang VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'tinh_trang' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN tinh_trang TYPE VARCHAR(200) USING tinh_trang::text;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS ghi_chu VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'ghi_chu' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN ghi_chu TYPE VARCHAR(500) USING ghi_chu::text;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS ngay_ke_khai DATE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'ngay_ke_khai' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN ngay_ke_khai TYPE DATE USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS hinh_thuc_xu_ly VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'hinh_thuc_xu_ly' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN hinh_thuc_xu_ly TYPE VARCHAR(100) USING hinh_thuc_xu_ly::text;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.ts_ql ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ts_ql' AND column_name = 'updated_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ts_ql ALTER COLUMN updated_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: unit_history
CREATE TABLE IF NOT EXISTS public.unit_history (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'unit_history' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.unit_history ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.unit_history ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.unit_history ADD COLUMN IF NOT EXISTS unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'unit_history' AND column_name = 'unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.unit_history ALTER COLUMN unit_id TYPE UUID USING CASE WHEN unit_id IS NULL OR unit_id::text = '' THEN NULL ELSE unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.unit_history ADD COLUMN IF NOT EXISTS unit_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'unit_history' AND column_name = 'unit_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.unit_history ALTER COLUMN unit_name TYPE VARCHAR(200) USING unit_name::text;
    END IF;
END $$;
ALTER TABLE public.unit_history ADD COLUMN IF NOT EXISTS unit_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'unit_history' AND column_name = 'unit_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.unit_history ALTER COLUMN unit_code TYPE VARCHAR(50) USING unit_code::text;
    END IF;
END $$;
ALTER TABLE public.unit_history ADD COLUMN IF NOT EXISTS action VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'unit_history' AND column_name = 'action' AND udt_name = 'uuid') THEN
        ALTER TABLE public.unit_history ALTER COLUMN action TYPE VARCHAR(20) USING action::text;
    END IF;
END $$;
ALTER TABLE public.unit_history ADD COLUMN IF NOT EXISTS details TEXT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'unit_history' AND column_name = 'details' AND udt_name = 'uuid') THEN
        ALTER TABLE public.unit_history ALTER COLUMN details TYPE TEXT USING details::text;
    END IF;
END $$;
ALTER TABLE public.unit_history ADD COLUMN IF NOT EXISTS performed_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'unit_history' AND column_name = 'performed_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.unit_history ALTER COLUMN performed_by TYPE UUID USING CASE WHEN performed_by IS NULL OR performed_by::text = '' THEN NULL ELSE performed_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.unit_history ADD COLUMN IF NOT EXISTS performed_by_name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'unit_history' AND column_name = 'performed_by_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.unit_history ALTER COLUMN performed_by_name TYPE VARCHAR(100) USING performed_by_name::text;
    END IF;
END $$;
ALTER TABLE public.unit_history ADD COLUMN IF NOT EXISTS performed_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'unit_history' AND column_name = 'performed_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.unit_history ALTER COLUMN performed_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: user_groups
CREATE TABLE IF NOT EXISTS public.user_groups (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_groups' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_groups ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.user_groups ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.user_groups ADD COLUMN IF NOT EXISTS name VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_groups' AND column_name = 'name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_groups ALTER COLUMN name TYPE VARCHAR(100) USING name::text;
    END IF;
END $$;
ALTER TABLE public.user_groups ADD COLUMN IF NOT EXISTS code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_groups' AND column_name = 'code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_groups ALTER COLUMN code TYPE VARCHAR(50) USING code::text;
    END IF;
END $$;
ALTER TABLE public.user_groups ADD COLUMN IF NOT EXISTS description VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_groups' AND column_name = 'description' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_groups ALTER COLUMN description TYPE VARCHAR(500) USING description::text;
    END IF;
END $$;
ALTER TABLE public.user_groups ADD COLUMN IF NOT EXISTS group_type INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_groups' AND column_name = 'group_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_groups ALTER COLUMN group_type TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.user_groups ADD COLUMN IF NOT EXISTS status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_groups' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_groups ALTER COLUMN status TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: user_permission_override
CREATE TABLE IF NOT EXISTS public.user_permission_override (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_permission_override' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_permission_override ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.user_permission_override ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.user_permission_override ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_permission_override' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_permission_override ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.user_permission_override ADD COLUMN IF NOT EXISTS permission_code VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_permission_override' AND column_name = 'permission_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_permission_override ALTER COLUMN permission_code TYPE VARCHAR(100) USING permission_code::text;
    END IF;
END $$;
ALTER TABLE public.user_permission_override ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_permission_override' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_permission_override ALTER COLUMN reason TYPE VARCHAR(500) USING reason::text;
    END IF;
END $$;

-- Table: user_roles_tracking
CREATE TABLE IF NOT EXISTS public.user_roles_tracking (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles_tracking' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_roles_tracking ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.user_roles_tracking ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.user_roles_tracking ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles_tracking' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_roles_tracking ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.user_roles_tracking ADD COLUMN IF NOT EXISTS role_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles_tracking' AND column_name = 'role_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_roles_tracking ALTER COLUMN role_id TYPE UUID USING CASE WHEN role_id IS NULL OR role_id::text = '' THEN NULL ELSE role_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.user_roles_tracking ADD COLUMN IF NOT EXISTS assigned_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles_tracking' AND column_name = 'assigned_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_roles_tracking ALTER COLUMN assigned_by TYPE UUID USING CASE WHEN assigned_by IS NULL OR assigned_by::text = '' THEN NULL ELSE assigned_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.user_roles_tracking ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles_tracking' AND column_name = 'assigned_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_roles_tracking ALTER COLUMN assigned_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.user_roles_tracking ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles_tracking' AND column_name = 'expires_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_roles_tracking ALTER COLUMN expires_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.user_roles_tracking ADD COLUMN IF NOT EXISTS is_direct_grant BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles_tracking' AND column_name = 'is_direct_grant' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_roles_tracking ALTER COLUMN is_direct_grant TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: user_status_log
CREATE TABLE IF NOT EXISTS public.user_status_log (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_status_log' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_status_log ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.user_status_log ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.user_status_log ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.user_status_log ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_status_log' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_status_log ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.user_status_log ADD COLUMN IF NOT EXISTS old_status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_status_log' AND column_name = 'old_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_status_log ALTER COLUMN old_status TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.user_status_log ADD COLUMN IF NOT EXISTS new_status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_status_log' AND column_name = 'new_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_status_log ALTER COLUMN new_status TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.user_status_log ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_status_log' AND column_name = 'reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_status_log ALTER COLUMN reason TYPE VARCHAR(500) USING reason::text;
    END IF;
END $$;
ALTER TABLE public.user_status_log ADD COLUMN IF NOT EXISTS operator_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_status_log' AND column_name = 'operator_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.user_status_log ALTER COLUMN operator_id TYPE UUID USING CASE WHEN operator_id IS NULL OR operator_id::text = '' THEN NULL ELSE operator_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.user_status_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_status_log' AND column_name = 'created_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.user_status_log ALTER COLUMN created_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.users ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN username TYPE VARCHAR(100) USING username::text;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN password TYPE VARCHAR(255) USING password::text;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(150);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN email TYPE VARCHAR(150) USING email::text;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN full_name TYPE VARCHAR(200) USING full_name::text;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN phone TYPE VARCHAR(20) USING phone::text;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN status TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_login_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN last_login_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS totp_secret_hash VARCHAR(128);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'totp_secret_hash' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN totp_secret_hash TYPE VARCHAR(128) USING totp_secret_hash::text;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'totp_enabled' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN totp_enabled TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'totp_verified_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN totp_verified_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'totp_secret' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN totp_secret TYPE VARCHAR(255) USING totp_secret::text;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'failed_login_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN failed_login_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS failed_totp_count INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'failed_totp_count' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN failed_totp_count TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'account_locked_until' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN account_locked_until TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN password_hash_version TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'expires_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN expires_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_changed_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_changed_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN last_changed_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permission_version INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'permission_version' AND udt_name = 'uuid') THEN
        ALTER TABLE public.users ALTER COLUMN permission_version TYPE INTEGER USING NULL;
    END IF;
END $$;

-- Table: verification_tokens
CREATE TABLE IF NOT EXISTS public.verification_tokens (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'verification_tokens' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.verification_tokens ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.verification_tokens ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.verification_tokens ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'verification_tokens' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.verification_tokens ALTER COLUMN user_id TYPE UUID USING CASE WHEN user_id IS NULL OR user_id::text = '' THEN NULL ELSE user_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.verification_tokens ADD COLUMN IF NOT EXISTS email VARCHAR(150);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'verification_tokens' AND column_name = 'email' AND udt_name = 'uuid') THEN
        ALTER TABLE public.verification_tokens ALTER COLUMN email TYPE VARCHAR(150) USING email::text;
    END IF;
END $$;
ALTER TABLE public.verification_tokens ADD COLUMN IF NOT EXISTS token_hash VARCHAR(64);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'verification_tokens' AND column_name = 'token_hash' AND udt_name = 'uuid') THEN
        ALTER TABLE public.verification_tokens ALTER COLUMN token_hash TYPE VARCHAR(64) USING token_hash::text;
    END IF;
END $$;
ALTER TABLE public.verification_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'verification_tokens' AND column_name = 'expires_at' AND udt_name = 'uuid') THEN
        ALTER TABLE public.verification_tokens ALTER COLUMN expires_at TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.verification_tokens ADD COLUMN IF NOT EXISTS used BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'verification_tokens' AND column_name = 'used' AND udt_name = 'uuid') THEN
        ALTER TABLE public.verification_tokens ALTER COLUMN used TYPE BOOLEAN USING NULL;
    END IF;
END $$;

-- Table: vts_system
CREATE TABLE IF NOT EXISTS public.vts_system (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.vts_system ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS system_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'system_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN system_name TYPE VARCHAR(255) USING system_name::text;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS location VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'location' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN location TYPE VARCHAR(500) USING location::text;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS condition_status SMALLINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'condition_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN condition_status TYPE SMALLINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS responsibility_level VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'responsibility_level' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN responsibility_level TYPE VARCHAR(255) USING responsibility_level::text;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS source VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'source' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN source TYPE VARCHAR(255) USING source::text;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS partner VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'partner' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN partner TYPE VARCHAR(255) USING partner::text;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS scope VARCHAR(2000);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'scope' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN scope TYPE VARCHAR(2000) USING scope::text;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS approval_status SMALLINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE SMALLINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS approved_level1 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approved_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approved_level1 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS approver_level1 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approver_level1' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approver_level1 TYPE UUID USING CASE WHEN approver_level1 IS NULL OR approver_level1::text = '' THEN NULL ELSE approver_level1::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approved_date_level1' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approved_date_level1 TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS approved_level2 BOOLEAN;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approved_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approved_level2 TYPE BOOLEAN USING NULL;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS approver_level2 UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approver_level2' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approver_level2 TYPE UUID USING CASE WHEN approver_level2 IS NULL OR approver_level2::text = '' THEN NULL ELSE approver_level2::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approved_date_level2' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approved_date_level2 TYPE TIMESTAMP USING NULL;
    END IF;
END $$;
ALTER TABLE public.vts_system ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'rejection_reason' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system ALTER COLUMN rejection_reason TYPE VARCHAR(500) USING rejection_reason::text;
    END IF;
END $$;

-- Table: vts_system_attachment
CREATE TABLE IF NOT EXISTS public.vts_system_attachment (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.vts_system_attachment ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.vts_system_attachment ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE public.vts_system_attachment ADD COLUMN IF NOT EXISTS vts_system_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'vts_system_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN vts_system_id TYPE UUID USING CASE WHEN vts_system_id IS NULL OR vts_system_id::text = '' THEN NULL ELSE vts_system_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.vts_system_attachment ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'file_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN file_name TYPE VARCHAR(255) USING file_name::text;
    END IF;
END $$;
ALTER TABLE public.vts_system_attachment ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'file_path' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN file_path TYPE VARCHAR(500) USING file_path::text;
    END IF;
END $$;
ALTER TABLE public.vts_system_attachment ADD COLUMN IF NOT EXISTS file_size BIGINT;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'file_size' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN file_size TYPE BIGINT USING NULL;
    END IF;
END $$;
ALTER TABLE public.vts_system_attachment ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'document_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN document_type TYPE VARCHAR(50) USING document_type::text;
    END IF;
END $$;
ALTER TABLE public.vts_system_attachment ADD COLUMN IF NOT EXISTS uploaded_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'uploaded_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN uploaded_by TYPE UUID USING CASE WHEN uploaded_by IS NULL OR uploaded_by::text = '' THEN NULL ELSE uploaded_by::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.vts_system_attachment ADD COLUMN IF NOT EXISTS uploaded_date TIMESTAMP;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'uploaded_date' AND udt_name = 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN uploaded_date TYPE TIMESTAMP USING NULL;
    END IF;
END $$;

-- Table: water_zones
CREATE TABLE IF NOT EXISTS public.water_zones (
    id UUID PRIMARY KEY
);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.water_zones ALTER COLUMN id TYPE UUID USING CASE WHEN id IS NULL THEN gen_random_uuid() ELSE gen_random_uuid() END;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS province_id INTEGER;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'province_id' AND udt_name = 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN province_id TYPE INTEGER USING NULL;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS water_zone_code VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'water_zone_code' AND udt_name = 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN water_zone_code TYPE VARCHAR(50) USING water_zone_code::text;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS water_zone_name VARCHAR(255);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'water_zone_name' AND udt_name = 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN water_zone_name TYPE VARCHAR(255) USING water_zone_name::text;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS port_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'port_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN port_id TYPE UUID USING CASE WHEN port_id IS NULL OR port_id::text = '' THEN NULL ELSE port_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS area NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'area' AND udt_name = 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN area TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS max_depth NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'max_depth' AND udt_name = 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN max_depth TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS avg_depth NUMERIC(19,4);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'avg_depth' AND udt_name = 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN avg_depth TYPE NUMERIC(19,4) USING NULL;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS water_zone_type VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'water_zone_type' AND udt_name = 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN water_zone_type TYPE VARCHAR(50) USING water_zone_type::text;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'operational_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN operational_status TYPE VARCHAR(50) USING operational_status::text;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'approval_status' AND udt_name = 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS org_unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'org_unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN org_unit_id TYPE UUID USING CASE WHEN org_unit_id IS NULL OR org_unit_id::text = '' THEN NULL ELSE org_unit_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS map_symbol_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'map_symbol_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN map_symbol_id TYPE UUID USING CASE WHEN map_symbol_id IS NULL OR map_symbol_id::text = '' THEN NULL ELSE map_symbol_id::text::uuid END;
    END IF;
END $$;
ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'water_zones' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.water_zones ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL ELSE spatial_id::text::uuid END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'approved_date' AND udt_name <> 'timestamp') THEN
        ALTER TABLE public.approval_history ALTER COLUMN approved_date TYPE TIMESTAMP WITHOUT TIME ZONE USING approved_date::timestamp;
    END IF;
END $$;

