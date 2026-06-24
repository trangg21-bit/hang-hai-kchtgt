package com.hanghai.kchtg.gis.point;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.point.controller.PointObjectController;
import com.hanghai.kchtg.gis.point.dto.CreatePointObjectRequest;
import com.hanghai.kchtg.gis.point.dto.PointObjectResponse;
import com.hanghai.kchtg.gis.point.dto.UpdatePointObjectRequest;
import com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
import com.hanghai.kchtg.gis.point.service.PointObjectService;
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
class PointObjectControllerTest {

    @Mock
    private PointObjectService service;

    @InjectMocks
    private PointObjectController controller;

    private PointObjectResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = PointObjectResponse.builder()
                .id(UUID.randomUUID())
                .name("Cai Mep Port")
                .code("PORT-CM")
                .objectType(ObjectType.PORT)
                .categoryId(1L)
                .iconId(1L)
                .longitude(107.05)
                .latitude(10.55)
                .description("Cai Mep port")
                .status(Status.DRAFT)
                .unitId(1L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ==================== READ ENDPOINTS ====================

    @Nested
    @DisplayName("GET Endpoints")
    class GetEndpoints {

        @Test
        @DisplayName("GET /api/point-objects returns 200 with list")
        void findAll_returns200() {
            // Arrange
            when(service.findAll()).thenReturn(List.of(sampleResponse));

            // Act
            ResponseEntity<ApiResponse<List<PointObjectResponse>>> response = controller.findAll();

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals(1, response.getBody().getData().size());
            verify(service).findAll();
        }

        @Test
        @DisplayName("GET /api/point-objects/{id} returns 200")
        void findById_returns200() {
            // Arrange
            when(service.findById(any(UUID.class))).thenReturn(sampleResponse);

            // Act
            ResponseEntity<ApiResponse<PointObjectResponse>> response = controller.findById(UUID.randomUUID());

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
        }

        @Test
        @DisplayName("GET /api/point-objects/type/{objectType} returns 200")
        void findByObjectType_returns200() {
            // Arrange
            when(service.findByObjectType(ObjectType.LIGHTHOUSE)).thenReturn(List.of(sampleResponse));

            // Act
            ResponseEntity<ApiResponse<List<PointObjectResponse>>> response = controller.findByObjectType(ObjectType.LIGHTHOUSE);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getData().size());
        }

        @Test
        @DisplayName("GET /api/point-objects/status/{status} returns 200")
        void findByStatus_returns200() {
            // Arrange
            when(service.findByStatus(Status.PUBLISHED)).thenReturn(List.of(sampleResponse));

            // Act
            ResponseEntity<ApiResponse<List<PointObjectResponse>>> response = controller.findByStatus(Status.PUBLISHED);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getData().size());
        }

        @Test
        @DisplayName("GET /api/point-objects/search returns 200 with params")
        void search_returns200() {
            // Arrange
            when(service.search("port", "PORT", ObjectType.PORT, Status.DRAFT))
                    .thenReturn(List.of(sampleResponse));

            // Act
            ResponseEntity<ApiResponse<List<PointObjectResponse>>> response =
                    controller.search("port", "PORT", ObjectType.PORT, Status.DRAFT);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/point-objects/search returns 200 with null params")
        void search_withNullParams_returns200() {
            // Arrange
            when(service.search(null, null, null, null))
                    .thenReturn(Collections.emptyList());

            // Act
            ResponseEntity<ApiResponse<List<PointObjectResponse>>> response =
                    controller.search(null, null, null, null);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }
    }

    // ==================== CREATE ENDPOINT ====================

    @Nested
    @DisplayName("POST /api/point-objects")
    class CreateEndpoint {

        @Test
        @DisplayName("POST creates point object with 201 status")
        void create_returns201() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("New Port")
                    .code("PORT-NEW")
                    .objectType(ObjectType.PORT)
                    .longitude(107.0)
                    .latitude(10.5)
                    .status(Status.DRAFT)
                    .build();

