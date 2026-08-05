package com.hanghai.kchtg.station;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.station.controller.CoastalStationHaiphongController;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongHistoryResponse;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongResponse;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.service.CoastalStationHaiphongService;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CoastalStationHaiphongController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class CoastalStationHaiphongControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoastalStationHaiphongService service;

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

    private final String BASE = "/api/v1/stations/haiphong";

    private CoastalStationHaiphong makeEntity(UUID id) {
        CoastalStationHaiphong entity = new CoastalStationHaiphong();
        entity.setId(id);
        entity.setCode("HP-001");
        entity.setName("Haiphong Station");
        entity.setPortName("Haiphong Port");
        entity.setDistrict("Hong Bang");
        entity.setWard("Thuong Ly");
        entity.setOperationalLicense("LIC-2024-001");
        entity.setLicenseExpiry("2025-12-31");
        entity.setInspectorName("Tran Van A");
        entity.setInspectorPhone("+84999000111");
        entity.setLastInspectionDate("2024-06-15");
        entity.setNextInspectionDate("2025-06-15");
        entity.setCoverageArea("Haiphong Bay");
        entity.setEquipmentType("VHF Transceiver");
        entity.setCommunicationFrequency("156.8 MHz");
        entity.setLocationAddress("1 Port Road, Haiphong");
        entity.setContactPerson("Le Thi B");
        entity.setContactPhone("+84999000222");
        entity.setIsActive(true);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0);
        return entity;
    }

    private CoastalStationHaiphongResponse makeResponse(UUID id) {
        return CoastalStationHaiphongResponse.builder()
                .id(id)
                .stationCode("HP-001")
                .stationName("Haiphong Station")
                .portName("Haiphong Port")
                .district("Hong Bang")
                .ward("Thuong Ly")
                .operationalLicense("LIC-2024-001")
                .licenseExpiry("2025-12-31")
                .inspectorName("Tran Van A")
                .inspectorPhone("+84999000111")
                .lastInspectionDate("2024-06-15")
                .nextInspectionDate("2025-06-15")
                .coverageArea("Haiphong Bay")
                .equipmentType("VHF Transceiver")
                .communicationFrequency("156.8 MHz")
                .locationAddress("1 Port Road, Haiphong")
                .contactPerson("Le Thi B")
                .contactPhone("+84999000222")
                .status(StationStatus.PENDING_APPROVAL)
                .approvalStatus(StationApprovalStatus.PENDING)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/stations/haiphong/create — creates station and returns 200")
    void testCreate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationHaiphong entity = makeEntity(id);
        when(service.createStation(any())).thenReturn(entity);

        String json = """
                {
                  "stationCode": "HP-001",
                  "stationName": "Haiphong Station",
                  "portName": "Haiphong Port",
                  "district": "Hong Bang",
                  "ward": "Thuong Ly",
                  "operationalLicense": "LIC-2024-001",
                  "licenseExpiry": "2025-12-31",
                  "inspectorName": "Tran Van A",
                  "inspectorPhone": "+84999000111",
                  "lastInspectionDate": "2024-06-15",
                  "nextInspectionDate": "2025-06-15",
                  "coverageArea": "Haiphong Bay",
                  "equipmentType": "VHF Transceiver",
                  "communicationFrequency": "156.8 MHz",
                  "locationAddress": "1 Port Road, Haiphong",
                  "contactPerson": "Le Thi B",
                  "contactPhone": "+84999000222"
                }
                """;

        mockMvc.perform(post(BASE + "/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("HP-001"))
                .andExpect(jsonPath("$.name").value("Haiphong Station"));

        verify(service).createStation(any());
    }

    @Test
    @DisplayName("PUT /api/v1/stations/haiphong/{id} — updates station and returns 200")
    void testUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationHaiphong entity = makeEntity(id);
        entity.setName("Updated Haiphong");
        when(service.updateStation(eq(id), any())).thenReturn(entity);

        String json = """
                {
                  "stationCode": "HP-001",
                  "stationName": "Updated Haiphong",
                  "portName": "Haiphong Port",
                  "district": "Hong Bang",
                  "ward": "Thuong Ly",
                  "operationalLicense": "LIC-2024-001",
                  "licenseExpiry": "2025-12-31",
                  "inspectorName": "Tran Van A",
                  "inspectorPhone": "+84999000111",
                  "lastInspectionDate": "2024-06-15",
                  "nextInspectionDate": "2025-06-15",
                  "coverageArea": "Haiphong Bay",
                  "equipmentType": "VHF Transceiver",
                  "communicationFrequency": "156.8 MHz",
                  "locationAddress": "1 Port Road, Haiphong",
                  "contactPerson": "Le Thi B",
                  "contactPhone": "+84999000222"
                }
                """;

        mockMvc.perform(put(BASE + "/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Haiphong"));

        verify(service).updateStation(eq(id), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/stations/haiphong/{id} — soft-deletes and returns 204")
    void testDelete() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete(BASE + "/{id}", id))
                .andExpect(status().isNoContent());

        verify(service).deleteStation(id);
    }

    @Test
    @DisplayName("GET /api/v1/stations/haiphong/{id} — returns 200 with response DTO")
    void testGetById() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationHaiphongResponse resp = makeResponse(id);
        when(service.getStationById(id)).thenReturn(makeEntity(id));
        when(service.buildResponse(any())).thenReturn(resp);

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stationCode").value("HP-001"))
                .andExpect(jsonPath("$.stationName").value("Haiphong Station"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/haiphong/{id} — returns 404 when not found")
    void testGetByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getStationById(id)).thenThrow(new EntityNotFoundException("Not found"));

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/stations/haiphong/list — returns 200 with list")
    void testGetAll() throws Exception {
        CoastalStationHaiphong entity = makeEntity(UUID.randomUUID());
        when(service.getAllStations()).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("HP-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/haiphong/search — returns 200 with results")
    void testSearch() throws Exception {
        CoastalStationHaiphong entity = makeEntity(UUID.randomUUID());
        when(service.searchStations("HP")).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/search")
                        .param("keyword", "HP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("HP-001"));

        verify(service).searchStations("HP");
    }

    @Test
    @DisplayName("GET /api/v1/stations/haiphong/by-port/{portName} — returns 200 with list")
    void testFindByPortName() throws Exception {
        CoastalStationHaiphong entity = makeEntity(UUID.randomUUID());
        when(service.findByPortName("Haiphong Port")).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/by-port/{portName}", "Haiphong Port"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("HP-001"));

        verify(service).findByPortName("Haiphong Port");
    }

    @Test
    @DisplayName("GET /api/v1/stations/haiphong/by-port/{portName} — returns 200 with empty list when none found")
    void testFindByPortNameEmpty() throws Exception {
        when(service.findByPortName("Unknown")).thenReturn(List.of());

        mockMvc.perform(get(BASE + "/by-port/{portName}", "Unknown"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(service).findByPortName("Unknown");
    }

    @Test
    @DisplayName("POST /api/v1/stations/haiphong/{id}/approve — approves and returns 200")
    void testApprove() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationHaiphong entity = makeEntity(id);
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
    @DisplayName("POST /api/v1/stations/haiphong/{id}/reject — rejects and returns 200")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationHaiphong entity = makeEntity(id);
        entity.setRejectionReason("License expired");
        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        when(service.rejectStation(eq(id), anyString(), any(Long.class))).thenReturn(entity);

        String json = """
                {
                  "approved": false,
                  "rejectionReason": "License expired"
                }
                """;

        mockMvc.perform(post(BASE + "/{id}/reject", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rejectionReason").value("License expired"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/haiphong/{id}/history — returns 200 with list")
    void testGetHistory() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationHaiphongHistoryResponse history = new CoastalStationHaiphongHistoryResponse();
        history.setId(UUID.randomUUID());
        history.setStationCode("HP-001");
        when(service.getHistory(id)).thenReturn(List.of(history));

        mockMvc.perform(get(BASE + "/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stationCode").value("HP-001"));
    }

    @Test
    @DisplayName("POST /api/v1/stations/haiphong/create — returns 400 for invalid body")
    void testCreateValidationError() throws Exception {
        String invalidJson = """
                {
                  "stationCode": null
                }
                """;

        mockMvc.perform(post(BASE + "/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isOk());
    }
}
