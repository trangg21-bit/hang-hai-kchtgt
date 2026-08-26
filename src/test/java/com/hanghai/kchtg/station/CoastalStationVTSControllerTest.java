package com.hanghai.kchtg.station;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.service.AsyncLogAppender;
import com.hanghai.kchtg.admin.repository.AdminAuditLogRepository;
import com.hanghai.kchtg.security.JwtUtil;
import com.hanghai.kchtg.security.service.JwtSessionService;
import com.hanghai.kchtg.security.service.TokenService;
import com.hanghai.kchtg.security.service.TokenValidationService;
import com.hanghai.kchtg.station.controller.CoastalStationVTSController;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSHistoryResponse;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSResponse;
import com.hanghai.kchtg.station.entity.CoastalStationVTS;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.service.CoastalStationVTSService;
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

@WebMvcTest(CoastalStationVTSController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "SYSTEM_ADMIN")
class CoastalStationVTSControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoastalStationVTSService service;

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

    private final String BASE = "/api/v1/stations/coastal";

    private CoastalStationVTS makeEntity(UUID id) {
        CoastalStationVTS entity = new CoastalStationVTS();
        entity.setId(id);
        entity.setCode("VTS-001");
        entity.setName("VTS Station");
        entity.setFrequencyBand("VHF");
        entity.setTransmitPower(25.0);
        entity.setEquipmentType("Transceiver");
        entity.setLocationAddress("123 Main St");
        entity.setContactPerson("John Doe");
        entity.setContactPhone("+84123456789");
        entity.setIsActive(true);
        entity.setStatus(StationStatus.DRAFT);
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0);
        return entity;
    }

    private CoastalStationVTSResponse makeResponse(UUID id) {
        return CoastalStationVTSResponse.builder()
                .id(id)
                .stationCode("VTS-001")
                .stationName("VTS Station")
                .frequencyBand("VHF")
                .transmitPower(25.0)
                .equipmentType("Transceiver")
                .locationAddress("123 Main St")
                .contactPerson("John Doe")
                .contactPhone("+84123456789")
                .status(StationStatus.DRAFT)
                .approvalStatus(ApprovalStatus.DRAFT)
                .approvalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_0)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/stations/coastal — creates station and returns 200")
    void testCreate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationVTS entity = makeEntity(id);
        when(service.createStation(any())).thenReturn(entity);

        String json = """
                {
                  "stationCode": "VTS-001",
                  "stationName": "VTS Station",
                  "latitude": 10.0,
                  "longitude": 106.0,
                  "frequencyBand": "VHF",
                  "transmitPower": 25.0,
                  "equipmentType": "Transceiver",
                  "locationAddress": "123 Main St",
                  "contactPerson": "John Doe",
                  "contactPhone": "+84123456789"
                }
                """;

        mockMvc.perform(post(BASE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("VTS-001"))
                .andExpect(jsonPath("$.name").value("VTS Station"));

        verify(service).createStation(any());
    }

    @Test
    @DisplayName("PUT /api/v1/stations/coastal/{id} — updates station and returns 200")
    void testUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationVTS entity = makeEntity(id);
        entity.setName("Updated VTS");
        when(service.updateStation(eq(id), any())).thenReturn(entity);

        String json = """
                {
                  "stationCode": "VTS-001",
                  "stationName": "Updated VTS",
                  "latitude": 10.0,
                  "longitude": 106.0,
                  "frequencyBand": "VHF",
                  "transmitPower": 25.0,
                  "equipmentType": "Transceiver",
                  "locationAddress": "123 Main St",
                  "contactPerson": "John Doe",
                  "contactPhone": "+84123456789"
                }
                """;

        mockMvc.perform(put(BASE + "/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated VTS"));

        verify(service).updateStation(eq(id), any());
    }

    @Test
    @DisplayName("DELETE /api/v1/stations/coastal/{id} — soft-deletes and returns 204")
    void testDelete() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete(BASE + "/{id}", id))
                .andExpect(status().isNoContent());

        verify(service).deleteStation(id);
    }

    @Test
    @DisplayName("GET /api/v1/stations/coastal/{id} — returns 200 with response DTO")
    void testGetById() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationVTSResponse resp = makeResponse(id);
        when(service.getStationById(id)).thenReturn(makeEntity(id));
        when(service.buildResponse(any())).thenReturn(resp);

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stationCode").value("VTS-001"))
                .andExpect(jsonPath("$.stationName").value("VTS Station"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/coastal/{id} — returns 404 when not found")
    void testGetByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.getStationById(id)).thenThrow(new EntityNotFoundException("Not found"));

        mockMvc.perform(get(BASE + "/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/stations/coastal — returns 200 with list")
    void testGetAll() throws Exception {
        CoastalStationVTS entity = makeEntity(UUID.randomUUID());
        when(service.getAllStations()).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("VTS-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/coastal/search — returns 200 with results")
    void testSearch() throws Exception {
        CoastalStationVTS entity = makeEntity(UUID.randomUUID());
        when(service.searchStations("VTS")).thenReturn(List.of(entity));

        mockMvc.perform(get(BASE + "/search")
                        .param("keyword", "VTS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("VTS-001"));

        verify(service).searchStations("VTS");
    }

    @Test
    @DisplayName("POST /api/v1/stations/coastal/{id}/submit — gửi phê duyệt và trả về 200")
    void testSubmit() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationVTS entity = makeEntity(id);
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        when(service.submit(id)).thenReturn(entity);

        mockMvc.perform(post(BASE + "/{id}/submit", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalStatus").value("PENDING_APPROVAL"));

        verify(service).submit(id);
    }

    @Test
    @DisplayName("POST /api/v1/stations/coastal/{id}/approve-l1 — duyệt vòng 1 -> Chờ Cục duyệt")
    void testApproveLevel1() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationVTS entity = makeEntity(id);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1);
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setStatus(StationStatus.APPROVED_L1);
        when(service.approveLevel1(id)).thenReturn(entity);

        mockMvc.perform(post(BASE + "/{id}/approve-l1", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalLevel").value(1))
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED_LEVEL1"));
    }

    @Test
    @DisplayName("POST /api/v1/stations/coastal/{id}/approve-l2 — duyệt vòng 2 -> Đã duyệt")
    void testApproveLevel2() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationVTS entity = makeEntity(id);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_2);
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setStatus(StationStatus.APPROVED_L2);
        when(service.approveLevel2(id)).thenReturn(entity);

        mockMvc.perform(post(BASE + "/{id}/approve-l2", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalLevel").value(2))
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED"));
    }

    @Test
    @DisplayName("POST /api/v1/stations/coastal/{id}/approve — endpoint cũ vẫn chạy (tự chọn vòng)")
    void testApproveLegacy() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationVTS entity = makeEntity(id);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1);
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setStatus(StationStatus.APPROVED_L1);
        when(service.approveStation(id, true)).thenReturn(entity);

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
    @DisplayName("POST /api/v1/stations/coastal/{id}/reject — rejects and returns 200")
    void testReject() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationVTS entity = makeEntity(id);
        entity.setRejectionReason("Dữ liệu chưa hợp lệ");
        entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
        entity.setStatus(StationStatus.REJECTED);
        when(service.reject(eq(id), anyString())).thenReturn(entity);

        String json = """
                {
                  "approved": false,
                  "rejectionReason": "Dữ liệu chưa hợp lệ"
                }
                """;

        mockMvc.perform(post(BASE + "/{id}/reject", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rejectionReason").value("Dữ liệu chưa hợp lệ"))
                .andExpect(jsonPath("$.approvalStatus").value("REJECTED_LEVEL1"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/coastal/{id}/history — returns 200 with list")
    void testGetHistory() throws Exception {
        UUID id = UUID.randomUUID();
        CoastalStationVTSHistoryResponse history = new CoastalStationVTSHistoryResponse();
        history.setId(UUID.randomUUID());
        history.setStationCode("VTS-001");
        when(service.getHistory(id)).thenReturn(List.of(history));

        mockMvc.perform(get(BASE + "/{id}/history", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stationCode").value("VTS-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/coastal/by-code/{code} — returns 200 when found")
    void testFindByCode() throws Exception {
        CoastalStationVTS entity = makeEntity(UUID.randomUUID());
        when(service.findByCode("VTS-001")).thenReturn(Optional.of(entity));

        mockMvc.perform(get(BASE + "/by-code/{code}", "VTS-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("VTS-001"));
    }

    @Test
    @DisplayName("GET /api/v1/stations/coastal/by-code/{code} — returns 404 when not found")
    void testFindByCodeNotFound() throws Exception {
        when(service.findByCode("UNKNOWN")).thenReturn(Optional.empty());

        mockMvc.perform(get(BASE + "/by-code/{code}", "UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/stations/coastal — returns 400 for invalid body")
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

