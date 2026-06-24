package com.hanghai.kchtg.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Base64;

/**
 * Properties cho JWT - cap nhat F-273 (dual-token access/refresh).
 * <p>
 * Cach y: {@code jwt},  {@code jwt.access-token-expiration},
 * {@code jwt.refresh-token-expiration}.
 * </p>
 */
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    private static final Logger log = LoggerFactory.getLogger(JwtProperties.class);

    /**
     * Base64-encoded HMAC-SHA256 secret key (toi thie 256 bits).
     */
    private String secret;

    /**
     * Token expiration in milliseconds (default 24 hours = 86_400_000 ms).
     * Dung cho legacy single-token flow.
     */
    private long expiration = 86_400_000L;

    /**
     * Access token expiration (dual-token) - default 15 phut = 900_000 ms.
     */
    private long accessTokenExpiration = 900_000L;

    /**
     * Refresh token expiration (dual-token) - default 7 ngay = 604_800_000 ms.
     */
    private long refreshTokenExpiration = 604_800_000L;

    @PostConstruct
    public void validate() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret phai duoc set qua jwt.secret property "
                    + "(vi du: bien moi truong JWT_SECRET). "
                    + "Hardcoded fallback da duoc loai bo de bao mat.");
        }
        try {
            byte[] keyBytes = Base64.getDecoder().decode(secret);
            if (keyBytes.length < 32) {
                throw new IllegalStateException("JWT secret phai decode duoc 32 bytes (256 bits) tro len. "
                        + "Nhan duoc " + keyBytes.length + " bytes.");
            }
            log.info("JWT secret validated successfully ({} bits)", keyBytes.length * 8);
        } catch (Exception e) {
            throw new IllegalStateException("JWT secret khong hop le (decode bi loi): " + e.getMessage(), e);
        }
    }

    // =========================================================================

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpiration() {
        return expiration;
    }

    public void setExpiration(long expiration) {
        this.expiration = expiration;
    }

    /**
     * Alias cho getExpiration - legacy access token expiry.
     */
    public long getAccessExpiration() {
        return expiration;
    }

    public void setAccessExpiration(long accessExpiration) {
        this.expiration = accessExpiration;
    }

    public long getRefreshExpiration() {
        return refreshTokenExpiration;
    }

    public void setRefreshExpiration(long refreshExpiration) {
        this.refreshTokenExpiration = refreshExpiration;
    }

    // =========================================================================

    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }

    public void setAccessTokenExpiration(long accessTokenExpiration) {
        this.accessTokenExpiration = accessTokenExpiration;
    }

    public long getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }

    public void setRefreshTokenExpiration(long refreshTokenExpiration) {
        this.refreshTokenExpiration = refreshTokenExpiration;
    }
}