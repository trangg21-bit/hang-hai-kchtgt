package com.hanghai.kchtg.systemintegration;

import com.hanghai.kchtg.systemintegration.controller.SystemIntegrationController;
import com.hanghai.kchtg.systemintegration.dto.IntegrationStatistics;
import com.hanghai.kchtg.systemintegration.dto.IntegrationSummary;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationRequest;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationResponse;
import com.hanghai.kchtg.systemintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.systemintegration.enums.IntegrationType;
import com.hanghai.kchtg.systemintegration.service.SystemIntegrationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.PermissionRoleService;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SystemIntegrationController.class)
@AutoConfigureMockMvc(addFilters = false)
class SystemIntegrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SystemIntegrationService integrationService;

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
    private PermissionRoleService permissionRoleService;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    private SystemIntegrationRequest createRequest() {
        return new SystemIntegrationRequest(
            IntegrationType.HE_THONG_VTS, "VTS-SYS-001", "KCHTGT-CORE", "{\"data\":\"test\"}");
    }

    @Test
    void createIntegration_shouldReturnOk() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setId("test-001");
        response.setIntegrationType("HE_THONG_VTS");
        response.setStatus("PENDING");
        when(integrationService.createIntegration(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/integrations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"integrationType\":\"HE_THONG_VTS\",\"sourceSystem\":\"VTS\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("test-001"))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void findByType_shouldReturnList() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setIntegrationType("HE_THONG_VTS");
        response.setStatus("SUCCESS");
        when(integrationService.findByType(IntegrationType.HE_THONG_VTS))
            .thenReturn(List.of(response));
        mockMvc.perform(get("/api/v1/integrations/type/HE_THONG_VTS"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("SUCCESS"));
    }

    @Test
    void findByStatus_shouldReturnList() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setStatus("PENDING");
        when(integrationService.findByStatus(IntegrationStatus.PENDING))
            .thenReturn(List.of(response));
        mockMvc.perform(get("/api/v1/integrations/status/PENDING"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void findById_shouldReturnOk() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setId("test-001");
        response.setStatus("SUCCESS");
        when(integrationService.findById("test-001")).thenReturn(response);
        mockMvc.perform(get("/api/v1/integrations/test-001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("test-001"));
    }

    @Test
    void findById_shouldReturnNotFound() throws Exception {
        when(integrationService.findById("non-existent")).thenReturn(null);
        mockMvc.perform(get("/api/v1/integrations/non-existent"))
            .andExpect(status().isNotFound());
    }

    @Test
    void processIntegration_shouldReturnOk() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setStatus("SUCCESS");
        when(integrationService.processIntegration("test-001")).thenReturn(response);
        mockMvc.perform(post("/api/v1/integrations/test-001/process"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    void getStatistics_shouldReturnStats() throws Exception {
        IntegrationStatistics stats = new IntegrationStatistics();
        stats.setTotalCount(10L);
        stats.setSuccessCount(7L);
        stats.setSuccessRate(70.0);
        when(integrationService.getStatistics()).thenReturn(stats);
        mockMvc.perform(get("/api/v1/integrations/statistics"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCount").value(10))
            .andExpect(jsonPath("$.successRate").value(70.0));
    }

    @Test
    void integrationType_shouldMapToEnum() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setIntegrationType("HE_THONG_AIS");
        when(integrationService.findByType(IntegrationType.HE_THONG_AIS))
            .thenReturn(List.of(response));
        mockMvc.perform(get("/api/v1/integrations/type/HE_THONG_AIS"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].integrationType").value("HE_THONG_AIS"));
    }

    @Test
    void getIntegrationSummaries_shouldReturnSummaries() throws Exception {
        IntegrationStatistics stats = new IntegrationStatistics();
        stats.setTotalCount(27L);
        stats.setSuccessCount(20L);
        stats.setFailedCount(5L);
        when(integrationService.getStatistics()).thenReturn(stats);
        mockMvc.perform(get("/api/v1/integrations/statistics"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCount").value(27));
    }
}
