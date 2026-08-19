package com.hanghai.kchtg.security;

import com.hanghai.kchtg.security.service.TokenClaimsBuilder;
import com.hanghai.kchtg.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.*;
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

    public JwtUtil(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        byte[] keyBytes = Base64.getUrlDecoder().decode(jwtProperties.getSecret());
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    // =========================================================================
    // SINGLE-TOKEN METHODS (legacy - backward-compatible)
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
    // DUAL-TOKEN METHODS (F-273 Wave 1)
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
        Set<String> allPerms = user.getAllPermissions();
        List<String> permissions = new ArrayList<>(allPerms);

        Map<String, Object> claims = TokenClaimsBuilder.builder()
                .subject(user.getUsername())
                .jti(UUID.randomUUID().toString())
                .userId(user.getId().toString())
                .claim("email", user.getEmail())
                .permissions(permissions)
                .claim("totp_enabled", Boolean.TRUE.equals(user.getTotpEnabled()))
                .claim("permission_version", user.getPermissionVersion())
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
                .id(UUID.randomUUID().toString())
                .claim("user_id", user.getId().toString())
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    // =========================================================================
    // SHARED UTILITIES
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

    /** Extracts the stable user identifier embedded in access tokens. */
    public UUID extractUserId(String token) {
        Claims claims = validateToken(token);
        String userId = claims.get("user_id", String.class);
        if (userId == null || userId.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(userId);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    /**
     * Lay role claim tu JWT.
     */
    public String extractRole(String token) {
        Claims claims = validateToken(token);
        String role = claims.get("role", String.class);
        if (role == null) {
            Object rolesObj = claims.get("roles");
            if (rolesObj instanceof List<?> rolesList && !rolesList.isEmpty()) {
                role = String.valueOf(rolesList.get(0));
            }
        }
        return role;
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
     * Lay permission_version claim tu JWT.
     * <p>
     * Dung cho co che thu hoi quyen tuc thi: token mang phien ban permission tai
     * thoi diem phat hanh; neu lech voi phien ban hien tai cua user thi token da
     * cu.
     *
     * @return gia tri phien ban, hoac {@code null} neu token khong co claim nay
     *         (token cu phat hanh truoc khi tinh nang duoc bat - bo qua kiem tra).
     */
    public Integer extractPermissionVersion(String token) {
        Claims claims = validateToken(token);
        Object version = claims.get("permission_version");
        return version instanceof Number number ? number.intValue() : null;
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
     * Expose JwtProperties de service-layer tinh toan expiry.
     */
    public JwtProperties getJwtProperties() {
        return jwtProperties;
    }
}
