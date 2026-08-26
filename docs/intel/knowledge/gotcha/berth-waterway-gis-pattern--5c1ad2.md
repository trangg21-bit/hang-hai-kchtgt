---
id: AM-5c1ad226ac0dd04b
kind: gotcha
topic: berth-waterway-gis-pattern
tags: []
importance: 0.8
agent: 
created: 2026-08-21T05:44:41.262Z
updated: 2026-08-21T05:44:41.262Z
---

Bến cảng (Berth): trường luồng hàng hải = waterway_id (UUID GIS LineObject loại WATERWAY, status PUBLISHED — giống BuoyStation/nhà trạm Phao, tiêu; frontend resolve tên qua lineObjectService, backend không enrich). Cột navigation_channel_id do migration V20260821100000 thêm là CỘT THỪA (không code nào dùng) — đừng nhầm khi đọc schema.
