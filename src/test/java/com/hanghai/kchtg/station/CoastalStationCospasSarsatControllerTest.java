package com.hanghai.kchtg.station;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.station.controller.CoastalStationCospasSarsatController;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatHistoryResponse;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatResponse;
import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.service.CoastalStationCospasSarsatService;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CoastalStationCospasSarsatController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class CoastalStationCospasSarsatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoastalStationCospasSarsatService service;

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

    private final String BASE = "/api/v1/stations/cospas-sarsat";

    private CoastalStationCospasSarsat makeEntity(UUID id) {
        CoastalStationCospasSarsat entity = new CoastalStationCospasSarsat();
        entity.setId(id);
        entity.setCode("COSPAS-001");
        entity.setName("Cospas-Sarsat Station");
        entity.setFrequency("406MHz");
        entity.setCoverageArea("Global");
        entity.setBeaconProtocol("COSPAS");
        entity.setEmergencyChannel("121.5MHz");
        entity.setAntennaType("Dipole");
        entity.setLocationAddress("456 Beacon Rd");
        entity.setContactPerson("Bob Smith");
        entity.setContactPhone("+84111222333");
        entity.setSignalRange(5000.0);
        entity.setOperatingMode("Automatic");
        entity.setIsActive(true);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0);
        return entity;
    }

    private CoastalStationCospasSarsatResponse makeResponse(UUID id) {
        return CoastalStationCospasSarsatResponse.builder()
                .id(id)
                .stationCode("COSPAS-001")
                .stationName("Cospas-Sarsat Station")
                .frequency("406MHz")
                .coverageArea("Global")
                .beaconProtocol("COSPAS")
                .emergencyChannel("121.5MHz")
                .antennaType("Dipole")
                .locationAddress("456 Beacon Rd")
                .contactPerson("Bob Smith")
                .contactPhone("+84111222333")
                .signalRange(5000.0)
                .operatingMode("Automatic")
                .status(StationStatus.PENDING_APPROVAL)
                .approvalStatus(StationApprovalStatus.PENDING)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/stations/cospas-sarsat/create — creates station and returns 200")
    void testCreate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationCospasSarsat entity = makeEntity(id);
        when(service.createStation(any())).thenReturn(entity);

        String json = """
                {
                  "stationCode": "COSPAS-001",
                  "stationName": "Cospas-Sarsat Station",
                  "frequency": "406MHz",
                  "coverageArea": "Global",
                  "beaconProtocol": "COSPAS",
                  "emergencyChannel": "121.5MHz",
                  "antennaType": "Dipole",
                  "locationAddress": "456 Beacon Rd",
                  "contactPerson": "Bob Smith",
                  "contactPhone": "+84111222333",
                  "signalRange": 5000.0,
                  "operatingMode": "Automatic"
                }
                """;

        mockMvc.perform(post(BASE + "/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("COSPAS-001"))
                .andExpect(jsonPath("$.name").value("Cospas-Sarsat Station"));

        verify(service).createStation(any());
    }

    @Test
    @DisplayName("PUT /api/v1/stations/cospas-sarsat/{id} — updates station and returns 200")
    void testUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationCospasSarsat entity = makeEntity(id);
        entity.setName("Updated Cospas");
        when(service.updateStation(eq(id), any())).thenReturn(entity);

        String json = """
                {
                  "stationCode": "COSPAS-001",
                  "stationName": "Updated Cospas",
                  "frequency": "406MHz",
                  "coverageArea": "Global",
                  "beaconProtocol": "COSPAS",
                  "emergencyChannel": "121.5MHz",
                  "antennaType": "Dipole",
                  "locationAddress": "456 Beacon Rd",
                  "contactPerson": "Bob Smith",
                  "contactPhone": "+84111222333",
                  "signalRange": 5000.0,
                  "operatingMode": "Automatic"
                }
                """;

        mockMvc.perform(put(BASE + "/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Cospas"));

        verify(service).updateStation(eq(id), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/stations/cospas-sarsat/{id} — soft-deletes and returns 204")
    void testDelete() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete(BASE + "/{id}", id))
                .andExpect(status().isNoContent());

        verify(service).deleteStation(id);
    }

    @Test
    @DisplayName("GET /api/v1/stations/cospas-sarsat/{id} — returns 200 with response DTO")
    void testGetById() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationCospasSarsatResponse resp = makeResponse(id);
        when(service.getStationById(id)).thenReturn(makeEntity(id));
        when(service.buildResponse(any())).thenReturn(resp);

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stationCode").value("COSPAS-001"))
                .andExpect(jsonPath("$.stationName").value("Cospas-Sarsat Station"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/cospas-sarsat/{id} — returns 404 when not found")
    void testGetByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getStationById(id)).thenThrow(new EntityNotFoundException("Not found"));

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/stations/cospas-sarsat/list — returns 200 with list")
    void testGetAll() throws Exception {
        CoastalStationCospasSarsat entity = makeEntity(UUID.randomUUID());
        when(service.getAllStations()).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("COSPAS-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/cospas-sarsat/search — returns 200 with results")
    void testSearch() throws Exception {
        CoastalStationCospasSarsat entity = makeEntity(UUID.randomUUID());
        when(service.searchStations("COSPAS")).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/search")
                        .param("keyword", "COSPAS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("COSPAS-001"));

        verify(service).searchStations("COSPAS");
    }

    @Test
    @DisplayName("POST /api/v1/stations/cospas-sarsat/{id}/approve — approves and returns 200")
    void testApprove() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationCospasSarsat entity = makeEntity(id);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1);
        entity.setApprovalStatus(StationApprovalStatus.APPROVED_L1);
        entity.setStatus(StationStatus.APPROVED_L1);
        when(service.approveStation(eq(id), eq(true), anyLong())).thenReturn(entity);

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
    @DisplayName("POST /api/v1/stations/cospas-sarsat/{id}/reject — rejects and returns 200")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationCospasSarsat entity = makeEntity(id);
        entity.setRejectionReason("Signal out of range");
        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        when(service.rejectStation(eq(id), anyString(), anyLong())).thenReturn(entity);

        String json = """
                {
                  "approved": false,
                  "rejectionReason": "Signal out of range"
                }
                """;

        mockMvc.perform(post(BASE + "/{id}/reject", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rejectionReason").value("Signal out of range"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/cospas-sarsat/{id}/history — returns 200 with list")
    void testGetHistory() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationCospasSarsatHistoryResponse history = new CoastalStationCospasSarsatHistoryResponse();
        history.setId(UUID.randomUUID());
        history.setStationCode("COSPAS-001");
        when(service.getHistory(id)).thenReturn(List.of(history));

        mockMvc.perform(get(BASE + "/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stationCode").value("COSPAS-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/cospas-sarsat/by-code/{code} — returns 200 when found")
    void testFindByCode() throws Exception {
        CoastalStationCospasSarsat entity = makeEntity(UUID.randomUUID());
        when(service.findByCode("COSPAS-001")).thenReturn(Optional.of(entity));

        mockMvc.perform(get(BASE + "/by-code/{code}", "COSPAS-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("COSPAS-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/cospas-sarsat/by-code/{code} — returns 404 when not found")
    void testFindByCodeNotFound() throws Exception {
        when(service.findByCode("UNKNOWN")).thenReturn(Optional.empty());

        mockMvc.perform(get(BASE + "/by-code/{code}", "UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/stations/cospas-sarsat/create — returns 400 for invalid body")
    void testCreateValidationError() throws Exception {
        String invalidJson = """
                {
                  "signalRange": "not-a-number"
                }
                """;

        mockMvc.perform(post(BASE + "/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }
}
