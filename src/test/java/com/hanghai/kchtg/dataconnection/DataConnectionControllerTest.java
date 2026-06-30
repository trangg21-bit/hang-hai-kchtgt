package com.hanghai.kchtg.dataconnection;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.dataconnection.controller.DataConnectionController;
import com.hanghai.kchtg.dataconnection.dto.*;
import com.hanghai.kchtg.dataconnection.entity.ConnectionHealth;
import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import com.hanghai.kchtg.dataconnection.enums.*;
import com.hanghai.kchtg.dataconnection.repository.SyncLogRepository;
import com.hanghai.kchtg.dataconnection.service.ConnectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class DataConnectionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConnectionService connectionService;

    @MockBean
    private SyncLogRepository syncLogRepository;

    private UUID testId;
    private ConnectionResponse sampleResponse;
    private CreateConnectionRequest createRequest;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.of(2026, 6, 15, 10, 0);

        sampleResponse = ConnectionResponse.builder()
                .id(testId)
                .name("Hệ thống hải quan")
                .code("DC-HQ")
                .targetSystem("Hải quan điện tử")
                .connectionType(ConnectionType.REST)
                .endpointUrl("https://api.customs.example.gov.vn")
                .authType(AuthType.TOKEN)
                .syncFrequency(SyncFrequency.REALTIME)
                .status(ConnectionStatus.ACTIVE)
                .lastSyncAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();

        createRequest = new CreateConnectionRequest();
        createRequest.setName("Hệ thống tài chính");
        createRequest.setCode("DC-FIN");
        createRequest.setTargetSystem("Hệ thống tài chính");
        createRequest.setConnectionType(ConnectionType.SOAP);
        createRequest.setEndpointUrl("https://finance.example.vn/api");
        createRequest.setAuthType(AuthType.BASIC);
        createRequest.setCredentials("user:pass123");
        createRequest.setSyncFrequency(SyncFrequency.DAILY);
    }

    // ── GET /api/data-connections ──────────────────────────────────────

    @Test
    void listAll_shouldReturnAllConnections() throws Exception {
        when(connectionService.listAll()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/data-connections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].name").value("Hệ thống hải quan"))
                .andExpect(jsonPath("$.data[0].code").value("DC-HQ"))
                .andExpect(jsonPath("$.data[0].connectionType").value("REST"));
    }

    @Test
    void listAll_empty_shouldReturnEmptyList() throws Exception {
        when(connectionService.listAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/data-connections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ── GET /api/data-connections/{id} ─────────────────────────────────

    @Test
    void getById_shouldReturnConnection() throws Exception {
        when(connectionService.getById(testId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/data-connections/{id}", testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Hệ thống hải quan"))
                .andExpect(jsonPath("$.data.targetSystem").value("Hải quan điện tử"));
    }

    // ── POST /api/data-connections ─────────────────────────────────────

    @Test
    void create_shouldReturnCreated() throws Exception {
        when(connectionService.create(any(CreateConnectionRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/data-connections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Hệ thống hải quan"));
    }

    @Test
    void create_shouldReturnBadRequestOnMissingFields() throws Exception {
        String invalidJson = "{}";

        mockMvc.perform(post("/api/data-connections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    // ── PUT /api/data-connections/{id} ─────────────────────────────────

    @Test
    void update_shouldReturnUpdated() throws Exception {
        UpdateConnectionRequest updateRequest = new UpdateConnectionRequest();
        updateRequest.setName("Cập nhật tên");
        updateRequest.setStatus(ConnectionStatus.ACTIVE);

        ConnectionResponse updated = ConnectionResponse.builder()
                .id(testId)
                .name("Cập nhật tên")
                .code("DC-HQ")
                .targetSystem("Hải quan")
                .connectionType(ConnectionType.REST)
                .authType(AuthType.TOKEN)
                .syncFrequency(SyncFrequency.REALTIME)
                .status(ConnectionStatus.ACTIVE)
                .build();

        when(connectionService.update(eq(testId), any(UpdateConnectionRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/data-connections/{id}", testId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Cập nhật tên"));
    }

    // ── DELETE /api/data-connections/{id} ──────────────────────────────

    @Test
    void delete_shouldReturnNoContent() throws Exception {
        doNothing().when(connectionService).delete(testId);

        mockMvc.perform(delete("/api/data-connections/{id}", testId))
                .andExpect(status().isNoContent())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ── POST /api/data-connections/{id}/health ─────────────────────────

    @Test
    void runHealthCheck_shouldReturnHealth() throws Exception {
        ConnectionHealth health = new ConnectionHealth();
        health.setConnectionId(testId);
        health.setStatusCode(200);
        health.setLatencyMs(45L);
        health.setCheckedAt(LocalDateTime.now());
        health.setErrorMessage(null);

        when(connectionService.healthCheck(testId)).thenReturn(health);

        mockMvc.perform(post("/api/data-connections/{id}/health", testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.statusCode").value(200))
                .andExpect(jsonPath("$.data.latencyMs").value(45));
    }

    // ── GET /api/data-connections/{id}/health ──────────────────────────

    @Test
    void getHealthHistory_shouldReturnList() throws Exception {
        ConnectionHealth health = new ConnectionHealth();
        health.setStatusCode(200);
        health.setLatencyMs(30L);
        health.setErrorMessage(null);

        when(connectionService.getHealthHistory(eq(testId), eq(24)))
                .thenReturn(List.of(health));

        mockMvc.perform(get("/api/data-connections/{id}/health", testId)
                        .param("hours", "24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].statusCode").value(200));
    }

    @Test
    void getHealthHistory_customHours_shouldWork() throws Exception {
        when(connectionService.getHealthHistory(eq(testId), eq(48)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/data-connections/{id}/health", testId)
                        .param("hours", "48"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ── GET /api/data-connections/summary ──────────────────────────────

    @Test
    void getHealthSummary_shouldReturnSummaryStats() throws Exception {
        ConnectionResponse active = sampleResponse;
        ConnectionResponse error = ConnectionResponse.builder()
                .id(UUID.randomUUID())
                .name("Down connection")
                .code("DC-ERR")
                .targetSystem("Down")
                .connectionType(ConnectionType.REST)
                .authType(AuthType.NONE)
                .syncFrequency(SyncFrequency.MANUAL)
                .status(ConnectionStatus.ERROR)
                .build();

        when(connectionService.listAll()).thenReturn(List.of(active, error));

        mockMvc.perform(get("/api/data-connections/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.healthy").value(1))
                .andExpect(jsonPath("$.data.down").value(1))
                .andExpect(jsonPath("$.data.unknown").value(0))
                .andExpect(jsonPath("$.data.avgUptime").value(50.0));
    }

    @Test
    void getHealthSummary_empty_shouldReturnZeros() throws Exception {
        when(connectionService.listAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/data-connections/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(0))
                .andExpect(jsonPath("$.data.healthy").value(0))
                .andExpect(jsonPath("$.data.down").value(0))
                .andExpect(jsonPath("$.data.avgUptime").value(100.0));
    }

    // ── GET /api/data-connections/{id}/sync-log ────────────────────────

    @Test
    void getSyncHistory_shouldReturnLogs() throws Exception {
        SyncLog syncLog = new SyncLog();
        syncLog.setConnectionId(testId);
        syncLog.setStartTime(LocalDateTime.now());
        syncLog.setStatus(SyncLog.SyncStatus.COMPLETED);
        syncLog.setRecordsProcessed(100);
        syncLog.setRecordsFailed(0);

        when(syncLogRepository.findByConnectionIdOrderByStartTimeDesc(testId))
                .thenReturn(List.of(syncLog));

        mockMvc.perform(get("/api/data-connections/{id}/sync-log", testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].recordsProcessed").value(100));
    }

    @Test
    void getSyncHistory_empty_shouldReturnEmptyArray() throws Exception {
        when(syncLogRepository.findByConnectionIdOrderByStartTimeDesc(testId))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/data-connections/{id}/sync-log", testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ── POST /api/data-connections/{id}/test ───────────────────────────

    @Test
    void testConnection_shouldReturnResult() throws Exception {
        ConnectionHealth health = new ConnectionHealth();
        health.setStatusCode(200);
        health.setLatencyMs(50L);
        health.setErrorMessage(null);

        when(connectionService.healthCheck(testId)).thenReturn(health);

        mockMvc.perform(post("/api/data-connections/{id}/test", testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.responseTimeMs").value(50));
    }

    @Test
    void testConnection_withNullBody_shouldWork() throws Exception {
        ConnectionHealth health = new ConnectionHealth();
        health.setStatusCode(200);
        health.setLatencyMs(30L);
        health.setErrorMessage(null);

        when(connectionService.healthCheck(testId)).thenReturn(health);

        mockMvc.perform(post("/api/data-connections/{id}/test", testId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(true));
    }
}
