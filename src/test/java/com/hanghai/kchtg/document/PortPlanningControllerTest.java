package com.hanghai.kchtg.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.document.dto.LookupResultResponse;
import com.hanghai.kchtg.document.dto.PortPlanningCreateRequest;
import com.hanghai.kchtg.document.dto.PortPlanningResponse;
import com.hanghai.kchtg.document.entity.PlanningStatus;
import com.hanghai.kchtg.document.service.PortPlanningService;
import com.hanghai.kchtg.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class PortPlanningControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PortPlanningService portPlanningService;

    private PortPlanningResponse testResponse;
    private PortPlanningCreateRequest createRequest;
    private UUID testId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();

        testResponse = PortPlanningResponse.builder()
                .id(testId)
                .projectName("Quy hoạch Bến Cảng A giai đoạn 2")
                .approvalAuthority("Bộ Giao thông vận tải")
                .approvalDate(LocalDate.of(2025, 12, 15))
                .applicationScope("Khu vực Bắc Bến Cảng A")
                .mapScale("1/500")
                .status(PlanningStatus.EFFECTIVE)
                .filePath("/files/quy-hoach-a-gd2.pdf")
                .createdBy(UUID.randomUUID())
                .build();

        createRequest = PortPlanningCreateRequest.builder()
                .projectName("Quy hoạch Bến Cảng B giai đoạn 1")
                .approvalAuthority("Ủy ban nhân dân tỉnh")
                .approvalDate(LocalDate.of(2026, 1, 10))
                .applicationScope("Khu vực Nam Bến Cảng B")
                .mapScale("1/1000")
                .status(PlanningStatus.EFFECTIVE)
                .filePath("/files/quy-hoach-b-gd1.pdf")
                .createdBy(UUID.randomUUID())
                .build();
    }

    /**
     * Real principal for DataScopeAspect. PortPlanningController is class-level
     * @DataScope, so every request passes DataScopeAspect, which throws when the
     * authenticated principal's username has no row in the (empty, Flyway-disabled
     * test) database. When the principal IS a {@link User} instance the aspect uses
     * it directly (bypassing the DB lookup); an in-memory user with no org unit is
     * restricted to an empty scope, which only parameterises the Hibernate filter and
     * does not affect this suite (PortPlanningService is mocked). ROLE_SYSTEM_ADMIN
     * satisfies the @PreAuthorize checks, mirroring the old @WithMockUser authority.
     */
    @BeforeEach
    void setUpSecurityContext() {
        User principal = new User();
        principal.setUsername("portplanning-qa-user");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listPlans_shouldReturnAll() throws Exception {
        when(portPlanningService.findAll(anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(testResponse), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/port-planning")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].projectName").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }

    @Test
    void createPlan_shouldReturnCreated() throws Exception {
        when(portPlanningService.create(any(PortPlanningCreateRequest.class)))
                .thenReturn(testResponse);

        mockMvc.perform(post("/api/v1/port-planning")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.projectName").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }

    @Test
    void getPlan_shouldReturnOne() throws Exception {
        when(portPlanningService.getById(testId)).thenReturn(testResponse);

        mockMvc.perform(get("/api/v1/port-planning/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projectName").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }

    @Test
    void updatePlan_shouldReturnUpdated() throws Exception {
        PortPlanningResponse updated = PortPlanningResponse.builder()
                .id(testId)
                .projectName("Quy hoạch Bến Cảng A giai đoạn 2 - Đã sửa đổi")
                .build();
        when(portPlanningService.update(eq(testId), any(PortPlanningCreateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/v1/port-planning/" + testId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.projectName").value("Quy hoạch Bến Cảng A giai đoạn 2 - Đã sửa đổi"));
    }

    @Test
    void deletePlan_shouldReturnOk() throws Exception {
        doNothing().when(portPlanningService).delete(testId);

        mockMvc.perform(delete("/api/v1/port-planning/" + testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void filterByStatus_shouldReturnMatchingPlans() throws Exception {
        when(portPlanningService.findByStatus(any(PlanningStatus.class)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/port-planning/status/EFFECTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void searchByName_shouldReturnMatchingPlans() throws Exception {
        when(portPlanningService.searchByProjectNameContaining("Bến Cảng A", 0, 20))
                .thenReturn(new PageImpl<>(List.of(testResponse)));

        mockMvc.perform(get("/api/v1/port-planning/name-search")
                        .param("keyword", "Bến Cảng A")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].projectName").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }

    @Test
    void filterByDateRange_shouldReturnMatchingPlans() throws Exception {
        when(portPlanningService.findByApprovalDateBetween(
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31)))
                .thenReturn(List.of(testResponse));

        mockMvc.perform(get("/api/v1/port-planning/date-range")
                        .param("start", "2025-01-01")
                        .param("end", "2025-12-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].approvalDate").value("2025-12-15"));
    }

    @Test
    void searchPlans_withKeyword_shouldReturnResults() throws Exception {
        LookupResultResponse searchResult = LookupResultResponse.builder()
                .results(List.of(testResponse))
                .totalElements(1L)
                .totalPages(1)
                .currentPage(0)
                .pageSize(20)
                .build();

        when(portPlanningService.traCuu(
                eq("Bến Cảng A"), eq("EFFECTIVE"), eq(LocalDate.of(2025, 1, 1)), eq(LocalDate.of(2025, 12, 31)), eq(0), eq(20)))
                .thenReturn(searchResult);

        mockMvc.perform(get("/api/v1/port-planning/search")
                        .param("keyword", "Bến Cảng A")
                        .param("status", "EFFECTIVE")
                        .param("yearStart", "2025-01-01")
                        .param("yearEnd", "2025-12-31")
                        .param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.results[0].projectName").value("Quy hoạch Bến Cảng A giai đoạn 2"));
    }
}
