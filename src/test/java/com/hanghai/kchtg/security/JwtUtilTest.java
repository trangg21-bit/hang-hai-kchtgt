package com.hanghai.kchtg.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JwtUtilTest {

    @Mock
    private JwtProperties jwtProperties;

    private JwtUtil jwtUtil;

    private String testUsername = "john.doe";
    private String testRole = "ROLE_ADMIN";

    @BeforeEach
    void setUp() {
        when(jwtProperties.getSecret()).thenReturn("dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZy1qd3Qtc2lnbmluZy1rZXk=");
        when(jwtProperties.getExpiration()).thenReturn(3600000L);
        jwtUtil = new JwtUtil(jwtProperties);
    }

    @Test
    void generateToken_shouldReturnValidJwtToken() {
        String token = jwtUtil.generateToken(testUsername, testRole);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        // JWT format: header.payload.signature (3 parts separated by dots)
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length, "Token should be a valid JWT with 3 parts");
    }

    @Test
    void generateToken_shouldNotContainBearerPrefix() {
        String token = jwtUtil.generateToken(testUsername, testRole);

        // JwtUtil.generateToken returns raw JWT, not Bearer token
        assertFalse(token.startsWith("Bearer "), "Token should not have Bearer prefix");
    }

    @Test
    void extractUsername_shouldReturnSubjectFromToken() {
        String token = jwtUtil.generateToken(testUsername, testRole);

        assertEquals(testUsername, jwtUtil.extractUsername(token));
    }

    @Test
    void extractRole_shouldReturnRoleFromToken() {
        String token = jwtUtil.generateToken(testUsername, testRole);

        assertEquals(testRole, jwtUtil.extractRole(token));
    }

    @Test
    void validateToken_shouldReturnClaimsForValidToken() {
        String token = jwtUtil.generateToken(testUsername, testRole);

        var claims = jwtUtil.validateToken(token);
        assertNotNull(claims);
        assertEquals(testUsername, claims.getSubject());
        assertEquals(testRole, claims.get("role", String.class));
    }

    @Test
    void validateToken_shouldThrowForInvalidToken() {
        assertThrows(Exception.class, () -> jwtUtil.validateToken("invalid.token.here"));
    }

    @Test
    void extractUsername_shouldThrowForInvalidToken() {
        assertThrows(Exception.class, () -> jwtUtil.extractUsername("invalid.token.here"));
    }

    @Test
    void extractRole_shouldThrowForInvalidToken() {
        assertThrows(Exception.class, () -> jwtUtil.extractRole("invalid.token.here"));
    }
}
