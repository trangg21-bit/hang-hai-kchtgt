---
id: AM-a53a5eb510563a6b
kind: fact
topic: buoy-filters
tags: []
importance: 0.9
agent: 
created: 2026-08-19T03:03:05.667Z
updated: 2026-08-19T03:03:05.667Z
---

BuoyListPage.tsx filter state: filterName, filterCode, filterType, filterStatus, managingUnitId (TreeSelect), filterStationId, filterProvinceId, filterCondition, filterDateRange (RangePicker). filterContent includes: Đơn vị quản lý, Tên phao tiêu, Mã phao tiêu, Loại phao tiêu, Trạng thái, Thuộc nhà trạm QLVH phao tiêu, Địa điểm (Tỉnh/TP), Tình trạng, Ngày cập nhật. Client-side filtering applies stationId, provinceId, condition, dateRange, managingUnitId on searchBuoys results. CONDITION_OPTIONS import from ./schema.ts for tình trạng filter. buoyStationOptions generated from buoyStations state loaded via fetchBuoyStationList.
