package com.hanghai.kchtg.security.service;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.constants.PermissionConstants;
import static com.hanghai.kchtg.security.constants.PermissionConstants.*;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Single Source of Truth for effective permission resolution, RBAC evaluation,
 * and distributed Redis caching across the entire platform.
 * <p>
 * Replaces parallel evaluation engines between PermissionRoleService and
 * PermissionAuthorizationManager into a unified, high-performance service.
 * </p>
 */
@Service
public class EffectivePermissionService {

    private static final Logger log = LoggerFactory.getLogger(EffectivePermissionService.class);

    private static final Set<String> SUPER_ADMIN_AUTHORITIES = Set.of(
            "ROLE_SYSTEM_ADMIN",
            "ROLE_SUPER_ADMIN",
            "ADMIN:ALL",
            "*");

    private final UserRepository userRepository;
    private final PermissionCacheService permissionCacheService;

    public EffectivePermissionService(UserRepository userRepository,
            PermissionCacheService permissionCacheService) {
        this.userRepository = userRepository;
        this.permissionCacheService = permissionCacheService;
    }

    // ── Permission Resolution & Caching ──────────────────────────────────────────

    /**
     * Resolve effective permissions for a user by UUID.
     * Checks Redis cache first, falling back to database and populating the cache.
     */
    public Set<String> getEffectivePermissions(UUID userId) {
        if (userId == null) {
            return Collections.emptySet();
        }
        if (permissionCacheService != null) {
            try {
                Set<String> cached = permissionCacheService.getPermissionsFromCache(userId);
                if (cached != null) {
                    return cached;
                }
            } catch (RuntimeException e) {
                log.debug("Redis permission cache read failed for user {}: {}", userId, e.getMessage());
            }
        }

        User user = userRepository != null ? userRepository.findByIdWithRelations(userId).orElse(null) : null;
        if (user == null) {
            return Collections.emptySet();
        }

        Set<String> permissions = normalizePermissions(user.getAllPermissions());
        if (isSuperAdmin(user)) {
            permissions = new HashSet<>(permissions);
            permissions.add("*");
            permissions.add("admin:all");
        }

        if (permissionCacheService != null) {
            try {
                permissionCacheService.cachePermissions(userId, permissions);
            } catch (RuntimeException e) {
                log.debug("Redis permission cache write failed for user {}: {}", userId, e.getMessage());
            }
        }

        return permissions;
    }

    /**
     * Resolve effective permissions for a User entity.
     */
    public Set<String> getEffectivePermissions(User user) {
        if (user == null) {
            return Collections.emptySet();
        }
        if (user.getId() != null && permissionCacheService != null) {
            try {
                Set<String> cached = permissionCacheService.getPermissionsFromCache(user.getId());
                if (cached != null) {
                    return cached;
                }
            } catch (RuntimeException e) {
                log.debug("Redis permission cache read failed for user {}: {}", user.getId(), e.getMessage());
            }
        }

        Set<String> computed = normalizePermissions(user.getAllPermissions());
        if (computed.isEmpty() && user.getId() != null && userRepository != null) {
            User loaded = userRepository.findByIdWithRelations(user.getId()).orElse(null);
            if (loaded != null) {
                computed = normalizePermissions(loaded.getAllPermissions());
                if (isSuperAdmin(loaded)) {
                    computed = new HashSet<>(computed);
                    computed.add("*");
                    computed.add("admin:all");
                }
            }
        } else if (isSuperAdmin(user)) {
            computed = new HashSet<>(computed);
            computed.add("*");
            computed.add("admin:all");
        }

        if (user.getId() != null && permissionCacheService != null) {
            try {
                permissionCacheService.cachePermissions(user.getId(), computed);
            } catch (RuntimeException e) {
                log.debug("Redis permission cache write failed for user {}: {}", user.getId(), e.getMessage());
            }
        }
        return computed;
    }

    /**
     * Resolve effective permissions from Spring Security Authentication.
     */
    public Set<String> getEffectivePermissions(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Collections.emptySet();
        }

        Set<String> authorityPermissions = authentication.getAuthorities() != null
                ? authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .map(this::normalize)
                        .collect(Collectors.toSet())
                : Collections.emptySet();

        if (hasSuperAdminAuthority(authorityPermissions)) {
            Set<String> superAdminPerms = new HashSet<>(authorityPermissions);
            superAdminPerms.add("*");
            superAdminPerms.add("admin:all");
            return superAdminPerms;
        }

