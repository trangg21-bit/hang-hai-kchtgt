package com.hanghai.kchtg.businessintegration;

import com.hanghai.kchtg.businessintegration.controller.VesselIntegrationController;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationRequest;
import com.hanghai.kchtg.businessintegration.dto.BusinessDataIntegrationResponse;
import com.hanghai.kchtg.businessintegration.enums.IntegrationType;
import com.hanghai.kchtg.businessintegration.service.VesselIntegrationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.security.JwtUtil;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VesselIntegrationController.class)
@AutoConfigureMockMvc(addFilters = false)
class VesselIntegrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VesselIntegrationService vesselService;

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
    void integrateShipArrivalDeparture_shouldReturnOk() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setId("vessel-001");
        response.setIntegrationType("TAU_BIEN_RA_VAO_CANG");
        when(vesselService.integrateShipArrivalDeparture(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/vessel-integrations/ship-arrival-departure")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceSystem\":\"SHIP-MANAGER\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.integrationType").value("TAU_BIEN_RA_VAO_CANG"));
    }

    @Test
    void integrateForeignShip_shouldReturnOk() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setId("vessel-002");
        response.setIntegrationType("TAU_BIEN_NUOC_NGOAI");
        when(vesselService.integrateForeignShip(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/vessel-integrations/foreign-ship")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceSystem\":\"FOREIGN-SYS\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.integrationType").value("TAU_BIEN_NUOC_NGOAI"));
    }

    @Test
    void integrateVNInternationalShip_shouldReturnOk() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setId("vessel-003");
        response.setIntegrationType("TAU_BIEN_VN_QUOC_TE");
        when(vesselService.integrateVNInternationalShip(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/vessel-integrations/vn-international-ship")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceSystem\":\"VN-INTL\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.integrationType").value("TAU_BIEN_VN_QUOC_TE"));
    }

    @Test
    void integrateTug_shouldReturnOk() throws Exception {
        BusinessDataIntegrationResponse response = new BusinessDataIntegrationResponse();
        response.setId("vessel-004");
        response.setIntegrationType("TAU_THUYEN_LAI_DAT");
        when(vesselService.integrateTug(any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/vessel-integrations/tug")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"sourceSystem\":\"TUG-SYS\",\"targetSystem\":\"KCHTGT\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.integrationType").value("TAU_THUYEN_LAI_DAT"));
    }
}
