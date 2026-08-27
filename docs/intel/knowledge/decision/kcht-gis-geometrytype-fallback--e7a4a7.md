---
id: AM-e7a4a7a1c8aa928a
kind: decision
topic: kcht-gis-geometrytype-fallback
tags: []
importance: 0.8
agent: 
created: 2026-08-13T10:25:36.639Z
updated: 2026-08-13T10:25:36.639Z
---

Form KCHT (PortListPage/BerthForm/PortCreatePage/PortUpdatePage) từng ép Loại đối tượng='POINT' khi bản ghi không có dữ liệu vị trí (fallback `data.geometryType || 'POINT'` + initialValues geometryType:'POINT') làm tab Thông tin vị trí hiện dữ liệu ảo khi mở chỉnh sửa và chặn lưu. Đã sửa 2026-08-13: dùng `data.geometryType || undefined`; không được tái lập fallback 'POINT'. Cảng cạn DryPortForm.tsx vẫn còn pattern này (geometryType:'POINT' ép cứng + GisLocationSelector defaultGeometryType 'POINT').
