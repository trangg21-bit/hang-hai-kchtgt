-- Migration: V20260924173000__add_protection_scope_and_memo_to_channel_route_detail.sql
-- Description: Bổ sung "Phạm vi bảo vệ luồng" (NUMERIC(10,0)) và "Ghi nhớ" (VARCHAR(2000)) cho bảng channel_route_detail

ALTER TABLE public.channel_route_detail ADD COLUMN IF NOT EXISTS protection_scope NUMERIC(10,0);
ALTER TABLE public.channel_route_detail ADD COLUMN IF NOT EXISTS memo VARCHAR(2000);
