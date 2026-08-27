---
id: AM-69a4b726e4531155
kind: decision
topic: kcht-geometry-coordinate-count-rule
tags: []
importance: 0.7
agent: 
created: 2026-08-14T09:05:19.168Z
updated: 2026-08-14T09:05:19.168Z
---

Validation tọa độ KCHT (cảng biển/bến cảng/cầu cảng): quy tắc Loại đối tượng → số tọa độ tối thiểu = POINT:1, LINE:2, POLYGON:3 (hằng GEOMETRY_POINT_COUNT trong PortListPage.tsx / BerthForm.tsx / PierForm.tsx). Lưu ý: WKT khi lưu chỉ sinh POINT/MULTIPOINT (chưa bao giờ LINESTRING/POLYGON), và PortCreatePage.tsx + PortUpdatePage.tsx là code mồ côi (không được route trong App.tsx — form Port thật nằm ở modal inline trong PortListPage.tsx).
