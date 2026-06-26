package com.hanghai.kchtg.tai;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tai.controller.TaiCospasSarsatController;
import com.hanghai.kchtg.tai.dto.cospassarsat.CreateTaiCospasSarsatRequest;
import com.hanghai.kchtg.tai.dto.cospassarsat.TaiCospasSarsatResponse;
import com.hanghai.kchtg.tai.entity.TaiApprovalStatus;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiType;
import com.hanghai.kchtg.tai.repository.TaiRepository;
import com.hanghai.kchtg.tai.service.TaiCospasSarsatService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaiCospasSarsatController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaiCospasSarsatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaiCospasSarsatService service;

    @MockBean
    private TaiRepository taiRepository;

    @MockBean
    private com.hanghai.kchtg.accesslog.repository.AccessLogRepository accessLogRepository;

    @MockBean
    private com.hanghai.kchtg.user.repository.UserRepository userRepository;

    @MockBean
    private com.hanghai.kchtg.security.service.TokenService tokenService;

    @MockBean
    private com.hanghai.kchtg.security.service.JwtSessionService jwtSessionService;

    @MockBean
    private com.hanghai.kchtg.security.service.TokenValidationService tokenValidationService;

    @MockBean
    private com.hanghai.kchtg.security.JwtUtil jwtUtil;

    @MockBean
    private com.hanghai.kchtg.user.service.PermissionRoleService permissionRoleService;

    @MockBean
    private org.springframework.data.jpa.mapping.JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private TaiCospasSarsatResponse makeResponse() {
        return new TaiCospasSarsatResponse(
                UUID.randomUUID(), "CPS-001", "Cospas Demo", TaiType.COSPAS_SARSAT,
                new BigDecimal("406.000"), "COSPAS-SARSAT", "Vietnam",
                TaiStatus.ACTIVE, TaiApprovalStatus.APPROVED,
                UUID.randomUUID(), java.time.Instant.now(), "OK",
                null, null, null,
                java.time.Instant.now(), java.time.Instant.now());
    }

    @Test
    @DisplayName("POST /api/v1/tai/cospas-sarsat — returns 201")
    void testCreate() throws Exception {
        String json = """
                {
                  "code": "CPS-002",
                  "name": "Cospas moi",
                  "type": "COSPAS_SARSAT",
                  "frequency": "406.000",
                  "protocol": "COSPAS-SARSAT",
                  "country": "Vietnam"
                }
                """;
        when(service.create(any())).thenReturn(makeResponse());

        mockMvc.perform(post("/api/v1/tai/cospas-sarsat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Cospas Demo"));

        verify(service).create(any());
    }

    @Test
    @DisplayName("POST /api/v1/tai/cospas-sarsat — returns 400 with invalid body")
    void testCreateInvalid() throws Exception {
        mockMvc.perform(post("/api/v1/tai/cospas-sarsat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/v1/tai/cospas-sarsat/{code} — returns 200")
    void testUpdate() throws Exception {
        String json = """
                {
                  "name": "Cospas cap nhat",
                  "frequency": "406.500",
                  "protocol": "NEW",
                  "country": "Cambodia"
                }
                """;
        when(service.findByCode("CPS-001")).thenReturn(makeResponse());
        when(service.update(any(UUID.class), any())).thenReturn(makeResponse());

        mockMvc.perform(put("/api/v1/tai/cospas-sarsat/CPS-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Cospas Demo"));

        verify(service).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/tai/cospas-sarsat/{code} — returns 200")
    void testDelete() throws Exception {
        mockMvc.perform(delete("/api/v1/tai/cospas-sarsat/CPS-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).delete("CPS-001");
    }

    @Test
    @DisplayName("GET /api/v1/tai/cospas-sarsat/{code} — returns 200")
    void testFindById() throws Exception {
        when(service.findByCode("CPS-001")).thenReturn(makeResponse());

        mockMvc.perform(get("/api/v1/tai/cospas-sarsat/CPS-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Cospas Demo"));

        verify(service).findByCode("CPS-001");
    }

    @Test
    @DisplayName("GET /api/v1/tai/cospas-sarsat — returns 200 with list")
    void testFindAll() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse()));

        mockMvc.perform(get("/api/v1/tai/cospas-sarsat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        verify(service).findAll();
    }

    @Test
    @DisplayName("PUT /api/v1/tai/cospas-sarsat/{code}/approve — returns 200")
    void testApprove() throws Exception {
        when(service.approve(eq("CPS-001"), anyString(), any(UUID.class))).thenReturn(makeResponse());

        mockMvc.perform(put("/api/v1/tai/cospas-sarsat/CPS-001/approve")
                        .param("remarks", "OK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

        verify(service).approve(eq("CPS-001"), eq("OK"), any(UUID.class));
    }

    @Test
    @DisplayName("PUT /api/v1/tai/cospas-sarsat/{code}/reject — returns 200")
    void testReject() throws Exception {
        TaiCospasSarsatResponse rejectResponse = makeResponse();
        rejectResponse.setApprovalStatus(TaiApprovalStatus.REJECTED);
        when(service.reject(eq("CPS-001"), anyString(), any(UUID.class))).thenReturn(rejectResponse);

        mockMvc.perform(put("/api/v1/tai/cospas-sarsat/CPS-001/reject")
                        .param("remarks", "Ly do tu choi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));

        verify(service).reject(eq("CPS-001"), eq("Ly do tu choi"), any(UUID.class));
    }

    @Test
    @DisplayName("POST /api/v1/tai/cospas-sarsat/{code}/sync — returns 200")
    void testSync() throws Exception {
        when(service.findByCode("CPS-001")).thenReturn(makeResponse());

        mockMvc.perform(post("/api/v1/tai/cospas-sarsat/CPS-001/sync"))
                .andExpect(status().isOk());

        verify(service).syncToMapPhao(any(UUID.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/tai/cospas-sarsat/{code}/hide — returns 200")
    void testHide() throws Exception {
        when(service.findByCode("CPS-001")).thenReturn(makeResponse());

        mockMvc.perform(delete("/api/v1/tai/cospas-sarsat/CPS-001/hide"))
                .andExpect(status().isOk());

        verify(service).hideFromMapPhao(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/tai/cospas-sarsat/status/{status} — returns 200")
    void testFindByStatus() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse()));

        mockMvc.perform(get("/api/v1/tai/cospas-sarsat/status/ACTIVE"))
                .andExpect(status().isOk());

        verify(service).findAll();
    }

    @Test
    @DisplayName("GET /api/v1/tai/cospas-sarsat/count-by-status — returns 200")
    void testCountByStatus() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse()));

        mockMvc.perform(get("/api/v1/tai/cospas-sarsat/count-by-status"))
                .andExpect(status().isOk());

        verify(service).findAll();
    }
}
