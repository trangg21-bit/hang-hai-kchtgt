package com.hanghai.kchtg.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.PermissionRoleService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

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

    private final PermissionRoleService permissionRoleService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PermissionMiddleware(PermissionRoleService permissionRoleService,
                                UserRepository userRepository) {
        this.permissionRoleService = permissionRoleService;
        this.userRepository = userRepository;
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
        String action = mapMethodToAction(method);

        // Resolve authenticated user
        UUID userId = resolveUserId();
        if (userId == null) {
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

    private boolean shouldSkip(String path, String method) {
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        return path.startsWith("/api/auth/")
                || path.startsWith("/api/public/")
                || path.startsWith("/api/health/")
                || path.startsWith("/api/v1/auth/");
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
     * Controllers use kebab-case paths but permissions use camelCase / shorthand codes.
     */
    private String normalizeResource(String urlSegment) {
        return URL_TO_PERMISSION.getOrDefault(urlSegment, urlSegment);
    }

    private static final java.util.Map<String, String> URL_TO_PERMISSION = java.util.Map.ofEntries(
            java.util.Map.entry("groups", "group"),
            java.util.Map.entry("access-logs", "log"),
            java.util.Map.entry("logs", "log"),
            java.util.Map.entry("log-export", "log"),
            java.util.Map.entry("org-units", "orgunit"),
            java.util.Map.entry("data-connections", "connection"),
            java.util.Map.entry("beacon-lights", "data"),
            java.util.Map.entry("buoys", "data"),
            java.util.Map.entry("beacon-history", "data"),
            java.util.Map.entry("point-objects", "data"),
            java.util.Map.entry("line-objects", "data"),
            java.util.Map.entry("polygon-objects", "data"),
            java.util.Map.entry("map-layers", "map"),
            java.util.Map.entry("map-icons", "map"),
            java.util.Map.entry("symbols", "map"),
            java.util.Map.entry("ports", "port"),
            java.util.Map.entry("berths", "berth"),
            java.util.Map.entry("piers", "pier"),
            java.util.Map.entry("dry-ports", "dryport"),
            java.util.Map.entry("water-zones", "waterzone"),
            java.util.Map.entry("navigation-channel", "navigationchannel"),
            java.util.Map.entry("dike-revetment", "dikerevetment"),
            java.util.Map.entry("ship-repair-facility", "shiprepair"),
            java.util.Map.entry("radar-station", "radarstation"),
            java.util.Map.entry("vts-system", "vts"),
            java.util.Map.entry("port-planning", "document"),
            java.util.Map.entry("planning-adjustments", "document"),
            java.util.Map.entry("operation-plans", "document"),
            java.util.Map.entry("maintenance-plans", "document"),
            java.util.Map.entry("legal-documents", "document"),
            java.util.Map.entry("incidents", "incident"),
            java.util.Map.entry("reports", "report"),
            java.util.Map.entry("bcc157", "report"),
            java.util.Map.entry("statistics", "report"),
            java.util.Map.entry("lighthouse-station", "data"),
            java.util.Map.entry("buoy-station", "data"),
            java.util.Map.entry("stations", "data"),
            java.util.Map.entry("users", "user"),
            java.util.Map.entry("roles", "role"),
            java.util.Map.entry("permissions", "role"),
            java.util.Map.entry("approvals", "approve"),
            java.util.Map.entry("dashboard", "dashboard"),
            java.util.Map.entry("backups", "admin"),
            java.util.Map.entry("siem", "security"),
            java.util.Map.entry("admin", "admin")
    );

    /**
     * Map HTTP method to CRUD action.
     */
    private String mapMethodToAction(String method) {
        return switch (method.toUpperCase()) {
            case "GET" -> "read";
            case "POST", "PUT", "PATCH" -> "write";
            case "DELETE" -> "delete";
            default -> "read";
        };
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
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", 403);
        body.put("error", "Forbidden");
        body.put("path", path);
        body.put("message", "Không có quyền truy cập");
        body.put("timestamp", Instant.now().toString());
        body.put("requiredPermission", requiredPermission);
        body.put("granted", false);

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
