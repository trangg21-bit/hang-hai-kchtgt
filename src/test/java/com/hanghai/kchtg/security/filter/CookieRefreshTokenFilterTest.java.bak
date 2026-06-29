package com.hanghai.kchtg.security.filter;

import com.hanghai.kchtg.security.config.CookieConfig;
import com.hanghai.kchtg.security.service.TokenService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CookieRefreshTokenFilterTest {

    @Mock
    private TokenService tokenService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private CookieRefreshTokenFilter filter;

    @BeforeEach
    void setUp() {
        filter = new CookieRefreshTokenFilter(tokenService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should skip validation if URI is not refresh")
    void shouldSkipValidationIfUriIsNotRefresh() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/login");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(tokenService);
    }

    @Test
    @DisplayName("Should authenticate user when cookie refresh token is valid")
    void shouldAuthenticateUserWhenCookieIsPresentAndValid() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/refresh");
        when(request.getMethod()).thenReturn("POST");

        Cookie refreshCookie = new Cookie(CookieConfig.REFRESH_TOKEN_COOKIE_NAME, "valid-token");
        when(request.getCookies()).thenReturn(new Cookie[]{refreshCookie});

        when(tokenService.isTokenValid("valid-token")).thenReturn(true);

        Claims mockClaims = mock(Claims.class);
        when(mockClaims.getSubject()).thenReturn("testuser");
        when(tokenService.validateToken("valid-token")).thenReturn(mockClaims);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("testuser", SecurityContextHolder.getContext().getAuthentication().getName());
        verify(request).setAttribute("cookieRefreshToken", "valid-token");
    }

    @Test
    @DisplayName("Should not authenticate if token validation fails")
    void shouldNotAuthenticateIfTokenValidationFails() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/refresh");
        when(request.getMethod()).thenReturn("POST");

        Cookie refreshCookie = new Cookie(CookieConfig.REFRESH_TOKEN_COOKIE_NAME, "invalid-token");
        when(request.getCookies()).thenReturn(new Cookie[]{refreshCookie});

        when(tokenService.isTokenValid("invalid-token")).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(tokenService, never()).validateToken(anyString());
    }
}