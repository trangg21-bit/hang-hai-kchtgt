package com.hanghai.kchtg.beacon;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.beacon.controller.BeaconStationController;
import com.hanghai.kchtg.beacon.dto.beacon_station.BeaconStationResponse;
import com.hanghai.kchtg.beacon.dto.beacon_station.CreateBeaconStationRequest;
import com.hanghai.kchtg.beacon.dto.beacon_station.UpdateBeaconStationRequest;
import com.hanghai.kchtg.beacon.service.BeaconStationService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BeaconStationController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class BeaconStationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BeaconStationService beaconStationService;

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

    private BeaconStationResponse makeResponse(UUID id) {
        return makeResponse(id, "Đèn biển test", "LIGHTHOUSE", "DRAFT");
    }

    private BeaconStationResponse makeResponse(UUID id, String name, String type, String status) {
        return BeaconStationResponse.builder()
                .id(id)
                .code("DEN-001")
                .name(name)
                .type(type)
                .lightRange(15.0)
                .towerColor("Trắng")
                .primaryLightModel("Chớp 3 giây")
                .area(12.0)
                .location("Mô tả")
                .isActive(true)
                .status(status)
                .approvalStatus("PENDING")
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ── FIND ALL ─────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/beacon-stations — returns 200 with list")
    void testFindAll() throws Exception {
        when(beaconStationService.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/beacon-stations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        verify(beaconStationService).findAll();
    }

    // ── FIND BY ID ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/beacon-stations/{id} — returns 200 with entity")
    void testFindById() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconStationService.findById(id)).thenReturn(makeResponse(id));

        mockMvc.perform(get("/api/beacon-stations/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Đèn biển test"))
                .andExpect(jsonPath("$.data.code").value("DEN-001"));

        verify(beaconStationService).findById(id);
    }

    @Test
    @DisplayName("GET /api/beacon-stations/{id} — returns 404 when not found")
    void testFindByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconStationService.findById(id))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("Đèn biển không tìm thấy: " + id));

        mockMvc.perform(get("/api/beacon-stations/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        verify(beaconStationService).findById(id);
    }

    // ── SEARCH ───────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/beacon-stations/search — returns 200 with filtered list")
    void testSearch() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconStationService.search(eq("Đèn"), any(), any(), any(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(makeResponse(id)));

        mockMvc.perform(get("/api/beacon-stations/search")
                        .param("name", "Đèn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        verify(beaconStationService).search(eq("Đèn"), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull());
    }

    @Test
    @DisplayName("GET /api/beacon-stations/search — with all params")
    void testSearchWithAllParams() throws Exception {
        when(beaconStationService.search(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/beacon-stations/search")
                        .param("name", "Đèn")
                        .param("code", "DEN")
                        .param("type", "LIGHTHOUSE")
                        .param("status", "DRAFT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(beaconStationService)
                .search("Đèn", "DEN", "LIGHTHOUSE", "DRAFT", null, null, null, null, null, null, null, null, null, null, null, null);
    }

    // ── CREATE ───────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/beacon-stations — returns 201 with created entity")
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
        BeaconStationResponse response = makeResponse(id, "Đèn biển mới", "BEACON_LIGHT", "DRAFT");
        when(beaconStationService.create(any(CreateBeaconStationRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/beacon-stations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Đèn biển mới"))
                .andExpect(jsonPath("$.data.code").value("DEN-001"));

        verify(beaconStationService).create(any(CreateBeaconStationRequest.class));
    }

    @Test
    @DisplayName("POST /api/beacon-stations — returns 400 when required fields missing")
    void testCreateValidationFails() throws Exception {
        String json = """
                {
                  "name": "Thiếu code và type"
                }
                """;

        mockMvc.perform(post("/api/beacon-stations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Lỗi dữ liệu đầu vào không hợp lệ"));

        verify(beaconStationService, never()).create(any());
    }

    @Test
    @DisplayName("POST /api/beacon-stations — returns 400 when duplicate code")
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
        when(beaconStationService.create(any(CreateBeaconStationRequest.class)))
                .thenThrow(new IllegalArgumentException("Mã đã tồn tại: DEN-001"));

        mockMvc.perform(post("/api/beacon-stations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── UPDATE ───────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/beacon-stations/{id} — returns 200 with updated entity")
    void testUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        String json = """
                {
                  "name": "Đèn biển cập nhật",
                  "lightColor": "Xanh",
                  "range": 18.0
                }
                """;
        BeaconStationResponse updated = makeResponse(id, "Đèn biển cập nhật", "LIGHTHOUSE", "DRAFT");
        when(beaconStationService.update(eq(id), any(UpdateBeaconStationRequest.class))).thenReturn(updated);

        mockMvc.perform(put("/api/beacon-stations/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Đèn biển cập nhật"));

        verify(beaconStationService).update(eq(id), any(UpdateBeaconStationRequest.class));
    }

    @Test
    @DisplayName("PUT /api/beacon-stations/{id} — returns 404 when not found")
    void testUpdateNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        String json = """
                {
                  "name": "Không tồn tại"
                }
                """;
        when(beaconStationService.update(eq(id), any(UpdateBeaconStationRequest.class)))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("Đèn biển không tìm thấy: " + id));

        mockMvc.perform(put("/api/beacon-stations/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── DELETE ───────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/beacon-stations/{id} — returns 200 with success")
    void testDelete() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(beaconStationService).delete(id);

        mockMvc.perform(delete("/api/beacon-stations/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(beaconStationService).delete(id);
    }

    @Test
    @DisplayName("DELETE /api/beacon-stations/{id} — returns 404 when not found")
    void testDeleteNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new jakarta.persistence.EntityNotFoundException("Đèn biển không tìm thấy: " + id))
                .when(beaconStationService).delete(id);

        mockMvc.perform(delete("/api/beacon-stations/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── SUBMIT FOR APPROVAL ──────────────────────────────────────

    @Test
    @DisplayName("POST /api/beacon-stations/{id}/submit-approval — returns 200")
    void testSubmitForApproval() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(beaconStationService).submitForApproval(id);

        mockMvc.perform(post("/api/beacon-stations/{id}/submit-approval", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(beaconStationService).submitForApproval(id);
    }

    @Test
    @DisplayName("POST /api/beacon-stations/{id}/submit-approval — returns 400 when wrong status")
    void testSubmitForApprovalWrongStatus() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new IllegalStateException("Chỉ có thể gửi phê duyệt khi status = DRAFT"))
                .when(beaconStationService).submitForApproval(id);

        // IllegalStateException is handled by GlobalExceptionHandler → returns 400 Bad Request
        mockMvc.perform(post("/api/beacon-stations/{id}/submit-approval", id))
                .andExpect(status().isBadRequest());
    }

    // ── APPROVE L1 ───────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/beacon-stations/{id}/approve-l1 — returns 200 with approved entity")
    void testApproveL1() throws Exception {
        UUID id = UUID.randomUUID();
        BeaconStationResponse approved = makeResponse(id, "Đã duyệt L1", "LIGHTHOUSE", "APPROVED_L1");
        approved.setApprovedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
        when(beaconStationService.approveL1(eq(id), any(java.util.UUID.class))).thenReturn(approved);

        mockMvc.perform(post("/api/beacon-stations/{id}/approve-l1", id)
                        .param("approverId", "00000000-0000-0000-0000-000000000002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED_L1"))
                .andExpect(jsonPath("$.data.approvedBy").value("00000000-0000-0000-0000-000000000002"));

        verify(beaconStationService).approveL1(eq(id), any(java.util.UUID.class));
    }

    @Test
    @DisplayName("POST /api/beacon-stations/{id}/approve-l1 — returns 400 when not PENDING_APPROVAL")
    void testApproveL1WrongStatus() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconStationService.approveL1(eq(id), any(java.util.UUID.class)))
                .thenThrow(new IllegalStateException("Không ở trạng thái chờ phê duyệt L1"));

        mockMvc.perform(post("/api/beacon-stations/{id}/approve-l1", id)
                        .param("approverId", "00000000-0000-0000-0000-000000000002"))
                .andExpect(status().isBadRequest());
    }

    // ── REJECT ───────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/beacon-stations/{id}/reject — returns 200 with rejected entity")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        BeaconStationResponse rejected = makeResponse(id, "Bị từ chối", "LIGHTHOUSE", "DRAFT");
        rejected.setRejectionReason("Lý do từ chối hợp lệ");
        rejected.setApprovalStatus("REJECTED");
        when(beaconStationService.reject(eq(id), anyString(), any(java.util.UUID.class))).thenReturn(rejected);

        mockMvc.perform(post("/api/beacon-stations/{id}/reject", id)
                        .param("rejectReason", "Lý do từ chối hợp lệ")
                        .param("approverId", "00000000-0000-0000-0000-000000000002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));

        verify(beaconStationService).reject(eq(id), eq("Lý do từ chối hợp lệ"), any(java.util.UUID.class));
    }

    @Test
    @DisplayName("POST /api/beacon-stations/{id}/reject — returns 400 when reason too short")
    void testRejectShortReason() throws Exception {
        UUID id = UUID.randomUUID();
        when(beaconStationService.reject(eq(id), anyString(), any(java.util.UUID.class)))
                .thenThrow(new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự"));

        mockMvc.perform(post("/api/beacon-stations/{id}/reject", id)
                        .param("rejectReason", "Ngắn")
                        .param("approverId", "00000000-0000-0000-0000-000000000002"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
