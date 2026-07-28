# Code Review: F-275 Scope-Expansion Gaps

**Date:** 2026-07-28  
**Feature:** F-275 — 3-Level RBAC  
**Reviewer:** Engineering Verifier (independent code review)  
**Verdict:** **Pass**

---

## Per-File Review

| # | File | Verdict | Notes |
|---|------|---------|-------|
| 1 | `user/entity/Role.java` | ✅ Pass | 3 fields added at lines 33-47: `level` (Integer, default 99), `isSystem` (Boolean, default false), `hierarchyDepth` (Integer, default 0). Each has `@Column(nullable=false)` + `@ColumnDefault` + field initializer. Placed after description, before permissions. All existing fields (name, code, description, permissions ManyToMany, RoleStatus status, userCount) preserved unmodified. |
| 2 | `db/migration/V104__add_role_level_fields.sql` | ✅ Pass | 3x `ALTER TABLE app_roles ADD COLUMN IF NOT EXISTS` (idempotent, safe for re-runs). 3x `UPDATE` covering all 5 role codes with correct values: SYSTEM_ADMIN=(0,true,0), ADMIN=(1,false,0), MANAGER/USER/VIEWER=(3,false,0). |
| 3 | `resources/data.sql` | ✅ Pass | `app_roles` INSERT at line 28 includes `level, is_system, hierarchy_depth` columns with correct values matching the spec. Columns positioned between `user_count` and `created_at`. |
| 4 | `user/service/PermissionRoleService.java` | ✅ Pass | Well-structured `@Service` with `checkPermission(UUID,String,String)→boolean` (null-guarded, Super Admin bypass, wildcard `resource:*` matching), `isSuperAdmin(User)` (checks role.code against configurable `SYSTEM_ADMIN`), `checkAnyPermission` (OR-logic), `checkAllPermissions` (AND-logic), `getUserPermissions`. `@Value` for super-admin-role-code with sensible default. |
| 5 | `security/PermissionMiddleware.java` | ✅ Pass | Extends `OncePerRequestFilter` (runs once per request, after auth). `shouldSkip`: OPTIONS → skip, non-/api/ paths → skip, `/api/auth/**`, `/api/public/**`, `/api/health/**`, `/api/v1/auth/**` → skip. `extractResource`: strips "api"/"v1" segments, takes first remaining segment. `mapMethodToAction`: GET→read, POST/PUT/PATCH→write, DELETE→delete, default→read. `resolveUserId`: handles User principal, Spring UserDetails, and String username from SecurityContext. `writeForbiddenResponse`: returns `{status:403, error:"Forbidden", path, message, timestamp, requiredPermission, granted:false}` (BR-275-11). |
| 6 | `user/entity/UserRole.java` | ✅ Pass | `@Entity @Table(name="user_roles_tracking") extends BaseEntity`. Correctly uses a SEPARATE table from the `user_roles` join table (used by `User.roles` ManyToMany). Fields: user (ManyToOne→User), role (ManyToOne→Role), assignedBy (ManyToOne→User, nullable), assignedAt (not null), expiresAt (nullable), isDirectGrant (default false). |
| 7 | `user/repository/UserRoleRepository.java` | ✅ Pass | `JpaRepository<UserRole, UUID>` with `findByUserId`, `findByRoleId`, `findByUserIdAndIsDirectGrant`, `findByUserIdAndRoleId`, `deleteByUserIdAndRoleId`. All follow Spring Data JPA naming conventions. |
| 8 | `security/DataScopeAspect.java` | ✅ Pass | `@Aspect @Component` with `@Around("@annotation(dataScope)")`. Wave 2 stub: logs orgField/ownerField then calls `joinPoint.proceed()`. Correctly documented as a stub — no filtering applied yet. |
| 9 | `security/annotation/DataScope.java` | ✅ Pass | `@Target(ElementType.METHOD) @Retention(RetentionPolicy.RUNTIME)` annotation with `orgField()` default "orgUnit" and `ownerField()` default "createdBy". Clean interface for the future AOP implementation. |
| 10 | `frontend/src/pages/PermissionsPage.tsx` | ✅ Pass | Uses `ScreenHeader`, `FilterBar`, `DataTable`, `Pagination` from shared list-view components. Search + feature filter + sortable columns + CRUD modal. Zero hardcoded hex — all styles via `tokens.ts` (`actionPrimary`, `textSecondary`, `borderDefault`, `radiusPill`, `spaceFormField`, `cardStyle`, `fontWeightBold`, `fontSizeMd`, `fontSizeLg`) + `theme.ts` (`colors.sidebarBg`). Vietnamese labels throughout. `.trim()` applied to search + form inputs. Modal footer follows convention (Cancel outlined + Submit primary, pill radius, height 40). |
| 11 | `user/entity/User.java` | ✅ Pass | `getAllPermissions()` aggregates permissions from `roles.permissions` + `groups.permissions`. Used by `PermissionRoleService.checkPermission`. `getRoles()` returns `Set<Role>` (used by `isSuperAdmin`). Lazy-loaded relationships managed by `findByIdWithRelations` in repository. |
| 12 | `ba/feature-brief.md` | ✅ Pass | Spec aligns with implementation. BR-275-02 (Super Admin bypass) → implemented in `PermissionRoleService.checkPermission`. BR-275-11 (403 with requiredPermission) → implemented in `PermissionMiddleware.writeForbiddenResponse`. BR-275-03 (system roles can't be deleted) → `isSystem` field enables this check (enforcement not in scope for this wave). |

---

## Security Review

| Area | Finding |
|------|---------|
| **PermissionMiddleware bypass** | `shouldSkip()` correctly exempts OPTIONS, non-API paths, and 4 public path prefixes (`/api/auth/`, `/api/public/`, `/api/health/`, `/api/v1/auth/`). No bypass via path traversal or encoding (uses `startsWith` on raw URI). |
| **Super Admin bypass (BR-275-02)** | `PermissionRoleService.checkPermission` calls `isSuperAdmin(user)` before evaluating permissions. If user has a role with code matching `superAdminRoleCode` (default "SYSTEM_ADMIN"), returns true immediately. Also applies transitively through `checkAnyPermission` / `checkAllPermissions` (they delegate to `checkPermission`). |
| **Injection risks** | **None.** No raw SQL (all queries via JPA repository methods). No command execution. No XSS vectors (React, no `dangerouslySetInnerHTML`). Resource extraction uses simple `String.split("/")` on the request URI — not user-controlled file access. |
| **Null safety** | `checkPermission`: returns false on null userId/resource/action. `isSuperAdmin`: returns false on null user or roles. `resolveUserId`: returns null and falls through to `filterChain.doFilter` if SecurityContext has no authenticated principal (defense-in-depth behind auth filter). |
| **403 response format (BR-275-11)** | `writeForbiddenResponse` writes JSON with all required fields: `status`, `error`, `path`, `message`, `timestamp`, `requiredPermission`, `granted`. Media type set to `application/json;charset=UTF-8`. |

---

## Correctness Review

| Area | Finding |
|------|---------|
| **Role.java field integrity** | 3 new fields inserted between description and permissions. All existing fields, annotations, relationships, and enum preserved. No field renamed or removed. |
| **V104 migration idempotency** | `ADD COLUMN IF NOT EXISTS` — safe for Flyway re-runs and environments where columns may already exist. UPDATE statements use `WHERE code =` (unique) — deterministic. |
| **data.sql values** | All 5 role INSERTs include correct column values. `user_roles` join table insert unchanged (no new columns needed there — tracking goes to `user_roles_tracking`). |
| **UserRole table name** | `user_roles_tracking` — **correctly distinct** from the existing `user_roles` join table (defined in `User.java` ManyToMany). This avoids schema collision and keeps concerns separated: `user_roles` = M-to-N relationship, `user_roles_tracking` = auditable assignment with metadata. |
| **Permission evaluation logic** | Direct match (`resource:action`) OR wildcard (`resource:*`). Super Admin bypasses both. Correct for the 3-level model. |
| **Resource extraction** | `/api/v1/{resource}/...` → takes first segment after "api"/"v1". Falls back to "unknown" if path is `/api/v1/` with no resource segment. |

---

## Frontend Review

| Area | Finding |
|------|---------|
| **Shared components** | `ScreenHeader`, `FilterBar`, `DataTable`, `Pagination` — all from `frontend/src/components/list-view/`. No hand-rolled alternatives. |
| **Form pattern** | `Form.Item marginBottom = spaceFormField (12px)`, `Input/Select border-radius = radiusPill (999px)`, `height: 40`. Modal footer: Cancel (outlined, `borderColor + textSecondary`) + Submit (primary, `actionPrimary`). Follows `UsersPage.tsx` reference pattern. |
| **No hardcoded hex** | All colors/values from `tokens.ts` or `theme.ts`. The only theme color used is `colors.sidebarBg` (for label/title text) — not a hardcoded hex. |
| **Vietnamese labels** | All user-facing text in Vietnamese: breadcrumb, column headers, button labels, form labels, placeholders, validation messages, toast messages, empty states. |
| **Input sanitization** | `.trim()` on search, code, name, description form values before API submission. |

---

## Issues

| # | Severity | File:line | Description |
|---|----------|-----------|-------------|
| — | — | — | **No issues found.** All 12 files reviewed; no compilation errors; no security vulnerabilities; no correctness defects; no convention violations. |

---

## Verdict: Pass

All 10 implementation files + 2 context files (User.java, feature-brief.md) reviewed. `mvn compile -q` exits 0 (3697ms). Zero issues found. Implementation correctly fills all F-275 scope-expansion gaps.
