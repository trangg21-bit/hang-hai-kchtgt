package com.hanghai.kchtg.beacon;

import com.hanghai.kchtg.beacon.controller.BeaconLightController;
import com.hanghai.kchtg.beacon.dto.beacon_light.BeaconLightResponse;
import com.hanghai.kchtg.beacon.dto.beacon_light.CreateBeaconLightRequest;
import com.hanghai.kchtg.beacon.dto.beacon_light.UpdateBeaconLightRequest;
import com.hanghai.kchtg.beacon.entity.BeaconLightType;
import com.hanghai.kchtg.beacon.entity.BeaconStatus;
import com.hanghai.kchtg.beacon.service.BeaconLightService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BeaconLightControllerTest {

    @Mock
    private BeaconLightService service;

    @InjectMocks
    private BeaconLightController controller;

    private BeaconLightResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = BeaconLightResponse.builder()
                .id(UUID.randomUUID())
                .code("DB-HAUI-001")
                .name("Cai Mep Lighthouse")
                .type(BeaconLightType.LIGHTHOUSE)
                .latitude(10.55)
                .longitude(107.05)
                .lightRange(15.0)
                .lightColor("RED")
                .range(20.0)
                .description("Cai Mep main lighthouse")
                .unitId(1L)
                .isActive(true)
                .status(BeaconStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ==================== GET ENDPOINTS ====================

    @Nested
    @DisplayName("GET Endpoints")
    class GetEndpoints {

        @Test
        @DisplayName("GET /api/beacon-lights returns 200 with list")
        void findAll_returns200() {
            when(service.findAll()).thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<BeaconLightResponse>>> response = controller.findAll();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals(1, response.getBody().getData().size());
            verify(service).findAll();
        }

        @Test
        @DisplayName("GET /api/beacon-lights/{id} returns 200")
        void findById_returns200() {
            when(service.findById(any(UUID.class))).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<BeaconLightResponse>> response = controller.findById(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
        }

        @Test
        @DisplayName("GET /api/beacon-lights/search returns 200 with params")
        void search_returns200() {
            when(service.search("Cai", "DB", BeaconLightType.LIGHTHOUSE, BeaconStatus.DRAFT))
                    .thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<BeaconLightResponse>>> response =
                    controller.search("Cai", "DB", BeaconLightType.LIGHTHOUSE, BeaconStatus.DRAFT);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/beacon-lights/search returns 200 with null params")
        void search_withNullParams_returns200() {
            when(service.search(null, null, null, null)).thenReturn(Collections.emptyList());

            ResponseEntity<ApiResponse<List<BeaconLightResponse>>> response =
                    controller.search(null, null, null, null);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }
    }

    // ==================== CREATE ENDPOINT ====================

    @Nested
    @DisplayName("POST /api/beacon-lights")
    class CreateEndpoint {

        @Test
        @DisplayName("POST creates beacon light with 201 status")
        void create_returns201() {
            CreateBeaconLightRequest request = CreateBeaconLightRequest.builder()
                    .name("New Lighthouse")
                    .code("DB-NEW")
                    .type(BeaconLightType.LIGHTHOUSE)
                    .latitude(10.0)
                    .longitude(107.0)
                    .lightRange(25.0)
                    .action("draft")
                    .build();

            when(service.create(any(CreateBeaconLightRequest.class))).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<BeaconLightResponse>> response = controller.create(request);

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals("Tạo đèn biển thành công", response.getBody().getMessage());
            verify(service).create(any(CreateBeaconLightRequest.class));
        }
    }

    // ==================== UPDATE ENDPOINT ====================

    @Nested
    @DisplayName("PUT /api/beacon-lights/{id}")
    class UpdateEndpoint {

        @Test
        @DisplayName("PUT updates beacon light with 200 status")
        void update_returns200() {
            UpdateBeaconLightRequest request = UpdateBeaconLightRequest.builder()
                    .name("Updated Lighthouse")
                    .build();

            when(service.update(any(UUID.class), any(UpdateBeaconLightRequest.class))).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<BeaconLightResponse>> response = controller.update(UUID.randomUUID(), request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            verify(service).update(any(UUID.class), any(UpdateBeaconLightRequest.class));
        }
    }

    // ==================== DELETE ENDPOINT ====================

    @Nested
    @DisplayName("DELETE /api/beacon-lights/{id}")
    class DeleteEndpoint {

        @Test
        @DisplayName("DELETE removes beacon light with 200 status")
        void delete_returns200() {
            doNothing().when(service).delete(any(UUID.class));

            ResponseEntity<ApiResponse<Void>> response = controller.delete(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals("Đã xóa đèn biển thành công", response.getBody().getMessage());
            verify(service).delete(any(UUID.class));
        }
    }

    // ==================== APPROVAL ENDPOINTS ====================

    @Nested
    @DisplayName("Approval Endpoints")
    class ApprovalEndpoints {

        @Test
        @DisplayName("POST /submit-approval returns 200")
        void submitForApproval_returns200() {
            doNothing().when(service).submitForApproval(any(UUID.class));

            ResponseEntity<ApiResponse<Void>> response = controller.submitForApproval(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            verify(service).submitForApproval(any(UUID.class));
        }

        @Test
        @DisplayName("POST /approve-l1 returns 200 with response")
        void approveL1_returns200() {
            when(service.approveL1(any(UUID.class), anyString())).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<BeaconLightResponse>> response =
                    controller.approveL1(UUID.randomUUID(), "100");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
            verify(service).approveL1(any(UUID.class), eq("100"));
        }

        @Test
        @DisplayName("POST /approve-l2 returns 200 with response")
        void approveL2_returns200() {
            when(service.approveL2(any(UUID.class), anyString())).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<BeaconLightResponse>> response =
                    controller.approveL2(UUID.randomUUID(), "200");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
            verify(service).approveL2(any(UUID.class), eq("200"));
        }

        @Test
        @DisplayName("POST /reject returns 200 with response")
        void reject_returns200() {
            when(service.reject(any(UUID.class), anyString(), anyString())).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<BeaconLightResponse>> response =
                    controller.reject(UUID.randomUUID(), "Không đạt yêu cầu kỹ thuật", "100");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            verify(service).reject(any(UUID.class), eq("Không đạt yêu cầu kỹ thuật"), eq("100"));
        }
    }

    // ==================== ERROR HANDLING ====================

    @Nested
    @DisplayName("Error Handling")
    class ErrorHandling {

        @Test
        @DisplayName("findById propagates error when service throws")
        void findById_serviceThrows_propagates() {
            when(service.findById(any(UUID.class))).thenThrow(new RuntimeException("Not found"));
            assertThrows(RuntimeException.class, () -> controller.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("create propagates error when service throws")
        void create_serviceThrows_propagates() {
            CreateBeaconLightRequest request = CreateBeaconLightRequest.builder()
                    .name("Dup")
                    .code("DUP")
                    .type(BeaconLightType.LIGHTHOUSE)
                    .latitude(10.0)
                    .longitude(107.0)
                    .lightRange(10.0)
                    .build();

            when(service.create(any(CreateBeaconLightRequest.class)))
                    .thenThrow(new IllegalArgumentException("Duplicate"));

            assertThrows(IllegalArgumentException.class, () -> controller.create(request));
        }
    }
}
