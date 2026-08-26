---
id: AM-345178e55a68f661
kind: decision
topic: port-berth-pier-ungated
tags: []
importance: 0.8
agent: 
created: 2026-08-14T08:25:55.138Z
updated: 2026-08-14T08:25:55.138Z
---

Cảng biển/bến cảng/cầu cảng (port/berth/pier) được 'tắt quyền' (luôn có quyền cho mọi user đã đăng nhập) theo yêu cầu user 2026-08-14. Implement theo bypass TRUNG TÂM: frontend hasPermissionFromList (frontend/src/store/permissionStore.ts) thêm const ALWAYS_ALLOWED_RESOURCES = Set(['port','berth','pier']) kiểm tra normalizedKey.split(':',2)[0]; backend PermissionAuthorizationManager.check() (src/main/java/.../security/) thêm private static final Set<String> ALWAYS_ALLOWED_RESOURCES = Set.of('port','berth','pier') + helper resourceOf() ngay sau normalize(requiredPermission). KHÔNG xóa @PreAuthorize/PermissionGuard riêng lẻ. Đồng thời fix crash React: xóa 3 dòng key undefined trong rawPermissionTree của permissions.ts (PERMISSIONS.ROLE.MANAGE, PERMISSIONS.PORT.APPROVE_C1/C2). Gate verify frontend = npm run build (vite, exit 0); backend KHÔNG compile được trong shell (mvn không trên PATH, không có mvnw) — user build bằng IntelliJ.
