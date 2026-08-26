---
id: AM-357f3d07ed5699d9
kind: fact
topic: routed-port-cluster-files
tags: []
importance: 0.8
agent: 
created: 2026-08-17T05:45:41.016Z
updated: 2026-08-17T05:45:41.016Z
---

Màn route thật của cụm cảng: Cảng biển=services/port/PortListPage.tsx (form Thêm/Sửa là drawer inline trong chính file, không phải PortFormContent/PortCreatePage/PortUpdatePage), Bến cảng=pages/port/BerthList.tsx, Cầu cảng=pages/port/PierList.tsx, Cảng cạn=pages/port/DryPortList.tsx, Vùng nước=app/waterzone/WaterZoneListPage.tsx. Các file app/berth/BerthListPage, app/pier/PierListPage, app/dryport/DryPortListPage, pages/port/WaterZoneList, services/port/PortCreatePage/PortUpdatePage/PortFormContent/PortDetailContent là DEAD (không được route trong App.tsx) — đừng sửa chúng.
