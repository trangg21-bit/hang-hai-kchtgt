package com.hanghai.kchtg.beacon;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.beacon.controller.BuoyController;
import com.hanghai.kchtg.beacon.dto.buoy.BuoyResponse;
import com.hanghai.kchtg.beacon.dto.buoy.CreateBuoyRequest;
import com.hanghai.kchtg.beacon.dto.buoy.UpdateBuoyRequest;
import com.hanghai.kchtg.beacon.service.BuoyService;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
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

@WebMvcTest(BuoyController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class BuoyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BuoyService buoyService;

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
    private ChangeLogRepository changeLogRepository;
    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private BuoyResponse makeResponse(UUID id) {
        return makeResponse(id, "Phao tiêu test", "CARDINAL", "DRAFT");
    }

    private BuoyResponse makeResponse(UUID id, String name, String type, String status) {
        return BuoyResponse.builder()
                .id(id)
                .code("PHAO-001")
                .name(name)
                .type(type)
                .color("Đỏ")
                .shape("Hình trụ")
                .lightCharacteristic("Chớp 3 giây")
                .range(12.0)
                .description("Mô tả phao tiêu")
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
    @DisplayName("GET /api/buoys — returns 200 with list")
    void testFindAll() throws Exception {
        when(buoyService.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/buoys"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        verify(buoyService).findAll();
    }

    // ── FIND BY ID ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/buoys/{id} — returns 200 with entity")
    void testFindById() throws Exception {
        UUID id = UUID.randomUUID();
        when(buoyService.findById(id)).thenReturn(makeResponse(id));

        mockMvc.perform(get("/api/buoys/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Phao tiêu test"))
                .andExpect(jsonPath("$.data.code").value("PHAO-001"));

        verify(buoyService).findById(id);
    }

    @Test
    @DisplayName("GET /api/buoys/{id} — returns 404 when not found")
    void testFindByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(buoyService.findById(id))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("Phao tiêu không tìm thấy: " + id));

        mockMvc.perform(get("/api/buoys/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        verify(buoyService).findById(id);
    }

    // ── SEARCH ───────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/buoys/search — returns 200 with filtered list")
    void testSearch() throws Exception {
        UUID id = UUID.randomUUID();
        when(buoyService.search(eq("Phao"), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(makeResponse(id)));

        mockMvc.perform(get("/api/buoys/search")
                        .param("name", "Phao"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        verify(buoyService).search(eq("Phao"), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull());
    }

    @Test
    @DisplayName("GET /api/buoys/search — with all params")
    void testSearchWithAllParams() throws Exception {
        when(buoyService.search(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/buoys/search")
                        .param("name", "Phao")
                        .param("code", "PHAO")
                        .param("type", "CARDINAL")
                        .param("status", "DRAFT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(buoyService).search(eq("Phao"), eq("PHAO"), eq("CARDINAL"), eq("DRAFT"), isNull(), isNull(), isNull(), isNull());
    }

    // ── CREATE ───────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/buoys — returns 201 with created entity")
    void testCreate() throws Exception {
        UUID id = UUID.randomUUID();
        String json = """
                {
                  "code": "PHAO-002",
                  "name": "Phao tiêu mới",
                  "type": "SAFE_WATER",
                  "latitude": 10.5,
                  "longitude": 106.5,
                  "range": 15.0,
                  "color": "Xanh",
                  "shape": "Hình cầu",
                  "classification": "Phao tiêu luồng",
                  "condition": "Hoạt động bình thường",
                  "lightHeight": 4.5
                }
                """;
        BuoyResponse response = makeResponse(id, "Phao tiêu mới", "SAFE_WATER", "DRAFT");
        when(buoyService.create(any(CreateBuoyRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/buoys")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Phao tiêu mới"));

        verify(buoyService).create(any(CreateBuoyRequest.class));
    }

    @Test
    @DisplayName("POST /api/buoys — returns 400 when required fields missing")
    void testCreateValidationFails() throws Exception {
        String json = """
                {
                  "name": "Thiếu code và type"
                }
                """;

        mockMvc.perform(post("/api/buoys")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"));

        verify(buoyService, never()).create(any());
    }

    @Test
    @DisplayName("POST /api/buoys — returns 400 when duplicate code")
    void testCreateDuplicateCode() throws Exception {
        String json = """
                {
                  "code": "PHAO-001",
                  "name": "Trùng mã",
                  "type": "CARDINAL",
                  "latitude": 10.5,
                  "longitude": 106.5,
                  "range": 12.0,
                  "classification": "CARDINAL",
                  "condition": "1",
                  "lightHeight": 8.0
                }
                """;
        when(buoyService.create(any(CreateBuoyRequest.class)))
                .thenThrow(new IllegalArgumentException("Đã tồn tại: PHAO-001"));

        mockMvc.perform(post("/api/buoys")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── UPDATE ───────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/buoys/{id} — returns 200 with updated entity")
    void testUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        String json = """
                {
                  "name": "Phao tiêu cập nhật",
                  "color": "Vàng",
                  "range": 20.0
                }
                """;
        BuoyResponse updated = makeResponse(id, "Phao tiêu cập nhật", "CARDINAL", "DRAFT");
        when(buoyService.update(eq(id), any(UpdateBuoyRequest.class))).thenReturn(updated);

        mockMvc.perform(put("/api/buoys/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Phao tiêu cập nhật"));

        verify(buoyService).update(eq(id), any(UpdateBuoyRequest.class));
    }

    @Test
    @DisplayName("PUT /api/buoys/{id} — returns 404 when not found")
    void testUpdateNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        String json = """
                {
                  "name": "Không tồn tại"
                }
                """;
        when(buoyService.update(eq(id), any(UpdateBuoyRequest.class)))
                .thenThrow(new jakarta.persistence.EntityNotFoundException("Phao tiêu không tìm thấy: " + id));

        mockMvc.perform(put("/api/buoys/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── DELETE ───────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/buoys/{id} — returns 200 with success")
    void testDelete() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(buoyService).delete(id);

        mockMvc.perform(delete("/api/buoys/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(buoyService).delete(id);
    }

    @Test
    @DisplayName("DELETE /api/buoys/{id} — returns 404 when not found")
    void testDeleteNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new jakarta.persistence.EntityNotFoundException("Phao tiêu không tìm thấy: " + id))
                .when(buoyService).delete(id);

        mockMvc.perform(delete("/api/buoys/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── SUBMIT FOR APPROVAL ──────────────────────────────────────

    @Test
    @DisplayName("POST /api/buoys/{id}/submit-approval — returns 200")
    void testSubmitForApproval() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(buoyService).submitForApproval(id);

        mockMvc.perform(post("/api/buoys/{id}/submit-approval", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(buoyService).submitForApproval(id);
    }

    @Test
    @DisplayName("POST /api/buoys/{id}/submit-approval — returns 500 when wrong status")
    void testSubmitForApprovalWrongStatus() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new IllegalStateException("Chỉ có thể gửi phê duyệt khi status = DRAFT"))
                .when(buoyService).submitForApproval(id);

        mockMvc.perform(post("/api/buoys/{id}/submit-approval", id))
                .andExpect(status().isBadRequest());
    }

    // ── APPROVE L1 ───────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/buoys/{id}/approve-l1 — returns 200 with approved entity")
    void testApproveL1() throws Exception {
        UUID id = UUID.randomUUID();
        BuoyResponse approved = makeResponse(id, "Đã duyệt L1", "CARDINAL", "APPROVED_L1");
        approved.setApprovedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000002"));
        when(buoyService.approveL1(eq(id), any(java.util.UUID.class), any())).thenReturn(approved);

        mockMvc.perform(post("/api/buoys/{id}/approve-l1", id)
                        .param("approverId", "00000000-0000-0000-0000-000000000002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED_L1"))
                .andExpect(jsonPath("$.data.approvedBy").value("00000000-0000-0000-0000-000000000002"));

        verify(buoyService).approveL1(eq(id), any(java.util.UUID.class), any());
    }

    // ── APPROVE L2 ───────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/buoys/{id}/approve-l2 — returns 200 with published entity")
    void testApproveL2() throws Exception {
        UUID id = UUID.randomUUID();
        BuoyResponse published = makeResponse(id, "Đã duyệt L2", "CARDINAL", "PUBLISHED");
        published.setApprovedBy(java.util.UUID.fromString("00000000-0000-0000-0000-000000000003"));
        when(buoyService.approveL2(eq(id), any(java.util.UUID.class), any())).thenReturn(published);

        mockMvc.perform(post("/api/buoys/{id}/approve-l2", id)
                        .param("approverId", "00000000-0000-0000-0000-000000000003"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.data.approvedBy").value("00000000-0000-0000-0000-000000000003"));

        verify(buoyService).approveL2(eq(id), any(java.util.UUID.class), any());
    }

    // ── REJECT ───────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/buoys/{id}/reject — returns 200 with rejected entity")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        BuoyResponse rejected = makeResponse(id, "Bị từ chối", "CARDINAL", "DRAFT");
        rejected.setRejectionReason("Lý do từ chối hợp lệ");
        rejected.setApprovalStatus("REJECTED");
        when(buoyService.reject(eq(id), anyString(), any(java.util.UUID.class))).thenReturn(rejected);

        mockMvc.perform(post("/api/buoys/{id}/reject", id)
                        .param("rejectReason", "Lý do từ chối hợp lệ")
                        .param("approverId", "00000000-0000-0000-0000-000000000002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.approvalStatus").value("REJECTED"));

        verify(buoyService).reject(eq(id), eq("Lý do từ chối hợp lệ"), any(java.util.UUID.class));
    }

    @Test
    @DisplayName("POST /api/buoys/{id}/reject — returns 400 when reason too short")
    void testRejectShortReason() throws Exception {
        UUID id = UUID.randomUUID();
        when(buoyService.reject(eq(id), anyString(), any(java.util.UUID.class)))
                .thenThrow(new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự"));

        mockMvc.perform(post("/api/buoys/{id}/reject", id)
                        .param("rejectReason", "Ngắn")
                        .param("approverId", "00000000-0000-0000-0000-000000000002"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
