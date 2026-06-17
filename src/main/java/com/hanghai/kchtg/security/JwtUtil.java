package com.hanghai.kchtg.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

/**
 * Utility for generating and validating JWT tokens using HMAC-SHA256.
 */
@Component
public class JwtUtil {

    private final JwtProperties jwtProperties;
    private final SecretKey signingKey;

    public JwtUtil(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        byte[] keyBytes = Base64.getDecoder().decode(jwtProperties.getSecret());
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT token for the given username and role.
     *
     * @param username the authenticated username
     * @param role     the user's role (e.g. {@code ROLE_USER})
     * @return compact JWT string
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
     * Parses and validates a JWT token, returning its claims.
     *
     * @param token the compact JWT string
     * @return the parsed claims
     * @throws JwtException if the token is invalid or expired
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extracts the username (subject) from a JWT token without validation.
     * Useful for quick lookups before full validation.
     *
     * @param token the compact JWT string
     * @return the username from the token claims
     */
    public String extractUsername(String token) {
        return validateToken(token).getSubject();
    }

    /**
     * Extracts the role claim from a JWT token.
     *
     * @param token the compact JWT string
     * @return the role string (e.g. {@code ROLE_USER})
     */
    public String extractRole(String token) {
        return validateToken(token).get("role", String.class);
    }
}
