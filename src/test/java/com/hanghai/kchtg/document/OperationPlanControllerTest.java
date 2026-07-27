package com.hanghai.kchtg.document;

import com.hanghai.kchtg.document.controller.OperationPlanController;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.service.OperationPlanService;
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

import java.time.LocalDate;
import java.time.LocalTime;
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
class OperationPlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OperationPlanService operationPlanService;

    private OperationPlanResponse testResponse;
    private OperationPlanCreateRequest createRequest;
    private UUID testId;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testUserId = UUID.randomUUID();

        testResponse = OperationPlanResponse.builder()
                .id(testId)
                .operationDate(LocalDate.of(2026, 7, 15))
                .pier("Bến Cảng A")
                .equipment("Cần trục 01")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(17, 0))
                .status(OperationStatus.DA_PHE_DUYET)
                .createdBy(testUserId)
                .build();

        createRequest = OperationPlanCreateRequest.builder()
                .operationDate(LocalDate.of(2026, 7, 16))
                .pier("Bến Cảng B")
                .equipment("Cần trục 02")
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(16, 0))
                .status(OperationStatus.DA_PHE_DUYET)
                .createdBy(testUserId)
                .build();
    }

    @Test
    void listPlans_shouldReturnAll() throws Exception {
        when(operationPlanService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/operation-plans")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].pier").value("Bến Cảng A"));
    }

    @Test
    void createPlan_shouldReturnCreated() throws Exception {
        when(operationPlanService.create(any(OperationPlanCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/operation-plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.pier").value("Bến Cảng A"));
    }

    @Test
    void getPlan_shouldReturnOne() throws Exception {
        when(operationPlanService.getById(testId)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/operation-plans/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.equipment").value("Cần trục 01"));
    }

    @Test
    void updatePlan_shouldReturnUpdated() throws Exception {
        OperationPlanResponse updated = OperationPlanResponse.builder()
                .id(testId)
                .pier("Bến Cảng C - Đã cập nhật")
                .build();
        when(operationPlanService.update(eq(testId), any(OperationPlanCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/operation-plans/" + testId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pier").value("Bến Cảng C - Đã cập nhật"));
    }

    @Test
    void deletePlan_shouldReturnOk() throws Exception {
        doNothing().when(operationPlanService).delete(testId);

        mockMvc.perform(delete("/api/v1/operation-plans/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByDate_shouldReturnMatchingPlans() throws Exception {
        when(operationPlanService.findByOperationDate(LocalDate.of(2026, 7, 15)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/operation-plans/date/2026-07-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].operationDate").value("2026-07-15"));
    }

    @Test
    void filterByStatus_shouldReturnMatchingPlans() throws Exception {
        when(operationPlanService.findByStatus(any(OperationStatus.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/operation-plans/status/DA_PHE_DUYET"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByCauCang_shouldReturnMatchingPlans() throws Exception {
        when(operationPlanService.findByPier("Bến Cảng A"))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/operation-plans/pier/Bến Cảng A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].pier").value("Bến Cảng A"));
    }

    @Test
    void filterByThietBi_shouldReturnMatchingPlans() throws Exception {
        when(operationPlanService.findByEquipment("Cần trục 01"))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/operation-plans/equipment/Cần trục 01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].equipment").value("Cần trục 01"));
    }

    @Test
    void checkConflict_shouldReturnFalse() throws Exception {
        when(operationPlanService.hasConflictSchedule(
                any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), any(), any()))
                .thenReturn(false);

        mockMvc.perform(get("/api/v1/operation-plans/conflict")
                        .param("operationDate", "2026-07-15")
                        .param("startTime", "08:00:00")
                        .param("endTime", "17:00:00")
                        .param("pier", "Bến Cảng A")
                        .param("equipment", "Cần trục 01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(false));
    }

    @Test
    void checkConflict_shouldReturnTrue() throws Exception {
        when(operationPlanService.hasConflictSchedule(
                any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), any(), any()))
                .thenReturn(true);

        mockMvc.perform(get("/api/v1/operation-plans/conflict")
                        .param("operationDate", "2026-07-15")
                        .param("startTime", "08:00:00")
                        .param("endTime", "17:00:00")
                        .param("pier", "Bến Cảng A")
                        .param("equipment", "Cần trục 01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(true));
    }
}
