---
id: AM-7cba9fcf7812ac78
kind: gotcha
topic: anchorage-tab-orgunit-filter
tags: []
importance: 0.8
agent: 
created: 2026-08-25T10:02:19.817Z
updated: 2026-08-25T10:02:19.817Z
---

Fix tab Khu neo đậu (2026-08-25, TRI-1787651069552-c58f C2): nguyên nhân gốc tab sai = anchorageCRUD.search THIẾU tham số orgUnitId/navigationChannelId/buoyStationId trong type+params (Berth có) → tab counts không lọc theo đơn vị. Đã thêm vào portService.ts + GIS fields (mapSymbolId/coordinateSystem/geometryType/coordinates) vào interface Anchorage. ListPage: thêm ddToDms + truyền xuống DetailContent (thiếu sẽ crash drawer chi tiết), thêm isAuditViewer/auditColumns/Radio.Group history/filter updatedFrom-To; dọn 39 lỗi TS6133 clone dư. tsc anchorage: 0 lỗi.