        // JwtAuthFilter puts the effective permissions into Authentication authorities.
        // If the Authentication already holds permission authorities (containing ':'),
        // trust the authenticated snapshot to avoid extra Redis/DB queries in the same
        // request.
        boolean hasPermissionAuthority = authorityPermissions.stream()
                .anyMatch(permission -> permission.contains(":")
                        || "*".equals(permission)
                        || "admin:all".equals(permission));
        if (hasPermissionAuthority) {
            return authorityPermissions;
        }

        User user = resolveUserFromPrincipal(authentication.getPrincipal());
        if (user != null) {
            Set<String> resolved = new HashSet<>(getEffectivePermissions(user));
            resolved.addAll(authorityPermissions);
            return resolved;
        }

        return authorityPermissions;
    }

    // ── Permission Checking
    // ───────────────────────────────────────────────────────

    /**
     * Check if a user has permission for the specified resource and action.
     */
    public boolean checkPermission(UUID userId, String resource, String action) {
        if (userId == null || resource == null || action == null) {
            return false;
        }
        Set<String> permissions = getEffectivePermissions(userId);
        return matches(permissions, resource, action);
    }

    /**
     * Check if a user has permission for the specified code (e.g. "vts:update").
     */
    public boolean checkPermission(UUID userId, String requiredPermission) {
        if (userId == null || requiredPermission == null) {
            return false;
        }
        String[] parts = requiredPermission.split(":", 2);
        String resource = parts[0];
        String action = parts.length > 1 ? parts[1] : ACTION_READ;
        return checkPermission(userId, resource, action);
    }

    /**
     * Check if the authenticated user has the required permission code.
     */
    public boolean checkPermission(Authentication authentication, String requiredPermission) {
        if (authentication == null || !authentication.isAuthenticated() || requiredPermission == null) {
            return false;
        }
        String normalizedRequired = normalize(requiredPermission);
        String resource = resourceOf(normalizedRequired);

        Set<String> userPermissions = getEffectivePermissions(authentication);
        String[] parts = normalizedRequired.split(":", 2);
        String action = parts.length > 1 ? parts[1] : ACTION_READ;
        return matches(userPermissions, resource, action);
    }

    /**
     * Check if the authenticated user has permission for a resource and action.
     */
    public boolean checkPermission(Authentication authentication, String resource, String action) {
        if (authentication == null || !authentication.isAuthenticated() || resource == null || action == null) {
            return false;
        }
        Set<String> userPermissions = getEffectivePermissions(authentication);
        return matches(userPermissions, resource, action);
    }

    /**
     * Check if a user has ANY of the specified permission codes (OR-logic).
     */
    public boolean checkAnyPermission(UUID userId, String... codes) {
        if (userId == null || codes == null || codes.length == 0) {
            return false;
        }
        Set<String> permissions = getEffectivePermissions(userId);
        for (String code : codes) {
            String[] parts = code.split(":", 2);
            String resource = parts[0];
            String action = parts.length > 1 ? parts[1] : ACTION_READ;
            if (matches(permissions, resource, action)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a user has ALL of the specified permission codes (AND-logic).
     */
    public boolean checkAllPermissions(UUID userId, String... codes) {
        if (userId == null || codes == null || codes.length == 0) {
            return false;
        }
        Set<String> permissions = getEffectivePermissions(userId);
        for (String code : codes) {
            String[] parts = code.split(":", 2);
            String resource = parts[0];
            String action = parts.length > 1 ? parts[1] : ACTION_READ;
            if (!matches(permissions, resource, action)) {
                return false;
            }
        }
        return true;
    }

    // ── Super Admin & Security Level Helpers ─────────────────────────────────────

    /**
     * Check whether a user has global super-admin permissions.
     */
    public boolean isSuperAdmin(User user) {
        if (user == null) {
            return false;
        }
        Set<String> permissions = user.getAllPermissions();
        return permissions.contains("*") || permissions.contains("admin:all");
    }

    /**
     * Check whether an Authentication holds global super-admin authority.
     */
    public boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        if (authentication.getAuthorities() != null) {
            for (GrantedAuthority authority : authentication.getAuthorities()) {
                if (authority != null
                        && SUPER_ADMIN_AUTHORITIES.contains(authority.getAuthority().toUpperCase(Locale.ROOT))) {
                    return true;
                }
            }
        }
        Set<String> permissions = getEffectivePermissions(authentication);
        return permissions.contains("*") || permissions.contains("admin:all");
    }

    /**
     * Resolves the highest record classification this user may read.
     */
    public RecordSecurityLevel getMaxRecordSecurityLevel(User user) {
        return RecordSecurityLevel.maxAllowed(getEffectivePermissions(user));
    }

    // ── Internal Matcher Logic ───────────────────────────────────────────────────

    private boolean matches(Set<String> permissions, String rawResource, String rawAction) {
        if (permissions == null || permissions.isEmpty()) {
            return false;
        }
        if (permissions.contains("*") || permissions.contains("admin:all")) {
            return true;
        }

        String resource = normalize(rawResource);
        String action = normalize(rawAction);
        if (resource == null || action == null) {
            return false;
        }

        String requiredPermission = PermissionConstants.build(resource, action);
        String wildcardPermission = PermissionConstants.build(resource, ACTION_WILDCARD);
        String aggregatePermission = PermissionConstants.build(resource, ACTION_MANAGE);

        // 1. Exact or wildcard match
        if (permissions.contains(requiredPermission)
                || permissions.contains(wildcardPermission)
                || permissions.contains(aggregatePermission)) {
            return true;
        }

        // 2. Legacy write match
        boolean isWriteAction = Set.of(ACTION_CREATE, ACTION_UPDATE, ACTION_DELETE).contains(action);
        if (isWriteAction && permissions.contains(PermissionConstants.build(resource, ACTION_WRITE))) {
            return true;
        }

        // 3. Approval C1 / L1 matching
        boolean isC1Action = Set
                .of(ACTION_APPROVE_C1, "approvel1", "approve:c1", "approve:l1", "approve-c1", "approve-l1")
                .contains(action);
        if (isC1Action) {
            if (permissions.contains(PermissionConstants.build(resource, ACTION_APPROVE_C1))
                    || permissions.contains(PermissionConstants.build(resource, "approvel1"))
                    || permissions.contains(PermissionConstants.build(resource, "approve:c1"))
                    || permissions.contains(PermissionConstants.build(resource, "approve:l1"))
                    || permissions.contains(PermissionConstants.build(resource, "approve-c1"))
                    || permissions.contains(PermissionConstants.build(resource, "approve-l1"))
                    || permissions.contains(PermissionConstants.build("data", ACTION_APPROVE_C1))
                    || permissions.contains(PermissionConstants.build("data", "approvel1"))
                    || permissions.contains(PermissionConstants.build("data", "approve:c1"))
                    || permissions.contains(PermissionConstants.build("data", "approve:l1"))) {
                return true;
            }
        }

        // 4. Approval C2 / L2 matching
        boolean isC2Action = Set
                .of(ACTION_APPROVE_C2, "approvel2", "approve:c2", "approve:l2", "approve-c2", "approve-l2")
                .contains(action);
        if (isC2Action) {
            if (permissions.contains(PermissionConstants.build(resource, ACTION_APPROVE_C2))
                    || permissions.contains(PermissionConstants.build(resource, "approvel2"))
                    || permissions.contains(PermissionConstants.build(resource, "approve:c2"))
                    || permissions.contains(PermissionConstants.build(resource, "approve:l2"))
                    || permissions.contains(PermissionConstants.build(resource, "approve-c2"))
                    || permissions.contains(PermissionConstants.build(resource, "approve-l2"))
                    || permissions.contains(PermissionConstants.build("data", ACTION_APPROVE_C2))
                    || permissions.contains(PermissionConstants.build("data", "approvel2"))
                    || permissions.contains(PermissionConstants.build("data", "approve:c2"))
                    || permissions.contains(PermissionConstants.build("data", "approve:l2"))) {
                return true;
            }
        }

        // 5. Generic Approval hierarchy matching (e.g. view approval list or general
        // approve status)
        if (ACTION_APPROVE.equals(action) || "approve".equals(action)) {
            if (permissions.contains(PermissionConstants.build(resource, ACTION_APPROVE))
                    || permissions.contains(PermissionConstants.build(resource, ACTION_APPROVE_C1))
                    || permissions.contains(PermissionConstants.build(resource, ACTION_APPROVE_C2))
                    || permissions.contains(PermissionConstants.build(resource, "approvel1"))
                    || permissions.contains(PermissionConstants.build(resource, "approvel2"))
                    || permissions.contains(PermissionConstants.build(resource, "approve:c1"))
                    || permissions.contains(PermissionConstants.build(resource, "approve:c2"))
                    || permissions.contains(PermissionConstants.build(resource, "approve:l1"))
                    || permissions.contains(PermissionConstants.build(resource, "approve:l2"))
                    || permissions.contains(PermissionConstants.build("data", ACTION_APPROVE))
                    || permissions.contains(PermissionConstants.build("data", ACTION_APPROVE_C1))
                    || permissions.contains(PermissionConstants.build("data", ACTION_APPROVE_C2))) {
                return true;
            }
        }

        // 6. Action aliases (e.g. edit <-> update)
        if ("edit".equals(action) || "update".equals(action)) {
            if (permissions.contains(PermissionConstants.build(resource, "edit"))
                    || permissions.contains(PermissionConstants.build(resource, "update"))) {
                return true;
            }
        }

        // 7. Connection / Interconnect resource aliases
        if ("connection".equals(resource) || "interconnect".equals(resource)) {
            if (permissions.contains(PermissionConstants.build("connection", action))
                    || permissions.contains(PermissionConstants.build("interconnect", action))
                    || permissions.contains("connection:manage")
                    || permissions.contains("interconnect:manage")
                    || permissions.contains("connection:*")
                    || permissions.contains("interconnect:*")) {
                return true;
            }
        }

        // 8. Group / GroupMember resource management
        if ("groupmember".equals(resource) || "group".equals(resource)) {
            if (permissions.contains("group:manage") || permissions.contains("groupmember:manage")) {
                return true;
            }
        }

        // 8b. VTS / VtsSystem resource alias
        if ("vts".equals(resource) || "vtssystem".equals(resource)) {
            if (permissions.contains(PermissionConstants.build("vts", action))
                    || permissions.contains(PermissionConstants.build("vtssystem", action))
                    || permissions.contains("vts:manage")
                    || permissions.contains("vtssystem:manage")
                    || permissions.contains("vts:*")
                    || permissions.contains("vtssystem:*")) {
                return true;
            }
        }

        // 9. Document domain fallbacks for port planning, adjustments, operation plans,
        // maintenance plans
        if (Set.of("portplanning", "planningadjustment", "operationplan", "maintenanceplan").contains(resource)) {
            if (permissions.contains(PermissionConstants.build("document", action))
                    || permissions.contains("document:manage")
                    || permissions.contains("document:*")) {
                return true;
            }
        }

        // Normalization variations (e.g. approve:c1 vs approvec1)
        String normNoColon = requiredPermission.replace(":approve:", ":approve");
        if (permissions.contains(normNoColon)) {
            return true;
        }
        String normColon = requiredPermission.replace(":approvec1", ":approve:c1").replace(":approvec2", ":approve:c2")
                .replace(":approvel1", ":approve:l1").replace(":approvel2", ":approve:l2");
        if (permissions.contains(normColon)) {
            return true;
        }
        String normDirect = requiredPermission.replace(":approve:c1", ":approvec1").replace(":approve:c2", ":approvec2")
                .replace(":approve:l1", ":approvel1").replace(":approve:l2", ":approvel2");
        if (permissions.contains(normDirect)) {
            return true;
        }

        return false;
    }

    private boolean hasSuperAdminAuthority(Set<String> authorities) {
        if (authorities == null || authorities.isEmpty()) {
            return false;
        }
        for (String auth : authorities) {
            if (auth != null && SUPER_ADMIN_AUTHORITIES.contains(auth.toUpperCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    @Nullable
    private User resolveUserFromPrincipal(Object principal) {
        if (principal instanceof User user) {
            return user;
        }
        if (principal instanceof org.springframework.security.core.userdetails.User springUser) {
            return userRepository != null
                    ? userRepository.findByUsernameWithRelations(springUser.getUsername()).orElse(null)
                    : null;
        }
        if (principal instanceof String username) {
            return userRepository != null ? userRepository.findByUsernameWithRelations(username).orElse(null) : null;
        }
        return null;
    }

    private Set<String> normalizePermissions(Set<String> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            return Collections.emptySet();
        }
        return permissions.stream()
                .map(this::normalize)
                .collect(Collectors.toSet());
    }

    private String normalize(String code) {
        if (code == null)
            return null;
        return code.trim().toLowerCase(Locale.ROOT);
    }

    private static String resourceOf(String permission) {
        if (permission == null)
            return "";
        return permission.split(":", 2)[0];
    }
}
