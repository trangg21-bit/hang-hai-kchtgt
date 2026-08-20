---
id: AM-b6b78b130195d17f
kind: fact
topic: rbac-model
tags: []
importance: 0.8
agent: 
created: 2026-08-17T03:20:55.801Z
updated: 2026-08-17T03:20:55.801Z
---

Phân quyền hiện tại: mô hình permission-based (đã xóa subsystem Role) — user nhận quyền qua UserPermissionOverride (user_permission_override) + UserGroup.permissions (user_group_permissions), hợp nhất trong User.getAllPermissions(); group KHÔNG thể mang quyền toàn cục group:manage/admin:all/orgunit:scope_all/* (User.java:149-155). Thi hành 2 lớp: PermissionMiddleware (URL→resource qua alias map, method→action) + @PreAuthorize @auth.check (PermissionAuthorizationManager). JWT nhúng permissions + permission_version (JwtUtil.generateAccessToken), Redis cache PermissionCacheService.
