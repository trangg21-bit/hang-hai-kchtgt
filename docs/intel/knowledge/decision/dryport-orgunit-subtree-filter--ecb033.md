---
id: AM-ecb0334d0e5cfaa3
kind: decision
topic: dryport-orgunit-subtree-filter
tags: []
importance: 0.8
agent: 
created: 2026-08-22T03:58:20.932Z
updated: 2026-08-22T03:58:20.932Z
---

Filter Cảng cạn theo Đơn vị quản lý từng lọc org_unit_id = :orgUnitId (KHÔNG gồm đơn vị con) — khác Bến cảng. Đã sửa 2026-08-22: DryPortService.findAll dùng orgUnitScopeService.resolveSubtreeIds(orgUnitId) → searchDryPorts(includeAll, orgUnitIds IN ...) giống BerthService:208; giữ @Deprecated overload searchDryPorts(orgUnitId,...) cho KchtGis155Service (khớp đúng đơn vị, không mở rộng).
