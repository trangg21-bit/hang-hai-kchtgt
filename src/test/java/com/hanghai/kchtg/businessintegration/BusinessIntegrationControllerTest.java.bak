package com.hanghai.kchtg.businessintegration;

import com.hanghai.kchtg.businessintegration.controller.BusinessIntegrationController;
import com.hanghai.kchtg.businessintegration.dto.BusinessIntegrationStatistics;
import com.hanghai.kchtg.businessintegration.dto.BusinessIntegrationSummary;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationRequest;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationResponse;
import com.hanghai.kchtg.businessintegration.enums.IntegrationStatus;
import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import com.hanghai.kchtg.businessintegration.service.BusinessIntegrationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.security.JwtUtil;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BusinessIntegrationController.class)
@AutoConfigureMockMvc(addFilters = false)
class BusinessIntegrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BusinessIntegrationService integrationService;

    @MockBean
    private AsyncLogAppender asyncLogAppender;

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
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @Test
    void createIntegration_shouldReturnOk() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setId("test-001");
        response.setIntegrationType("TAU_BIEN_RA_VAO_CANG");
        response.setStatus("PENDING");
        when(integrationService.createIntegration(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/business-integrations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"integrationType\":\"TAU_BIEN_RA_VAO_CANG\",\"sourceSystem\":\"SHIP-MANAGER\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("test-001"))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void findByType_shouldReturnList() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setIntegrationType("TAU_BIEN_RA_VAO_CANG");
        response.setStatus("SUCCESS");
        when(integrationService.findByType(IntegrationType.TAU_BIEN_RA_VAO_CANG))
            .thenReturn(List.of(response));
        mockMvc.perform(get("/api/v1/business-integrations/type/TAU_BIEN_RA_VAO_CANG"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("SUCCESS"));
    }

    @Test
    void findByStatus_shouldReturnList() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setStatus("PENDING");
        when(integrationService.findByStatus(IntegrationStatus.PENDING))
            .thenReturn(List.of(response));
        mockMvc.perform(get("/api/v1/business-integrations/status/PENDING"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void findById_shouldReturnOk() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setId("test-001");
        response.setStatus("SUCCESS");
        when(integrationService.findById("test-001")).thenReturn(response);
        mockMvc.perform(get("/api/v1/business-integrations/test-001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("test-001"));
    }

    @Test
    void findById_shouldReturnNotFound() throws Exception {
        when(integrationService.findById("non-existent")).thenReturn(null);
        mockMvc.perform(get("/api/v1/business-integrations/non-existent"))
            .andExpect(status().isNotFound());
    }

    @Test
    void processIntegration_shouldReturnOk() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setStatus("SUCCESS");
        when(integrationService.processIntegration("test-001")).thenReturn(response);
        mockMvc.perform(post("/api/v1/business-integrations/test-001/process"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    void getStatistics_shouldReturnStats() throws Exception {
        BusinessIntegrationStatistics stats = new BusinessIntegrationStatistics();
        stats.setTotalCount(10L);
        stats.setSuccessCount(7L);
        stats.setSuccessRate(70.0);
        when(integrationService.getStatistics()).thenReturn(stats);
        mockMvc.perform(get("/api/v1/business-integrations/statistics"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCount").value(10))
            .andExpect(jsonPath("$.successRate").value(70.0));
    }

    @Test
    void integrationType_shouldMapToEnum() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setIntegrationType("KHOI_LUONG_HANG_HOA_THEO_THANG");
        when(integrationService.findByType(IntegrationType.KHOI_LUONG_HANG_HOA_THEO_THANG))
            .thenReturn(List.of(response));
        mockMvc.perform(get("/api/v1/business-integrations/type/KHOI_LUONG_HANG_HOA_THEO_THANG"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].integrationType").value("KHOI_LUONG_HANG_HOA_THEO_THANG"));
    }

    @Test
    void getStatistics_shouldReturnZeroRateForEmpty() throws Exception {
        BusinessIntegrationStatistics stats = new BusinessIntegrationStatistics();
        stats.setTotalCount(0L);
        stats.setSuccessRate(0.0);
        when(integrationService.getStatistics()).thenReturn(stats);
        mockMvc.perform(get("/api/v1/business-integrations/statistics"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCount").value(0))
            .andExpect(jsonPath("$.successRate").value(0.0));
    }
}