            when(service.create(any(CreatePointObjectRequest.class))).thenReturn(sampleResponse);

            // Act
            ResponseEntity<ApiResponse<PointObjectResponse>> response = controller.create(request);

            // Assert
            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
            assertEquals("PointObject created successfully", response.getBody().getMessage());
            verify(service).create(any(CreatePointObjectRequest.class));
        }
    }

    // ==================== UPDATE ENDPOINT ====================

    @Nested
    @DisplayName("PUT /api/point-objects/{id}")
    class UpdateEndpoint {

        @Test
        @DisplayName("PUT updates point object with 200 status")
        void update_returns200() {
            // Arrange
            UpdatePointObjectRequest request = UpdatePointObjectRequest.builder()
                    .name("Updated Port")
                    .build();

            when(service.update(any(UUID.class), any(UpdatePointObjectRequest.class))).thenReturn(sampleResponse);

            // Act
            ResponseEntity<ApiResponse<PointObjectResponse>> response = controller.update(UUID.randomUUID(), request);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
        }
    }

    // ==================== DELETE ENDPOINT ====================

    @Nested
    @DisplayName("DELETE /api/point-objects/{id}")
    class DeleteEndpoint {

        @Test
        @DisplayName("DELETE removes point object with 200 status")
        void delete_returns200() {
            // Arrange
            doNothing().when(service).delete(any(UUID.class));

            // Act
            ResponseEntity<ApiResponse<Void>> response = controller.delete(UUID.randomUUID());

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals("PointObject deleted successfully", response.getBody().getMessage());
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
            // Arrange
            doNothing().when(service).submitForApproval(any(UUID.class));

            // Act
            ResponseEntity<ApiResponse<Void>> response = controller.submitForApproval(UUID.randomUUID());

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals("PointObject submitted for approval", response.getBody().getMessage());
            verify(service).submitForApproval(any(UUID.class));
        }

        @Test
        @DisplayName("POST /approve-l1 returns 200 with response")
        void approveL1_returns200() {
            // Arrange
            when(service.approveL1(any(UUID.class), anyString())).thenReturn(sampleResponse);

            // Act
            ResponseEntity<ApiResponse<PointObjectResponse>> response =
                    controller.approveL1(UUID.randomUUID(), "100");

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
            assertEquals("PointObject approved at Level 1", response.getBody().getMessage());
            verify(service).approveL1(any(UUID.class), eq("100"));
        }

        @Test
        @DisplayName("POST /approve-l2 returns 200 with response")
        void approveL2_returns200() {
            // Arrange
            when(service.approveL2(any(UUID.class), anyString())).thenReturn(sampleResponse);

            // Act
            ResponseEntity<ApiResponse<PointObjectResponse>> response =
                    controller.approveL2(UUID.randomUUID(), "200");

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
            assertEquals("PointObject approved at Level 2", response.getBody().getMessage());
            verify(service).approveL2(any(UUID.class), eq("200"));
        }
    }

    // ==================== ERROR HANDLING ====================

    @Nested
    @DisplayName("Error Handling")
    class ErrorHandling {

        @Test
        @DisplayName("findById propagates error when service throws")
        void findById_serviceThrows_propagates() {
            // Arrange
            when(service.findById(any(UUID.class))).thenThrow(new RuntimeException("Not found"));

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> controller.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("create propagates error when service throws")
        void create_serviceThrows_propagates() {
            // Arrange
            CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                    .name("Dup")
                    .code("DUP")
                    .objectType(ObjectType.PORT)
                    .longitude(107.0)
                    .latitude(10.5)
                    .build();

            when(service.create(any(CreatePointObjectRequest.class)))
                    .thenThrow(new IllegalArgumentException("Duplicate"));

            // Act & Assert
            assertThrows(IllegalArgumentException.class,
                    () -> controller.create(request));
        }
    }
}