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

    private static final Set<String> KCHT_RESOURCES = Set.of(
            "port", "seaport", "berth", "berthasset", "pier", "pierasset", "buoyberth", "buoyberthasset",
            "anchorage", "anchorageasset", "transferarea", "transferareaasset", "stormshelter", "stormshelterasset",
            "dryport", "dryportasset", "waterzone", "waterarea", "navigationchannel", "channel", "channelasset",
            "dikerevetment", "dikerevetmentasset", "shiprepair", "shiprepairfacility", "shiprepairyard",
            "radarstation", "tramradar", "radarasset", "beaconstation", "beaconlight", "lighthouse", "lighthouseasset",
            "lighthousestation", "buoy", "buoyasset", "buoystation", "vts", "vtssystem", "vtsasset",
            "vtsoperationcenter", "vtsassist", "vtsassistasset", "aissystem", "aisasset", "cctv", "cctvasset",
            "scada", "scadaasset", "transmission", "transmissionasset", "vhf", "vhfasset", "daittdh", "daittdhasset",
            "ttxltt", "ttxlttasset", "coastalstation", "specialstation", "station", "coastalstationinmarsat",
            "coastalstationcospassarsat", "coastalstationlrit", "coastalstationhaiphong", "inmarsat", "inmarsatasset",
            "cospassarsat", "cospassarsatasset", "lrit", "lritasset", "asset", "infraasset", "assetincrease",
            "assetdecrease", "assetexploitation", "movementrequest", "inventoryasset", "inventoryplan", "inventoryreport",
            "approvalrecord", "processingrecord", "maintenanceplan", "operationplan", "incident", "gispoint",
            "pointobject", "gisline", "lineobject", "gispolygon", "polygonobject");

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
            Map.entry("radarstation", Set.of("radarstation", "tramradar", "radarasset")),
            Map.entry("tramradar", Set.of("radarstation", "tramradar", "radarasset")),
            Map.entry("radarasset", Set.of("radarstation", "tramradar", "radarasset")),
            Map.entry("beaconstation", Set.of("beaconstation", "beaconlight", "lighthouseasset", "lighthouse")),
            Map.entry("beaconlight", Set.of("beaconstation", "beaconlight", "lighthouseasset", "lighthouse")),
            Map.entry("connection", Set.of("connection", "interconnect")),
            Map.entry("interconnect", Set.of("connection", "interconnect")),
            Map.entry("group", Set.of("group", "groupmember")),
            Map.entry("groupmember", Set.of("group", "groupmember")),
            Map.entry("shiprepairfacility", Set.of("shiprepairfacility", "shiprepair", "shiprepairyard")),
            Map.entry("shiprepair", Set.of("shiprepairfacility", "shiprepair", "shiprepairyard")),
            Map.entry("shiprepairyard", Set.of("shiprepairfacility", "shiprepair", "shiprepairyard")),
            Map.entry("berthasset", Set.of("berthasset", "berth")),
            Map.entry("berth", Set.of("berthasset", "berth")),
            Map.entry("transferareaasset", Set.of("transferareaasset", "transferarea")),
            Map.entry("transferarea", Set.of("transferareaasset", "transferarea")),
            Map.entry("stormshelterasset", Set.of("stormshelterasset", "stormshelter")),
            Map.entry("stormshelter", Set.of("stormshelterasset", "stormshelter")),
            Map.entry("buoyberthasset", Set.of("buoyberthasset", "buoyberth")),
            Map.entry("buoyberth", Set.of("buoyberthasset", "buoyberth")),
            Map.entry("pierasset", Set.of("pierasset", "pier")),
            Map.entry("pier", Set.of("pierasset", "pier")),
            Map.entry("anchorageasset", Set.of("anchorageasset", "anchorage")),
            Map.entry("anchorage", Set.of("anchorageasset", "anchorage")),
            Map.entry("lighthouseasset", Set.of("lighthouseasset", "lighthouse", "beaconstation", "beaconlight")),
            Map.entry("lighthouse", Set.of("lighthouseasset", "lighthouse", "beaconstation", "beaconlight")),
            Map.entry("dikerevetmentasset", Set.of("dikerevetmentasset", "dikerevetment")),
            Map.entry("dikerevetment", Set.of("dikerevetmentasset", "dikerevetment")),
            Map.entry("buoyasset", Set.of("buoyasset", "buoy", "buoystation")),
            Map.entry("buoy", Set.of("buoyasset", "buoy", "buoystation")),
            Map.entry("buoystation", Set.of("buoystation", "buoyasset", "buoy")),
            Map.entry("channelasset", Set.of("channelasset", "navigationchannel", "channel")),
            Map.entry("channel", Set.of("channelasset", "navigationchannel", "channel")),
            Map.entry("navigationchannel", Set.of("channelasset", "navigationchannel", "channel")),
            Map.entry("dryportasset", Set.of("dryportasset", "dryport")),
            Map.entry("dryport", Set.of("dryportasset", "dryport")),
            Map.entry("lritasset", Set.of("lritasset", "lrit", "coastalstationlrit")),
            Map.entry("lrit", Set.of("lritasset", "lrit", "coastalstationlrit")),
            Map.entry("coastalstationlrit", Set.of("lritasset", "lrit", "coastalstationlrit")),
            Map.entry("coastalstationinmarsat", Set.of("coastalstationinmarsat")),
            Map.entry("cospassarsatasset", Set.of("cospassarsatasset", "cospassarsat", "coastalstationcospassarsat")),
            Map.entry("cospassarsat", Set.of("cospassarsatasset", "cospassarsat", "coastalstationcospassarsat")),
            Map.entry("coastalstationcospassarsat", Set.of("cospassarsatasset", "cospassarsat", "coastalstationcospassarsat")),
            Map.entry("ttxlttasset", Set.of("ttxlttasset")),
            Map.entry("coastalstationhaiphong", Set.of("coastalstationhaiphong")),
            Map.entry("vtsassistasset", Set.of("vtsassistasset", "vtsassist")),
            Map.entry("vtsassist", Set.of("vtsassistasset", "vtsassist")),
            Map.entry("vhfasset", Set.of("vhfasset", "vhf")),
            Map.entry("vhf", Set.of("vhfasset", "vhf")),
            Map.entry("cctvasset", Set.of("cctvasset", "cctv")),
            Map.entry("cctv", Set.of("cctvasset", "cctv")),
            Map.entry("scadaasset", Set.of("scadaasset", "scada")),
            Map.entry("scada", Set.of("scadaasset", "scada")),
            Map.entry("transmissionasset", Set.of("transmissionasset", "transmission")),
            Map.entry("transmission", Set.of("transmissionasset", "transmission")),
            Map.entry("daittdhasset", Set.of("daittdhasset", "daittdh")),
            Map.entry("daittdh", Set.of("daittdhasset", "daittdh")),
            Map.entry("inmarsatasset", Set.of("inmarsatasset", "inmarsat")),
            Map.entry("inmarsat", Set.of("inmarsatasset", "inmarsat")),
            Map.entry("port", Set.of("port", "seaport")),
            Map.entry("seaport", Set.of("port", "seaport")));

    /**
     * Bản đồ phân cấp miền tài nguyên (Parent Domain Coverage Map)
     * Xác định quyền hạn của nhóm tài nguyên cấp cha bao trùm lên các tài nguyên chuyên biệt.
     */
    private static final Map<String, Set<String>> RESOURCE_PARENT_DOMAINS = Map.ofEntries(
            Map.entry("port", Set.of("infraasset", "data", "stormshelterasset", "stormshelter", "berthasset", "berth", "pierasset", "pier", "anchorageasset", "anchorage", "buoyberthasset", "buoyberth", "transferareaasset", "transferarea", "dryportasset", "dryport", "shiprepairyard", "shiprepairfacility", "shiprepair")),
            Map.entry("seaport", Set.of("infraasset", "data", "stormshelterasset", "stormshelter", "berthasset", "berth", "pierasset", "pier", "anchorageasset", "anchorage", "buoyberthasset", "buoyberth", "transferareaasset", "transferarea", "dryportasset", "dryport", "shiprepairyard", "shiprepairfacility", "shiprepair")),
            Map.entry("vtsasset", Set.of("infraasset", "vts", "vtssystem", "data")),
            Map.entry("radarasset", Set.of("infraasset", "radarstation", "tramradar", "vts", "transmission", "data")),
            Map.entry("radarstation", Set.of("infraasset", "radarasset", "tramradar", "vts", "transmission", "data")),
            Map.entry("tramradar", Set.of("infraasset", "radarasset", "radarstation", "vts", "transmission", "data")),
            Map.entry("aisasset", Set.of("infraasset", "aissystem", "data")),
            Map.entry("cctv", Set.of("infraasset", "cctvasset", "vts", "transmission", "data")),
            Map.entry("cctvasset", Set.of("infraasset", "cctv", "vts", "transmission", "data")),
            Map.entry("scada", Set.of("infraasset", "scadaasset", "vts", "transmission", "data")),
            Map.entry("scadaasset", Set.of("infraasset", "scada", "vts", "transmission", "data")),
            Map.entry("transmission", Set.of("infraasset", "transmissionasset", "vts", "data")),
            Map.entry("transmissionasset", Set.of("infraasset", "transmission", "vts", "data")),
            Map.entry("coastalstationasset", Set.of("infraasset", "coastalstation", "specialstation", "station", "data")),
            Map.entry("berthasset", Set.of("infraasset", "berth", "port", "data")),
            Map.entry("transferareaasset", Set.of("infraasset", "transferarea", "port", "data")),
            Map.entry("transferarea", Set.of("infraasset", "transferareaasset", "port", "data")),

            Map.entry("stormshelterasset", Set.of("infraasset", "stormshelter", "port", "data")),
            Map.entry("buoyberthasset", Set.of("infraasset", "buoyberth", "port", "data")),
            Map.entry("pierasset", Set.of("infraasset", "pier", "berth", "port", "data")),
            Map.entry("anchorageasset", Set.of("infraasset", "anchorage", "port", "data")),
            Map.entry("anchorage", Set.of("infraasset", "anchorageasset", "port", "data")),
            Map.entry("lighthouseasset", Set.of("infraasset", "lighthouse", "beaconstation", "beaconlight", "data")),
            Map.entry("lighthouse", Set.of("infraasset", "lighthouseasset", "beaconstation", "beaconlight", "data")),
            Map.entry("beaconstation", Set.of("infraasset", "lighthouseasset", "lighthouse", "beaconlight", "data")),
            Map.entry("beaconlight", Set.of("infraasset", "lighthouseasset", "lighthouse", "beaconstation", "data")),
            Map.entry("dikerevetmentasset", Set.of("infraasset", "dikerevetment", "data")),
            Map.entry("dikerevetment", Set.of("infraasset", "dikerevetmentasset", "data")),
            Map.entry("buoyasset", Set.of("infraasset", "buoy", "buoystation", "beaconstation", "data")),
            Map.entry("buoy", Set.of("infraasset", "buoyasset", "buoystation", "beaconstation", "data")),
            Map.entry("buoystation", Set.of("infraasset", "buoyasset", "buoy", "beaconstation", "data")),
            Map.entry("channelasset", Set.of("infraasset", "navigationchannel", "channel", "data")),
            Map.entry("dryportasset", Set.of("infraasset", "dryport", "port", "data")),
            Map.entry("dryport", Set.of("infraasset", "dryportasset", "port", "data")),

            Map.entry("lritasset", Set.of("infraasset", "lrit", "coastalstationlrit", "specialstation", "coastalstation", "data")),
            Map.entry("cospassarsatasset", Set.of("infraasset", "cospassarsat", "coastalstationcospassarsat", "specialstation", "coastalstation", "data")),
            Map.entry("ttxlttasset", Set.of("infraasset", "data")),
            Map.entry("vtsassistasset", Set.of("infraasset", "vtsassist", "vts", "transmission", "data")),
            Map.entry("vtsassist", Set.of("infraasset", "vtsassistasset", "vts", "transmission", "data")),
            Map.entry("vhfasset", Set.of("infraasset", "vhf", "transmission", "data")),
            Map.entry("vhf", Set.of("infraasset", "vhfasset", "transmission", "data")),
            Map.entry("daittdhasset", Set.of("infraasset", "daittdh", "coastalstation", "specialstation", "data")),
            Map.entry("inmarsatasset", Set.of("infraasset", "inmarsat", "specialstation", "coastalstation", "data")),
            Map.entry("infraasset", Set.of("data")),
            Map.entry("coastalstationlrit", Set.of("specialstation", "coastalstation", "station", "lritasset", "lrit", "infraasset", "data")),
            Map.entry("coastalstationinmarsat", Set.of()),
            Map.entry("coastalstationhaiphong", Set.of("specialstation", "coastalstation", "station", "infraasset", "data")),
            Map.entry("coastalstationcospassarsat", Set.of("specialstation", "coastalstation", "station", "cospassarsatasset", "cospassarsat", "infraasset", "data")),
            Map.entry("portplanning", Set.of("document")),
            Map.entry("planningadjustment", Set.of("document")),
            Map.entry("operationplan", Set.of("document")),
            Map.entry("maintenanceplan", Set.of("document")),
            Map.entry("shiprepairyard", Set.of("infraasset", "shiprepairfacility", "shiprepair", "port", "data")),
            Map.entry("shiprepairfacility", Set.of("infraasset", "shiprepairyard", "shiprepair", "port", "data")),
            Map.entry("shiprepair", Set.of("infraasset", "shiprepairyard", "shiprepairfacility", "port", "data")),
            Map.entry("user", Set.of("data", "admin", "infraasset")));

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

    /**
     * Whether two permission resources are aliases of the same business
     * resource.  Used by route authorization to discard legacy umbrella
     * fallbacks without breaking the formally seeded aliases.
     */
    public static boolean areEquivalentResources(String firstResource, String secondResource) {
        String firstCanonical = canonicalResource(firstResource);
        String secondCanonical = canonicalResource(secondResource);
        return firstCanonical.equals(secondCanonical)
                || getEquivalentResources(firstResource).contains(secondCanonical)
                || getEquivalentResources(secondResource).contains(firstCanonical);
    }

    private static boolean isResourceCoveredBy(String candidateResource, String targetResource) {
        String canonicalCandidate = canonicalResource(candidateResource);
        String canonicalTarget = canonicalResource(targetResource);
        if (canonicalCandidate.equals(canonicalTarget)) {
            return true;
        }
        if (getEquivalentResources(canonicalTarget).contains(canonicalCandidate)) {
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
                    return withoutLegacyAdminWildcard(cached);
                }
            } catch (RuntimeException e) {
                log.debug("Redis permission cache read failed for user {}: {}", userId, e.getMessage());
            }
        }

        User user = userRepository != null ? userRepository.findByIdWithRelations(userId).orElse(null) : null;
        if (user == null) {
            return Collections.emptySet();
        }

        // A system-admin role is administrative metadata, not an implicit
        // grant for every business resource.  Keep the persisted permission
        // matrix as the sole source of authorization.
        Set<String> permissions = normalizePermissions(user.getAllPermissions());

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
                    return withoutLegacyAdminWildcard(cached);
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
            }
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

    /**
     * Older builds persisted a synthetic wildcard for users carrying an admin
     * role.  It was never a checkbox permission and must not survive in an
     * existing Redis/JWT snapshot after the policy change.
     */
    private static Set<String> withoutLegacyAdminWildcard(Set<String> permissions) {
        if (permissions == null || !permissions.contains("*")) {
            return permissions == null ? Collections.emptySet() : permissions;
        }
        Set<String> sanitized = new HashSet<>(permissions);
        sanitized.remove("*");
        return sanitized;
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

        String resource = normalize(rawResource);
        String action = normalize(rawAction);
        if (resource == null || action == null) {
            return false;
        }

        if (ACTION_MANAGE.equals(action) && KCHT_RESOURCES.contains(resource)) {
            return false;
        }

        Set<String> targetResources = getEquivalentResources(resource);

        // C1/C2 are explicit business authorities. A system-admin wildcard or
        // resource :manage must not silently grant an approval signature.
        // This keeps the backend aligned with the checkbox matrix tested by QA.
        if (isApprovalLevelAction(action)) {
            // `data` and `kcht` are legacy shared approval keys; they must not
            // authorize a module through a generic controller fallback.
            if ("data".equals(resource) || "kcht".equals(resource)) {
                return false;
            }
            return matchesExplicitApprovalLevel(permissions, targetResources, action);
        }

        if (ACTION_HISTORY.equals(action) || "history".equals(action)) {
            for (String res : targetResources) {
                if (permissions.contains(PermissionConstants.build(res, ACTION_HISTORY))
                        || permissions.contains(PermissionConstants.build(res, ACTION_READ))
                        || permissions.contains(PermissionConstants.build(res, ACTION_MANAGE))
                        || permissions.contains(PermissionConstants.build(res, ACTION_WILDCARD))) {
                    return true;
                }
            }
            if (permissions.contains("data:read") || permissions.contains("data:manage") || permissions.contains("*")) {
                return true;
            }
            Set<String> parents = RESOURCE_PARENT_DOMAINS.get(canonicalResource(resource));
            if (parents != null) {
                for (String parent : parents) {
                    if (permissions.contains(PermissionConstants.build(parent, ACTION_READ))
                            || permissions.contains(PermissionConstants.build(parent, ACTION_MANAGE))
                            || permissions.contains(PermissionConstants.build(parent, ACTION_HISTORY))) {
                        return true;
                    }
                }
            }
            return false;
        }

        // 1. Exact, alias, manage or wildcard match across all equivalent resources
        for (String res : targetResources) {
            if (permissions.contains(PermissionConstants.build(res, action))
                    || permissions.contains(PermissionConstants.build(res, ACTION_WILDCARD))
                    || (!KCHT_RESOURCES.contains(res)
                            && permissions.contains(PermissionConstants.build(res, ACTION_MANAGE)))) {
                return true;
            }
        }

        // 3. Implicit Read: Có bất kỳ quyền thao tác nào trên resource (hoặc domain bao trùm) thì mặc định có quyền xem
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

    private boolean isApprovalLevelAction(String action) {
        return isC1ApprovalAction(action) || isC2ApprovalAction(action);
    }

    private boolean matchesExplicitApprovalLevel(Set<String> permissions, Set<String> targetResources, String action) {
        boolean isC1 = isC1ApprovalAction(action);
        Set<String> acceptedActions = isC1
                ? Set.of(ACTION_APPROVE_C1, "approvel1", "approve_level1", "approve:c1", "approve:l1", "approve-c1", "approve-l1")
                : Set.of(ACTION_APPROVE_C2, "approvel2", "approve_level2", "approve:c2", "approve:l2", "approve-c2", "approve-l2");

        for (String resource : targetResources) {
            for (String acceptedAction : acceptedActions) {
                if (permissions.contains(PermissionConstants.build(resource, acceptedAction))) {
                    return true;
                }
            }
        }

        return false;
    }

    private boolean isC1ApprovalAction(String action) {
        return Set.of(ACTION_APPROVE_C1, "approvel1", "approve_level1", "approve:c1", "approve:l1", "approve-c1", "approve-l1")
                .contains(action);
    }

    private boolean isC2ApprovalAction(String action) {
        return Set.of(ACTION_APPROVE_C2, "approvel2", "approve_level2", "approve:c2", "approve:l2", "approve-c2", "approve-l2")
                .contains(action);
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
