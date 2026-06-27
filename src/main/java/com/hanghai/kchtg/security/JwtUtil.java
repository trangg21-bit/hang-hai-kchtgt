package com.hanghai.kchtg.security;

import com.hanghai.kchtg.security.service.TokenClaimsBuilder;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.RoleRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import com.hanghai.kchtg.user.entity.Permission;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.repository.PermissionRepository;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utility for generating and validating JWT tokens using HMAC-SHA256.
 * Supports:
 * - Legacy single-token flow.
 * - Dual-token (access/refresh) flow.
 */
@Component
public class JwtUtil {

    private final JwtProperties jwtProperties;
    private final SecretKey signingKey;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public JwtUtil(JwtProperties jwtProperties, RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.jwtProperties = jwtProperties;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        byte[] keyBytes = Base64.getUrlDecoder().decode(jwtProperties.getSecret());
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    // =========================================================================
    //  SINGLE-TOKEN METHODS (legacy - backward-compatible)
    // =========================================================================

    /**
     * Sinh JWT token don (legacy) cho username va role.
     */
    public String generateToken(String username, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getExpiration());

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Generates a signed JWT token with TOTP/MFA status claim.
     */
    public String generateTokenWithMfa(String username, String role, boolean totpEnabled) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getAccessTokenExpiration());

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("totp_enabled", totpEnabled)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Sinh refresh token (legacy) voi role va type claim.
     */
    public String generateRefreshToken(String username, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getRefreshExpiration());

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    // =========================================================================
    //  DUAL-TOKEN METHODS (F-273 Wave 1)
    // =========================================================================

    /**
     * Sinh access token cho User voi dual-token claims.
     * <p>
     * Claims: sub (username), jti (UUID), role, role_level, totp_enabled.
     * Thoi gian het han: {@code jwt.access-token-expiration} (default 15 phut).
     * </p>
     */
    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getAccessTokenExpiration());
        String role = user.getRoles().stream().map(Role::getCode).findFirst().orElse("ROLE_USER");
        List<String> permissions = new java.util.ArrayList<>();
        for (Role r : user.getRoles()) {
            if (r.getPermissions() != null) {
                permissions.addAll(r.getPermissions().stream().map(Permission::getCode).collect(Collectors.toList()));
            }
        }

        Map<String, Object> claims = TokenClaimsBuilder.builder()
                .subject(user.getUsername())
                .jti(java.util.UUID.randomUUID().toString())
                .userId(user.getId().toString())
                .roles(List.of(role))
                .permissions(permissions)
                .claim("role_level", resolveRoleLevel(role))
                .claim("totp_enabled", Boolean.TRUE.equals(user.getTotpEnabled()))
                .build();

        return Jwts.builder()
                .claims(claims)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Sinh refresh token cho User voi dual-token claims.
     * <p>
     * Claims: sub (username), jti (UUID), user_id (UUID string), type=refresh.
     * Thoi gian het han: {@code jwt.refresh-token-expiration} (default 7 ngay).
     * </p>
     */
    public String generateRefreshToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getRefreshTokenExpiration());

        return Jwts.builder()
                .subject(user.getUsername())
                .id(java.util.UUID.randomUUID().toString())
                .claim("user_id", user.getId().toString())
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    // =========================================================================
    //  SHARED UTILITIES
    // =========================================================================

    /**
     * Parse va validate JWT, tra ve claims.
     *
     * @throws JwtException neu token khong hop le hoac het han
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Lay username (subject) tu JWT.
     */
    public String extractUsername(String token) {
        return validateToken(token).getSubject();
    }

    /**
     * Lay role claim tu JWT.
     */
    public String extractRole(String token) {
        return validateToken(token).get("role", String.class);
    }

    /**
     * Lay TOTP enabled claim tu JWT.
     */
    public boolean isTotpEnabled(String token) {
        Claims claims = validateToken(token);
        Object totpEnabled = claims.get("totp_enabled");
        if (totpEnabled instanceof Boolean) {
            return (Boolean) totpEnabled;
        }
        return false;
    }

    /**
     * Kiem tra token co phai refresh token khong.
     */
    public boolean isRefreshToken(String token) {
        Claims claims = validateToken(token);
        Object type = claims.get("type");
        return "refresh".equals(type);
    }

    /**
     * Map Spring Security role de numeric level cho RBAC.
     * <ul>
     *   <li>SUPER_ADMIN -> 4</li>
     *   <li>ADMIN       -> 3</li>
     *   <li>SUPPORT     -> 2</li>
     *   <li>other       -> 1</li>
     * </ul>
     */
    private int resolveRoleLevel(String role) {
        if (role == null) return 1;
        String upper = role.toUpperCase();
        if (upper.startsWith("SUPER_ADMIN")) return 4;
        if (upper.startsWith("ADMIN"))       return 3;
        if (upper.startsWith("SUPPORT"))     return 2;
        return 1;
    }

    /**
     * Expose JwtProperties de service-layer tinh toan expiry.
     */
    public JwtProperties getJwtProperties() {
        return jwtProperties;
    }
}