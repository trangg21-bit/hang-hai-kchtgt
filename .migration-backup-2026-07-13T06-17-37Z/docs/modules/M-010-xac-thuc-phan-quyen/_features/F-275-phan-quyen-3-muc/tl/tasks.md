# F-275: Phan quyen 3 muc (3-Level ACL) -- Task Breakdown (Tech-Lead)

> Module: M-010 (Xac thuc & Phan quyen)
> TL version: v1.0 - 2026-06-23
> SA Design: sa/feature-design.md
> Implementation Plan: implementation-plan.md
> Target stack: Spring Boot 3.3.6 / Java 17 / PostgreSQL / Spring Security / React 19 + Ant Design 6 + Zustand 4.x

---

## 1. Wave 1: Foundation — Entities, Repositories, Migration (Dev-days: 3)

### T-275-01: Permission Entity (0.25 day)
| Owner | Backend Dev |
| Files | security/entity/Permission.java |
| Description | Entity: id (BIGINT PK), code (VARCHAR 100 UNIQUE NOT NULL, @Pattern "^[a-z][a-z0-9]*:[a-z][a-z0-9]*$"), feature (VARCHAR 50 NOT NULL), operation (VARCHAR 30 NOT NULL), description (TEXT), createdAt, updatedAt. Index on code (unique), feature+operation (unique composite). BR-275-01 enforcement. |
| Dependencies | None (BaseEntity convention) |
| Acceptance | DDL generates. @Pattern validation rejects uppercase/dashes. UNIQUE constraint enforced. |

### T-275-02: Role Entity (0.25 day)
| Owner | Backend Dev |
| Files | security/entity/Role.java |
| Description | Entity: id (BIGINT PK), name (VARCHAR 50 NOT NULL), code (VARCHAR 30 UNIQUE NOT NULL), description (TEXT), level (INT DEFAULT 0, >= 0), isSystem (BOOLEAN DEFAULT false), hierarchyDepth (INT DEFAULT 0), createdAt, updatedAt. Index on code (unique), isSystem + level. BR-275-03 protection (system roles). |
| Dependencies | None |
| Acceptance | DDL generates. level >= 0 enforced. isSystem defaults to false. |

### T-275-03: RolePermission Entity (0.25 day)
| Owner | Backend Dev |
| Files | security/entity/RolePermission.java |
| Description | Entity: id (BIGINT PK), roleId (FK→Role), permissionId (FK→Permission), grantedBy (FK→UserAccount), grantedAt (TIMESTAMP). Composite unique on (roleId, permissionId). Index on roleId, permissionId, grantedBy. |
| Dependencies | T-275-01, T-275-02 |
| Acceptance | DDL generates. Composite unique prevents duplicate role-permission assignments. |

### T-275-04: UserAccount Entity Extension (0.25 day)
| Owner | Backend Dev |
| Files | user/entity/UserAccount.java (extend) |
| Description | Add/verify fields: organizationId (FK→Organization), status (ENUM), mfaEnabled (BOOLEAN). Existing User entity from F-271/F-272 may need extension with orgId FK. |
| Dependencies | F-271 (existing User entity), T-275-08 (Organization) |
| Acceptance | UserAccount has organizationId FK. Status and mfaEnabled fields exist. |

### T-275-05: UserRole Entity (0.25 day)
| Owner | Backend Dev |
| Files | security/entity/UserRole.java |
| Description | Entity: id (BIGINT PK), userId (FK→UserAccount), roleId (FK→Role), assignedBy (FK→UserAccount), assignedAt (TIMESTAMP), expiresAt (TIMESTAMP NULL), isDirectGrant (BOOLEAN DEFAULT false). Composite unique on (userId, roleId) for non-direct grants. Index on userId+expiresAt (for active role lookup). BR-275-05, BR-275-06 enforcement. |
| Dependencies | T-275-02 |
| Acceptance | DDL generates. isDirectGrant default false. Composite unique works. |

### T-275-06: Organization Entity (0.5 day)
| Owner | Backend Dev |
| Files | security/entity/Organization.java |
| Description | Entity: id (BIGINT PK), name (VARCHAR 100 NOT NULL), code (VARCHAR 30 UNIQUE NOT NULL), parentId (FK→Organization NULL), hierarchyPath (VARCHAR 500), hierarchyDepth (INT DEFAULT 0), status (VARCHAR 20), coefficient (DECIMAL 5,2), createdAt, updatedAt. Index on hierarchyPath (for LIKE query). BR-275-04 subtree queries. |
| Dependencies | None |
| Acceptance | DDL generates. Nullable self-FK works. hierarchyPath indexed for LIKE query. |

