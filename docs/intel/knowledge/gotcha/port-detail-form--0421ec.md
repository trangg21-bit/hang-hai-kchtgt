---
id: AM-0421ecd7f1377002
kind: gotcha
topic: port-detail-form
tags: []
importance: 0.8
agent: 
created: 2026-08-20T10:12:42.616Z
updated: 2026-08-20T10:12:42.616Z
---

Form 'Xem chi tiết' cảng biển nằm INLINE trong frontend/src/services/port/PortListPage.tsx (Drawer detailModalVisible, Tabs ~dòng 3390-3600, có 9 tab sau khi thêm 5 nhóm read-only). PortDetailContent.tsx (import ở dòng 81 PortListPage nhưng KHÔNG được render) và PortDetailPage.tsx (không có route trong App.tsx) là DEAD CODE — không sửa chúng khi chỉnh form chi tiết.
