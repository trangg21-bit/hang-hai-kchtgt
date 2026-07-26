package com.hanghai.kchtg.document;

import com.hanghai.kchtg.document.controller.MaintenancePlanController;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.service.MaintenancePlanService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.security.test.context.support.WithMockUser;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(authorities = "ROLE_SYSTEM_ADMIN")
class MaintenancePlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MaintenancePlanService maintenancePlanService;

    private MaintenancePlanResponse testResponse;
    private MaintenancePlanCreateRequest createRequest;
    private MaintenanceResultRequest resultRequest;
    private UUID testId;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testUserId = UUID.randomUUID();

        testResponse = MaintenancePlanResponse.builder()
                .id(testId)
                .equipment("Máy bơm nước 01")
                .maintenanceType(MaintenanceType.DINH_KY)
                .estimatedStartDate(LocalDate.of(2026, 8, 1))
                .estimatedEndDate(LocalDate.of(2026, 8, 3))
                .status(MaintenanceStatus.DANG_THUC_HIEN)
                .estimatedCost(new BigDecimal("15000000"))
                .createdBy(testUserId)
                .build();

        createRequest = MaintenancePlanCreateRequest.builder()
                .equipment("Máy nén khí 02")
                .maintenanceType(MaintenanceType.SUA_CHUA_KHAN_CAP)
                .estimatedStartDate(LocalDate.of(2026, 8, 5))
                .estimatedEndDate(LocalDate.of(2026, 8, 6))
                .status(MaintenanceStatus.CHO_DOI_PHUY)
                .estimatedCost(new BigDecimal("8000000"))
                .createdBy(testUserId)
                .build();

        resultRequest = MaintenanceResultRequest.builder()
                .maintenancePlanId(testId)
                .actualStartDate(LocalDateTime.of(2026, 8, 1, 8, 0))
                .actualEndDate(LocalDateTime.of(2026, 8, 1, 12, 0))
                .resultDescription("Bảo trì thành công")
                .replacedParts("Đèn LED 02 cái")
                .downtimeDuration(4L)
                .recorder("Kỹ thuật viên A")
                .recordedDate(LocalDate.of(2026, 8, 1))
                .build();
    }

    @Test
    void listPlans_shouldReturnAll() throws Exception {
        when(maintenancePlanService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/maintenance-plans")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].equipment").value("Máy bơm nước 01"));
    }

    @Test
    void createPlan_shouldReturnCreated() throws Exception {
        when(maintenancePlanService.create(any(MaintenancePlanCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/maintenance-plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.equipment").value("Máy bơm nước 01"));
    }

    @Test
    void getPlan_shouldReturnOne() throws Exception {
        when(maintenancePlanService.getById(testId)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/maintenance-plans/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.equipment").value("Máy bơm nước 01"));
    }

    @Test
    void updatePlan_shouldReturnUpdated() throws Exception {
        MaintenancePlanResponse updated = MaintenancePlanResponse.builder()
                .id(testId)
                .equipment("Máy bơm nước 01 - Đã sửa đổi")
                .build();
        when(maintenancePlanService.update(eq(testId), any(MaintenancePlanCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/maintenance-plans/" + testId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.equipment").value("Máy bơm nước 01 - Đã sửa đổi"));
    }

    @Test
    void deletePlan_shouldReturnOk() throws Exception {
        doNothing().when(maintenancePlanService).delete(testId);

        mockMvc.perform(delete("/api/v1/maintenance-plans/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void recordResult_shouldReturnCreated() throws Exception {
        MaintenanceResultResponse resultResponse = MaintenanceResultResponse.builder()
                .id(UUID.randomUUID())
                .maintenancePlanId(testId)
                .resultDescription("Bảo trì thành công")
                .recorder("Kỹ thuật viên A")
                .build();

        when(maintenancePlanService.recordResult(any(MaintenanceResultRequest.class)))
                .thenReturn(resultResponse);

        mockMvc.perform(post("/api/v1/maintenance-plans/result")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resultRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.resultDescription").value("Bảo trì thành công"));
    }

    @Test
    void filterByEquipment_shouldReturnMatchingPlans() throws Exception {
        when(maintenancePlanService.findByEquipment("Máy bơm nước 01"))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/maintenance-plans/equipment/Máy bơm nước 01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].equipment").value("Máy bơm nước 01"));
    }

    @Test
    void filterByStatus_shouldReturnMatchingPlans() throws Exception {
        when(maintenancePlanService.findByStatus(any(MaintenanceStatus.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/maintenance-plans/status/DANG_THUC_HIEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByType_shouldReturnMatchingPlans() throws Exception {
        when(maintenancePlanService.findByMaintenanceType(any(MaintenanceType.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/maintenance-plans/type/DINH_KY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByDateRange_shouldReturnMatchingPlans() throws Exception {
        when(maintenancePlanService.findByNgayBatDauDuKienBetween(
                LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/maintenance-plans/date-range")
                        .param("start", "2026-08-01")
                        .param("end", "2026-08-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].estimatedStartDate").value("2026-08-01"));
    }
}
