-- V58: Safely convert loai_vung_nuoc, loai_cau, and loai_de from VARCHAR/TEXT to INTEGER if not already converted.
DO $$
BEGIN
    -- 1. Check and convert cau_cang.loai_cau
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cau_cang' 
          AND column_name = 'loai_cau' 
          AND data_type = 'character varying'
    ) THEN
        UPDATE cau_cang
        SET loai_cau = CASE
            WHEN UPPER(TRIM(loai_cau)) = 'CONTAINER' THEN '1'
            WHEN UPPER(TRIM(loai_cau)) = 'TONG_HOP' OR UPPER(TRIM(loai_cau)) = 'TỔNG HỢP' THEN '2'
            WHEN UPPER(TRIM(loai_cau)) = 'HANH_KHACH' OR UPPER(TRIM(loai_cau)) = 'HÀNH KHÁCH' THEN '3'
            WHEN UPPER(TRIM(loai_cau)) = 'CHUYEN_DUNG_XANG_DAU' OR UPPER(TRIM(loai_cau)) = 'CHUYÊN DỤNG XĂNG DẦU' THEN '4'
            WHEN UPPER(TRIM(loai_cau)) = 'CHUYEN_DUNG_ROI_QUANG' OR UPPER(TRIM(loai_cau)) = 'CHUYÊN DỤNG RỜI QUẶNG' THEN '5'
            WHEN UPPER(TRIM(loai_cau)) = 'KHAC' OR UPPER(TRIM(loai_cau)) = 'KHÁC' THEN '6'
            ELSE NULL
        END;
        ALTER TABLE cau_cang ALTER COLUMN loai_cau TYPE INTEGER USING (loai_cau::INTEGER);
    END IF;

    -- 2. Check and convert vung_nuoc.loai_vung_nuoc
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vung_nuoc' 
          AND column_name = 'loai_vung_nuoc' 
          AND data_type = 'character varying'
    ) THEN
        UPDATE vung_nuoc
        SET loai_vung_nuoc = CASE
            WHEN UPPER(TRIM(loai_vung_nuoc)) = 'NEO_DAU' OR UPPER(TRIM(loai_vung_nuoc)) = 'NEO' THEN '1'
            WHEN UPPER(TRIM(loai_vung_nuoc)) = 'KIEM_DICH' THEN '2'
            WHEN UPPER(TRIM(loai_vung_nuoc)) = 'DON_TRA_HOA_TIEU' THEN '3'
            WHEN UPPER(TRIM(loai_vung_nuoc)) = 'QUAY_TRO_TAU' THEN '4'
            WHEN UPPER(TRIM(loai_vung_nuoc)) = 'BEN_PHAO' OR UPPER(TRIM(loai_vung_nuoc)) = 'BENPHAO' OR UPPER(TRIM(loai_vung_nuoc)) = 'PHAO' THEN '5'
            WHEN UPPER(TRIM(loai_vung_nuoc)) = 'CHUYEN_TAI' OR UPPER(TRIM(loai_vung_nuoc)) = 'KHUCHUYEN_TAI' OR UPPER(TRIM(loai_vung_nuoc)) = 'CHUYỂN' THEN '6'
            WHEN UPPER(TRIM(loai_vung_nuoc)) = 'TRANH_BAO' OR UPPER(TRIM(loai_vung_nuoc)) = 'KHUTRANH_TRU_BAO' OR UPPER(TRIM(loai_vung_nuoc)) = 'TRÁNH' THEN '7'
            ELSE NULL
        END;
        ALTER TABLE vung_nuoc ALTER COLUMN loai_vung_nuoc TYPE INTEGER USING (loai_vung_nuoc::INTEGER);
    END IF;

    -- 3. Check and convert de_ke.loai_de
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'de_ke' 
          AND column_name = 'loai_de' 
          AND data_type = 'character varying'
    ) THEN
        UPDATE de_ke
        SET loai_de = CASE
            WHEN UPPER(TRIM(loai_de)) = 'DE_DAT' THEN '1'
            WHEN UPPER(TRIM(loai_de)) = 'DE_BETONG' THEN '2'
            WHEN UPPER(TRIM(loai_de)) = 'KE_DA' THEN '3'
            WHEN UPPER(TRIM(loai_de)) = 'KE_BETONG' THEN '4'
            WHEN UPPER(TRIM(loai_de)) = 'KAC' OR UPPER(TRIM(loai_de)) = 'KHAC' THEN '5'
            ELSE NULL
        END;
        ALTER TABLE de_ke ALTER COLUMN loai_de TYPE INTEGER USING (loai_de::INTEGER);
    END IF;
END $$;
