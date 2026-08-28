---
id: AM-910c849368bc3a90
kind: decision
topic: kcht-list-audit-column-pattern
tags: []
importance: 0.7
agent: 
created: 2026-08-20T04:53:26.907Z
updated: 2026-08-20T04:53:26.907Z
---

Pattern cột audit cho màn danh sách KCHT (chuẩn BerthList.tsx:860-905): mỗi sự kiện audit = 1 cột merge 'Cán bộ (bold) + ngày giờ opacity 0.85 bên dưới' (4 cột: cập nhật/gửi PD/PD Cảng vụ/PD Cục), KHÔNG tách Ngày riêng + Cán bộ riêng. BuoyListPage.tsx đã được merge 8→4 cột ngày 20/08/2026. Gate audit theo isAuditViewer (admin:manage|admin:operation) ở bến cảng.
