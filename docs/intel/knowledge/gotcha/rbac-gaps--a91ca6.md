---
id: AM-a91ca6a8249a8193
kind: gotcha
topic: rbac-gaps
tags: []
importance: 0.85
agent: 
created: 2026-08-17T03:20:56.158Z
updated: 2026-08-17T03:20:56.158Z
---

GAP: các permission movementrequest:manage, inventoryreport:manage, inventoryplan:manage, security:manage được dùng trong @PreAuthorize (MovementRequestController, InventoryReportController, InventoryPlanController, LockoutPolicyAdminController) nhưng KHÔNG có seedPermission() trong PermissionSeeder → user không có */admin:all bị 403 vĩnh viễn và cây phân quyền F-002 không hiển thị các feature này. Bất nhất khác: backend coi admin:manage là super-admin bypass (PermissionMiddleware:108, PermissionAuthorizationManager:113) nhưng frontend permissionStore ghi chú chỉ admin:all/* mới bypass — gap bảo mật backend lỏng hơn frontend.
