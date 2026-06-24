package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.service.PermissionRoleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PermissionMiddlewareTest {

    @Mock
    private PermissionRoleService permissionRoleService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private PermissionMiddleware middleware;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        middleware = new PermissionMiddleware(permissionRoleService, objectMapper);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should skip permission check for public paths")
    void shouldSkipCheckForPublicPaths() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/auth/login");
        when(request.getMethod()).thenReturn("POST");

        middleware.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(permissionRoleService);
    }

    @Test
    @DisplayName("Should block and return 403 when user is not authenticated")
    void shouldBlockWhenUnauthenticated() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/users/list");
        when(request.getMethod()).thenReturn("GET");

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ServletOutputStream sos = new ServletOutputStream() {
            @Override public boolean isReady() { return true; }
            @Override public void setWriteListener(WriteListener writeListener) {}
            @Override public void write(int b) throws IOException { baos.write(b); }
        };
        when(response.getOutputStream()).thenReturn(sos);

        middleware.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    @DisplayName("Should bypass checks for Super Admin role")
    void shouldBypassForSuperAdmin() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/users/list");
        when(request.getMethod()).thenReturn("GET");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("superadmin");
        when(auth.getAuthorities()).thenAnswer(inv -> List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(permissionRoleService.isSuperAdmin(anyString())).thenReturn(true);

        middleware.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(permissionRoleService, never()).checkPermission(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should allow access if user has required permission")
    void shouldAllowAccessIfUserHasPermission() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/users/list");
        when(request.getMethod()).thenReturn("GET");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("normaluser");
        when(auth.getAuthorities()).thenAnswer(inv -> List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(permissionRoleService.isSuperAdmin(anyString())).thenReturn(false);
        when(permissionRoleService.checkPermission("normaluser", "users", "read")).thenReturn(true);

        middleware.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should deny access and return 403 when user lacks permission")
    void shouldDenyAccessWhenLacksPermission() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/users/list");
        when(request.getMethod()).thenReturn("GET");

        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("normaluser");
        when(auth.getAuthorities()).thenAnswer(inv -> List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(permissionRoleService.isSuperAdmin(anyString())).thenReturn(false);
        when(permissionRoleService.checkPermission("normaluser", "users", "read")).thenReturn(false);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ServletOutputStream sos = new ServletOutputStream() {
            @Override public boolean isReady() { return true; }
            @Override public void setWriteListener(WriteListener writeListener) {}
            @Override public void write(int b) throws IOException { baos.write(b); }
        };
        when(response.getOutputStream()).thenReturn(sos);

        middleware.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
        
        String responseBody = baos.toString();
        assertTrue(responseBody.contains("users:read"));
    }

    @Test
    @DisplayName("Should skip permission check for integration paths")
    void shouldSkipCheckForIntegrationPaths() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/integration/kchtgt/sync");
        when(request.getMethod()).thenReturn("POST");

        middleware.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(permissionRoleService);
    }
}