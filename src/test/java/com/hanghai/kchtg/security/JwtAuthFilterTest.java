package com.hanghai.kchtg.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    private String validToken;
    private String validBearerToken;

    @BeforeEach
    void setUp() {
        // Generate a real JWT token for testing
        var jwtProperties = new JwtProperties();
        jwtProperties.setSecret("dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZw==");
        jwtProperties.setExpiration(3600000L);
        JwtUtil realJwtUtil = new JwtUtil(jwtProperties);

        validToken = realJwtUtil.generateToken("john.doe", "ROLE_ADMIN");
        validBearerToken = "Bearer " + validToken;

        // Mock jwtUtil to return valid claims for the generated token
        Claims claims = realJwtUtil.validateToken(validToken);
        when(jwtUtil.extractUsername(validToken)).thenReturn(claims.getSubject());
        when(jwtUtil.extractRole(validToken)).thenReturn(claims.get("role", String.class));
    }

    @Test
    void doFilter_validToken_shouldSetSecurityContextAndContinue() throws ServletException, IOException {
        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert â€” SecurityContext should be populated
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("john.doe", SecurityContextHolder.getContext().getAuthentication().getName());

        // Filter chain should continue
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_validToken_shouldExtractCorrectRole() throws ServletException, IOException {
        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert â€” role should be in authorities
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(1, auth.getAuthorities().size());
        assertTrue(auth.getAuthorities().toString().contains("ROLE_ADMIN"));
    }

    @Test
    void doFilter_invalidToken_shouldNotSetSecurityContextAndContinue() throws ServletException, IOException {
        // Arrange â€” invalid JWT throws JwtException
        String invalidToken = "invalid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + invalidToken);
        when(jwtUtil.extractUsername(invalidToken)).thenThrow(new JwtException("Invalid JWT"));

        SecurityContextHolder.clearContext();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert â€” SecurityContext should be cleared, chain continues
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_expiredToken_shouldNotSetSecurityContextAndContinue() throws ServletException, IOException {
        // Arrange â€” expired token throws JwtException (expired signature)
        var jwtProperties = new JwtProperties();
        jwtProperties.setSecret("dGVzdC1zZWNyZXQta2V5LWZvci1qd3Qtc2lnbmluZw==");
        jwtProperties.setExpiration(1L); // 1ms expiration
        JwtUtil shortLived = new JwtUtil(jwtProperties);

        String expiredToken = shortLived.generateToken("john.doe", "ROLE_ADMIN");
        Thread.sleep(10); // Wait for expiration

        when(request.getHeader("Authorization")).thenReturn("Bearer " + expiredToken);
        when(jwtUtil.extractUsername(expiredToken)).thenThrow(new JwtException("JWT expired"));

        SecurityContextHolder.clearContext();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert â€” should not authenticate, chain continues
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_missingAuthorizationHeader_shouldContinueChain() throws ServletException, IOException {
        // Arrange
        when(request.getHeader("Authorization")).thenReturn(null);
        SecurityContextHolder.clearContext();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert â€” no authentication set, chain continues
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_emptyAuthorizationHeader_shouldContinueChain() throws ServletException, IOException {
        // Arrange
        when(request.getHeader("Authorization")).thenReturn("");
        SecurityContextHolder.clearContext();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert â€” no authentication set, chain continues
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_malformedBearerPrefix_shouldContinueChain() throws ServletException, IOException {
        // Arrange â€” "Basic xxx" is not a Bearer token
        when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNz");
        SecurityContextHolder.clearContext();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert â€” no authentication set, chain continues
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_nullTokenFromExtract_shouldContinueChain() throws ServletException, IOException {
        // Arrange â€” extractUsername returns null
        String token = "some.token.value";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtUtil.extractUsername(token)).thenReturn(null);
        SecurityContextHolder.clearContext();

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert â€” no authentication set (null username), chain continues
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_alreadyAuthenticated_shouldNotOverwriteContext() throws ServletException, IOException {
        // Arrange
        var existingAuth = org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated(
            "existing-user", null, java.util.Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        // Act
        jwtAuthFilter.doFilter(request, response, filterChain);

        // Assert â€” existing authentication preserved
        assertEquals("existing-user", SecurityContextHolder.getContext().getAuthentication().getName());
        verify(filterChain).doFilter(request, response);
    }
}
