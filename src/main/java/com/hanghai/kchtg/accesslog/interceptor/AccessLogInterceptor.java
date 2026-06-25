package com.hanghai.kchtg.accesslog.interceptor;

import com.hanghai.kchtg.accesslog.annotation.AuditLog;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

/**
 * Interceptor to automatically capture request details and log them as audit events
 * if the controller handler method is annotated with {@link AuditLog}.
 */
@Component
public class AccessLogInterceptor implements HandlerInterceptor {

    private static final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final AccessLogRepository accessLogRepository;
    private final UserRepository userRepository;

    public AccessLogInterceptor(AccessLogRepository accessLogRepository, UserRepository userRepository) {
        this.accessLogRepository = accessLogRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        if (!(handler instanceof HandlerMethod)) {
            return;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        AuditLog auditLog = handlerMethod.getMethodAnnotation(AuditLog.class);
        if (auditLog == null) {
            return;
        }

        AccessLog logEntry = new AccessLog();
        logEntry.setAction(auditLog.action());
        logEntry.setModule(auditLog.module());

        // Extract client IP address, checking X-Forwarded-For proxy headers
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else {
            int commaIndex = ip.indexOf(',');
            if (commaIndex != -1) {
                ip = ip.substring(0, commaIndex).trim();
            }
        }
        logEntry.setIpAddress(ip);

        // User-Agent
        logEntry.setUserAgent(request.getHeader("User-Agent"));

        // User authentication context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = "anonymousUser";
        UUID userId = SYSTEM_USER_ID;

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            username = auth.getName();
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                userId = user.getId();
            }
        } else {
            // Fallback: check if username was sent in the request parameter (e.g. for login attempts)
            String reqUsername = request.getParameter("username");
            if (reqUsername != null && !reqUsername.isBlank()) {
                username = reqUsername;
                User user = userRepository.findByUsername(reqUsername).orElse(null);
                if (user != null) {
                    userId = user.getId();
                }
            }
        }

        logEntry.setUsername(username);
        logEntry.setUserId(userId);

        // Status & Details
        int statusCode = response.getStatus();
        if (ex != null || statusCode >= 400) {
            logEntry.setStatus(AccessLogStatus.FAILED);
            String detailMsg = ex != null ? ex.getMessage() : "HTTP error status: " + statusCode;
            logEntry.setDetail(detailMsg);
        } else {
            logEntry.setStatus(AccessLogStatus.SUCCESS);
            logEntry.setDetail("HTTP " + statusCode);
        }

        accessLogRepository.save(logEntry);
    }
}
