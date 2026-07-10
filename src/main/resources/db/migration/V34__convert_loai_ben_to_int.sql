-- V34__convert_loai_ben_to_int.sql
-- Convert ben_cang.loai_ben from VARCHAR to INTEGER, mapping existing standard string tags to integer values.

-- 1. Update existing VARCHAR codes to string representation of integers
UPDATE ben_cang
SET loai_ben = CASE
    WHEN TRIM(loai_ben) = 'BEN_CONTAINER' THEN '1'
    WHEN TRIM(loai_ben) = 'BEN_TONG_HOP' THEN '2'
    WHEN TRIM(loai_ben) = 'BEN_CHUYEN_DUNG' THEN '3'
    WHEN TRIM(loai_ben) = 'BEN_HANH_KHACH' THEN '4'
    WHEN TRIM(loai_ben) = 'BEN_PHAO' THEN '5'
    WHEN TRIM(loai_ben) = 'Bến thủy nội địa' OR TRIM(loai_ben) = 'BEN_THUY_NOI_DIA' THEN '6'
    ELSE NULL
END;

-- 2. Alter column type to INTEGER
ALTER TABLE ben_cang
ALTER COLUMN loai_ben TYPE INTEGER USING loai_ben::INTEGER;
