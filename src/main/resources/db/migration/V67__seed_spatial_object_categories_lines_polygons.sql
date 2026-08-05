-- Seed line and polygon categories. map_symbols has no stable `code` column,
-- therefore icons are intentionally left unset for later administrator setup.
-- V66 defines uniqueness by (code, geometry_type); remove the legacy
-- single-column index so the same code can exist for both geometry types.
DROP INDEX IF EXISTS public.uq_spatial_object_categories_code;

INSERT INTO spatial_object_categories (
    id, code, name, geometry_type, icon_id, status,
    created_at, created_by, updated_at, updated_by
)
SELECT
    gen_random_uuid(), category.code, category.name, geometry.geometry_type,
    NULL, 1, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP, NULL
FROM (
    VALUES
        ('BEN_CANG', 'Bến cảng, cầu cảng'),
        ('CANG_BIEN', 'Cảng biển'),
        ('DAI_TTDH', 'Đài Thông tin duyên hải'),
        ('DEN_BIEN', 'Đèn biển'),
        ('DE_KE', 'Đê, kè'),
        ('LUONG_HH', 'Luồng hàng hải'),
        ('PHAO_TIEU', 'Phao, tiêu'),
        ('VUNG_NUOC', 'Vùng nước'),
        ('HE_THONG_VTS', 'Hệ thống VTS')
) AS category(code, name)
CROSS JOIN (VALUES (2), (3)) AS geometry(geometry_type)
ON CONFLICT (code, geometry_type) DO NOTHING;
