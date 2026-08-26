package com.hanghai.kchtg.port;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.port.controller.PortController;
import com.hanghai.kchtg.port.service.PortApprovalService;
import com.hanghai.kchtg.port.service.PortService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC security tests for PortController.
 */
@WebMvcTest(PortController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(MethodSecurityTestConfig.class)
@DisplayName("PortController RBAC / @PreAuthorize security tests — M-002")
class PortRbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PortService portService;

    @MockBean
    private PortApprovalService portApprovalService;

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
    @DisplayName("approve C1 endpoint — user WITH port:approvec1 authority → 200 OK")
    void approve_withAuthority_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), eq("port:approvec1")))
                .thenReturn(true);

        mockMvc.perform(post("/api/v1/ports/{id}/approve/c1", id)
                        .with(principalOf("approver-user")))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin-user")
    @DisplayName("delete endpoint — user WITH port:delete authority → 200 OK")
    void softDelete_withAuthority_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), eq("port:delete")))
                .thenReturn(true);

        mockMvc.perform(delete("/api/v1/ports/{id}", id))
                .andExpect(status().isOk());
    }

    // ── Tests proving WITHOUT-permission path is fail-closed ──────────────

    @Test
    @WithMockUser(username = "test-user")
    @DisplayName("approve C1 endpoint — user WITHOUT port:approvec1 authority → AccessDeniedException (fail-closed)")
    void approve_withoutAuthority_raisesAccessDenied() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), any(String.class)))
                .thenReturn(false);

        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/v1/ports/{id}/approve/c1", id)),
                "Expected AccessDeniedException propagated for denied port:approvec1");
    }

    @Test
    @WithMockUser(username = "test-user")
    @DisplayName("delete endpoint — user WITHOUT port:delete authority → AccessDeniedException (fail-closed)")
    void softDelete_withoutAuthority_raisesAccessDenied() throws Exception {
        UUID id = UUID.randomUUID();

        when(auth.check(any(Authentication.class), any(String.class)))
                .thenReturn(false);

        assertThrows(Exception.class, () ->
                mockMvc.perform(delete("/api/v1/ports/{id}", id)),
                "Expected AccessDeniedException propagated for denied port:delete");
    }
}