### T-275-07: AuditLog Entity (0.25 day)
| Owner | Backend Dev |
| Files | security/entity/AuditLog.java |
| Description | Entity: id (BIGINT PK), userId (FK→UserAccount NULL), username (VARCHAR 50), action (VARCHAR 50), resource (VARCHAR 200), requiredPermission (VARCHAR 100), granted (BOOLEAN), ipAddress (VARCHAR 45), userAgent (TEXT), details (JSON/JSONB), createdAt (TIMESTAMP). Index on userId+createdAt, granted+createdAt, action+createdAt. |
| Dependencies | None |
| Acceptance | DDL generates. details stored as JSONB (PostgreSQL) or JSON (H2/MySQL). |

### T-275-08: Repositories (1 day)
| Owner | Backend Dev |
| Files | security/repository/PermissionRepository.java, security/repository/RoleRepository.java, security/repository/RolePermissionRepository.java, security/repository/UserAccountRepository.java, security/repository/UserRoleRepository.java, security/repository/OrganizationRepository.java, security/repository/AuditLogRepository.java |
| Description | 7 repository interfaces. Key custom queries: RoleRepository.findRoleByCode(), findRolesByLevel(); RolePermissionRepository.findPermissionCodesByRoleId(Long); UserRoleRepository.findActiveRolesByUserId(Long), findPermissionCodesByUserIdAndDirectGrant(Long, boolean); OrganizationRepository.findByHierarchyPathLike(String), findDescendantOrgIds(Long); AuditLogRepository.findDeniedAccesses(Pageable), countDeniedAccesses(); PermissionRepository.findByFeature(String). |
| Dependencies | T-275-01 through T-275-07 |
| Acceptance | All custom queries compile. Result types match entity fields. |

### T-275-09: Migration Scripts + Seed Data (0.5 day)
| Owner | Backend Dev |
| Files | db/migration/V1__initial_auth_schema.sql, db/migration/V2__seed_permissions_roles.sql |
| Description | DDL for all 7 new tables (or 6 if UserAccount extended). System seed: SUPER_ADMIN, SYSTEM_ADMIN, SECURITY_ADMIN, CANH_VUC, CHI_CUC, DON_VI, CHUYEN_VIEN, LEAD_DAO roles. Sample permissions for each feature module. |
| Dependencies | T-275-08 |
| Acceptance | Flyway migration runs clean. Seed data creates expected roles and ~50 permissions. |

---

## 2. Wave 2: Core Services — Permission Evaluation + Org (Dev-days: 2.5)

### T-275-10: PermissionEvaluationService (1 day)
| Owner | Backend Dev |
| Files | security/service/PermissionEvaluationService.java |
| Description | Core permission engine. Methods: isSuperAdmin(roleCode) — BR-275-02 shortcut, evaluatePermissions(userId) — union of role perms + direct grants, hasPermission(userId, code), hasAnyPermission(userId, codes...), hasAllPermissions(userId, codes...), evaluateWithBreakdown(userId) — diagnostic with full breakdown. Wave 1: recompute from DB on every request (2 queries max). |
| Dependencies | T-275-08 (repositories) |
| Acceptance | evaluatePermissions returns union of role permissions + direct grants. isSuperAdmin is string comparison only (no DB). hasAnyPermission uses OR logic, hasAllPermissions uses AND logic. |

### T-275-11: PermissionService (CRUD) (0.5 day)
| Owner | Backend Dev |
| Files | security/service/PermissionService.java |
| Description | Permission CRUD: createPermission (BR-275-01 code validation), updatePermission, deletePermission, listPermissions(feature filter). @Pattern validation at DTO level + DB CHECK constraint. Audit every change. |
| Dependencies | T-275-01, T-275-08 |
| Acceptance | createPermission rejects invalid code format. CRUD operations audit-logged. |

### T-275-12: RoleService (CRUD + Protection) (0.5 day)
| Owner | Backend Dev |
| Files | security/service/RoleService.java |
| Description | Role CRUD: createRole, updateRole, deleteRole (BR-275-03: throws SystemRoleModificationException for isSystem=true), cloneRole, getRoleWithPermissions(Long). System role protection enforced. |
| Dependencies | T-275-02, T-275-08 |
| Acceptance | deleteRole throws for isSystem=true. cloneRole creates independent copy with new ID. |

