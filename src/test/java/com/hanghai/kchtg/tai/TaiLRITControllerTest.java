package com.hanghai.kchtg.tai;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.tai.controller.TaiLRITController;
import com.hanghai.kchtg.tai.dto.lrit.CreateTaiLRITRequest;
import com.hanghai.kchtg.tai.dto.lrit.TaiLRITResponse;
import com.hanghai.kchtg.tai.entity.TaiApprovalStatus;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiType;
import com.hanghai.kchtg.tai.repository.TaiRepository;
import com.hanghai.kchtg.tai.service.TaiLRITService;
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

@WebMvcTest(TaiLRITController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaiLRITControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaiLRITService service;

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

    private TaiLRITResponse makeResponse() {
        return new TaiLRITResponse(
                UUID.randomUUID(), "LRIT-001", "LRIT Demo", TaiType.LRIT,
                new BigDecimal("10.7769"), new BigDecimal("106.7009"), 50,
                TaiStatus.ACTIVE, TaiApprovalStatus.APPROVED,
                UUID.randomUUID(), java.time.Instant.now(), "OK",
                null, null, null,
                java.time.Instant.now(), java.time.Instant.now());
    }

    @Test
    @DisplayName("POST /api/v1/tai/lrit — returns 201")
    void testCreate() throws Exception {
        String json = """
                {
                  "code": "LRIT-002",
                  "name": "LRIT moi",
                  "type": "LRIT",
                  "latitude": "10.000",
                  "longitude": "106.000",
                  "range": 60
                }
                """;
        when(service.create(any())).thenReturn(makeResponse());

        mockMvc.perform(post("/api/v1/tai/lrit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("LRIT Demo"));

        verify(service).create(any());
    }

    @Test
    @DisplayName("POST /api/v1/tai/lrit — returns 400 with invalid body")
    void testCreateInvalid() throws Exception {
        mockMvc.perform(post("/api/v1/tai/lrit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/v1/tai/lrit/{code} — returns 200")
    void testUpdate() throws Exception {
        String json = """
                {
                  "name": "LRIT cap nhat",
                  "latitude": "11.000",
                  "longitude": "107.000",
                  "range": 70
                }
                """;
        when(service.findByCode("LRIT-001")).thenReturn(makeResponse());
        when(service.update(any(UUID.class), any())).thenReturn(makeResponse());

        mockMvc.perform(put("/api/v1/tai/lrit/LRIT-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("LRIT Demo"));

        verify(service).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/tai/lrit/{code} — returns 200")
    void testDelete() throws Exception {
        mockMvc.perform(delete("/api/v1/tai/lrit/LRIT-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).delete("LRIT-001");
    }

    @Test
    @DisplayName("GET /api/v1/tai/lrit/{code} — returns 200")
    void testFindById() throws Exception {
        when(service.findByCode("LRIT-001")).thenReturn(makeResponse());

        mockMvc.perform(get("/api/v1/tai/lrit/LRIT-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("LRIT Demo"));

        verify(service).findByCode("LRIT-001");
    }

    @Test
    @DisplayName("GET /api/v1/tai/lrit — returns 200 with list")
    void testFindAll() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse()));

        mockMvc.perform(get("/api/v1/tai/lrit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        verify(service).findAll();
    }

    @Test
    @DisplayName("PUT /api/v1/tai/lrit/{code}/approve — returns 200")
    void testApprove() throws Exception {
        when(service.approve(eq("LRIT-001"), anyString(), any(UUID.class))).thenReturn(makeResponse());

        mockMvc.perform(put("/api/v1/tai/lrit/LRIT-001/approve")
                        .param("remarks", "OK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

        verify(service).approve(eq("LRIT-001"), eq("OK"), any(UUID.class));
    }

    @Test
    @DisplayName("PUT /api/v1/tai/lrit/{code}/reject — returns 200")
    void testReject() throws Exception {
        TaiLRITResponse rejectResponse = makeResponse();
        rejectResponse.setApprovalStatus(TaiApprovalStatus.REJECTED);
        when(service.reject(eq("LRIT-001"), anyString(), any(UUID.class))).thenReturn(rejectResponse);

        mockMvc.perform(put("/api/v1/tai/lrit/LRIT-001/reject")
                        .param("remarks", "Ly do tu choi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));

        verify(service).reject(eq("LRIT-001"), eq("Ly do tu choi"), any(UUID.class));
    }

    @Test
    @DisplayName("POST /api/v1/tai/lrit/{code}/sync — returns 200")
    void testSync() throws Exception {
        when(service.findByCode("LRIT-001")).thenReturn(makeResponse());

        mockMvc.perform(post("/api/v1/tai/lrit/LRIT-001/sync"))
                .andExpect(status().isOk());

        verify(service).syncToMapPhao(any(UUID.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/tai/lrit/{code}/hide — returns 200")
    void testHide() throws Exception {
        when(service.findByCode("LRIT-001")).thenReturn(makeResponse());

        mockMvc.perform(delete("/api/v1/tai/lrit/LRIT-001/hide"))
                .andExpect(status().isOk());

        verify(service).hideFromMapPhao(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/tai/lrit/status/{status} — returns 200")
    void testFindByStatus() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse()));

        mockMvc.perform(get("/api/v1/tai/lrit/status/ACTIVE"))
                .andExpect(status().isOk());

        verify(service).findAll();
    }

    @Test
    @DisplayName("GET /api/v1/tai/lrit/count-by-status — returns 200")
    void testCountByStatus() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse()));

        mockMvc.perform(get("/api/v1/tai/lrit/count-by-status"))
                .andExpect(status().isOk());

        verify(service).findAll();
    }
}
