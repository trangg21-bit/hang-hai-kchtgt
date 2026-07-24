-- Rename tables in qhcb_all schema to lowercase
ALTER TABLE qhcb_all."POINT" RENAME TO point;
ALTER TABLE qhcb_all."LINE" RENAME TO line;
ALTER TABLE qhcb_all."AREA" RENAME TO area;

-- Rename columns for qhcb_all.point
ALTER TABLE qhcb_all.point RENAME COLUMN "Ten_doi_tuong" TO name;
ALTER TABLE qhcb_all.point RENAME COLUMN "Tinh_thanh" TO province;
ALTER TABLE qhcb_all.point RENAME COLUMN "Dien_tich" TO area;
ALTER TABLE qhcb_all.point RENAME COLUMN "Type" TO type;
ALTER TABLE qhcb_all.point RENAME COLUMN "Chieu_dai" TO length;
ALTER TABLE qhcb_all.point RENAME COLUMN "trang_thai" TO status;
ALTER TABLE qhcb_all.point RENAME COLUMN "nguon_du_lieu" TO data_source;
ALTER TABLE qhcb_all.point RENAME COLUMN "ghi_chu" TO notes;
ALTER TABLE qhcb_all.point RENAME COLUMN "co_quan_ql" TO agency;
ALTER TABLE qhcb_all.point RENAME COLUMN "Color" TO color;

-- Rename columns for qhcb_all.line
ALTER TABLE qhcb_all.line RENAME COLUMN "Ten_doi_tuong" TO name;
ALTER TABLE qhcb_all.line RENAME COLUMN "Tinh_thanh" TO province;
ALTER TABLE qhcb_all.line RENAME COLUMN "Dien_tich" TO area;
ALTER TABLE qhcb_all.line RENAME COLUMN "Type" TO type;
ALTER TABLE qhcb_all.line RENAME COLUMN "Chieu_dai" TO length;
ALTER TABLE qhcb_all.line RENAME COLUMN "trang_thai" TO status;
ALTER TABLE qhcb_all.line RENAME COLUMN "nguon_du_lieu" TO data_source;
ALTER TABLE qhcb_all.line RENAME COLUMN "ghi_chu" TO notes;
ALTER TABLE qhcb_all.line RENAME COLUMN "co_quan_ql" TO agency;
ALTER TABLE qhcb_all.line RENAME COLUMN "Color" TO color;

-- Rename columns for qhcb_all.area
ALTER TABLE qhcb_all.area RENAME COLUMN "Ten_doi_tuong" TO name;
ALTER TABLE qhcb_all.area RENAME COLUMN "Tinh_thanh" TO province;
ALTER TABLE qhcb_all.area RENAME COLUMN "Dien_tich" TO area;
ALTER TABLE qhcb_all.area RENAME COLUMN "Type" TO type;
ALTER TABLE qhcb_all.area RENAME COLUMN "Chieu_dai" TO length;
ALTER TABLE qhcb_all.area RENAME COLUMN "trang_thai" TO status;
ALTER TABLE qhcb_all.area RENAME COLUMN "nguon_du_lieu" TO data_source;
ALTER TABLE qhcb_all.area RENAME COLUMN "ghi_chu" TO notes;
ALTER TABLE qhcb_all.area RENAME COLUMN "co_quan_ql" TO agency;
ALTER TABLE qhcb_all.area RENAME COLUMN "Color" TO color;
