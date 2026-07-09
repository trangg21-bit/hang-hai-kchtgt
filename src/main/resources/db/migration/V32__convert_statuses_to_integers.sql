-- V32: Convert status columns to integer for Seaport (Cảng biển), Berth (Bến cảng), Crane (Cầu cảng), Inland port (Cảng cạn), Water zone (Vùng nước)

-- CangBien
UPDATE cang_bien SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong ILIKE 'HIEN_HANH' OR trang_thai_hoat_dong IS NULL;
UPDATE cang_bien SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
ALTER TABLE cang_bien ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE cang_bien SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet ILIKE 'CHO_PHE_DUYET' OR trang_thai_phe_duyet IS NULL;
UPDATE cang_bien SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET';
UPDATE cang_bien SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'TU_CHOI';
ALTER TABLE cang_bien ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- BenCang
UPDATE ben_cang SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong ILIKE 'HIEN_HANH' OR trang_thai_hoat_dong IS NULL;
UPDATE ben_cang SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
ALTER TABLE ben_cang ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE ben_cang SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet ILIKE 'CHO_PHE_DUYET' OR trang_thai_phe_duyet IS NULL;
UPDATE ben_cang SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET';
UPDATE ben_cang SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'TU_CHOI';
ALTER TABLE ben_cang ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- CauCang
UPDATE cau_cang SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong ILIKE 'HIEN_HANH' OR trang_thai_hoat_dong IS NULL;
UPDATE cau_cang SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
ALTER TABLE cau_cang ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE cau_cang SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet ILIKE 'CHO_PHE_DUYET' OR trang_thai_phe_duyet IS NULL;
UPDATE cau_cang SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET';
UPDATE cau_cang SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'TU_CHOI';
ALTER TABLE cau_cang ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- CangCan
UPDATE cang_can SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong ILIKE 'HIEN_HANH' OR trang_thai_hoat_dong IS NULL;
UPDATE cang_can SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
ALTER TABLE cang_can ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE cang_can SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet ILIKE 'CHO_PHE_DUYET' OR trang_thai_phe_duyet IS NULL;
UPDATE cang_can SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET';
UPDATE cang_can SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'TU_CHOI';
ALTER TABLE cang_can ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);

-- VungNuoc
UPDATE vung_nuoc SET trang_thai_hoat_dong = '1' WHERE trang_thai_hoat_dong ILIKE 'HIEN_HANH' OR trang_thai_hoat_dong IS NULL;
UPDATE vung_nuoc SET trang_thai_hoat_dong = '0' WHERE trang_thai_hoat_dong ILIKE 'TAM_NGUNG';
ALTER TABLE vung_nuoc ALTER COLUMN trang_thai_hoat_dong TYPE integer USING (trang_thai_hoat_dong::integer);

UPDATE vung_nuoc SET trang_thai_phe_duyet = '0' WHERE trang_thai_phe_duyet ILIKE 'CHO_PHE_DUYET' OR trang_thai_phe_duyet IS NULL;
UPDATE vung_nuoc SET trang_thai_phe_duyet = '1' WHERE trang_thai_phe_duyet ILIKE 'DUOC_PHE_DUYET';
UPDATE vung_nuoc SET trang_thai_phe_duyet = '2' WHERE trang_thai_phe_duyet ILIKE 'TU_CHOI';
ALTER TABLE vung_nuoc ALTER COLUMN trang_thai_phe_duyet TYPE integer USING (trang_thai_phe_duyet::integer);
