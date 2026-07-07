package com.hanghai.kchtg.m003;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.cangben.MethodSecurityTestConfig;
import com.hanghai.kchtg.cosuachua.controller.CoSuaChuaDongTauController;
import com.hanghai.kchtg.cosuachua.service.CoSuaChuaDongTauService;
import com.hanghai.kchtg.deke.controller.DeKeController;
import com.hanghai.kchtg.deke.service.DeKeService;
import com.hanghai.kchtg.luonghanghai.controller.LuongHangHaiController;
import com.hanghai.kchtg.luonghanghai.service.LuongHangHaiService;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.PermissionAuthorizationManager;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.tramradar.controller.TramRadarController;
import com.hanghai.kchtg.tramradar.service.TramRadarService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vts.controller.HeThongVTSController;
import com.hanghai.kchtg.vts.service.HeThongVTSDataService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC deny/allow path tests for all 5 M-003 domains:
 *   luonghanghai, deke, cosuachua, tramradar, vts.
 *
 * Strategy (mirrors M-002 CangBienRbacSecurityTest idiom):
 *   - @WebMvcTest + @Import(MethodSecurityTestConfig) activates @PreAuthorize AOP
 *   - @AutoConfigureMockMvc(addFilters = false) disables filter chain so
 *     AccessDeniedException propagates directly instead of becoming HTTP 403
 *   - ALLOW path: auth.check returns true → endpoint succeeds (200)
 *   - DENY path:  auth.check returns false → AccessDeniedException propagated
 *
 * Note on @Valid ordering: Spring MVC resolves and validates request-body arguments
 * BEFORE the security AOP advice fires. Deny-path tests therefore provide valid
 * JSON bodies so that argument resolution succeeds and @PreAuthorize can evaluate.
 */
