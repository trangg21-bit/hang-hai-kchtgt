---
id: AM-5829e30187096be2
kind: decision
topic: buoy-search-trim-api-layer
tags: []
importance: 0.7
agent: 
created: 2026-08-25T09:42:12.170Z
updated: 2026-08-25T09:42:12.170Z
---

Fix trim tìm kiếm phao tiêu (2026-08-25): BuoyListPage không trim filter name/code ở page; điểm sửa chuẩn là searchBuoys trong frontend/src/services/buoy/api.ts (trim params.name/code trước buildSearchParams) — 1 điểm sửa cover cả BuoyListPage live-filter lẫn legacy buoyCRUD.search (beaconService.ts). Nhập khoảng trắng đầu/cuối hoặc chỉ toàn space (→ bỏ filter) không còn ảnh hưởng kết quả.
