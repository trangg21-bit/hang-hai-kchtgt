package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * JWT authentication filter that runs once per request.
 * <p>
 * Extracts the Bearer token from the Authorization header, validates it,
 * and sets the Spring Security {@code SecurityContext} for authenticated users.
 * <p>
 * When the {@code totp_enabled} claim is {@code true}, the filter additionally
 * checks that the request is NOT targeted at a TOTP management endpoint -
 * such requests require explicit MFA verification and are handled separately.
 * <p>
 * <b>Wave 2 enhancement (T-005, T-007):</b> Checks user status=LOCKED
 * and accountLockedUntil > now on every authenticated request.
 * If the account is locked, the request is rejected with 403.
 * </p>
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String MOCK_TOKEN_PREFIX = "mock-";

    /**
     * Paths that do NOT require JWT authentication (allowlist for dev / health).
     */
    private static final String[] PATHS_WITHOUT_AUTH = {
            "/api/auth/login",
            "/api/auth/totp/setup",
            "/api/auth/totp/verify",
            "/api/auth/totp/regenerate",
            "/h2-console/",
            "/error"
    };

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Value("${jwt.mock-token:#{null}}")
    private String mockToken;

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null) {
            // Dev mode: accept mock token
            if (mockToken != null && mockToken.equals(token)) {
                log.debug("Dev mock token accepted for: {}", request.getRequestURI());
                SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken("admin", null, List.of(
                        new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"),
                        new SimpleGrantedAuthority("ROLE_ADMIN"),
                        new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")
                    )));
                filterChain.doFilter(request, response);
                return;
            }

            try {
                String username = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token);
                boolean totpEnabled = jwtUtil.isTotpEnabled(token);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    List<SimpleGrantedAuthority> authorities = role != null
                            ? List.of(new SimpleGrantedAuthority(role))
                            : List.of();

                    User user = userRepository.findByUsername(username).orElse(null);

                    // Instant permission revocation: reject tokens whose permission
                    // snapshot is older than the user's current version. When an admin
                    // changes a user's role, the user's permission_version is bumped, so
                    // every previously-issued token becomes stale on its next request and
                    // the user is forced to re-authenticate (fail-closed).
                    if (user != null && isPermissionVersionStale(token, user)) {
                        log.warn("Rejected stale token for user {} - permissions changed since issuance", username);
                        SecurityContextHolder.clearContext();
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write(
                            "{\"success\":false,\"message\":\"Phiên đăng nhập đã hết hiệu lực do thay đổi phân quyền. Vui lòng đăng nhập lại.\"}");
                        return;
                    }

                    Object principal = user != null ? user : username;
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(principal, null, authorities);
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("JWT authenticated: user={}, role={}, totpEnabled={}", username, role, totpEnabled);

                    // Wave 2 (T-005, T-007): Check account lockout on every request
                    if (!isAccountLocked(username)) {
                        // TOTP check for TOTP-enabled users
                        if (totpEnabled) {
                            String path = request.getRequestURI();
                            for (String allowed : PATHS_WITHOUT_AUTH) {
                                if (path.startsWith(allowed)) {
                                    filterChain.doFilter(request, response);
                                    return; // Allow TOTP management endpoints
                                }
                            }
                            log.debug("User {} has TOTP enabled - proceed with request: {}", username, path);
                        }
                        filterChain.doFilter(request, response);
                    } else {
                        log.warn("Request from LOCKED user {} rejected by JwtAuthFilter", username);
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"success\":false,\"message\":\"Tai khoan da bi khoa\"}");
                        return;
                    }
                }
            } catch (JwtException e) {
                log.debug("Invalid JWT token: {}", e.getMessage());
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    /**
     * T-005, T-007: Check if the user account is locked.
     * Checks both status=LOCKED and accountLockedUntil > now.
     *
     * @param username the username to check
     * @return true if the account is locked (should reject request)
     */
    private boolean isAccountLocked(String username) {
        return userRepository.findByUsername(username).map(user -> {
            // Check status = LOCKED
            if (user.getStatus() == UserStatus.LOCKED) {
                return true;
            }
            // Check accountLockedUntil > now (BR-007 auto-lock from failed TOTP logins)
            if (user.getAccountLockedUntil() != null
                    && LocalDateTime.now().isBefore(user.getAccountLockedUntil())) {
                return true;
            }
            return false;
        }).orElse(false);
    }

    /**
     * Checks whether the token's permission snapshot is stale relative to the user.
     * <p>
     * The token carries a {@code permission_version} claim captured at issuance.
     * The user row holds the current version, bumped whenever the user's role
     * assignment changes. A token is stale only when it carries a version strictly
     * older than the current one. Tokens without the claim (issued before this
     * feature) are treated as valid for backward compatibility.
     *
     * @return true if the token is stale and must be rejected
     */
    private boolean isPermissionVersionStale(String token, User user) {
        Integer tokenVersion = jwtUtil.extractPermissionVersion(token);
        if (tokenVersion == null) {
            return false;
        }
        int currentVersion = user.getPermissionVersion() == null ? 0 : user.getPermissionVersion();
        return tokenVersion < currentVersion;
    }

    /**
     * Extracts the Bearer token from the Authorization header.
     *
     * @return the raw token string, or {@code null} if not present
     */
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
