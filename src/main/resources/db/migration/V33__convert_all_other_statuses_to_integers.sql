-- V33: Convert all other maritime assets statuses to integer

-- 1. de_ke
UPDATE de_ke SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet ILIKE 'PROPOSED' OR trang_thai_phe_duyet IS NULL;
UPDATE de_ke SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'UNDER_REVIEW';
UPDATE de_ke SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'APPROVED';
UPDATE de_ke SET trang_thai_phe_duyet = '3' WHERE trang_thai_phe_duyet ILIKE 'REJECTED';
ALTER TABLE de_ke ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- 2. luong_hang_hai
UPDATE luong_hang_hai SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet ILIKE 'PROPOSED' OR trang_thai_phe_duyet IS NULL;
UPDATE luong_hang_hai SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'UNDER_REVIEW';
UPDATE luong_hang_hai SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'APPROVED';
UPDATE luong_hang_hai SET trang_thai_phe_duyet = '3' WHERE trang_thai_phe_duyet ILIKE 'REJECTED';
ALTER TABLE luong_hang_hai ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- 3. tram_radar
UPDATE tram_radar SET trang_thai = '0' WHERE trang_thai ILIKE 'PROPOSED' OR trang_thai ILIKE 'CREATE' OR trang_thai IS NULL;
UPDATE tram_radar SET trang_thai = '1' WHERE trang_thai ILIKE 'UNDER_REVIEW';
UPDATE tram_radar SET trang_thai = '2' WHERE trang_thai ILIKE 'APPROVED';
UPDATE tram_radar SET trang_thai = '3' WHERE trang_thai ILIKE 'REJECTED';
ALTER TABLE tram_radar ALTER COLUMN trang_thai TYPE integer USING (trang_thai::integer);

-- 4. co_sua_chua_dong_tau
UPDATE co_sua_chua_dong_tau SET trang_thai = '0' WHERE trang_thai ILIKE 'PROPOSED' OR trang_thai IS NULL;
UPDATE co_sua_chua_dong_tau SET trang_thai = '1' WHERE trang_thai ILIKE 'UNDER_REVIEW';
UPDATE co_sua_chua_dong_tau SET trang_thai = '2' WHERE trang_thai ILIKE 'APPROVED';
UPDATE co_sua_chua_dong_tau SET trang_thai = '3' WHERE trang_thai ILIKE 'REJECTED';
ALTER TABLE co_sua_chua_dong_tau ALTER COLUMN trang_thai TYPE integer USING (trang_thai::integer);

-- 5. he_thong_vts
UPDATE he_thong_vts SET trang_thai = '0' WHERE trang_thai ILIKE 'PROPOSED' OR trang_thai IS NULL;
UPDATE he_thong_vts SET trang_thai = '1' WHERE he_thong_vts.trang_thai ILIKE 'CREATED';
UPDATE he_thong_vts SET trang_thai = '2' WHERE he_thong_vts.trang_thai ILIKE 'UNDER_REVIEW';
UPDATE he_thong_vts SET trang_thai = '3' WHERE he_thong_vts.trang_thai ILIKE 'APPROVED';
UPDATE he_thong_vts SET trang_thai = '4' WHERE he_thong_vts.trang_thai ILIKE 'REJECTED';
UPDATE he_thong_vts SET trang_thai = '5' WHERE he_thong_vts.trang_thai ILIKE 'DELETED';
UPDATE he_thong_vts SET trang_thai = '6' WHERE he_thong_vts.trang_thai ILIKE 'UPDATED';
ALTER TABLE he_thong_vts ALTER COLUMN trang_thai TYPE integer USING (he_thong_vts.trang_thai::integer);

-- 6. nha_tram_phao
UPDATE nha_tram_phao SET status = '0' WHERE status ILIKE 'DRAFT' OR status IS NULL;
UPDATE nha_tram_phao SET status = '1' WHERE status ILIKE 'PENDING_APPROVAL';
UPDATE nha_tram_phao SET status = '2' WHERE status ILIKE 'APPROVED_L1';
UPDATE nha_tram_phao SET status = '3' WHERE status ILIKE 'APPROVED_L2';
UPDATE nha_tram_phao SET status = '4' WHERE status ILIKE 'PUBLISHED';
UPDATE nha_tram_phao SET status = '5' WHERE status ILIKE 'DELETED';
ALTER TABLE nha_tram_phao ALTER COLUMN status TYPE integer USING (nha_tram_phao.status::integer);

UPDATE nha_tram_phao SET approval_status = '0' WHERE approval_status ILIKE 'PENDING' OR approval_status IS NULL;
UPDATE nha_tram_phao SET approval_status = '1' WHERE approval_status ILIKE 'APPROVED';
UPDATE nha_tram_phao SET approval_status = '2' WHERE approval_status ILIKE 'REJECTED';
ALTER TABLE nha_tram_phao ALTER COLUMN approval_status TYPE integer USING (nha_tram_phao.approval_status::integer);

-- 7. nha_tram_den
UPDATE nha_tram_den SET status = '0' WHERE status ILIKE 'DRAFT' OR status IS NULL;
UPDATE nha_tram_den SET status = '1' WHERE status ILIKE 'PENDING_APPROVAL';
UPDATE nha_tram_den SET status = '2' WHERE status ILIKE 'APPROVED_L1';
UPDATE nha_tram_den SET status = '3' WHERE status ILIKE 'APPROVED_L2';
UPDATE nha_tram_den SET status = '4' WHERE status ILIKE 'PUBLISHED';
UPDATE nha_tram_den SET status = '5' WHERE status ILIKE 'DELETED';
ALTER TABLE nha_tram_den ALTER COLUMN status TYPE integer USING (nha_tram_den.status::integer);

UPDATE nha_tram_den SET approval_status = '0' WHERE approval_status ILIKE 'PENDING' OR approval_status IS NULL;
UPDATE nha_tram_den SET approval_status = '1' WHERE approval_status ILIKE 'APPROVED';
UPDATE nha_tram_den SET approval_status = '2' WHERE approval_status ILIKE 'REJECTED';
ALTER TABLE nha_tram_den ALTER COLUMN approval_status TYPE integer USING (nha_tram_den.approval_status::integer);

-- 8. base_tai
UPDATE base_tai SET status = '0' WHERE status ILIKE 'ACTIVE' OR status IS NULL;
UPDATE base_tai SET status = '1' WHERE status ILIKE 'INACTIVE';
UPDATE base_tai SET status = '2' WHERE status ILIKE 'MAINTENANCE';
UPDATE base_tai SET status = '3' WHERE status ILIKE 'REMOVED';
ALTER TABLE base_tai ALTER COLUMN status TYPE integer USING (base_tai.status::integer);

UPDATE base_tai SET approval_status = '0' WHERE approval_status ILIKE 'PENDING' OR approval_status IS NULL;
UPDATE base_tai SET approval_status = '1' WHERE approval_status ILIKE 'APPROVED';
UPDATE base_tai SET approval_status = '2' WHERE approval_status ILIKE 'REJECTED';
ALTER TABLE base_tai ALTER COLUMN approval_status TYPE integer USING (base_tai.approval_status::integer);
