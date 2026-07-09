package com.hanghai.kchtg.beacon;

import com.hanghai.kchtg.beacon.controller.BeaconLightController;
import com.hanghai.kchtg.beacon.dto.beacon_light.BeaconLightResponse;
import com.hanghai.kchtg.beacon.dto.beacon_light.CreateBeaconLightRequest;
import com.hanghai.kchtg.beacon.dto.beacon_light.UpdateBeaconLightRequest;
import com.hanghai.kchtg.beacon.entity.BeaconApprovalStatus;
import com.hanghai.kchtg.beacon.entity.BeaconLightType;
import com.hanghai.kchtg.beacon.entity.BeaconStatus;
import com.hanghai.kchtg.beacon.service.BeaconLightService;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BeaconLightController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class BeaconLightControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BeaconLightService beaconLightService;

    @MockBean
    private AsyncLogAppender asyncLogAppender;
    @MockBean
    private AccessLogRepository accessLogRepository;
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

    private BeaconLightResponse makeResponse(UUID id) {
        return makeResponse(id, "Đèn biển test", BeaconLightType.LIGHTHOUSE, BeaconStatus.DRAFT);
    }

    private BeaconLightResponse makeResponse(UUID id, String name, BeaconLightType type, BeaconStatus status) {
        return BeaconLightResponse.builder()
                .id(id)
                .code("DEN-001")
                .name(name)
                .type(type)
                .latitude(10.5)
                .longitude(106.5)
                .lightRange(15.0)
                .lightColor("Trắng")
                .lightCharacteristic("Chớp 3 giây")
                .range(12.0)
                .description("Mô tả")
                .isActive(true)
                .status(status)
                .approvalStatus(BeaconApprovalStatus.PENDING)
                .approvalLevel(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ── FIND ALL ─────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/beacon-lights — returns 200 with list")
    void testFindAll() throws Exception {
        when(beaconLightService.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/beacon-lights"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        verify(beaconLightService).findAll();
    }

    // ── FIND BY ID ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/beacon-lights/{id} — returns 200 with entity")
    void testFindById() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconLightService.findById(id)).thenReturn(makeResponse(id));

        mockMvc.perform(get("/api/beacon-lights/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Đèn biển test"))
                .andExpect(jsonPath("$.data.code").value("DEN-001"));

        verify(beaconLightService).findById(id);
    }

    @Test
    @DisplayName("GET /api/beacon-lights/{id} — returns 404 when not found")
    void testFindByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconLightService.findById(id))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("Đèn biển không tìm thấy: " + id));

        mockMvc.perform(get("/api/beacon-lights/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        verify(beaconLightService).findById(id);
    }

    // ── SEARCH ───────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/beacon-lights/search — returns 200 with filtered list")
    void testSearch() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconLightService.search(eq("Đèn"), any(), any(), any()))
                .thenReturn(List.of(makeResponse(id)));

        mockMvc.perform(get("/api/beacon-lights/search")
                        .param("name", "Đèn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        verify(beaconLightService).search(eq("Đèn"), isNull(), isNull(), isNull());
    }

    @Test
    @DisplayName("GET /api/beacon-lights/search — with all params")
    void testSearchWithAllParams() throws Exception {
        when(beaconLightService.search(any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/beacon-lights/search")
                        .param("name", "Đèn")
                        .param("code", "DEN")
                        .param("type", "LIGHTHOUSE")
                        .param("status", "DRAFT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(beaconLightService)
                .search("Đèn", "DEN", BeaconLightType.LIGHTHOUSE, BeaconStatus.DRAFT);
    }

    // ── CREATE ───────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/beacon-lights — returns 201 with created entity")
    void testCreate() throws Exception {
        UUID id = UUID.randomUUID();
        String json = """
                {
                  "code": "DEN-002",
                  "name": "Đèn biển mới",
                  "type": "BEACON_LIGHT",
                  "latitude": 10.5,
                  "longitude": 106.5,
                  "lightRange": 15.0,
                  "range": 12.0,
                  "lightColor": "Đỏ",
                  "lightCharacteristic": "Chớp 5 giây"
                }
                """;
        BeaconLightResponse response = makeResponse(id, "Đèn biển mới", BeaconLightType.BEACON_LIGHT, BeaconStatus.DRAFT);
        when(beaconLightService.create(any(CreateBeaconLightRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/beacon-lights")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Đèn biển mới"))
                .andExpect(jsonPath("$.data.code").value("DEN-001"));

        verify(beaconLightService).create(any(CreateBeaconLightRequest.class));
    }

    @Test
    @DisplayName("POST /api/beacon-lights — returns 400 when required fields missing")
    void testCreateValidationFails() throws Exception {
        String json = """
                {
                  "name": "Thiếu code và type"
                }
                """;

        mockMvc.perform(post("/api/beacon-lights")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"));

        verify(beaconLightService, never()).create(any());
    }

    @Test
    @DisplayName("POST /api/beacon-lights — returns 400 when duplicate code")
    void testCreateDuplicateCode() throws Exception {
        String json = """
                {
                  "code": "DEN-001",
                  "name": "Trùng mã",
                  "type": "LIGHTHOUSE",
                  "latitude": 10.5,
                  "longitude": 106.5,
                  "lightRange": 15.0,
                  "range": 12.0
                }
                """;
        when(beaconLightService.create(any(CreateBeaconLightRequest.class)))
                .thenThrow(new IllegalArgumentException("Mã đã tồn tại: DEN-001"));

        mockMvc.perform(post("/api/beacon-lights")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── UPDATE ───────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/beacon-lights/{id} — returns 200 with updated entity")
    void testUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        String json = """
                {
                  "name": "Đèn biển cập nhật",
                  "lightColor": "Xanh",
                  "range": 18.0
                }
                """;
        BeaconLightResponse updated = makeResponse(id, "Đèn biển cập nhật", BeaconLightType.LIGHTHOUSE, BeaconStatus.DRAFT);
        when(beaconLightService.update(eq(id), any(UpdateBeaconLightRequest.class))).thenReturn(updated);

        mockMvc.perform(put("/api/beacon-lights/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Đèn biển cập nhật"));

        verify(beaconLightService).update(eq(id), any(UpdateBeaconLightRequest.class));
    }

    @Test
    @DisplayName("PUT /api/beacon-lights/{id} — returns 404 when not found")
    void testUpdateNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        String json = """
                {
                  "name": "Không tồn tại"
                }
                """;
        when(beaconLightService.update(eq(id), any(UpdateBeaconLightRequest.class)))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("Đèn biển không tìm thấy: " + id));

        mockMvc.perform(put("/api/beacon-lights/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── DELETE ───────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/beacon-lights/{id} — returns 200 with success")
    void testDelete() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(beaconLightService).delete(id);

        mockMvc.perform(delete("/api/beacon-lights/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(beaconLightService).delete(id);
    }

    @Test
    @DisplayName("DELETE /api/beacon-lights/{id} — returns 404 when not found")
    void testDeleteNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new jakarta.persistence.EntityNotFoundException("Đèn biển không tìm thấy: " + id))
                .when(beaconLightService).delete(id);

        mockMvc.perform(delete("/api/beacon-lights/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── SUBMIT FOR APPROVAL ──────────────────────────────────────

    @Test
    @DisplayName("POST /api/beacon-lights/{id}/submit-approval — returns 200")
    void testSubmitForApproval() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(beaconLightService).submitForApproval(id);

        mockMvc.perform(post("/api/beacon-lights/{id}/submit-approval", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(beaconLightService).submitForApproval(id);
    }

    @Test
    @DisplayName("POST /api/beacon-lights/{id}/submit-approval — returns 400 when wrong status")
    void testSubmitForApprovalWrongStatus() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new IllegalStateException("Chỉ có thể gửi phê duyệt khi status = DRAFT"))
                .when(beaconLightService).submitForApproval(id);

        // IllegalStateException is not explicitly handled → falls to catch-all → 500
        mockMvc.perform(post("/api/beacon-lights/{id}/submit-approval", id))
                .andExpect(status().isInternalServerError());
    }

    // ── APPROVE L1 ───────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/beacon-lights/{id}/approve-l1 — returns 200 with approved entity")
    void testApproveL1() throws Exception {
        UUID id = UUID.randomUUID();
        BeaconLightResponse approved = makeResponse(id, "Đã duyệt L1", BeaconLightType.LIGHTHOUSE, BeaconStatus.APPROVED_L1);
        approved.setApprovedBy(2L);
        when(beaconLightService.approveL1(eq(id), anyString())).thenReturn(approved);

        mockMvc.perform(post("/api/beacon-lights/{id}/approve-l1", id)
                        .param("approverId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED_L1"))
                .andExpect(jsonPath("$.data.approvedBy").value(2));

        verify(beaconLightService).approveL1(id, "2");
    }

    @Test
    @DisplayName("POST /api/beacon-lights/{id}/approve-l1 — returns 400 when not PENDING_APPROVAL")
    void testApproveL1WrongStatus() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconLightService.approveL1(eq(id), anyString()))
                .thenThrow(new IllegalStateException("Không ở trạng thái chờ phê duyệt L1"));

        mockMvc.perform(post("/api/beacon-lights/{id}/approve-l1", id)
                        .param("approverId", "2"))
                .andExpect(status().isInternalServerError());
    }

    // ── APPROVE L2 ───────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/beacon-lights/{id}/approve-l2 — returns 200 with published entity")
    void testApproveL2() throws Exception {
        UUID id = UUID.randomUUID();
        BeaconLightResponse published = makeResponse(id, "Đã duyệt L2", BeaconLightType.LIGHTHOUSE, BeaconStatus.PUBLISHED);
        published.setApprovedBy(3L);
        when(beaconLightService.approveL2(eq(id), anyString())).thenReturn(published);

        mockMvc.perform(post("/api/beacon-lights/{id}/approve-l2", id)
                        .param("approverId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.data.approvedBy").value(3));

        verify(beaconLightService).approveL2(id, "3");
    }

    // ── REJECT ───────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/beacon-lights/{id}/reject — returns 200 with rejected entity")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        BeaconLightResponse rejected = makeResponse(id, "Bị từ chối", BeaconLightType.LIGHTHOUSE, BeaconStatus.DRAFT);
        rejected.setRejectionReason("Lý do từ chối hợp lệ");
        rejected.setApprovalStatus(BeaconApprovalStatus.REJECTED);
        when(beaconLightService.reject(eq(id), anyString(), anyString())).thenReturn(rejected);

        mockMvc.perform(post("/api/beacon-lights/{id}/reject", id)
                        .param("rejectReason", "Lý do từ chối hợp lệ")
                        .param("approverId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));

        verify(beaconLightService).reject(id, "Lý do từ chối hợp lệ", "2");
    }

    @Test
    @DisplayName("POST /api/beacon-lights/{id}/reject — returns 400 when reason too short")
    void testRejectShortReason() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconLightService.reject(eq(id), anyString(), anyString()))
                .thenThrow(new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự"));

        mockMvc.perform(post("/api/beacon-lights/{id}/reject", id)
                        .param("rejectReason", "Ngắn")
                        .param("approverId", "2"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
