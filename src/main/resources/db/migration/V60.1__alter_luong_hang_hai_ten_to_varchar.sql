-- Convert ten column in luong_hang_hai from bytea to varchar(100)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'luong_hang_hai' 
          AND column_name = 'ten' 
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE public.luong_hang_hai ALTER COLUMN ten TYPE varchar(100) USING convert_from(ten, 'UTF8');
    END IF;
END $$;
