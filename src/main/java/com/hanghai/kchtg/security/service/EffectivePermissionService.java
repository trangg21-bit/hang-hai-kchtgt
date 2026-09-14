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
import java.util.Map;
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

    /**
     * Bản đồ ánh xạ chuẩn hóa tên Resource (Resource Canonicalization Map)
     * Thay thế hoàn toàn các chuỗi so sánh hardcode rời rạc giữa tên cũ và tên mới.
     */
    private static final Map<String, String> RESOURCE_CANONICAL_MAP = Map.of(
            "vtssystem", "vts",
            "tramradar", "radarstation",
            "beaconlight", "beaconstation",
            "interconnect", "connection",
            "groupmember", "group",
            "shiprepair", "shiprepairfacility",
            "shiprepairyard", "shiprepairfacility");

    /**
     * Bản đồ ánh xạ đối xứng các resource đồng nghĩa (Equivalent Resources Map)
     */
    private static final Map<String, Set<String>> RESOURCE_EQUIVALENTS = Map.ofEntries(
            Map.entry("vts", Set.of("vts", "vtssystem")),
            Map.entry("vtssystem", Set.of("vts", "vtssystem")),
            Map.entry("radarstation", Set.of("radarstation", "tramradar")),
            Map.entry("tramradar", Set.of("radarstation", "tramradar")),
            Map.entry("beaconstation", Set.of("beaconstation", "beaconlight")),
            Map.entry("beaconlight", Set.of("beaconstation", "beaconlight")),
            Map.entry("connection", Set.of("connection", "interconnect")),
            Map.entry("interconnect", Set.of("connection", "interconnect")),
            Map.entry("group", Set.of("group", "groupmember")),
            Map.entry("groupmember", Set.of("group", "groupmember")),
            Map.entry("shiprepairfacility", Set.of("shiprepairfacility", "shiprepair", "shiprepairyard")),
            Map.entry("shiprepair", Set.of("shiprepairfacility", "shiprepair", "shiprepairyard")),
            Map.entry("shiprepairyard", Set.of("shiprepairfacility", "shiprepair", "shiprepairyard")));

    /**
     * Bản đồ phân cấp miền tài nguyên (Parent Domain Coverage Map)
     * Xác định quyền hạn của nhóm tài nguyên cấp cha bao trùm lên các tài nguyên chuyên biệt.
     */
    private static final Map<String, Set<String>> RESOURCE_PARENT_DOMAINS = Map.of(
            "coastalstationlrit", Set.of("specialstation", "coastalstation", "station", "data"),
            "coastalstationinmarsat", Set.of("specialstation", "coastalstation", "station", "data"),
            "coastalstationhaiphong", Set.of("specialstation", "coastalstation", "station", "data"),
            "coastalstationcospassarsat", Set.of("specialstation", "coastalstation", "station", "data"),
            "portplanning", Set.of("document"),
            "planningadjustment", Set.of("document"),
            "operationplan", Set.of("document"),
            "maintenanceplan", Set.of("document"));

    /**
     * Tập các Action thuộc nhóm xem/đọc dữ liệu phục vụ quy tắc Implicit Read.
     */
    private static final Set<String> READ_ACTIONS = Set.of(
            ACTION_READ,
            "view",
            "search");

    public static String canonicalResource(String resource) {
        if (resource == null) return "";
        String normalized = resource.trim().toLowerCase(Locale.ROOT);
        return RESOURCE_CANONICAL_MAP.getOrDefault(normalized, normalized);
    }

    private static Set<String> getEquivalentResources(String resource) {
        if (resource == null) return Collections.emptySet();
        String normalized = resource.trim().toLowerCase(Locale.ROOT);
        return RESOURCE_EQUIVALENTS.getOrDefault(normalized, Set.of(normalized));
    }

    private static boolean isResourceCoveredBy(String candidateResource, String targetResource) {
        String canonicalCandidate = canonicalResource(candidateResource);
        String canonicalTarget = canonicalResource(targetResource);
        if (canonicalCandidate.equals(canonicalTarget)) {
            return true;
        }
        Set<String> parents = RESOURCE_PARENT_DOMAINS.get(canonicalTarget);
        return parents != null && parents.contains(canonicalCandidate);
    }

    private static boolean isReadAction(String action) {
        return READ_ACTIONS.contains(action);
    }

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
                }
            }
        } else if (isSuperAdmin(user)) {
            computed = new HashSet<>(computed);
            computed.add("*");
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
            return superAdminPerms;
        }

        // JwtAuthFilter puts the effective permissions into Authentication authorities.
        // If the Authentication already holds permission authorities (containing ':'),
        // trust the authenticated snapshot to avoid extra Redis/DB queries in the same
        // request.
        boolean hasPermissionAuthority = authorityPermissions.stream()
                .anyMatch(permission -> permission.contains(":")
                        || "*".equals(permission));
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
        return permissions.contains("*");
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
        return permissions.contains("*");
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
        if (permissions.contains("*")) {
            return true;
        }

        String resource = normalize(rawResource);
        String action = normalize(rawAction);
        if (resource == null || action == null) {
            return false;
        }

        String canonicalRes = canonicalResource(resource);
        Set<String> targetResources = getEquivalentResources(resource);

        // 1. Exact, alias, manage or wildcard match across all equivalent resources
        for (String res : targetResources) {
            if (permissions.contains(PermissionConstants.build(res, action))
                    || permissions.contains(PermissionConstants.build(res, ACTION_WILDCARD))
                    || permissions.contains(PermissionConstants.build(res, ACTION_MANAGE))) {
                return true;
            }
        }

        // 2. Parent domain match (e.g. specialstation, document, data)
        Set<String> parentDomains = RESOURCE_PARENT_DOMAINS.get(canonicalRes);
        if (parentDomains != null) {
            for (String parent : parentDomains) {
                if (permissions.contains(PermissionConstants.build(parent, action))
                        || permissions.contains(PermissionConstants.build(parent, ACTION_WILDCARD))
                        || permissions.contains(PermissionConstants.build(parent, ACTION_MANAGE))) {
                    return true;
                }
            }
        }

        // 3. Implicit Read: Có bất kỳ quyền thao tác nào trên resource (hoặc domain bao trùm) thì mặc định có quyền xem
        if (isReadAction(action)) {
            for (String p : permissions) {
                if (p != null && isResourceCoveredBy(resourceOf(p), canonicalRes)) {
                    return true;
                }
            }
        }

        // 4. Legacy write match
        boolean isWriteAction = Set.of(ACTION_CREATE, ACTION_UPDATE, ACTION_DELETE).contains(action);
        if (isWriteAction) {
            for (String res : targetResources) {
                if (permissions.contains(PermissionConstants.build(res, ACTION_WRITE))) {
                    return true;
                }
            }
        }

        // 5. Approval C1 / L1 matching
        boolean isC1Action = Set
                .of(ACTION_APPROVE_C1, "approvel1", "approve:c1", "approve:l1", "approve-c1", "approve-l1")
                .contains(action);
        if (isC1Action) {
            for (String res : targetResources) {
                if (permissions.contains(PermissionConstants.build(res, ACTION_APPROVE_C1))
                        || permissions.contains(PermissionConstants.build(res, "approvel1"))
                        || permissions.contains(PermissionConstants.build(res, "approve:c1"))
                        || permissions.contains(PermissionConstants.build(res, "approve:l1"))
                        || permissions.contains(PermissionConstants.build(res, "approve-c1"))
                        || permissions.contains(PermissionConstants.build(res, "approve-l1"))) {
                    return true;
                }
            }
            if (permissions.contains(PermissionConstants.build("data", ACTION_APPROVE_C1))
                    || permissions.contains(PermissionConstants.build("data", "approvel1"))
                    || permissions.contains(PermissionConstants.build("data", "approve:c1"))
                    || permissions.contains(PermissionConstants.build("data", "approve:l1"))) {
                return true;
            }
        }

        // 6. Approval C2 / L2 matching
        boolean isC2Action = Set
                .of(ACTION_APPROVE_C2, "approvel2", "approve:c2", "approve:l2", "approve-c2", "approve-l2")
                .contains(action);
        if (isC2Action) {
            for (String res : targetResources) {
                if (permissions.contains(PermissionConstants.build(res, ACTION_APPROVE_C2))
                        || permissions.contains(PermissionConstants.build(res, "approvel2"))
                        || permissions.contains(PermissionConstants.build(res, "approve:c2"))
                        || permissions.contains(PermissionConstants.build(res, "approve:l2"))
                        || permissions.contains(PermissionConstants.build(res, "approve-c2"))
                        || permissions.contains(PermissionConstants.build(res, "approve-l2"))) {
                    return true;
                }
            }
            if (permissions.contains(PermissionConstants.build("data", ACTION_APPROVE_C2))
                    || permissions.contains(PermissionConstants.build("data", "approvel2"))
                    || permissions.contains(PermissionConstants.build("data", "approve:c2"))
                    || permissions.contains(PermissionConstants.build("data", "approve:l2"))) {
                return true;
            }
        }

        // 7. Generic Approval hierarchy matching
        if (ACTION_APPROVE.equals(action) || "approve".equals(action)) {
            for (String res : targetResources) {
                if (permissions.contains(PermissionConstants.build(res, ACTION_APPROVE))
                        || permissions.contains(PermissionConstants.build(res, ACTION_APPROVE_C1))
                        || permissions.contains(PermissionConstants.build(res, ACTION_APPROVE_C2))
                        || permissions.contains(PermissionConstants.build(res, "approvel1"))
                        || permissions.contains(PermissionConstants.build(res, "approvel2"))
                        || permissions.contains(PermissionConstants.build(res, "approve:c1"))
                        || permissions.contains(PermissionConstants.build(res, "approve:c2"))
                        || permissions.contains(PermissionConstants.build(res, "approve:l1"))
                        || permissions.contains(PermissionConstants.build(res, "approve:l2"))) {
                    return true;
                }
            }
            if (permissions.contains(PermissionConstants.build("data", ACTION_APPROVE))
                    || permissions.contains(PermissionConstants.build("data", ACTION_APPROVE_C1))
                    || permissions.contains(PermissionConstants.build("data", ACTION_APPROVE_C2))) {
                return true;
            }
        }

        // 8. Action aliases (e.g. edit <-> update)
        if ("edit".equals(action) || "update".equals(action)) {
            for (String res : targetResources) {
                if (permissions.contains(PermissionConstants.build(res, "edit"))
                        || permissions.contains(PermissionConstants.build(res, "update"))) {
                    return true;
                }
            }
        }

        // Normalization variations (e.g. approve:c1 vs approvec1)
        String requiredPermission = PermissionConstants.build(resource, action);
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
