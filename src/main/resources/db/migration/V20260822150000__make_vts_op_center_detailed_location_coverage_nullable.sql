-- V20260822150000: Make detailed_location and coverage nullable in vts_operation_center
ALTER TABLE public.vts_operation_center ALTER COLUMN detailed_location DROP NOT NULL;
ALTER TABLE public.vts_operation_center ALTER COLUMN coverage DROP NOT NULL;
