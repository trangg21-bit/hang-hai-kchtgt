ALTER TABLE public.he_thong_vts ADD COLUMN spatial_id UUID NULL;
ALTER TABLE public.he_thong_vts ADD CONSTRAINT fk_vts_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;

ALTER TABLE public.co_sua_chua_dong_tau ADD COLUMN spatial_id UUID NULL;
ALTER TABLE public.co_sua_chua_dong_tau ADD CONSTRAINT fk_cosuachua_spatial FOREIGN KEY (spatial_id) REFERENCES public.gis_spatial_objects(id) ON DELETE SET NULL;
