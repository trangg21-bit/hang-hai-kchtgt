# Tech-Lead Implementation Plan — F-275: Phân quyền 3 mức (3-Level ACL)

> **TL Plan** — Generated from SA Design (`sa/feature-design.md`) + Feature Brief (`feature-brief.md`).
> Tech stack: Spring Boot 3.3.6 / Java 17 / Spring Security / JPA-Hibernate / PostgreSQL / React 19 + Ant Design 6.
> Generated: 2026-06-23

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Component Breakdown](#2-component-breakdown)
3. [Package Structure](#3-package-structure)
4. [Interface Contracts](#4-interface-contracts)
5. [PermissionEvaluationService Design](#5-permissionevaluation-service-design)
6. [JPA Specification for Data Scope](#6-jpa-specification-for-data-scope)
7. [Spring Security Configuration](#7-spring-security-configuration)
8. [Audit Logging Integration](#8-audit-logging-integration)
9. [Cache Strategy](#9-cache-strategy)
10. [Implementation Phases & Timeline](#10-implementation-phases--timeline)
11. [Risk & Mitigation](#11-risk--mitigation)
12. [Code Review Checklist](#12-code-review-checklist)
13. [Testing Strategy](#13-testing-strategy)

---

## 1. Executive Summary

Feature F-275 deploys a 3-level ACL (Access Control List) system for the entire hang-hai-kchtgt platform. This is a **critical-path module** because all other business modules depend on this authorization layer.

### SA Design Summary

| Component | Description | SA Reference |
|---|---|---|
| Permission model | 3 levels: Feature -> Operation -> Data | Section 1.1, Section 2 |
| Middleware | JWT Auth Filter + Permission Interceptor + DataScope AOP | Section 4, Section 5 |
| Entities | Permission, Role, RolePermission, UserAccount, UserRole, Organization, AuditLog | Section 2.2 DDL |
| APIs | CRUD permission/role/userRole, evaluate, audit-logs | Section 3 |
| UI | PermissionGuard React component | Section 7 |
| Audit | Synchronous (critical) + Async (batch) logging | Section 6 |

### Critical Business Rules for Implementation

| Rule | Implementation | Severity |
|---|---|---|
| BR-275-01 | `@Pattern(regexp = "^[a-z][a-z0-9]*:[a-z][a-z0-9]*$")` | HIGH |
| BR-275-02 | `PermissionEvaluator.isSuperAdmin()` early-return | HIGH |
| BR-275-03 | `RoleService.deleteRole()` check `isSystem` | HIGH |
| BR-275-04 | `OrganizationService.findDescendantOrgIds()` LIKE query | HIGH |
| BR-275-05 | `UserRoleService.assignRole()` level constraint | MEDIUM |
| BR-275-07 | Every access decision logged sync | HIGH |
| BR-275-10 | Data filter always applied, no silent bypass | HIGH |
| BR-275-11 | 403 response includes requiredPermission code | MEDIUM |
| BR-275-12 | Org change invalidates tokens | MEDIUM |

---

## 2. Component Breakdown

### 2.1 Component Architecture

```
+-----------------------------------------------------------------------------+
|                        F-275 Component Architecture                         |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +--------------------+    +------------------+    +------------------+     |
|  |  React Frontend    |    |  Spring Security  |    |  Security Module |     |
|  |                    |    |  Filter Chain     |    |                  |     |
|  | +----------------+ |    | +--------------+ |    | +--------------+ |     |
|  | | PermissionGuard| |---->| | JWT Filter   | |---->| | Permission   | |     |
|  | | (UI Layer)     | |    | | (AuthN)      | |    | | Evaluator    | |     |
|  | +----------------+ |    | +--------------+ |    | +--------------+ |     |
|  | +----------------+ |    | +--------------+ |    | +--------------+ |     |
|  | | usePermissions | |    | | Interceptor  | |---->| | DataScope    | |     |
|  | | Hook           | |    | | (AuthZ)      | |    | | AOP Aspect   | |     |
|  | +----------------+ |    | +--------------+ |    | +--------------+ |     |
|  | +----------------+ |    | +--------------+ |    | +--------------+ |     |
|  | | ProtectedLayout| |    | | AccessDenied | |    | | AuditLog     | |     |
|  | | (Nav Filter)   | |    | | Handler      | |    | | Aspect       | |     |
|  | +----------------+ |    | +--------------+ |    | +--------------+ |     |
|  +--------------------+    +------------------+    +------------------+     |
|                                    |                                    |     |
|                                    v                                    |     |
|                          +----------------------+                          |     |
|                          |   Controller Layer   |                          |     |
|                          +----------------------+                          |     |
|                          | PermissionController |                          |     |
|                          | RoleController       |                          |     |
|                          | UserRoleController   |                          |     |
|                          | AuditLogController   |                          |     |
|                          +----------------------+                          |     |
|                                    |                                    |     |
|                                    v                                    |     |
|                          +----------------------+                          |     |
|                          |    Service Layer     |                          |     |
|                          +----------------------+                          |     |
|                          | PermissionService    |                          |     |
|                          | RoleService          |                          |     |
|                          | UserRoleService      |                          |     |
|                          | OrganizationService  |                          |     |
|                          | AuditLogService      |                          |     |
|                          +----------------------+                          |     |
|                                    |                                    |     |
|                                    v                                    |     |
|                          +----------------------+                          |     |
|                          |   Repository Layer   |                          |     |
|                          | JpaSpecification     |                          |     |
|                          | Executor mixin       |                          |     |
|                          +----------------------+                          |     |
|                                    |                                    |     |
|                                    v                                    |     |
|                          +----------------------+                          |     |
|                          |   PostgreSQL DB      |                          |     |
|                          | 7 tables + indexes   |                          |     |
|                          +----------------------+                          |     |
+-----------------------------------------------------------------------------+
```

### 2.2 Component Inventory

| # | Component | Package | Type | Dependencies | Owner |
|---|---|---|---|---|---|
| C01 | `PermissionEvaluator` | `security.service` | Service | UserRoleRepo, RolePermissionRepo, PermissionRepo | Backend |
| C02 | `JwtAuthenticationFilter` | `security.filter` | OncePerRequestFilter | JwtUtil, UserAccountService | Backend |
| C03 | `PermissionCheckInterceptor` | `security.interceptor` | HandlerInterceptor | PermissionEvaluator, AuditLogService | Backend |
| C04 | `DataScopeAspect` | `security.aspect` | @Aspect | OrganizationService, CurrentUserContext | Backend |
| C05 | `AuditLogAspect` | `security.aspect` | @Aspect | AuditLogService, CurrentUserContext | Backend |
| C06 | `SecurityConfig` | `security.config` | @Configuration | JwtFilter, Interceptor, AuthEntryPoint | Backend |
| C07 | `DataScopeSpecification` | `security.spec` | Factory (static) | JPA Criteria API | Backend |
| C08 | `OrganizationService` | `security.service` | Service | OrganizationRepo | Backend |
| C09 | `PermissionController` | `security.controller` | REST Controller | PermissionService, DTOs | Backend |
| C10 | `RoleController` | `security.controller` | REST Controller | RoleService, DTOs | Backend |
| C11 | `UserRoleController` | `security.controller` | REST Controller | UserRoleService, DTOs | Backend |
| C12 | `AuditLogController` | `security.controller` | REST Controller | AuditLogService, DTOs | Backend |
| C13 | `PermissionGuard` | `components` | React component | AuthContext (Zustand) | Frontend |
| C14 | `authStore` | `stores` | Zustand store | — | Frontend |
| C15 | `usePermissions` | `hooks` | React hook | authStore | Frontend |

---

## 3. Package Structure

```
src/main/java/com/hanghai/kchtg/
+-- security/
    +-- config/
    |   +-- SecurityConfig.java                  # Spring Security filter chain
    |   +-- JwtProperties.java                   # JWT config binding
    |   +-- AsyncConfig.java                     # @Async executor for audit logging
    |
    +-- entity/
    |   +-- Permission.java                      # P0 -- permission entity
    |   +-- Role.java                            # P0 -- role entity
    |   +-- RolePermission.java                  # P0 -- join entity
    |   +-- UserAccount.java                     # P0 -- user entity
    |   +-- UserRole.java                        # P0 -- user-role join entity
    |   +-- Organization.java                    # P0 -- org hierarchy entity
    |   +-- AuditLog.java                        # P1 -- audit log entity
    |   +-- PermissionCache.java                 # P2 -- cache (Wave 2)
    |
    +-- repository/
    |   +-- PermissionRepository.java            # custom queries
    |   +-- RoleRepository.java                  # findRoleByCode(), findRolesByLevel()
    |   +-- RolePermissionRepository.java        # findPermissionCodesByRoleId()
    |   +-- UserAccountRepository.java           # findById(), findByUsername()
    |   +-- UserRoleRepository.java              # findByUserIdAndExpiresAtAfter()
    |   +-- OrganizationRepository.java          # findByHierarchyPathLike()
    |   +-- AuditLogRepository.java              # findDeniedAccesses(), findByAction()
    |   +-- PermissionCacheRepository.java       # findByUserId() (Wave 2)
    |   +-- DataScopeJpaRepository.java          # base mixin interface
    |
    +-- service/
    |   +-- PermissionEvaluationService           # core: hasPermission, evaluatePermissions
    |   +-- PermissionService.java                # CRUD + validation (BR-275-01)
    |   +-- RoleService.java                      # CRUD + system role protection (BR-275-03)
    |   +-- UserRoleService.java                  # assign/revise + level constraint (BR-275-05)
    |   +-- OrganizationService.java              # subtree query (BR-275-04)
    |   +-- AuditLogService.java                  # sync + async logging
    |   +-- PermissionCacheService.java           # version + invalidate (Wave 2)
    |
    +-- filter/
    |   +-- JwtAuthenticationFilter.java          # decode JWT -> SecurityContext
    |   +-- JwtUtil.java                          # token parse, extract claims
    |
    +-- interceptor/
    |   +-- PermissionCheckInterceptor.java       # @RequiresPermission enforcement
    |   +-- CustomAccessDeniedHandler.java        # 403 -> ForbiddenResponse
    |
    +-- aspect/
    |   +-- DataScopeAspect.java                  # @DataScope -> effective org IDs
    |   +-- AuditLogAspect.java                   # @AuditLog -> auto-log mutations
    |
    +-- spec/
    |   +-- DataScopeSpecification.java           # JPA Specification factory
    |   +-- AuditLogSpecification.java            # dynamic audit log filtering
    |
    +-- context/
    |   +-- CurrentUserContext.java               # ThreadLocal CurrentUser holder
    |   +-- DataScopeContext.java                 # ThreadLocal EffectiveOrgContext
    |
    +-- annotation/
    |   +-- RequiresPermission.java               # @RequiresPermission("phanhien:write")
    |   +-- DataScope.java                        # @DataScope(DataScopeType.CHILDREN)
    |   +-- DataScopeType.java                    # enum: SELF, CHILDREN, ALL, CUSTOM
    |   +-- AuditLog.java                         # @AuditLog(AuditAction.DATA_CREATED)
    |   +-- AuditAction.java                      # enum of all audit actions
    |
    +-- controller/
    |   +-- PermissionController.java             # GET/POST/PUT/DELETE permissions
    |   +-- RoleController.java                   # CRUD + permission assignment
    |   +-- UserRoleController.java               # assign/revise user roles
    |   +-- AuditLogController.java               # query audit logs
    |
    +-- dto/
    |   +-- PermissionDto.java                    # response DTO
    |   +-- RoleDto.java                          # response DTO with permissions
    |   +-- CreatePermissionRequest.java          # @Pattern validation
    |   +-- CreateRoleRequest.java                # @Pattern for code
    |   +-- AssignRoleRequest.java                # roleId + isDirectGrant
    |   +-- AssignPermissionsRequest.java         # permissionIds array
    |   +-- EvaluationResult.java                 # userId + permissionSet + roles + directGrants
    |   +-- AuditLogDto.java                      # response DTO
    |   +-- ForbiddenResponse.java                # 403 error body
    |   +-- PaginationResponse.java               # generic paginated wrapper
    |
    +-- exception/
    |   +-- PermissionDeniedException.java        # thrown by PermissionEvaluator
    |   +-- RoleLevelViolationException.java      # BR-275-05 violation
    |   +-- SystemRoleModificationException.java  # BR-275-03 violation
    |   +-- EntityNotFoundException.java          # generic 404
    |   +-- GlobalExceptionHandler.java           # @RestControllerAdvice
    |
    +-- util/
        +-- JsonUtil.java                         # JSON serialization helpers
        +-- ValidationUtil.java                   # Permission code format validation
```

---

## 4. Interface Contracts

### 4.1 PermissionEvaluationService (Core Interface)

```java
package com.hanghai.kchtg.security.service;

/**
 * Core permission evaluation interface.
 * Consumed by middleware, interceptors, and service layers.
 * Implements BR-275-02 (Super Admin bypass) and BR-275-04 (direct grant > role).
 */
public interface PermissionEvaluationService {

    /**
     * BR-275-02: Super Admin always has full access.
     * Shortcut evaluation - returns true immediately with no DB lookup.
     */
    boolean isSuperAdmin(String roleCode);

    /**
     * Evaluate ALL permissions for a user.
     * Merges permissions from all active roles + direct grants.
     * BR-275-06: If all roles revoked, only direct grants remain.
     */
    Set<String> evaluatePermissions(Long userId);

    /**
     * Check if user has a specific permission.
     */
    boolean hasPermission(Long userId, String permissionCode);

    /**
     * Check if user has ANY of the required permissions (OR logic).
     */
    boolean hasAnyPermission(Long userId, String... permissionCodes);

    /**
     * Check if user has ALL of the required permissions (AND logic).
     */
    boolean hasAllPermissions(Long userId, String... permissionCodes);

    /**
     * Full evaluation result with breakdown (admin diagnostic).
     */
    EvaluationResult evaluateWithBreakdown(Long userId);
}
```

### 4.2 OrganizationService Interface

```java
package com.hanghai.kchtg.security.service;

/**
 * Organization hierarchy management interface.
 * Implements BR-275-04 (subtree data scope).
 */
public interface OrganizationService {

    /**
     * Find all descendant org IDs using hierarchyPath LIKE query.
     * Does NOT include the parent itself - caller must add it.
     */
    List<Long> findDescendantOrgIds(Long parentOrgId);

    List<Long> getAllOrgIds();
    boolean isDescendant(Long potentialDescendantId, Long ancestorId);
    void updateHierarchyPath(Long orgId, Long newParentId);
    List<Long> getEffectiveOrgIds(Long currentOrgId);
}
```

### 4.3 AuditLogService Interface

```java
package com.hanghai.kchtg.security.service;

/**
 * Audit logging interface.
 * Synchronous for critical events (BR-275-07), async for non-critical.
 */
public interface AuditLogService {

    /**
     * Synchronous audit log - critical events only.
     * BR-275-07: Every permission decision (grant/deny) logged here.
     */
    AuditLog logSync(Long userId, String username, String action,
                     String resource, String requiredPermission,
                     Boolean granted, String ipAddress,
                     String userAgent, Map<String, Object> details);

    /**
     * Asynchronous audit log - non-critical events (batched).
     */
    void logAsync(AuditLogEntry entry);

    Page<AuditLog> findDeniedAccesses(Pageable pageable);
    Page<AuditLog> findDeniedAccesses(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    long countDeniedAccesses();
}
```

### 4.4 RoleService Interface

```java
package com.hanghai.kchtg.security.service;

/**
 * Role management interface.
 * Implements BR-275-03 (system role protection), BR-275-05 (level constraint).
 */
public interface RoleService {

    Role createRole(CreateRoleRequest request, Long assignedBy);
    Role updateRole(Long roleId, CreateRoleRequest request, Long updatedBy);
    void deleteRole(Long roleId, Long deletedBy);           // throws SystemRoleModificationException
    Role cloneRole(Long sourceRoleId, String cloneName, Long clonedBy);
    RoleDto getRoleWithPermissions(Long roleId);
    boolean isSystemRole(Long roleId);
}
```

### 4.5 UserRoleService Interface

```java
package com.hanghai.kchtg.security.service;

/**
 * User-role assignment interface.
 * Implements BR-275-05 (level constraint), BR-275-06 (last role revocation).
 */
public interface UserRoleService {

    UserRole assignRole(Long userId, AssignRoleRequest request, Long assignedBy);
    void revokeRole(Long userId, Long roleId, Long revokedBy);
    List<UserRole> grantDirectPermissions(Long userId, List<Long> permissionIds, Long grantedBy);
    void revokeDirectPermission(Long userId, Long permissionId, Long revokedBy);
    List<UserRole> getUserRoles(Long userId);
    boolean hasRole(Long userId, Long roleId);
}
```

### 4.6 DataScopeAspect Runtime Contract

Service methods annotated with `@DataScope` must follow this pattern:

```java
@Service
public class MyService {
    @Autowired private MyRepository repo;

    @DataScope(DataScopeType.CHILDREN, orgField = "organization")
    public Page<MyEntity> findAll(Pageable pageable) {
        List<Long> orgIds = DataScopeContext.getEffectiveOrgIds();
        Specification<MyEntity> spec = DataScopeSpecification.forOrgIds("organization", orgIds);
        return repo.findAll(spec, pageable);
    }

    @DataScope(DataScopeType.SELF, ownerField = "createdBy")
    public List<MyEntity> findMyRecords() {
        Long userId = DataScopeContext.getUserId();
        Specification<MyEntity> spec = DataScopeSpecification.forOwnerId("createdBy", userId);
        return repo.findAll(spec);
    }
}
```

---

## 5. PermissionEvaluationService Design

### 5.1 Architecture Decision: DB Recompute vs. Cache

**Wave 1: Recompute from DB on every request.**

Rationale:
- Only 2 DB queries max (role permissions + direct grants)
- Acceptable latency at current scale (< 1000 concurrent users)
- Caching introduces complexity: invalidation strategy, versioning, Redis dependency
- Correctness > performance at this stage
- Wave 2 will add `PermissionCache` table + Redis with `orgVersion` JWT claim

### 5.2 Implementation Detail

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionEvaluationServiceImpl implements PermissionEvaluationService {

    private final UserRoleRepository userRoleRepo;
    private final RolePermissionRepository rolePermissionRepo;
    private final PermissionRepository permissionRepo;

    @Value("${security.permission.super-admin-role-code:SUPER_ADMIN}")
    private String superAdminRoleCode;

    // --- BR-275-02: Super Admin shortcut (no DB query) ---
    @Override
    public boolean isSuperAdmin(String roleCode) {
        return superAdminRoleCode.equals(roleCode);
    }

    // --- BR-275-06: Merge role perms + direct grants ---
    @Override
    @Transactional(readOnly = true)
    public Set<String> evaluatePermissions(Long userId) {
        log.debug("Evaluating permissions for userId={}", userId);

        // Step 1: Load all ACTIVE, non-expired roles
        List<UserRole> activeRoles = userRoleRepo.findActiveRolesByUserId(userId);
        Set<String> permissions = new HashSet<>();

        // Step 2: Union of permissions from all non-direct roles
        for (UserRole userRole : activeRoles) {
            if (!Boolean.TRUE.equals(userRole.getIsDirectGrant())) {
                Set<String> rolePerms = rolePermissionRepo.findPermissionCodesByRoleId(userRole.getRoleId());
                permissions.addAll(rolePerms);
            }
        }

        // Step 3: Add direct grants (always included, cannot be overridden)
        Set<String> directGrants = userRoleRepo.findPermissionCodesByUserIdAndDirectGrant(userId, true);
        permissions.addAll(directGrants);

        return Collections.unmodifiableSet(permissions);
    }

    // --- Single permission check ---
    @Override
    public boolean hasPermission(Long userId, String permissionCode) {
        return evaluatePermissions(userId).contains(permissionCode);
    }

    // --- OR check ---
    @Override
    public boolean hasAnyPermission(Long userId, String... permissionCodes) {
        Set<String> all = evaluatePermissions(userId);
        return Arrays.stream(permissionCodes).anyMatch(all::contains);
    }

    // --- AND check ---
    @Override
    public boolean hasAllPermissions(Long userId, String... permissionCodes) {
        Set<String> all = evaluatePermissions(userId);
        return Arrays.stream(permissionCodes).allMatch(all::contains);
    }

    // --- Diagnostic breakdown ---
    @Override
    @Transactional(readOnly = true)
    public EvaluationResult evaluateWithBreakdown(Long userId) {
        List<UserRole> activeRoles = userRoleRepo.findActiveRolesByUserId(userId);

        Map<Long, List<String>> rolePermissions = new LinkedHashMap<>();
        Set<String> permissions = new HashSet<>();

        for (UserRole ur : activeRoles) {
            if (!Boolean.TRUE.equals(ur.getIsDirectGrant())) {
                Set<String> perms = rolePermissionRepo.findPermissionCodesByRoleId(ur.getRoleId());
                rolePermissions.put(ur.getRoleId(), new ArrayList<>(perms));
                permissions.addAll(perms);
            }
        }

        Set<String> directGrants = userRoleRepo.findPermissionCodesByUserIdAndDirectGrant(userId, true);
        permissions.addAll(directGrants);

        return EvaluationResult.of(userId, rolePermissions, new ArrayList<>(directGrants),
                Collections.unmodifiableSet(permissions));
    }
}
```

### 5.3 Performance Characteristics (Wave 1)

| Operation | DB Queries | Latency |
|---|---|---|
| `hasPermission()` | 2 (role perms + direct grants) | ~5-15ms |
| `evaluatePermissions()` | 2 | ~5-15ms |
| `isSuperAdmin()` | 0 | ~0ms (string comparison) |
| `evaluateWithBreakdown()` | 3 | ~10-25ms |

### 5.4 Cache Strategy (Wave 2 - Future)

```
PermissionCache table:
  - user_id (BIGINT, UNIQUE)
  - permission_set (JSONB)
  - version (INT, auto-increment)
  - expires_at (TIMESTAMPTZ)

Invalidation triggers:
  - UserRole insert/update/delete -> version++
  - RolePermission insert/update/delete -> version++
  - Permission insert/update/delete -> version++
  - Organization hierarchy change -> version++

JWT flow:
  - Login -> fetch cache -> embed permissionSet in JWT
  - Token refresh -> compare cache version vs. JWT orgVersion
  - If version changed -> reject old token, force re-login (BR-275-12)
  - TTL = 15 minutes (matches JWT expiry)
```

---

## 6. JPA Specification for Data Scope

### 6.1 Specification Factory

```java
public final class DataScopeSpecification {

    private DataScopeSpecification() {}

    /**
     * Filter by effective org IDs.
     * WHERE entity.organization.id IN (:orgIds)
     */
    public static <T> Specification<T> forOrgIds(String orgFieldPath, List<Long> orgIds) {
        return (root, query, cb) -> {
            if (orgIds == null || orgIds.isEmpty()) {
                return cb.conjunction(); // no filter
            }
            return root.get(orgFieldPath).get("id").in(orgIds);
        };
    }

    /**
     * Filter by ownerId (SELF scope).
     * WHERE entity.createdBy.id = :userId
     */
    public static <T> Specification<T> forOwnerId(String ownerFieldPath, Long userId) {
        return (root, query, cb) ->
            cb.equal(root.get(ownerFieldPath).get("id"), userId);
    }

    /**
     * Combined: org scope OR ownership.
     * WHERE (entity.organization.id IN (:orgIds) OR entity.createdBy.id = :userId)
     */
    public static <T> Specification<T> combined(String orgFieldPath, List<Long> orgIds,
                                                  String ownerFieldPath, Long userId) {
        return (root, query, cb) -> {
            Predicate orgPred = forOrgIds(orgFieldPath, orgIds).toPredicate(root, query, cb);
            Predicate ownerPred = forOwnerId(ownerFieldPath, userId).toPredicate(root, query, cb);
            return cb.or(orgPred, ownerPred);
        };
    }

    /**
     * AND combination of multiple specs.
     */
    public static <T> Specification<T> andAll(Specification<T>... specs) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            for (Specification<T> spec : specs) {
                Predicate p = spec.toPredicate(root, query, cb);
                if (p != null) predicates.add(p);
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
```

### 6.2 Base Repository Interface (Mixin)

```java
public interface DataScopeJpaRepository<T, ID> extends JpaRepository<T, ID> {
    List<T> findAll(Specification<T> spec);
    Page<T> findAll(Specification<T> spec, Pageable pageable);
    long count(Specification<T> spec);
}
```

### 6.3 Usage Pattern (enforced by code review)

```java
@Service
public class PhanhienService {
    @Autowired private PhanhienRepository repository;

    @DataScope(DataScopeType.CHILDREN, orgField = "organization")
    public Page<Phanhien> search(PhanhienSearchRequest req, Pageable pageable) {
        Specification<Phanhien> domainSpec = PhanhienSpecification.fromRequest(req);
        List<Long> orgIds = DataScopeContext.getEffectiveOrgIds();
        Long userId = DataScopeContext.getUserId();
        Specification<Phanhien> scopeSpec = DataScopeSpecification.combined(
            "organization", orgIds, "createdBy", userId
        );
        return repository.findAll(domainSpec.and(scopeSpec), pageable);
    }
}
```

---

## 7. Spring Security Configuration

### 7.1 SecurityConfig.java

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // enables @PreAuthorize, @Secured, @PreFilter
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final PermissionCheckInterceptor permInterceptor;
    private final AuthenticationEntryPoint authEntryPoint;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authEntryPoint)
                .accessDeniedHandler(new CustomAccessDeniedHandler())
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/v1/auth/login", "/api/v1/auth/register",
                    "/api/v1/auth/refresh", "/api/v1/auth/forgot-password",
                    "/api/v1/auth/reset-password", "/api/v1/health",
                    "/api/v1/public/**"
                ).permitAll()
                .requestMatchers("/api/v1/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public WebMvcConfigurer mvcConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(permInterceptor)
                    .addPathPatterns("/api/v1/**")
                    .excludePathPatterns("/api/v1/auth/**", "/api/v1/health", "/api/v1/public/**");
            }
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 7.2 Filter Execution Order

```
Request -> JwtAuthenticationFilter (AuthN) -> PermissionCheckInterceptor (AuthZ)
     -> @DataScope aspect -> Controller -> @AuditLog aspect
```

**Critical ordering:**
1. `JwtAuthenticationFilter` MUST run before `PermissionCheckInterceptor`
2. `PermissionCheckInterceptor` MUST run before `@DataScope` aspect
3. `@AuditLog` aspect wraps entire method execution

### 7.3 Security Properties (application.yml)

```yaml
security:
  jwt:
    secret: ${JWT_SECRET}
    expiration-ms: 900000          # 15 minutes
    refresh-expiration-ms: 86400000  # 24 hours
  permission:
    super-admin-role-code: SUPER_ADMIN
    evaluation-cache-enabled: false  # Wave 2
```

---

## 8. Audit Logging Integration

### 8.1 Integration Points

| Point | Component | Action | Sync/Async |
|---|---|---|---|
| Permission check success | PermissionCheckInterceptor | ACCESS_GRANTED | **Sync** |
| Permission check failure | PermissionCheckInterceptor | ACCESS_DENIED | **Sync** |
| Role assignment | UserRoleService.assignRole() | ROLE_ASSIGNED | **Sync** |
| Role revocation | UserRoleService.revokeRole() | ROLE_REVOKED | **Sync** |
| Direct grant | UserRoleService.grantDirectPermissions() | PERMISSION_GRANTED | **Sync** |
| Role CRUD | RoleService | ROLE_CREATED/UPDATED/DELETED | **Sync** |
| Permission CRUD | PermissionService | PERMISSION_ASSIGNED/REVOKED | **Sync** |
| Business mutations | @AuditLog aspect | DATA_CREATED/UPDATED/DELETED | Async (batch) |

### 8.2 Async Configuration

```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean(name = "auditLoggingExecutor")
    public Executor auditLoggingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("audit-log-");
        executor.initialize();
        return executor;
    }
}
```

### 8.3 AuditLogAspect for Business Mutations

```java
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogAspect {

    private final AuditLogService auditLogService;
    private final CurrentUserContext currentUserContext;
    private final RequestContextHolder requestContextHolder;

    @Around("@annotation(auditAnnotation)")
    public Object audit(ProceedingJoinPoint pjp, AuditLog auditAnnotation) throws Throwable {
        CurrentUser user = currentUserContext.getCurrentUser();
        HttpServletRequest request = requestContextHolder.getRequest();
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            auditLogService.logAsync(new AuditLogEntry(
                user != null ? user.getUserId() : null,
                user != null ? user.getUsername() : "SYSTEM",
                auditAnnotation.value().name(),
                auditAnnotation.resource(),
                auditAnnotation.requiredPermission(),
                true,
                request != null ? request.getRemoteAddr() : null,
                request != null ? request.getHeader("User-Agent") : null,
                Map.of("elapsedMs", System.currentTimeMillis() - start)
            ));
            return result;
        } catch (Exception e) {
            log.error("Audit log: method {} failed", pjp.getSignature(), e);
            throw e;
        }
    }
}
```

---

## 9. Cache Strategy

### 9.1 Wave 1: NO CACHE

**Decision:** Defer caching to Wave 2.

Reasoning:
- Permission evaluation uses only 2 DB queries - acceptable at current scale
- Cache invalidation complexity is not worth the gain at this stage
- Recomputing from DB guarantees 100% correctness
- Wave 2 will add `PermissionCache` + Redis with versioned JWT invalidation

### 9.2 Wave 2: PermissionCache Table

```
Table: permission_cache
  user_id        BIGINT      UNIQUE
  permission_set JSONB       NOT NULL
  version        INT         NOT NULL DEFAULT 1
  expires_at     TIMESTAMPTZ NOT NULL
  created_at     TIMESTAMPTZ

Invalidation: version++ on any role/permission/org change
JWT: orgVersion claim compared on token refresh
TTL: 15 minutes (matches JWT expiry)
```

---

## 10. Implementation Phases & Timeline

### Phase 1: Core Entities & Migration (P0 - Week 1)

| # | File | Priority | Notes |
|---|---|---|---|
| 1 | `entity/Permission.java` | P0 | code UNIQUE, @Pattern validation |
| 2 | `entity/Role.java` | P0 | level >= 0, isSystem |
| 3 | `entity/RolePermission.java` | P0 | composite unique (role_id, permission_id) |
| 4 | `entity/UserAccount.java` | P0 | FK to Organization |
| 5 | `entity/UserRole.java` | P0 | isDirectGrant, composite unique |
| 6 | `entity/Organization.java` | P0 | hierarchyPath, hierarchyDepth |
| 7 | `entity/AuditLog.java` | P1 | JSONB details column |
| 8 | `db/migration/V1__initial_auth_schema.sql` | P0 | DDL from SA Section 2.2 |
| 9 | `db/migration/V2__seed_permissions_roles.sql` | P0 | System roles + sample perms |
| 10 | `repository/*Repository.java` (8 files) | P0 | Custom queries |

**DoD:** Flyway migration runs clean. All entities persist. Repositories support all queries.

### Phase 2: Permission Middleware (P0 - Week 2)

| # | File | Priority | Notes |
|---|---|---|---|
| 1 | `annotation/RequiresPermission.java` | P0 | METHOD + TYPE |
| 2 | `annotation/DataScope.java` + `DataScopeType.java` | P0 | 4 scope types |
| 3 | `annotation/AuditLog.java` + `AuditAction.java` | P0 | 30+ actions |
| 4 | `context/CurrentUserContext.java` | P0 | ThreadLocal |
| 5 | `context/DataScopeContext.java` | P0 | ThreadLocal EffectiveOrgContext |
| 6 | `filter/JwtAuthenticationFilter.java` | P0 | Decode JWT -> SecurityContext |
| 7 | `filter/JwtUtil.java` | P0 | Token parse |
| 8 | `interceptor/PermissionCheckInterceptor.java` | P0 | @RequiresPermission enforcement |
| 9 | `interceptor/CustomAccessDeniedHandler.java` | P0 | 403 -> ForbiddenResponse |
| 10 | `config/SecurityConfig.java` | P0 | Filter chain |
| 11 | `service/PermissionEvaluationService.java` | P0 | Core engine |

**DoD:** JWT auth works. Interceptor checks permissions. 403 returns requiredPermission (BR-275-11). Super Admin bypass works (BR-275-02).

### Phase 3: Data Scope Filter (P1 - Week 2-3)

| # | File | Priority | Notes |
|---|---|---|---|
| 1 | `aspect/DataScopeAspect.java` | P1 | @Before + @After |
| 2 | `spec/DataScopeSpecification.java` | P1 | Static factory |
| 3 | `service/OrganizationService.java` | P1 | Subtree query (LIKE) |
| 4 | `repository/DataScopeJpaRepository.java` | P1 | Generic mixin |
| 5 | `exception/GlobalExceptionHandler.java` | P1 | @RestControllerAdvice |

**DoD:** @DataScope sets context. Specification filters by org subtree. SELF scope by ownership.

### Phase 4: API Controllers & Services (P1 - Week 3-4)

| # | File | Priority | Notes |
|---|---|---|---|
| 1-4 | `service/PermissionRoleUserRoleAuditLogService.java` | P1 | CRUD + business rules |
| 5 | `dto/*Dto.java` (9 files) | P1 | Request/Response DTOs |
| 6-9 | `controller/*Controller.java` (4 files) | P1 | 21+ endpoints |

**DoD:** All endpoints documented in OpenAPI. Each has @RequiresPermission. 400/403/404 handled.

### Phase 5: Audit Logging (P1 - Week 4)

| # | File | Priority | Notes |
|---|---|---|---|
| 1 | `aspect/AuditLogAspect.java` | P1 | @Around AOP |
| 2-4 | `exception/*Exception.java` (3 files) | P1 | Custom exceptions |
| 5 | `util/JsonUtil.java` | P1 | JSON helpers |

**DoD:** Every decision logged. Async logging works.

### Phase 6: UI Integration (P2 - Week 4-5)

| # | File | Priority | Notes |
|---|---|---|---|
| 1 | `components/PermissionGuard.tsx` | P2 | React component |
| 2 | `stores/authStore.ts` | P2 | Zustand persist |
| 3 | `contexts/AuthContext.tsx` | P2 | React context |
| 4 | `hooks/usePermissions.ts` | P2 | Hook for checks |
| 5 | `layouts/ProtectedLayout.tsx` | P2 | Nav filtering |

**DoD:** PermissionGuard hides/disables elements. AuthContext provides checks.

### Phase 7: Testing (P1 - Week 5)

| # | File | Priority | Scope | Notes |
|---|---|---|---|---|
| 1 | `PermissionEvaluationServiceTest.java` | P1 | Unit | 100+ combos |
| 2 | `RoleHierarchyTest.java` | P1 | Unit | BR-275-05 |
| 3 | `DataScopeFilterTest.java` | P1 | Unit | Org subtree |
| 4 | `AuditLogTest.java` | P1 | Unit | Log every decision |
| 5 | `SecurityIntegrationTest.java` | P2 | Integration | Full CRUD |
| 6 | `PermissionGuard.test.tsx` | P2 | Unit | React |
| 7 | `e2e/auth-flow.spec.ts` | P2 | E2E | Role-based nav |

---

## 11. Risk & Mitigation

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Permission eval performance with large org hierarchies | Medium | High | Wave 2 cache; optimize LIKE with B-tree index |
| R2 | ThreadLocal leak in DataScopeContext | Low | High | @After in DataScopeAspect guarantees cleanup; test thread safety |
| R3 | Incorrect hierarchyPath during org restructuring | Medium | Critical | Transaction; test recursive CTE; rollback plan in SA |
| R4 | Super Admin bypass creates audit blind spot | Low | Medium | Log ALL Super Admin requests with anomaly flag |
| R5 | Direct grant abuse | Low | High | Log all direct grants with justification; admin audit |
| R6 | JWT payload too large | Low | Medium | Limit permissionSet in JWT; move to PermissionCache (Wave 2) |

---

## 12. Code Review Checklist

### Backend

- [ ] **BR-275-01**: Permission code validates `@Pattern` at both DTO and DB level
- [ ] **BR-275-02**: `PermissionEvaluator.isSuperAdmin()` is string comparison only
- [ ] **BR-275-03**: `RoleService.deleteRole()` throws for `isSystem=true`
- [ ] **BR-275-04**: `OrganizationService.findDescendantOrgIds()` uses LIKE, not recursive CTE
- [ ] **BR-275-05**: `UserRoleService.assignRole()` compares role levels
- [ ] **BR-275-06**: After revocation, re-evaluate from DB (no stale cache)
- [ ] **BR-275-07**: Every permission decision logged synchronously
- [ ] **BR-275-10**: Data scope via `@DataScope` on ALL repository methods
- [ ] **BR-275-11**: 403 includes `requiredPermission` field
- [ ] **BR-275-12**: Org change increments `PermissionCache.version` + logs TOKEN_INVALIDATED
- [ ] ThreadLocal cleanup in `@After` advice
- [ ] No hardcoded role codes - all via `@Value("${security.permission...}")`
- [ ] All service methods `@Transactional`
- [ ] No SQL injection - all JPA Criteria API / Specification pattern

### Frontend

- [ ] **BR-275-09**: PermissionGuard reads from JWT payload in Zustand store
- [ ] PermissionGuard supports AND (default) and OR logic
- [ ] Fallback component renders on denial (not blank)
- [ ] ProtectedLayout filters navigation items
- [ ] No client-side-only security - server also protects all sensitive operations

---

## 13. Testing Strategy

### 13.1 Unit Tests

| Test Class | Tests | Expected |
|---|---|---|
| PermissionEvaluationServiceTest | evaluatePermissions with 3 roles + 2 direct grants | Union of all perms |
| PermissionEvaluationServiceTest | hasPermission for non-existent permission | false |
| PermissionEvaluationServiceTest | isSuperAdmin("SUPER_ADMIN") | true |
| PermissionEvaluationServiceTest | isSuperAdmin("SYSTEM_ADMIN") | false |
| PermissionEvaluationServiceTest | hasAnyPermission (3 codes, user has 1) | true |
| PermissionEvaluationServiceTest | hasAllPermissions (3 codes, user has 2) | false |
| RoleHierarchyTest | assign level 0 role to level 3 user | RoleLevelViolationException |
| RoleHierarchyTest | assign level 3 role to level 3 user | Success |
| DataScopeFilterTest | findDescendantOrgIds for path /001/005 | [5, 12, 13, 20] |
| DataScopeFilterTest | forOrgIds with empty list | No WHERE clause |
| AuditLogTest | logSync creates AuditLog | persisted in DB |
| AuditLogTest | logAsync queues entry | processed by executor |
| SystemRoleProtectionTest | deleteRole for isSystem=true | SystemRoleModificationException |
| PermissionCodeValidationTest | "phanhien:read" | Valid |
| PermissionCodeValidationTest | "Phanhien:Read" | Invalid (uppercase) |
| PermissionCodeValidationTest | "phanhien-read" | Invalid (dash) |

### 13.2 Integration Tests

| Scenario | Steps | Assertion |
|---|---|---|
| Full CRUD pipeline | Create role -> assign perms -> assign to user -> login -> access | 200 allowed, 403 denied |
| Direct grant override | Grant direct perm -> revoke all roles -> access | hasPermission = true |
| Org hierarchy data scope | Org A -> A1 -> A1-1; User in A1 queries | Only sees A1 + A1-1 |
| Token refresh with org change | Login -> change org -> refresh | 401 (orgVersion mismatch) |
| Permission cache versioning | Change role perms -> check version | version incremented |

### 13.3 E2E Tests

| Scenario | User | Steps | Assertion |
|---|---|---|---|
| Super Admin flow | SUPER_ADMIN | Login -> access all features -> manage roles | All 200 |
| System Admin flow | SYSTEM_ADMIN | Login -> access assigned modules | 200 assigned, 403 unassigned |
| Security Admin flow | SECURITY_ADMIN | Login -> access audit only | 200 audit, 403 business |
| Unit user flow | Regular Admin | Login -> access own unit data | 200 own, 403 other |
| Role revocation flow | Any user | Remove all roles -> access | 403 |
| Org transfer flow | Any user | Transfer org -> old token | 401 (re-login) |

---

## Appendix A: Entity Field Mapping (JPA vs DDL)

| Entity | Table | Key Fields | Notes |
|---|---|---|---|
| Permission | permission | id, code (UNIQUE), feature, operation, description | CHECK constraint |
| Role | role | id, name, code (UNIQUE), description, level, isSystem, hierarchyDepth | level >= 0 |
| RolePermission | role_permission | id, role_id, permission_id, granted_by, granted_at | Composite unique |
| UserAccount | user_account | id, username, email, password_hash, org_id, status, mfa_enabled | status ENUM |
| UserRole | user_role | id, user_id, role_id, assigned_by, assigned_at, expires_at, is_direct_grant | Composite unique |
| Organization | organization | id, name, code (UNIQUE), parent_id, hierarchy_path, hierarchy_depth, status, coefficient | hierarchy_path LIKE |
| AuditLog | audit_log | id, user_id, username, action, resource, required_permission, granted, ip_address, user_agent, details (JSONB), created_at | Heavy indexes |

## Appendix B: OpenAPI Endpoint Summary

| Method | Endpoint | Auth | @RequiresPermission | Description |
|---|---|---|---|---|
| GET | /api/v1/permissions | Admin | admin:manage | List permissions |
| GET | /api/v1/permissions/{id} | Admin | admin:manage | Permission detail |
| POST | /api/v1/permissions | Super Admin | admin:full | Create permission |
| PUT | /api/v1/permissions/{id} | Super Admin | admin:full | Update permission |
| DELETE | /api/v1/permissions/{id} | Super Admin | admin:full | Delete permission |
| GET | /api/v1/roles | Admin | admin:manage | List roles |
| GET | /api/v1/roles/{id} | Admin | admin:manage | Role detail |
| POST | /api/v1/roles | Super Admin | admin:full | Create role |
| PUT | /api/v1/roles/{id} | Super Admin | admin:full | Update role |
| DELETE | /api/v1/roles/{id} | Super Admin | admin:full | Delete role |
| GET | /api/v1/roles/{id}/permissions | Admin | admin:manage | Role permissions |
| POST | /api/v1/roles/{id}/permissions | Super Admin | admin:full | Assign perms to role |
| DELETE | /api/v1/roles/{id}/permissions/{pid} | Super Admin | admin:full | Revoke perm from role |
| GET | /api/v1/users/{id}/roles | Admin, Self | admin:manage | User roles |
| POST | /api/v1/users/{id}/roles | Super Admin | admin:full | Assign role to user |
| DELETE | /api/v1/users/{id}/roles/{roleId} | Super Admin | admin:full | Revoke role from user |
| POST | /api/v1/users/{id}/permissions | Super Admin | admin:full | Direct grant |
| DELETE | /api/v1/users/{id}/permissions/{pid} | Super Admin | admin:full | Revoke direct perm |
| GET | /api/v1/permissions/evaluate/{id} | Admin | admin:manage | Test evaluation |
| GET | /api/v1/audit-logs | Security Admin | admin:manage | Query audit logs |

## Appendix C: Dependencies

| Dependency | Version | Usage |
|---|---|---|
| Spring Boot 3.3.6 | 3.3.6 | Framework |
| Spring Security | bundled | JWT filter, SecurityConfig |
| JPA / Hibernate | bundled | Entity, Repository, Specification |
| PostgreSQL | 15+ | Database (JSONB) |
| Flyway | bundled | DDL migration |
| Lombok | 1.18.30+ | @Data, @Builder, @Slf4j |
| Jakarta Validation | bundled | @Pattern, @NotBlank, @Min |
| React 19 | 19.x | Frontend framework |
| Ant Design 6 | 6.x | UI components |
| Zustand | 4.x | State management |
| React Query | 5.x | Data fetching |
