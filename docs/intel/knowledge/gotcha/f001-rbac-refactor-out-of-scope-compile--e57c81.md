---
id: AM-e57c81eec7def66c
kind: gotcha
topic: f001-rbac-refactor-out-of-scope-compile
tags: []
importance: 0.9
agent: 
created: 2026-08-14T06:57:44.576Z
updated: 2026-08-14T06:57:44.576Z
---

M-001/F-001 pipeline (2026-08-14) thực hiện refactor RBAC lớn NGOÀI phạm vi brief (chỉ yêu cầu 4 thay đổi UI nhỏ): xóa toàn bộ subsystem Role (Role.java, RoleService, RoleController, RoleRepository, UserRole, RoleStatus, RoleResponse, RolePermissionSeeder...) → thay bằng direct-permission model (PermissionRoleService, PermissionSeeder, H2Functions). Refactor dở dang làm compile backend vỡ giữa chừng (lỗi ở file đã xóa + tham chiếu sót); sau khi refactor ổn định thì compile BUILD SUCCESS. Gotcha: `mvn clean compile -q` trả NO output khi success (dễ đọc nhầm exit 0 = fail); xác minh thật bằng `mvn clean compile` (không -q) + kiểm tra .class files trong target/classes/.
