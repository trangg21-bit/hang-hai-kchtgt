---
id: AM-2c8c2a09d8f316a2
kind: decision
topic: buoy-form-station-by-unit-published
tags: []
importance: 0.8
agent: 
created: 2026-08-22T09:15:48.237Z
updated: 2026-08-22T11:18:35.450Z
---

2026-08-22: Form phao tiêu (BuoyFormContent) giờ load 'Thuộc nhà trạm QLVH phao, tiêu' theo pattern BerthForm: field disabled khi chưa chọn Đơn vị quản lý (selectedUnitId prop = Form.useWatch('unitId') từ BuoyListPage); khi chọn đơn vị → fetchBuoyStationList({ unitId, status: 'PUBLISHED' }) (chỉ nhà trạm Đã phê duyệt); đổi đơn vị → reset buoyStationId + code (create) / reset buoyStationId nếu phao chưa có nhà trạm (edit). BuoyListPage tách state createStations/editStations; xóa loadingStations cũ phải đồng bộ cả filter bar. GOTCHA: 'npx tsc --noEmit -p tsconfig.app.json' toàn repo LUÔN exit 2 vì lỗi pre-existing ở PortListPage (57), BerthListPage (35), GISChartView, types/beacon.ts TS2300, types/*.ts TS1294 namespace+enum — không phải gate khả thi; gate thực tế = npm run build (exit 0) + LSP diagnostics 0 error trên file đã sửa.
