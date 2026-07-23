-- V63: Rename navigation_channel_attachment columns to English
-- Handles both: fresh rename (no new columns yet) and Hibernate auto-DDL (new columns already created)

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'navigation_channel_attachment' AND column_name = 'file_name') THEN
        -- New columns already created by Hibernate auto-DDL: copy data, then drop old columns
        UPDATE navigation_channel_attachment SET file_name = COALESCE(file_name, ten_tai_lieu), file_path = COALESCE(file_path, duong_dan), file_size = COALESCE(file_size, kich_thuoc), upload_date = COALESCE(upload_date, ngay_tai_len);
        ALTER TABLE navigation_channel_attachment DROP COLUMN IF EXISTS ten_tai_lieu;
        ALTER TABLE navigation_channel_attachment DROP COLUMN IF EXISTS duong_dan;
        ALTER TABLE navigation_channel_attachment DROP COLUMN IF EXISTS kich_thuoc;
        ALTER TABLE navigation_channel_attachment DROP COLUMN IF EXISTS ngay_tai_len;
    ELSE
        -- Clean slate: just rename
        ALTER TABLE navigation_channel_attachment RENAME COLUMN ten_tai_lieu TO file_name;
        ALTER TABLE navigation_channel_attachment RENAME COLUMN duong_dan   TO file_path;
        ALTER TABLE navigation_channel_attachment RENAME COLUMN kich_thuoc  TO file_size;
        ALTER TABLE navigation_channel_attachment RENAME COLUMN ngay_tai_len TO upload_date;
    END IF;
END $$;
