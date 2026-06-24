package com.hanghai.kchtg.security.service;

import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.user.entity.User;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;

/**
 * Main service wrapping access and refresh token lifecycle actions (F-274).
 */
@Service
public class TokenService {
    private final JwtUtil jwtUtil;
    private final TokenValidationService validationService;

    public TokenService(JwtUtil jwtUtil, TokenValidationService validationService) {
        this.jwtUtil = jwtUtil;
        this.validationService = validationService;
    }

    /**
     * Create access token for user.
     */
    public String createAccessToken(User user) {
        return jwtUtil.generateAccessToken(user);
    }

    public String createAccessToken(String username, String role) {
        return jwtUtil.generateToken(username, role);
    }

    /**
     * Create refresh token for user.
     */
    public String createRefreshToken(User user) {
        return jwtUtil.generateRefreshToken(user);
    }

    /**
     * Validate and retrieve claims from token.
     */
    public Claims validateToken(String token) {
        return validationService.getClaims(token);
    }

    /**
     * Helper check if token is valid.
     */
    public boolean isTokenValid(String token) {
        return validationService.isValid(token);
    }

    public long getAccessTokenExpiration() {
        return jwtUtil.getJwtProperties().getAccessTokenExpiration();
    }

    public long getRefreshTokenExpiration() {
        return jwtUtil.getJwtProperties().getRefreshTokenExpiration();
    }
}