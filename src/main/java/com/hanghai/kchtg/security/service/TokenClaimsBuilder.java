package com.hanghai.kchtg.security.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Fluent builder for JWT claims (F-274).
 */
public class TokenClaimsBuilder {
    private final Map<String, Object> claims = new HashMap<>();

    public static TokenClaimsBuilder builder() {
        return new TokenClaimsBuilder();
    }

    public TokenClaimsBuilder subject(String subject) {
        claims.put("sub", subject);
        return this;
    }

    public TokenClaimsBuilder jti(String jti) {
        claims.put("jti", jti);
        return this;
    }

    public TokenClaimsBuilder userId(String userId) {
        claims.put("user_id", userId);
        return this;
    }

    public TokenClaimsBuilder roles(List<String> roles) {
        claims.put("roles", roles);
        return this;
    }

    public TokenClaimsBuilder permissions(List<String> permissions) {
        claims.put("permissions", permissions);
        return this;
    }

    public TokenClaimsBuilder claim(String key, Object value) {
        claims.put(key, value);
        return this;
    }

    public Map<String, Object> build() {
        return claims;
    }
}