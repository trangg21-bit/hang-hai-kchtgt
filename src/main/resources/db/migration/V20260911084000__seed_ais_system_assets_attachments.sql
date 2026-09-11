-- V20260911084000__seed_ais_system_assets_attachments.sql
-- Cập nhật hồ sơ tài sản (file đính kèm) mẫu cho các tài sản hệ thống AIS

UPDATE ais_system_assets
SET attachment_name = 'Quyet_dinh_dau_tu_ais.pdf, Bien_ban_kiem_dinh_thiet_bi_ais.pdf, Quy_trinh_van_hanh_he_thong_ais.docx'
WHERE attachment_name IS NULL OR TRIM(attachment_name) = '';