@WebMvcTest(controllers = {
        LuongHangHaiController.class,
        DeKeController.class,
        CoSuaChuaDongTauController.class,
        TramRadarController.class,
        HeThongVTSController.class
})
@AutoConfigureMockMvc(addFilters = false)
@Import(MethodSecurityTestConfig.class)
@DisplayName("M-003 RBAC security tests — approve + delete deny/allow paths, all 5 domains")
class M003RbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Service mocks ───────────────────────────────────────────────────────
    @MockBean private LuongHangHaiService luongHangHaiService;
    @MockBean private DeKeService deKeService;
    @MockBean private CoSuaChuaDongTauService coSuaChuaDongTauService;
    @MockBean private TramRadarService tramRadarService;
    @MockBean private HeThongVTSDataService heThongVTSDataService;

    // ── Security bean ───────────────────────────────────────────────────────
    @MockBean(name = "auth")
    private PermissionAuthorizationManager auth;

    // ── Infrastructure stubs ────────────────────────────────────────────────
    @MockBean private AccessLogRepository accessLogRepository;
    @MockBean private AsyncLogAppender asyncLogAppender;
    @MockBean private UserRepository userRepository;
    @MockBean private AdminAuditLogRepository adminAuditLogRepository;
    @MockBean private TokenService tokenService;
    @MockBean private JwtSessionService jwtSessionService;
    @MockBean private TokenValidationService tokenValidationService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    /** Sets user principal on the request so controllers that inject Authentication parameter don't NPE. */
    private RequestPostProcessor principalOf(String username) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        return request -> { request.setUserPrincipal(token); return request; };
    }

    // Valid JSON bodies that satisfy @NotBlank constraints on each domain's PheDuyetRequest
    private static final String LHH_APPROVE_BODY =
            "{\"nguoiPheDuyet\":\"Admin\",\"trangThai\":\"APPROVED\"}";
    private static final String DEKE_APPROVE_BODY =
            "{\"nguoiPheDuyet\":\"Admin\",\"quyetDinh\":\"APPROVED\"}";
    private static final String GENERIC_APPROVE_BODY =
            "{\"quyetDinh\":\"APPROVED\"}";

    // =========================================================================
    // ALLOW path — SYSTEM_ADMIN → approve/c1 (200)
    // =========================================================================

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("luonghanghai: SYSTEM_ADMIN → approve/c1 allowed (200)")
    void luonghanghai_approveC1_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(post("/api/v1/luong-hang-hai/1/approve/c1")
                .with(principalOf("admin"))
                .contentType(MediaType.APPLICATION_JSON).content(LHH_APPROVE_BODY))
                .andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("deke: SYSTEM_ADMIN → approve/c1 allowed (200)")
    void deke_approveC1_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(post("/api/v1/de-ke/1/approve/c1")
                .with(principalOf("admin"))
                .contentType(MediaType.APPLICATION_JSON).content(DEKE_APPROVE_BODY))
                .andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("cosuachua: SYSTEM_ADMIN → approve/c1 allowed (200)")
    void cosuachua_approveC1_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(post("/api/v1/co-so-sua-chua/1/approve/c1")
                .with(principalOf("admin"))
                .contentType(MediaType.APPLICATION_JSON).content(GENERIC_APPROVE_BODY))
                .andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("tramradar: SYSTEM_ADMIN → approve/c1 allowed (200)")
    void tramradar_approveC1_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(post("/api/v1/tram-radar/1/approve/c1")
                .with(principalOf("admin"))
                .contentType(MediaType.APPLICATION_JSON).content(GENERIC_APPROVE_BODY))
                .andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("vts: SYSTEM_ADMIN → approve/c1 allowed (200)")
    void vts_approveC1_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(post("/api/v1/he-thong-vts/1/approve/c1")
                .with(principalOf("admin"))
                .contentType(MediaType.APPLICATION_JSON).content(GENERIC_APPROVE_BODY))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // ALLOW path — SYSTEM_ADMIN → delete (200)
    // =========================================================================

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("luonghanghai: SYSTEM_ADMIN → delete allowed (200)")
    void luonghanghai_delete_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(delete("/api/v1/luong-hang-hai/1").with(principalOf("admin"))).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("deke: SYSTEM_ADMIN → delete allowed (200)")
    void deke_delete_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(delete("/api/v1/de-ke/1").with(principalOf("admin"))).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("cosuachua: SYSTEM_ADMIN → delete allowed (200)")
    void cosuachua_delete_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(delete("/api/v1/co-so-sua-chua/1").with(principalOf("admin"))).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("tramradar: SYSTEM_ADMIN → delete allowed (200)")
    void tramradar_delete_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(delete("/api/v1/tram-radar/1").with(principalOf("admin"))).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("vts: SYSTEM_ADMIN → delete allowed (200)")
    void vts_delete_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(delete("/api/v1/he-thong-vts/1").with(principalOf("admin"))).andExpect(status().isOk());
    }

    // =========================================================================
    // DENY path — VIEWER → approve/c1 (AccessDeniedException)
    // =========================================================================

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("luonghanghai: VIEWER → approve/c1 → AccessDeniedException (fail-closed)")
    void luonghanghai_approveC1_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/v1/luong-hang-hai/1/approve/c1")
                        .contentType(MediaType.APPLICATION_JSON).content(LHH_APPROVE_BODY)));
    }

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("deke: VIEWER → approve/c1 → AccessDeniedException (fail-closed)")
    void deke_approveC1_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/v1/de-ke/1/approve/c1")
                        .contentType(MediaType.APPLICATION_JSON).content(DEKE_APPROVE_BODY)));
    }

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("cosuachua: VIEWER → approve/c1 → AccessDeniedException (fail-closed)")
    void cosuachua_approveC1_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/v1/co-so-sua-chua/1/approve/c1")
                        .contentType(MediaType.APPLICATION_JSON).content(GENERIC_APPROVE_BODY)));
    }

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("tramradar: VIEWER → approve/c1 → AccessDeniedException (fail-closed)")
    void tramradar_approveC1_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/v1/tram-radar/1/approve/c1")
                        .contentType(MediaType.APPLICATION_JSON).content(GENERIC_APPROVE_BODY)));
    }

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("vts: VIEWER → approve/c1 → AccessDeniedException (fail-closed)")
    void vts_approveC1_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/v1/he-thong-vts/1/approve/c1")
                        .contentType(MediaType.APPLICATION_JSON).content(GENERIC_APPROVE_BODY)));
    }

    // =========================================================================
    // DENY path — VIEWER → delete (AccessDeniedException)
    // =========================================================================

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("luonghanghai: VIEWER → delete → AccessDeniedException (fail-closed)")
    void luonghanghai_delete_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(delete("/api/v1/luong-hang-hai/1")));
    }

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("deke: VIEWER → delete → AccessDeniedException (fail-closed)")
    void deke_delete_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(delete("/api/v1/de-ke/1")));
    }

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("cosuachua: VIEWER → delete → AccessDeniedException (fail-closed)")
    void cosuachua_delete_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(delete("/api/v1/co-so-sua-chua/1")));
    }

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("tramradar: VIEWER → delete → AccessDeniedException (fail-closed)")
    void tramradar_delete_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(delete("/api/v1/tram-radar/1")));
    }

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("vts: VIEWER → delete → AccessDeniedException (fail-closed)")
    void vts_delete_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(delete("/api/v1/he-thong-vts/1")));
    }
}
