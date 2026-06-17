package com.hanghai.kchtg.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for JWT token generation and validation.
 * <p>
 * Bound to the {@code jwt} prefix in {@code application.yml}.
 * </p>
 */
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /**
     * Base64-encoded HMAC-SHA256 secret key (minimum 256 bits).
     */
    private String secret;

    /**
     * Token expiration in milliseconds (default 24 hours = 86_400_000 ms).
     */
    private long expiration = 86_400_000L;

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
