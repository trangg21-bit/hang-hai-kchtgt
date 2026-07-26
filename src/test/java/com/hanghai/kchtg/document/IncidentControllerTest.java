package com.hanghai.kchtg.document;

import com.hanghai.kchtg.document.controller.IncidentController;
import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.service.IncidentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.web.servlet.MockMvc;

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
class IncidentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private IncidentService incidentService;

    private IncidentResponse testResponse;
    private IncidentCreateRequest createRequest;
    private ProcessingProgressRequest progressRequest;
    private UUID testId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testResponse = IncidentResponse.builder()
                .id(testId)
                .discoveryTime(LocalDateTime.of(2026, 6, 29, 14, 30))
                .location("Bến Cảng A - Khu vực xếp dỡ")
                .severityLevel(SeverityLevel.NGHIEM_TRONG)
                .description("Rò rỉ dầu tại cần trục 01")
                .processingStatus(ProcessingStatus.DANG_XU_LY)
                .reporter("Kỹ thuật viên A")
                .build();

        createRequest = IncidentCreateRequest.builder()
                .location("Bến Cảng B - Khu vực tiếp nhận")
                .severityLevel(SeverityLevel.NHE)
                .description("Hư hỏng hệ thống chiếu sáng")
                .reporter("Nhân viên B")
                .build();

        progressRequest = ProcessingProgressRequest.builder()
                .incidentId(testId)
                .progressDescription("Đã thay thế seal dầu")
                .updatedBy("Kỹ thuật viên C")
                .build();
    }

    @Test
    void listIncidents_shouldReturnAll() throws Exception {
        when(incidentService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(java.util.Objects.requireNonNull(List.of(testResponse))));

        mockMvc.perform(get("/api/v1/incidents")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].location").value("Bến Cảng A - Khu vực xếp dỡ"));
    }

    @Test
    void createIncident_shouldReturnCreated() throws Exception {
        when(incidentService.create(any(IncidentCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/incidents")
                        .contentType("application/json")
                        .content(java.util.Objects.requireNonNull(objectMapper.writeValueAsString(createRequest))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.description").value("Rò rỉ dầu tại cần trục 01"));
    }

    @Test
    void getIncident_shouldReturnOne() throws Exception {
        when(incidentService.getById(testId)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/incidents/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.location").value("Bến Cảng A - Khu vực xếp dỡ"));
    }

    @Test
    void updateIncident_shouldReturnUpdated() throws Exception {
        IncidentResponse updated = IncidentResponse.builder()
                .id(testId)
                .description("Đã sửa đổi mô tả sự cố")
                .build();
        when(incidentService.update(eq(testId), any(IncidentCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/incidents/" + testId)
                        .contentType("application/json")
                        .content(java.util.Objects.requireNonNull(objectMapper.writeValueAsString(createRequest))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.description").value("Đã sửa đổi mô tả sự cố"));
    }

    @Test
    void deleteIncident_shouldReturnOk() throws Exception {
        doNothing().when(incidentService).delete(testId);

        mockMvc.perform(delete("/api/v1/incidents/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void addProgress_shouldReturnCreated() throws Exception {
        ProcessingProgressResponse progressResponse = ProcessingProgressResponse.builder()
                .id(UUID.randomUUID())
                .incidentId(testId)
                .progressDescription("Đã thay thế seal dầu")
                .updatedBy("Kỹ thuật viên C")
                .build();

        when(incidentService.addProgress(any(ProcessingProgressRequest.class)))
                .thenReturn(progressResponse);

        mockMvc.perform(post("/api/v1/incidents/progress")
                        .contentType("application/json")
                        .content(java.util.Objects.requireNonNull(objectMapper.writeValueAsString(progressRequest))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.progressDescription").value("Đã thay thế seal dầu"));
    }

    @Test
    void getProgress_shouldReturnHistory() throws Exception {
        ProcessingProgressResponse progressResponse = ProcessingProgressResponse.builder()
                .id(UUID.randomUUID())
                .incidentId(testId)
                .progressDescription("Đã thay thế seal dầu")
                .updatedBy("Kỹ thuật viên C")
                .build();

        when(incidentService.getProgressByIncident(testId))
                .thenReturn(List.of(progressResponse));

        mockMvc.perform(get("/api/v1/incidents/" + testId + "/progress"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].progressDescription").value("Đã thay thế seal dầu"));
    }

    @Test
    void filterByStatus_shouldReturnMatchingIncidents() throws Exception {
        when(incidentService.findByProcessingStatus(any(ProcessingStatus.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/incidents/status/DANG_XU_LY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterBySeverity_shouldReturnMatchingIncidents() throws Exception {
        when(incidentService.findBySeverityLevel(any(SeverityLevel.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/incidents/severity/NGHIEM_TRONG"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void searchByLocation_shouldReturnMatchingIncidents() throws Exception {
        when(incidentService.searchByViTriContaining("Bến Cảng A", 0, 20))
                .thenReturn(new PageImpl<>(java.util.Objects.requireNonNull(List.of(testResponse))));

        mockMvc.perform(get("/api/v1/incidents/search/location")
                        .param("location", "Bến Cảng A")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].location").value("Bến Cảng A - Khu vực xếp dỡ"));
    }

    @Test
    void searchByDescription_shouldReturnMatchingIncidents() throws Exception {
        when(incidentService.searchByMoTaContaining("rò rỉ", 0, 20))
                .thenReturn(new PageImpl<>(java.util.Objects.requireNonNull(List.of(testResponse))));

        mockMvc.perform(get("/api/v1/incidents/search/description")
                        .param("description", "rò rỉ")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].description").value("Rò rỉ dầu tại cần trục 01"));
    }
}
