package com.hanghai.kchtg.station;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.station.controller.CoastalStationLRITController;
import com.hanghai.kchtg.station.dto.lrit.CoastalStationLRITHistoryResponse;
import com.hanghai.kchtg.station.dto.lrit.CoastalStationLRITResponse;
import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.service.CoastalStationLRITService;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CoastalStationLRITController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class CoastalStationLRITControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoastalStationLRITService service;

    // Security & infrastructure beans required by @WebMvcTest
    @MockBean
    private AsyncLogAppender asyncLogAppender;
    @MockBean
    private AccessLogRepository accessLogRepository;
    @MockBean
    private UserRepository userRepository;
    @MockBean
    private AdminAuditLogRepository adminAuditLogRepository;
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

    private final String BASE = "/api/v1/stations/lrit";

    private CoastalStationLRIT makeEntity(UUID id) {
        CoastalStationLRIT entity = new CoastalStationLRIT();
        entity.setId(id);
        entity.setCode("LRIT-001");
        entity.setName("LRIT Station");
        entity.setTerminalId("T-001");
        entity.setImoNumber("IMO1234567");
        entity.setReportingInterval(360);
        entity.setAntennaHeight(15.0);
        entity.setPowerOutput(50.0);
        entity.setAntennaType("Parabolic");
        entity.setLocationAddress("789 Harbor Blvd");
        entity.setContactPerson("Alice Wang");
        entity.setContactPhone("+84555666777");
        entity.setDataFormat("AIS");
        entity.setCommunicationChannel("VHF Ch 16");
        entity.setCoverageArea("Territorial");
        entity.setIsActive(true);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0);
        return entity;
    }

    private CoastalStationLRITResponse makeResponse(UUID id) {
        return CoastalStationLRITResponse.builder()
                .id(id)
                .stationCode("LRIT-001")
                .stationName("LRIT Station")
                .terminalId("T-001")
                .imoNumber("IMO1234567")
                .reportingInterval(360)
                .antennaHeight(15.0)
                .powerOutput(50.0)
                .antennaType("Parabolic")
                .locationAddress("789 Harbor Blvd")
                .contactPerson("Alice Wang")
                .contactPhone("+84555666777")
                .dataFormat("AIS")
                .communicationChannel("VHF Ch 16")
                .coverageArea("Territorial")
                .status(StationStatus.PENDING_APPROVAL)
                .approvalStatus(StationApprovalStatus.PENDING)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/stations/lrit/create — creates station and returns 200")
    void testCreate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationLRIT entity = makeEntity(id);
        when(service.createStation(any())).thenReturn(entity);

        String json = """
                {
                  "stationCode": "LRIT-001",
                  "stationName": "LRIT Station",
                  "terminalId": "T-001",
                  "imoNumber": "IMO1234567",
                  "reportingInterval": 360,
                  "antennaHeight": 15.0,
                  "powerOutput": 50.0,
                  "antennaType": "Parabolic",
                  "locationAddress": "789 Harbor Blvd",
                  "contactPerson": "Alice Wang",
                  "contactPhone": "+84555666777",
                  "dataFormat": "AIS",
                  "communicationChannel": "VHF Ch 16",
                  "coverageArea": "Territorial"
                }
                """;

        mockMvc.perform(post(BASE + "/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("LRIT-001"))
                .andExpect(jsonPath("$.name").value("LRIT Station"));

        verify(service).createStation(any());
    }

    @Test
    @DisplayName("PUT /api/v1/stations/lrit/{id} — updates station and returns 200")
    void testUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationLRIT entity = makeEntity(id);
        entity.setName("Updated LRIT");
        when(service.updateStation(eq(id), any())).thenReturn(entity);

        String json = """
                {
                  "stationCode": "LRIT-001",
                  "stationName": "Updated LRIT",
                  "terminalId": "T-001",
                  "imoNumber": "IMO1234567",
                  "reportingInterval": 360,
                  "antennaHeight": 15.0,
                  "powerOutput": 50.0,
                  "antennaType": "Parabolic",
                  "locationAddress": "789 Harbor Blvd",
                  "contactPerson": "Alice Wang",
                  "contactPhone": "+84555666777",
                  "dataFormat": "AIS",
                  "communicationChannel": "VHF Ch 16",
                  "coverageArea": "Territorial"
                }
                """;

        mockMvc.perform(put(BASE + "/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated LRIT"));

        verify(service).updateStation(eq(id), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/stations/lrit/{id} — soft-deletes and returns 204")
    void testDelete() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete(BASE + "/{id}", id))
                .andExpect(status().isNoContent());

        verify(service).deleteStation(id);
    }

    @Test
    @DisplayName("GET /api/v1/stations/lrit/{id} — returns 200 with response DTO")
    void testGetById() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationLRITResponse resp = makeResponse(id);
        when(service.getStationById(id)).thenReturn(makeEntity(id));
        when(service.buildResponse(any())).thenReturn(resp);

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stationCode").value("LRIT-001"))
                .andExpect(jsonPath("$.stationName").value("LRIT Station"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/lrit/{id} — returns 404 when not found")
    void testGetByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getStationById(id)).thenThrow(new EntityNotFoundException("Not found"));

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/stations/lrit/list — returns 200 with list")
    void testGetAll() throws Exception {
        CoastalStationLRIT entity = makeEntity(UUID.randomUUID());
        when(service.getAllStations()).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("LRIT-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/lrit/search — returns 200 with results")
    void testSearch() throws Exception {
        CoastalStationLRIT entity = makeEntity(UUID.randomUUID());
        when(service.searchStations("LRIT")).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/search")
                        .param("keyword", "LRIT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("LRIT-001"));

        verify(service).searchStations("LRIT");
    }

    @Test
    @DisplayName("POST /api/v1/stations/lrit/{id}/approve — approves and returns 200")
    void testApprove() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationLRIT entity = makeEntity(id);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1);
        entity.setApprovalStatus(StationApprovalStatus.APPROVED_L1);
        entity.setStatus(StationStatus.APPROVED_L1);
        when(service.approveStation(eq(id), eq(true), any(Long.class))).thenReturn(entity);

        String json = """
                {
                  "approved": true,
                  "rejectionReason": null
                }
                """;

        mockMvc.perform(post(BASE + "/{id}/approve", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalLevel").value(1));
    }

    @Test
    @DisplayName("POST /api/v1/stations/lrit/{id}/reject — rejects and returns 200")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationLRIT entity = makeEntity(id);
        entity.setRejectionReason("Terminal not verified");
        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        when(service.rejectStation(eq(id), anyString(), any(Long.class))).thenReturn(entity);

        String json = """
                {
                  "approved": false,
                  "rejectionReason": "Terminal not verified"
                }
                """;

        mockMvc.perform(post(BASE + "/{id}/reject", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rejectionReason").value("Terminal not verified"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/lrit/{id}/history — returns 200 with list")
    void testGetHistory() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationLRITHistoryResponse history = new CoastalStationLRITHistoryResponse();
        history.setId(UUID.randomUUID());
        history.setStationCode("LRIT-001");
        when(service.getHistory(id)).thenReturn(List.of(history));

        mockMvc.perform(get(BASE + "/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stationCode").value("LRIT-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/lrit/by-terminal/{terminalId} — returns 200 when found")
    void testFindByTerminalId() throws Exception {
        CoastalStationLRIT entity = makeEntity(UUID.randomUUID());
        when(service.findByTerminalId("T-001")).thenReturn(Optional.of(entity));

        mockMvc.perform(get(BASE + "/by-terminal/{terminalId}", "T-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("LRIT-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/lrit/by-terminal/{terminalId} — returns 404 when not found")
    void testFindByTerminalIdNotFound() throws Exception {
        when(service.findByTerminalId("UNKNOWN")).thenReturn(Optional.empty());

        mockMvc.perform(get(BASE + "/by-terminal/{terminalId}", "UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/stations/lrit/by-imo/{imoNumber} — returns 200 when found")
    void testFindByImoNumber() throws Exception {
        CoastalStationLRIT entity = makeEntity(UUID.randomUUID());
        when(service.findByImoNumber("IMO1234567")).thenReturn(Optional.of(entity));

        mockMvc.perform(get(BASE + "/by-imo/{imoNumber}", "IMO1234567"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("LRIT-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/lrit/by-imo/{imoNumber} — returns 404 when not found")
    void testFindByImoNumberNotFound() throws Exception {
        when(service.findByImoNumber("UNKNOWN")).thenReturn(Optional.empty());

        mockMvc.perform(get(BASE + "/by-imo/{imoNumber}", "UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/stations/lrit/create — returns 400 for invalid body")
    void testCreateValidationError() throws Exception {
        String invalidJson = """
                {
                  "reportingInterval": "not-a-number"
                }
                """;

        mockMvc.perform(post(BASE + "/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }
}
