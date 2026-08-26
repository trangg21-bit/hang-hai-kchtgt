---
id: AM-e9d0e0ee04372a52
kind: decision
topic: dryport-province-filter
tags: []
importance: 0.7
agent: 
created: 2026-08-17T06:32:32.914Z
updated: 2026-08-17T06:32:32.914Z
---

(scope: M-002) Filter Tỉnh/Thành phố của màn cảng cạn (frontend/src/pages/port/DryPortList.tsx) đã được nối thông end-to-end 2026-08-17: trước đây filterProvince chỉ set state, không gửi API và backend /v1/dry-ports không nhận provinceId → chết hoàn toàn. Nay controller+service+repository nhận provinceId (Integer, quy ước = index+1 của VIETNAM_PROVINCES, khớp form create), fetchData gửi province, và màn hình auto-load khi đổi mọi tiêu chí (search debounce 300ms giống cảng biển, orgUnit/province setPage(1)).
