package com.hanghai.kchtg.station;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.station.controller.CoastalStationInmarsatController;
import com.hanghai.kchtg.station.dto.inmarsat.CoastalStationInmarsatHistoryResponse;
import com.hanghai.kchtg.station.dto.inmarsat.CoastalStationInmarsatResponse;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.service.CoastalStationInmarsatService;
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

@WebMvcTest(CoastalStationInmarsatController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class CoastalStationInmarsatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoastalStationInmarsatService service;

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

    private final String BASE = "/api/v1/stations/inmarsat";

    private CoastalStationInmarsat makeEntity(UUID id) {
        CoastalStationInmarsat entity = new CoastalStationInmarsat();
        entity.setId(id);
        entity.setDeviceCode("INM-001");
        entity.setCode("INM-001");
        entity.setName("Inmarsat Station");
        entity.setModemType("Capsat");
        entity.setFrequency("1.6GHz");
        entity.setCoverageZone("Pacific");
        entity.setSarCode("SAR-001");
        entity.setLocationAddress("123 Ocean Dr");
        entity.setContactPerson("Jane Doe");
        entity.setContactPhone("+84987654321");
        entity.setIsActive(true);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0);
        return entity;
    }

    private CoastalStationInmarsatResponse makeResponse(UUID id) {
        return CoastalStationInmarsatResponse.builder()
                .id(id)
                .deviceCode("INM-001")
                .stationName("Inmarsat Station")
                .modemType("Capsat")
                .frequency("1.6GHz")
                .coverageZone("Pacific")
                .sarCode("SAR-001")
                .locationAddress("123 Ocean Dr")
                .contactPerson("Jane Doe")
                .contactPhone("+84987654321")
                .status(StationStatus.PENDING_APPROVAL)
                .approvalStatus(StationApprovalStatus.PENDING)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/stations/inmarsat — creates station and returns 200")
    void testCreate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsat entity = makeEntity(id);
        when(service.createStation(any())).thenReturn(entity);

        String json = """
                {
                  "deviceCode": "INM-001",
                  "stationName": "Inmarsat Station",
                  "latitude": 10.0,
                  "longitude": 106.0,
                  "modemType": "Capsat",
                  "frequency": "1.6GHz",
                  "coverageZone": "Pacific",
                  "sarCode": "SAR-001",
                  "locationAddress": "123 Ocean Dr",
                  "contactPerson": "Jane Doe",
                  "contactPhone": "+84987654321"
                }
                """;

        mockMvc.perform(post(BASE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceCode").value("INM-001"))
                .andExpect(jsonPath("$.name").value("Inmarsat Station"));

        verify(service).createStation(any());
    }

    @Test
    @DisplayName("PUT /api/v1/stations/inmarsat/{id} — updates station and returns 200")
    void testUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsat entity = makeEntity(id);
        entity.setName("Updated Inmarsat");
        when(service.updateStation(eq(id), any())).thenReturn(entity);

        String json = """
                {
                  "deviceCode": "INM-001",
                  "stationName": "Updated Inmarsat",
                  "latitude": 10.0,
                  "longitude": 106.0,
                  "modemType": "Capsat",
                  "frequency": "1.6GHz",
                  "coverageZone": "Pacific",
                  "sarCode": "SAR-001",
                  "locationAddress": "123 Ocean Dr",
                  "contactPerson": "Jane Doe",
                  "contactPhone": "+84987654321"
                }
                """;

        mockMvc.perform(put(BASE + "/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Inmarsat"));

        verify(service).updateStation(eq(id), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/stations/inmarsat/{id} — soft-deletes and returns 204")
    void testDelete() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete(BASE + "/{id}", id))
                .andExpect(status().isNoContent());

        verify(service).deleteStation(id);
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat/{id} — returns 200 with response DTO")
    void testGetById() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsatResponse resp = makeResponse(id);
        when(service.getStationById(id)).thenReturn(makeEntity(id));
        when(service.buildResponse(any())).thenReturn(resp);

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceCode").value("INM-001"))
                .andExpect(jsonPath("$.stationName").value("Inmarsat Station"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat/{id} — returns 404 when not found")
    void testGetByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getStationById(id)).thenThrow(new EntityNotFoundException("Not found"));

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat/list — returns 200 with list")
    void testGetAll() throws Exception {
        CoastalStationInmarsat entity = makeEntity(UUID.randomUUID());
        when(service.getAllStations()).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].deviceCode").value("INM-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat/search — returns 200 with results")
    void testSearch() throws Exception {
        CoastalStationInmarsat entity = makeEntity(UUID.randomUUID());
        when(service.searchStations("INM")).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/search")
                        .param("keyword", "INM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].deviceCode").value("INM-001"));

        verify(service).searchStations("INM");
    }

    @Test
    @DisplayName("POST /api/v1/stations/inmarsat/{id}/approve — approves and returns 200")
    void testApprove() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsat entity = makeEntity(id);
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
    @DisplayName("POST /api/v1/stations/inmarsat/{id}/reject — rejects and returns 200")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsat entity = makeEntity(id);
        entity.setRejectionReason("Missing documentation");
        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        when(service.rejectStation(eq(id), anyString(), anyLong())).thenReturn(entity);

        String json = """
                {
                  "approved": false,
                  "rejectionReason": "Missing documentation"
                }
                """;

        mockMvc.perform(post(BASE + "/{id}/reject", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rejectionReason").value("Missing documentation"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat/{id}/history — returns 200 with list")
    void testGetHistory() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsatHistoryResponse history = new CoastalStationInmarsatHistoryResponse();
        history.setId(UUID.randomUUID());
        history.setDeviceCode("INM-001");
        when(service.getHistory(id)).thenReturn(List.of(history));

        mockMvc.perform(get(BASE + "/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].deviceCode").value("INM-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat/by-device/{code} — returns 200 when found")
    void testFindByDeviceCode() throws Exception {
        CoastalStationInmarsat entity = makeEntity(UUID.randomUUID());
        when(service.findByDeviceCode("INM-001")).thenReturn(Optional.of(entity));

        mockMvc.perform(get(BASE + "/by-device/{code}", "INM-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceCode").value("INM-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat/by-device/{code} — returns 404 when not found")
    void testFindByDeviceCodeNotFound() throws Exception {
        when(service.findByDeviceCode("UNKNOWN")).thenReturn(Optional.empty());

        mockMvc.perform(get(BASE + "/by-device/{code}", "UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/stations/inmarsat — returns 400 for invalid body")
    void testCreateValidationError() throws Exception {
        String invalidJson = """
                {
                  }
                """;

        mockMvc.perform(post(BASE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }
}
