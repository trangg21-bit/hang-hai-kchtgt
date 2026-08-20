package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.security.service.UserSecurityCacheService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
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
import java.util.UUID;

/**
 * JWT authentication filter that runs once per request.
 * <p>
 * Extracts the Bearer token from the Authorization header, validates it,
 * and sets the Spring Security {@code SecurityContext} for authenticated users.
 * <p>
 * User security state and effective permissions are restored from a Redis
 * snapshot after the first DB load; mutation services evict that snapshot.
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
    private final UserSecurityCacheService userSecurityCacheService;

    @Autowired(required = false)
    private Environment environment;

    @Value("${jwt.mock-token:#{null}}")
    private String mockToken;

    @Autowired
    public JwtAuthFilter(JwtUtil jwtUtil,
            @Nullable UserRepository userRepository,
            @Nullable Environment environment,
            @Nullable UserSecurityCacheService userSecurityCacheService) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.environment = environment;
        this.userSecurityCacheService = userSecurityCacheService;
    }

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this(jwtUtil, userRepository, null, null);
    }

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository,
            Environment environment) {
        this(jwtUtil, userRepository, environment, null);
    }

    private boolean isDevOrTestEnvironment() {
        if (environment == null) {
            return false;
        }
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) {
            String[] defaultProfiles = environment.getDefaultProfiles();
            for (String profile : defaultProfiles) {
                if ("dev".equalsIgnoreCase(profile) || "local".equalsIgnoreCase(profile)
                        || "test".equalsIgnoreCase(profile)) {
                    return true;
                }
            }
            return false;
        }
        for (String profile : activeProfiles) {
            if ("dev".equalsIgnoreCase(profile) || "local".equalsIgnoreCase(profile)
                    || "test".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null) {
            // Dev mode: accept mock token ONLY in dev/local/test environments
            if (mockToken != null && mockToken.equals(token)) {
                if (isDevOrTestEnvironment()) {
                    log.debug("Dev mock token accepted for: {}", request.getRequestURI());
                    User devUser = userRepository != null ? userRepository.findByUsername("admin").orElse(null) : null;
                    Object principal = devUser != null ? devUser : "admin";
                    List<SimpleGrantedAuthority> devAuthorities = devUser == null
                            ? List.of()
                            : devUser.getAllPermissions().stream().map(SimpleGrantedAuthority::new).toList();
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(principal, null, devAuthorities));
                    filterChain.doFilter(request, response);
                    return;
                } else {
                    log.warn("Mock token rejected in non-dev environment for URI: {}", request.getRequestURI());
                }
            }

            try {
                String username = jwtUtil.extractUsername(token);
                boolean totpEnabled = jwtUtil.isTotpEnabled(token);
                UUID tokenUserId = jwtUtil.extractUserId(token);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    User user = userSecurityCacheService == null || tokenUserId == null
                            ? null
                            : userSecurityCacheService.get(tokenUserId).orElse(null);
                    boolean loadedFromSecurityCache = user != null;
                    if (user == null) {
                        user = userRepository.findByUsernameWithRelations(username).orElse(null);
                    }
                    if (user == null) {
                        log.warn("JWT rejected: user '{}' not found in database", username);
                        SecurityContextHolder.clearContext();
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write(
                                "{\"success\":false,\"message\":\"Người dùng không tồn tại hoặc đã bị xóa.\"}");
                        return;
                    }
                    if (tokenUserId != null && !tokenUserId.equals(user.getId())) {
                        log.warn("JWT rejected: user_id does not match subject for '{}'", username);
                        SecurityContextHolder.clearContext();
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write(
                                "{\"success\":false,\"message\":\"Token không hợp lệ.\"}");
                        return;
                    }

                    // Check user status (must be ACTIVE)
                    if (user.getStatus() != UserStatus.ACTIVE) {
                        log.warn("JWT rejected: user '{}' status is {}", username, user.getStatus());
                        SecurityContextHolder.clearContext();
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write(
                                "{\"success\":false,\"message\":\"Tài khoản không ở trạng thái hoạt động.\"}");
                        return;
                    }

                    // Cache the complete security snapshot after the first DB load.
                    // Permission/status mutation services evict this key, so changes
                    // remain effective immediately without querying DB every request.
                    if (!loadedFromSecurityCache && userSecurityCacheService != null) {
                        userSecurityCacheService.put(user);
                    }

                    // Wave 2 (T-005, T-007): Check account lockout on every request
                    if (isAccountLocked(user)) {
                        log.warn("Request from LOCKED user {} rejected by JwtAuthFilter", username);
                        SecurityContextHolder.clearContext();
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"success\":false,\"message\":\"Tài khoản đã bị khóa.\"}");
                        return;
                    }

                    List<SimpleGrantedAuthority> authorities = user.getAllPermissions().stream()
                            .map(SimpleGrantedAuthority::new).toList();

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user,
                            null, authorities);
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("JWT authenticated: user={}, directPermissions={}, totpEnabled={}", username,
                            authorities.size(), totpEnabled);

                    // Wave 3: Token renewal when permission_version is stale relative to current
                    // user
                    if (isPermissionVersionStale(token, user)) {
                        String newToken = jwtUtil.generateAccessToken(user);
                        response.setHeader("X-New-Token", newToken);
                        response.setHeader("Access-Control-Expose-Headers", "X-New-Token");
                        response.setHeader("Cache-Control", "no-store");
                        log.debug("Attached fresh JWT in X-New-Token for user {} (version {} -> {})",
                                username, jwtUtil.extractPermissionVersion(token), user.getPermissionVersion());
                    }

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
     * @param user the user entity to check
     * @return true if the account is locked (should reject request)
     */
    private boolean isAccountLocked(User user) {
        if (user == null) {
            return true;
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            return true;
        }
        if (user.getAccountLockedUntil() != null
                && LocalDateTime.now().isBefore(user.getAccountLockedUntil())) {
            return true;
        }
        return false;
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
            // Fail-closed: Tokens without permission_version claim are considered
            // invalid/stale
            return true;
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
