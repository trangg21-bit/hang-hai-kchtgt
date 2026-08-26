---
id: AM-1a180ea966da123b
kind: gotcha
topic: dry-ports-db-bytea-drift
tags: []
importance: 0.8
agent: 
created: 2026-08-18T03:45:30.080Z
updated: 2026-08-18T03:45:30.080Z
---

DB backend cảng cạn thực tế = vmd_csdl_v2 trên 10.0.229.20:5432 bằng user ADMIN (không phải vmd_mtis_geo trong .env — IDE chạy profile local, không nạp .env nên dùng fallback admin/Etc@1234). Bảng dry_ports bị tiến trình ngoài làm cột text thành BYTEA (lỗi lower(bytea)) — đã được sửa varchar qua script thủ công (bytea count=0 cả vmd_csdl_v2 lẫn vmd_csdl_v2_dev).
