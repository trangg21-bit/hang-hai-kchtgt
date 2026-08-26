---
id: AM-45c3be0650f8fa60
kind: decision
topic: dryport-province-filter-param-key
tags: []
importance: 0.7
agent: 
created: 2026-08-17T06:50:31.006Z
updated: 2026-08-17T06:50:31.006Z
---

Filter Tỉnh/Thành phố Cảng cạn (frontend/src/pages/port/DryPortList.tsx) từng gửi param key 'province' qua dryPortCRUD.findAll (frontend/src/services/portService.ts) trong khi backend DryPortController chỉ nhận @RequestParam 'provinceId' (Integer) → param bị Spring bỏ qua, filter không lọc. Đã sửa 2026-08-17: đổi key thành provinceId ở cả portService.ts và DryPortList.tsx. Các CRUD anh em: berthCRUD dùng provinceId đúng, portCRUD.search/pierCRUD.search vẫn gửi 'province' (chưa kiểm chứng contract backend tương ứng).
