package com.hanghai.kchtg.accesslog.interceptor;

import com.hanghai.kchtg.accesslog.annotation.AuditLog;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.entity.AdminAuditLog;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.common.util.IpUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor to automatically capture ALL API requests and log them as audit events.
 * <p>
 * When the controller handler method is annotated with {@link AuditLog}, the annotation
 * values override auto-detected action/module/type. Otherwise the interceptor
 * auto-detects these from the HTTP method and request path.
 * </p>
 * <p>
 * F-005 changes: writes are now queued to {@link AsyncLogAppender} instead of
 * being saved synchronously. Interceptor also populates new fields:
 * type, severity, targetResource, requestPath, responseCode, durationMs, metadata,
 * email, orgUnit, sessionId.
 * </p>
 */
@Component
public class AccessLogInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AccessLogInterceptor.class);

    private final AsyncLogAppender asyncLogAppender;
    private final UserRepository userRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;

    /**
     * Simple in-memory cache to prevent duplicate log entries from the same user
     * to the same endpoint within a short time window.
     * Key: "userId:method:path", Value: timestamp of last log entry.
     */
    private final java.util.concurrent.ConcurrentHashMap<String, Long> recentLogCache =
            new java.util.concurrent.ConcurrentHashMap<>();

    private static final long DEDUP_WINDOW_MS = 3000; // 3 seconds

    public AccessLogInterceptor(AsyncLogAppender asyncLogAppender, UserRepository userRepository,
                                AdminAuditLogRepository adminAuditLogRepository) {
        this.asyncLogAppender = asyncLogAppender;
        this.userRepository = userRepository;
        this.adminAuditLogRepository = adminAuditLogRepository;
    }

    /** Record the start time for duration calculation. */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (handler instanceof HandlerMethod handlerMethod) {
            request.setAttribute("requestStartTime", System.currentTimeMillis());
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return;
        }

        // ── Skip OPTIONS preflight ──────────────────────────────────────
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return;
        }

        AuditLog auditLog = handlerMethod.getMethodAnnotation(AuditLog.class);

        // ── Skip sub-resource calls (tree, search, counts) unless @AuditLog annotated ──
        if (auditLog == null && !isPrimaryRequest(request)) {
            return;
        }

        AccessLog logEntry = new AccessLog();

        // ── Action / Module / Type: annotation overrides, else auto-detect ─
        if (auditLog != null) {
            logEntry.setAction(auditLog.action());
            logEntry.setModule(auditLog.module());
            logEntry.setType(mapModuleToType(auditLog.module()));
        } else {
            logEntry.setAction(detectAction(request));
            logEntry.setModule(detectModule(request));
            logEntry.setType(detectLogType(logEntry.getModule(), request.getMethod()));
        }

        // ── Request path ────────────────────────────────────────────────
        logEntry.setRequestPath(request.getRequestURI());
        logEntry.setTargetResource(extractTargetResource(request));

        // ── Client IP ───────────────────────────────────────────────────
        String ip = extractClientIp(request);
        logEntry.setIpAddress(ip);

        // ── User-Agent ──────────────────────────────────────────────────
        String userAgent = request.getHeader("User-Agent");
        logEntry.setUserAgent(sanitize(userAgent));

        // ── User authentication context ─────────────────────────────────
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = "anonymousUser";

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            username = auth.getName();
        } else {
            User reqUser = (User) request.getAttribute("authenticatedUser");
            if (reqUser != null) {
                username = reqUser.getUsername();
            } else {
                // Fallback: check if username was sent in the request parameter
                String reqUsername = request.getParameter("username");
                if (reqUsername != null && !reqUsername.isBlank()) {
                    username = sanitize(reqUsername);
                }
            }
        }
        logEntry.setUsername(username);

        // ── Email, orgUnit, sessionId (F-005) ─────────────────────────────
        logEntry.setEmail(resolveEmail(username));
        logEntry.setOrgUnit(resolveOrgUnit(username));
        logEntry.setSessionId(resolveSessionId(request));

<<<<<<< HEAD
        // A user ID is a UUID throughout the system. Anonymous and failed-login
        // requests intentionally have no user ID, while retaining the username/IP.
        logEntry.setUserId(resolveUserId(username));
=======
        // Resolve userId from username
        String userIdStr = resolveUserId(username);
        if (userIdStr != null) {
            try {
                logEntry.setUserId(java.util.UUID.fromString(userIdStr));
            } catch (IllegalArgumentException e) {
                logEntry.setUserId(null);
            }
        }
