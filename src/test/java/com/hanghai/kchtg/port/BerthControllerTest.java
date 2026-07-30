package com.hanghai.kchtg.port;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.controller.BerthController;
import com.hanghai.kchtg.port.dto.berth.BerthResponse;
import com.hanghai.kchtg.port.service.BerthApprovalService;
import com.hanghai.kchtg.port.service.BerthService;
import com.hanghai.kchtg.security.JwtUtil;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Controller slice tests for BerthController — security filters disabled.
 * Covers F-014/F-015/F-016/F-017/F-019 endpoints.
 */
@WebMvcTest(BerthController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("BerthController web MVC tests — M-002")
class BerthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BerthService berthService;

    @MockBean
    private BerthApprovalService berthApprovalService;

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
     * RequestPostProcessor stubs
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

    private BerthResponse makeResponse(UUID id, UUID parentId) {
        return BerthResponse.builder()
                .id(id)
                .berthCode("BEN-001")
                .berthName("Bến Cảng Demo")
                .portId(parentId)
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();
    }

    // ── GET /api/v1/berths ─────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/berths — returns 200 with paged list")
    void findAll_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        Page<BerthResponse> page = new PageImpl<>(List.of(makeResponse(id, parentId)));
        when(berthService.findAll(0, 20, null, null, null, null, null, null, null, null, null)).thenReturn(page);

        mockMvc.perform(get("/api/v1/berths")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].berthCode").value("BEN-001"));
    }

    @Test
    @DisplayName("GET /api/v1/berths — pagination params forwarded to service")
    void findAll_paginationParams_forwarded() throws Exception {
        UUID someUuid = UUID.randomUUID();
        String uuidStr = someUuid.toString();
        Page<BerthResponse> page = new PageImpl<>(List.of());
        when(berthService.findAll(1, 5, someUuid, null, null, null, null, null, null, null, null)).thenReturn(page);

        mockMvc.perform(get("/api/v1/berths")
                        .param("page", "1")
                        .param("size", "5")
                        .param("orgUnitId", uuidStr))
                .andExpect(status().isOk());

        verify(berthService).findAll(1, 5, someUuid, null, null, null, null, null, null, null, null);
    }

    // ── GET /api/v1/berths/{id} ────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/berths/{id} — returns 200 with entity")
    void getById_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        when(berthService.getById(id)).thenReturn(makeResponse(id, parentId));

        mockMvc.perform(get("/api/v1/berths/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.berthCode").value("BEN-001"));
    }

    @Test
    @DisplayName("GET /api/v1/berths/{id} — returns 404 when not found")
    void getById_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(berthService.getById(id))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/berths/{id}", id))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/v1/berths ────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/berths — returns 200 with created entity")
    void create_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        when(berthService.create(any())).thenReturn(makeResponse(id, parentId));

        String json = String.format("""
                {
                  "berthCode": "BEN-NEW",
                  "berthName": "Bến mới",
                  "portId": "%s"
                }
                """, parentId);

        mockMvc.perform(post("/api/v1/berths")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.berthCode").value("BEN-001"));
    }

    @Test
    @DisplayName("POST /api/v1/berths — returns 400 when berthCode is blank")
    void create_blankBerthCode_returns400() throws Exception {
        String json = """
                {
                  "berthCode": "",
                  "berthName": "Bến thiếu mã",
                  "portId": "00000000-0000-0000-0000-000000000001"
                }
                """;

        mockMvc.perform(post("/api/v1/berths")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    // ── DELETE /api/v1/berths/{id} ─────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/v1/berths/{id} — returns 200")
    void softDelete_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/berths/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(berthService).softDelete(id);
    }

    // ── POST /api/v1/berths/{id}/approve ───────────────────────────────

    @Test
    @DisplayName("POST /api/v1/berths/{id}/approve — returns 200, userId from Authentication")
    void approve_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/berths/{id}/approve", id)
                        .with(userPrincipal("test-approver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(berthApprovalService).approve(id, "test-approver", null);
    }

    // ── GET /api/v1/berths/{id}/history ─────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/berths/{id}/history — returns 200")
    void getHistory_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(berthApprovalService.getHistory(id))
                .thenReturn(Map.of("entityId", id.toString(), "changeHistory", List.of(),
                        "approvalLog", List.of(), "currentApprovalStatus", "PENDING",
                        "entityType", "Berth"));

        mockMvc.perform(get("/api/v1/berths/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
