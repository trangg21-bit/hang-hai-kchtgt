---
id: AM-9e3e4d508ea1d023
kind: gotcha
topic: port-detail-live-screen
tags: []
importance: 0.8
agent: 
created: 2026-08-21T01:50:57.556Z
updated: 2026-08-21T01:50:57.556Z
---

Màn hình chi tiết Cảng biển thật là Drawer inline trong frontend/src/services/port/PortListPage.tsx (~dòng 3379). PortDetailPage.tsx và PortDetailContent.tsx là DEAD CODE (không được route/render — PortDetailContent chỉ import ở PortListPage:81 nhưng không dùng); sửa 2 file đó không có hiệu lực trên màn hình thật.
