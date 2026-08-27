---
id: AM-a8ec642547a579c8
kind: decision
topic: buoy-form-csv-align
tags: []
importance: 0.85
agent: 
created: 2026-08-18T07:54:09.659Z
updated: 2026-08-18T08:09:44.832Z
---

User chốt 2026-08-18: form Tạo mới/Sửa phao tiêu (M-013/F-075) khớp 100% spec CSV 'QL Phao tiêu' — ĐÃ LÀM INLINE (không PMO, user hủy pipeline): form 5 tab đủ 33 trường nhập, Tình trạng SelectAppParams (cột condition), mã tự sinh {mã nhà trạm}-PT-{seq} (GET /api/buoys/generate-code?stationId=, BuoyService.generateCode(UUID)); entity Buoy +19 cột + migration V20260818170000__add_buoy_csv_fields.sql; BuoyListPage nạp danh sách nhà trạm qua fetchBuoyStationList, sinh mã khi chọn nhà trạm; AppParams chưa tồn tại trong dự án nên dùng constant frontend (CLASSIFICATION_/CONDITION_/BEACON_LIGHT_OPTIONS trong schema.ts). Gate: npm run build + mvn compile exit 0. Feature briefs F-074/F-075 CHƯA cập nhật được — platform guard chặn write docs/modules/** từ session không dispatch.
