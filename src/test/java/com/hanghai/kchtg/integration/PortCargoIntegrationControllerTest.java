package com.hanghai.kchtg.integration;

import com.hanghai.kchtg.integration.controller.PortCargoIntegrationController;
import com.hanghai.kchtg.integration.entity.IntegrationSyncJob;
import com.hanghai.kchtg.integration.service.PortCargoIntegrationService;
import com.hanghai.kchtg.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PortCargoIntegrationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private PortCargoIntegrationService integrationService;

    private IntegrationSyncJob mockJob;
    private UUID jobId;

    @BeforeEach
    void setUp() {
        jobId = UUID.randomUUID();
        mockJob = IntegrationSyncJob.builder()
                .featureCode("F-227")
                .sourceUrl("http://localhost/api/sync")
                .status(IntegrationSyncJob.SyncStatus.RUNNING)
                .startedAt(LocalDateTime.now())
                .retryCount(0)
                .build();
        mockJob.setId(jobId);
    }

    @Test
    @DisplayName("Should return 401/403 when unauthenticated")
    void syncEndpoint_unauthenticated_forbiddenOrUnauthorized() throws Exception {
        mockMvc.perform(post("/api/v1/integration/kchtgt/berth/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("Should return 403 when user is not ADMIN")
    void syncEndpoint_insufficientRoles_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/integration/kchtgt/berth/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /berth/sync — should trigger sync job successfully for ADMIN")
    void syncBerth_admin_success() throws Exception {
        when(integrationService.executeSync(eq("F-227"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/berth/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.syncId").value(jobId.toString()))
                .andExpect(jsonPath("$.data.status").value("accepted"));
    }

    @Test
    @WithMockUser(roles = "SYSTEM_ADMIN")
    @DisplayName("POST /wharf/sync — should trigger sync job successfully for SYSTEM_ADMIN")
    void syncWharf_systemAdmin_success() throws Exception {
        mockJob.setFeatureCode("F-228");
        when(integrationService.executeSync(eq("F-228"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/wharf/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.syncId").value(jobId.toString()))
                .andExpect(jsonPath("$.data.status").value("accepted"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /buoy/sync — should trigger sync job successfully")
    void syncBuoy_success() throws Exception {
        mockJob.setFeatureCode("F-229");
        when(integrationService.executeSync(eq("F-229"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/buoy/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /danger-zone/sync — should trigger sync job successfully")
    void syncDangerZone_success() throws Exception {
        mockJob.setFeatureCode("F-230");
        when(integrationService.executeSync(eq("F-230"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/danger-zone/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /transport-zone/sync — should trigger sync job successfully")
    void syncTransportZone_success() throws Exception {
        mockJob.setFeatureCode("F-231");
        when(integrationService.executeSync(eq("F-231"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/transport-zone/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /anchorage/sync — should trigger sync job successfully")
    void syncAnchorage_success() throws Exception {
        mockJob.setFeatureCode("F-232");
        when(integrationService.executeSync(eq("F-232"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/anchorage/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /repair-facility/sync — should trigger sync job successfully")
    void syncRepairFacility_success() throws Exception {
        mockJob.setFeatureCode("F-233");
        when(integrationService.executeSync(eq("F-233"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/repair-facility/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /beacon-info/sync — should trigger sync job successfully")
    void syncBeaconInfo_success() throws Exception {
        mockJob.setFeatureCode("F-234");
        when(integrationService.executeSync(eq("F-234"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/beacon-info/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /buoy-signal/sync — should trigger sync job successfully")
    void syncBuoySignal_success() throws Exception {
        mockJob.setFeatureCode("F-235");
        when(integrationService.executeSync(eq("F-235"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/buoy-signal/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vts/sync — should trigger sync job successfully")
    void syncVts_success() throws Exception {
        mockJob.setFeatureCode("F-236");
        when(integrationService.executeSync(eq("F-236"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vts/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vts/operations/sync — should trigger sync job successfully")
    void syncVtsOperations_success() throws Exception {
        mockJob.setFeatureCode("F-237");
        when(integrationService.executeSync(eq("F-237"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vts/operations/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /radar/sync — should trigger sync job successfully")
    void syncRadar_success() throws Exception {
        mockJob.setFeatureCode("F-238");
        when(integrationService.executeSync(eq("F-238"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/radar/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /ais/sync — should trigger sync job successfully")
    void syncAis_success() throws Exception {
        mockJob.setFeatureCode("F-239");
        when(integrationService.executeSync(eq("F-239"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/ais/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /cctv/sync — should trigger sync job successfully")
    void syncCctv_success() throws Exception {
        mockJob.setFeatureCode("F-240");
        when(integrationService.executeSync(eq("F-240"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/cctv/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /scada/sync — should trigger sync job successfully")
    void syncScada_success() throws Exception {
        mockJob.setFeatureCode("F-241");
        when(integrationService.executeSync(eq("F-241"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/scada/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vhf-info/sync — should trigger sync job successfully")
    void syncVhfInfo_success() throws Exception {
        mockJob.setFeatureCode("F-242");
        when(integrationService.executeSync(eq("F-242"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vhf-info/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /transmission/sync — should trigger sync job successfully")
    void syncTransmission_success() throws Exception {
        mockJob.setFeatureCode("F-243");
        when(integrationService.executeSync(eq("F-243"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/transmission/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vts-support/sync — should trigger sync job successfully")
    void syncVtsSupport_success() throws Exception {
        mockJob.setFeatureCode("F-244");
        when(integrationService.executeSync(eq("F-244"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vts-support/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /breakwater/sync — should trigger sync job successfully")
    void syncBreakwater_success() throws Exception {
        mockJob.setFeatureCode("F-245");
        when(integrationService.executeSync(eq("F-245"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/breakwater/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /cargo/sync — should trigger sync job successfully")
    void syncCargo_success() throws Exception {
        mockJob.setFeatureCode("F-246");
        when(integrationService.executeSync(eq("F-246"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/cargo/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /operation-center/ttdh/sync — should trigger sync job successfully")
    void syncOperationCenterTtdh_success() throws Exception {
        mockJob.setFeatureCode("F-247");
        when(integrationService.executeSync(eq("F-247"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/operation-center/ttdh/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /operation-center/inmarsat/sync — should trigger sync job successfully")
    void syncOperationCenterInmarsat_success() throws Exception {
        mockJob.setFeatureCode("F-248");
        when(integrationService.executeSync(eq("F-248"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/operation-center/inmarsat/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /operation-center/cospas-sarsat/sync — should trigger sync job successfully")
    void syncOperationCenterCospasSarsat_success() throws Exception {
        mockJob.setFeatureCode("F-249");
        when(integrationService.executeSync(eq("F-249"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/operation-center/cospas-sarsat/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /operation-center/lrit/sync — should trigger sync job successfully")
    void syncOperationCenterLrit_success() throws Exception {
        mockJob.setFeatureCode("F-250");
        when(integrationService.executeSync(eq("F-250"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/operation-center/lrit/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /operation-center/haiphong/sync — should trigger sync job successfully")
    void syncOperationCenterHaiphong_success() throws Exception {
        mockJob.setFeatureCode("F-251");
        when(integrationService.executeSync(eq("F-251"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/operation-center/haiphong/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /port-status/sync — should trigger sync job successfully")
    void syncPortStatus_success() throws Exception {
        mockJob.setFeatureCode("F-252");
        when(integrationService.executeSync(eq("F-252"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/port-status/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /electronic-chart/sync — should trigger sync job successfully")
    void syncElectronicChart_success() throws Exception {
        mockJob.setFeatureCode("F-253");
        when(integrationService.executeSync(eq("F-253"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/electronic-chart/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vessel/inbound-outbound/sync — should trigger sync job successfully")
    void syncVesselInboundOutbound_success() throws Exception {
        mockJob.setFeatureCode("F-254");
        when(integrationService.executeSync(eq("F-254"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vessel/inbound-outbound/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vessel/inland/sync — should trigger sync job successfully")
    void syncVesselInland_success() throws Exception {
        mockJob.setFeatureCode("F-255");
        when(integrationService.executeSync(eq("F-255"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vessel/inland/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vessel/foreign/sync — should trigger sync job successfully")
    void syncVesselForeign_success() throws Exception {
        mockJob.setFeatureCode("F-256");
        when(integrationService.executeSync(eq("F-256"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vessel/foreign/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vessel/international/sync — should trigger sync job successfully")
    void syncVesselInternational_success() throws Exception {
        mockJob.setFeatureCode("F-257");
        when(integrationService.executeSync(eq("F-257"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vessel/international/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /cargo/passenger/sync — should trigger sync job successfully")
    void syncCargoPassenger_success() throws Exception {
        mockJob.setFeatureCode("F-258");
        when(integrationService.executeSync(eq("F-258"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/cargo/passenger/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vessel-traffic/sync — should trigger sync job successfully")
    void syncVesselTraffic_success() throws Exception {
        mockJob.setFeatureCode("F-259");
        when(integrationService.executeSync(eq("F-259"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vessel-traffic/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /cargo/domestic/sync — should trigger sync job successfully")
    void syncCargoDomestic_success() throws Exception {
        mockJob.setFeatureCode("F-260");
        when(integrationService.executeSync(eq("F-260"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/cargo/domestic/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /cargo/managed-area/sync — should trigger sync job successfully")
    void syncCargoManagedArea_success() throws Exception {
        mockJob.setFeatureCode("F-261");
        when(integrationService.executeSync(eq("F-261"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/cargo/managed-area/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /pilot/sync — should trigger sync job successfully")
    void syncPilot_success() throws Exception {
        mockJob.setFeatureCode("F-262");
        when(integrationService.executeSync(eq("F-262"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/pilot/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vessel/vietnamese/sync — should trigger sync job successfully")
    void syncVesselVietnamese_success() throws Exception {
        mockJob.setFeatureCode("F-263");
        when(integrationService.executeSync(eq("F-263"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vessel/vietnamese/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /vessel/pilot-boat/sync — should trigger sync job successfully")
    void syncVesselPilotBoat_success() throws Exception {
        mockJob.setFeatureCode("F-264");
        when(integrationService.executeSync(eq("F-264"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/vessel/pilot-boat/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /dock-repair/sync — should trigger sync job successfully")
    void syncDockRepair_success() throws Exception {
        mockJob.setFeatureCode("F-265");
        when(integrationService.executeSync(eq("F-265"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/dock-repair/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /berth-capacity/sync — should trigger sync job successfully")
    void syncBerthCapacity_success() throws Exception {
        mockJob.setFeatureCode("F-266");
        when(integrationService.executeSync(eq("F-266"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/berth-capacity/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /port-capacity/sync — should trigger sync job successfully")
    void syncPortCapacity_success() throws Exception {
        mockJob.setFeatureCode("F-267");
        when(integrationService.executeSync(eq("F-267"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/port-capacity/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /cargo/monthly/sync — should trigger sync job successfully")
    void syncCargoMonthly_success() throws Exception {
        mockJob.setFeatureCode("F-268");
        when(integrationService.executeSync(eq("F-268"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/cargo/monthly/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /cargo/annual/sync — should trigger sync job successfully")
    void syncCargoAnnual_success() throws Exception {
        mockJob.setFeatureCode("F-269");
        when(integrationService.executeSync(eq("F-269"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/cargo/annual/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /transport-service/sync — should trigger sync job successfully")
    void syncTransportService_success() throws Exception {
        mockJob.setFeatureCode("F-270");
        when(integrationService.executeSync(eq("F-270"), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/transport-service/sync")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /sync/retry/{jobId} — should trigger retry successfully")
    void retrySync_success() throws Exception {
        when(integrationService.retrySyncJob(eq(jobId))).thenReturn(mockJob);

        mockMvc.perform(post("/api/v1/integration/kchtgt/sync/retry/" + jobId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.syncId").value(jobId.toString()))
                .andExpect(jsonPath("$.data.status").value("accepted"));
    }
}
