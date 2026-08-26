---
id: AM-27f05bb540109b01
kind: decision
topic: all-columns-sortable-6-kcht-list-screens
tags: []
importance: 0.8
agent: 
created: 2026-08-22T07:14:01.400Z
updated: 2026-08-22T07:14:01.400Z
---

6 màn danh sách KCHT đã bật sort cho TẤT CẢ cột dữ liệu (click header sort tăng/giảm, sort theo giá trị hiển thị/label chứ không theo raw id): PortListPage (đã sẵn đủ), BerthListPage (thêm structureType/portId/waterwayId/operationalFunction/2 cột nội dung phê duyệt + STT), PierListPage (thêm structureType/portId/berthName/navigationChannelId/constructionGrade/operationalFunction/3 cột audit + STT), DryPortListPage (thêm operatingUnit/region/transportCorridor/approvalStatus/updatedBy + STT), BuoyStationListPage (thêm unitId/operatingOrgId/portId/waterwayId/province/condition/status + seq), BuoyListPage (thêm unitId/buoyStationId/provinceId/condition/status). Cơ chế: sortable:true + sortOrder + comparator dùng helper getSortValue/resolve map id→label; STT sort bằng reverse. Cột thao tác dropdown (rowActions) không có header sort.