### T-275-13: UserRoleService (Assign/Revoke + Level Constraint) (0.5 day)
| Owner | Backend Dev |
| Files | security/service/UserRoleService.java |
| Description | User-role management: assignRole (BR-275-05 level constraint check), revokeRole (BR-275-06: last role revocation triggers full permission re-eval), grantDirectPermissions (userId, permissionIds), revokeDirectPermission, getUserRoles, hasRole. Audit every assignment. |
| Dependencies | T-275-05, T-275-08, T-275-12 |
| Acceptance | assignRole throws RoleLevelViolationException if target role level > user's current highest role level. revokeRole on last role clears all non-direct permissions. |

### T-275-14: OrganizationService (Subtree Query) (0.5 day)
| Owner | Backend Dev |
| Files | security/service/OrganizationService.java |
| Description | Org hierarchy: findDescendantOrgIds(parentId) — LIKE hierarchyPath query (BR-275-04), isDescendant(childId, ancestorId), updateHierarchyPath(orgId, newParentId), getEffectiveOrgIds(currentOrgId), getAllOrgIds. Transaction-safe hierarchy updates. |
| Dependencies | T-275-06, T-275-08 |
| Acceptance | findDescendantOrgIds returns all descendant org IDs using hierarchyPath LIKE. updateHierarchyPath updates all affected paths atomically. |

---

## 3. Wave 3: Middleware — Filters + Interceptors + Context (Dev-days: 2)

### T-275-15: CurrentUserContext + DataScopeContext (0.25 day)
| Owner | Backend Dev |
| Files | security/context/CurrentUserContext.java, security/context/DataScopeContext.java |
| Description | ThreadLocal holders: CurrentUserContext (userId, username, roleCodes, permissionSet), DataScopeContext (effectiveOrgIds). Must implement cleanup in @After advice (R2: ThreadLocal leak prevention). |
| Dependencies | None |
| Acceptance | ThreadLocal set + get works correctly. cleanup() called in finally block. |

### T-275-16: RequiresPermission + DataScope + AuditLog Annotations (0.25 day)
| Owner | Backend Dev |
| Files | security/annotation/RequiresPermission.java, security/annotation/DataScope.java, security/annotation/DataScopeType.java, security/annotation/AuditLog.java, security/annotation/AuditAction.java |
| Description | Custom annotations: @RequiresPermission("phanhien:write") (METHOD + TYPE), @DataScope(DataScopeType.CHILDREN/SELF/ALL/CUSTOM, orgField/ownerField) (METHOD), @AuditLog(AuditAction.DATA_CREATED, resource, requiredPermission) (METHOD). |
| Dependencies | None |
| Acceptance | Annotations compile. Retention set to RUNTIME for AOP reflection. |

### T-275-17: JwtAuthenticationFilter + JwtUtil (0.5 day)
| Owner | Backend Dev |
| Files | security/filter/JwtAuthenticationFilter.java, security/filter/JwtUtil.java |
| Description | JWT decode + SecurityContext population. JwtUtil: parse token, extract sub, roles, permissions claims. JwtAuthenticationFilter: decode header → load user → populate CurrentUserContext → set SecurityContext. |
| Dependencies | T-275-10 (PermissionEvaluationService for claims), T-275-15 (CurrentUserContext) |
| Acceptance | Valid JWT sets SecurityContext with user + roles + permissions. Invalid JWT returns 401 without forwarding. |

