package com.hanghai.kchtg.station;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.station.controller.CoastalStationInmarsatController;
import com.hanghai.kchtg.station.dto.inmarsat.*;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
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
        entity.setStationName("Inmarsat Station");
        entity.setModemType("Capsat");
        entity.setFrequency("1.6GHz");
        entity.setCoverageZone("Pacific");
        entity.setSarCode("SAR-001");
        entity.setLocationAddress("123 Ocean Dr");
        entity.setContactPerson("Jane Doe");
        entity.setContactPhone("+84987654321");
        entity.setIsActive(true);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(ApprovalStatus.PROPOSED);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0);
        return entity;
    }

    private CoastalStationInmarsatResponse makeResponse(UUID id) {
        return CoastalStationInmarsatResponse.builder()
                .id(id)
                .code("INM-001")
                .deviceCode("INM-001")
                .name("Inmarsat Station")
                .stationName("Inmarsat Station")
                .modemType("Capsat")
                .frequency("1.6GHz")
                .coverageZone("Pacific")
                .sarCode("SAR-001")
                .locationAddress("123 Ocean Dr")
                .contactPerson("Jane Doe")
                .contactPhone("+84987654321")
                .status(StationStatus.PENDING_APPROVAL)
                .approvalStatus(ApprovalStatus.PROPOSED)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat — searches paged list")
    void testSearchPaged() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsatResponse resp = makeResponse(id);
        when(service.searchPaged(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(resp), PageRequest.of(0, 10), 1));

        mockMvc.perform(get(BASE)
                        .param("keyword", "Inmarsat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].code").value("INM-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat/counts — returns status counts")
    void testGetCounts() throws Exception {
        when(service.countByApprovalStatus(any(), any(), any()))
                .thenReturn(Map.of("ALL", 5L, "DRAFT", 2L, "APPROVED", 3L));

        mockMvc.perform(get(BASE + "/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ALL").value(5))
                .andExpect(jsonPath("$.DRAFT").value(2));
    }

    @Test
    @DisplayName("POST /api/v1/stations/inmarsat — creates station and returns 200")
    void testCreate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsat entity = makeEntity(id);
        CoastalStationInmarsatResponse resp = makeResponse(id);
        when(service.createStation(any())).thenReturn(entity);
        when(service.buildResponse(any())).thenReturn(resp);

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
        CoastalStationInmarsatResponse resp = makeResponse(id);
        resp.setName("Updated Inmarsat");
        resp.setStationName("Updated Inmarsat");

        when(service.updateStation(eq(id), any())).thenReturn(entity);
        when(service.buildResponse(any())).thenReturn(resp);

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
    @DisplayName("POST /api/v1/stations/inmarsat/{id}/submit — submits and returns 200")
    void testSubmit() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsat entity = makeEntity(id);
        CoastalStationInmarsatResponse resp = makeResponse(id);
        resp.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);

        when(service.submit(id)).thenReturn(entity);
        when(service.buildResponse(any())).thenReturn(resp);

        mockMvc.perform(post(BASE + "/{id}/submit", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalStatus").value("PENDING_APPROVAL"));
    }

    @Test
    @DisplayName("POST /api/v1/stations/inmarsat/{id}/approve-l1 — approves level 1 and returns 200")
    void testApproveLevel1() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsat entity = makeEntity(id);
        CoastalStationInmarsatResponse resp = makeResponse(id);
        resp.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);

        when(service.approveLevel1(id)).thenReturn(entity);
        when(service.buildResponse(any())).thenReturn(resp);

        mockMvc.perform(post(BASE + "/{id}/approve-l1", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED_LEVEL1"));
    }

    @Test
    @DisplayName("POST /api/v1/stations/inmarsat/{id}/approve-l2 — approves level 2 and returns 200")
    void testApproveLevel2() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsat entity = makeEntity(id);
        CoastalStationInmarsatResponse resp = makeResponse(id);
        resp.setApprovalStatus(ApprovalStatus.APPROVED);

        when(service.approveLevel2(id)).thenReturn(entity);
        when(service.buildResponse(any())).thenReturn(resp);

        mockMvc.perform(post(BASE + "/{id}/approve-l2", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED"));
    }

    @Test
    @DisplayName("POST /api/v1/stations/inmarsat/{id}/reject — rejects and returns 200")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationInmarsat entity = makeEntity(id);
        CoastalStationInmarsatResponse resp = makeResponse(id);
        resp.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
        resp.setRejectionReason("Hồ sơ không đầy đủ");

        when(service.reject(eq(id), any())).thenReturn(entity);
        when(service.buildResponse(any())).thenReturn(resp);

        String json = """
                {
                  "rejectionReason": "Hồ sơ không đầy đủ thông tin kỹ thuật"
                }
                """;

        mockMvc.perform(post(BASE + "/{id}/reject", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rejectionReason").value("Hồ sơ không đầy đủ"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/inmarsat/options — returns approved lookup options")
    void testGetOptions() throws Exception {
        CoastalStationInmarsatOptionResponse opt = CoastalStationInmarsatOptionResponse.builder()
                .id(UUID.randomUUID())
                .code("INM-001")
                .name("Inmarsat Station")
                .build();
        when(service.getOptions(any())).thenReturn(List.of(opt));

        mockMvc.perform(get(BASE + "/options"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("INM-001"));
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
}
