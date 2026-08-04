-- Normalize legacy planning table and column names when the optional qhcb_all
-- source schema is present. Some deployments do not include planning data.
DO $$
DECLARE
    planning_table text;
    column_mapping record;
BEGIN
    IF to_regclass('qhcb_all."POINT"') IS NOT NULL
       AND to_regclass('qhcb_all.point') IS NULL THEN
        ALTER TABLE qhcb_all."POINT" RENAME TO point;
    END IF;

    IF to_regclass('qhcb_all."LINE"') IS NOT NULL
       AND to_regclass('qhcb_all.line') IS NULL THEN
        ALTER TABLE qhcb_all."LINE" RENAME TO line;
    END IF;

    IF to_regclass('qhcb_all."AREA"') IS NOT NULL
       AND to_regclass('qhcb_all.area') IS NULL THEN
        ALTER TABLE qhcb_all."AREA" RENAME TO area;
    END IF;

    FOREACH planning_table IN ARRAY ARRAY['point', 'line', 'area'] LOOP
        IF to_regclass(format('qhcb_all.%I', planning_table)) IS NULL THEN
            CONTINUE;
        END IF;

        FOR column_mapping IN
            SELECT * FROM (VALUES
                ('Ten_doi_tuong', 'name'),
                ('Tinh_thanh', 'province'),
                ('Dien_tich', 'area'),
                ('Type', 'type'),
                ('Chieu_dai', 'length'),
                ('trang_thai', 'status'),
                ('nguon_du_lieu', 'data_source'),
                ('ghi_chu', 'notes'),
                ('co_quan_ql', 'agency'),
                ('Color', 'color')
            ) AS mappings(old_name, new_name)
        LOOP
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'qhcb_all'
                  AND table_name = planning_table
                  AND column_name = column_mapping.old_name
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'qhcb_all'
                  AND table_name = planning_table
                  AND column_name = column_mapping.new_name
            ) THEN
                EXECUTE format(
                    'ALTER TABLE qhcb_all.%I RENAME COLUMN %I TO %I',
                    planning_table, column_mapping.old_name, column_mapping.new_name
                );
            END IF;
        END LOOP;
    END LOOP;
END
$$;
