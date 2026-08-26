---
id: AM-bf96f61501595449
kind: decision
topic: buoy-station-fe-refactor
tags: []
importance: 0.85
agent: 
created: 2026-08-19T06:28:59.293Z
updated: 2026-08-19T06:28:59.293Z
---

Nhà trạm phao tiêu FE đã refactor (2026-08-19) về services/buoy-station/ (types.ts, api.ts, BuoyStationList.tsx, BuoyStationFormContent.tsx). Xóa trùng lặp BuoyStation + Lighthouse API/types khỏi services/station/{api,types}.ts và services/station/beacon/{api,types}.ts — services/station/ giờ chỉ còn coastal VTS + Inmarsat, beacon/ chỉ còn lighthouse. BuoyListPage + GISChartView chuyển import sang buoy-station. Gate: npm run build exit 0. Triage TRI-1787120395792-07a6.json (C3) — làm inline theo yêu cầu user (không PMO).
