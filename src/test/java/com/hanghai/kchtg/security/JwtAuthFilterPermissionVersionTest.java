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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the instant permission revocation logic in
 * {@link JwtAuthFilter}.
 * <p>
 * A JWT carries the permission_version captured at issuance. When it is
 * strictly
 * older than the user's current version (an admin changed the user's role), the
 * filter must reject the request with 401 and set no authentication
 * (fail-closed).
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
        when(userRepository.findByUsernameWithRelations("alice")).thenReturn(Optional.of(user));
        return user;
    }

    private MockHttpServletRequest requestWithBearer() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + TOKEN);
        request.setRequestURI("/api/users");
        return request;
    }

    @Test
    @DisplayName("Token authenticates with live database permissions and attaches X-New-Token on version change")
    void tokenWithDifferentVersion_authenticatesWithLivePermissions() throws Exception {
        User user = userWithVersion(2);
        when(jwtUtil.extractPermissionVersion(TOKEN)).thenReturn(1);
        when(jwtUtil.generateAccessToken(user)).thenReturn("new.header.payload.signature");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(requestWithBearer(), response, chain);

        assertEquals(200, response.getStatus());
        assertEquals("new.header.payload.signature", response.getHeader("X-New-Token"));
        assertEquals("X-New-Token", response.getHeader("Access-Control-Expose-Headers"));
        assertEquals("no-store", response.getHeader("Cache-Control"));
        assertNotNull(SecurityContextHolder.getContext().getAuthentication(),
                "Authentication should be set using live database permissions");
        verify(chain).doFilter(any(), any());
    }

    @Test
    @DisplayName("Current token (version matches user) authenticates without attaching X-New-Token")
    void currentToken_authenticates() throws Exception {
        userWithVersion(2);
        when(jwtUtil.extractPermissionVersion(TOKEN)).thenReturn(2);

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(requestWithBearer(), response, chain);

        assertEquals(200, response.getStatus());
        assertNull(response.getHeader("X-New-Token"));
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain).doFilter(any(), any());
    }

    @Test
    @DisplayName("Token for non-existent user in DB is rejected with 401 (fail-closed)")
    void nonExistentUser_rejectedWith401() throws Exception {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());
        when(userRepository.findByUsernameWithRelations("alice")).thenReturn(Optional.empty());

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(requestWithBearer(), response, chain);

        assertEquals(401, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("Token for INACTIVE user in DB is rejected with 403 (fail-closed)")
    void inactiveUser_rejectedWith403() throws Exception {
        User user = userWithVersion(1);
        user.setStatus(UserStatus.INACTIVE);

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(requestWithBearer(), response, chain);

        assertEquals(403, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("Token for LOCKED user in DB is rejected with 403 (fail-closed)")
    void lockedUser_rejectedWith403() throws Exception {
        User user = userWithVersion(1);
        user.setStatus(UserStatus.LOCKED);

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(requestWithBearer(), response, chain);

        assertEquals(403, response.getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(chain, never()).doFilter(any(), any());
    }
}
