package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the instant permission revocation logic in {@link JwtAuthFilter}.
 * <p>
 * A JWT carries the permission_version captured at issuance. When it is strictly
 * older than the user's current version (an admin changed the user's role), the
 * filter must reject the request with 401 and set no authentication (fail-closed).
 */
class JwtAuthFilterPermissionVersionTest {

    private JwtUtil jwtUtil;
    private UserRepository userRepository;
    private JwtAuthFilter filter;

    private static final String TOKEN = "header.payload.signature";

    @BeforeEach
    void setUp() {
        jwtUtil = mock(JwtUtil.class);
        userRepository = mock(UserRepository.class);
        filter = new JwtAuthFilter(jwtUtil, userRepository);
        SecurityContextHolder.clearContext();

        when(jwtUtil.extractUsername(TOKEN)).thenReturn("alice");
        when(jwtUtil.extractRole(TOKEN)).thenReturn("ROLE_USER");
        when(jwtUtil.isTotpEnabled(TOKEN)).thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private User userWithVersion(int version) {
        User user = new User();
        user.setUsername("alice");
        user.setStatus(UserStatus.ACTIVE);
        user.setPermissionVersion(version);
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        return user;
    }

    private MockHttpServletRequest requestWithBearer() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + TOKEN);
        request.setRequestURI("/api/users");
        return request;
    }

    @Test
    @DisplayName("Stale token (version older than user) is rejected with 401 and no authentication")
    void staleToken_rejectedWith401() throws Exception {
        userWithVersion(2);
        when(jwtUtil.extractPermissionVersion(TOKEN)).thenReturn(1);

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(requestWithBearer(), response, chain);

        assertEquals(401, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication(),
                "No authentication should be set for a stale token");
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("Current token (version matches user) authenticates and proceeds")
    void currentToken_authenticates() throws Exception {
        userWithVersion(2);
        when(jwtUtil.extractPermissionVersion(TOKEN)).thenReturn(2);

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(requestWithBearer(), response, chain);

        assertEquals(200, response.getStatus());
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(any(), any());
    }

    @Test
    @DisplayName("Legacy token without permission_version claim is accepted (backward compatible)")
    void tokenWithoutVersionClaim_accepted() throws Exception {
        userWithVersion(3);
        when(jwtUtil.extractPermissionVersion(TOKEN)).thenReturn(null);

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(requestWithBearer(), response, chain);

        assertEquals(200, response.getStatus());
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(any(), any());
    }
}
