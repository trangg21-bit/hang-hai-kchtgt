package com.hanghai.kchtg.security.service;

import com.hanghai.kchtg.security.JwtProperties;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.user.entity.User;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private TokenValidationService validationService;

    private TokenService tokenService;
    private User testUser;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService(jwtUtil, validationService);

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setRole("ROLE_USER");
    }

    @Test
    @DisplayName("Should delegate createAccessToken for user")
    void shouldDelegateCreateAccessTokenForUser() {
        when(jwtUtil.generateAccessToken(testUser)).thenReturn("access-token-123");

        String token = tokenService.createAccessToken(testUser);

        assertEquals("access-token-123", token);
        verify(jwtUtil).generateAccessToken(testUser);
    }

    @Test
    @DisplayName("Should delegate createAccessToken for username and role")
    void shouldDelegateCreateAccessTokenForUsernameAndRole() {
        when(jwtUtil.generateToken("testuser", "ROLE_USER")).thenReturn("token-123");

        String token = tokenService.createAccessToken("testuser", "ROLE_USER");

        assertEquals("token-123", token);
        verify(jwtUtil).generateToken("testuser", "ROLE_USER");
    }

    @Test
    @DisplayName("Should delegate createRefreshToken")
    void shouldDelegateCreateRefreshToken() {
        when(jwtUtil.generateRefreshToken(testUser)).thenReturn("refresh-token-123");

        String token = tokenService.createRefreshToken(testUser);

        assertEquals("refresh-token-123", token);
        verify(jwtUtil).generateRefreshToken(testUser);
    }

    @Test
    @DisplayName("Should delegate validateToken")
    void shouldDelegateValidateToken() {
        Claims mockClaims = mock(Claims.class);
        when(validationService.getClaims("token-abc")).thenReturn(mockClaims);

        Claims result = tokenService.validateToken("token-abc");

        assertEquals(mockClaims, result);
        verify(validationService).getClaims("token-abc");
    }

    @Test
    @DisplayName("Should delegate isTokenValid")
    void shouldDelegateIsTokenValid() {
        when(validationService.isValid("token-abc")).thenReturn(true);

        boolean result = tokenService.isTokenValid("token-abc");

        assertTrue(result);
        verify(validationService).isValid("token-abc");
    }

    @Test
    @DisplayName("Should retrieve token expirations from properties")
    void shouldRetrieveTokenExpirations() {
        JwtProperties properties = new JwtProperties();
        properties.setAccessTokenExpiration(900000);
        properties.setRefreshTokenExpiration(604800000);

        when(jwtUtil.getJwtProperties()).thenReturn(properties);

        assertEquals(900000, tokenService.getAccessTokenExpiration());
        assertEquals(604800000, tokenService.getRefreshTokenExpiration());
    }
}
