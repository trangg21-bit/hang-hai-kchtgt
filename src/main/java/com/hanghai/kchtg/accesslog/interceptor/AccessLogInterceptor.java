package com.hanghai.kchtg.accesslog.interceptor;

import com.hanghai.kchtg.accesslog.annotation.AuditLog;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.admin.entity.AdminAccount;
import com.hanghai.kchtg.admin.entity.AdminAuditLog;
import com.hanghai.kchtg.admin.repository.AdminAccountRepository;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor to automatically capture request details and log them as audit events
 * if the controller handler method is annotated with {@link AuditLog}.
 * <p>
 * F-005 changes: writes are now queued to {@link AsyncLogAppender} instead of
 * being saved synchronously. Interceptor also populates new fields:
 * type, severity, targetResource, requestPath, responseCode, durationMs, metadata.
 * </p>
 */
@Component
public class AccessLogInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AccessLogInterceptor.class);

    private final AsyncLogAppender asyncLogAppender;
    private final UserRepository userRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;

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

        AuditLog auditLog = handlerMethod.getMethodAnnotation(AuditLog.class);
        if (auditLog == null) {
            return;
        }

        AccessLog logEntry = new AccessLog();
        logEntry.setAction(auditLog.action());
        logEntry.setModule(auditLog.module());

        // ── Type mapping: @AuditLog.module() → LogType ─────────────────
        logEntry.setType(mapModuleToType(auditLog.module()));

        // ── Request path ────────────────────────────────────────────────
        logEntry.setRequestPath(request.getRequestURI());
        logEntry.setTargetResource(extractTargetResource(request));

        // ── Client IP ───────────────────────────────────────────────────
        String ip = extractClientIp(request);
        logEntry.setIpAddress(ip);

        // ── User-Agent ──────────────────────────────────────────────────
        String userAgent = request.getHeader("User-Agent");
        // Sanitize: strip control characters
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

        // Resolve userId from username
        // Resolve userId from username
        String userIdStr = resolveUserId(username);
        if (userIdStr != null) {
            try {
                java.util.UUID uuid = java.util.UUID.fromString(userIdStr);
                logEntry.setUserId(uuid.getMostSignificantBits());
            } catch (IllegalArgumentException e) {
                try {
                    logEntry.setUserId(Long.parseLong(userIdStr));
                } catch (NumberFormatException nfe) {
                    logEntry.setUserId(0L);
                }
            }
        } else {
            logEntry.setUserId(0L);
        }

        // ── Status, severity, response code, duration ───────────────────
        int statusCode = response.getStatus();
        long startTime = (Long) request.getAttribute("requestStartTime");
        long endTime = System.currentTimeMillis();
        logEntry.setDurationMs((int) (endTime - startTime));
        logEntry.setResponseCode(statusCode);

        if (ex != null || statusCode >= 400) {
            logEntry.setStatus(AccessLogStatus.FAILED);
            String detailMsg = ex != null ? ex.getMessage() : "HTTP error status: " + statusCode;
            logEntry.setDetail(sanitize(detailMsg));

            // Auto-assign severity based on context
            logEntry.setSeverity(autoAssignSeverity(auditLog.module(), statusCode, ex));
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

        // ── Async batch queue (replaces sync repository.save()) ─────────
        asyncLogAppender.queue(logEntry);

        // Also save to AdminAuditLog if the user has admin authority
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
                        user.getUsername(), auditLog.action(), logEntry.getTargetResource());
                AdminAuditLog adminLog = AdminAuditLog.create(
                    user.getId(),
                    user.getUsername(),
                    auditLog.action(),
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

    /** Extract client IP from headers or remote address. */
    private String extractClientIp(HttpServletRequest request) {
        return com.hanghai.kchtg.common.util.IpUtils.getClientIp(request);
    }

    /** Resolve userId from username by querying UserRepository. */
    private String resolveUserId(String username) {
        try {
            User user = userRepository.findByUsername(username).orElse(null);
            return user != null ? String.valueOf(user.getId()) : null;
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
