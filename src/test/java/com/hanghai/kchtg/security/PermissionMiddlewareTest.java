package com.hanghai.kchtg.security;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.PermissionRoleService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PermissionMiddlewareTest {

    @Mock
    private PermissionRoleService permissionRoleService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private PermissionMiddleware permissionMiddleware;

    private UUID userId;
    private User testUser;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("testuser");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_whenOptionsMethod_shouldSkip() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/users");
        when(request.getMethod()).thenReturn("OPTIONS");

        permissionMiddleware.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(permissionRoleService);
    }

    @Test
    void doFilterInternal_whenAuthEndpoint_shouldSkip() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getMethod()).thenReturn("POST");

        permissionMiddleware.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(permissionRoleService);
    }

    @Test
    void doFilterInternal_whenUserNotAuthenticated_shouldWrite403Forbidden() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/v1/users");
        when(request.getMethod()).thenReturn("GET");

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        permissionMiddleware.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
        verifyNoInteractions(permissionRoleService);
        assertThat(stringWriter.toString()).contains("user:read");
    }

    @Test
    void doFilterInternal_whenPermissionDenied_shouldWrite403Forbidden() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, "pass", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(request.getRequestURI()).thenReturn("/api/v1/users");
        when(request.getMethod()).thenReturn("GET");
        when(permissionRoleService.checkPermission(eq(auth), eq("user"), eq("read"))).thenReturn(false);

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        permissionMiddleware.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
        assertThat(stringWriter.toString()).contains("user:read");
    }

    @Test
    void doFilterInternal_whenPermissionGranted_shouldProceedFilterChain() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, "pass", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(request.getRequestURI()).thenReturn("/api/v1/users");
        when(request.getMethod()).thenReturn("GET");
        when(permissionRoleService.checkPermission(eq(auth), eq("user"), eq("read"))).thenReturn(true);

        permissionMiddleware.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_whenSystemAdminAuthority_shouldBypassDatabasePermissionLookup() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, "pass", List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(permissionRoleService.isSuperAdmin(auth)).thenReturn(true);
        when(request.getRequestURI()).thenReturn("/api/v1/vts-system");
        when(request.getMethod()).thenReturn("GET");

        permissionMiddleware.doFilterInternal(request, response, filterChain);

        verify(permissionRoleService, never()).checkPermission(any(Authentication.class), anyString(), anyString());
        verify(permissionRoleService, never()).checkPermission(any(UUID.class), anyString(), anyString());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_whenConventionPluralUrl_shouldNormalizeToSingularResource() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, "pass", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(request.getRequestURI()).thenReturn("/api/v1/categories");
        when(request.getMethod()).thenReturn("POST");
        when(permissionRepository.countByResource("category")).thenReturn(1L);
        when(permissionRoleService.checkPermission(eq(auth), eq("category"), eq("create"))).thenReturn(true);

        permissionMiddleware.doFilterInternal(request, response, filterChain);

        verify(permissionRoleService).checkPermission(eq(auth), eq("category"), eq("create"));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_whenVtsAttachmentMutation_shouldUseUpdatePermission() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, "pass", List.of(new SimpleGrantedAuthority("ROLE_SPECIALIST")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(request.getRequestURI()).thenReturn("/api/v1/vts-system/11111111-1111-1111-1111-111111111111/attachments");
        when(request.getMethod()).thenReturn("POST");
        when(permissionRoleService.checkPermission(eq(auth), eq("vts"), eq("update"))).thenReturn(true);

        permissionMiddleware.doFilterInternal(request, response, filterChain);

        verify(permissionRoleService).checkPermission(eq(auth), eq("vts"), eq("update"));
        verify(permissionRoleService, never()).checkPermission(eq(auth), eq("vts"), eq("create"));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_whenVtsDocumentAlias_shouldUseVtsResource() throws Exception {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, "pass", List.of(new SimpleGrantedAuthority("ROLE_SPECIALIST")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(request.getRequestURI()).thenReturn("/api/v1/he-thong-vts");
        when(request.getMethod()).thenReturn("GET");
        when(permissionRoleService.checkPermission(eq(auth), eq("vts"), eq("read"))).thenReturn(true);

        permissionMiddleware.doFilterInternal(request, response, filterChain);

        verify(permissionRoleService).checkPermission(eq(auth), eq("vts"), eq("read"));
        verify(filterChain).doFilter(request, response);
    }
}
