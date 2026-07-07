package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.cangben.controller.BenCangController;
import com.hanghai.kchtg.cangben.dto.bencang.BenCangResponse;
import com.hanghai.kchtg.cangben.service.BenCangApprovalService;
import com.hanghai.kchtg.cangben.service.BenCangService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller slice tests for BenCangController — security filters disabled.
 * Covers F-014/F-015/F-016/F-017/F-019 endpoints.
 */
@WebMvcTest(BenCangController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("BenCangController web MVC tests — M-002")
class BenCangControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BenCangService benCangService;

    @MockBean
    private BenCangApprovalService benCangApprovalService;

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

    /**
     * RequestPostProcessor that:
     * 1. Uses SecurityMockMvcRequestPostProcessors.authentication() to install a
     *    TestSecurityContextRepository so SecurityContextHolderFilter populates
     *    SecurityContextHolder with the test authentication.
     * 2. Sets request.setUserPrincipal(auth) so Spring MVC resolves the
     *    Authentication method parameter via request.getUserPrincipal().
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

    private BenCangResponse makeResponse(UUID id, UUID parentId) {
        return BenCangResponse.builder()
                .id(id)
                .maBen("BEN-001")
                .tenBen("Bến Cảng Demo")
                .cangBienId(parentId)
                .trangThaiHoatDong("HIEN_HANH")
                .trangThaiPheDuyet("CHO_PHE_DUYET")
                .build();
    }

    // ── GET /api/v1/ben-cang ─────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/ben-cang — returns 200 with paged list")
    void findAll_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Page<BenCangResponse> page = new PageImpl<>(List.of(makeResponse(id, parentId)));
        when(benCangService.findAll(0, 20, null)).thenReturn(page);

        mockMvc.perform(get("/api/v1/ben-cang")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].maBen").value("BEN-001"));
    }

    @Test
    @DisplayName("GET /api/v1/ben-cang — pagination params forwarded to service")
    void findAll_paginationParams_forwarded() throws Exception {
        UUID someUuid = UUID.randomUUID();
        String uuidStr = someUuid.toString();
        Page<BenCangResponse> page = new PageImpl<>(List.of());
        when(benCangService.findAll(1, 5, someUuid)).thenReturn(page);

        mockMvc.perform(get("/api/v1/ben-cang")
                        .param("page", "1")
                        .param("size", "5")
                        .param("orgUnitId", uuidStr))
                .andExpect(status().isOk());

        verify(benCangService).findAll(1, 5, someUuid);
    }

    // ── GET /api/v1/ben-cang/{id} ────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/ben-cang/{id} — returns 200 with entity")
    void getById_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        when(benCangService.getById(id)).thenReturn(makeResponse(id, parentId));

        mockMvc.perform(get("/api/v1/ben-cang/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.maBen").value("BEN-001"));
    }

    @Test
    @DisplayName("GET /api/v1/ben-cang/{id} — returns 404 when not found")
    void getById_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(benCangService.getById(id))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/ben-cang/{id}", id))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/v1/ben-cang ────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/ben-cang — returns 200 with created entity")
    void create_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        when(benCangService.create(any())).thenReturn(makeResponse(id, parentId));

        String json = String.format("""
                {
                  "maBen": "BEN-NEW",
                  "tenBen": "Bến mới",
                  "cangBienId": "%s"
                }
                """, parentId);

        mockMvc.perform(post("/api/v1/ben-cang")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.maBen").value("BEN-001"));
    }

    @Test
    @DisplayName("POST /api/v1/ben-cang — returns 400 when maBen is blank")
    void create_blankMaBen_returns400() throws Exception {
        String json = """
                {
                  "maBen": "",
                  "tenBen": "Bến thiếu mã",
                  "cangBienId": "00000000-0000-0000-0000-000000000001"
                }
                """;

        mockMvc.perform(post("/api/v1/ben-cang")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    // ── DELETE /api/v1/ben-cang/{id} ─────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/v1/ben-cang/{id} — returns 200")
    void softDelete_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/ben-cang/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(benCangService).softDelete(id);
    }

    // ── POST /api/v1/ben-cang/{id}/approve ───────────────────────────────

    @Test
    @DisplayName("POST /api/v1/ben-cang/{id}/approve — returns 200, userId from Authentication")
    void approve_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/ben-cang/{id}/approve", id)
                        .with(userPrincipal("test-approver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(benCangApprovalService).approve(id, "test-approver", null);
    }

    // ── GET /api/v1/ben-cang/{id}/history ─────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/ben-cang/{id}/history — returns 200")
    void getHistory_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(benCangApprovalService.getHistory(id))
                .thenReturn(Map.of("entityId", id.toString(), "changeHistory", List.of(),
                        "approvalLog", List.of(), "currentApprovalStatus", "CHO_PHE_DUYET",
                        "entityType", "BenCang"));

        mockMvc.perform(get("/api/v1/ben-cang/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
