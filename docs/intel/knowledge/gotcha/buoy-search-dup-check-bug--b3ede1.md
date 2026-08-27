---
id: AM-b3ede157cb348e4d
kind: gotcha
topic: buoy-search-dup-check-bug
tags: []
importance: 0.8
agent: 
created: 2026-08-19T07:24:27.741Z
updated: 2026-08-19T07:24:27.741Z
---

BUG đã sửa (BuoyRepository.searchFiltered): điều kiện name/code nối bằng OR với 'param IS NULL OR LIKE...' — khi frontend gửi chỉ 1 param (vd searchBuoys({name}) cho check trùng), vế param kia = IS NULL = true → query trả TOÀN BỘ records → check trùng tên/mã ở handleCreateFinish luôn báo 'đã tồn tại'. Fix: nhóm lại '((name IS NULL AND code IS NULL) OR (name IS NOT NULL AND LIKE...) OR (code IS NOT NULL AND LIKE...))'. Tất cả repository khác (BeaconLight/GIS/station) dùng AND — đúng, chỉ BuoyRepository sai. Sau fix: cả 2 null = không lọc; 1 param = lọc theo param; cả 2 = tên HOẶC mã (đúng ý search chung fetchData gửi name=code=filterQuery).
