---
id: AM-7c884358f9f02dfc
kind: decision
topic: cang-ui-label-da-phe-duyet
tags: []
importance: 0.7
agent: 
created: 2026-08-17T06:59:57.478Z
updated: 2026-08-17T06:59:57.478Z
---

Đồng bộ nhãn trạng thái 'Được phê duyệt' → 'Đã phê duyệt' (2026-08-17) trên 4 màn cảng ĐANG CHẠY: services/port/PortListPage.tsx (Cảng biển, 4 chỗ), pages/port/BerthList.tsx (Bến cảng, 1 chỗ), pages/port/PierList.tsx (Cầu cảng, 4 chỗ), pages/port/DryPortList.tsx (Cảng cạn, 4 chỗ) — gồm tab trạng thái, status map, dropdown lọc, toast. Các chỗ 'Được phê duyệt' còn lại đều ngoài phạm vi: code chết không được route (app/berth|pier|dryport|waterzone/*ListPage, app/*/types.ts, services/port/PortDetailPage.tsx, types/port.ts dòng 16) hoặc màn khác (pages/port/WaterZoneList.tsx vùng nước, pages/station/LighthouseStationList.tsx trạm hải đăng).
