package com.hanghai.kchtg.gis.polygon;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.polygon.controller.PolygonObjectController;
import com.hanghai.kchtg.gis.polygon.dto.CreatePolygonObjectRequest;
import com.hanghai.kchtg.gis.polygon.dto.PolygonObjectResponse;
import com.hanghai.kchtg.gis.polygon.dto.UpdatePolygonObjectRequest;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ObjectType;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status;
import com.hanghai.kchtg.gis.polygon.service.PolygonObjectService;
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
class PolygonObjectControllerTest {

    @Mock
    private PolygonObjectService service;

    @InjectMocks
    private PolygonObjectController controller;

    private PolygonObjectResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = PolygonObjectResponse.builder()
                .id(UUID.randomUUID())
                .name("Port Zone A")
                .code("POLY-001")
                .objectType(ObjectType.WATER_ZONE)
                .categoryId(1L)
                .fillSymbolId(1L)
                .coordinates("POLYGON ((106.6 10.7, 106.7 10.7, 106.7 10.8, 106.6 10.8, 106.6 10.7))")
                .description("Port zone")
                .status(Status.DRAFT)
                .unitId(1L)
                .area(50000.0)
                .purpose("Port ops")
                .restrictionLevel("Medium")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("GET Endpoints")
    class GetEndpoints {

        @Test
        @DisplayName("GET /api/polygon-objects returns 200")
        void findAll_returns200() {
            when(service.findAll()).thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<PolygonObjectResponse>>> response = controller.findAll();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getData().size());
        }

        @Test
        @DisplayName("GET /api/polygon-objects/{id} returns 200")
        void findById_returns200() {
            when(service.findById(any(UUID.class))).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<PolygonObjectResponse>> response =
                    controller.findById(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/polygon-objects/type/{objectType} returns 200")
        void findByObjectType_returns200() {
            when(service.findByObjectType(ObjectType.WATER_ZONE)).thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<PolygonObjectResponse>>> response =
                    controller.findByObjectType(ObjectType.WATER_ZONE);

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }

        @Test
        @DisplayName("GET /api/polygon-objects/status/{status} returns 200")
        void findByStatus_returns200() {
            when(service.findByStatus(Status.PUBLISHED)).thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<PolygonObjectResponse>>> response =
                    controller.findByStatus(Status.PUBLISHED);

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }

        @Test
        @DisplayName("GET /api/polygon-objects/search returns 200")
        void search_returns200() {
            when(service.search("Zone", "POLY", ObjectType.WATER_ZONE, Status.DRAFT))
                    .thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<PolygonObjectResponse>>> response =
                    controller.search("Zone", "POLY", ObjectType.WATER_ZONE, Status.DRAFT);

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }
    }

    @Nested
    @DisplayName("POST /api/polygon-objects")
    class CreateEndpoint {

        @Test
        @DisplayName("POST creates polygon with 201")
        void create_returns201() {
            CreatePolygonObjectRequest request = CreatePolygonObjectRequest.builder()
                    .name("New Zone")
                    .code("POLY-NEW")
                    .objectType(ObjectType.WATER_ZONE)
                    .coordinates("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))")
                    .status(Status.DRAFT)
                    .build();

            when(service.create(any(CreatePolygonObjectRequest.class))).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<PolygonObjectResponse>> response = controller.create(request);

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals("PolygonObject created successfully", response.getBody().getMessage());
            verify(service).create(any(CreatePolygonObjectRequest.class));
        }
    }

    @Nested
    @DisplayName("PUT /api/polygon-objects/{id}")
    class UpdateEndpoint {

        @Test
        @DisplayName("PUT updates polygon with 200")
        void update_returns200() {
            UpdatePolygonObjectRequest request = UpdatePolygonObjectRequest.builder()
                    .name("Updated Zone")
                    .build();

            when(service.update(any(UUID.class), any(UpdatePolygonObjectRequest.class)))
                    .thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<PolygonObjectResponse>> response =
                    controller.update(UUID.randomUUID(), request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
        }
    }

    @Nested
    @DisplayName("DELETE /api/polygon-objects/{id}")
    class DeleteEndpoint {

        @Test
        @DisplayName("DELETE removes polygon with 200")
        void delete_returns200() {
            ResponseEntity<ApiResponse<Void>> response = controller.delete(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            verify(service).delete(any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Approval Endpoints")
    class ApprovalEndpoints {

        @Test
        @DisplayName("POST /submit-approval returns 200")
        void submitForApproval_returns200() {
            ResponseEntity<ApiResponse<Void>> response =
                    controller.submitForApproval(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(service).submitForApproval(any(UUID.class));
        }

        @Test
        @DisplayName("POST /approve-l1 returns 200")
        void approveL1_returns200() {
            when(service.approveL1(any(UUID.class), anyString())).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<PolygonObjectResponse>> response =
                    controller.approveL1(UUID.randomUUID(), "100");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertNotNull(response.getBody().getData());
            verify(service).approveL1(any(UUID.class), eq("100"));
        }

        @Test
        @DisplayName("POST /approve-l2 returns 200")
        void approveL2_returns200() {
            when(service.approveL2(any(UUID.class), anyString())).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<PolygonObjectResponse>> response =
                    controller.approveL2(UUID.randomUUID(), "200");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertNotNull(response.getBody().getData());
            verify(service).approveL2(any(UUID.class), eq("200"));
        }
    }
}