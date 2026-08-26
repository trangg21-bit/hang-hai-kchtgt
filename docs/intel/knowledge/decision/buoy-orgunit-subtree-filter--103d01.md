---
id: AM-103d018dc8627fbd
kind: decision
topic: buoy-orgunit-subtree-filter
tags: []
importance: 0.8
agent: 
created: 2026-08-21T06:41:36.595Z
updated: 2026-08-21T06:41:36.595Z
---

Backend buoy/station lọc Đơn vị quản lý EXACT match (BuoyRepository.java:59 `b.unitId = :orgUnitId`, BeaconLightRepository.java:33, BuoyStationRepository.java:23) — KHÔNG subtree như Cảng biển (Port qua DataScope orgUnitFilter). 2026-08-21: BuoyListPage + BuoyStationList đã chuyển sang filter client-side subtree (helper collectOrgSubtreeIds dựng từ organizations.parentId) để chọn đơn vị cha thấy cả đơn vị con giống Cảng biển; nhớ KHÔNG truyền unitId param cho fetchBuoyStationList nữa (đã bỏ).
