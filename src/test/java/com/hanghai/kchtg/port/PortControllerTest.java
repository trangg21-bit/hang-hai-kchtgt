package com.hanghai.kchtg.port;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.controller.PortController;
import com.hanghai.kchtg.port.dto.port.PortResponse;
import com.hanghai.kchtg.port.service.PortApprovalService;
import com.hanghai.kchtg.port.service.PortService;
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

import java.math.BigDecimal;
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
 * Controller slice tests for PortController — security filters disabled.
 * Covers F-008/F-009/F-010/F-011/F-012/F-013 endpoints.
 */
@WebMvcTest(PortController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("PortController web MVC tests — M-002")
class PortControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PortService portService;

    @MockBean
    private PortApprovalService portApprovalService;

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

    private PortResponse makeResponse(UUID id) {
        return PortResponse.builder()
                .id(id)
                .portCode("CB-001")
                .portName("Cảng Biển Demo")
                .provinceId(1)
                .area(new BigDecimal("5000.00"))
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .approvalStatus(ApprovalStatus.PENDING)
                .build();
    }

    // ── GET /api/v1/ports ────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/ports — returns 200 with paged list")
    void findAll_returns200WithPagedList() throws Exception {
        UUID id = UUID.randomUUID();
        Page<PortResponse> page = new PageImpl<>(List.of(makeResponse(id)));
        when(portService.findAll(0, 20, null, null, null, null, null, null, null)).thenReturn(page);

        mockMvc.perform(get("/api/v1/ports")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].portCode").value("CB-001"));

        verify(portService).findAll(0, 20, null, null, null, null, null, null, null);
    }

    @Test
    @DisplayName("GET /api/v1/ports — pagination params forwarded to service")
    void findAll_paginationParams_forwarded() throws Exception {
        UUID someUuid = UUID.randomUUID();
        String uuidStr = someUuid.toString();
        Page<PortResponse> page = new PageImpl<>(List.of());
        when(portService.findAll(2, 10, someUuid, null, null, null, null, null, null)).thenReturn(page);

        mockMvc.perform(get("/api/v1/ports")
                        .param("page", "2")
                        .param("size", "10")
                        .param("orgUnitId", uuidStr))
                .andExpect(status().isOk());

        verify(portService).findAll(2, 10, someUuid, null, null, null, null, null, null);
    }

    // ── GET /api/v1/ports/{id} ────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/ports/{id} — returns 200 with entity")
    void getById_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(portService.getById(id)).thenReturn(makeResponse(id));

        mockMvc.perform(get("/api/v1/ports/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.portCode").value("CB-001"));
    }

    @Test
    @DisplayName("GET /api/v1/ports/{id} — returns 404 when not found")
    void getById_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(portService.getById(id))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/ports/{id}", id))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/v1/ports ────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/ports — returns 200 with created entity")
    void create_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(portService.create(any())).thenReturn(makeResponse(id));

        String json = """
                {
                  "portCode": "CB-NEW",
                  "portName": "Cảng mới",
                  "area": "5000.00"
                }
                """;

        mockMvc.perform(post("/api/v1/ports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.portCode").value("CB-001"));
    }

    @Test
    @DisplayName("POST /api/v1/ports — returns 400 when portCode is blank (Bean Validation)")
    void create_blankPortCode_returns400() throws Exception {
        String json = """
                {
                  "portCode": "",
                  "portName": "Cảng thiếu mã"
                }
                """;

        mockMvc.perform(post("/api/v1/ports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    // ── PUT /api/v1/ports ────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/v1/ports — returns 200 with updated entity")
    void update_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(portService.update(any())).thenReturn(makeResponse(id));

        String json = String.format("""
                {
                  "id": "%s",
                  "portName": "Cảng cập nhật"
                }
                """, id);

        mockMvc.perform(put("/api/v1/ports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ── DELETE /api/v1/ports/{id} ─────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/v1/ports/{id} — returns 200")
    void softDelete_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/ports/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(portService).softDelete(id);
    }

    // ── POST /api/v1/ports/{id}/approve ──────────────────────────────

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

    @Test
    @DisplayName("POST /api/v1/ports/{id}/approve — returns 200, userId from Authentication")
    void approve_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/ports/{id}/approve", id)
                        .with(userPrincipal("test-approver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(portApprovalService).approve(id, "test-approver", null);
    }

    // ── POST /api/v1/ports/{id}/reject ──────────────────────────────

    @Test
    @DisplayName("POST /api/v1/ports/{id}/reject — returns 200, userId from Authentication")
    void reject_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/ports/{id}/reject", id)
                        .param("reason", "Thiếu tài liệu đầy đủ")
                        .with(userPrincipal("test-approver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(portApprovalService).approve(id, "test-approver", "Thiếu tài liệu đầy đủ");
    }

    // ── GET /api/v1/ports/{id}/history ────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/ports/{id}/history — returns 200 with history map")
    void getHistory_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(portApprovalService.getHistory(id))
                .thenReturn(Map.of("entityId", id.toString(), "changeHistory", List.of(),
                        "approvalLog", List.of(), "currentApprovalStatus", "PENDING",
                        "entityType", "Port"));

        mockMvc.perform(get("/api/v1/ports/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(portApprovalService).getHistory(id);
    }
}
