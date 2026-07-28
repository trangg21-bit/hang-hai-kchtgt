# QA Wave-2 Report: F-275 Scope-Expansion Gaps

**Date:** 2026-07-28  
**Feature:** F-275 — 3-Level RBAC  
**QA Stage:** Wave-2 Validation  
**Verdict:** Pass (11/11 checks, mvn compile exit 0)

---

## Validation Results

| # | Check | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | Role fields | **Pass** | `Role.java:33-47` — level (Integer, default 99), isSystem (Boolean, default false), hierarchyDepth (Integer, default 0) — all with `@Column(nullable=false)` + `@ColumnDefault` + field initializer |
| 2 | Migration V104 | **Pass** | `V104__add_role_level_fields.sql` — 3x `ALTER TABLE app_roles ADD COLUMN IF NOT EXISTS` + 3x `UPDATE` for SYSTEM_ADMIN, ADMIN, MANAGER/USER/VIEWER |
| 3 | data.sql update | **Pass** | `data.sql` INSERT into app_roles includes `level, is_system, hierarchy_depth` columns. SYSTEM_ADMIN=(0,true,0), ADMIN=(1,false,0), MANAGER/USER/VIEWER=(3,false,0) |
| 4 | PermissionRoleService | **Pass** | `PermissionRoleService.java` — `checkPermission(UUID,String,String)→boolean` with Super Admin bypass (`isSuperAdmin`) + wildcard `resource:*` matching; `checkAnyPermission`, `checkAllPermissions`, `getUserPermissions`; `@Value("${security.permission.super-admin-role-code:SYSTEM_ADMIN}")` |
| 5 | PermissionMiddleware | **Pass** | `PermissionMiddleware.java` — extends `OncePerRequestFilter`; skips OPTIONS + `/api/auth/**`, `/api/public/**`, `/api/health/**`, `/api/v1/auth/**`; extracts resource from `/api/v1/{resource}/...` path; maps GET→read, POST/PUT/PATCH→write, DELETE→delete; resolves `User` from `SecurityContext`; returns 403 JSON with `{status, error, path, message, timestamp, requiredPermission, granted}` (BR-275-11) |
| 6 | UserRole entity | **Pass** | `UserRole.java` — `@Entity @Table(name="user_roles_tracking") extends BaseEntity`; fields: user (`@ManyToOne→User`), role (`@ManyToOne→Role`), assignedBy (`@ManyToOne→User`), assignedAt, expiresAt, isDirectGrant (default false) |
| 7 | UserRoleRepository | **Pass** | `UserRoleRepository.java` — `JpaRepository<UserRole, UUID>`; `findByUserId`, `findByRoleId`, `findByUserIdAndIsDirectGrant`, `findByUserIdAndRoleId`, `deleteByUserIdAndRoleId` |
| 8 | DataScopeAspect + @DataScope | **Pass** | `DataScopeAspect.java` — `@Aspect @Component`, `@Around("@annotation(dataScope)")` stub (logs + proceeds). `DataScope.java` — `@Target(METHOD) @Retention(RUNTIME)`, `orgField()` default "orgUnit", `ownerField()` default "createdBy" |
| 9 | PermissionsPage.tsx | **Pass** | `frontend/src/pages/PermissionsPage.tsx` — uses `ScreenHeader`, `FilterBar`, `DataTable`, `Pagination`; search + feature filter + CRUD modal; no hardcoded hex colors (all styles via `tokens.ts` + `theme.ts`) |
| 10 | Compilation | **Pass** | `mvn compile -q` → exit code 0, no errors (3812ms) |
| 11 | Role.java preserved | **Pass** | Existing fields (name, code, description, permissions ManyToMany, RoleStatus status, userCount) all intact; 3 new fields inserted after description, before permissions |

---

## Summary

- **Pass:** 11 / **Fail:** 0
- **mvn compile:** exit code 0
- **Overall:** **Pass**

All 11 scope-expansion gaps claimed by the development wave have been independently verified against the actual source files. No blockers found.
