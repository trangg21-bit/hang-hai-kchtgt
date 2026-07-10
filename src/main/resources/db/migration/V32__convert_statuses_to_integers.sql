-- V32: Convert status columns to integer for Seaport (Cảng biển), Berth (Bến cảng), Crane (Cầu cảng), Inland port (Cảng cạn), Water zone (Vùng nước)

-- CangBien
UPDATE cang_bien SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
UPDATE cang_bien SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong IS NULL OR trang_thai_hoat_dong NOT ILIKE '0';
ALTER TABLE cang_bien ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE cang_bien SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET' OR trang_thai_phe_duyet ILIKE 'APPROVED';
UPDATE cang_bien SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'TU_CHOI';
UPDATE cang_bien SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet IS NULL OR (trang_thai_phe_duyet NOT ILIKE '1' AND trang_thai_phe_duyet NOT ILIKE '2');
ALTER TABLE cang_bien ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- BenCang
UPDATE ben_cang SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
UPDATE ben_cang SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong IS NULL OR trang_thai_hoat_dong NOT ILIKE '0';
ALTER TABLE ben_cang ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE ben_cang SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET' OR trang_thai_phe_duyet ILIKE 'APPROVED';
UPDATE ben_cang SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'TU_CHOI';
UPDATE ben_cang SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet IS NULL OR (trang_thai_phe_duyet NOT ILIKE '1' AND trang_thai_phe_duyet NOT ILIKE '2');
ALTER TABLE ben_cang ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- CauCang
UPDATE cau_cang SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
UPDATE cau_cang SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong IS NULL OR trang_thai_hoat_dong NOT ILIKE '0';
ALTER TABLE cau_cang ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE cau_cang SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET' OR trang_thai_phe_duyet ILIKE 'APPROVED';
UPDATE cau_cang SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'TU_CHOI';
UPDATE cau_cang SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet IS NULL OR (trang_thai_phe_duyet NOT ILIKE '1' AND trang_thai_phe_duyet NOT ILIKE '2');
ALTER TABLE cau_cang ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- CangCan
UPDATE cang_can SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
UPDATE cang_can SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong IS NULL OR trang_thai_hoat_dong NOT ILIKE '0';
ALTER TABLE cang_can ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE cang_can SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET' OR trang_thai_phe_duyet ILIKE 'APPROVED';
UPDATE cang_can SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'TU_CHOI';
UPDATE cang_can SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet IS NULL OR (trang_thai_phe_duyet NOT ILIKE '1' AND trang_thai_phe_duyet NOT ILIKE '2');
ALTER TABLE cang_can ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- VungNuoc
UPDATE vung_nuoc SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
UPDATE vung_nuoc SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong IS NULL OR trang_thai_hoat_dong NOT ILIKE '0';
ALTER TABLE vung_nuoc ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE vung_nuoc SET trang_thai_phe_duyet = '1' WHERE vung_nuoc.trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET' OR vung_nuoc.trang_thai_phe_duyet ILIKE 'APPROVED';
UPDATE vung_nuoc SET trang_thai_phe_duyet = '2' WHERE vung_nuoc.trang_thai_phe_duyet ILIKE 'TU_CHOI';
UPDATE vung_nuoc SET trang_thai_phe_duyet = '0' WHERE vung_nuoc.trang_thai_phe_duyet IS NULL OR (vung_nuoc.trang_thai_phe_duyet NOT ILIKE '1' AND vung_nuoc.trang_thai_phe_duyet NOT ILIKE '2');
ALTER TABLE vung_nuoc ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (vung_nuoc.trang_thai_phe_duyet::integer);
