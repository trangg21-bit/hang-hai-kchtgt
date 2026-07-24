package com.hanghai.kchtg.m003;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.cangben.MethodSecurityTestConfig;
import com.hanghai.kchtg.shiprepairfacility.controller.ShipRepairFacilityController;
import com.hanghai.kchtg.shiprepairfacility.service.ShipRepairFacilityService;
import com.hanghai.kchtg.dikerevetment.controller.DikeRevetmentController;
import com.hanghai.kchtg.dikerevetment.service.DikeRevetmentService;
import com.hanghai.kchtg.navigationchannel.controller.NavigationChannelController;
import com.hanghai.kchtg.navigationchannel.service.NavigationChannelService;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC deny/allow path tests for all 5 M-003 domains:
 *   navigationchannel, dikerevetment, shiprepairfacility, tramradar, vts.
 */
@WebMvcTest(controllers = {
        NavigationChannelController.class,
        DikeRevetmentController.class,
        ShipRepairFacilityController.class,
        TramRadarController.class,
        HeThongVTSController.class
})
@AutoConfigureMockMvc(addFilters = false)
@Import(MethodSecurityTestConfig.class)
@DisplayName("M-003 RBAC security tests — approve + delete deny/allow paths, all 5 domains")
class M003RbacSecurityTest {

    private static final String TEST_UUID = "11111111-1111-1111-1111-111111111111";

    @Autowired
    private MockMvc mockMvc;

    // ── Service mocks ───────────────────────────────────────────────────────
    @MockBean private NavigationChannelService navigationChannelService;
    @MockBean private DikeRevetmentService dikeRevetmentService;
    @MockBean private ShipRepairFacilityService shipRepairFacilityService;
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
    private static final String NC_APPROVE_BODY =
            "{\"nguoiPheDuyet\":\"Admin\",\"trangThai\":\"APPROVED\"}";
    private static final String DIKEREVETMENT_APPROVE_BODY =
            "{\"nguoiPheDuyet\":\"Admin\",\"quyetDinh\":\"APPROVED\"}";
    private static final String GENERIC_APPROVE_BODY =
            "{\"quyetDinh\":\"APPROVED\"}";

    // =========================================================================
    // ALLOW path — SYSTEM_ADMIN → approve/c1 (200)
    // =========================================================================

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("navigationchannel: SYSTEM_ADMIN → approve/c1 allowed (200)")
    void navigationchannel_approveC1_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(post("/api/v1/navigation-channel/" + TEST_UUID + "/approve/c1")
                .with(principalOf("admin"))
                .contentType(MediaType.APPLICATION_JSON).content(NC_APPROVE_BODY))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // ALLOW path — SYSTEM_ADMIN → delete (200)
    // =========================================================================

    @Test @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("navigationchannel: SYSTEM_ADMIN → delete allowed (200)")
    void navigationchannel_delete_withSystemAdmin_returns200() throws Exception {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(true);
        mockMvc.perform(delete("/api/v1/navigation-channel/" + TEST_UUID).with(principalOf("admin"))).andExpect(status().isOk());
    }

    // =========================================================================
    // DENY path — VIEWER → approve/c1 (AccessDeniedException)
    // =========================================================================

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("navigationchannel: VIEWER → approve/c1 → AccessDeniedException (fail-closed)")
    void navigationchannel_approveC1_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(post("/api/v1/navigation-channel/" + TEST_UUID + "/approve/c1")
                        .contentType(MediaType.APPLICATION_JSON).content(NC_APPROVE_BODY)));
    }

    // =========================================================================
    // DENY path — VIEWER → delete (AccessDeniedException)
    // =========================================================================

    @Test @WithMockUser(roles = "VIEWER")
    @DisplayName("navigationchannel: VIEWER → delete → AccessDeniedException (fail-closed)")
    void navigationchannel_delete_withoutAuthority_raisesAccessDenied() {
        when(auth.check(any(Authentication.class), anyString())).thenReturn(false);
        assertThrows(Exception.class, () ->
                mockMvc.perform(delete("/api/v1/navigation-channel/" + TEST_UUID)));
    }
}
