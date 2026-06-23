package com.hanghai.kchtg.integration;

import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.dataconnection.repository.SyncLogRepository;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.integration.entity.CargoAggregate;
import com.hanghai.kchtg.integration.entity.PortStatus;
import com.hanghai.kchtg.integration.repository.CargoAggregateRepository;
import com.hanghai.kchtg.integration.repository.PortStatusRepository;
import com.hanghai.kchtg.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
@ActiveProfiles("test")
class PortCargoShareControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private PointObjectRepository pointRepository;

    @MockBean
    private LineObjectRepository lineRepository;

    @MockBean
    private PolygonObjectRepository polygonRepository;

    @MockBean
    private PortStatusRepository portStatusRepository;

    @MockBean
    private CargoAggregateRepository cargoRepository;

    @MockBean
    private DataConnectionRepository connectionRepository;

    @MockBean
    private SyncLogRepository syncLogRepository;

    private static final String VALID_TOKEN = "integration-secret-token-2026";

    @BeforeEach
    void setUp() {
        // Setup empty collections by default
        when(pointRepository.findAll()).thenReturn(Collections.emptyList());
        when(lineRepository.findAll()).thenReturn(Collections.emptyList());
        when(polygonRepository.findAll()).thenReturn(Collections.emptyList());
        when(connectionRepository.findAll()).thenReturn(Collections.emptyList());
        when(syncLogRepository.findAll()).thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("Should return 401 when token is missing")
    void missingToken_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/integration/share/ports/status")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET /ports/status — should return port status page")
    void getPortStatuses_success() throws Exception {
        PortStatus status = PortStatus.builder()
                .portCode("PIER-HPH-001")
                .portName("Hai Phong")
                .berthCount(10)
                .operationalStatus("ACTIVE")
                .currentCapacityTons(500000.0)
                .build();

        when(portStatusRepository.findAll(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(status)));

        mockMvc.perform(get("/api/v1/integration/share/ports/status")
                        .header("X-Integration-Token", VALID_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].portCode").value("PIER-HPH-001"))
                .andExpect(jsonPath("$.data.content[0].operationalStatus").value("ACTIVE"));
    }

    @Test
    @DisplayName("GET /assets/status — should return summary metrics")
    void getAssetStatus_success() throws Exception {
        mockMvc.perform(get("/api/v1/integration/share/assets/status")
                        .header("X-Integration-Token", VALID_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalAssets").value(0));
    }

    @Test
    @DisplayName("GET /info/comprehensive — should return comprehensive system stats")
    void getComprehensiveInfo_success() throws Exception {
        DataConnection conn = new DataConnection();
        conn.setName("Test connection");
        conn.setStatus(com.hanghai.kchtg.dataconnection.enums.ConnectionStatus.ACTIVE);
        when(connectionRepository.findAll()).thenReturn(List.of(conn));

        mockMvc.perform(get("/api/v1/integration/share/info/comprehensive")
                        .header("X-Integration-Token", VALID_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalDataConnections").value(1));
    }

    @Test
    @DisplayName("GET /ports/cargo-total — should return annual aggregates")
    void getPortCargoTotal_success() throws Exception {
        CargoAggregate aggregate = CargoAggregate.builder()
                .portCode("PIER-HPH-001")
                .periodType("ANNUAL")
                .periodStart(LocalDate.of(2025, 1, 1))
                .periodEnd(LocalDate.of(2025, 12, 31))
                .totalTons(BigDecimal.valueOf(1000.0))
                .build();
        when(cargoRepository.findByPeriodType(eq("ANNUAL"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(aggregate)));

        mockMvc.perform(get("/api/v1/integration/share/ports/cargo-total")
                        .header("X-Integration-Token", VALID_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].portCode").value("PIER-HPH-001"))
                .andExpect(jsonPath("$.data.content[0].periodType").value("ANNUAL"));
    }

    @Test
    @DisplayName("GET /cargo/summary — should return custom cargo aggregates")
    void getCargoSummary_success() throws Exception {
        CargoAggregate aggregate = CargoAggregate.builder()
                .portCode("PIER-HPH-001")
                .periodType("MONTHLY")
                .periodStart(LocalDate.of(2026, 5, 1))
                .periodEnd(LocalDate.of(2026, 5, 31))
                .totalTons(BigDecimal.valueOf(200.0))
                .build();

        when(cargoRepository.findByPortCodeAndPeriodType(eq("PIER-HPH-001"), eq("MONTHLY"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(aggregate)));

        mockMvc.perform(get("/api/v1/integration/share/cargo/summary")
                        .param("portCode", "PIER-HPH-001")
                        .param("periodType", "MONTHLY")
                        .header("X-Integration-Token", VALID_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].portCode").value("PIER-HPH-001"))
                .andExpect(jsonPath("$.data.content[0].periodType").value("MONTHLY"));
    }
}