>>>>>>> company/main

        // ── Status, severity, response code, duration ───────────────────
        int statusCode = response.getStatus();
        Long startTimeObj = (Long) request.getAttribute("requestStartTime");
        if (startTimeObj != null) {
            logEntry.setDurationMs((int) (System.currentTimeMillis() - startTimeObj));
        }
        logEntry.setResponseCode(statusCode);

        String moduleForSeverity = (auditLog != null) ? auditLog.module() : logEntry.getModule();

        if (ex != null || statusCode >= 400) {
            logEntry.setStatus(AccessLogStatus.FAILED);
            String detailMsg = ex != null ? ex.getMessage() : "HTTP error status: " + statusCode;
            logEntry.setDetail(sanitize(detailMsg));
            logEntry.setSeverity(autoAssignSeverity(moduleForSeverity, statusCode, ex));
        } else {
            logEntry.setStatus(AccessLogStatus.SUCCESS);
            logEntry.setDetail("HTTP " + statusCode);
            logEntry.setSeverity(LogSeverity.INFO);
        }

        // ── Metadata (JSON string, currently null; populated by annotating controllers) ─
        logEntry.setMetadata(null);

        // ── Timestamps ──────────────────────────────────────────────────
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        logEntry.setCreatedAt(now);
        logEntry.setUpdatedAt(now);

        // ── Deduplication: skip if same user+method+path within 3 seconds ─
        if (isDuplicateRequest(logEntry.getUserId(), request.getMethod(), logEntry.getRequestPath())) {
            return;
        }

        // ── Async batch queue (replaces sync repository.save()) ─────────
        asyncLogAppender.queue(logEntry);

        // Also save to AdminAuditLog if the user has admin authority
        String actionForAdminLog = (auditLog != null) ? auditLog.action() : logEntry.getAction();
        User user = null;

        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getName())) {
            boolean isAdminRole = auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_SYSTEM_ADMIN".equals(a.getAuthority()) || "ROLE_ADMIN".equals(a.getAuthority()));

            if (isAdminRole) {
                if (auth.getPrincipal() instanceof User) {
                    user = (User) auth.getPrincipal();
                } else {
                    String currentUsername = auth.getName();
                    user = userRepository.findByUsername(currentUsername).orElse(null);
                }
            }
        } else {
            User reqUser = (User) request.getAttribute("authenticatedUser");
            if (reqUser != null) {
                String role = (String) request.getAttribute("authenticatedUserRole");
                if ("ROLE_SYSTEM_ADMIN".equals(role) || "ROLE_ADMIN".equals(role)) {
                    user = reqUser;
                }
            }
        }

        if (user != null) {
            try {
                log.info("Saving AdminAuditLog for admin: {}, action: {}, target: {}",
                        user.getUsername(), actionForAdminLog, logEntry.getTargetResource());
                AdminAuditLog adminLog = AdminAuditLog.create(
                    user.getId(),
                    user.getUsername(),
                    actionForAdminLog,
                    logEntry.getTargetResource(),
                    logEntry.getDetail(),
                    logEntry.getIpAddress(),
                    logEntry.getUserAgent()
                );
                adminAuditLogRepository.save(adminLog);
            } catch (Exception e) {
                log.error("Failed to save AdminAuditLog in AccessLogInterceptor", e);
            }
        }
    }

    // ── Deduplication helpers ─────────────────────────────────────────
     * Simple in-memory cache to prevent duplicate log entries from the same user
     * to the same endpoint within a short time window.
     * Key: "userId:method:path", Value: timestamp of last log entry.
     */
    private final java.util.concurrent.ConcurrentHashMap<String, Long> recentLogCache =
            new java.util.concurrent.ConcurrentHashMap<>();

    private static final long DEDUP_WINDOW_MS = 3000; // 3 seconds

    public AccessLogInterceptor(AsyncLogAppender asyncLogAppender, UserRepository userRepository,
                                AdminAuditLogRepository adminAuditLogRepository) {
        this.asyncLogAppender = asyncLogAppender;
        this.userRepository = userRepository;
        this.adminAuditLogRepository = adminAuditLogRepository;
    }

    /** Record the start time for duration calculation. */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (handler instanceof HandlerMethod handlerMethod) {
            request.setAttribute("requestStartTime", System.currentTimeMillis());
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return;
        }

        // ── Skip OPTIONS preflight ──────────────────────────────────────
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return;
        }

        AuditLog auditLog = handlerMethod.getMethodAnnotation(AuditLog.class);

        // ── Skip sub-resource calls (tree, search, counts) unless @AuditLog annotated ──
        if (auditLog == null && !isPrimaryRequest(request)) {
            return;
        }

        AccessLog logEntry = new AccessLog();

        // ── Action / Module / Type: annotation overrides, else auto-detect ─
        if (auditLog != null) {
            logEntry.setAction(auditLog.action());
            logEntry.setModule(auditLog.module());
            logEntry.setType(mapModuleToType(auditLog.module()));
        } else {
            logEntry.setAction(detectAction(request));
            logEntry.setModule(detectModule(request));
            logEntry.setType(detectLogType(logEntry.getModule(), request.getMethod()));
        }

        // ── Request path ────────────────────────────────────────────────
        logEntry.setRequestPath(request.getRequestURI());
        logEntry.setTargetResource(extractTargetResource(request));

        // ── Client IP ───────────────────────────────────────────────────
        String ip = extractClientIp(request);
        logEntry.setIpAddress(ip);

        // ── User-Agent ──────────────────────────────────────────────────
        String userAgent = request.getHeader("User-Agent");
        logEntry.setUserAgent(sanitize(userAgent));

        // ── User authentication context ─────────────────────────────────
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = "anonymousUser";

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            username = auth.getName();
        } else {
            User reqUser = (User) request.getAttribute("authenticatedUser");
            if (reqUser != null) {
                username = reqUser.getUsername();
            } else {
                // Fallback: check if username was sent in the request parameter
                String reqUsername = request.getParameter("username");
                if (reqUsername != null && !reqUsername.isBlank()) {
                    username = sanitize(reqUsername);
                }
            }
        }
        logEntry.setUsername(username);

        // ── Email, orgUnit, sessionId (F-005) ─────────────────────────────
        logEntry.setEmail(resolveEmail(username));
        logEntry.setOrgUnit(resolveOrgUnit(username));
        logEntry.setSessionId(resolveSessionId(request));

        // Resolve userId from username
        String userIdStr = resolveUserId(username);
        if (userIdStr != null) {
            try {
                logEntry.setUserId(java.util.UUID.fromString(userIdStr));
            } catch (IllegalArgumentException e) {
                logEntry.setUserId(null);
            }
        }

        // ── Status, severity, response code, duration ───────────────────
        int statusCode = response.getStatus();
        Long startTimeObj = (Long) request.getAttribute("requestStartTime");
        if (startTimeObj != null) {
            logEntry.setDurationMs((int) (System.currentTimeMillis() - startTimeObj));
        }
        logEntry.setResponseCode(statusCode);

        String moduleForSeverity = (auditLog != null) ? auditLog.module() : logEntry.getModule();

        if (ex != null || statusCode >= 400) {
            logEntry.setStatus(AccessLogStatus.FAILED);
            String detailMsg = ex != null ? ex.getMessage() : "HTTP error status: " + statusCode;
            logEntry.setDetail(sanitize(detailMsg));
            logEntry.setSeverity(autoAssignSeverity(moduleForSeverity, statusCode, ex));
        } else {
            logEntry.setStatus(AccessLogStatus.SUCCESS);
            logEntry.setDetail("HTTP " + statusCode);
            logEntry.setSeverity(LogSeverity.INFO);
        }

        // ── Metadata (JSON string, currently null; populated by annotating controllers) ─
        logEntry.setMetadata(null);

        // ── Timestamps ──────────────────────────────────────────────────
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        logEntry.setCreatedAt(now);
        logEntry.setUpdatedAt(now);

        // ── Deduplication: skip if same user+method+path within 3 seconds ─
        if (isDuplicateRequest(logEntry.getUserId(), request.getMethod(), logEntry.getRequestPath())) {
            return;
        }

        // ── Async batch queue (replaces sync repository.save()) ─────────
        asyncLogAppender.queue(logEntry);

        // Also save to AdminAuditLog if the user has admin authority
        String actionForAdminLog = (auditLog != null) ? auditLog.action() : logEntry.getAction();
        User user = null;

        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getName())) {
            boolean isAdminRole = auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_SYSTEM_ADMIN".equals(a.getAuthority()) || "ROLE_ADMIN".equals(a.getAuthority()));

            if (isAdminRole) {
                if (auth.getPrincipal() instanceof User) {
                    user = (User) auth.getPrincipal();
                } else {
                    String currentUsername = auth.getName();
                    user = userRepository.findByUsername(currentUsername).orElse(null);
                }
            }
        } else {
            User reqUser = (User) request.getAttribute("authenticatedUser");
            if (reqUser != null) {
                String role = (String) request.getAttribute("authenticatedUserRole");
                if ("ROLE_SYSTEM_ADMIN".equals(role) || "ROLE_ADMIN".equals(role)) {
                    user = reqUser;
                }
            }
        }

        if (user != null) {
            try {
                log.info("Saving AdminAuditLog for admin: {}, action: {}, target: {}",
                        user.getUsername(), actionForAdminLog, logEntry.getTargetResource());
                AdminAuditLog adminLog = AdminAuditLog.create(
                    user.getId(),
                    user.getUsername(),
                    actionForAdminLog,
                    logEntry.getTargetResource(),
                    logEntry.getDetail(),
                    logEntry.getIpAddress(),
                    logEntry.getUserAgent()
                );
                adminAuditLogRepository.save(adminLog);
            } catch (Exception e) {
                log.error("Failed to save AdminAuditLog in AccessLogInterceptor", e);
            }
        }
    }

    // ── Deduplication helpers ─────────────────────────────────────────

    /**
     * Check if this request was already logged recently (same user, method, path within 3 seconds).
     * If yes, skip. If no, record the timestamp and return false.
     */
    private boolean isDuplicateRequest(java.util.UUID userId, String method, String path) {
        if (recentLogCache.size() > 500) {
            recentLogCache.entrySet().removeIf(e -> (now - e.getValue()) > DEDUP_WINDOW_MS * 2);
        }

        if (lastTime != null && (now - lastTime) < DEDUP_WINDOW_MS) {
            return true;
        }
        return false;
    }

    // ── Auto-detect helpers (F-005) ────────────────────────────────────

    /**
     * Auto-detect the action string from HTTP method and request path.
     * Pattern: VERB_RESOURCE (e.g. GET /api/ports → VIEW_PORT_LIST)
     */
    private String detectAction(HttpServletRequest request) {
        String method = request.getMethod().toUpperCase();
        String path = request.getRequestURI();
        String resource = getModuleName(path);
        String verb = switch (method) {
            case "GET" -> "VIEW";
            case "POST" -> "CREATE";
            case "PUT", "PATCH" -> "UPDATE";
            case "DELETE" -> "DELETE";
            default -> method;
        };
        boolean isSingle = path.matches(".*/\\d+$");
        return verb + "_" + resource + (isSingle && "GET".equals(method) ? "" : method.equals("GET") ? "_LIST" : "");
    }

    /**
     * Extract the real module name from path, skipping version prefixes like v1/v2.
     * /api/v1/dashboard/... → "DASHBOARD"
     * /api/users → "USERS"
     */
    private String getModuleName(String path) {
        if (path.startsWith("/api/")) {
            String[] parts = path.substring(5).split("/");
            int startIdx = 0;
            // Skip version prefix like v1, v2
            if (parts.length > 0 && parts[0].matches("v\\d+")) {
                startIdx = 1;
            }
            if (parts.length > startIdx && !parts[startIdx].isEmpty()) {
                return parts[startIdx].toUpperCase().replace("-", "_");
            }
        }
        return "SYSTEM";
    }

    /**
     * Auto-detect the module name from the request URI's first path segment.
     */
    private String detectModule(HttpServletRequest request) {
        return getModuleName(request.getRequestURI());
    }

    /**
     * Infer LogType from detected module and HTTP method.
     */
    private LogType detectLogType(String module, String httpMethod) {
        return switch (module.toUpperCase()) {
            case "AUTH", "LOGIN", "LOGOUT" -> LogType.LOGIN;
            case "USER" -> (httpMethod.equals("GET") ? LogType.ACCESS : LogType.ACCOUNT);
            case "ADMIN", "SETTINGS", "CONFIG" -> LogType.CONFIGURATION;
            default -> LogType.ACCESS;
        };
    }

    /**
     * Resolve the email of the user from their username via UserRepository.
     * Returns null for anonymous users or lookup failures.
     */
    private String resolveEmail(String username) {
        if (username == null || "anonymousUser".equals(username)) return null;
        try {
            var user = userRepository.findByUsername(username).orElse(null);
            return user != null ? user.getEmail() : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Resolve the organisational unit name of the user via
     * {@link UserRepository#findByUsernameWithRelations(String)} to avoid
     * LazyInitializationException on the OrgUnit relationship.
     */
    private String resolveOrgUnit(String username) {
        if (username == null || "anonymousUser".equals(username)) return null;
        try {
            var user = userRepository.findByUsernameWithRelations(username).orElse(null);
            return user != null && user.getOrgUnit() != null ? user.getOrgUnit().getName() : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Resolve a stable session identifier from the Bearer JWT token or
     * the HTTP session, truncated to 50 characters to fit the column.
     */
    private String resolveSessionId(HttpServletRequest request) {
        try {
            String h = request.getHeader("Authorization");
            if (h != null && h.startsWith("Bearer ")) {
                String t = h.substring(7);
                return t.length() > 50 ? t.substring(0, 50) : t;
            }
            var s = request.getSession(true);
            if (s != null) return s.getId();
            return java.util.UUID.randomUUID().toString().substring(0, 50);
        } catch (Exception e) {
            return null;
        }
    }

    // ── End auto-detect helpers ─────────────────────────────────────────

    /**
     * Map @AuditLog.module() value to a LogType enum.
     * Mapping rules:
     *   AUTH → LOGIN, ACCOUNT → ACCOUNT, CONFIG → CONFIGURATION,
     *   SYSTEM → ERROR, default → ACCESS
     */
    private LogType mapModuleToType(String module) {
        String upper = module != null ? module.toUpperCase() : "";
        return switch (upper) {
            case "AUTH", "LOGIN" -> LogType.LOGIN;
            case "ACCOUNT" -> LogType.ACCOUNT;
            case "CONFIG" -> LogType.CONFIGURATION;
            case "SYSTEM" -> LogType.ERROR;
            default -> LogType.ACCESS;
        };
    }

    /**
     * Auto-assign severity based on audit context.
     *   Login failure → warning
     *   System error → error
     *   Security breach → critical
     *   Default → info
     */
    private LogSeverity autoAssignSeverity(String module, int statusCode, Exception ex) {
        String upper = module != null ? module.toUpperCase() : "";
        // Security breaches always get critical
        if (statusCode >= 500 || (ex != null && ex.getClass().getSimpleName().contains("Security"))) {
            return LogSeverity.CRITICAL;
        }
        // Login-related failures get warning
        if (upper.equals("AUTH") || upper.equals("LOGIN") || statusCode == 401 || statusCode == 403) {
            return LogSeverity.WARNING;
        }
        // System errors get error
        if (statusCode >= 500) {
            return LogSeverity.ERROR;
        }
        // Default warning for any failure
        return LogSeverity.WARNING;
    }

    /** Extract the target resource from the request. */
    private String extractTargetResource(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Strip query string for cleaner target resource
        int queryIndex = path.indexOf('?');
        if (queryIndex != -1) {
            path = path.substring(0, queryIndex);
        }
        return path;
    }

    /**
     * Only log primary resource requests. Sub-resource calls (tree, search, counts, summary)
     * that are internal to a page load are skipped to avoid duplicate entries.
     * Supports both /api/ and /v1/ prefixes used by backend controllers.
     */
    private boolean isPrimaryRequest(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Skip static resources and non-API paths
        if (path.contains(".")) return false; // static files like .js, .css, .png

        // Accept /api/*, /v1/*, and common direct API paths
        String relativePath;
        if (path.startsWith("/api/")) {
            relativePath = path.substring(5);
        } else if (path.startsWith("/v1/")) {
            relativePath = path.substring(4);
        } else if (path.startsWith("/api")) {
            relativePath = path.substring(5);
        } else {
            // Unknown prefix — skip
            return false;
        }

        String[] segments = relativePath.split("/");
        if (segments.length == 0 || segments[0].isEmpty()) return false;

        // Single segment list endpoint → always primary
        if (segments.length == 1) return true;

        // Check last segment
        String last = segments[segments.length - 1].toLowerCase();
        if (last.matches("\\d+")) return true;
        return !isSubResourceKeyword(last);
    }

    /**
     * Known sub-resource keywords that indicate a supporting API call, not a primary user action.
     */
    private boolean isSubResourceKeyword(String segment) {
        return switch (segment) {
            // Supporting/internal calls that should not be logged as primary actions
            case "tree", "search", "search-paged", "count", "counts", "summary",
                 "sync", "health", "status" -> true;
            default -> false;
        };
    }

    /** Extract client IP from headers or remote address. */
    private String extractClientIp(HttpServletRequest request) {
        return IpUtils.getClientIp(request);
    }

    /** Resolve userId from username by querying UserRepository. */
    private java.util.UUID resolveUserId(String username) {
        try {
            User user = userRepository.findByUsername(username).orElse(null);
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            log.warn("Failed to resolve userId for user '{}': {}", username, e.getMessage());
            return null;
        }
    }

    /**
     * Sanitize a string for log storage: strip newlines/tabs, truncate to safe length.
     * Prevents log injection attacks (NFR-Sec-02).
     */
    private String sanitize(String value) {
        if (value == null) return null;
        // Strip control characters that could cause log injection
        String cleaned = value.replaceAll("[\\n\\r\\t]", " ");
        // Truncate to 1000 chars to prevent oversized log entries
        if (cleaned.length() > 1000) {
            cleaned = cleaned.substring(0, 1000) + "...";
        }
        return cleaned;
    }
}
