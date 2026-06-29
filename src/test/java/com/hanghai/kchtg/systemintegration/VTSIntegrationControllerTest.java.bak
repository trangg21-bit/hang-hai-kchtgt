package com.hanghai.kchtg.systemintegration;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.systemintegration.controller.VTSIntegrationController;
import com.hanghai.kchtg.systemintegration.dto.SystemIntegrationResponse;
import com.hanghai.kchtg.systemintegration.service.VTSIntegrationService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.PermissionRoleService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VTSIntegrationController.class)
@AutoConfigureMockMvc(addFilters = false)
class VTSIntegrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VTSIntegrationService vtsIntegrationService;

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

    @Test
    void integrateVTSData_shouldReturnOk() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setId("vts-001");
        response.setIntegrationType("HE_THONG_VTS");
        when(vtsIntegrationService.integrateVTSData(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/vts-integrations/vts-data")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceSystem\":\"VTS\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.integrationType").value("HE_THONG_VTS"));
    }

    @Test
    void integrateVTSOperationInfo_shouldReturnOk() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setId("vts-ops-001");
        response.setIntegrationType("TIN_DIEU_HANH_VTS");
        when(vtsIntegrationService.integrateVTSOperationInfo(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/vts-integrations/operation-info")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceSystem\":\"VTS-OPS\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.integrationType").value("TIN_DIEU_HANH_VTS"));
    }

    @Test
    void integrateRadarData_shouldReturnOk() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setId("radar-001");
        response.setIntegrationType("TRAM_RADAR");
        when(vtsIntegrationService.integrateRadarData(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/vts-integrations/radar")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceSystem\":\"RADAR\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.integrationType").value("TRAM_RADAR"));
    }

    @Test
    void integrateAISData_shouldReturnOk() throws Exception {
        SystemIntegrationResponse response = new SystemIntegrationResponse();
        response.setId("ais-001");
        response.setIntegrationType("HE_THONG_AIS");
        when(vtsIntegrationService.integrateAISData(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/vts-integrations/ais")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceSystem\":\"AIS\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.integrationType").value("HE_THONG_AIS"));
    }
}
