package com.hanghai.kchtg.cangben;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.cangben.controller.CangBienController;
import com.hanghai.kchtg.cangben.dto.cangbien.CangBienResponse;
import com.hanghai.kchtg.cangben.service.CangBienApprovalService;
import com.hanghai.kchtg.cangben.service.CangBienService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller slice tests for CangBienController — security filters disabled.
 * Covers F-008/F-009/F-010/F-011/F-012/F-013 endpoints.
 */
@WebMvcTest(CangBienController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("CangBienController web MVC tests — M-002")
class CangBienControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CangBienService cangBienService;

    @MockBean
    private CangBienApprovalService cangBienApprovalService;

    // Security / infrastructure stubs required by @WebMvcTest context
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

    // ── helpers ─────────────────────────────────────────────────────────

    private CangBienResponse makeResponse(UUID id) {
        return CangBienResponse.builder()
                .id(id)
                .maCang("CB-001")
                .tenCang("Cảng Biển Demo")
                .tinhThanhPho("Hải Phòng")
                .viDo(new BigDecimal("20.845"))
                .kinhDo(new BigDecimal("106.688"))
                .dienTich(new BigDecimal("5000.00"))
                .trangThaiHoatDong("HIEN_HANH")
                .trangThaiPheDuyet("CHO_PHE_DUYET")
                .build();
    }

    // ── GET /api/v1/cang-bien ────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/cang-bien — returns 200 with paged list")
    void findAll_returns200WithPagedList() throws Exception {
        UUID id = UUID.randomUUID();
        Page<CangBienResponse> page = new PageImpl<>(List.of(makeResponse(id)));
        when(cangBienService.findAll(0, 20, null)).thenReturn(page);

        mockMvc.perform(get("/api/v1/cang-bien")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].maCang").value("CB-001"));

        verify(cangBienService).findAll(0, 20, null);
    }

    @Test
    @DisplayName("GET /api/v1/cang-bien — pagination params forwarded to service")
    void findAll_paginationParams_forwarded() throws Exception {
        UUID someUuid = UUID.randomUUID();
        String uuidStr = someUuid.toString();
        Page<CangBienResponse> page = new PageImpl<>(List.of());
        when(cangBienService.findAll(2, 10, someUuid)).thenReturn(page);

        mockMvc.perform(get("/api/v1/cang-bien")
                        .param("page", "2")
                        .param("size", "10")
                        .param("orgUnitId", uuidStr))
                .andExpect(status().isOk());

        verify(cangBienService).findAll(2, 10, someUuid);
    }

    // ── GET /api/v1/cang-bien/{id} ────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/cang-bien/{id} — returns 200 with entity")
    void getById_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(cangBienService.getById(id)).thenReturn(makeResponse(id));

        mockMvc.perform(get("/api/v1/cang-bien/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.maCang").value("CB-001"));
    }

    @Test
    @DisplayName("GET /api/v1/cang-bien/{id} — returns 404 when not found")
    void getById_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(cangBienService.getById(id))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("not found"));

        mockMvc.perform(get("/api/v1/cang-bien/{id}", id))
                .andExpect(status().isNotFound());
    }

    // ── POST /api/v1/cang-bien ────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/v1/cang-bien — returns 200 with created entity")
    void create_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(cangBienService.create(any())).thenReturn(makeResponse(id));

        String json = """
                {
                  "maCang": "CB-NEW",
                  "tenCang": "Cảng mới",
                  "viDo": "20.845",
                  "kinhDo": "106.688",
                  "dienTich": "5000.00"
                }
                """;

        mockMvc.perform(post("/api/v1/cang-bien")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.maCang").value("CB-001"));
    }

    @Test
    @DisplayName("POST /api/v1/cang-bien — returns 400 when maCang is blank (Bean Validation)")
    void create_blankMaCang_returns400() throws Exception {
        String json = """
                {
                  "maCang": "",
                  "tenCang": "Cảng thiếu mã"
                }
                """;

        mockMvc.perform(post("/api/v1/cang-bien")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    // ── PUT /api/v1/cang-bien ────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/v1/cang-bien — returns 200 with updated entity")
    void update_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(cangBienService.update(any())).thenReturn(makeResponse(id));

        String json = String.format("""
                {
                  "id": "%s",
                  "tenCang": "Cảng cập nhật"
                }
                """, id);

        mockMvc.perform(put("/api/v1/cang-bien")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ── DELETE /api/v1/cang-bien/{id} ─────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/v1/cang-bien/{id} — returns 200")
    void softDelete_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/cang-bien/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cangBienService).softDelete(id);
    }

    // ── POST /api/v1/cang-bien/{id}/approve ──────────────────────────────

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

    @Test
    @DisplayName("POST /api/v1/cang-bien/{id}/approve — returns 200, userId from Authentication")
    void approve_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/cang-bien/{id}/approve", id)
                        .with(userPrincipal("test-approver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cangBienApprovalService).approve(id, "test-approver", null);
    }

    // ── POST /api/v1/cang-bien/{id}/reject ──────────────────────────────

    @Test
    @DisplayName("POST /api/v1/cang-bien/{id}/reject — returns 200, userId from Authentication")
    void reject_returns200() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/cang-bien/{id}/reject", id)
                        .param("reason", "Thiếu tài liệu đầy đủ")
                        .with(userPrincipal("test-approver")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cangBienApprovalService).approve(id, "test-approver", "Thiếu tài liệu đầy đủ");
    }

    // ── GET /api/v1/cang-bien/{id}/history ────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/cang-bien/{id}/history — returns 200 with history map")
    void getHistory_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(cangBienApprovalService.getHistory(id))
                .thenReturn(Map.of("entityId", id.toString(), "changeHistory", List.of(),
                        "approvalLog", List.of(), "currentApprovalStatus", "CHO_PHE_DUYET",
                        "entityType", "CangBien"));

        mockMvc.perform(get("/api/v1/cang-bien/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(cangBienApprovalService).getHistory(id);
    }
}
