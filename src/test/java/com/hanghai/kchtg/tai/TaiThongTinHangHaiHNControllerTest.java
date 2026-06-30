package com.hanghai.kchtg.tai;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.tai.controller.TaiThongTinHangHaiHNController;
import com.hanghai.kchtg.tai.dto.hanoi_hai.TaiThongTinHangHaiHNResponse;
import com.hanghai.kchtg.tai.entity.TaiApprovalStatus;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiType;
import com.hanghai.kchtg.tai.repository.TaiThongTinHangHaiHNRepository;
import com.hanghai.kchtg.tai.service.TaiThongTinHangHaiHNService;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaiThongTinHangHaiHNController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class TaiThongTinHangHaiHNControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaiThongTinHangHaiHNService service;

    @MockBean
    private TaiThongTinHangHaiHNRepository taiRepository;

    @MockBean
    private AsyncLogAppender asyncLogAppender;

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
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private TaiThongTinHangHaiHNResponse makeResponse(String code, String name) {
        return TaiThongTinHangHaiHNResponse.builder()
                .id(UUID.randomUUID())
                .code(code)
                .name(name)
                .type(TaiType.HANOI_HAI)
                .frequency(new BigDecimal("2182.000"))
                .range(10)
                .department("VPHH-QG")
                .status(TaiStatus.ACTIVE)
                .approvalStatus(TaiApprovalStatus.APPROVED)
                .approvedBy(UUID.randomUUID())
                .approvedAt(Instant.now())
                .approvedRemarks("OK")
                .unapprovedBy(null)
                .unapprovedAt(null)
                .unapprovedRemarks(null)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/tai/thong-tin-hai-hai-hn — returns 201 with created entity")
    void testCreateValid() throws Exception {
        String json = """
                {
                  "code": "THN-002",
                  "name": "THN moi",
                  "type": "HANOI_HAI",
                  "frequency": "2182.000",
                  "range": 15,
                  "department": "VPHH-QG"
                }
                """;
        when(service.create(any())).thenReturn(makeResponse("THN-002", "THN moi"));

        mockMvc.perform(post("/api/v1/tai/thong-tin-hai-hai-hn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("THN moi"));

        verify(service).create(any());
    }

    @Test
    @DisplayName("POST /api/v1/tai/thong-tin-hai-hai-hn — returns 400 with invalid body")
    void testCreateInvalid() throws Exception {
        mockMvc.perform(post("/api/v1/tai/thong-tin-hai-hai-hn")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/v1/tai/thong-tin-hai-hai-hn/{code} — returns 200 with updated entity")
    void testUpdateValid() throws Exception {
        String json = """
                {
                  "name": "THN cap nhat",
                  "frequency": "2185.000",
                  "range": 20,
                  "department": "VPHH-MIEN-BAC"
                }
                """;
        when(service.findByCode("THN-001")).thenReturn(makeResponse("THN-001", "THN cu"));
        when(service.update(any(UUID.class), any())).thenReturn(makeResponse("THN-001", "THN cap nhat"));

        mockMvc.perform(put("/api/v1/tai/thong-tin-hai-hai-hn/THN-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("THN cap nhat"));

        verify(service).update(any(UUID.class), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/tai/thong-tin-hai-hai-hn/{code} — returns 200")
    void testDeleteValid() throws Exception {
        mockMvc.perform(delete("/api/v1/tai/thong-tin-hai-hai-hn/THN-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).delete("THN-001");
    }

    @Test
    @DisplayName("GET /api/v1/tai/thong-tin-hai-hai-hn/{code} — returns 200")
    void testFindByIdReturns200() throws Exception {
        when(service.findByCode("THN-001")).thenReturn(makeResponse("THN-001", "THN Demo"));

        mockMvc.perform(get("/api/v1/tai/thong-tin-hai-hai-hn/THN-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("THN Demo"));

        verify(service).findByCode("THN-001");
    }

    @Test
    @DisplayName("GET /api/v1/tai/thong-tin-hai-hai-hn — returns 200 with list")
    void testFindAllReturns200() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse("THN-001", "THN Demo")));

        mockMvc.perform(get("/api/v1/tai/thong-tin-hai-hai-hn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        verify(service).findAll();
    }

    @Test
    @DisplayName("PUT /api/v1/tai/thong-tin-hai-hai-hn/{code}/approve — returns 200")
    void testApproveReturns200() throws Exception {
        when(service.approve(eq("THN-001"), anyString(), any(UUID.class))).thenReturn(makeResponse("THN-001", "THN Demo"));

        mockMvc.perform(put("/api/v1/tai/thong-tin-hai-hai-hn/THN-001/approve")
                        .param("remarks", "OK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("APPROVED"));

        verify(service).approve(eq("THN-001"), eq("OK"), any(UUID.class));
    }

    @Test
    @DisplayName("PUT /api/v1/tai/thong-tin-hai-hai-hn/{code}/reject — returns 200")
    void testRejectReturns200() throws Exception {
        TaiThongTinHangHaiHNResponse rejectResponse = makeResponse("THN-001", "THN Demo");
        rejectResponse.setApprovalStatus(TaiApprovalStatus.REJECTED);
        when(service.reject(eq("THN-001"), anyString(), any(UUID.class))).thenReturn(rejectResponse);

        mockMvc.perform(put("/api/v1/tai/thong-tin-hai-hai-hn/THN-001/reject")
                        .param("remarks", "Ly do tu choi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));

        verify(service).reject(eq("THN-001"), eq("Ly do tu choi"), any(UUID.class));
    }

    @Test
    @DisplayName("POST /api/v1/tai/thong-tin-hai-hai-hn/{code}/sync — returns 200")
    void testSyncReturns200() throws Exception {
        when(service.findByCode("THN-001")).thenReturn(makeResponse("THN-001", "THN Demo"));

        mockMvc.perform(post("/api/v1/tai/thong-tin-hai-hai-hn/THN-001/sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).syncToMapPhao(any(UUID.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/tai/thong-tin-hai-hai-hn/{code}/hide — returns 200")
    void testHideReturns200() throws Exception {
        when(service.findByCode("THN-001")).thenReturn(makeResponse("THN-001", "THN Demo"));

        mockMvc.perform(delete("/api/v1/tai/thong-tin-hai-hai-hn/THN-001/hide"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).hideFromMapPhao(any(UUID.class));
    }

    @Test
    @DisplayName("GET /api/v1/tai/thong-tin-hai-hai-hn/status/{status} — returns 200")
    void testFindByStatusReturns200() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse("THN-001", "THN Demo")));

        mockMvc.perform(get("/api/v1/tai/thong-tin-hai-hai-hn/status/ACTIVE"))
                .andExpect(status().isOk());

        verify(service).findAll();
    }

    @Test
    @DisplayName("GET /api/v1/tai/thong-tin-hai-hai-hn/count-by-status — returns 200")
    void testCountByStatusReturns200() throws Exception {
        when(service.findAll()).thenReturn(List.of(makeResponse("THN-001", "THN Demo")));

        mockMvc.perform(get("/api/v1/tai/thong-tin-hai-hai-hn/count-by-status"))
                .andExpect(status().isOk());

        verify(service).findAll();
    }
}