### T-275-18: PermissionCheckInterceptor + AccessDeniedHandler (0.5 day)
| Owner | Backend Dev |
| Files | security/interceptor/PermissionCheckInterceptor.java, security/interceptor/CustomAccessDeniedHandler.java |
| Description | Interceptor for /api/v1/** (excluding auth/public): checks @RequiresPermission on method → PermissionEvaluationService.hasPermission → if denied, log to AuditLog (sync, BR-275-07) → return 403 with requiredPermission code (BR-275-11). CustomAccessDeniedHandler: format 403 error body with permission code. |
| Dependencies | T-275-10, T-275-15, T-275-16 |
| Acceptance | Unauthorized request returns 403 with requiredPermission code. 403 decision logged to AuditLog sync. |

### T-275-19: SecurityConfig (Filter Chain + Method Security) (0.5 day)
| Owner | Backend Dev |
| Files | config/SecurityConfig.java |
| Description | Spring Security config: JwtAuthenticationFilter in chain, PermissionCheckInterceptor on /api/v1/**, @EnableMethodSecurity for @PreAuthorize. Public endpoints: /api/v1/auth/login, /api/v1/auth/register, /api/v1/auth/refresh, /api/v1/health, /api/v1/public/**. Any other request authenticated. PasswordEncoder: BCrypt. |
| Dependencies | T-275-17, T-275-18 |
| Acceptance | Filter chain: JwtAuth → PermissionInterceptor → Controller. Public endpoints accessible without auth. |

---

## 4. Wave 4: AOP Aspects + Data Scope Filter (Dev-days: 1.5)

### T-275-20: DataScopeAspect (0.5 day)
| Owner | Backend Dev |
| Files | security/aspect/DataScopeAspect.java |
| Description | AOP aspect for @DataScope annotation. @Before: extract scope type → resolve effective org IDs → set DataScopeContext. @After: cleanup DataScopeContext. Implements BR-275-04 (org subtree) + BR-275-10 (data filter always applied). |
| Dependencies | T-275-14 (OrganizationService), T-275-15 (DataScopeContext) |
| Acceptance | @DataScope method sees correct effective org IDs. Context cleaned up in @After. |

### T-275-21: DataScopeSpecification (JPA) (0.25 day)
| Owner | Backend Dev |
| Files | security/spec/DataScopeSpecification.java, security/spec/AuditLogSpecification.java |
| Description | JPA Specification factory: forOrgIds(fieldPath, orgIds) → WHERE entity.orgId IN (:orgIds), forOwnerId(ownerField, userId) → WHERE createdBy = userId, combined() → OR combination, andAll() → AND combination. AuditLogSpecification for dynamic audit log filtering. |
| Dependencies | None |
| Acceptance | Specifications produce correct JPQL WHERE clauses. Empty orgIds returns no filter. |

### T-275-22: DataScopeJpaRepository Mixin (0.25 day)
| Owner | Backend Dev |
| Files | security/repository/DataScopeJpaRepository.java |
| Description | Base repository interface extending JpaRepository with Specification methods: findAll(Specification), findAll(Specification, Pageable), count(Specification). Business repositories inherit this for data scope support. |
| Dependencies | T-275-21 |
| Acceptance | Inherited repositories support Specification-based queries. |

### T-275-23: AuditLogAspect (0.25 day)
| Owner | Backend Dev |
| Files | security/aspect/AuditLogAspect.java |
| Description | AOP aspect for @AuditLog annotation on service methods. @Around: log entry creation/update/deletion, call async audit logging (batched via @Async executor), error handling (rethrow). |
| Dependencies | T-275-24 (AuditLogService), T-275-15 (CurrentUserContext) |
| Acceptance | Annotated methods produce async audit log entries. Errors rethrown. |

### T-275-24: AuditLogService (Sync + Async) (0.5 day)
| Owner | Backend Dev |
| Files | security/service/AuditLogService.java |
| Description | Audit logging: logSync() for critical events (permission decisions, role changes — BR-275-07), logAsync() for batched non-critical events, findDeniedAccesses(), countDeniedAccesses(). Async via ThreadPoolTaskExecutor (audit-logging- prefix). |
| Dependencies | T-275-07, T-275-08 |
| Acceptance | logSync persists immediately. logAsync queues to executor. findDeniedAccesses returns paginated 403 decisions. |

---

## 5. Wave 5: Controllers + DTOs (Dev-days: 2)

### T-275-25: DTOs (0.5 day)
| Owner | Backend Dev |
| Files | security/dto/PermissionDto.java, security/dto/RoleDto.java, security/dto/CreatePermissionRequest.java, security/dto/CreateRoleRequest.java, security/dto/AssignRoleRequest.java, security/dto/AssignPermissionsRequest.java, security/dto/EvaluationResult.java, security/dto/AuditLogDto.java, security/dto/ForbiddenResponse.java, security/dto/PaginationResponse.java |
| Description | 10 DTOs for API contracts. CreatePermissionRequest has @Pattern validation. AssignRoleRequest has roleId + isDirectGrant field. EvaluationResult has userId + permissionSet + roles + directGrants breakdown. ForbiddenResponse includes requiredPermission field (BR-275-11). |
| Dependencies | None |
| Acceptance | All DTOs compile. Jackson serialization/deserialization correct. @Pattern validation works. |

### T-275-26: PermissionController (0.25 day)
| Owner | Backend Dev |
| Files | security/controller/PermissionController.java |
| Description | CRUD endpoints: GET/POST/PUT/DELETE /api/v1/permissions. GET with feature filter. Super Admin only for write operations. |
| Dependencies | T-275-11, T-275-25 |
| Acceptance | All CRUD endpoints work. Write operations require Super Admin. |

### T-275-27: RoleController (0.25 day)
| Owner | Backend Dev |
| Files | security/controller/RoleController.java |
| Description | CRUD + operations: GET/POST/PUT/DELETE /api/v1/roles, GET /api/v1/roles/{id}/permissions, POST /api/v1/roles/{id}/permissions, DELETE /api/v1/roles/{id}/permissions/{permissionId}. Clone role. Super Admin for write. |
| Dependencies | T-275-12, T-275-25 |
| Acceptance | CRUD works. deleteRole throws 400 for isSystem=true. Permissions assignment works. |

### T-275-28: UserRoleController (0.5 day)
| Owner | Backend Dev |
| Files | security/controller/UserRoleController.java |
| Description | User-role management: GET/POST/DELETE /api/v1/users/{id}/roles, GET /api/v1/users/{id}/roles (Self + Admin), POST /api/v1/users/{id}/permissions (direct grant), DELETE /api/v1/users/{id}/permissions/{permissionId} (revoke direct). Admin + Self endpoints. |
| Dependencies | T-275-13, T-275-25 |
| Acceptance | Role assignment/revoke works. Direct grant works. Level constraint enforced (BR-275-05). |

### T-275-29: AuditLogController (0.25 day)
| Owner | Backend Dev |
| Files | security/controller/AuditLogController.java |
| Description | Audit query: GET /api/v1/audit-logs?granted=false, status, startDate, endDate, action, userId. Paginated results. Security Admin + Admin only. |
| Dependencies | T-275-24, T-275-25 |
| Acceptance | Filtered queries work. Paginated. 403 for unauthorized. |

---

## 6. Wave 6: Testing + Hardening (Dev-days: 3)

### T-275-30: Unit Tests — Permission Evaluation (1 day)
| Owner | QA Engineer |
| Description | Unit tests: PermissionEvaluationService (100+ permission combinations: feature × operation × role), isSuperAdmin shortcut, hasAny/hasAll logic, evaluateWithBreakdown breakdown accuracy. RoleHierarchyTest (BR-275-05 level constraint). PermissionCodeValidationTest (@Pattern validation). SystemRoleProtectionTest (BR-275-03 delete protection). |
| Dependencies | T-275-10 through T-275-13 |
| Acceptance | >95% pass rate. 100+ permission combo tests cover edge cases. |

### T-275-31: Unit Tests — Data Scope + Org (0.5 day)
| Owner | QA Engineer |
| Description | DataScopeFilterTest: findDescendantOrgIds for hierarchyPath LIKE. forOrgIds with empty list returns no WHERE. Combined spec (org OR ownership). ThreadLocal leak test (verify cleanup in @After). |
| Dependencies | T-275-14, T-275-20, T-275-21 |
| Acceptance | Subtree queries correct. ThreadLocal cleaned up in all paths. |

### T-275-32: Integration Tests (1 day)
| Owner | QA Engineer |
| Description | Full CRUD pipeline: create role → assign permissions → assign to user → verify access (200 allowed, 403 denied). Direct grant override: grant direct perm → revoke all roles → access still allowed. Org hierarchy: org tree → assign users → verify data scope limits results. Token refresh with org change: 401 (orgVersion mismatch, BR-275-12). Permission evaluation: simulate request → verify 403/200. Audit log: every decision logged. |
| Dependencies | T-275-15 through T-275-29 |
| Acceptance | >90% pass rate. All BR-275 rules tested via integration paths. |

### T-275-33: E2E + Security Tests (0.5 day)
| Owner | QA Engineer |
| Description | E2E: Super Admin full access, System Admin module-level access, Security Admin audit-only, Unit user data-scoped access, Role revocation → all permissions lost, Org transfer → old token invalidated. Security: JWT tampering rejected, horizontal privilege escalation blocked, vertical privilege escalation blocked, missing authorization on all endpoints. |
| Dependencies | T-275-32 |
| Acceptance | All E2E flows pass. Security tests confirm no unprotected endpoints. |

### T-275-34: UI Integration Tests (Frontend) (0.5 day)
| Owner | Frontend Dev |
| Description | PermissionGuard component: render with/no permissions, hidden elements correct. usePermissions hook: checks, caching. ProtectedLayout: navigation filtering. AuthContext: permission state from JWT. |
| Dependencies | T-275-13 (PermissionGuard), T-275-14 (authStore), T-275-15 (usePermissions) |
| Acceptance | PermissionGuard hides/disables correctly. React component tests pass. |

---

## 7. Dependency Map

### Internal Dependencies (within M-010)
| Task | Depends On |
| T-275-01 to T-275-34 | F-271 (UserAccount entity from User) |
| T-275-17 (JwtFilter) | F-274 (JwtUtil for token decode, TokenService for claims validation) |
| T-275-27 (Role CRUD) | F-274 (Role entity level field used in JWT claims) |
| T-275-26 (Permission CRUD) | F-274 (Permission entity codes used in JWT payload claims) |
| T-275-15 (CurrentUserContext) | F-274 (JWT claims: sub, roles, permissions in payload) |

### External Dependencies
| Feature | Dependency | Impact |
| F-271 | UserAccount entity (base user with orgId FK) | F-275 role assignments target F-271 users |
| F-272 | UserAccount (mfaEnabled, organizationId) | F-272 login triggers F-275 permission evaluation |
| F-273 | UserAccount (totp_enabled) | Same as F-272 |
| F-274 | Role + Permission entities (JWT payload claims) | F-274 embeds F-275 role/permission data in JWT tokens |
| F-276 | No direct dependency | F-276 password policy separate concern |
| F-277 | No direct dependency | F-277 lockout separate concern |
| M-001, M-007, M-009 (business modules) | All consume F-275 middleware | These modules must add @RequiresPermission + @DataScope to their endpoints |

---

## 8. Task Estimation Summary
| Phase | Tasks | Total Dev-Days |
| Wave 1: Foundation (Entities + Migration) | T-275-01 to T-275-09 | ~3 days |
| Wave 2: Core Services (Permission + Org) | T-275-10 to T-275-14 | ~2.5 days |
| Wave 3: Middleware (Filters + Interceptors) | T-275-15 to T-275-19 | ~2 days |
| Wave 4: AOP Aspects + Data Scope | T-275-20 to T-275-24 | ~1.5 days |
| Wave 5: Controllers + DTOs | T-275-25 to T-275-29 | ~2 days |
| Wave 6: Testing + Hardening | T-275-30 to T-275-34 | ~3 days |
| **Total** | **34 tasks** | **~14 days** |

---

## 9. Implementation Order (Critical Path)
T-275-01 (Permission entity) -> T-275-02 (Role entity) -> T-275-05 (UserRole entity) -> T-275-08 (Repositories) -> T-275-10 (PermissionEvaluationService) -> T-275-17 (JwtFilter) -> T-275-26 (PermissionController) -> T-275-30 (Unit Tests)
T-275-06 (Organization entity) -> T-275-14 (OrganizationService) -> T-275-20 (DataScopeAspect) -> T-275-21 (DataScopeSpecification) -> T-275-31 (DataScope Tests)
T-275-07 (AuditLog entity) -> T-275-24 (AuditLogService) -> T-275-18 (PermissionInterceptor) -> T-275-29 (AuditLogController) -> T-275-32 (Integration Tests)
T-275-03 (RolePermission entity) -> T-275-12 (RoleService) -> T-275-13 (UserRoleService) -> T-275-27/28 (Role/UserRole Controllers) -> T-275-33 (E2E)
T-275-04 (UserAccount ext) -> T-275-09 (Migration + Seed) -> T-275-19 (SecurityConfig) -> T-275-34 (UI Tests)
T-275-15 (Contexts) -> T-275-16 (Annotations) -> T-275-22 (DataScopeRepo) -> T-275-23 (AuditLogAspect)

All tasks target: Spring Boot 3.3.6 / Java 17 / PostgreSQL

---

## 10. Cross-Feature Integration Notes

### F-274 + F-275 Integration
- **JWT payload**: F-274 creates tokens containing `roles` + `permissions` arrays loaded from F-275 Role + Permission entities.
- **Token refresh**: F-274 refreshAccessToken reloads roles+permissions from F-275 (ensures up-to-date claims).
- **Org change invalidation**: F-275 BR-275-12 (org hierarchy change → token invalidation) requires F-274 to check orgVersion on refresh.
- **Security context**: F-275 PermissionEvaluationService provides the evaluation logic consumed by F-274's SecurityContext setup.

### Dependency Order
1. F-271 (User entity baseline) → 2. F-274 (JWT session entities, tokens) + F-275 (role/permission entities) can run in parallel → 3. F-272/F-273 (login flow) consume both.
