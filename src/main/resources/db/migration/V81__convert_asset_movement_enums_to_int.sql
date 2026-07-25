-- V81: Convert Enum String columns to Integer in asset movement tables

DO $$ 
BEGIN

    -- 1. inventory_assets: inventory_status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_assets' AND column_name='inventory_status' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.inventory_assets
            ALTER COLUMN inventory_status TYPE integer USING CASE
                WHEN inventory_status IN ('CHUA_KIEM_KE', 'UNCHECKED') THEN 0
                WHEN inventory_status IN ('DA_KIEM_KE', 'CHECKED') THEN 1
                WHEN inventory_status IN ('CHENH_LECH_THUA', 'SURPLUS') THEN 2
                WHEN inventory_status IN ('CHENH_LECH_THIEU', 'MISSING') THEN 3
                ELSE 0
            END;
    END IF;

    -- 2. movement_requests: movement_type & status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movement_requests' AND column_name='movement_type' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.movement_requests
            ALTER COLUMN movement_type TYPE integer USING CASE
                WHEN movement_type IN ('TANG', 'INCREASE') THEN 0
                WHEN movement_type IN ('GIAM', 'DECREASE') THEN 1
                WHEN movement_type IN ('XU_LY', 'PROCESSING') THEN 2
                WHEN movement_type IN ('KIEM_KE', 'INVENTORY') THEN 3
                ELSE 0
            END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movement_requests' AND column_name='status' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.movement_requests
            ALTER COLUMN status TYPE integer USING CASE
                WHEN status IN ('PENDING', 'CHUA_PHE_DUYET') THEN 0
                WHEN status IN ('APPROVED', 'DA_PHE_DUYET') THEN 1
                WHEN status IN ('REJECTED', 'TU_CHOI') THEN 2
                ELSE 0
            END;
    END IF;

    -- 3. asset_decrease_requests: decrease_reason & status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asset_decrease_requests' AND column_name='decrease_reason' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.asset_decrease_requests
            ALTER COLUMN decrease_reason TYPE integer USING CASE
                WHEN decrease_reason IN ('GIAI_THE', 'DISSOLVED') THEN 0
                WHEN decrease_reason IN ('HU_HONG', 'DAMAGED') THEN 1
                WHEN decrease_reason IN ('PHA_BO', 'DEMOLISHED') THEN 2
                WHEN decrease_reason IN ('HET_HAN_SU_DUNG', 'EXPIRED') THEN 3
                ELSE 0
            END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asset_decrease_requests' AND column_name='status' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.asset_decrease_requests
            ALTER COLUMN status TYPE integer USING CASE
                WHEN status IN ('PENDING', 'CHUA_PHE_DUYET') THEN 0
                WHEN status IN ('APPROVED', 'DA_PHE_DUYET') THEN 1
                WHEN status IN ('REJECTED', 'TU_CHOI') THEN 2
                ELSE 0
            END;
    END IF;

    -- 4. asset_increase_requests: asset_type & status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asset_increase_requests' AND column_name='asset_type' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.asset_increase_requests
            ALTER COLUMN asset_type TYPE integer USING CASE
                WHEN asset_type IN ('LOAI_PHAO_TIEU', 'BUOY') THEN 0
                WHEN asset_type IN ('LOAI_TRAM_RADAR', 'RADAR_STATION') THEN 1
                WHEN asset_type IN ('LOAI_DEN_BIEN', 'LIGHTHOUSE') THEN 2
                WHEN asset_type IN ('LOAI_THIET_BI_PHU_TRI', 'AUXILIARY_EQUIPMENT') THEN 3
                ELSE 0
            END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asset_increase_requests' AND column_name='status' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.asset_increase_requests
            ALTER COLUMN status TYPE integer USING CASE
                WHEN status IN ('PENDING', 'CHUA_PHE_DUYET') THEN 0
                WHEN status IN ('APPROVED', 'DA_PHE_DUYET') THEN 1
                WHEN status IN ('REJECTED', 'TU_CHOI') THEN 2
                ELSE 0
            END;
    END IF;

    -- 5. asset_processing_records: processing_type & status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asset_processing_records' AND column_name='processing_type' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.asset_processing_records
            ALTER COLUMN processing_type TYPE integer USING CASE
                WHEN processing_type IN ('DIEU_CHUYEN', 'TRANSFER') THEN 0
                WHEN processing_type IN ('BAN_GIAO', 'HANDOVER') THEN 1
                WHEN processing_type IN ('THANH_LY', 'LIQUIDATION') THEN 2
                WHEN processing_type IN ('PHA_BO', 'DEMOLITION') THEN 3
                ELSE 0
            END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='asset_processing_records' AND column_name='status' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.asset_processing_records
            ALTER COLUMN status TYPE integer USING CASE
                WHEN status IN ('PENDING', 'CHUA_PHE_DUYET') THEN 0
                WHEN status IN ('APPROVED', 'DA_PHE_DUYET') THEN 1
                WHEN status IN ('REJECTED', 'TU_CHOI') THEN 2
                ELSE 0
            END;
    END IF;

    -- 6. inventory_plans: inventory_type & status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_plans' AND column_name='inventory_type' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.inventory_plans
            ALTER COLUMN inventory_type TYPE integer USING CASE
                WHEN inventory_type IN ('DINH_KY', 'PERIODIC') THEN 0
                WHEN inventory_type IN ('DOT_XUAT', 'UNEXPECTED') THEN 1
                ELSE 0
            END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_plans' AND column_name='status' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.inventory_plans
            ALTER COLUMN status TYPE integer USING CASE
                WHEN status IN ('PENDING', 'CHUA_PHE_DUYET') THEN 0
                WHEN status IN ('APPROVED', 'DA_PHE_DUYET', 'PHE_DUYET') THEN 1
                WHEN status IN ('IN_PROGRESS', 'DANG_THUC_HIEN') THEN 2
                WHEN status IN ('COMPLETED', 'HOAN_THANH') THEN 3
                WHEN status IN ('REJECTED', 'TU_CHOI') THEN 4
                ELSE 0
            END;
    END IF;

    -- 7. inventory_reports: status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_reports' AND column_name='status' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.inventory_reports
            ALTER COLUMN status TYPE integer USING CASE
                WHEN status IN ('PENDING', 'CHUA_PHE_DUYET') THEN 0
                WHEN status IN ('APPROVED', 'DA_PHE_DUYET') THEN 1
                WHEN status IN ('REJECTED', 'TU_CHOI') THEN 2
                ELSE 0
            END;
    END IF;

    -- 8. approval_records: result
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='approval_records' AND column_name='result' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.approval_records
            ALTER COLUMN result TYPE integer USING CASE
                WHEN result IN ('PHE_DUYET', 'APPROVED') THEN 0
                WHEN result IN ('TU_CHOI', 'REJECTED') THEN 1
                ELSE 0
            END;
    END IF;

    -- 9. infra_assets: asset_type & status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='infra_assets' AND column_name='asset_type' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.infra_assets
            ALTER COLUMN asset_type TYPE integer USING CASE
                WHEN asset_type IN ('LOAI_PHAO_TIEU', 'BUOY') THEN 0
                WHEN asset_type IN ('LOAI_TRAM_RADAR', 'RADAR_STATION') THEN 1
                WHEN asset_type IN ('LOAI_DEN_BIEN', 'LIGHTHOUSE') THEN 2
                WHEN asset_type IN ('LOAI_THIET_BI_PHU_TRI', 'AUXILIARY_EQUIPMENT') THEN 3
                ELSE 0
            END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='infra_assets' AND column_name='status' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.infra_assets
            ALTER COLUMN status TYPE integer USING CASE
                WHEN status IN ('PENDING', 'CHUA_PHE_DUYET') THEN 0
                WHEN status IN ('DANG_QUAN_LY', 'MANAGED') THEN 1
                WHEN status IN ('HUY', 'CANCELED') THEN 2
                WHEN status IN ('GIAI_THE', 'DISSOLVED') THEN 3
                WHEN status IN ('PHA_BO', 'DEMOLISHED') THEN 4
                WHEN status IN ('DECOMMISSION', 'DECOMMISSIONED') THEN 5
                ELSE 0
            END;
    END IF;

END $$;
