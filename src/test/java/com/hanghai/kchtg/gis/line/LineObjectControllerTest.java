package com.hanghai.kchtg.gis.line;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.line.controller.LineObjectController;
import com.hanghai.kchtg.gis.line.dto.CreateLineObjectRequest;
import com.hanghai.kchtg.gis.line.dto.LineObjectResponse;
import com.hanghai.kchtg.gis.line.dto.UpdateLineObjectRequest;
import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
import com.hanghai.kchtg.gis.line.service.LineObjectService;
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
class LineObjectControllerTest {

    @Mock
    private LineObjectService service;

    @InjectMocks
    private LineObjectController controller;

    private LineObjectResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = LineObjectResponse.builder()
                .id(UUID.randomUUID())
                .name("Coastal Route A")
                .code("LINE-001")
                .objectType(ObjectType.COASTLINE)
                .categoryId(1L)
                .lineSymbolId(1L)
                .coordinates("LINESTRING (106.6 10.7, 106.7 10.8)")
                .description("Coastal route")
                .status(Status.DRAFT)
                .unitId(1L)
                .length(15000.0)
                .material("Concrete")
                .yearBuilt(2020)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("GET Endpoints")
    class GetEndpoints {

        @Test
        @DisplayName("GET /api/line-objects returns 200")
        void findAll_returns200() {
            when(service.findAll()).thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<LineObjectResponse>>> response = controller.findAll();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals(1, response.getBody().getData().size());
        }

        @Test
        @DisplayName("GET /api/line-objects/{id} returns 200")
        void findById_returns200() {
            when(service.findById(any(UUID.class))).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<LineObjectResponse>> response = controller.findById(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/line-objects/type/{objectType} returns 200")
        void findByObjectType_returns200() {
            when(service.findByObjectType(ObjectType.COASTLINE)).thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<LineObjectResponse>>> response =
                    controller.findByObjectType(ObjectType.COASTLINE);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/line-objects/status/{status} returns 200")
        void findByStatus_returns200() {
            when(service.findByStatus(Status.PUBLISHED)).thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<LineObjectResponse>>> response =
                    controller.findByStatus(Status.PUBLISHED);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/line-objects/search returns 200")
        void search_returns200() {
            when(service.search("Route", "LINE", ObjectType.COASTLINE, Status.DRAFT))
                    .thenReturn(List.of(sampleResponse));

            ResponseEntity<ApiResponse<List<LineObjectResponse>>> response =
                    controller.search("Route", "LINE", ObjectType.COASTLINE, Status.DRAFT);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }
    }

    @Nested
    @DisplayName("POST /api/line-objects")
    class CreateEndpoint {

        @Test
        @DisplayName("POST creates line object with 201")
        void create_returns201() {
            CreateLineObjectRequest request = CreateLineObjectRequest.builder()
                    .name("New Route")
                    .code("LINE-NEW")
                    .objectType(ObjectType.COASTLINE)
                    .coordinates("LINESTRING (0 0, 1 1)")
                    .status(Status.DRAFT)
                    .build();

            when(service.create(any(CreateLineObjectRequest.class))).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<LineObjectResponse>> response = controller.create(request);

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            verify(service).create(any(CreateLineObjectRequest.class));
        }
    }

    @Nested
    @DisplayName("PUT /api/line-objects/{id}")
    class UpdateEndpoint {

        @Test
        @DisplayName("PUT updates line object with 200")
        void update_returns200() {
            UpdateLineObjectRequest request = UpdateLineObjectRequest.builder()
                    .name("Updated Route")
                    .build();

            when(service.update(any(UUID.class), any(UpdateLineObjectRequest.class)))
                    .thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<LineObjectResponse>> response =
                    controller.update(UUID.randomUUID(), request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
        }
    }

    @Nested
    @DisplayName("DELETE /api/line-objects/{id}")
    class DeleteEndpoint {

        @Test
        @DisplayName("DELETE removes line object with 200")
        void delete_returns200() {
            doNothing().when(service).delete(any(UUID.class));

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
            doNothing().when(service).submitForApproval(any(UUID.class));

            ResponseEntity<ApiResponse<Void>> response =
                    controller.submitForApproval(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            verify(service).submitForApproval(any(UUID.class));
        }

        @Test
        @DisplayName("POST /approve-l1 returns 200")
        void approveL1_returns200() {
            when(service.approveL1(any(UUID.class), anyString())).thenReturn(sampleResponse);

            ResponseEntity<ApiResponse<LineObjectResponse>> response =
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

            ResponseEntity<ApiResponse<LineObjectResponse>> response =
                    controller.approveL2(UUID.randomUUID(), "200");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertNotNull(response.getBody().getData());
            verify(service).approveL2(any(UUID.class), eq("200"));
        }
    }
}

