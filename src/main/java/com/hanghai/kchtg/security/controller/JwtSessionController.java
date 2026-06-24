package com.hanghai.kchtg.security.controller;


import com.hanghai.kchtg.security.dto.JwtRefreshRequest;
import com.hanghai.kchtg.security.entity.JwtSessionEntity;
import com.hanghai.kchtg.security.service.JwtSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for JWT session management (F-274).
 * <p>
 * Endpoints:
 * <ul>
 *   <li>POST /api/auth/refresh      - Refresh access token using refresh token</li>
 *   <li>POST /api/auth/revoke/{jti} - Revoke a session by JWT ID</li>
 *   <li>GET  /api/auth/sessions     - List active sessions for current user</li>
 * </ul>
 * </p>
 */
@RestController
@RequestMapping("/api/auth")
public class JwtSessionController {

    private static final Logger log = LoggerFactory.getLogger(JwtSessionController.class);

    private final JwtSessionService sessionService;
    private final com.hanghai.kchtg.security.service.TokenService tokenService;
    private final com.hanghai.kchtg.security.config.CookieConfig cookieConfig;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;

    public JwtSessionController(JwtSessionService sessionService,
                                com.hanghai.kchtg.security.service.TokenService tokenService,
                                com.hanghai.kchtg.security.config.CookieConfig cookieConfig,
                                com.hanghai.kchtg.user.repository.UserRepository userRepository) {
        this.sessionService = sessionService;
        this.tokenService = tokenService;
        this.cookieConfig = cookieConfig;
        this.userRepository = userRepository;
    }

    // =========================================================================
    //  POST /api/auth/refresh
    // =========================================================================

    /**
     * Refresh access token.
     * <p>
     * Accepts a refresh token in the request body (or via cookie in filter layer).
     * Validates the token, detects reuse, and returns a new access token on success.
     * </p>
     *
     * @param request  the HTTP request (for cookie extraction or body)
     * @param response the HTTP response (for setting new cookies if needed)
     * @return ResponseEntity with new access token or 401 error
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshAccessToken(
            @Valid @RequestBody(required = false) JwtRefreshRequest body,
            HttpServletRequest request,
            HttpServletResponse response) {

        // Extract refresh token from body or cookie
        String refreshToken = extractRefreshToken(body, request);

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Missing refresh token"));
        }

        try {
            // Validate and detect reuse
            var sessionOpt = sessionService.validateRefreshToken(refreshToken);

            if (sessionOpt.isEmpty()) {
                // =========================================================================
                log.warn("Refresh token invalid or reuse detected from IP: {}", getClientIp(request));
                return ResponseEntity.status(401)
                        .body(Map.of(
                                "error", "Refresh token invalid or expired",
                                "allSessionsRevoked", true
                        ));
            }

            JwtSessionEntity session = sessionOpt.get();
            String newAccessToken = generateNewAccessToken(session);

            // Renew the refresh token cookie
            cookieConfig.setRefreshTokenCookie(response, refreshToken);

            log.info("Access token refreshed: userId={}, sessionId={}",
                    session.getUserId(), session.getSessionId());

            return ResponseEntity.ok(Map.of(
                    "accessToken", newAccessToken,
                    "tokenType", "Bearer",
                    "sessionId", session.getSessionId()
            ));

        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    // =========================================================================
    //  POST /api/auth/revoke/{jti}
    // =========================================================================

    /**
     * Revoke a session by its JWT ID (JTI).
     *
     * @param jti    the JWT ID to revoke
     * @return ResponseEntity with result
     */
    @PostMapping("/revoke/{jti}")
    public ResponseEntity<?> revokeSession(
            @PathVariable String jti) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        String username = auth.getName();
        String userId = extractUserId(auth);

        try {
            boolean revoked = sessionService.revokeSession(jti, userId, "USER_LOGOUT");

            if (!revoked) {
                return ResponseEntity.status(404)
                        .body(Map.of("error", "Session not found for JTI: " + jti));
            }

            log.info("Session revoked by user '{}': jti={}", username, jti);

            return ResponseEntity.ok(Map.of(
                    "message", "Session revoked successfully",
                    "jti", jti
            ));

        } catch (Exception e) {
            log.error("Error revoking session jti='{}': {}", jti, e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    // =========================================================================
    //  GET /api/auth/sessions
    // =========================================================================

    /**
     * List all active (non-revoked) sessions for the current authenticated user.
     *
     * @return ResponseEntity with session list
     */
    @GetMapping("/sessions")
    public ResponseEntity<?> listActiveSessions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        String userId = extractUserId(auth);

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User ID not found in authentication"));
        }

        try {
            List<JwtSessionEntity> sessions = sessionService.findActiveByUserId(userId);

            List<Map<String, Object>> sessionList = sessions.stream()
                    .map(this::buildSessionResponse)
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "total", sessionList.size(),
                    "sessions", sessionList
            ));

        } catch (Exception e) {
            log.error("Error listing sessions: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    // =========================================================================
    //  Utilities
    // =========================================================================

    /**
     * Extract refresh token from request body or cookie.
     */
    private String extractRefreshToken(JwtRefreshRequest body, HttpServletRequest request) {
        // 1. Try body first
        if (body != null && body.getRefreshToken() != null && !body.getRefreshToken().isBlank()) {
            return body.getRefreshToken();
        }

        // 2. Fall back to cookie
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }

    /**
     * Extract user ID from authentication principal.
     */
    private String extractUserId(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof com.hanghai.kchtg.user.entity.User user) {
            return user.getId().toString();
        }
        return null;
    }

    /**
     * Generate a new access token for a validated session.
     */
    private String generateNewAccessToken(JwtSessionEntity session) {
        java.util.UUID userId = java.util.UUID.fromString(session.getUserId());
        com.hanghai.kchtg.user.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return tokenService.createAccessToken(user);
    }

    /**
     * Build a session response map from a JwtSessionEntity.
     */
    private Map<String, Object> buildSessionResponse(JwtSessionEntity session) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("sessionId", session.getSessionId());
        map.put("username", session.getUsername());
        map.put("roleLevel", session.getRoleLevel());
        map.put("ipAddress", session.getIpAddress());
        map.put("userAgent", session.getUserAgent());
        map.put("deviceFingerprint", session.getDeviceFingerprint());
        map.put("lastUsedAt", session.getLastUsedAt());
        map.put("expiresAt", session.getExpiresAt());
        map.put("status", session.getStatus().name());
        map.put("createdAt", session.getCreatedAt());
        return map;
    }

    /**
     * Get client IP from request.
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwarded = request.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isBlank()) {
            return xForwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}