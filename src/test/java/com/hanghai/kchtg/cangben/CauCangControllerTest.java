package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.cangben.controller.CauCangController;
import com.hanghai.kchtg.cangben.dto.caucang.CauCangResponse;
import com.hanghai.kchtg.cangben.service.CauCangApprovalService;
import com.hanghai.kchtg.cangben.service.CauCangService;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller slice tests for CauCangController — security filters disabled.
 * Covers F-020 through F-025 endpoints + INT-003 (change history validation).
 */
@WebMvcTest(CauCangController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("CauCangController web MVC tests — M-002")
class CauCangControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CauCangService cauCangService;

    @MockBean
    private CauCangApprovalService cauCangApprovalService;

    // Security / infrastructure stubs required by @WebMvcTest context
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

    // ── helpers ─────────────────────────────────────────────────────────

    private CauCangResponse makeResponse(UUID id) {
        return CauCangResponse.builder()
                .id(id)
                .maCau("CAU-001")
                .tenCau("Cầu Cảng Demo")
                .chieuDai(new BigDecimal("200.00"))
                .taiTrong(new BigDecimal("50000.00"))
                .trangThaiHoatDong("HIEN_HANH")
                .trangThaiPheDuyet("CHO_PHE_DUYET")
                .build();
    }

    /**
     * RequestPostProcessor that:
     * 1. Uses SecurityMockMvcRequestPostProcessors.authentication() to install a
     *    TestSecurityContextRepository on the request — SecurityContextHolderFilter
     *    reads from this repository and populates SecurityContextHolder, making
     *    @PreAuthorize SpEL evaluate with a non-null authentication.
     * 2. Calls request.setUserPrincipal(auth) so Spring MVC's
     *    ServletRequestMethodArgumentResolver can resolve the Authentication
     *    method parameter via request.getUserPrincipal().
     */
    private RequestPostProcessor userPrincipal(String username) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        RequestPostProcessor securityCtxProcessor = SecurityMockMvcRequestPostProcessors.authentication(auth);
        return request -> {
            request = securityCtxProcessor.postProcessRequest(request);
            request.setUserPrincipal(auth);
            return request;
        };
    }

    // ── GET /api/v1/cau-cang ────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/cau-cang — returns 200 with paged list")
    void findAll_returns200WithPagedList() throws Exception {
        UUID id = UUID.randomUUID();
        Page<CauCangResponse> page = new PageImpl<>(List.of(makeResponse(id)));
        when(cauCangService.findAll(0, 20, null)).thenReturn(page);

        mockMvc.perform(get("/api/v1/cau-cang")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].maCau").value("CAU-001"));

        verify(cauCangService).findAll(0, 20, null);
    }

    // ── GET /api/v1/cau-cang/{id} ────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/cau-cang/{id} — returns 200 with entity")
    void getById_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(cauCangService.getById(id)).thenReturn(makeResponse(id));

        mockMvc.perform(get("/api/v1/cau-cang/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.maCau").value("CAU-001"));

        verify(cauCangService).getById(id);
    }

    // ── POST /api/v1/cau-cang/{id}/approve ──────────────────────────────

    @Test
    @DisplayName("POST /api/v1/cau-cang/{id}/approve — returns 200, userId from Authentication")
    void approve_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/cau-cang/{id}/approve", id)
                        .with(userPrincipal("test-approver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cauCangApprovalService).approve(id, "test-approver", null);
    }

    // ── POST /api/v1/cau-cang/{id}/reject ──────────────────────────────

    @Test
    @DisplayName("POST /api/v1/cau-cang/{id}/reject — reason >= 10 chars returns 200")
    void reject_validReason_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/cau-cang/{id}/reject", id)
                        .param("reason", "Không đủ tài liệu hợp lệ")
                        .with(userPrincipal("test-approver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cauCangApprovalService).approve(id, "test-approver", "Không đủ tài liệu hợp lệ");
    }

    @Test
    @DisplayName("POST /api/v1/cau-cang/{id}/reject — reason < 10 chars returns 400 Bad Request")
    void reject_tooShortReason_returns400() throws Exception {
        UUID id = UUID.randomUUID();

        // reason = "Too short" has exactly 9 characters, violates @Size(min=10)
        mockMvc.perform(post("/api/v1/cau-cang/{id}/reject", id)
                        .param("reason", "Too short")
                        .with(userPrincipal("test-approver")))
                .andExpect(status().isBadRequest());
    }

    // ── GET /api/v1/cau-cang/{id}/history ────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/cau-cang/{id}/history — returns 200 with history map")
    void getHistory_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(cauCangApprovalService.getHistory(id))
                .thenReturn(Map.of("entityId", id.toString(), "changeHistory", List.of(),
                        "approvalLog", List.of(), "currentApprovalStatus", "CHO_PHE_DUYET",
                        "entityType", "CauCang"));

        mockMvc.perform(get("/api/v1/cau-cang/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cauCangApprovalService).getHistory(id);
    }
}
