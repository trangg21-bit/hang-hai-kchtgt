package com.hanghai.kchtg.tai;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.tai.controller.TaiThongTinDuyenHaiController;
import com.hanghai.kchtg.tai.dto.thongtinduyenhai.TaiThongTinDuyenHaiResponse;
import com.hanghai.kchtg.tai.entity.TaiApprovalStatus;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiType;
import com.hanghai.kchtg.tai.repository.TaiThongTinDuyenHaiRepository;
import com.hanghai.kchtg.tai.service.TaiThongTinDuyenHaiService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.PermissionRoleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaiThongTinDuyenHaiController.class)
@AutoConfigureMockMvc(addFilters = false)
class TaiThongTinDuyenHaiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaiThongTinDuyenHaiService service;

    @MockBean
    private TaiThongTinDuyenHaiRepository taiRepository;

    @MockBean
    private AccessLogRepository accessLogRepository;

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
    private PermissionRoleService permissionRoleService;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private TaiThongTinDuyenHaiResponse makeResponse() {
        return new TaiThongTinDuyenHaiResponse(
                UUID.randomUUID(), "TDH-001", "Dai Demo", TaiType.COASTAL,
                new BigDecimal("156.800"), 10, "Vietnam", "contact@test.com",
                TaiStatus.ACTIVE, TaiApprovalStatus.APPROVED,
                UUID.randomUUID(), java.time.Instant.now(), "OK",
                null, null, null,
                java.time.Instant.now(), java.time.Instant.now());
    }

    @Test
    @DisplayName("POST /api/v1/tai/thong-tin-duyen-hai — returns 201 with created entity")
    void testCreate() throws Exception {
        String json = """
                {
                  "code": "TDH-002",
                  "name": "Dai moi",
                  "type": "COASTAL",
                  "frequency": "157.000",
                  "range": 15,
                  "country": "Vietnam",
                  "contactInfo": "new@test.com"
                }
                """;
        when(service.create(any())).thenReturn(makeResponse());

        mockMvc.perform(post("/api/v1/tai/thong-tin-duyen-hai")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Dai Demo"));

        verify(service).create(any());
    }

    @Test
    @DisplayName("POST /api/v1/tai/thong-tin-duyen-hai — returns 400 with invalid body")
    void testCreateInvalid() throws Exception {
        String json = "{}";

        mockMvc.perform(post("/api/v1/tai/thong-tin-duyen-hai")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/v1/tai/thong-tin-duyen-hai/{code} — returns 200 with updated entity")
    void testUpdate() throws Exception {
        String json = """
                {
                  "name": "Dai cap nhat",
                  "frequency": "157.500",
                  "range": 20,
                  "country": "Trung Quoc",
                  "contactInfo": "updated@test.com"
                }
                """;
        when(service.findByCode("TDH-001")).thenReturn(makeResponse());
        when(service.update(any(UUID.class), any())).thenReturn(makeResponse());

        mockMvc.perform(put("/api/v1/tai/thong-tin-duyen-hai/TDH-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Dai Demo"));

        verify(service).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/tai/thong-tin-duyen-hai/{code} — returns 200")
    void testDelete() throws Exception {
        mockMvc.perform(delete("/api/v1/tai/thong-tin-duyen-hai/TDH-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).delete("TDH-001");
    }

    @Test
    @DisplayName("GET /api/v1/tai/thong-tin-duyen-hai/{code} — returns 200")
    void testFindById() throws Exception {
        when(service.findByCode("TDH-001")).thenReturn(makeResponse());

        mockMvc.perform(get("/api/v1/tai/thong-tin-duyen-hai/TDH-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Dai Demo"));

        verify(service).findByCode("TDH-001");
    }

    @Test
    @DisplayName("GET /api/v1/tai/thong-tin-duyen-hai — returns 200 with list")
    void testFindAll() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse()));

        mockMvc.perform(get("/api/v1/tai/thong-tin-duyen-hai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].name").value("Dai Demo"));

        verify(service).findAll();
    }

    @Test
    @DisplayName("PUT /api/v1/tai/thong-tin-duyen-hai/{code}/approve — returns 200")
    void testApprove() throws Exception {
        when(service.approve(eq("TDH-001"), anyString(), any(UUID.class))).thenReturn(makeResponse());

        mockMvc.perform(put("/api/v1/tai/thong-tin-duyen-hai/TDH-001/approve")
                        .param("remarks", "Phe duyet OK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

        verify(service).approve(eq("TDH-001"), eq("Phe duyet OK"), any(UUID.class));
    }

    @Test
    @DisplayName("PUT /api/v1/tai/thong-tin-duyen-hai/{code}/reject — returns 200")
    void testReject() throws Exception {
        TaiThongTinDuyenHaiResponse rejectResponse = makeResponse();
        rejectResponse.setApprovalStatus(TaiApprovalStatus.REJECTED);
        when(service.reject(eq("TDH-001"), anyString(), any(UUID.class))).thenReturn(rejectResponse);

        mockMvc.perform(put("/api/v1/tai/thong-tin-duyen-hai/TDH-001/reject")
                        .param("remarks", "Ly do tu choi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));

        verify(service).reject(eq("TDH-001"), eq("Ly do tu choi"), any(UUID.class));
    }

    @Test
    @DisplayName("POST /api/v1/tai/thong-tin-duyen-hai/{code}/sync — returns 200")
    void testSync() throws Exception {
        when(service.findByCode("TDH-001")).thenReturn(makeResponse());

        mockMvc.perform(post("/api/v1/tai/thong-tin-duyen-hai/TDH-001/sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).syncToMapPhao(any(UUID.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/tai/thong-tin-duyen-hai/{code}/hide — returns 200")
    void testHide() throws Exception {
        when(service.findByCode("TDH-001")).thenReturn(makeResponse());

        mockMvc.perform(delete("/api/v1/tai/thong-tin-duyen-hai/TDH-001/hide"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).hideFromMapPhao(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/tai/thong-tin-duyen-hai/status/{status} — returns 200")
    void testFindByStatus() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse()));

        mockMvc.perform(get("/api/v1/tai/thong-tin-duyen-hai/status/ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        verify(service).findAll();
    }

    @Test
    @DisplayName("GET /api/v1/tai/thong-tin-duyen-hai/count-by-status — returns 200")
    void testCountByStatus() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse()));

        mockMvc.perform(get("/api/v1/tai/thong-tin-duyen-hai/count-by-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        verify(service).findAll();
    }
}
