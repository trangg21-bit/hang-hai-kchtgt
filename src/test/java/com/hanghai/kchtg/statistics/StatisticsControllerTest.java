package com.hanghai.kchtg.statistics;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.statistics.controller.StatisticsController;
import com.hanghai.kchtg.statistics.dto.*;
import com.hanghai.kchtg.statistics.service.StatisticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.*;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StatisticsController.class)
@AutoConfigureMockMvc(addFilters = false)
class StatisticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StatisticsService statisticsService;

    // Global interceptor / security dependencies mock
    @MockBean
    private com.hanghai.kchtg.accesslog.repository.AccessLogRepository accessLogRepository;

    @MockBean
    private com.hanghai.kchtg.user.repository.UserRepository userRepository;

    @MockBean
    private com.hanghai.kchtg.security.service.TokenService tokenService;

    @MockBean
    private com.hanghai.kchtg.security.service.JwtSessionService jwtSessionService;

    @MockBean
    private com.hanghai.kchtg.security.service.TokenValidationService tokenValidationService;

    @MockBean
    private com.hanghai.kchtg.security.JwtUtil jwtUtil;

    @MockBean
    private com.hanghai.kchtg.user.service.PermissionRoleService permissionRoleService;

    @MockBean
    private org.springframework.data.jpa.mapping.JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @Test
    void createForm_returns200() throws Exception {
        StatisticsFormResponse response = StatisticsFormResponse.builder()
                .id(1L)
                .code("S-001")
                .formCode("F01N-2026-06")
                .formType("PORT_THROUGHPUT")
                .formStatus("DRAFT")
                .build();

        when(statisticsService.createForm(any(StatisticsFormRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/statistics/forms")
                        .contentType("application/json")
                        .content("""
                                {
                                  "formCode": "F01N-2026-06",
                                  "formType": "PORT_THROUGHPUT",
                                  "reportingPeriod": "2026-06"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.formCode").value("F01N-2026-06"))
                .andExpect(jsonPath("$.data.formStatus").value("DRAFT"));

        verify(statisticsService, times(1)).createForm(any(StatisticsFormRequest.class));
    }

    @Test
    void findById_returns200() throws Exception {
        StatisticsFormResponse response = StatisticsFormResponse.builder()
                .id(1L)
                .code("S-001")
                .formCode("F01N-2026-06")
                .formType("PORT_THROUGHPUT")
                .formStatus("APPROVED")
                .build();

        when(statisticsService.findById(1L)).thenReturn(Optional.of(response));

        mockMvc.perform(get("/api/v1/statistics/forms/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.formCode").value("F01N-2026-06"))
                .andExpect(jsonPath("$.data.formStatus").value("APPROVED"));

        verify(statisticsService, times(1)).findById(1L);
    }

    @Test
    void findById_notFound_returns404() throws Exception {
        when(statisticsService.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/statistics/forms/999"))
                .andExpect(status().isNotFound());

        verify(statisticsService, times(1)).findById(999L);
    }

    @Test
    void findByCode_returns200() throws Exception {
        StatisticsFormResponse response = StatisticsFormResponse.builder()
                .id(1L)
                .code("S-001")
                .formCode("F01N-2026-06")
                .formType("PORT_THROUGHPUT")
                .formStatus("APPROVED")
                .build();

        when(statisticsService.findByCode("F01N-2026-06")).thenReturn(Optional.of(response));

        mockMvc.perform(get("/api/v1/statistics/forms/code/F01N-2026-06"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.formCode").value("F01N-2026-06"));

        verify(statisticsService, times(1)).findByCode("F01N-2026-06");
    }

    @Test
    void findAll_returns200() throws Exception {
        StatisticsFormResponse response1 = StatisticsFormResponse.builder()
                .id(1L)
                .formCode("F01N-2026-06")
                .build();
        StatisticsFormResponse response2 = StatisticsFormResponse.builder()
                .id(2L)
                .formCode("F02N-2026-06")
                .build();

        Page<StatisticsFormResponse> page = new PageImpl<>(List.of(response1, response2), PageRequest.of(0, 10), 2);

        when(statisticsService.findAll(any(StatisticsFilter.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/statistics/forms")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].formCode").value("F01N-2026-06"))
                .andExpect(jsonPath("$.data.content[1].formCode").value("F02N-2026-06"));

        verify(statisticsService, times(1)).findAll(any(StatisticsFilter.class));
    }

    @Test
    void updateStatus_returns200() throws Exception {
        doNothing().when(statisticsService).updateStatus(1L, "APPROVED");

        mockMvc.perform(put("/api/v1/statistics/forms/1/status")
                        .param("status", "APPROVED"))
                .andExpect(status().isOk());

        verify(statisticsService, times(1)).updateStatus(1L, "APPROVED");
    }

    @Test
    void countByStatus_returns200() throws Exception {
        when(statisticsService.countByStatus("APPROVED")).thenReturn(5L);

        mockMvc.perform(get("/api/v1/statistics/forms/count-by-status/APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(5L));

        verify(statisticsService, times(1)).countByStatus("APPROVED");
    }

    @Test
    void getSummary_returns200() throws Exception {
        StatisticsSummary summary = StatisticsSummary.builder()
                .totalForms(100L)
                .approvedForms(80L)
                .pendingForms(20L)
                .totalValue(new BigDecimal("100000"))
                .build();

        when(statisticsService.getSummary()).thenReturn(summary);

        mockMvc.perform(get("/api/v1/statistics/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalForms").value(100L))
                .andExpect(jsonPath("$.data.approvedForms").value(80L))
                .andExpect(jsonPath("$.data.pendingForms").value(20L));

        verify(statisticsService, times(1)).getSummary();
    }

    @Test
    void findByFormType_returns200() throws Exception {
        StatisticsFormResponse response = StatisticsFormResponse.builder()
                .id(1L)
                .formCode("F01N-2026-06")
                .formType("PORT_THROUGHPUT")
                .build();

        when(statisticsService.findByFormType("PORT_THROUGHPUT")).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/statistics/forms/type/PORT_THROUGHPUT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].formType").value("PORT_THROUGHPUT"));

        verify(statisticsService, times(1)).findByFormType("PORT_THROUGHPUT");
    }
}
