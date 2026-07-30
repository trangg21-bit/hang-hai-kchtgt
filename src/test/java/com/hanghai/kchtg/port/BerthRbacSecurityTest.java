package com.hanghai.kchtg.port;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.port.controller.BerthController;
import com.hanghai.kchtg.port.service.BerthApprovalService;
import com.hanghai.kchtg.port.service.BerthService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC security tests for BerthController.
 */
@WebMvcTest(BerthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(MethodSecurityTestConfig.class)
@DisplayName("BerthController RBAC / @PreAuthorize security tests — M-002")
class BerthRbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BerthService berthService;

    @MockBean
    private BerthApprovalService berthApprovalService;

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
    private AdminAuditLogRepository adminAuditLogRepository;

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
    @DisplayName("approve endpoint — user WITH berth:approve authority → 200 OK")
    void approve_withAuthority_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), eq("berth:approve")))
                .thenReturn(true);

        mockMvc.perform(post("/api/v1/berths/{id}/approve", id)
                        .with(principalOf("approver-user")))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin-user")
    @DisplayName("delete endpoint — user WITH berth:delete authority → 200 OK")
    void softDelete_withAuthority_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), eq("berth:delete")))
                .thenReturn(true);

        mockMvc.perform(delete("/api/v1/berths/{id}", id))
                .andExpect(status().isOk());
    }

    // ── Tests proving WITHOUT-permission path is fail-closed ──────────────

    @Test
    @WithMockUser(username = "test-user")
    @DisplayName("approve endpoint — user WITHOUT berth:approve authority → AccessDeniedException (fail-closed)")
    void approve_withoutAuthority_throwsException() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), any(String.class)))
                .thenReturn(false);

        Exception thrown = assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/v1/berths/{id}/approve", id)),
                "Expected AccessDeniedException propagated for denied berth:approve");

        // Verify the root cause is AccessDeniedException
        Throwable cause = thrown;
        boolean foundAccessDenied = false;
        while (cause != null) {
            if (cause instanceof AccessDeniedException) {
                foundAccessDenied = true;
                break;
            }
            cause = cause.getCause();
        }
        assertTrue(foundAccessDenied,
                "Expected AccessDeniedException in cause chain but got: " + thrown.getClass());
    }

    @Test
    @WithMockUser(username = "test-user")
    @DisplayName("delete endpoint — user WITHOUT berth:delete authority → AccessDeniedException (fail-closed)")
    void softDelete_withoutAuthority_throwsException() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), any(String.class)))
                .thenReturn(false);

        Exception thrown = assertThrows(Exception.class, () ->
                mockMvc.perform(delete("/api/v1/berths/{id}", id)),
                "Expected AccessDeniedException propagated for denied berth:delete");

        // Verify the root cause is AccessDeniedException
        Throwable cause = thrown;
        boolean foundAccessDenied = false;
        while (cause != null) {
            if (cause instanceof AccessDeniedException) {
                foundAccessDenied = true;
                break;
            }
            cause = cause.getCause();
        }
        assertTrue(foundAccessDenied,
                "Expected AccessDeniedException in cause chain but got: " + thrown.getClass());
    }
}
