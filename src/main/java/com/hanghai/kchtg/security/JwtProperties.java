package com.hanghai.kchtg.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Base64;

/**
 * Configuration properties for JWT token generation and validation.
 * <p>
 * Bound to the {@code jwt} prefix in {@code application.yml}.
 * </p>
 */
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    private static final Logger log = LoggerFactory.getLogger(JwtProperties.class);

    /**
     * Base64-encoded HMAC-SHA256 secret key (minimum 256 bits).
     */
    private String secret;

    /**
     * Token expiration in milliseconds (default 24 hours = 86_400_000 ms).
     */
    private long expiration = 86_400_000L;

    @PostConstruct
    public void validate() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret must be set via jwt.secret property (e.g. JWT_SECRET env var). "
                    + "Hardcoded fallbacks have been removed for security.");
        }
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must decode to at least 32 bytes (256 bits). "
                    + "Got " + keyBytes.length + " bytes.");
        }
        log.info("JWT secret validated successfully ({} bits)", keyBytes.length * 8);
    }

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
}
