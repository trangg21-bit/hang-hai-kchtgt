package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.service.PermissionRoleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Permission middleware - Spring Security filter chặn request không có quyền.
 * <p>
 * Chạy sau {@link JwtAuthFilter} (đã đặt trong SecurityFilterChain).
 * Thực hiện AuthZ (authentication do JwtAuthFilter xử lý):
 * <ul>
 *   <li>BR-275-02: Super Admin bypass - không cần kiểm tra</li>
 *   <li>BR-275-10: Data filter luôn được áp dụng - không bỏ qua</li>
 *   <li>BR-275-11: 403 response kèm requiredPermission code để debug</li>
 *   <li>BR-275-07: Logged mọi quyết định truy cập (granted/denied)</li>
 * </ul>
 * </p>
 *
 * <p>
 * Flow:
 * <pre>
 *  Request -> JwtAuthFilter (AuthN) -> PermissionMiddleware (AuthZ) -> Controller
 * </pre>
 * </p>
 *
 * @see PermissionRoleService
 * @see JwtAuthFilter
 */
@Component
public class PermissionMiddleware extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(PermissionMiddleware.class);
    private static final DateTimeFormatter LOG_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    /** Path không cần kiểm tra permission (public endpoints). */
    private static final String[] PUBLIC_PATHS = {
            "/api/auth/login",
            "/api/auth/totp/setup",
            "/api/auth/totp/verify",
            "/api/auth/totp/regenerate",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/h2-console/**",
            "/error",
            "/actuator/**",
            "/api/point-objects/**",
            "/api/line-objects/**",
            "/api/polygon-objects/**",
            "/api/map-layers/**",
            "/api/search/**",
            "/api/v1/integration/share/**",
            "/api/v1/integration/kchtgt/**"
    };

    private final PermissionRoleService permissionRoleService;
    private final ObjectMapper objectMapper;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public PermissionMiddleware(PermissionRoleService permissionRoleService, ObjectMapper objectMapper) {
        this.permissionRoleService = permissionRoleService;
        this.objectMapper = objectMapper;
    }

    // =========================================================================
    // 1. Filter entry point
    // =========================================================================

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Bỏ qua public endpoints
        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bỏ qua OPTIONS (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Lấy authentication từ SecurityContext (do JwtAuthFilter đã set)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            // Không có authentication -> chặn ngay (JwtAuthFilter chưa xác thực)
            log.debug("[PERM] No authentication for {} {}", method, path);
            sendForbidden(response, null, path, "Không xác thực - cần đăng nhập");
            return;
        }

        String username = auth.getName();

        // BR-275-02: Super Admin bypass - toàn quyền
        boolean isSuper = auth.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(role -> permissionRoleService.isSuperAdmin(role));
        if (isSuper) {
            log.debug("[PERM] Super Admin bypass: {} {} by {}", method, path, username);
            filterChain.doFilter(request, response);
            return;
        }

        // =========================================================================
        // 2. Permission evaluation
        // =========================================================================
        // Lấy resource và action từ request attributes hoặc header
        // Header: X-Permission-Resource, X-Permission-Action
        // Hoặc từ URL mapping (@RequiresPermission annotation - Wave 2)

        String requiredResource = extractRequiredResource(request, path, method);
        String requiredAction = extractRequiredAction(request, method);

        if (requiredResource == null || requiredAction == null) {
            // Nếu không thể xác định permission required, bỏ qua kiểm tra
            // (điều này xảy ra với endpoints chưa được cấu hình permission)
            log.debug("[PERM] No permission mapping for {} {} - allowing", method, path);
            filterChain.doFilter(request, response);
            return;
        }

        String requiredPermissionCode = requiredResource + ":" + requiredAction;
        log.debug("[PERM] Checking permission {} for user {} on {} {}",
            requiredPermissionCode, username, method, path);

        boolean hasPermission = permissionRoleService.checkPermission(
            username, requiredResource, requiredAction);

        // BR-275-07: Log every permission decision
        if (hasPermission) {
            log.info("[PERM] GRANTED {} {} -> {} (required: {}:{})",
                method, path, username, requiredResource, requiredAction);
            filterChain.doFilter(request, response);
        } else {
            // BR-275-11: 403 kèm requiredPermission code
            log.warn("[PERM] DENIED {} {} -> {} (required: {}:{})",
                method, path, username, requiredResource, requiredAction);
            sendForbidden(response, requiredPermissionCode, path,
                "Không có quyền truy cập - cần permission: " + requiredPermissionCode);
        }
    }

    // =========================================================================
    // 3. Resource/Action extraction
    // =========================================================================

    /**
     * Trích xuất resource (feature) từ request.
     * Ưu tiên: X-Permission-Resource header -> path parsing -> default.
     */
    private String extractRequiredResource(HttpServletRequest request, String path, String method) {
        // 1. Từ header
        String resourceFromHeader = request.getHeader("X-Permission-Resource");
        if (StringUtils.hasText(resourceFromHeader)) {
            return resourceFromHeader.toLowerCase();
        }

        // 2. Từ request attribute (do Controller hoặc interceptor đặt)
        String resourceFromAttr = (String) request.getAttribute("x-permission-resource");
        if (StringUtils.hasText(resourceFromAttr)) {
            return resourceFromAttr.toLowerCase();
        }

        // 3. Parse từ URL pattern
        // Ví dụ: /api/manhien/read/{id} -> resource = "manhien"
        return parseResourceFromPath(path, method);
    }

    /**
     * Trích xuất action từ request.
     * Ưu tiên: X-Permission-Action header -> HTTP method mapping -> default.
     */
    private String extractRequiredAction(HttpServletRequest request, String method) {
        // 1. Từ header
        String actionFromHeader = request.getHeader("X-Permission-Action");
        if (StringUtils.hasText(actionFromHeader)) {
            return actionFromHeader.toLowerCase();
        }

        // 2. Từ HTTP method mapping
        return httpMethodToAction(method);
    }

    /**
     * Map HTTP method -> action (operation level).
     * GET -> read, POST -> write, PUT -> write, DELETE -> delete, PATCH -> write.
     */
    private String httpMethodToAction(String method) {
        return switch (method.toUpperCase()) {
            case "GET" -> "read";
            case "POST" -> "write";
            case "PUT", "PATCH" -> "write";
            case "DELETE" -> "delete";
            default -> "read";
        };
    }

    /**
     * Parse resource từ URL path.
     * Ví dụ: /api/manhien/read/{id} -> manhien
     *        /api/baocao/export -> baocao
     */
    private String parseResourceFromPath(String path, String method) {
        // Remove /api/ prefix
        String relative = path.startsWith("/api/") ? path.substring(5) : path;

        // Split by / and take first segment
        String[] segments = relative.split("/");
        if (segments.length > 0 && !segments[0].isEmpty()) {
            return segments[0].toLowerCase();
        }

        return null;
    }

    // =========================================================================
    // 4. Public path check
    // =========================================================================

    /**
     * Kiểm tra path có thuộc danh sách public endpoints không.
     */
    private boolean isPublicPath(String path) {
        for (String pattern : PUBLIC_PATHS) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }
        return false;
    }

    // =========================================================================
    // 5. Forbidden response (BR-275-11)
    // =========================================================================

    /**
     * Trả về HTTP 403 Forbidden với body chứa requiredPermission code.
     * BR-275-11: 403 response phải kèm permission code cần thiết.
     */
    private void sendForbidden(HttpServletResponse response,
                               String requiredPermissionCode,
                               String path,
                               String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> body = new java.util.HashMap<>(Map.of(
            "status", 403,
            "error", "Forbidden",
            "path", path,
            "message", message,
            "timestamp", LocalDateTime.now().format(LOG_FMT)
        ));

        if (requiredPermissionCode != null) {
            body.put("requiredPermission", requiredPermissionCode);
        }

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}