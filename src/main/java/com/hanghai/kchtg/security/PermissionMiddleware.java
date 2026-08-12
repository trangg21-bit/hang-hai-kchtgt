package com.hanghai.kchtg.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.PermissionRoleService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.hanghai.kchtg.security.constants.PermissionConstants.*;
import static java.util.Map.entry;

/**
 * Permission enforcement middleware that runs AFTER authentication (F-275 3-Level RBAC).
 * <p>
 * Extracts the resource and action from the request path and HTTP method,
 * then delegates to {@link PermissionRoleService#checkPermission} for the
 * currently authenticated user. Returns 403 JSON with {@code requiredPermission}
 * field on denial (BR-275-11).
 * </p>
 */
@Component
@Profile("!test")
public class PermissionMiddleware extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(PermissionMiddleware.class);

    private static final List<String> PUBLIC_PATH_PREFIXES = List.of(
            "/api/auth/",
            "/api/public/",
            "/api/health/",
            "/api/v1/auth/",
            "/api/v1/dashboard/",
            "/api/v1/integration/share/",
            "/api/org-units/options",
            "/api/v1/org-units/options"
    );

    private static final Set<String> SKIP_PERMISSION_ORG_UNIT_PATHS = Set.of(
            "/api/org-units",
            "/api/org-units/",
            "/api/v1/org-units",
            "/api/v1/org-units/"
    );

    private final PermissionRoleService permissionRoleService;
    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public PermissionMiddleware(PermissionRoleService permissionRoleService,
                                UserRepository userRepository,
                                @Nullable PermissionRepository permissionRepository) {
        this.permissionRoleService = permissionRoleService;
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Skip non-API paths and public endpoints
        if (shouldSkip(path, method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract resource from path
        String resource = extractResource(path);
        // Map HTTP method to action
        String action = mapMethodToAction(method, path);

        // Resolve authenticated user
        UUID userId = resolveUserId();
        if (userId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // The JWT has already been signature-validated by JwtAuthFilter. Keep
        // the middleware consistent with @PreAuthorize: system-admin
        // authorities are global and must not depend on a second DB role
        // lookup, which can be stale while the token is still valid.
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (isSystemAdmin(authentication)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check permission
        if (!permissionRoleService.checkPermission(userId, resource, action)) {
            String requiredPermission = resource + ":" + action;
            log.warn("Permission denied for user {}: {} {}", userId, method, path);
            writeForbiddenResponse(response, path, requiredPermission);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isSystemAdmin(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(authority -> "ROLE_SYSTEM_ADMIN".equals(authority)
                        || "ROLE_SUPER_ADMIN".equals(authority)
                        || "SYSTEM_ADMIN".equals(authority));
    }

    private boolean shouldSkip(String path, String method) {
        if (HttpMethod.OPTIONS.name().equalsIgnoreCase(method)) {
            return true;
        }
        if (HttpMethod.GET.name().equalsIgnoreCase(method) && SKIP_PERMISSION_ORG_UNIT_PATHS.contains(path)) {
            return true;
        }
        return PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith);
    }

    /**
     * Extract the resource (feature) from the request path.
     * Path pattern: /api/v1/{resource}/...
     * Skips "api" and "v1" segments, takes the first remaining segment,
     * then normalizes it to the permission code used in the database.
     */
    private String extractResource(String path) {
        String[] segments = path.split("/");
        StringBuilder resource = new StringBuilder();
        boolean found = false;
        for (String segment : segments) {
            if (segment.isEmpty()) continue;
            if (!found && ("api".equals(segment) || "v1".equals(segment))) {
                continue;
            }
            found = true;
            resource.append(segment);
            break;
        }
        String res = resource.toString();
        if (res.isEmpty()) return "unknown";
        return normalizeResource(res);
    }

    /**
     * Normalize a URL path segment to the permission resource code used in DB.
     * Uses explicit override map first, then applies automatic convention rules:
     * 1. Remove hyphens/underscores
     * 2. Convert plural to singular (-s, -es, -ies)
     * 3. Match against dynamic database resources if available
     */
    private String normalizeResource(String urlSegment) {
        if (urlSegment == null || urlSegment.isBlank()) {
            return "unknown";
        }
        String clean = urlSegment.toLowerCase(java.util.Locale.ROOT).trim();

        // 1. Explicit override map lookup for special legacy alias mappings
        if (URL_TO_PERMISSION.containsKey(clean)) {
            return URL_TO_PERMISSION.get(clean);
        }

        // 2. Convention rule: Strip hyphens/underscores (e.g. legal-documents -> legaldocuments)
        String noDash = clean.replace("-", "").replace("_", "");
        if (isKnownDbResource(noDash)) {
            return noDash;
        }

        // 3. Convention rule: Singularization (e.g. documents -> document, users -> user, categories -> category)
        String singular = noDash;
        if (singular.endsWith("ies") && singular.length() > 3) {
            singular = singular.substring(0, singular.length() - 3) + "y";
        } else if (singular.endsWith("es") && singular.length() > 3) {
            singular = singular.substring(0, singular.length() - 2);
        } else if (singular.endsWith("s") && singular.length() > 2) {
            singular = singular.substring(0, singular.length() - 1);
        }

        if (isKnownDbResource(singular)) {
            return singular;
        }

        // 4. Default fallback: return singularized form or cleaned string
        return singular;
    }

    private boolean isKnownDbResource(String resource) {
        if (permissionRepository == null) return false;
        try {
            return permissionRepository.countByResource(resource) > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private static final Map<String, String> URL_TO_PERMISSION = Map.ofEntries(
            entry("groups", "group"),
            entry("access-logs", "log"),
            entry("logs", "log"),
            entry("log-export", "log"),
            entry("org-units", "orgunit"),
            entry("data-connections", "connection"),
            entry("beacon-lights", "data"),
            entry("buoys", "data"),
            entry("beacon-history", "data"),
            entry("point-objects", "data"),
            entry("line-objects", "data"),
            entry("polygon-objects", "data"),
            entry("map-layers", "map"),
            entry("map-icons", "map"),
            entry("symbols", "map"),
            entry("ports", "port"),
            entry("berths", "berth"),
            entry("piers", "pier"),
            entry("dry-ports", "dryport"),
            entry("water-zones", "waterzone"),
            entry("navigation-channel", "navigationchannel"),
            entry("dike-revetment", "dikerevetment"),
            entry("ship-repair-facility", "shiprepair"),
            entry("radar-station", "radarstation"),
            entry("vts-system", "vts"),
            entry("vts-systems", "vts"),
            entry("he-thong-vts", "vts"),
            entry("port-planning", "document"),
            entry("planning-adjustments", "document"),
            entry("operation-plans", "document"),
            entry("maintenance-plans", "document"),
            entry("legal-documents", "document"),
            entry("incidents", "incident"),
            entry("reports", "report"),
            entry("bcc157", "report"),
            entry("statistics", "report"),
            entry("lighthouse-station", "data"),
            entry("buoy-station", "data"),
            entry("stations", "data"),
            entry("users", "user"),
            entry("roles", "role"),
            entry("permissions", "role"),
            entry("approvals", "approve"),
            entry("dashboard", "dashboard"),
            entry("backups", "admin"),
            entry("siem", "security"),
            entry("admin", "admin")
    );

    /**
     * Map HTTP method to CRUD action.
     */
    private String mapMethodToAction(String method, String path) {
        String normalizedPath = path.toLowerCase(java.util.Locale.ROOT);
        if (normalizedPath.contains("approve-c1") || normalizedPath.contains("approvec1")) {
            return ACTION_APPROVE_C1;
        }
        if (normalizedPath.contains("approve-c2") || normalizedPath.contains("approvec2")) {
            return ACTION_APPROVE_C2;
        }
        if (normalizedPath.contains("approve") || normalizedPath.contains("reject")) {
            return ACTION_APPROVE;
        }
        if (normalizedPath.contains("history")) {
            return ACTION_HISTORY;
        }
        // File upload/delete are edits to the VTS record. Keep this aligned
        // with VtsSystemController, which protects both operations with
        // vts:update rather than vts:create/vts:delete.
        if (normalizedPath.contains("/attachments")) {
            if (HttpMethod.POST.matches(method)
                    || HttpMethod.PUT.matches(method)
                    || HttpMethod.PATCH.matches(method)
                    || HttpMethod.DELETE.matches(method)) {
                return ACTION_UPDATE;
            }
        }
        if (normalizedPath.contains("submit")) {
            return ACTION_CREATE;
        }
        if (HttpMethod.GET.matches(method)) {
            return ACTION_READ;
        }
        if (HttpMethod.POST.matches(method)) {
            return ACTION_CREATE;
        }
        if (HttpMethod.PUT.matches(method) || HttpMethod.PATCH.matches(method)) {
            return ACTION_UPDATE;
        }
        if (HttpMethod.DELETE.matches(method)) {
            return ACTION_DELETE;
        }
        return ACTION_READ;
    }

    /**
     * Resolve the authenticated user ID from the SecurityContext.
     * Follows the same resolveUser pattern as PermissionAuthorizationManager.
     */
    private UUID resolveUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user.getId();
        }
        if (principal instanceof org.springframework.security.core.userdetails.User springUser) {
            return userRepository.findByUsername(springUser.getUsername())
                    .map(User::getId)
                    .orElse(null);
        }
        if (principal instanceof String username) {
            return userRepository.findByUsername(username)
                    .map(User::getId)
                    .orElse(null);
        }
        return null;
    }

    /**
     * Write a 403 JSON response with requiredPermission field (BR-275-11).
     */
    private void writeForbiddenResponse(HttpServletResponse response, String path, String requiredPermission)
            throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        ApiResponse<Map<String, Object>> errorBody = ApiResponse.error(
                "Không có quyền truy cập",
                Map.of(
                        "path", path,
                        "requiredPermission", requiredPermission,
                        "granted", false
                )
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorBody));
    }
}
