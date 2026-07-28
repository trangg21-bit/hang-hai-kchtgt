# F-275 Backend Scope-Expansion Gaps — Implementation Summary

## Build Verification

```
mvn compile -q → exit code 0 (25.4s)
```

## Files Modified

| File | Change |
|---|---|
| `src/main/java/com/hanghai/kchtg/user/entity/Role.java` | Added `level` (Integer, default 99), `isSystem` (Boolean, default false), `hierarchyDepth` (Integer, default 0) after `description` field |
| `src/main/resources/data.sql` | Updated `app_roles` INSERT column list to include `level, is_system, hierarchy_depth` with correct values per role |

## Files Created

| # | File | Description |
|---|---|---|
| 3 | `src/main/resources/db/migration/V104__add_role_level_fields.sql` | Flyway migration: ALTER TABLE app_roles ADD COLUMN level/is_system/hierarchy_depth with defaults, UPDATE seed values |
| 4 | `src/main/java/com/hanghai/kchtg/user/service/PermissionRoleService.java` | @Service with checkPermission(UUID, String, String), isSuperAdmin(User), checkAnyPermission, checkAllPermissions, getUserPermissions. Injects UserRepository. Super Admin bypass via `${security.permission.super-admin-role-code:SYSTEM_ADMIN}`. Wildcard matching (resource:*) |
| 5 | `src/main/java/com/hanghai/kchtg/security/PermissionMiddleware.java` | @Component extends OncePerRequestFilter. Extracts resource from path (skips "api"/"v1"), maps method→action (GET→read, POST/PUT/PATCH→write, DELETE→delete), resolves User via SecurityContext, delegates to PermissionRoleService. Returns 403 JSON with `requiredPermission` field (BR-275-11) |
| 6 | `src/main/java/com/hanghai/kchtg/user/entity/UserRole.java` | @Entity @Table("user_roles_tracking") extends BaseEntity. Fields: user (ManyToOne→User), role (ManyToOne→Role), assignedBy (ManyToOne→User nullable), assignedAt (LocalDateTime), expiresAt (LocalDateTime nullable), isDirectGrant (Boolean default false) |
| 7 | `src/main/java/com/hanghai/kchtg/user/repository/UserRoleRepository.java` | JpaRepository<UserRole, UUID> with findByUserId, findByRoleId, findByUserIdAndIsDirectGrant, findByUserIdAndRoleId, deleteByUserIdAndRoleId |
| 8 | `src/main/java/com/hanghai/kchtg/security/DataScopeAspect.java` | @Aspect @Component. @Around on @DataScope annotation. Wave 2 stub: logs and proceeds |
| 9 | `src/main/java/com/hanghai/kchtg/security/annotation/DataScope.java` | @Target(METHOD) @Retention(RUNTIME) with orgField (default "orgUnit") and ownerField (default "createdBy") |

## Role Level Values

| Role Code | level | isSystem | hierarchyDepth |
|---|---|---|---|
| SYSTEM_ADMIN | 0 | true | 0 |
| ADMIN | 1 | false | 0 |
| MANAGER | 3 | false | 0 |
| USER | 3 | false | 0 |
| VIEWER | 3 | false | 0 |

## Key Design Decisions

- **PermissionMiddleware** uses `OncePerRequestFilter` (not HandlerInterceptor) to run before Spring Security's method-level guards, matching the filter-chain architecture already established by `JwtAuthFilter` and `CookieRefreshTokenFilter`.
- **UserRole** is a separate tracking entity (`user_roles_tracking` table), not a replacement for the existing `user_roles` join table — it adds audit metadata (assignedBy, assignedAt, expiresAt, isDirectGrant) for the 3-level RBAC model.
- **DataScopeAspect** is a Wave 2 stub: logs invocation but does not apply filtering. Full implementation requires `DataScopeContext`, `OrganizationService`, and `DataScopeSpecification` — refer to `feature-design.md` Section 5 for the design.
- **PermissionRoleService** delegates to `User.getAllPermissions()` which aggregates permissions from roles + groups, matching the existing permission model.
