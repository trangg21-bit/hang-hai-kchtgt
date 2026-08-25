package com.hanghai.kchtg.security.service;

import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.repository.JwtSessionRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

/**
 * Service for JWT validation and parsing (F-274).
 */
@Service
public class TokenValidationService {
    private final JwtUtil jwtUtil;
    private final CacheManager cacheManager;
    private final JwtSessionRepository sessionRepository;

    public TokenValidationService(JwtUtil jwtUtil, CacheManager cacheManager, JwtSessionRepository sessionRepository) {
        this.jwtUtil = jwtUtil;
        this.cacheManager = cacheManager;
        this.sessionRepository = sessionRepository;
    }

    /**
     * Checks if a token is cryptographically valid and not expired.
     */
    public boolean isValid(String token) {
        try {
            Claims claims = jwtUtil.validateToken(token);
            String jti = claims.getId();
            if (jti != null && isJtiRevoked(jti)) {
                return false;
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Parses and returns claims from a valid token.
     */
    public Claims getClaims(String token) {
        Claims claims = jwtUtil.validateToken(token);
        String jti = claims.getId();
        if (jti != null && isJtiRevoked(jti)) {
            throw new JwtException("Token has been revoked");
        }
        return claims;
    }

    /**
     * Checks if a JWT ID (JTI) is revoked, using Caffeine cache (F-274).
     */
    public boolean isJtiRevoked(String jti) {
        if (jti == null || jti.isEmpty()) {
            return false;
        }
        org.springframework.cache.Cache cache = cacheManager.getCache("jwtRevocation");
        if (cache != null) {
            Boolean cachedValue = cache.get(jti, Boolean.class);
            if (cachedValue != null) {
                return cachedValue;
            }
        }

        boolean isRevoked = sessionRepository.findBySessionId(jti)
                .map(session -> Boolean.TRUE.equals(session.getIsRevoked()))
                .orElse(true);

        if (cache != null) {
            cache.put(jti, isRevoked);
        }
        return isRevoked;
    }
}