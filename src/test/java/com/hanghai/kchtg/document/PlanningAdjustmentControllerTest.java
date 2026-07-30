package com.hanghai.kchtg.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.document.dto.AdjustmentApprovalRequest;
import com.hanghai.kchtg.document.dto.AdjustmentApprovalResponse;
import com.hanghai.kchtg.document.dto.PlanningAdjustmentCreateRequest;
import com.hanghai.kchtg.document.dto.PlanningAdjustmentResponse;
import com.hanghai.kchtg.document.entity.AdjustmentStatus;
import com.hanghai.kchtg.document.service.PlanningAdjustmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(authorities = "ROLE_SYSTEM_ADMIN")
class PlanningAdjustmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PlanningAdjustmentService planningAdjustmentService;

    private PlanningAdjustmentResponse testResponse;
    private PlanningAdjustmentCreateRequest createRequest;
    private AdjustmentApprovalRequest approvalRequest;
    private UUID testId;
    private UUID planningId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        planningId = UUID.randomUUID();

        testResponse = PlanningAdjustmentResponse.builder()
                .id(testId)
                .planningId(planningId)
                .adjustmentType("Điều chỉnh phạm vi")
                .reason("Thay đổi quy hoạch tổng thể khu vực")
                .detailedDescription("Mở rộng khu vực tiếp nhận tàu từ 50m lên 80m")
                .affectedScope("Khu vực Bắc Bến Cảng A")
                .status(AdjustmentStatus.DA_APPROVED)
                .registrant("Kỹ sư D")
                .registeredAt(LocalDate.of(2026, 6, 20).atStartOfDay())
                .build();

        createRequest = PlanningAdjustmentCreateRequest.builder()
                .planningId(planningId)
                .adjustmentType("Điều chỉnh tiến độ")
                .reason("Thay đổi tiến độ thi công")
                .detailedDescription("Gia hạn thời gian thi công thêm 3 tháng")
                .affectedScope("Toàn bộ Bến Cảng A")
                .registrant("Kỹ sư E")
                .build();

        approvalRequest = AdjustmentApprovalRequest.builder()
                .approvalLevel("CAP_1")
                .status("DA_APPROVED")
                .approver("Giám đốc Sở")
                .approvalDate(LocalDate.of(2026, 7, 1))
                .notes("Được phê duyệt vì phù hợp quy hoạch tổng thể")
                .build();
    }

    @Test
    void listAdjustments_shouldReturnAll() throws Exception {
        when(planningAdjustmentService.findAll())
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/planning-adjustments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].adjustmentType").value("Điều chỉnh phạm vi"));
    }

    @Test
    void createAdjustment_shouldReturnCreated() throws Exception {
        when(planningAdjustmentService.create(any(PlanningAdjustmentCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/planning-adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.adjustmentType").value("Điều chỉnh phạm vi"));
    }

    @Test
    void getAdjustment_shouldReturnOne() throws Exception {
        when(planningAdjustmentService.getById(testId)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/planning-adjustments/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.adjustmentType").value("Điều chỉnh phạm vi"));
    }

    @Test
    void updateAdjustment_shouldReturnUpdated() throws Exception {
        PlanningAdjustmentResponse updated = PlanningAdjustmentResponse.builder()
                .id(testId)
                .adjustmentType("Điều chỉnh phạm vi - Đã sửa đổi")
                .build();
        when(planningAdjustmentService.update(eq(testId), any(PlanningAdjustmentCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/planning-adjustments/" + testId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.adjustmentType").value("Điều chỉnh phạm vi - Đã sửa đổi"));
    }

    @Test
    void deleteAdjustment_shouldReturnOk() throws Exception {
        doNothing().when(planningAdjustmentService).delete(testId);

        mockMvc.perform(delete("/api/v1/planning-adjustments/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void getByPlanningId_shouldReturnMatchingAdjustments() throws Exception {
        when(planningAdjustmentService.findByPlanningId(planningId))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/planning-adjustments/planning/" + planningId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].planningId").value(planningId.toString()));
    }

    @Test
    void filterByStatus_shouldReturnMatchingAdjustments() throws Exception {
        when(planningAdjustmentService.findByStatus(any(AdjustmentStatus.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/planning-adjustments/status/DA_APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void addApproval_shouldReturnCreated() throws Exception {
        AdjustmentApprovalResponse approvalResponse = AdjustmentApprovalResponse.builder()
                .id(UUID.randomUUID())
                .planningAdjustmentId(testId)
                .approvalLevel("CAP_1")
                .status("DA_APPROVED")
                .approver("Giám đốc Sở")
                .notes("Được phê duyệt vì phù hợp quy hoạch tổng thể")
                .build();

        when(planningAdjustmentService.addApproval(eq(testId), any(AdjustmentApprovalRequest.class)))
                .thenReturn(approvalResponse);

        mockMvc.perform(post("/api/v1/planning-adjustments/" + testId + "/approval")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approvalRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("DA_APPROVED"));
    }
}
