-- V65: Rename phe_duyet_lich_su_de_ke to dike_revetment_approval_history
ALTER TABLE public.phe_duyet_lich_su_de_ke RENAME TO dike_revetment_approval_history;
ALTER TABLE public.dike_revetment_approval_history RENAME CONSTRAINT phe_duyet_lich_su_de_ke_pkey TO dike_revetment_approval_history_pkey;
ALTER TABLE public.dike_revetment_approval_history RENAME COLUMN de_ke_id TO dike_revetment_id;
ALTER TABLE public.dike_revetment_approval_history RENAME COLUMN cap_phe_duyet TO approval_level;
ALTER TABLE public.dike_revetment_approval_history RENAME COLUMN ly_do TO reason;
ALTER TABLE public.dike_revetment_approval_history RENAME COLUMN ngay_phe_duyet TO approval_date;
ALTER TABLE public.dike_revetment_approval_history RENAME COLUMN nguoi_phe_duyet TO approver;
ALTER TABLE public.dike_revetment_approval_history RENAME COLUMN trang_thai TO status;
ALTER TABLE public.dike_revetment_approval_history DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_de_ke_de_ke;
ALTER TABLE public.dike_revetment_approval_history ADD CONSTRAINT fk_dike_revetment_approval_history FOREIGN KEY (dike_revetment_id) REFERENCES public.dike_revetment(id);
