package com.hanghai.kchtg.nhatram;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.nhatram.controller.NhaTramDenController;
import com.hanghai.kchtg.nhatram.dto.den.NhaTramDenResponse;
import com.hanghai.kchtg.nhatram.service.NhaTramDenService;
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
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NhaTramDenController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class NhaTramDenControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NhaTramDenService service;

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

    private NhaTramDenResponse makeResponse(UUID id) {
        return makeResponse(id, "Den");
    }

    private NhaTramDenResponse makeResponse(UUID id, String name) {
        return new NhaTramDenResponse(
                id, "DEN-001", name, null, 10.0, 106.0, 15.0,
                null, null, 20.0, "Mo ta", 1L, null, null, true,
                null, null, null, null, null, null, null, null);
    }

    @Test
    @DisplayName("GET /api/v1/nhatram/den — returns 200 with list")
    void testFindAll() throws Exception {
        when(service.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/nhatram/den"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        verify(service).findAll();
    }

    @Test
    @DisplayName("GET /api/v1/nhatram/den/{id} — returns 200 with entity")
    void testFindById() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.findById(id)).thenReturn(makeResponse(id));

        mockMvc.perform(get("/api/v1/nhatram/den/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Den"));

        verify(service).findById(id);
    }

    @Test
    @DisplayName("GET /api/v1/nhatram/den/{id} — returns 404 when not found")
    void testFindByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.findById(id)).thenThrow(new jakarta.persistence.EntityNotFoundException("Khong tim thay"));

        mockMvc.perform(get("/api/v1/nhatram/den/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/nhatram/den — returns 201 with created entity")
    void testCreate() throws Exception {
        String json = """
                {
                  "code": "DEN-002",
                  "name": "Den moi",
                  "type": "LIGHTHOUSE",
                  "latitude": 10.0,
                  "longitude": 106.0,
                  "lightRange": 15.0
                }
                """;
        when(service.create(any())).thenReturn(makeResponse(UUID.randomUUID(), "Den moi"));

        mockMvc.perform(post("/api/v1/nhatram/den")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Den moi"));
    }

    @Test
    @DisplayName("PUT /api/v1/nhatram/den/{id} — returns 200 with updated entity")
    void testUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        String json = """
                {
                  "name": "Den cap nhat",
                  "type": "LIGHTHOUSE",
                  "lightRange": 20.0,
                  "description": "Cap nhat"
                }
                """;
        when(service.update(eq(id), any())).thenReturn(makeResponse(id, "Den cap nhat"));

        mockMvc.perform(put("/api/v1/nhatram/den/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Den cap nhat"));
    }

    @Test
    @DisplayName("DELETE /api/v1/nhatram/den/{id} — returns 200")
    void testDelete() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/nhatram/den/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).delete(id);
    }

    @Test
    @DisplayName("POST /api/v1/nhatram/den/{id}/submit-approval — transitions status")
    void testSubmitForApproval() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(post("/api/v1/nhatram/den/{id}/submit-approval", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(service).submitForApproval(id);
    }

    @Test
    @DisplayName("POST /api/v1/nhatram/den/{id}/approve-l1 — L1 approval")
    void testApproveL1() throws Exception {
        UUID id = UUID.randomUUID();
        NhaTramDenResponse resp = makeResponse(id);
        resp.setApprovedBy(2L);
        when(service.approveL1(eq(id), anyString())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/nhatram/den/{id}/approve-l1", id)
                        .param("approverId", "user-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvedBy").value(2));

        verify(service).approveL1(id, "user-1");
    }

    @Test
    @DisplayName("POST /api/v1/nhatram/den/{id}/approve-l2 — L2 approval")
    void testApproveL2() throws Exception {
        UUID id = UUID.randomUUID();
        NhaTramDenResponse resp = makeResponse(id);
        resp.setApprovedBy(3L);
        when(service.approveL2(eq(id), anyString())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/nhatram/den/{id}/approve-l2", id)
                        .param("approverId", "user-2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.approvedBy").value(3));

        verify(service).approveL2(id, "user-2");
    }

    @Test
    @DisplayName("POST /api/v1/nhatram/den/{id}/reject — reject with reason")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.reject(eq(id), anyString(), anyString())).thenReturn(makeResponse(id));

        mockMvc.perform(post("/api/v1/nhatram/den/{id}/reject", id)
                        .param("rejectReason", "Ly do tu choi hop le")
                        .param("approverId", "user-1"))
                .andExpect(status().isOk());

        verify(service).reject(id, "Ly do tu choi hop le", "user-1");
    }
}
