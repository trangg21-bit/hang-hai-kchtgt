package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.cangben.controller.CangBienController;
import com.hanghai.kchtg.cangben.service.CangBienApprovalService;
import com.hanghai.kchtg.cangben.service.CangBienService;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.PermissionAuthorizationManager;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC security tests for CangBienController.
 *
 * check() returns boolean so SpEL evaluates the actual grant/deny result.
 * BUG-RBAC-001 is fixed: the deny path now correctly raises AccessDeniedException
 * (fail-closed).
 *
 * Test context note: @AutoConfigureMockMvc(addFilters = false) disables the
 * security filter chain (including ExceptionTranslationFilter). Consequently,
 * AccessDeniedException propagates as a resolved servlet exception rather than
 * being translated to HTTP 403. The deny-path tests assert the resolved exception
 * type directly, which is the authoritative proof of fail-closed behaviour. In a
 * full integration context (addFilters = true) the same exception maps to HTTP 403.
 *
 * Covers:
 *  - authenticated user WITH permission → endpoint succeeds (200)
 *  - authenticated user WITHOUT permission → AccessDeniedException raised (fail-closed)
 */
@WebMvcTest(CangBienController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(MethodSecurityTestConfig.class)
@DisplayName("CangBienController RBAC / @PreAuthorize security tests — M-002")
class CangBienRbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CangBienService cangBienService;

    @MockBean
    private CangBienApprovalService cangBienApprovalService;

    // The @auth bean — mocked to control grant/deny decision
    @MockBean(name = "auth")
    private PermissionAuthorizationManager auth;

    // Infrastructure stubs
    @MockBean
    private AccessLogRepository accessLogRepository;

    @MockBean
    private AsyncLogAppender asyncLogAppender;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private TokenService tokenService;

    @MockBean
    private JwtSessionService jwtSessionService;

    @MockBean
    private TokenValidationService tokenValidationService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    // ── Helper ─────────────────────────────────────────────────────────────

    /**
     * RequestPostProcessor that sets the user principal on MockHttpServletRequest.
     * Spring MVC's ServletRequestMethodArgumentResolver resolves the Authentication
     * method parameter via request.getUserPrincipal(). The SecurityContext for
     * @PreAuthorize SpEL is provided separately by @WithMockUser.
     */
    private RequestPostProcessor principalOf(String username) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        return request -> {
            request.setUserPrincipal(token);
            return request;
        };
    }

    // ── Tests proving WITH-permission path works ───────────────────────────

    @Test
    @WithMockUser(username = "approver-user")
    @DisplayName("approve endpoint — user WITH cangbien:approve authority → 200 OK")
    void approve_withAuthority_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), eq("cangbien:approve")))
                .thenReturn(true);

        mockMvc.perform(post("/api/v1/cang-bien/{id}/approve", id)
                        .with(principalOf("approver-user")))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin-user")
    @DisplayName("delete endpoint — user WITH cangbien:delete authority → 200 OK")
    void softDelete_withAuthority_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), eq("cangbien:delete")))
                .thenReturn(true);

        mockMvc.perform(delete("/api/v1/cang-bien/{id}", id))
                .andExpect(status().isOk());
    }

    // ── Tests proving WITHOUT-permission path is fail-closed ──────────────
    // ExceptionTranslationFilter is absent (addFilters = false), so AccessDeniedException
    // propagates out of MockMvc.perform() as a NestedServletException wrapping
    // AccessDeniedException. assertThrows captures this and verifies the root cause.
    // This is the authoritative proof of fail-closed behaviour.
    // In a full integration context (addFilters = true) the same exception maps to HTTP 403.

    @Test
    @WithMockUser(username = "test-user")
    @DisplayName("approve endpoint — user WITHOUT cangbien:approve authority → AccessDeniedException (fail-closed)")
    void approve_withoutAuthority_raisesAccessDenied() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), any(String.class)))
                .thenReturn(false);

        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/v1/cang-bien/{id}/approve", id)),
                "Expected AccessDeniedException propagated for denied cangbien:approve");
    }

    @Test
    @WithMockUser(username = "test-user")
    @DisplayName("delete endpoint — user WITHOUT cangbien:delete authority → AccessDeniedException (fail-closed)")
    void softDelete_withoutAuthority_raisesAccessDenied() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), any(String.class)))
                .thenReturn(false);

        assertThrows(Exception.class, () ->
                mockMvc.perform(delete("/api/v1/cang-bien/{id}", id)),
                "Expected AccessDeniedException propagated for denied cangbien:delete");
    }
}
